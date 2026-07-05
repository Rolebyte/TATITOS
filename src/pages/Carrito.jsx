import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { Minus, Plus, Trash2, ArrowLeft, ShoppingBag, Home, MapPin, Store, Tag, X, MessageCircle, Zap, AlertTriangle, Share2 } from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import useSEO from '../hooks/useSEO'
import useCarritoStore from '../store/carritoStore'
import { PROVINCIAS } from '../data/provincias'
import { supabase } from '../lib/supabase'

const COSTO_ENVIO_LOCAL = 3500
const WA_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '5493492710605'
const RECARGO_MP = 0.0642

// Horarios de Puni (hora local Rafaela = America/Argentina/Buenos_Aires)
const HORARIOS_PUNI = {
  0: [{ desde: 10*60, hasta: 15*60 }, { desde: 19*60, hasta: 23*60 }], // domingo
  1: [{ desde:  8*60, hasta: 14*60 }, { desde: 16*60+30, hasta: 23*60 }], // lunes
  2: [{ desde:  8*60, hasta: 14*60 }, { desde: 16*60+30, hasta: 23*60 }],
  3: [{ desde:  8*60, hasta: 14*60 }, { desde: 16*60+30, hasta: 23*60 }],
  4: [{ desde:  8*60, hasta: 14*60 }, { desde: 16*60+30, hasta: 23*60 }],
  5: [{ desde:  8*60, hasta: 14*60 }, { desde: 16*60+30, hasta: 23*60+30 }], // viernes
  6: [{ desde:  9*60, hasta: 14*60 }, { desde: 19*60, hasta: 23*60+30 }], // sábado
}

function estadoPuni() {
  const ahora = new Date()
  const dia = ahora.getDay()
  const minutos = ahora.getHours() * 60 + ahora.getMinutes()
  const turnos = HORARIOS_PUNI[dia]

  // ¿Está operando ahora?
  for (const t of turnos) {
    if (minutos >= t.desde && minutos < t.hasta) {
      const cierra = `${String(Math.floor(t.hasta / 60)).padStart(2,'0')}:${String(t.hasta % 60).padStart(2,'0')}`
      return { activo: true, mensaje: `🛵 Puni opera ahora — entrega hasta las ${cierra}hs` }
    }
  }

  // ¿Próximo turno hoy?
  const proximoHoy = turnos.find(t => t.desde > minutos)
  if (proximoHoy) {
    const abre = `${String(Math.floor(proximoHoy.desde / 60)).padStart(2,'0')}:${String(proximoHoy.desde % 60).padStart(2,'0')}`
    return { activo: false, mensaje: `🕐 Próximo turno hoy a las ${abre}hs` }
  }

  // Próximo turno mañana
  const diaSig = (dia + 1) % 7
  const diasNombre = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado']
  const primerTurno = HORARIOS_PUNI[diaSig][0]
  const abre = `${String(Math.floor(primerTurno.desde / 60)).padStart(2,'0')}:${String(primerTurno.desde % 60).padStart(2,'0')}`
  return { activo: false, mensaje: `🕐 Puni retoma el ${diasNombre[diaSig]} a las ${abre}hs` }
}

function validarTelefono(tel) {
  return /^[0-9]{10,12}$/.test(tel.replace(/[\s\-+]/g, ''))
}

function costoEnvio(form) {
  if (form.tipo_entrega === 'domicilio') return COSTO_ENVIO_LOCAL
  return 0
}

function labelEntrega(form) {
  if (form.tipo_entrega === 'domicilio') return `Envío a domicilio en Rafaela — ${form.direccion}`
  if (form.tipo_entrega === 'localidad') return `Envío a ${form.ciudad}, ${form.provincia}`
  return 'Retiro en Rafaela (a coordinar por WhatsApp)'
}

function calcularDescuento(cupon, subtotal) {
  if (!cupon) return 0
  if (cupon.tipo === 'porcentaje') return Math.round(subtotal * cupon.valor / 100)
  return Math.min(cupon.valor, subtotal)
}

function datosCompletos(d) {
  return d.nombre?.trim() && validarTelefono(d.telefono || '') && (
    d.tipo_entrega === 'retiro' ||
    d.tipo_entrega === 'localidad' ||
    (d.tipo_entrega === 'domicilio' && d.direccion?.trim())
  )
}

export default function Carrito() {
  useSEO({ titulo: 'Mi carrito', descripcion: 'Revisá tu carrito de compras en Tatitos Pañalera.', url: '/tienda/carrito' })
  const navigate = useNavigate()
  const { items, quitarItem, cambiarCantidad, vaciarCarrito, restaurarItems, generarCarritoId, carritoId } = useCarritoStore()
  const subtotal = items.reduce((acc, i) => acc + i.precio * i.cantidad, 0)
  const [searchParams] = useSearchParams()
  const sincronizandoRef = useRef(false)

  const [paso, setPaso] = useState(1)
  const [cargando, setCargando] = useState(false)
  const [stockBajo, setStockBajo] = useState({})
  const [metodoPago, setMetodoPago] = useState('efectivo')

  const [cuponInput, setCuponInput] = useState('')
  const [cuponAplicado, setCuponAplicado] = useState(null)
  const [cuponCargando, setCuponCargando] = useState(false)

  const descuento = calcularDescuento(cuponAplicado, subtotal)

  // ── Stock en tiempo real ──────────────────────────────────
  useEffect(() => {
    if (!items.length) return
    const ids = [...new Set(items.map((i) => i.id))]

    const channel = supabase
      .channel('carrito-stock')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'productos',
        filter: `id=in.(${ids.join(',')})`,
      }, (payload) => {
        const { id, stock } = payload.new
        const afectados = items.filter((i) => i.id === id && i.cantidad > stock)
        afectados.forEach((i) => {
          setStockBajo((prev) => ({ ...prev, [i._key]: stock }))
          if (stock === 0) {
            toast.error(`"${i.nombre}" se quedó sin stock`, { duration: 5000 })
          } else {
            toast(`Solo quedan ${stock} unidades de "${i.nombre}"`, { icon: '⚠️', duration: 5000 })
          }
        })
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [items])

  // ── Restaurar carrito desde URL ───────────────────────────
  useEffect(() => {
    const idParam = searchParams.get('carrito')
    if (!idParam || sincronizandoRef.current) return
    sincronizandoRef.current = true
    supabase.from('carritos').select('items').eq('id', idParam).single()
      .then(({ data }) => {
        if (data?.items?.length) {
          restaurarItems(data.items)
          toast.success('Carrito restaurado')
        }
      })
  }, [])

  // ── Auto-aplicar cupón desde URL o sessionStorage ────────
  useEffect(() => {
    const cuponParam = searchParams.get('cupon') || sessionStorage.getItem('cupon-pendiente')
    if (!cuponParam || cuponAplicado) return
    setCuponInput(cuponParam)
    supabase.from('cupones').select('*').eq('codigo', cuponParam.toUpperCase()).eq('activo', true).single()
      .then(({ data }) => {
        if (!data) { toast.error('El cupón no es válido'); return }
        if (data.usos_max && data.usos >= data.usos_max) { toast.error('El cupón ya alcanzó su límite de usos'); return }
        setCuponAplicado(data)
        sessionStorage.removeItem('cupon-pendiente')
        toast.success(`Cupón ${data.codigo} aplicado 🎉`)
      })
  }, [])

  // ── Sincronizar carrito a Supabase ────────────────────────
  useEffect(() => {
    if (!items.length) return
    const id = generarCarritoId()
    supabase.from('carritos').upsert({ id, items, updated_at: new Date().toISOString() })
  }, [items])

  // ── Compartir carrito ─────────────────────────────────────
  const compartirCarrito = async () => {
    const id = generarCarritoId()
    await supabase.from('carritos').upsert({ id, items, updated_at: new Date().toISOString() })
    const url = `${window.location.origin}/tienda/carrito?carrito=${id}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link copiado al portapapeles')
    } catch {
      prompt('Copiá este link:', url)
    }
  }

  // ── Cupón ─────────────────────────────────────────────────
  const aplicarCupon = async () => {
    const codigo = cuponInput.trim().toUpperCase()
    if (!codigo) return
    setCuponCargando(true)
    const { data, error } = await supabase
      .from('cupones')
      .select('*')
      .eq('codigo', codigo)
      .eq('activo', true)
      .single()
    setCuponCargando(false)
    if (error || !data) { toast.error('Cupón inválido o expirado'); return }
    if (data.usos_max !== null && data.usos >= data.usos_max) {
      toast.error('Este cupón ya alcanzó su límite de usos'); return
    }
    setCuponAplicado(data)
    toast.success(`Cupón "${data.codigo}" aplicado`)
  }

  const quitarCupon = () => { setCuponAplicado(null); setCuponInput('') }

  // ── Datos guardados ───────────────────────────────────────
  const datosGuardados = (() => {
    try { return JSON.parse(localStorage.getItem('tatitos-cliente') || '{}') } catch { return {} }
  })()
  const tieneCheckoutExpress = datosCompletos(datosGuardados)

  const [form, setForm] = useState({
    nombre: datosGuardados.nombre || '',
    telefono: datosGuardados.telefono || '',
    email: datosGuardados.email || '',
    tipo_entrega: datosGuardados.tipo_entrega || 'domicilio',
    direccion: datosGuardados.direccion || '',
    provincia: datosGuardados.provincia || '',
    ciudad: datosGuardados.ciudad || '',
    notas: '',
  })

  const ciudades = PROVINCIAS.find((p) => p.nombre === form.provincia)?.ciudades || []

  // Efectivo no disponible para domicilio (Puni no maneja cobro en destino)
  useEffect(() => {
    if (form.tipo_entrega === 'domicilio' && metodoPago === 'efectivo') {
      setMetodoPago('transferencia')
    }
  }, [form.tipo_entrega])

  const totalBase = subtotal - descuento + costoEnvio(form)
  const recargoMP = metodoPago === 'mercadopago' ? Math.round(totalBase * RECARGO_MP) : 0
  const total = totalBase + recargoMP

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(name === 'provincia' ? { ...form, provincia: value, ciudad: '' } : { ...form, [name]: value })
  }

  const handleSubmitDatos = (e) => {
    e.preventDefault()
    if (!form.nombre.trim()) { toast.error('Ingresá tu nombre'); return }
    if (!validarTelefono(form.telefono)) { toast.error('Ingresá un WhatsApp válido (10 a 12 dígitos)'); return }
    if (form.tipo_entrega === 'domicilio' && !form.direccion.trim()) { toast.error('Ingresá tu dirección'); return }
    if (form.tipo_entrega === 'localidad') {
      if (!form.provincia) { toast.error('Seleccioná una provincia'); return }
      if (!form.ciudad) { toast.error('Seleccioná una ciudad'); return }
    }
    localStorage.setItem('tatitos-cliente', JSON.stringify({
      nombre: form.nombre, telefono: form.telefono, email: form.email,
      tipo_entrega: form.tipo_entrega, direccion: form.direccion,
      provincia: form.provincia, ciudad: form.ciudad,
    }))
    setPaso(3)
  }

  // ── Pagar con MercadoPago ─────────────────────────────────
  const handlePagar = async () => {
    setCargando(true)
    try {
      const direccionFinal =
        form.tipo_entrega === 'domicilio' ? form.direccion
        : form.tipo_entrega === 'localidad' ? `${form.ciudad}, ${form.provincia}`
        : 'Retiro en local'

      const payload = {
        cliente: { nombre: form.nombre, telefono: form.telefono, email: form.email },
        items: items.map((i) => ({ producto_id: i.id, nombre: i.nombre, precio: i.precio, cantidad: i.cantidad })),
        tipo_entrega: form.tipo_entrega,
        direccion: direccionFinal,
        notas: form.notas,
        costo_envio: costoEnvio(form),
        cupon_codigo: cuponAplicado?.codigo || null,
        descuento,
        recargo_mp: recargoMP,
      }

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/crear-pedido`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error()
      const { init_point } = await res.json()
      vaciarCarrito()
      window.location.href = init_point
    } catch {
      toast.error('Error al procesar el pago. Intentá de nuevo.')
      setCargando(false)
    }
  }

  // ── Pagar por WhatsApp ────────────────────────────────────
  const handleWhatsApp = () => {
    const lineasItems = items
      .map((i) => `• ${i.nombre} × ${i.cantidad} → $${(i.precio * i.cantidad).toLocaleString('es-AR')}`)
      .join('\n')

    const lineaDescuento = descuento > 0
      ? `\n🏷️ Cupón ${cuponAplicado.codigo}: -$${descuento.toLocaleString('es-AR')}`
      : ''

    const lineaEnvio = form.tipo_entrega === 'domicilio'
      ? `+$${COSTO_ENVIO_LOCAL.toLocaleString('es-AR')} de envío`
      : form.tipo_entrega === 'retiro' ? 'Retiro (sin costo)' : 'Envío a coordinar'

    const labelMetodo = metodoPago === 'efectivo' ? 'Efectivo' : 'Transferencia bancaria'

    const mensaje = [
      '🛒 *Quiero hacer un pedido — Tatitos Pañalera*',
      '',
      '*Productos:*',
      lineasItems,
      lineaDescuento,
      '',
      `*Total: $${total.toLocaleString('es-AR')}* (${lineaEnvio})`,
      `*Medio de pago: ${labelMetodo}*`,
      '',
      '*Mis datos:*',
      `Nombre: ${form.nombre}`,
      `WhatsApp: ${form.telefono}`,
      `Entrega: ${labelEntrega(form)}`,
      form.notas ? `Notas: ${form.notas}` : '',
    ].filter(Boolean).join('\n')

    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(mensaje)}`, '_blank')
    vaciarCarrito()
    navigate('/pedido/confirmado')
  }

  // ─────────────────────────────────────────────────────────
  if (items.length === 0 && paso === 1) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-16 flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <ShoppingBag size={64} className="text-gray-300" />
          <p className="font-display font-bold text-xl text-gray-700">Tu carrito está vacío</p>
          <Link to="/tienda" className="btn-primary">Ir al catálogo</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16 max-w-3xl mx-auto px-4 py-8">

        {/* Pasos */}
        <div className="flex items-center gap-2 mb-8">
          {['Carrito', 'Datos', 'Pago'].map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                paso > i + 1 ? 'bg-green-500 text-white'
                : paso === i + 1 ? 'bg-primary text-white'
                : 'bg-gray-200 text-gray-500'
              }`}>{i + 1}</div>
              <span className={`text-sm font-medium ${paso === i + 1 ? 'text-gray-900' : 'text-gray-400'}`}>{label}</span>
              {i < 2 && <span className="text-gray-300 mx-1">›</span>}
            </div>
          ))}
        </div>

        {/* ── PASO 1: Carrito ── */}
        {paso === 1 && (
          <div>
            <h1 className="font-display text-2xl font-bold mb-6">Tu carrito</h1>

            {/* Checkout express */}
            {tieneCheckoutExpress && (
              <div className="bg-primary/5 border border-primary/20 rounded-2xl px-4 py-3 mb-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Zap size={16} className="text-primary shrink-0" />
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Hola, {datosGuardados.nombre.split(' ')[0]}.</span> Tus datos ya están guardados.
                  </p>
                </div>
                <button
                  onClick={() => setPaso(3)}
                  className="text-xs font-bold text-primary whitespace-nowrap hover:underline"
                >
                  Ir al pago →
                </button>
              </div>
            )}

            <div className="space-y-3 mb-6">
              {items.map((item) => {
                const stockDisp = stockBajo[item._key]
                const sinStock = stockDisp === 0
                return (
                  <div key={item._key || item.id} className={`card p-4 flex items-center gap-4 ${sinStock ? 'opacity-60' : ''}`}>
                    <div className="bg-gray-100 w-16 h-16 rounded-lg flex items-center justify-center shrink-0">
                      {item.imagen_url
                        ? <img src={item.imagen_url} alt={item.nombre} className="w-full h-full object-cover rounded-lg" />
                        : <ShoppingBag size={24} className="text-gray-300" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-semibold text-sm text-gray-900 truncate">{item.nombre}</p>
                      <p className="text-primary font-bold">${(item.precio * item.cantidad).toLocaleString('es-AR')}</p>
                      {stockDisp !== undefined && (
                        <p className="text-xs text-orange-500 flex items-center gap-1 mt-0.5">
                          <AlertTriangle size={11} />
                          {sinStock ? 'Sin stock — quitalo del carrito' : `Solo quedan ${stockDisp} unidades`}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => cambiarCantidad(item._key || item.id, item.cantidad - 1)} className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"><Minus size={14} /></button>
                      <span className="w-6 text-center font-semibold text-sm">{item.cantidad}</span>
                      <button
                        onClick={() => cambiarCantidad(item._key || item.id, item.cantidad + 1)}
                        disabled={stockDisp !== undefined && item.cantidad >= stockDisp}
                        className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center disabled:opacity-40"
                      ><Plus size={14} /></button>
                      <button onClick={() => quitarItem(item._key || item.id)} className="w-7 h-7 rounded-full text-red-400 hover:bg-red-50 flex items-center justify-center ml-1"><Trash2 size={14} /></button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Cupón */}
            <div className="card p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Tag size={15} className="text-primary" />
                <span className="font-display font-semibold text-sm text-gray-800">Cupón de descuento</span>
              </div>
              {cuponAplicado ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-sm font-bold text-green-700">{cuponAplicado.codigo}</p>
                    <p className="text-xs text-green-600">
                      {cuponAplicado.tipo === 'porcentaje'
                        ? `${cuponAplicado.valor}% de descuento`
                        : `$${Number(cuponAplicado.valor).toLocaleString('es-AR')} de descuento`}
                    </p>
                  </div>
                  <button onClick={quitarCupon} className="text-green-600 hover:text-green-800"><X size={16} /></button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    value={cuponInput}
                    onChange={(e) => setCuponInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && aplicarCupon()}
                    placeholder="Ingresá tu cupón..."
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                  <button onClick={aplicarCupon} disabled={cuponCargando || !cuponInput.trim()}
                    className="btn-primary px-4 py-2 disabled:opacity-50 whitespace-nowrap">
                    {cuponCargando ? '...' : 'Aplicar'}
                  </button>
                </div>
              )}
            </div>

            {/* Totales */}
            <div className="card p-4 mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Subtotal</span><span>${subtotal.toLocaleString('es-AR')}</span>
              </div>
              {descuento > 0 && (
                <div className="flex justify-between text-sm text-green-600 font-semibold mb-1">
                  <span>Descuento ({cuponAplicado.codigo})</span>
                  <span>-${descuento.toLocaleString('es-AR')}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Envío a domicilio en Rafaela</span>
                <span className="text-muted">+${COSTO_ENVIO_LOCAL.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex justify-between font-display font-bold text-lg border-t pt-2">
                <span>Total estimado</span>
                <span className="text-primary">${(subtotal - descuento + COSTO_ENVIO_LOCAL).toLocaleString('es-AR')}</span>
              </div>
            </div>

            <button onClick={() => setPaso(2)} className="btn-primary w-full justify-center py-4 text-base">Continuar →</button>
            <div className="flex items-center justify-center gap-6 mt-4">
              <Link to="/tienda" className="flex items-center gap-1 text-sm text-muted hover:text-primary">
                <ArrowLeft size={14} /> Seguir comprando
              </Link>
              <button onClick={compartirCarrito} className="flex items-center gap-1 text-sm text-muted hover:text-primary">
                <Share2 size={14} /> Compartir carrito
              </button>
            </div>
          </div>
        )}

        {/* ── PASO 2: Datos ── */}
        {paso === 2 && (
          <form onSubmit={handleSubmitDatos}>
            <h1 className="font-display text-2xl font-bold mb-6">Tus datos</h1>
            <div className="card p-6 space-y-4 mb-6">

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre completo *</label>
                <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="María García" required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">WhatsApp *</label>
                <input name="telefono" value={form.telefono} onChange={handleChange} placeholder="3492000000" required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                <p className="text-xs text-muted mt-1">Sin 0 ni 15. Ej: 3492123456</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email (opcional)</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="maria@email.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Tipo de entrega *</label>
                <div className="grid grid-cols-1 gap-3">

                  <label className={`border-2 rounded-xl p-4 cursor-pointer flex items-start gap-3 transition-colors ${
                    form.tipo_entrega === 'domicilio' ? 'border-primary bg-pink-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input type="radio" name="tipo_entrega" value="domicilio" checked={form.tipo_entrega === 'domicilio'} onChange={handleChange} className="accent-primary mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Home size={16} className="text-primary shrink-0" />
                        <span className="font-display font-bold text-sm text-gray-900">Envío a domicilio en Rafaela</span>
                        <span className="ml-auto text-sm font-bold text-primary shrink-0">+${COSTO_ENVIO_LOCAL.toLocaleString('es-AR')}</span>
                      </div>
                      <p className="text-xs text-muted mt-0.5">Solo dentro de Rafaela · ¡Nosotros te lo llevamos! 😊</p>
                      {(() => {
                        const puni = estadoPuni()
                        return (
                          <p className={`text-xs font-medium mt-1.5 ${puni.activo ? 'text-green-600' : 'text-amber-600'}`}>
                            {puni.mensaje}
                          </p>
                        )
                      })()}
                      {form.tipo_entrega === 'domicilio' && (
                        <input name="direccion" value={form.direccion} onChange={handleChange}
                          placeholder="Calle, número, piso, depto..."
                          className="mt-3 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white" />
                      )}
                    </div>
                  </label>

                  <label className={`border-2 rounded-xl p-4 cursor-pointer flex items-start gap-3 transition-colors ${
                    form.tipo_entrega === 'localidad' ? 'border-primary bg-pink-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input type="radio" name="tipo_entrega" value="localidad" checked={form.tipo_entrega === 'localidad'} onChange={handleChange} className="accent-primary mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <MapPin size={16} className="text-secondary shrink-0" />
                        <span className="font-display font-bold text-sm text-gray-900">Envío a otra localidad</span>
                        <span className="ml-auto text-xs text-muted font-medium shrink-0">A confirmar</span>
                      </div>
                      <p className="text-xs text-muted mt-0.5">Todo el país · Costo y transporte se coordinan por WhatsApp</p>
                      {form.tipo_entrega === 'localidad' && (
                        <div className="mt-3 space-y-2">
                          <select name="provincia" value={form.provincia} onChange={handleChange}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white">
                            <option value="">Seleccioná una provincia...</option>
                            {PROVINCIAS.map((p) => <option key={p.nombre} value={p.nombre}>{p.nombre}</option>)}
                          </select>
                          {form.provincia && (
                            <select name="ciudad" value={form.ciudad} onChange={handleChange}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white">
                              <option value="">Seleccioná una ciudad...</option>
                              {ciudades.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                          )}
                          <input name="direccion" value={form.direccion} onChange={handleChange}
                            placeholder="Dirección exacta (calle y número)..."
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white" />
                        </div>
                      )}
                    </div>
                  </label>

                  <label className={`border-2 rounded-xl p-4 cursor-pointer flex items-start gap-3 transition-colors ${
                    form.tipo_entrega === 'retiro' ? 'border-primary bg-pink-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input type="radio" name="tipo_entrega" value="retiro" checked={form.tipo_entrega === 'retiro'} onChange={handleChange} className="accent-primary mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Store size={16} className="text-green-600 shrink-0" />
                        <span className="font-display font-bold text-sm text-gray-900">Retiro</span>
                        <span className="ml-auto text-sm font-bold text-green-600 shrink-0">Gratis</span>
                      </div>
                      <p className="text-xs text-muted mt-0.5">Rafaela · Coordinamos lugar y horario por WhatsApp</p>
                    </div>
                  </label>

                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Notas (opcional)</label>
                <textarea name="notas" value={form.notas} onChange={handleChange}
                  placeholder="Horario de entrega, instrucciones especiales..." rows={2}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none" />
              </div>
            </div>

            <button type="submit" className="btn-primary w-full justify-center py-4 text-base">Continuar →</button>
            <button type="button" onClick={() => setPaso(1)} className="flex items-center gap-1 text-sm text-muted mt-4 hover:text-primary mx-auto">
              <ArrowLeft size={14} /> Volver al carrito
            </button>
          </form>
        )}

        {/* ── PASO 3: Pago ── */}
        {paso === 3 && (
          <div>
            <h1 className="font-display text-2xl font-bold mb-6">Resumen y pago</h1>

            <div className="card p-5 mb-4">
              <h3 className="font-display font-bold text-gray-800 mb-3">Tu pedido</h3>
              {items.map((item) => (
                <div key={item._key || item.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 shrink-0 overflow-hidden">
                    {item.imagen_url
                      ? <img src={item.imagen_url} alt={item.nombre} className="w-full h-full object-cover" />
                      : <ShoppingBag size={16} className="text-gray-300 m-auto mt-2.5" />}
                  </div>
                  <span className="text-sm text-gray-700 flex-1">{item.nombre} × {item.cantidad}</span>
                  <span className="text-sm font-semibold">${(item.precio * item.cantidad).toLocaleString('es-AR')}</span>
                </div>
              ))}
            </div>

            <div className="card p-5 mb-4">
              <h3 className="font-display font-bold text-gray-800 mb-3">Datos de entrega</h3>
              <p className="text-sm text-gray-600"><span className="font-medium">Nombre:</span> {form.nombre}</p>
              <p className="text-sm text-gray-600"><span className="font-medium">WhatsApp:</span> {form.telefono}</p>
              <p className="text-sm text-gray-600"><span className="font-medium">Entrega:</span> {labelEntrega(form)}</p>
              {form.notas && <p className="text-sm text-gray-600"><span className="font-medium">Notas:</span> {form.notas}</p>}
              <button onClick={() => setPaso(2)} className="text-xs text-primary hover:underline mt-2">Editar datos</button>
            </div>

            {/* Selector de medio de pago */}
            <div className="card p-5 mb-4">
              <h3 className="font-display font-bold text-gray-800 mb-3">Medio de pago</h3>
              {form.tipo_entrega === 'domicilio' && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
                  💵 El pago en efectivo no está disponible para envíos a domicilio.
                </p>
              )}
              <div className="space-y-2">
                {[
                  { value: 'efectivo', label: 'Efectivo', sub: 'Pagás al recibir o al retirar', icon: '💵' },
                  { value: 'transferencia', label: 'Transferencia bancaria', sub: 'Te enviamos el CBU/alias por WhatsApp', icon: '🏦' },
                  { value: 'mercadopago', label: 'Mercado Pago', sub: `Recargo del 6,42% por comisión de la plataforma`, icon: '💳', recargo: true },
                ].filter(({ value }) => !(form.tipo_entrega === 'domicilio' && value === 'efectivo'))
                .map(({ value, label, sub, icon, recargo }) => (
                  <label key={value} className={`border-2 rounded-xl p-3.5 cursor-pointer flex items-start gap-3 transition-colors ${
                    metodoPago === value ? 'border-primary bg-pink-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input type="radio" name="metodoPago" value={value}
                      checked={metodoPago === value} onChange={() => setMetodoPago(value)}
                      className="accent-primary mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span>{icon}</span>
                        <span className="font-display font-bold text-sm text-gray-900">{label}</span>
                        {recargo && (
                          <span className="ml-auto text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-200 rounded-full px-2 py-0.5">
                            +6,42%
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted mt-0.5 ml-6">{sub}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Resumen de totales */}
            <div className="card p-5 mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Subtotal</span><span>${subtotal.toLocaleString('es-AR')}</span>
              </div>
              {descuento > 0 && (
                <div className="flex justify-between text-sm text-green-600 font-semibold mb-1">
                  <span>Descuento ({cuponAplicado.codigo})</span>
                  <span>-${descuento.toLocaleString('es-AR')}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Envío</span>
                <span>
                  {form.tipo_entrega === 'domicilio' && `$${COSTO_ENVIO_LOCAL.toLocaleString('es-AR')}`}
                  {form.tipo_entrega === 'localidad' && <span className="text-muted italic">A confirmar por WhatsApp</span>}
                  {form.tipo_entrega === 'retiro' && <span className="text-green-600 font-semibold">Gratis</span>}
                </span>
              </div>
              {metodoPago === 'mercadopago' && (
                <div className="flex justify-between text-sm text-orange-600 font-semibold mb-1">
                  <span>Recargo Mercado Pago (6,42%)</span>
                  <span>+${recargoMP.toLocaleString('es-AR')}</span>
                </div>
              )}
              <div className="flex justify-between font-display font-black text-xl border-t pt-2">
                <span>Total</span>
                <span className="text-primary">
                  ${total.toLocaleString('es-AR')}
                  {form.tipo_entrega === 'localidad' && <span className="text-sm font-normal text-muted"> + envío</span>}
                </span>
              </div>
              {metodoPago === 'mercadopago' && (
                <p className="text-xs text-muted mt-2 text-right">
                  En efectivo o transferencia pagarías{' '}
                  <span className="font-semibold text-gray-700">${totalBase.toLocaleString('es-AR')}</span>
                </p>
              )}
            </div>

            {form.tipo_entrega === 'localidad' && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4 text-sm text-blue-700">
                📦 Te contactaremos por WhatsApp para coordinar el costo y método de envío a {form.ciudad}.
              </div>
            )}

            {/* Botones de pago según método elegido */}
            {metodoPago === 'mercadopago' ? (
              <button onClick={handlePagar} disabled={cargando}
                className="w-full bg-[#009EE3] text-white font-display font-bold py-4 rounded-full text-base hover:bg-[#0087c5] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {cargando ? 'Procesando...' : `💳 Pagar $${total.toLocaleString('es-AR')} con Mercado Pago`}
              </button>
            ) : (
              <button onClick={handleWhatsApp}
                className="w-full bg-[#25D366] text-white font-display font-bold py-4 rounded-full text-base hover:bg-[#20b958] transition-colors flex items-center justify-center gap-2">
                <MessageCircle size={20} />
                {metodoPago === 'efectivo' ? `Pedir por WhatsApp — $${total.toLocaleString('es-AR')} en efectivo` : `Pedir por WhatsApp — $${total.toLocaleString('es-AR')} por transferencia`}
              </button>
            )}
            <p className="text-center text-xs text-muted mt-3">
              {metodoPago === 'mercadopago'
                ? 'Serás redirigido al portal seguro de Mercado Pago'
                : 'Te contactamos por WhatsApp para coordinar el pago'}
            </p>

            <button onClick={() => setPaso(2)} className="flex items-center gap-1 text-sm text-muted mt-4 hover:text-primary mx-auto">
              <ArrowLeft size={14} /> Volver a datos
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
