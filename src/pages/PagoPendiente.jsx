import { Link } from 'react-router-dom'
import useSEO from '../hooks/useSEO'

export default function PagoPendiente() {
  useSEO({ titulo: 'Pago pendiente', descripcion: 'Tu pago está siendo procesado. Tatitos Pañalera.' })
  const WA = import.meta.env.VITE_WHATSAPP_NUMBER || '5493492710605'

  return (
    <div className="min-h-screen bg-light flex items-center justify-center px-4">
      <style>{`
        @keyframes pulse-in {
          0%   { transform: scale(0); opacity: 0; }
          60%  { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); }
        }
        @keyframes spin-slow {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fade-up {
          0%   { opacity: 0; transform: translateY(16px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .anim-pulse-in { animation: pulse-in 0.5s cubic-bezier(.36,.07,.19,.97) forwards; }
        .anim-spin { animation: spin-slow 2s linear infinite; }
        .anim-fade-up { animation: fade-up 0.5s ease forwards; }
      `}</style>

      <div className="max-w-md w-full text-center">
        <div className="card p-10">

          <div className="flex justify-center mb-6">
            <div className="anim-pulse-in w-24 h-24 rounded-full bg-amber-100 flex items-center justify-center">
              <svg className="anim-spin" width="48" height="48" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="20" stroke="#f59e0b" strokeWidth="3" strokeDasharray="90 30" strokeLinecap="round" opacity="0.8" />
                <circle cx="24" cy="8" r="4" fill="#f59e0b" />
              </svg>
            </div>
          </div>

          <div className="anim-fade-up" style={{ animationDelay: '0.4s', opacity: 0 }}>
            <h1 className="font-display text-2xl font-black text-gray-900 mb-2">
              Pago en proceso ⏳
            </h1>
            <p className="text-gray-600 mb-2">
              Tu pago está siendo verificado por MercadoPago.
            </p>
            <p className="text-sm text-muted mb-8">
              Cuando se confirme te avisamos por WhatsApp. Esto puede tardar unos minutos.
            </p>
            <div className="flex flex-col gap-3">
              <Link to="/tienda" className="btn-primary justify-center">
                Volver al catálogo
              </Link>
              <a
                href={`https://wa.me/${WA}?text=Hola%20Tatitos%2C%20hice%20un%20pago%20que%20qued%C3%B3%20pendiente%20y%20quiero%20consultarlo`}
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
    </div>
  )
}
