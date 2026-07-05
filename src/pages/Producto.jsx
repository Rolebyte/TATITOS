import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, ShoppingCart, Package, Minus, Plus, Truck, Shield, RotateCcw } from 'lucide-react'
import { supabase } from '../lib/supabase'
import useCarritoStore from '../store/carritoStore'
import useUiStore from '../store/uiStore'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import CarritoBoton from '../components/CarritoBoton'
import useSEO from '../hooks/useSEO'

export default function Producto() {
  const { id } = useParams()
  const agregarItem = useCarritoStore((s) => s.agregarItem)
  const abrirCarrito = useUiStore((s) => s.abrirCarrito)
  const [producto, setProducto] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [cantidad, setCantidad] = useState(1)
  const [relacionados, setRelacionados] = useState([])
  const [varianteSeleccionada, setVarianteSeleccionada] = useState(null)

  useEffect(() => {
    let channel = null

    async function cargar() {
      setLoading(true)
      setError(false)
      setProducto(null)
      setVarianteSeleccionada(null)
      setCantidad(1)

      try {
        const { data, error: err } = await supabase
          .from('productos')
          .select('*')
          .eq('id', id)
          .single()

        if (err || !data) {
          setError(true)
          return
        }

        setProducto(data)

        if (data.variantes?.length > 0) {
          const conStock = data.variantes.find((v) => v.stock > 0)
          setVarianteSeleccionada(conStock || data.variantes[0])
        }

        // Cargar relacionados sin bloquear
        supabase
          .from('productos')
          .select('*')
          .eq('categoria', data.categoria)
          .eq('activo', true)
          .neq('id', data.id)
          .limit(4)
          .then(({ data: rel }) => { if (rel?.length) setRelacionados(rel) })

        try {
          channel = supabase
            .channel(`producto-${id}`)
            .on('postgres_changes', {
              event: 'UPDATE',
              schema: 'public',
              table: 'productos',
              filter: `id=eq.${id}`,
            }, (payload) => {
              setProducto((prev) => ({ ...prev, ...payload.new }))
            })
            .subscribe()
        } catch {
          // realtime no disponible, la vista funciona igual
        }

      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    cargar()
    return () => { if (channel) supabase.removeChannel(channel) }
  }, [id])

  const handleAgregar = () => {
    if (tieneVariantes && !varianteSeleccionada) {
      toast.error('Seleccioná una presentación')
      return
    }
    for (let i = 0; i < cantidad; i++) {
      agregarItem(producto, varianteSeleccionada)
    }
    const label = varianteSeleccionada ? ` (${varianteSeleccionada.label})` : ''
    toast.success(`${cantidad > 1 ? `${cantidad}x ` : ''}${producto.nombre}${label} agregado`)
    abrirCarrito()
  }

  useSEO(producto ? {
    titulo: producto.nombre,
    descripcion: producto.descripcion || `${producto.nombre} — Comprá en Tatitos Pañalera, Rafaela.`,
    imagen: producto.imagen_url || undefined,
    url: `/tienda/producto/${producto.id}`,
  } : {})

  const todasLasImagenes = [
    producto?.imagen_url,
    ...(producto?.imagenes || []),
  ].filter(Boolean)
  const [imagenActiva, setImagenActiva] = useState(0)

  const tieneVariantes = producto?.variantes?.length > 0
  const precioActual = tieneVariantes && varianteSeleccionada
    ? (varianteSeleccionada.precio ?? 0)
    : (producto?.precio ?? 0)
  const stockActual = tieneVariantes && varianteSeleccionada
    ? (varianteSeleccionada.stock ?? 0)
    : (producto?.stock ?? 0)
  const sinStock = stockActual <= 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-16 max-w-6xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-pulse">
            <div className="aspect-square bg-gray-200 rounded-2xl" />
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4" />
              <div className="h-8 bg-gray-200 rounded w-3/4" />
              <div className="h-6 bg-gray-200 rounded w-1/3" />
              <div className="h-20 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !producto) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-16 max-w-6xl mx-auto px-4 py-24 flex flex-col items-center gap-4 text-center">
          <Package size={64} className="text-gray-200" />
          <h2 className="font-display text-2xl font-bold text-gray-700">Producto no encontrado</h2>
          <p className="text-muted text-sm">Este producto ya no está disponible o fue movido.</p>
          <Link to="/tienda" className="btn-primary mt-4">Ver catálogo</Link>
        </div>
        <CarritoBoton />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16">
        <div className="max-w-6xl mx-auto px-4 py-8">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted mb-6">
            <Link to="/tienda" className="hover:text-primary flex items-center gap-1">
              <ArrowLeft size={14} /> Catálogo
            </Link>
            <span>/</span>
            <span className="capitalize">{producto.categoria}</span>
            <span>/</span>
            <span className="text-gray-700 truncate max-w-xs">{producto.nombre}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-16">
            {/* Galería */}
            <div>
              <div className="aspect-square bg-white rounded-2xl shadow-sm flex items-center justify-center overflow-hidden">
                {todasLasImagenes.length > 0 ? (
                  <img
                    src={todasLasImagenes[imagenActiva]}
                    alt={producto.nombre}
                    className="w-full h-full object-cover transition-opacity duration-200"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3 text-gray-300">
                    <Package size={80} />
                    <span className="text-sm">{producto.marca}</span>
                  </div>
                )}
              </div>
              {todasLasImagenes.length > 1 && (
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                  {todasLasImagenes.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setImagenActiva(i)}
                      className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors ${
                        imagenActiva === i ? 'border-primary' : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex flex-col">
              {producto.marca && (
                <span className="text-primary font-semibold text-sm uppercase tracking-wide mb-1">
                  {producto.marca}
                </span>
              )}
              <h1 className="font-display text-3xl font-black text-gray-900 mb-3">
                {producto.nombre}
              </h1>

              <div className="flex items-center gap-3 mb-4">
                <span className="font-display font-black text-4xl text-gray-900">
                  ${precioActual.toLocaleString('es-AR')}
                </span>
                {sinStock ? (
                  <span className="badge bg-red-100 text-red-600">Sin stock</span>
                ) : stockActual <= 5 ? (
                  <span className="badge bg-yellow-100 text-yellow-700">
                    Últimas {stockActual} unidades
                  </span>
                ) : (
                  <span className="badge bg-green-100 text-green-700">En stock</span>
                )}
              </div>

              {producto.descripcion && (
                <p className="text-muted leading-relaxed mb-6">{producto.descripcion}</p>
              )}

              {/* Selector de variantes */}
              {tieneVariantes && (
                <div className="mb-6">
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    Presentación:{' '}
                    {varianteSeleccionada && (
                      <span className="text-primary">{varianteSeleccionada.label}</span>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {producto.variantes.map((v) => {
                      const esSeleccionada = varianteSeleccionada?.label === v.label
                      const sinStockV = (v.stock ?? 0) <= 0
                      return (
                        <button
                          key={v.label}
                          onClick={() => { if (!sinStockV) setVarianteSeleccionada(v) }}
                          disabled={sinStockV}
                          className={`px-3 py-1.5 rounded-full text-sm font-semibold border-2 transition-all ${
                            esSeleccionada
                              ? 'border-primary bg-primary text-white'
                              : sinStockV
                              ? 'border-gray-200 text-gray-300 cursor-not-allowed line-through'
                              : 'border-gray-300 text-gray-700 hover:border-primary hover:text-primary'
                          }`}
                        >
                          {v.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Cantidad */}
              {!sinStock && (
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-sm font-semibold text-gray-700">Cantidad:</span>
                  <div className="flex items-center gap-2 bg-gray-100 rounded-full px-2 py-1">
                    <button
                      onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                      className="w-7 h-7 rounded-full hover:bg-white flex items-center justify-center transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center font-bold text-sm">{cantidad}</span>
                    <button
                      onClick={() => setCantidad(Math.min(stockActual, cantidad + 1))}
                      className="w-7 h-7 rounded-full hover:bg-white flex items-center justify-center transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <span className="text-xs text-muted">({stockActual} disponibles)</span>
                </div>
              )}

              {/* Botones */}
              <div className="flex gap-3 mb-8">
                <button
                  onClick={handleAgregar}
                  disabled={sinStock}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-full font-display font-bold text-base transition-colors ${
                    sinStock
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-primary text-white hover:bg-pink-500'
                  }`}
                >
                  <ShoppingCart size={20} />
                  {sinStock ? 'Sin stock' : 'Agregar al carrito'}
                </button>
                <Link to="/tienda/carrito" className="btn-secondary py-4 px-5">
                  Ver carrito
                </Link>
              </div>

              {/* Garantías */}
              <div className="border-t pt-6 grid grid-cols-3 gap-4">
                {[
                  { icon: Truck, label: 'Envío a todo el país' },
                  { icon: Shield, label: 'Pago 100% seguro' },
                  { icon: RotateCcw, label: 'Atención por WhatsApp' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex flex-col items-center gap-1 text-center">
                    <Icon size={20} className="text-muted" />
                    <span className="text-xs text-muted">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Productos relacionados */}
          {relacionados.length > 0 && (
            <div>
              <h2 className="font-display text-2xl font-bold text-gray-900 mb-6">
                Productos relacionados
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {relacionados.map((p) => (
                  <Link
                    key={p.id}
                    to={`/tienda/producto/${p.id}`}
                    className="card overflow-hidden hover:scale-105 transition-transform duration-200"
                  >
                    <div className="aspect-square bg-gray-100 flex items-center justify-center">
                      {p.imagen_url ? (
                        <img src={p.imagen_url} alt={p.nombre} className="w-full h-full object-cover" />
                      ) : (
                        <Package size={36} className="text-gray-300" />
                      )}
                    </div>
                    <div className="p-3">
                      <p className="font-display font-semibold text-xs text-gray-900 truncate">{p.nombre}</p>
                      <p className="font-display font-black text-primary mt-1">
                        ${(p.precio ?? 0).toLocaleString('es-AR')}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <CarritoBoton />
    </div>
  )
}
