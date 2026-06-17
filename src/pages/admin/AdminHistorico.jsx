import { useState, useEffect } from 'react'
import { History, Search, ChevronDown, ChevronUp, Package } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function AdminHistorico() {
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [expandido, setExpandido] = useState(null)

  useEffect(() => {
    async function cargar() {
      const { data } = await supabase
        .from('pedidos_historicos')
        .select('*')
        .order('created_at', { ascending: false })
      if (data) setPedidos(data)
      setLoading(false)
    }
    cargar()
  }, [])

  const filtrados = pedidos.filter((p) => {
    const q = busqueda.toLowerCase()
    return (
      p.cliente_nombre?.toLowerCase().includes(q) ||
      p.cliente_email?.toLowerCase().includes(q) ||
      p.numero?.toString().includes(q) ||
      p.items?.some((i) => i.nombre?.toLowerCase().includes(q))
    )
  })

  const totalFacturado = pedidos.reduce((s, p) => s + (p.total || 0), 0)

  const estadoBadge = (estado) => {
    const map = {
      completado: 'bg-green-100 text-green-700',
      enviado: 'bg-blue-100 text-blue-700',
      pendiente: 'bg-yellow-100 text-yellow-700',
    }
    return map[estado] || 'bg-gray-100 text-gray-600'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Historial Tienda Nube</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {pedidos.length} pedidos importados · Total facturado: ${totalFacturado.toLocaleString('es-AR')}
          </p>
        </div>
        <span className="flex items-center gap-2 text-xs bg-gray-100 text-gray-500 px-3 py-1.5 rounded-full">
          <History size={13} />
          Datos de Tienda Nube
        </span>
      </div>

      {/* Buscador */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nombre, email, nº de pedido o producto..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Cargando...</div>
        ) : filtrados.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No se encontraron pedidos</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-5 py-3">Pedido</th>
                <th className="px-5 py-3">Cliente</th>
                <th className="px-5 py-3">Productos</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3">Pago</th>
                <th className="px-5 py-3 text-right">Total</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtrados.map((p) => (
                <>
                  <tr
                    key={p.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setExpandido(expandido === p.id ? null : p.id)}
                  >
                    <td className="px-5 py-3">
                      <div className="font-mono font-bold text-gray-900">#{p.numero}</div>
                      <div className="text-xs text-gray-400">
                        {p.created_at
                          ? new Date(p.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })
                          : '—'}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-900">{p.cliente_nombre || '—'}</div>
                      <div className="text-xs text-gray-400">{p.cliente_email}</div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Package size={13} />
                        <span>{p.items?.length ?? 0} producto{p.items?.length !== 1 ? 's' : ''}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${estadoBadge(p.estado)}`}>
                        {p.estado}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-500">{p.medio_pago || '—'}</td>
                    <td className="px-5 py-3 text-right font-display font-bold text-gray-900">
                      ${(p.total || 0).toLocaleString('es-AR')}
                      {p.descuento > 0 && (
                        <div className="text-xs text-red-400 font-normal">-${p.descuento.toLocaleString('es-AR')}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {expandido === p.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </td>
                  </tr>
                  {expandido === p.id && (
                    <tr key={`${p.id}-detail`} className="bg-gray-50">
                      <td colSpan={7} className="px-8 py-3">
                        <div className="space-y-1.5">
                          {p.items?.map((item, i) => (
                            <div key={i} className="flex justify-between text-sm">
                              <span className="text-gray-700">{item.nombre}</span>
                              <span className="text-gray-500">
                                {item.cantidad > 1 && <span className="mr-2 text-xs">x{item.cantidad}</span>}
                                ${(item.precio * item.cantidad).toLocaleString('es-AR')}
                              </span>
                            </div>
                          ))}
                          {p.costo_envio > 0 && (
                            <div className="flex justify-between text-xs text-gray-400 pt-1 border-t">
                              <span>Envío</span>
                              <span>${p.costo_envio.toLocaleString('es-AR')}</span>
                            </div>
                          )}
                          {(p.ciudad || p.provincia) && (
                            <div className="text-xs text-gray-400 pt-1">
                              📍 {[p.ciudad, p.provincia].filter(Boolean).join(', ')}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
