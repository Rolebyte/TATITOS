import { Link } from 'react-router-dom'
import { Clock } from 'lucide-react'
import useSEO from '../hooks/useSEO'

export default function PagoPendiente() {
  useSEO({ titulo: 'Pago pendiente', descripcion: 'Tu pago esta siendo procesado. Tatitos Panalera.' })
  return (
    <div className="min-h-screen bg-light flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="card p-10">
          <Clock size={64} className="text-yellow-500 mx-auto mb-4" />
          <h1 className="font-display text-2xl font-black text-gray-900 mb-2">Pago pendiente</h1>
          <p className="text-muted mb-6">
            Tu pago está siendo procesado. Cuando se confirme, recibirás un mensaje por WhatsApp.
          </p>
          <div className="flex flex-col gap-3">
            <Link to="/tienda" className="btn-primary justify-center">Volver al catálogo</Link>
            <a
              href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER || '5493492000000'}?text=Hola%20Tatitos%2C%20tengo%20un%20pago%20pendiente`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary justify-center"
            >
              Consultar por WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
