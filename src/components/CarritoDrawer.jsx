import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight, Tag } from 'lucide-react'
import useCarritoStore from '../store/carritoStore'
import useUiStore from '../store/uiStore'
import { supabase } from '../lib/supabase'

export default function CarritoDrawer() {
  const { items, quitarItem, cambiarCantidad } = useCarritoStore()
  const { carritoAbierto, cerrarCarrito } = useUiStore()
  const [cupon, setCupon] = useState(null)

  const subtotal = items.reduce((acc, i) => acc + i.precio * i.cantidad, 0)
  const totalItems = items.reduce((acc, i) => acc + i.cantidad, 0)

  const descuento = cupon
    ? cupon.tipo === 'porcentaje'
      ? Math.round(subtotal * cupon.valor / 100)
      : Math.min(cupon.valor, subtotal)
    : 0
  const total = subtotal - descuento

  // Leer cupón pendiente de sessionStorage (y escuchar cambios)
  const cargarCupon = () => {
    const codigo = sessionStorage.getItem('cupon-pendiente')
    if (!codigo) return
    supabase.from('cupones').select('*').eq('codigo', codigo.toUpperCase()).eq('activo', true).single()
      .then(({ data }) => { if (data) setCupon(data) })
  }

  useEffect(() => {
    cargarCupon()
    window.addEventListener('cupon-pendiente', cargarCupon)
    return () => window.removeEventListener('cupon-pendiente', cargarCupon)
  }, [])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') cerrarCarrito() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    document.body.style.overflow = carritoAbierto ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [carritoAbierto])

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 z-50 transition-opacity duration-300 ${
          carritoAbierto ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={cerrarCarrito}
      />

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

        {/* Cupón activo */}
        {cupon && items.length > 0 && (
          <div className="mx-5 mt-3 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
            <Tag size={13} className="text-green-600 shrink-0" />
            <p className="text-xs text-green-700 font-semibold flex-1">
              Cupón <span className="font-display tracking-wide">{cupon.codigo}</span> aplicado
              {' — '}
              {cupon.tipo === 'porcentaje' ? `${cupon.valor}% off` : `$${cupon.valor.toLocaleString('es-AR')} off`}
            </p>
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <ShoppingBag size={56} className="text-gray-200" />
              <p className="font-display font-bold text-gray-600">Tu carrito está vacío</p>
              <p className="text-sm text-muted">Agregá productos desde el catálogo</p>
              <button onClick={cerrarCarrito} className="btn-primary text-sm py-2 px-6 mt-2">
                Ver catálogo
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => {
                const key = item._key || item.id
                return (
                  <div key={key} className="flex gap-3 items-start">
                    <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                      {item.imagen_url ? (
                        <img src={item.imagen_url} alt={item.nombre} className="w-full h-full object-cover" />
                      ) : (
                        <ShoppingBag size={20} className="text-gray-300" />
                      )}
                    </div>
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

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t px-5 py-5 space-y-2 bg-white">
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>Subtotal</span>
              <span>${subtotal.toLocaleString('es-AR')}</span>
            </div>
            {cupon && descuento > 0 && (
              <div className="flex justify-between items-center text-sm text-green-600 font-semibold">
                <span>Descuento ({cupon.codigo})</span>
                <span>− ${descuento.toLocaleString('es-AR')}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-1 border-t">
              <span className="text-gray-700 font-semibold text-sm">Total estimado</span>
              <span className="font-display font-black text-xl text-gray-900">
                ${total.toLocaleString('es-AR')}
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
