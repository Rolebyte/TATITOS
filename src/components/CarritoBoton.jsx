import { ShoppingCart } from 'lucide-react'
import useCarritoStore from '../store/carritoStore'
import useUiStore from '../store/uiStore'

export default function CarritoBoton() {
  const items = useCarritoStore((s) => s.items)
  const abrirCarrito = useUiStore((s) => s.abrirCarrito)
  const total = items.reduce((acc, i) => acc + i.cantidad, 0)

  if (total === 0) return null

  return (
    <button
      onClick={abrirCarrito}
      className="fixed bottom-6 right-6 z-40 bg-primary text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg hover:bg-pink-500 transition-colors"
    >
      <ShoppingCart size={24} />
      <span className="absolute -top-1 -right-1 bg-accent text-dark font-bold text-xs w-6 h-6 rounded-full flex items-center justify-center">
        {total > 99 ? '99+' : total}
      </span>
    </button>
  )
}
