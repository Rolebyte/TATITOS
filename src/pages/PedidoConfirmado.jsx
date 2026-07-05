import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import useSEO from '../hooks/useSEO'

export default function PedidoConfirmado() {
  useSEO({ titulo: 'Pedido recibido', descripcion: 'Tu pedido fue recibido. Tatitos Pañalera.' })
  const WA = import.meta.env.VITE_WHATSAPP_NUMBER || '5493492710605'

  useEffect(() => {
    if (window.fbq) window.fbq('track', 'Purchase', { currency: 'ARS', value: 0 })
  }, [])

  return (
    <div className="min-h-screen bg-light flex items-center justify-center px-4">
      <style>{`
        @keyframes pop-in {
          0%   { transform: scale(0); opacity: 0; }
          70%  { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); }
        }
        @keyframes check-draw {
          0%   { stroke-dashoffset: 100; }
          100% { stroke-dashoffset: 0; }
        }
        .anim-pop { animation: pop-in 0.5s cubic-bezier(.36,.07,.19,.97) forwards; }
        .anim-check { stroke-dasharray: 100; animation: check-draw 0.4s 0.4s ease forwards; stroke-dashoffset: 100; }
        @keyframes fade-up {
          0%   { opacity: 0; transform: translateY(16px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .anim-fade-up { animation: fade-up 0.5s ease forwards; }
      `}</style>

      <div className="max-w-md w-full text-center">
        <div className="card p-10">

          <div className="flex justify-center mb-6">
            <div className="anim-pop w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
              <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
                <circle cx="26" cy="26" r="25" stroke="#22c55e" strokeWidth="2" fill="none" opacity="0.3" />
                <polyline
                  className="anim-check"
                  points="14,27 22,35 38,18"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          <div className="anim-fade-up" style={{ animationDelay: '0.6s', opacity: 0 }}>
            <h1 className="font-display text-2xl font-black text-gray-900 mb-2">
              ¡Pedido recibido! 🎉
            </h1>
            <p className="text-gray-600 mb-1">
              Gracias por confiar en <strong>Tatitos Pañalera</strong>.
            </p>
            <p className="text-sm text-muted mb-6">
              En breve nos comunicamos por WhatsApp para confirmar y coordinar la entrega. 💕
            </p>
            <div className="flex flex-col gap-3">
              <Link to="/tienda" className="btn-primary justify-center">
                Seguir comprando
              </Link>
              <a
                href={`https://wa.me/${WA}?text=Hola%20Tatitos%2C%20acabo%20de%20hacer%20un%20pedido%20y%20quiero%20consultarlo`}
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
