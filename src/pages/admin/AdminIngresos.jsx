import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Package, TrendingUp, BarChart2, Calendar, Search, ChevronDown } from 'lucide-react'

const formatFecha = (iso) =>
  new Date(iso).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const formatFechaCorta = (iso) =>
  new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })

export default function AdminIngresos() {
  const [ingresos, setIngresos] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [desde, setDesde] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0]
  })
  const [hasta, setHasta] = useState(() => new Date().toISOString().split('T')[0])

  useEffect(() => { cargar() }, [desde, hasta])

  async function cargar() {
    setLoading(true)
    const { data } = await supabase
      .from('ingresos_stock')
      .select('*')
      .gte('created_at', `${desde}T00:00:00`)
      .lte('created_at', `${hasta}T23:59:59`)
      .order('created_at', { ascending: false })
    setIngresos(data || [])
    setLoading(false)
  }

  const filtrados = ingresos.filter((i) => {
    if (!busqueda) return true
    const q = busqueda.toLowerCase()
    return (
      i.nombre_producto?.toLowerCase().includes(q) ||
      i.marca?.toLowerCase().includes(q) ||
      i.proveedor?.toLowerCase().includes(q) ||
      i.ean?.includes(q)
    )
  })

  // Métricas del período
  const totalUnidades = filtrados.reduce((a, i) => a + i.cantidad, 0)
  const totalProductos = new Set(filtrados.map((i) => i.nombre_producto)).size
  const proveedoresUnicos = new Set(filtrados.map((i) => i.proveedor).filter(Boolean)).size

  // Agrupar por día para el reporte ordenado
  const porDia = filtrados.reduce((acc, i) => {
    const dia = i.created_at.split('T')[0]
    if (!acc[dia]) acc[dia] = []
    acc[dia].push(i)
    return acc
  }, {})
  const diasOrdenados = Object.keys(porDia).sort((a, b) => b.localeCompare(a))

  // Productos más ingresados
  const rankingProductos = Object.entries(
    filtrados.reduce((acc, i) => {
      const key = i.nombre_producto
      acc[key] = (acc[key] || 0) + i.cantidad
      return acc
    }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 5)

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <BarChart2 size={24} className="text-primary" />
        <h1 className="font-display text-2xl font-bold text-gray-900">Ingresos de stock</h1>
      </div>

      {/* Filtros */}
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Desde</label>
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Hasta</label>
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex-1 min-w-40">
            <label className="block text-xs font-semibold text-gray-500 mb-1">Buscar</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Producto, marca, proveedor, EAN..."
                className="w-full pl-8 pr-3 border border-gray-200 rounded-xl py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          <div className="flex gap-2">
            {[
              { label: 'Hoy', days: 0 },
              { label: '7 días', days: 7 },
              { label: '30 días', days: 30 },
              { label: '3 meses', days: 90 },
            ].map(({ label, days }) => (
              <button
                key={label}
                onClick={() => {
                  const d = new Date()
                  d.setDate(d.getDate() - days)
                  setDesde(d.toISOString().split('T')[0])
                  setHasta(new Date().toISOString().split('T')[0])
                }}
                className="px-3 py-2 text-xs font-semibold bg-gray-100 hover:bg-primary hover:text-white rounded-xl transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-xs text-muted uppercase tracking-wide font-medium mb-1">Unidades ingresadas</p>
          <p className="font-display font-black text-2xl text-gray-900">{totalUnidades}</p>
          <p className="text-xs text-muted mt-0.5">en {filtrados.length} movimientos</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-muted uppercase tracking-wide font-medium mb-1">Productos distintos</p>
          <p className="font-display font-black text-2xl text-gray-900">{totalProductos}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-muted uppercase tracking-wide font-medium mb-1">Proveedores</p>
          <p className="font-display font-black text-2xl text-gray-900">{proveedoresUnicos || '—'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Reporte por día */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="card p-8 text-center text-muted">Cargando...</div>
          ) : diasOrdenados.length === 0 ? (
            <div className="card p-12 text-center">
              <Package size={40} className="text-gray-200 mx-auto mb-3" />
              <p className="text-muted text-sm">Sin ingresos en el período seleccionado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {diasOrdenados.map((dia) => {
                const items = porDia[dia]
                const totalDia = items.reduce((a, i) => a + i.cantidad, 0)
                return (
                  <div key={dia} className="card overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400" />
                        <span className="font-semibold text-sm text-gray-800">{formatFechaCorta(dia)}</span>
                      </div>
                      <span className="text-xs font-bold text-primary bg-pink-50 px-2.5 py-1 rounded-full">
                        +{totalDia} unidades · {items.length} ingreso{items.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {items.map((i) => (
                        <div key={i.id} className="px-4 py-3 flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-sm text-gray-900">{i.nombre_producto}</p>
                              {i.marca && (
                                <span className="text-xs text-muted">{i.marca}</span>
                              )}
                              {i.ean && (
                                <span className="text-xs text-gray-400 font-mono">{i.ean}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                              {i.proveedor && (
                                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium">
                                  {i.proveedor}
                                </span>
                              )}
                              {i.precio_venta > 0 && (
                                <span className="text-xs text-gray-500">
                                  ${Number(i.precio_venta).toLocaleString('es-AR')} c/u
                                </span>
                              )}
                              {i.notas && (
                                <span className="text-xs text-gray-400 italic">{i.notas}</span>
                              )}
                              <span className="text-xs text-gray-400">
                                {new Date(i.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <span className="font-display font-black text-lg text-primary">+{i.cantidad}</span>
                            <p className="text-xs text-muted">ud.</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Ranking productos más ingresados */}
        <div>
          <div className="card overflow-hidden">
            <div className="flex items-center gap-2 p-4 border-b">
              <TrendingUp size={16} className="text-primary" />
              <h2 className="font-display font-bold text-gray-800 text-sm">Más ingresados</h2>
            </div>
            {rankingProductos.length === 0 ? (
              <div className="p-6 text-center text-muted text-sm">Sin datos</div>
            ) : (
              <div className="p-4 space-y-3">
                {rankingProductos.map(([nombre, cant], i) => {
                  const max = rankingProductos[0][1]
                  return (
                    <div key={nombre}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                            {i + 1}
                          </span>
                          <p className="text-xs text-gray-700 truncate">{nombre}</p>
                        </div>
                        <span className="text-xs font-bold text-primary ml-2 shrink-0">{cant} ud.</span>
                      </div>
                      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary/40 rounded-full"
                          style={{ width: `${(cant / max) * 100}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
