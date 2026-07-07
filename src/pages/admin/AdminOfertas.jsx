import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { Tag, Eye, Clock, TrendingDown, Package, Zap, Trash2, Check } from 'lucide-react'

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

// Tarjeta de sugerencia con slider + métricas inline
function SugerenciaCard({ producto, onPublicar }) {
  const [descuento, setDescuento] = useState(
    producto.stock >= 10 ? 20 : producto.stock >= 5 ? 15 : 10
  )
  const [duracion, setDuracion] = useState(168)
  const [guardando, setGuardando] = useState(false)

  const precioOferta = Math.round(producto.precio * (1 - descuento / 100))
  const diferencia = producto.precio - precioOferta
  const ingresoOferta = precioOferta * producto.stock
  const ingresoFull = producto.precio * producto.stock

  const motivoSugerencia = () => {
    if (producto.stock >= 15) return { texto: 'Stock alto — ideal para mover', color: 'text-blue-600 bg-blue-50' }
    if (producto.stock >= 8) return { texto: 'Buen stock disponible', color: 'text-green-600 bg-green-50' }
    if (producto.stock <= 3) return { texto: '¡Últimas unidades!', color: 'text-orange-600 bg-orange-50' }
    return { texto: 'Recomendado', color: 'text-primary bg-pink-50' }
  }
  const motivo = motivoSugerencia()

  async function publicar() {
    setGuardando(true)
    try {
      const fechaFin = new Date(Date.now() + duracion * 3600000).toISOString()
      const { error } = await supabase.from('ofertas').insert({
        producto_id: producto.id,
        precio_oferta: precioOferta,
        fecha_fin: fechaFin,
        activa: true,
      })
      if (error) throw error
      toast.success(`¡Oferta publicada! ${producto.nombre} al ${descuento}% OFF`)
      onPublicar()
    } catch {
      toast.error('Error al publicar la oferta')
    }
    setGuardando(false)
  }

  return (
    <div className="card p-4 space-y-3">
      {/* Fila superior: imagen + nombre + chip */}
      <div className="flex items-center gap-3">
        {producto.imagen_url
          ? <img src={producto.imagen_url} alt="" className="w-12 h-12 object-contain rounded-xl border border-gray-100 shrink-0" />
          : <div className="w-12 h-12 bg-gray-100 rounded-xl shrink-0 flex items-center justify-center"><Package size={18} className="text-gray-300" /></div>
        }
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-gray-900 truncate">{producto.nombre}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-xs text-muted">${producto.precio.toLocaleString('es-AR')} · {producto.stock} en stock</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${motivo.color}`}>{motivo.texto}</span>
          </div>
        </div>
        <span className="text-xl font-black text-primary shrink-0">{descuento}% OFF</span>
      </div>

      {/* Slider */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted w-16 shrink-0">Descuento</span>
        <input
          type="range" min={5} max={60} step={5}
          value={descuento}
          onChange={(e) => setDescuento(Number(e.target.value))}
          className="flex-1 accent-pink-500"
        />
        <span className="text-xs text-muted w-6 shrink-0">{descuento}%</span>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-pink-50 rounded-xl p-2.5 text-center">
          <p className="text-[10px] text-muted mb-1">Precio oferta</p>
          <p className="text-sm font-black text-primary">${precioOferta.toLocaleString('es-AR')}</p>
        </div>
        <div className="bg-orange-50 rounded-xl p-2.5 text-center">
          <p className="text-[10px] text-muted mb-1">Menos p/unidad</p>
          <p className="text-sm font-bold text-orange-600">-${diferencia.toLocaleString('es-AR')}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-2.5 text-center">
          <p className="text-[10px] text-muted mb-1">Ingreso total</p>
          <p className="text-sm font-bold text-green-600">${ingresoOferta.toLocaleString('es-AR')}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-2.5 text-center">
          <p className="text-[10px] text-muted mb-1">Sin oferta</p>
          <p className="text-sm font-semibold text-gray-500">${ingresoFull.toLocaleString('es-AR')}</p>
        </div>
      </div>

      {/* Duración + publicar */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted shrink-0">Duración:</span>
        {DURACIONES.map(({ label, horas }) => (
          <button
            key={horas}
            onClick={() => setDuracion(horas)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${
              duracion === horas
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'
            }`}
          >
            {label}
          </button>
        ))}
        <button
          onClick={publicar}
          disabled={guardando}
          className="ml-auto btn-primary text-sm py-2 px-5 disabled:opacity-60"
        >
          {guardando ? 'Publicando...' : <><Check size={14} /> Publicar oferta</>}
        </button>
      </div>
    </div>
  )
}

export default function AdminOfertas() {
  const [productos, setProductos] = useState([])
  const [ofertas, setOfertas] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('sugerencias')

  const cargar = useCallback(async () => {
    setLoading(true)
    const [{ data: prods }, { data: ofs }] = await Promise.all([
      supabase.from('productos').select('*').eq('activo', true).gt('stock', 0).order('stock', { ascending: false }),
      supabase.from('ofertas').select('*, productos(*)').eq('activa', true).gt('fecha_fin', new Date().toISOString()).order('created_at', { ascending: false }),
    ])
    setProductos(prods || [])
    setOfertas(ofs || [])
    setLoading(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const idsEnOferta = new Set(ofertas.map((o) => o.producto_id))

  const sugerencias = productos
    .filter((p) => !idsEnOferta.has(p.id))
    .map((p) => ({ ...p, score: p.stock * 0.6 + (p.precio / 1000) * 0.4 }))
    .sort((a, b) => b.score - a.score)

  async function desactivarOferta(id) {
    await supabase.from('ofertas').update({ activa: false }).eq('id', id)
    toast.success('Oferta desactivada')
    cargar()
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
              {sugerencias.map((p) => (
                <SugerenciaCard key={p.id} producto={p} onPublicar={cargar} />
              ))}
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
    </div>
  )
}
