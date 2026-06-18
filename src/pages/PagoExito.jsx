import { useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import useCarritoStore from '../store/carritoStore'

export default function PagoExito() {
  const [params] = useSearchParams()
  const paymentId = params.get('payment_id')
  const vaciarCarrito = useCarritoStore((s) => s.vaciarCarrito)

  useEffect(() => { vaciarCarrito() }, [])

  return (
    <div className="min-h-screen bg-light flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="card p-10">
          <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
          <h1 className="font-display text-2xl font-black text-gray-900 mb-2">¡Pago exitoso!</h1>
          <p className="text-muted mb-2">Tu pedido fue recibido y lo estamos preparando.</p>
          {paymentId && (
            <p className="text-xs text-gray-400 mb-6">ID de pago: {paymentId}</p>
          )}
          <p className="text-sm text-gray-600 mb-8">
            Te contactaremos por WhatsApp con el seguimiento. Si tenés dudas escribinos.
          </p>
          <div className="flex flex-col gap-3">
            <Link to="/tienda" className="btn-primary justify-center">
              Seguir comprando
            </Link>
            <a
              href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER || '5493492000000'}?text=Hola%20Tatitos%2C%20hice%20un%20pedido%20y%20quiero%20consultarlo`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary justify-center"
            >
              Contactar por WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
