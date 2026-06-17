import { useState, useEffect } from 'react'
import { Users, Search, Phone, Mail, MapPin, TrendingUp, ShoppingBag } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function AdminClientes() {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    cargar()
  }, [])

  async function cargar() {
    setLoading(true)
    const { data } = await supabase
      .from('clientes')
      .select('*')
      .order('total_consumido', { ascending: false })
    if (data) setClientes(data)
    setLoading(false)
  }

  const filtrados = clientes.filter((c) => {
    const q = busqueda.toLowerCase()
    return (
      c.nombre?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.ciudad?.toLowerCase().includes(q) ||
      c.telefono?.includes(q)
    )
  })

  const totalConsumo = clientes.reduce((s, c) => s + (c.total_consumido || 0), 0)
  const conCompras = clientes.filter((c) => c.cantidad_compras > 0).length
  const topCliente = clientes[0]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-500 mt-0.5">{clientes.length} clientes importados de Tienda Nube</p>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-1">
            <Users size={18} className="text-primary" />
            <span className="text-sm text-gray-500">Total clientes</span>
          </div>
          <p className="text-3xl font-display font-black text-gray-900">{clientes.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-1">
            <ShoppingBag size={18} className="text-secondary" />
            <span className="text-sm text-gray-500">Con compras</span>
          </div>
          <p className="text-3xl font-display font-black text-gray-900">{conCompras}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-1">
            <TrendingUp size={18} className="text-green-500" />
            <span className="text-sm text-gray-500">Total facturado</span>
          </div>
          <p className="text-2xl font-display font-black text-gray-900">
            ${totalConsumo.toLocaleString('es-AR')}
          </p>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nombre, email, ciudad o teléfono..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Cargando...</div>
        ) : filtrados.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No se encontraron clientes</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-5 py-3">Cliente</th>
                <th className="px-5 py-3">Contacto</th>
                <th className="px-5 py-3">Ubicación</th>
                <th className="px-5 py-3 text-right">Compras</th>
                <th className="px-5 py-3 text-right">Total gastado</th>
                <th className="px-5 py-3">Última compra</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtrados.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                        {c.nombre?.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900">{c.nombre}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-col gap-0.5">
                      {c.email && (
                        <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 text-gray-500 hover:text-primary transition-colors">
                          <Mail size={12} /> {c.email}
                        </a>
                      )}
                      {c.telefono && (
                        <a href={`https://wa.me/${c.telefono.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-gray-500 hover:text-green-600 transition-colors">
                          <Phone size={12} /> {c.telefono}
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    {(c.ciudad || c.provincia) && (
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <MapPin size={12} />
                        {[c.ciudad, c.provincia].filter(Boolean).join(', ')}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className={`font-semibold ${c.cantidad_compras > 0 ? 'text-gray-900' : 'text-gray-300'}`}>
                      {c.cantidad_compras}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className={`font-display font-bold ${c.total_consumido > 0 ? 'text-gray-900' : 'text-gray-300'}`}>
                      ${(c.total_consumido || 0).toLocaleString('es-AR')}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">
                    {c.ultima_compra
                      ? new Date(c.ultima_compra + 'T00:00:00').toLocaleDateString('es-AR')
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
