import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Package, CheckCircle, Clock, Truck, XCircle, ShoppingBag } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import useSEO from '../hooks/useSEO'

const ESTADO_INFO = {
  pendiente:   { label: 'Pendiente',   color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  confirmado:  { label: 'Confirmado',  color: 'bg-blue-100 text-blue-700',     icon: CheckCircle },
  preparando:  { label: 'Preparando',  color: 'bg-purple-100 text-purple-700', icon: Package },
  enviado:     { label: 'En camino',   color: 'bg-indigo-100 text-indigo-700', icon: Truck },
  entregado:   { label: 'Entregado',   color: 'bg-green-100 text-green-700',   icon: CheckCircle },
  cancelado:   { label: 'Cancelado',   color: 'bg-red-100 text-red-700',       icon: XCircle },
}

export default function MisPedidos() {
  useSEO({ titulo: 'Mis pedidos', descripcion: 'Consulta el estado de tus pedidos en Tatitos Panalera.', url: '/mis-pedidos' })

  const [telefono, setTelefono] = useState('')
  const [pedidos, setPedidos] = useState(null)
  const [loading, setLoading] = useState(false)
  const [buscado, setBuscado] = useState(false)

  const buscar = async (e) => {
    e.preventDefault()
    const tel = telefono.trim().replace(/[\s\-+]/g, '')
    if (!tel) return
    setLoading(true)
    setBuscado(false)

    const { data } = await supabase
      .from('pedidos')
      .select('*')
      .eq('cliente_telefono', tel)
      .order('created_at', { ascending: false })
      .limit(20)

    setPedidos(data || [])
    setBuscado(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16 max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <ShoppingBag size={40} className="text-primary mx-auto mb-3" />
          <h1 className="font-display text-3xl font-black text-gray-900 mb-2">Mis pedidos</h1>
          <p className="text-muted text-sm">Ingresa tu numero de WhatsApp para ver el estado de tus compras</p>
        </div>

        <form onSubmit={buscar} className="flex gap-2 mb-8">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="Ej: 3492123456"
              className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <button type="submit" disabled={loading || !telefono.trim()} className="btn-primary px-6 disabled:opacity-50">
            {loading ? '...' : 'Buscar'}
          </button>
        </form>

        {buscado && pedidos.length === 0 && (
          <div className="text-center py-16 text-muted">
            <Package size={48} className="mx-auto mb-3 text-gray-300" />
            <p className="font-display font-semibold text-gray-700 mb-1">No encontramos pedidos</p>
            <p className="text-sm">Verifica que el numero sea el mismo que usaste al comprar</p>
          </div>
        )}

        {pedidos && pedidos.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-muted">{pedidos.length} pedido{pedidos.length !== 1 ? 's' : ''} encontrado{pedidos.length !== 1 ? 's' : ''}</p>
            {pedidos.map((p) => {
              const estado = ESTADO_INFO[p.estado] || ESTADO_INFO.pendiente
              const Icon = estado.icon
              return (
                <div key={p.id} className="card p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="font-display font-bold text-gray-900">
                        Pedido #{String(p.numero).padStart(4, '0')}
                      </p>
                      <p className="text-xs text-muted">
                        {new Date(p.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${estado.color}`}>
                      <Icon size={12} />
                      {estado.label}
                    </span>
                  </div>

                  <div className="border-t pt-3 space-y-1">
                    {Array.isArray(p.items) && p.items.map((item, i) => (
                      <p key={i} className="text-sm text-gray-600">
                        {item.nombre} <span className="text-muted">x{item.cantidad}</span>
                      </p>
                    ))}
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <div className="text-xs text-muted capitalize">{p.tipo_entrega === 'domicilio' ? 'Envio a domicilio' : p.tipo_entrega === 'retiro' ? 'Retiro' : 'Envio a localidad'}</div>
                    <p className="font-display font-black text-lg text-primary">
                      ${Number(p.total).toLocaleString('es-AR')}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="text-center mt-10">
          <Link to="/tienda" className="text-sm text-muted hover:text-primary">Ir al catalogo →</Link>
        </div>
      </div>
      <Footer />
    </div>
  )
}
