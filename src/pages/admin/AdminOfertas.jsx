import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { Tag, Plus, X, Check, Clock, TrendingDown, Package, Zap, Eye, Trash2 } from 'lucide-react'

const DURACIONES = [
  { label: '1 día', horas: 24 },
  { label: '3 días', horas: 72 },
  { label: '7 días', horas: 168 },
  { label: '14 días', horas: 336 },
]

function Countdown({ fechaFin }) {
  const [texto, setTexto] = useState('')
  useEffect(() => {
    function calcular() {
      const diff = new Date(fechaFin) - new Date()
      if (diff <= 0) { setTexto('Vencida'); return }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      setTexto(d > 0 ? `${d}d ${h}h` : `${h}h ${m}m`)
    }
    calcular()
    const t = setInterval(calcular, 60000)
    return () => clearInterval(t)
  }, [fechaFin])
  return <span>{texto}</span>
}

export default function AdminOfertas() {
  const [productos, setProductos] = useState([])
  const [ofertas, setOfertas] = useState([])
  const [loading, setLoading] = useState(true)
  const [creando, setCreando] = useState(null) // producto seleccionado para crear oferta
  const [descuento, setDescuento] = useState(20)
  const [duracionHoras, setDuracionHoras] = useState(168)
  const [guardando, setGuardando] = useState(false)
  const [tab, setTab] = useState('sugerencias') // 'sugerencias' | 'activas'

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    const [{ data: prods }, { data: ofs }] = await Promise.all([
      supabase.from('productos').select('*').eq('activo', true).gt('stock', 0).order('stock', { ascending: false }),
      supabase.from('ofertas').select('*, productos(*)').eq('activa', true).gt('fecha_fin', new Date().toISOString()).order('created_at', { ascending: false }),
    ])
    setProductos(prods || [])
    setOfertas(ofs || [])
    setLoading(false)
  }

  // Productos ya en oferta
  const idsEnOferta = new Set(ofertas.map((o) => o.producto_id))

  // Sugerencias: ordenadas por conveniencia
  // 1. Stock alto (mover inventario) 2. Precio alto (descuento impacta más visualmente)
  const sugerencias = productos
    .filter((p) => !idsEnOferta.has(p.id))
    .map((p) => ({
      ...p,
      score: p.stock * 0.6 + (p.precio / 1000) * 0.4,
    }))
    .sort((a, b) => b.score - a.score)

  function abrirCrear(prod) {
    setCreando(prod)
    setDescuento(prod.stock >= 10 ? 20 : prod.stock >= 5 ? 15 : 10)
    setDuracionHoras(168)
  }

  const precioOferta = creando ? Math.round(creando.precio * (1 - descuento / 100)) : 0
  const diferenciaPorUnidad = creando ? creando.precio - precioOferta : 0
  const ingresoSiVendeTodo = creando ? precioOferta * creando.stock : 0
  const ingresoSinOferta = creando ? creando.precio * creando.stock : 0

  async function publicarOferta() {
    if (!creando) return
    setGuardando(true)
    try {
      const fechaFin = new Date(Date.now() + duracionHoras * 3600000).toISOString()
      const { error } = await supabase.from('ofertas').insert({
        producto_id: creando.id,
        precio_oferta: precioOferta,
        fecha_fin: fechaFin,
        activa: true,
      })
      if (error) throw error
      toast.success(`¡Oferta publicada! ${creando.nombre} al ${descuento}% OFF`)
      setCreando(null)
      cargar()
    } catch {
      toast.error('Error al publicar la oferta')
    }
    setGuardando(false)
  }

  async function desactivarOferta(id) {
    await supabase.from('ofertas').update({ activa: false }).eq('id', id)
    toast.success('Oferta desactivada')
    cargar()
  }

  const motivoSugerencia = (p) => {
    if (p.stock >= 15) return { texto: 'Stock alto — ideal para mover', color: 'text-blue-600 bg-blue-50' }
    if (p.stock >= 8) return { texto: 'Buen stock disponible', color: 'text-green-600 bg-green-50' }
    if (p.stock <= 3) return { texto: '¡Últimas unidades! Generá urgencia', color: 'text-orange-600 bg-orange-50' }
    return { texto: 'Recomendado para ofertar', color: 'text-primary bg-pink-50' }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Tag size={24} className="text-primary" />
          <h1 className="font-display text-2xl font-bold text-gray-900">Ofertas de la semana</h1>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-primary">{ofertas.length}</span>
          <span className="text-muted">activa{ofertas.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        <button
          onClick={() => setTab('sugerencias')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === 'sugerencias' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Zap size={14} className="inline mr-1.5" />Sugerencias
        </button>
        <button
          onClick={() => setTab('activas')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === 'activas' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Eye size={14} className="inline mr-1.5" />Activas ({ofertas.length})
        </button>
      </div>

      {loading ? (
        <div className="card p-12 text-center text-muted">Cargando...</div>
      ) : (
        <>
          {/* ── TAB: SUGERENCIAS ── */}
          {tab === 'sugerencias' && (
            <div className="space-y-3">
              {sugerencias.length === 0 && (
                <div className="card p-12 text-center text-muted">
                  <Package size={40} className="mx-auto mb-3 text-gray-200" />
                  <p>Todos los productos están en oferta actualmente</p>
                </div>
              )}
              {sugerencias.map((p) => {
                const motivo = motivoSugerencia(p)
                return (
                  <div key={p.id} className="card p-4 flex items-center gap-4">
                    {p.imagen_url
                      ? <img src={p.imagen_url} alt="" className="w-14 h-14 object-contain rounded-xl border border-gray-100 shrink-0" />
                      : <div className="w-14 h-14 bg-gray-100 rounded-xl shrink-0 flex items-center justify-center"><Package size={20} className="text-gray-300" /></div>
                    }
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{p.nombre}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-sm font-bold text-gray-800">${p.precio.toLocaleString('es-AR')}</span>
                        <span className="text-xs text-muted">{p.stock} en stock</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${motivo.color}`}>{motivo.texto}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => abrirCrear(p)}
                      className="btn-primary text-sm py-2 px-4 shrink-0"
                    >
                      <Plus size={14} /> Crear oferta
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── TAB: ACTIVAS ── */}
          {tab === 'activas' && (
            <div className="space-y-3">
              {ofertas.length === 0 && (
                <div className="card p-12 text-center text-muted">
                  <Tag size={40} className="mx-auto mb-3 text-gray-200" />
                  <p>No hay ofertas activas</p>
                  <button onClick={() => setTab('sugerencias')} className="btn-primary mt-4 text-sm">Ver sugerencias</button>
                </div>
              )}
              {ofertas.map((o) => {
                const prod = o.productos
                const pctOff = prod ? Math.round((1 - o.precio_oferta / prod.precio) * 100) : 0
                return (
                  <div key={o.id} className="card p-4 flex items-center gap-4">
                    {prod?.imagen_url
                      ? <img src={prod.imagen_url} alt="" className="w-14 h-14 object-contain rounded-xl border border-gray-100 shrink-0" />
                      : <div className="w-14 h-14 bg-gray-100 rounded-xl shrink-0 flex items-center justify-center"><Package size={20} className="text-gray-300" /></div>
                    }
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{prod?.nombre}</p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-xs line-through text-muted">${prod?.precio.toLocaleString('es-AR')}</span>
                        <span className="text-sm font-bold text-primary">${o.precio_oferta.toLocaleString('es-AR')}</span>
                        <span className="text-xs font-bold text-white bg-primary px-2 py-0.5 rounded-full">{pctOff}% OFF</span>
                        <span className="text-xs text-muted flex items-center gap-1">
                          <Clock size={11} /> Vence en <Countdown fechaFin={o.fecha_fin} />
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => desactivarOferta(o.id)}
                      className="text-gray-400 hover:text-red-500 p-2 transition-colors"
                      title="Desactivar oferta"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ── MODAL: CREAR OFERTA ── */}
      {creando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="font-display font-bold text-gray-900">Crear oferta</h2>
              <button onClick={() => setCreando(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            <div className="p-5 space-y-5">
              {/* Producto */}
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                {creando.imagen_url
                  ? <img src={creando.imagen_url} alt="" className="w-12 h-12 object-contain rounded-lg shrink-0" />
                  : <div className="w-12 h-12 bg-gray-200 rounded-lg shrink-0 flex items-center justify-center"><Package size={16} className="text-gray-400" /></div>
                }
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">{creando.nombre}</p>
                  <p className="text-xs text-muted">{creando.stock} unidades en stock</p>
                </div>
              </div>

              {/* Slider descuento */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-700">Descuento</label>
                  <span className="text-2xl font-black text-primary">{descuento}% OFF</span>
                </div>
                <input
                  type="range"
                  min={5} max={60} step={5}
                  value={descuento}
                  onChange={(e) => setDescuento(Number(e.target.value))}
                  className="w-full accent-pink-500"
                />
                <div className="flex justify-between text-xs text-muted mt-1">
                  <span>5%</span><span>60%</span>
                </div>
              </div>

              {/* Comparativa precios */}
              <div className="bg-pink-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted">Precio actual</span>
                  <span className="text-sm line-through text-muted">${creando.precio.toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-primary">Precio oferta</span>
                  <span className="text-xl font-black text-primary">${precioOferta.toLocaleString('es-AR')}</span>
                </div>
                <div className="border-t border-pink-200 pt-2 mt-2 space-y-1">
                  <div className="flex justify-between text-xs text-muted">
                    <span className="flex items-center gap-1"><TrendingDown size={12} /> Menos por unidad</span>
                    <span className="text-orange-600 font-semibold">-${diferenciaPorUnidad.toLocaleString('es-AR')}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted">
                    <span>Ingreso si vendés todo</span>
                    <span className="font-semibold text-green-600">${ingresoSiVendeTodo.toLocaleString('es-AR')}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted">
                    <span>Sin oferta sería</span>
                    <span>${ingresoSinOferta.toLocaleString('es-AR')}</span>
                  </div>
                </div>
              </div>

              {/* Duración */}
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">Duración</label>
                <div className="grid grid-cols-4 gap-2">
                  {DURACIONES.map(({ label, horas }) => (
                    <button
                      key={horas}
                      onClick={() => setDuracionHoras(horas)}
                      className={`py-2 rounded-xl text-xs font-semibold border transition-colors ${
                        duracionHoras === horas
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Preview en la tienda</p>
                <div className="border border-gray-200 rounded-xl p-3 flex items-center gap-3 bg-white">
                  {creando.imagen_url
                    ? <img src={creando.imagen_url} alt="" className="w-16 h-16 object-contain rounded-lg shrink-0" />
                    : <div className="w-16 h-16 bg-gray-100 rounded-lg shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-black text-white bg-primary px-2 py-0.5 rounded-full">{descuento}% OFF</span>
                      {creando.stock <= 5 && (
                        <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">¡Últimas {creando.stock}!</span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-gray-900 truncate">{creando.nombre}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs line-through text-muted">${creando.precio.toLocaleString('es-AR')}</span>
                      <span className="text-sm font-black text-primary">${precioOferta.toLocaleString('es-AR')}</span>
                    </div>
                    <p className="text-xs text-muted mt-0.5 flex items-center gap-1">
                      <Clock size={10} /> Termina en {DURACIONES.find(d => d.horas === duracionHoras)?.label}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 pb-5 flex gap-3">
              <button onClick={() => setCreando(null)} className="btn-secondary flex-1 justify-center py-3">
                Cancelar
              </button>
              <button
                onClick={publicarOferta}
                disabled={guardando}
                className="btn-primary flex-1 justify-center py-3 disabled:opacity-60"
              >
                {guardando ? 'Publicando...' : <><Check size={16} /> Publicar oferta</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
