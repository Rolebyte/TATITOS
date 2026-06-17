import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react'
import useCarritoStore from '../store/carritoStore'
import useUiStore from '../store/uiStore'

export default function CarritoDrawer() {
  const { items, quitarItem, cambiarCantidad } = useCarritoStore()
  const { carritoAbierto, cerrarCarrito } = useUiStore()

  const subtotal = items.reduce((acc, i) => acc + i.precio * i.cantidad, 0)
  const totalItems = items.reduce((acc, i) => acc + i.cantidad, 0)

  // Cerrar con Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') cerrarCarrito() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Bloquear scroll del body cuando está abierto
  useEffect(() => {
    document.body.style.overflow = carritoAbierto ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [carritoAbierto])

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/40 z-50 transition-opacity duration-300 ${
          carritoAbierto ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={cerrarCarrito}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          carritoAbierto ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2">
            <h2 className="font-display font-bold text-lg text-gray-900">Tu carrito</h2>
            {totalItems > 0 && (
              <span className="bg-primary text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </div>
          <button
            onClick={cerrarCarrito}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <ShoppingBag size={56} className="text-gray-200" />
              <p className="font-display font-bold text-gray-600">Tu carrito está vacío</p>
              <p className="text-sm text-muted">Agregá productos desde el catálogo</p>
              <button
                onClick={cerrarCarrito}
                className="btn-primary text-sm py-2 px-6 mt-2"
              >
                Ver catálogo
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => {
                const key = item._key || item.id
                return (
                <div key={key} className="flex gap-3 items-start">
                  {/* Imagen */}
                  <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                    {item.imagen_url ? (
                      <img src={item.imagen_url} alt={item.nombre} className="w-full h-full object-cover" />
                    ) : (
                      <ShoppingBag size={20} className="text-gray-300" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-semibold text-sm text-gray-900 leading-tight line-clamp-2">
                      {item.nombre}
                    </p>
                    <p className="text-primary font-bold text-sm mt-0.5">
                      ${(item.precio * item.cantidad).toLocaleString('es-AR')}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => cambiarCantidad(key, item.cantidad - 1)}
                        className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-sm font-semibold w-4 text-center">{item.cantidad}</span>
                      <button
                        onClick={() => cambiarCantidad(key, item.cantidad + 1)}
                        className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Eliminar */}
                  <button
                    onClick={() => quitarItem(key)}
                    className="text-gray-300 hover:text-red-400 transition-colors mt-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer con total y botón */}
        {items.length > 0 && (
          <div className="border-t px-5 py-5 space-y-3 bg-white">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm">Subtotal</span>
              <span className="font-display font-black text-xl text-gray-900">
                ${subtotal.toLocaleString('es-AR')}
              </span>
            </div>
            <p className="text-xs text-muted">El costo de envío se calcula en el checkout</p>
            <Link
              to="/tienda/carrito"
              onClick={cerrarCarrito}
              className="btn-primary w-full justify-center py-3.5 text-base"
            >
              Finalizar compra <ArrowRight size={18} />
            </Link>
            <button
              onClick={cerrarCarrito}
              className="w-full text-center text-sm text-muted hover:text-primary transition-colors py-1"
            >
              Seguir comprando
            </button>
          </div>
        )}
      </div>
    </>
  )
}
