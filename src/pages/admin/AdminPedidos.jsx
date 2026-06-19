import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { MessageCircle, RefreshCw, Download, Bell } from 'lucide-react'

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

export default function AdminPedidos() {
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [tabActiva, setTabActiva] = useState('Todos')
  const [pagina, setPagina] = useState(1)
  const [nuevos, setNuevos] = useState(0)
  const esDemo = useRef(false)

  useEffect(() => {
    cargar()
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

  const MENSAJES_ESTADO = {
    confirmado: (nombre, num) => `Hola ${nombre}! 👋 Tu pedido *#${num}* fue confirmado. Ya lo estamos preparando con mucho cariño 💛`,
    preparando: (nombre, num) => `Hola ${nombre}! 📦 Tu pedido *#${num}* está siendo preparado y pronto estará listo.`,
    enviado: (nombre, num) => `Hola ${nombre}! 🚚 Tu pedido *#${num}* ya está en camino. ¡Pronto llegará a tus manos!`,
    entregado: (nombre, num) => `Hola ${nombre}! ✅ Tu pedido *#${num}* fue entregado. Gracias por elegirnos, esperamos que todo llegue perfecto 💛`,
    cancelado: (nombre, num) => `Hola ${nombre}. Tu pedido *#${num}* fue cancelado. Comunicate con nosotros para más info.`,
  }

  async function cambiarEstado(id, estado) {
    try {
      const pedidoActual = pedidos.find((p) => p.id === id)
      const { error } = await supabase.from('pedidos').update({ estado }).eq('id', id)
      if (error) throw error
      setPedidos((prev) => prev.map((p) => (p.id === id ? { ...p, estado } : p)))
      toast.success('Estado actualizado')

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
                  <td className="px-4 py-3 capitalize text-gray-600 text-xs">{p.tipo_entrega}</td>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
