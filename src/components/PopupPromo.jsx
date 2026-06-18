import { useState, useEffect } from 'react'
import { X, Tag } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function extraerCupon(mensaje) {
  const match = mensaje?.match(/\b([A-Z][A-Z0-9\-]{3,})\b/)
  return match ? match[1] : null
}

export default function PopupPromo() {
  const [promo, setPromo] = useState(null)
  const [visible, setVisible] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (sessionStorage.getItem('popup-cerrado')) return
    supabase
      .from('promos')
      .select('*')
      .eq('tipo', 'popup')
      .eq('activo', true)
      .single()
      .then(({ data }) => {
        if (data) {
          setPromo(data)
          setTimeout(() => setVisible(true), 4000)
        }
      })
  }, [])

  const cerrar = () => {
    setVisible(false)
    sessionStorage.setItem('popup-cerrado', '1')
  }

  const usarDescuento = () => {
    cerrar()
    const cupon = extraerCupon(promo.mensaje)
    if (cupon) {
      sessionStorage.setItem('cupon-pendiente', cupon)
      window.dispatchEvent(new Event('cupon-pendiente'))
    }
    navigate('/tienda')
  }

  if (!promo || !visible) return null

  const cupon = extraerCupon(promo.mensaje)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className={`px-6 pt-8 pb-6 text-center ${
          promo.color === 'primary' ? 'bg-gradient-to-b from-pink-50 to-white' :
          promo.color === 'verde' ? 'bg-gradient-to-b from-green-50 to-white' :
          promo.color === 'amarillo' ? 'bg-gradient-to-b from-amber-50 to-white' :
          promo.color === 'oscuro' ? 'bg-gradient-to-b from-gray-100 to-white' :
          'bg-gradient-to-b from-pink-50 to-white'
        }`}>
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Tag size={28} className="text-primary" />
          </div>
          <h2 className="font-display font-black text-2xl text-gray-900 mb-3">
            ¡Bienvenido a Tatitos!
          </h2>
          <p className="text-gray-600 leading-relaxed text-sm">
            {promo.mensaje}
          </p>
          {cupon && (
            <div className="mt-4 inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full">
              <Tag size={14} />
              <span className="font-display font-bold tracking-wide text-sm">{cupon}</span>
            </div>
          )}
        </div>

        <div className="px-6 pb-6 pt-4 flex flex-col gap-2">
          <button
            onClick={usarDescuento}
            className="btn-primary w-full justify-center py-3"
          >
            {cupon ? `Usar descuento ${cupon} →` : 'Ver productos →'}
          </button>
          <button
            onClick={cerrar}
            className="text-xs text-muted hover:text-gray-600 transition-colors py-1"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
