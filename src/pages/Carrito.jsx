import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Minus, Plus, Trash2, ArrowLeft, ShoppingBag, Home, MapPin, Store } from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import useCarritoStore from '../store/carritoStore'
import { PROVINCIAS } from '../data/provincias'

const COSTO_ENVIO_LOCAL = 2500   // Rafaela y alrededores
const COSTO_ENVIO_INTERIOR = 0   // A confirmar por el admin

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

export default function Carrito() {
  const { items, quitarItem, cambiarCantidad, vaciarCarrito } = useCarritoStore()
  const subtotal = items.reduce((acc, i) => acc + i.precio * i.cantidad, 0)

  const [paso, setPaso] = useState(1)
  const [cargando, setCargando] = useState(false)

  const datosGuardados = (() => {
    try { return JSON.parse(localStorage.getItem('tatitos-cliente') || '{}') } catch { return {} }
  })()

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
  const total = subtotal + costoEnvio(form)

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'provincia') {
      setForm({ ...form, provincia: value, ciudad: '' })
    } else {
      setForm({ ...form, [name]: value })
    }
  }

  const handleSubmitDatos = (e) => {
    e.preventDefault()
    if (!form.nombre.trim()) { toast.error('Ingresá tu nombre'); return }
    if (!validarTelefono(form.telefono)) { toast.error('Ingresá un WhatsApp válido (10 a 12 dígitos)'); return }
    if (form.tipo_entrega === 'domicilio' && !form.direccion.trim()) {
      toast.error('Ingresá tu dirección'); return
    }
    if (form.tipo_entrega === 'localidad') {
      if (!form.provincia) { toast.error('Seleccioná una provincia'); return }
      if (!form.ciudad) { toast.error('Seleccioná una ciudad'); return }
    }

    localStorage.setItem('tatitos-cliente', JSON.stringify({
      nombre: form.nombre,
      telefono: form.telefono,
      email: form.email,
      tipo_entrega: form.tipo_entrega,
      direccion: form.direccion,
      provincia: form.provincia,
      ciudad: form.ciudad,
    }))
    setPaso(3)
  }

  const handlePagar = async () => {
    setCargando(true)
    try {
      const direccionFinal =
        form.tipo_entrega === 'domicilio' ? form.direccion
        : form.tipo_entrega === 'localidad' ? `${form.ciudad}, ${form.provincia}`
        : 'Retiro en local'

      const payload = {
        cliente: { nombre: form.nombre, telefono: form.telefono, email: form.email },
        items: items.map((i) => ({
          producto_id: i.id, nombre: i.nombre, precio: i.precio, cantidad: i.cantidad,
        })),
        tipo_entrega: form.tipo_entrega,
        direccion: direccionFinal,
        notas: form.notas,
        costo_envio: costoEnvio(form),
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

      const res = await fetch(`${supabaseUrl}/functions/v1/crear-pedido`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${supabaseKey}` },
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
            <div className="space-y-3 mb-6">
              {items.map((item) => (
                <div key={item.id} className="card p-4 flex items-center gap-4">
                  <div className="bg-gray-100 w-16 h-16 rounded-lg flex items-center justify-center shrink-0">
                    {item.imagen_url
                      ? <img src={item.imagen_url} alt={item.nombre} className="w-full h-full object-cover rounded-lg" />
                      : <ShoppingBag size={24} className="text-gray-300" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-semibold text-sm text-gray-900 truncate">{item.nombre}</p>
                    <p className="text-primary font-bold">${(item.precio * item.cantidad).toLocaleString('es-AR')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => cambiarCantidad(item._key || item.id, item.cantidad - 1)} className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"><Minus size={14} /></button>
<span className="w-6 text-center font-semibold text-sm">{item.cantidad}</span>
                    <button onClick={() => cambiarCantidad(item._key || item.id, item.cantidad + 1)} className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"><Plus size={14} /></button>
                    <button onClick={() => quitarItem(item._key || item.id)} className="w-7 h-7 rounded-full text-red-400 hover:bg-red-50 flex items-center justify-center ml-1"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>

            <div className="card p-4 mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Subtotal</span><span>${subtotal.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Envío</span><span className="text-muted">Se calcula en el siguiente paso</span>
              </div>
              <div className="flex justify-between font-display font-bold text-lg border-t pt-2">
                <span>Total</span><span className="text-primary">${subtotal.toLocaleString('es-AR')}+</span>
              </div>
            </div>

            <button onClick={() => setPaso(2)} className="btn-primary w-full justify-center py-4 text-base">Continuar →</button>
            <Link to="/tienda" className="flex items-center gap-1 text-sm text-muted mt-4 hover:text-primary justify-center">
              <ArrowLeft size={14} /> Seguir comprando
            </Link>
          </div>
        )}

        {/* ── PASO 2: Datos ── */}
        {paso === 2 && (
          <form onSubmit={handleSubmitDatos}>
            <h1 className="font-display text-2xl font-bold mb-6">Tus datos</h1>
            <div className="card p-6 space-y-4 mb-6">

              {/* Nombre */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre completo *</label>
                <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="María García" required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
              </div>

              {/* WhatsApp */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">WhatsApp *</label>
                <input name="telefono" value={form.telefono} onChange={handleChange} placeholder="3492000000" required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                <p className="text-xs text-muted mt-1">Sin 0 ni 15. Ej: 3492123456</p>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email (opcional)</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="maria@email.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
              </div>

              {/* Tipo de entrega — 3 tarjetas */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Tipo de entrega *</label>
                <div className="grid grid-cols-1 gap-3">

                  {/* Opción 1: Envío a domicilio */}
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
                      {form.tipo_entrega === 'domicilio' && (
                        <input
                          name="direccion"
                          value={form.direccion}
                          onChange={handleChange}
                          placeholder="Calle, número, piso, depto..."
                          className="mt-3 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
                        />
                      )}
                    </div>
                  </label>

                  {/* Opción 2: Envío a localidad */}
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
                          <select
                            name="provincia"
                            value={form.provincia}
                            onChange={handleChange}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
                          >
                            <option value="">Seleccioná una provincia...</option>
                            {PROVINCIAS.map((p) => (
                              <option key={p.nombre} value={p.nombre}>{p.nombre}</option>
                            ))}
                          </select>
                          {form.provincia && (
                            <select
                              name="ciudad"
                              value={form.ciudad}
                              onChange={handleChange}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
                            >
                              <option value="">Seleccioná una ciudad...</option>
                              {ciudades.map((c) => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          )}
                          <input
                            name="direccion"
                            value={form.direccion}
                            onChange={handleChange}
                            placeholder="Dirección exacta (calle y número)..."
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
                          />
                        </div>
                      )}
                    </div>
                  </label>

                  {/* Opción 3: Retiro en local */}
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

              {/* Notas */}
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
                <div key={item.id} className="flex justify-between text-sm py-1 border-b border-gray-50 last:border-0">
                  <span className="text-gray-700">{item.nombre} × {item.cantidad}</span>
                  <span className="font-semibold">${(item.precio * item.cantidad).toLocaleString('es-AR')}</span>
                </div>
              ))}
            </div>

            <div className="card p-5 mb-4">
              <h3 className="font-display font-bold text-gray-800 mb-3">Datos de entrega</h3>
              <p className="text-sm text-gray-600"><span className="font-medium">Nombre:</span> {form.nombre}</p>
              <p className="text-sm text-gray-600"><span className="font-medium">WhatsApp:</span> {form.telefono}</p>
              <p className="text-sm text-gray-600"><span className="font-medium">Entrega:</span> {labelEntrega(form)}</p>
              {form.notas && <p className="text-sm text-gray-600"><span className="font-medium">Notas:</span> {form.notas}</p>}
            </div>

            <div className="card p-5 mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Subtotal</span><span>${subtotal.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Envío</span>
                <span>
                  {form.tipo_entrega === 'domicilio' && `$${COSTO_ENVIO_LOCAL.toLocaleString('es-AR')}`}
                  {form.tipo_entrega === 'localidad' && <span className="text-muted italic">A confirmar por WhatsApp</span>}
                  {form.tipo_entrega === 'retiro' && <span className="text-green-600 font-semibold">Gratis</span>}
                </span>
              </div>
              <div className="flex justify-between font-display font-black text-xl border-t pt-2">
                <span>Total</span>
                <span className="text-primary">
                  ${total.toLocaleString('es-AR')}
                  {form.tipo_entrega === 'localidad' && <span className="text-sm font-normal text-muted"> + envío</span>}
                </span>
              </div>
            </div>

            {form.tipo_entrega === 'localidad' && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-5 text-sm text-blue-700">
                📦 Te contactaremos por WhatsApp para coordinar el costo y método de envío a {form.ciudad}.
              </div>
            )}

            <button onClick={handlePagar} disabled={cargando}
              className="w-full bg-[#009EE3] text-white font-display font-bold py-4 rounded-full text-base hover:bg-[#0087c5] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {cargando ? 'Procesando...' : '💳 Pagar con Mercado Pago'}
            </button>
            <p className="text-center text-xs text-muted mt-3">Serás redirigido a Mercado Pago de forma segura</p>
            <button onClick={() => setPaso(2)} className="flex items-center gap-1 text-sm text-muted mt-4 hover:text-primary mx-auto">
              <ArrowLeft size={14} /> Volver a datos
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
