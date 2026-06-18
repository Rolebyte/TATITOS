import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function BarraPromo() {
  const [promo, setPromo] = useState(null)
  const [cerrada, setCerrada] = useState(false)

  useEffect(() => {
    supabase
      .from('promos')
      .select('*')
      .eq('tipo', 'barra')
      .eq('activo', true)
      .single()
      .then(({ data }) => { if (data) setPromo(data) })
  }, [])

  if (!promo || cerrada) return null

  return (
    <div className={`w-full py-2 px-4 flex items-center justify-center gap-3 text-white text-sm font-semibold relative ${
      promo.color === 'primary' ? 'bg-primary' :
      promo.color === 'verde' ? 'bg-green-500' :
      promo.color === 'amarillo' ? 'bg-amber-400 text-gray-900' :
      promo.color === 'oscuro' ? 'bg-gray-900' : 'bg-primary'
    }`}>
      <span className="text-center">{promo.mensaje}</span>
      <button
        onClick={() => setCerrada(true)}
        className="absolute right-3 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100 transition-opacity"
      >
        <X size={16} />
      </button>
    </div>
  )
}
