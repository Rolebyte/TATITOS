import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { MessageCircle, RefreshCw, Download, Bell, Bike, Copy, X, AlertTriangle, Trash2 } from 'lucide-react'

const ESTADOS = ['pendiente', 'confirmado', 'preparando', 'enviado', 'entregado', 'cancelado']
const TABS = ['Todos', 'pendiente', 'confirmado', 'preparando', 'enviado', 'entregado', 'cancelado']

const BADGE_COLORS = {
  pendiente: 'bg-yellow-100 text-yellow-700',
  confirmado: 'bg-blue-100 text-blue-700',
  preparando: 'bg-purple-100 text-purple-700',
  enviado: 'bg-indigo-100 text-indigo-700',
  entregado: 'bg-green-100 text-green-700',
  cancelado: 'bg-red-100 text-red-700',
}

const PAGE_SIZE = 20

const PEDIDOS_DEMO = [
  {
    id: '1', numero: 1, cliente_nombre: 'María García', cliente_telefono: '3492123456',
    items: [{ nombre: 'Pampers T2 x40', cantidad: 2, precio: 5850 }],
    total: 11700, tipo_entrega: 'domicilio', estado: 'pendiente',
    created_at: new Date().toISOString(),
  },
  {
    id: '2', numero: 2, cliente_nombre: 'Juan Rodríguez', cliente_telefono: '3492654321',
    items: [{ nombre: 'Toallitas Pequeñín x80', cantidad: 3, precio: 2500 }],
    total: 7500, tipo_entrega: 'retiro', estado: 'confirmado',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
]

function sonidoNuevoPedido() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const notas = [523, 659, 784]
    notas.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = freq
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.15)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.3)
      osc.start(ctx.currentTime + i * 0.15)
      osc.stop(ctx.currentTime + i * 0.15 + 0.3)
    })
  } catch {}
}

function exportarCSV(pedidos) {
  const encabezado = ['#', 'Cliente', 'Teléfono', 'Email', 'Items', 'Total', 'Entrega', 'Estado', 'Fecha']
  const filas = pedidos.map((p) => [
    String(p.numero).padStart(4, '0'),
    p.cliente_nombre,
    p.cliente_telefono,
    p.cliente_email || '',
    Array.isArray(p.items) ? p.items.map((i) => `${i.nombre} x${i.cantidad}`).join(' | ') : '',
    p.total,
    p.tipo_entrega,
    p.estado,
    new Date(p.created_at).toLocaleDateString('es-AR'),
  ])
  const csv = [encabezado, ...filas]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `pedidos-tatitos-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function copiar(texto, label) {
  navigator.clipboard.writeText(texto).then(() => toast.success(`${label} copiado`))
}

function CampoCopiable({ label, valor }) {
  return (
    <div className="flex items-center justify-between gap-3 bg-gray-50 rounded-lg px-3 py-2">
      <div className="min-w-0">
        <p className="text-xs text-muted font-medium uppercase tracking-wide">{label}</p>
        <p className="text-sm text-gray-900 font-semibold truncate">{valor || '—'}</p>
      </div>
      <button
        onClick={() => copiar(valor || '', label)}
        className="shrink-0 p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-colors"
      >
        <Copy size={14} />
      </button>
    </div>
  )
}

function ModalPuni({ pedido, onClose }) {
  if (!pedido) return null
  const num = String(pedido.numero).padStart(4, '0')
  const detalle = Array.isArray(pedido.items)
    ? pedido.items.map((i) => `${i.nombre} x${i.cantidad}`).join(', ')
    : ''
  const valorProductos = Math.max(0, Number(pedido.total) - Number(pedido.costo_envio || 0))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2">
            <Bike size={18} className="text-primary" />
            <span className="font-display font-bold text-gray-900">Envío Puni — #{num}</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        {/* Aviso MP */}
        <div className="flex items-start gap-2 bg-amber-50 border-b border-amber-200 px-5 py-3">
          <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 font-medium">
            Recordá pagarle al repartidor desde tu cuenta de MercadoPago antes de que salga.
          </p>
        </div>

        {/* Campos */}
        <div className="p-5 space-y-2">
          <CampoCopiable label="Dirección" valor={pedido.direccion} />
          <CampoCopiable label="Teléfono cliente" valor={pedido.cliente_telefono} />
          <CampoCopiable label="Comentario / Detalle" valor={`Tatitos #${num} — ${detalle}`} />
          <CampoCopiable label="Valor comercio $" valor={String(valorProductos)} />
        </div>

        <div className="px-5 pb-5">
          <p className="text-xs text-muted text-center">Ciudad: <strong>Rafaela Santa Fe</strong> (ya viene por defecto en Puni)</p>
        </div>
      </div>
    </div>
  )
}

export default function AdminPedidos() {
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [tabActiva, setTabActiva] = useState('Todos')
  const [pagina, setPagina] = useState(1)
  const [nuevos, setNuevos] = useState(0)
  const [pedidoPuni, setPedidoPuni] = useState(null)
  const [abandonados, setAbandonados] = useState([])
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(null)
  const esDemo = useRef(false)

  useEffect(() => {
    cargar()
    cargarAbandonados()
  }, [])

  // Realtime: nuevo pedido
  useEffect(() => {
    if (esDemo.current) return

    const channel = supabase
      .channel('pedidos-nuevos')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'pedidos',
      }, (payload) => {
        setPedidos((prev) => [payload.new, ...prev])
        setNuevos((n) => n + 1)
        sonidoNuevoPedido()
        toast.custom((t) => (
          <div className={`bg-white shadow-lg rounded-xl p-4 flex items-start gap-3 border-l-4 border-primary ${t.visible ? 'animate-enter' : 'animate-leave'}`}>
            <Bell size={20} className="text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-display font-bold text-gray-900 text-sm">¡Nuevo pedido!</p>
              <p className="text-xs text-muted">{payload.new.cliente_nombre} — ${Number(payload.new.total).toLocaleString('es-AR')}</p>
            </div>
          </div>
        ), { duration: 6000 })
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'pedidos',
      }, (payload) => {
        setPedidos((prev) => prev.map((p) => p.id === payload.new.id ? { ...p, ...payload.new } : p))
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  async function cargar() {
    setLoading(true)
    setNuevos(0)
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .order('created_at', { ascending: false })
      if (error || !data) throw error
      setPedidos(data)
    } catch {
      esDemo.current = true
      setPedidos(PEDIDOS_DEMO)
    }
    setLoading(false)
  }

  async function cargarAbandonados() {
    const hace48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
    const { data } = await supabase
      .from('carritos')
      .select('*')
      .not('telefono', 'is', null)
      .eq('completado', false)
      .gte('updated_at', hace48h)
      .order('updated_at', { ascending: false })
    if (data) setAbandonados(data)
  }

  const MENSAJES_ESTADO = {
    confirmado: (nombre, num) => `Hola ${nombre}! Tu pedido #${num} fue confirmado. Ya lo estamos preparando con mucho carino!`,
    preparando: (nombre, num) => `Hola ${nombre}! Tu pedido #${num} esta siendo preparado y pronto estara listo.`,
    enviado: (nombre, num) => `Hola ${nombre}! Tu pedido #${num} ya esta en camino. Pronto llegara a tus manos!`,
    entregado: (nombre, num) => `Hola ${nombre}! Tu pedido #${num} fue entregado. Gracias por elegirnos, esperamos que todo llegue perfecto!`,
    cancelado: (nombre, num) => `Hola ${nombre}. Tu pedido #${num} fue cancelado. Comunicate con nosotros para mas info.`,
  }

  async function eliminarPedido(id) {
    const { error } = await supabase.from('pedidos').delete().eq('id', id)
    if (error) { toast.error('Error al eliminar'); return }
    setPedidos((prev) => prev.filter((p) => p.id !== id))
    setConfirmandoEliminar(null)
    toast.success('Pedido eliminado')
  }

  async function cambiarEstado(id, estado) {
    try {
      const pedidoActual = pedidos.find((p) => p.id === id)
      const { error } = await supabase.from('pedidos').update({ estado }).eq('id', id)
      if (error) throw error
      setPedidos((prev) => prev.map((p) => (p.id === id ? { ...p, estado } : p)))
      toast.success('Estado actualizado')

      // Descontar stock al confirmar (solo si no fue descontado ya)
      if (estado === 'confirmado' && pedidoActual && !pedidoActual.stock_descontado) {
        const items = pedidoActual.items || []
        for (const item of items) {
          if (item.producto_id) {
            await supabase.rpc('decrementar_stock', { p_id: item.producto_id, p_cantidad: item.cantidad })
          }
        }
        await supabase.from('pedidos').update({ stock_descontado: true }).eq('id', id)
        setPedidos((prev) => prev.map((p) => (p.id === id ? { ...p, stock_descontado: true } : p)))
      }

      const generarMensaje = MENSAJES_ESTADO[estado]
      if (generarMensaje && pedidoActual) {
        const num = String(pedidoActual.numero).padStart(4, '0')
        const texto = generarMensaje(pedidoActual.cliente_nombre, num)
        const tel = pedidoActual.cliente_telefono?.replace(/\D/g, '')
        window.open(`https://wa.me/549${tel}?text=${encodeURIComponent(texto)}`, '_blank')
      }
    } catch {
      toast.error('Error al actualizar')
    }
  }

  const filtrados = pedidos.filter((p) =>
    tabActiva === 'Todos' ? true : p.estado === tabActiva
  )
  const totalPaginas = Math.ceil(filtrados.length / PAGE_SIZE)
  const paginados = filtrados.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl font-bold text-gray-900">Pedidos</h1>
          {nuevos > 0 && (
            <span className="bg-primary text-white text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
              {nuevos} nuevo{nuevos > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => exportarCSV(filtrados)}
            className="flex items-center gap-2 text-sm text-muted hover:text-secondary border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download size={15} /> Exportar CSV
          </button>
          <button
            onClick={cargar}
            className="flex items-center gap-2 text-sm text-muted hover:text-primary"
          >
            <RefreshCw size={15} /> Actualizar
          </button>
        </div>
      </div>

      {/* Carritos abandonados */}
      {abandonados.length > 0 && (
        <div className="card p-4 mb-6 border-l-4 border-orange-400">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-orange-500" />
            <h2 className="font-display font-bold text-gray-800">
              Carritos abandonados — últimas 48hs ({abandonados.length})
            </h2>
          </div>
          <div className="space-y-2">
            {abandonados.map((c) => {
              const itemsLabel = Array.isArray(c.items)
                ? c.items.map((i) => `${i.nombre} x${i.cantidad}`).join(', ')
                : ''
              const msg = encodeURIComponent(`Hola ${c.nombre}! 👋 Notamos que dejaste productos en tu carrito de Tatitos Pañalera. ¿Querés que te ayudemos a completar tu pedido? 🛒`)
              return (
                <div key={c.id} className="flex items-center justify-between gap-3 bg-orange-50 rounded-xl px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {c.nombre} — <span className="text-primary">{c.telefono}</span>
                    </p>
                    <p className="text-xs text-muted truncate">{itemsLabel}</p>
                  </div>
                  <a
                    href={`https://wa.me/549${(c.telefono || '').replace(/\D/g, '')}?text=${msg}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-xs bg-[#25D366] text-white px-3 py-1.5 rounded-full font-semibold hover:bg-[#20b958]"
                  >
                    WhatsApp
                  </a>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {TABS.map((tab) => {
          const cant = tab === 'Todos' ? pedidos.length : pedidos.filter((p) => p.estado === tab).length
          return (
            <button
              key={tab}
              onClick={() => { setTabActiva(tab); setPagina(1) }}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors capitalize flex items-center gap-1.5 ${
                tabActiva === tab ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab}
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                tabActiva === tab ? 'bg-white/30 text-white' : 'bg-gray-200 text-gray-500'
              }`}>{cant}</span>
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="text-center py-20 text-muted">Cargando pedidos...</div>
      ) : paginados.length === 0 ? (
        <div className="text-center py-20 text-muted">No hay pedidos en esta categoría</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">#</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Cliente</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Items</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Total</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Entrega</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Estado</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Fecha</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">WA</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Puni</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginados.map((p) => (
                <tr key={p.id} className={`hover:bg-gray-50 ${p.estado === 'pendiente' ? 'bg-yellow-50/40' : ''}`}>
                  <td className="px-4 py-3 font-mono text-gray-500 text-xs">#{String(p.numero).padStart(4, '0')}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{p.cliente_nombre}</p>
                    <p className="text-xs text-muted">{p.cliente_telefono}</p>
                  </td>
                  <td className="px-4 py-3 max-w-[200px]">
                    <p className="text-gray-700 text-xs truncate">
                      {Array.isArray(p.items) ? p.items.map((i) => `${i.nombre} ×${i.cantidad}`).join(', ') : '-'}
                    </p>
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">
                    ${Number(p.total).toLocaleString('es-AR')}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    <span className="capitalize">{p.tipo_entrega}</span>
                    {p.tipo_entrega === 'localidad' && (
                      <span className="ml-1 text-orange-600 font-bold" title="Envío pendiente de cobro">⚠️ env. pendiente</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={p.estado}
                      onChange={(e) => cambiarEstado(p.id, e.target.value)}
                      className={`text-xs font-semibold px-2 py-1 rounded-lg border-0 cursor-pointer ${BADGE_COLORS[p.estado] || 'bg-gray-100 text-gray-600'}`}
                    >
                      {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                    {new Date(p.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={`https://wa.me/549${p.cliente_telefono}?text=Hola%20${encodeURIComponent(p.cliente_nombre)}%2C%20te%20escribimos%20de%20Tatitos%20por%20tu%20pedido%20%23${String(p.numero).padStart(4, '0')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-700"
                    >
                      <MessageCircle size={18} />
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    {p.tipo_entrega === 'domicilio' && (
                      <button
                        onClick={() => setPedidoPuni(p)}
                        className="text-primary hover:text-primary/80 transition-colors"
                        title="Preparar envío Puni"
                      >
                        <Bike size={18} />
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {confirmandoEliminar === p.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => eliminarPedido(p.id)}
                          className="text-xs font-semibold text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded-lg transition-colors"
                        >
                          Sí
                        </button>
                        <button
                          onClick={() => setConfirmandoEliminar(null)}
                          className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded-lg transition-colors"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmandoEliminar(p.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors"
                        title="Eliminar pedido"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ModalPuni pedido={pedidoPuni} onClose={() => setPedidoPuni(null)} />

      {totalPaginas > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {[...Array(totalPaginas)].map((_, i) => (
            <button
              key={i}
              onClick={() => setPagina(i + 1)}
              className={`w-8 h-8 rounded-full text-sm font-semibold ${
                pagina === i + 1 ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
