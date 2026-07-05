import { ShoppingCart, Package, Eye } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import useCarritoStore from '../store/carritoStore'
import useUiStore from '../store/uiStore'
import toast from 'react-hot-toast'

export default function ProductoCard({ producto }) {
  const agregarItem = useCarritoStore((s) => s.agregarItem)
  const abrirCarrito = useUiStore((s) => s.abrirCarrito)
  const navigate = useNavigate()

  const tieneVariantes = producto.variantes && producto.variantes.length > 0
  const sinStock = tieneVariantes
    ? producto.variantes.every((v) => v.stock <= 0)
    : producto.stock <= 0

  const precioDesde = tieneVariantes
    ? Math.min(...producto.variantes.map((v) => v.precio))
    : producto.precio

  const handleAgregar = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (tieneVariantes) {
      navigate(`/tienda/producto/${producto.id}`)
      return
    }
    agregarItem(producto)
    toast.success(`${producto.nombre} agregado`)
    abrirCarrito()
  }

  const stockBadge = tieneVariantes ? null : producto.stock

  const BADGE_STYLES = {
    'Oferta':      'bg-red-500 text-white',
    'Nuevo':       'bg-green-500 text-white',
    'Destacado':   'bg-amber-400 text-amber-900',
    'Más vendido': 'bg-blue-500 text-white',
    'Exclusivo':   'bg-purple-500 text-white',
  }
  const badgesCustom = Array.isArray(producto.badges) ? producto.badges.filter(Boolean) : []

  return (
    <Link to={`/tienda/producto/${producto.id}`} className="card overflow-hidden flex flex-col group">
      <div className="relative bg-gray-100 aspect-square overflow-hidden">
        {producto.imagen_url ? (
          <img
            src={producto.imagen_url}
            alt={producto.nombre}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 group-hover:text-gray-400 transition-colors">
            <Package size={48} />
          </div>
        )}

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1 shadow">
            <Eye size={12} /> Ver detalle
          </span>
        </div>

        {/* Badges izquierda — stock automático */}
        {!tieneVariantes && sinStock && (
          <span className="absolute top-2 left-2 text-xs font-bold px-2.5 py-1 rounded-full bg-red-500 text-white shadow-sm">
            Sin stock
          </span>
        )}
        {!tieneVariantes && !sinStock && stockBadge <= 3 && (
          <span className="absolute top-2 left-2 text-xs font-bold px-2.5 py-1 rounded-full bg-yellow-400 text-yellow-900 shadow-sm animate-pulse">
            ⚡ Últimas {stockBadge}
          </span>
        )}
        {tieneVariantes && (
          <span className="absolute top-2 left-2 text-xs font-bold px-2.5 py-1 rounded-full bg-secondary text-white shadow-sm">
            {producto.variantes.length} talles
          </span>
        )}

        {/* Badges derecha — personalizables desde admin */}
        {badgesCustom.length > 0 && (
          <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
            {badgesCustom.map((b) => (
              <span
                key={b}
                className={`text-xs font-bold px-2.5 py-1 rounded-full shadow-sm ${BADGE_STYLES[b] || 'bg-gray-700 text-white'}`}
              >
                {b}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1 gap-2">
        {producto.marca && (
          <span className="text-xs text-muted font-medium uppercase tracking-wide">
            {producto.marca}
          </span>
        )}
        <h3 className="font-display font-semibold text-gray-900 text-sm leading-tight flex-1">
          {producto.nombre}
        </h3>

        {/* Chips de variantes (max 4) */}
        {tieneVariantes && (
          <div className="flex flex-wrap gap-1">
            {producto.variantes.slice(0, 4).map((v) => (
              <span
                key={v.label}
                className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${
                  v.stock > 0
                    ? 'border-gray-300 text-gray-600'
                    : 'border-gray-200 text-gray-300 line-through'
                }`}
              >
                {v.label}
              </span>
            ))}
            {producto.variantes.length > 4 && (
              <span className="text-[10px] px-1.5 py-0.5 text-muted">
                +{producto.variantes.length - 4}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-2">
          <span className="font-display font-black text-xl text-gray-900">
            {tieneVariantes && <span className="text-xs font-normal text-muted mr-1">desde</span>}
            ${precioDesde.toLocaleString('es-AR')}
          </span>
          <button
            onClick={handleAgregar}
            disabled={sinStock}
            className={`flex items-center gap-1 px-3 py-2 rounded-full text-xs font-semibold transition-colors ${
              sinStock
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-primary text-white hover:bg-pink-500'
            }`}
          >
            <ShoppingCart size={14} />
            {sinStock ? 'Sin stock' : tieneVariantes ? 'Elegir' : 'Agregar'}
          </button>
        </div>
      </div>
    </Link>
  )
}
