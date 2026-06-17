import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { TrendingUp, ShoppingBag, DollarSign, BarChart2, AlertTriangle, Package, Users, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const formatFecha = (d) => d.toISOString().split('T')[0]

function startOf(unit) {
  const d = new Date()
  if (unit === 'day') { d.setHours(0, 0, 0, 0) }
  if (unit === 'week') { d.setDate(d.getDate() - d.getDay()); d.setHours(0, 0, 0, 0) }
  if (unit === 'month') { d.setDate(1); d.setHours(0, 0, 0, 0) }
  return d.toISOString()
}

function getDaysRange(desde, hasta) {
  const days = []
  const start = new Date(desde)
  const end = new Date(hasta)
  while (start <= end) {
    days.push(formatFecha(new Date(start)))
    start.setDate(start.getDate() + 1)
  }
  return days
}

const VENTAS_DEMO = [
  { id: '1', numero: 1, cliente_nombre: 'María García', total: 11700, estado: 'entregado', mp_status: 'approved', created_at: new Date().toISOString(), items: [{ nombre: 'Pampers T2 x40', cantidad: 2, precio: 5850 }] },
  { id: '2', numero: 2, cliente_nombre: 'Juan Rodríguez', total: 7500, estado: 'confirmado', mp_status: 'approved', created_at: new Date(Date.now() - 86400000).toISOString(), items: [{ nombre: 'Toallitas Pequeñín x80', cantidad: 3, precio: 2500 }] },
  { id: '3', numero: 3, cliente_nombre: 'Ana López', total: 6100, estado: 'enviado', mp_status: 'approved', created_at: new Date(Date.now() - 172800000).toISOString(), items: [{ nombre: 'Pampers T3 x40', cantidad: 1, precio: 6100 }] },
  { id: '4', numero: 4, cliente_nombre: 'Laura Sánchez', total: 9200, estado: 'entregado', mp_status: 'approved', created_at: new Date(Date.now() - 259200000).toISOString(), items: [{ nombre: 'Huggies T2 x40', cantidad: 1, precio: 5200 }, { nombre: 'Crema Bepanthen 30g', cantidad: 1, precio: 4000 }] },
  { id: '5', numero: 5, cliente_nombre: 'Carlos Medina', total: 5200, estado: 'pendiente', mp_status: 'pending', created_at: new Date(Date.now() - 345600000).toISOString(), items: [{ nombre: 'Huggies T3 x36', cantidad: 1, precio: 5200 }] },
]

const STOCK_DEMO = [
  { id: '1', nombre: 'Pampers Etapas T2 x40', stock: 2, activo: true },
  { id: '2', nombre: 'Crema Bepanthen 30g', stock: 0, activo: true },
  { id: '3', nombre: 'Toallitas Pequeñín x80', stock: 1, activo: true },
]

function MetricCard({ icon: Icon, label, value, sub, color, bgColor }) {
  return (
    <div className="card p-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${bgColor}`}>
        <Icon size={20} className={color} />
      </div>
      <p className="text-xs text-muted mb-1 font-medium uppercase tracking-wide">{label}</p>
      <p className="font-display font-black text-2xl text-gray-900">{value}</p>
      {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
    </div>
  )
}

function MiniBarChart({ data }) {
  if (!data || data.length === 0) return null
  const max = Math.max(...data.map((d) => d.total), 1)
  const width = 100 / data.length

  return (
    <div className="flex items-end gap-0.5 h-20 w-full">
      {data.map((d, i) => {
        const height = Math.max((d.total / max) * 100, d.total > 0 ? 4 : 1)
        const isToday = d.fecha === formatFecha(new Date())
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
            <div
              className={`w-full rounded-t transition-all ${isToday ? 'bg-primary' : 'bg-primary/30 group-hover:bg-primary/50'}`}
              style={{ height: `${height}%` }}
            />
            {/* Tooltip */}
            {d.total > 0 && (
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:flex bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10 flex-col items-center">
                <span className="font-bold">${d.total.toLocaleString('es-AR')}</span>
                <span className="text-gray-300">{d.fecha.slice(5)}</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function AdminVentas() {
  const [pedidos, setPedidos] = useState([])
  const [stockCritico, setStockCritico] = useState([])
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState('30d')

  const periodos = {
    '7d': { label: '7 días', desde: formatFecha(new Date(Date.now() - 7 * 86400000)) },
    '30d': { label: '30 días', desde: formatFecha(new Date(Date.now() - 30 * 86400000)) },
    '90d': { label: '3 meses', desde: formatFecha(new Date(Date.now() - 90 * 86400000)) },
  }
  const hasta = formatFecha(new Date())
  const desde = periodos[periodo].desde

  useEffect(() => { cargar() }, [desde])
  useEffect(() => { cargarStock() }, [])

  async function cargar() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .gte('created_at', `${desde}T00:00:00`)
        .lte('created_at', `${hasta}T23:59:59`)
        .not('estado', 'eq', 'cancelado')
        .order('created_at', { ascending: false })
      if (error || !data) throw error
      setPedidos(data)
    } catch {
      setPedidos(VENTAS_DEMO)
    }
    setLoading(false)
  }

  async function cargarStock() {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('id, nombre, stock, activo')
        .lte('stock', 3)
        .eq('activo', true)
        .order('stock', { ascending: true })
        .limit(8)
      if (error || !data) throw error
      setStockCritico(data)
    } catch {
      setStockCritico(STOCK_DEMO)
    }
  }

  // Métricas
  const totalPeriodo = pedidos.reduce((acc, p) => acc + Number(p.total), 0)
  const pedidosHoy = pedidos.filter((p) => p.created_at >= startOf('day'))
  const totalHoy = pedidosHoy.reduce((acc, p) => acc + Number(p.total), 0)
  const pedidosSemana = pedidos.filter((p) => p.created_at >= startOf('week'))
  const totalSemana = pedidosSemana.reduce((acc, p) => acc + Number(p.total), 0)
  const ticketPromedio = pedidos.length ? Math.round(totalPeriodo / pedidos.length) : 0
  const pendientes = pedidos.filter((p) => p.estado === 'pendiente').length

  // Gráfico por día
  const dias = getDaysRange(desde, hasta)
  const ventasPorDia = dias.map((fecha) => ({
    fecha,
    total: pedidos
      .filter((p) => p.created_at.startsWith(fecha))
      .reduce((acc, p) => acc + Number(p.total), 0),
    cant: pedidos.filter((p) => p.created_at.startsWith(fecha)).length,
  }))

  // Más vendidos
  const conteo = {}
  pedidos.forEach((p) => {
    if (Array.isArray(p.items)) {
      p.items.forEach((item) => {
        if (!conteo[item.nombre]) conteo[item.nombre] = { cant: 0, ingresos: 0 }
        conteo[item.nombre].cant += item.cantidad || 1
        conteo[item.nombre].ingresos += (item.cantidad || 1) * (item.precio || 0)
      })
    }
  })
  const masVendidos = Object.entries(conteo)
    .sort((a, b) => b[1].cant - a[1].cant)
    .slice(0, 8)

  // Clientes únicos
  const clientesUnicos = new Set(pedidos.map((p) => p.cliente_telefono)).size

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {Object.entries(periodos).map(([key, { label }]) => (
            <button
              key={key}
              onClick={() => setPeriodo(key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                periodo === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={DollarSign} label="Hoy" value={`$${totalHoy.toLocaleString('es-AR')}`} sub={`${pedidosHoy.length} pedido${pedidosHoy.length !== 1 ? 's' : ''}`} bgColor="bg-pink-50" color="text-primary" />
        <MetricCard icon={TrendingUp} label="Esta semana" value={`$${totalSemana.toLocaleString('es-AR')}`} sub={`${pedidosSemana.length} pedido${pedidosSemana.length !== 1 ? 's' : ''}`} bgColor="bg-purple-50" color="text-secondary" />
        <MetricCard icon={ShoppingBag} label="Ticket promedio" value={`$${ticketPromedio.toLocaleString('es-AR')}`} sub={`en ${periodos[periodo].label}`} bgColor="bg-green-50" color="text-green-600" />
        <MetricCard icon={Users} label="Clientes" value={clientesUnicos} sub={`en ${periodos[periodo].label}`} bgColor="bg-blue-50" color="text-blue-600" />
      </div>

      {/* Pendientes alerta */}
      {pendientes > 0 && (
        <Link to="/admin/pedidos" className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-2xl px-5 py-3 mb-6 hover:bg-yellow-100 transition-colors">
          <div className="flex items-center gap-3">
            <AlertTriangle size={18} className="text-yellow-600" />
            <span className="text-sm font-semibold text-yellow-800">
              Tenés {pendientes} pedido{pendientes > 1 ? 's' : ''} pendiente{pendientes > 1 ? 's' : ''} sin confirmar
            </span>
          </div>
          <ArrowRight size={16} className="text-yellow-600" />
        </Link>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Gráfico de ventas */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-gray-800">Ventas por día</h2>
            <span className="text-xs text-muted">${totalPeriodo.toLocaleString('es-AR')} total</span>
          </div>
          {loading ? (
            <div className="h-20 flex items-center justify-center text-muted text-sm">Cargando...</div>
          ) : (
            <>
              <MiniBarChart data={ventasPorDia} />
              <div className="flex justify-between mt-2">
                <span className="text-xs text-muted">{desde.slice(5)}</span>
                <span className="text-xs text-muted">hoy</span>
              </div>
            </>
          )}
        </div>

        {/* Stock crítico */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-display font-bold text-gray-800">Stock crítico</h2>
            <Link to="/admin/stock" className="text-xs text-secondary hover:underline flex items-center gap-1">
              Ver todo <ArrowRight size={12} />
            </Link>
          </div>
          {stockCritico.length === 0 ? (
            <div className="p-6 text-center">
              <Package size={28} className="text-green-400 mx-auto mb-2" />
              <p className="text-sm text-muted">Stock OK en todos los productos</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {stockCritico.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-4 py-3">
                  <p className="text-sm text-gray-700 truncate flex-1 pr-2">{p.nombre}</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    p.stock === 0 ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {p.stock === 0 ? 'Sin stock' : `${p.stock} ud.`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Más vendidos */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-display font-bold text-gray-800">Más vendidos</h2>
          </div>
          {masVendidos.length === 0 ? (
            <div className="p-8 text-center text-muted text-sm">Sin datos en el período</div>
          ) : (
            <div className="p-4 space-y-3">
              {masVendidos.map(([nombre, { cant, ingresos }], i) => {
                const maxCant = masVendidos[0][1].cant
                return (
                  <div key={nombre}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">{i + 1}</span>
                        <p className="text-sm text-gray-700 truncate">{nombre}</p>
                      </div>
                      <span className="text-xs font-bold text-primary ml-2 shrink-0">{cant} ud.</span>
                    </div>
                    <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary/40 rounded-full" style={{ width: `${(cant / maxCant) * 100}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Últimas ventas */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-display font-bold text-gray-800">Últimas ventas</h2>
            <Link to="/admin/pedidos" className="text-xs text-secondary hover:underline flex items-center gap-1">
              Ver todos <ArrowRight size={12} />
            </Link>
          </div>
          {loading ? (
            <div className="p-8 text-center text-muted">Cargando...</div>
          ) : pedidos.length === 0 ? (
            <div className="p-8 text-center text-muted">Sin ventas en el período</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">#</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Cliente</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Total</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Estado</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pedidos.slice(0, 15).map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-mono text-gray-400 text-xs">#{String(p.numero).padStart(4, '0')}</td>
                    <td className="px-4 py-2.5 text-gray-700">{p.cliente_nombre}</td>
                    <td className="px-4 py-2.5 font-semibold text-gray-900">${Number(p.total).toLocaleString('es-AR')}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        p.estado === 'entregado' ? 'bg-green-100 text-green-700' :
                        p.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-700' :
                        p.estado === 'enviado' ? 'bg-indigo-100 text-indigo-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>{p.estado}</span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted whitespace-nowrap">
                      {new Date(p.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
