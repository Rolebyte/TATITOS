import { Link } from 'react-router-dom'
import { XCircle } from 'lucide-react'

export default function PagoError() {
  return (
    <div className="min-h-screen bg-light flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="card p-10">
          <XCircle size={64} className="text-red-500 mx-auto mb-4" />
          <h1 className="font-display text-2xl font-black text-gray-900 mb-2">Error en el pago</h1>
          <p className="text-muted mb-6">
            El pago no pudo completarse. Podés intentarlo de nuevo o contactarnos.
          </p>
          <div className="flex flex-col gap-3">
            <Link to="/tienda/carrito" className="btn-primary justify-center">Intentar de nuevo</Link>
            <a
              href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER || '5493492000000'}?text=Hola%20Tatitos%2C%20tuve%20un%20problema%20con%20el%20pago`}
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
