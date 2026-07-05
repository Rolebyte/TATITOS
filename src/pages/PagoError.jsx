import { Link } from 'react-router-dom'
import useSEO from '../hooks/useSEO'

export default function PagoError() {
  useSEO({ titulo: 'Error en el pago', descripcion: 'Hubo un problema con tu pago. Tatitos Pañalera.' })
  const WA = import.meta.env.VITE_WHATSAPP_NUMBER || '5493492710605'

  return (
    <div className="min-h-screen bg-light flex items-center justify-center px-4">
      <style>{`
        @keyframes shake-in {
          0%   { transform: scale(0); opacity: 0; }
          60%  { transform: scale(1.1); opacity: 1; }
          80%  { transform: scale(0.95); }
          100% { transform: scale(1); }
        }
        @keyframes fade-up {
          0%   { opacity: 0; transform: translateY(16px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .anim-shake { animation: shake-in 0.5s cubic-bezier(.36,.07,.19,.97) forwards; }
        .anim-fade-up { animation: fade-up 0.5s ease forwards; }
      `}</style>

      <div className="max-w-md w-full text-center">
        <div className="card p-10">

          <div className="flex justify-center mb-6">
            <div className="anim-shake w-24 h-24 rounded-full bg-red-100 flex items-center justify-center">
              <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
                <circle cx="26" cy="26" r="25" stroke="#ef4444" strokeWidth="2" fill="none" opacity="0.3" />
                <line x1="17" y1="17" x2="35" y2="35" stroke="#ef4444" strokeWidth="3.5" strokeLinecap="round" />
                <line x1="35" y1="17" x2="17" y2="35" stroke="#ef4444" strokeWidth="3.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          <div className="anim-fade-up" style={{ animationDelay: '0.4s', opacity: 0 }}>
            <h1 className="font-display text-2xl font-black text-gray-900 mb-2">
              El pago no se completó
            </h1>
            <p className="text-gray-600 mb-2">
              Hubo un problema al procesar tu pago en MercadoPago.
            </p>
            <p className="text-sm text-muted mb-8">
              Tu carrito sigue guardado. Podés intentarlo de nuevo o elegir otro medio de pago.
            </p>
            <div className="flex flex-col gap-3">
              <Link to="/tienda/carrito" className="btn-primary justify-center">
                Volver al carrito
              </Link>
              <a
                href={`https://wa.me/${WA}?text=Hola%20Tatitos%2C%20tuve%20un%20problema%20con%20el%20pago%20y%20quiero%20coordinar%20de%20otra%20forma`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary justify-center"
              >
                Pagar por otro medio
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
