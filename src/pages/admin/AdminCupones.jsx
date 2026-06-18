import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { Plus, Tag, Trash2, ToggleLeft, ToggleRight, X, School, Gift, CheckCircle, Pencil } from 'lucide-react'

const FORM_EMPTY = { codigo: '', tipo: 'porcentaje', valor: '', usos_max: '', institucion: '', credito_por_uso: '' }

function ModalCupon({ onClose, onGuardado }) {
  const [form, setForm] = useState(FORM_EMPTY)
  const [cargando, setCargando] = useState(false)
  const [esJardin, setEsJardin] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const handleGuardar = async (e) => {
    e.preventDefault()
    if (!form.codigo.trim()) { toast.error('Ingresá un código'); return }
    if (!form.valor || Number(form.valor) <= 0) { toast.error('Ingresá un valor válido'); return }
    if (esJardin && !form.institucion.trim()) { toast.error('Ingresá el nombre del jardín'); return }

    setCargando(true)
    const payload = {
      codigo: form.codigo.trim().toUpperCase(),
      tipo: form.tipo,
      valor: Number(form.valor),
      usos_max: form.usos_max ? Number(form.usos_max) : null,
      institucion: esJardin ? form.institucion.trim() : null,
      credito_por_uso: esJardin && form.credito_por_uso ? Number(form.credito_por_uso) : 0,
    }

    const { error } = await supabase.from('cupones').insert(payload)
    setCargando(false)

    if (error) {
      if (error.code === '23505') toast.error('Ya existe un cupón con ese código')
      else toast.error('Error al guardar el cupón')
      return
    }

    toast.success(`Cupón "${payload.codigo}" creado`)
    onGuardado()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-lg text-gray-900">Nuevo cupón</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
        </div>

        <form onSubmit={handleGuardar} className="space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEsJardin(false)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-colors ${!esJardin ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-500'}`}
            >
              Cupón general
            </button>
            <button
              type="button"
              onClick={() => setEsJardin(true)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-colors flex items-center justify-center gap-1.5 ${esJardin ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-500'}`}
            >
              <School size={14} /> Jardín adherido
            </button>
          </div>

          {esJardin && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre del jardín *</label>
              <input
                name="institucion"
                value={form.institucion}
                onChange={handleChange}
                placeholder="ej: Jardín Arco Iris"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Código *</label>
            <input
              name="codigo"
              value={form.codigo}
              onChange={handleChange}
              placeholder={esJardin ? 'ej: JARDIN-ARCOIRIS' : 'ej: TATITOS20'}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo *</label>
              <select
                name="tipo"
                value={form.tipo}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                <option value="porcentaje">Porcentaje (%)</option>
                <option value="fijo">Monto fijo ($)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Valor {form.tipo === 'porcentaje' ? '(%)' : '($)'} *
              </label>
              <input
                name="valor"
                type="number"
                min="1"
                max={form.tipo === 'porcentaje' ? 100 : undefined}
                value={form.valor}
                onChange={handleChange}
                placeholder={form.tipo === 'porcentaje' ? '10' : '500'}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Límite de usos (opcional)</label>
            <input
              name="usos_max"
              type="number"
              min="1"
              value={form.usos_max}
              onChange={handleChange}
              placeholder="Dejar vacío = ilimitado"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          {esJardin && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <label className="block text-sm font-semibold text-amber-800 mb-1 flex items-center gap-1.5">
                <Gift size={14} /> Crédito por uso (opcional)
              </label>
              <p className="text-xs text-amber-700 mb-2">
                Cuánto crédito acumula el jardín cada vez que una familia usa el cupón
              </p>
              <div className="flex items-center gap-2">
                <span className="text-amber-700 font-bold">$</span>
                <input
                  name="credito_por_uso"
                  type="number"
                  min="0"
                  value={form.credito_por_uso}
                  onChange={handleChange}
                  placeholder="ej: 500"
                  className="flex-1 border border-amber-200 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
                <span className="text-xs text-amber-700">por familia</span>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary py-2.5">Cancelar</button>
            <button type="submit" disabled={cargando} className="flex-1 btn-primary py-2.5 justify-center disabled:opacity-60">
              {cargando ? 'Guardando...' : 'Crear cupón'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ModalCanjear({ cupon, onClose, onCanjeado }) {
  const [monto, setMonto] = useState('')
  const [nota, setNota] = useState('')
  const [cargando, setCargando] = useState(false)
  const disponible = (cupon.credito_acumulado || 0) - (cupon.credito_canjeado || 0)

  const handleCanjear = async () => {
    const valor = Number(monto)
    if (!valor || valor <= 0) { toast.error('Ingresá un monto válido'); return }
    if (valor > disponible) { toast.error('No hay suficiente crédito disponible'); return }

    const notaConFecha = `[${new Date().toLocaleDateString('es-AR')}] $${valor.toLocaleString('es-AR')} canjeados${nota.trim() ? ` — ${nota.trim()}` : ''}`
    const notasActualizadas = [cupon.notas, notaConFecha].filter(Boolean).join('\n')

    setCargando(true)
    const { error } = await supabase
      .from('cupones')
      .update({ credito_canjeado: (cupon.credito_canjeado || 0) + valor, notas: notasActualizadas })
      .eq('id', cupon.id)
    setCargando(false)

    if (error) { toast.error('Error al registrar el canje'); return }
    toast.success(`$${valor.toLocaleString('es-AR')} canjeados para ${cupon.institucion}`)
    onCanjeado()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-lg text-gray-900">Canjear crédito</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
        </div>

        <div className="bg-amber-50 rounded-xl p-4 mb-5">
          <p className="text-sm font-semibold text-amber-800 flex items-center gap-1.5 mb-1">
            <School size={14} /> {cupon.institucion}
          </p>
          <p className="text-xs text-amber-700">
            Acumulado: <strong>${(cupon.credito_acumulado || 0).toLocaleString('es-AR')}</strong>
            {' · '}
            Ya canjeado: <strong>${(cupon.credito_canjeado || 0).toLocaleString('es-AR')}</strong>
          </p>
          <p className="text-lg font-display font-black text-amber-800 mt-2">
            Disponible: ${disponible.toLocaleString('es-AR')}
          </p>
        </div>

        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Monto a canjear</label>
          <div className="flex items-center gap-2">
            <span className="text-gray-500 font-bold">$</span>
            <input
              type="number"
              min="1"
              max={disponible}
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder={disponible.toString()}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setMonto(disponible.toString())}
              className="text-xs text-primary font-semibold hover:underline"
            >
              Todo
            </button>
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Nota (opcional)</label>
          <input
            type="text"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="ej: Entregué productos en el jardín"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 btn-secondary py-2.5">Cancelar</button>
          <button
            onClick={handleCanjear}
            disabled={cargando || !monto}
            className="flex-1 btn-primary py-2.5 justify-center disabled:opacity-60 gap-2"
          >
            <CheckCircle size={16} />
            {cargando ? 'Registrando...' : 'Confirmar canje'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ModalEditar({ cupon, onClose, onGuardado }) {
  const esJardin = !!cupon.institucion
  const [form, setForm] = useState({
    tipo: cupon.tipo,
    valor: cupon.valor,
    usos_max: cupon.usos_max ?? '',
    institucion: cupon.institucion ?? '',
    credito_por_uso: cupon.credito_por_uso ?? '',
  })
  const [cargando, setCargando] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const handleGuardar = async (e) => {
    e.preventDefault()
    if (!form.valor || Number(form.valor) <= 0) { toast.error('Ingresá un valor válido'); return }

    setCargando(true)
    const payload = {
      tipo: form.tipo,
      valor: Number(form.valor),
      usos_max: form.usos_max ? Number(form.usos_max) : null,
      institucion: esJardin ? form.institucion.trim() || null : null,
      credito_por_uso: esJardin && form.credito_por_uso ? Number(form.credito_por_uso) : 0,
    }

    const { error } = await supabase.from('cupones').update(payload).eq('id', cupon.id)
    setCargando(false)

    if (error) { toast.error('Error al guardar'); return }
    toast.success(`Cupón "${cupon.codigo}" actualizado`)
    onGuardado()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-display font-bold text-lg text-gray-900">Editar cupón</h2>
            <p className="text-xs text-muted mt-0.5">Código: <span className="font-mono font-bold text-gray-700">{cupon.codigo}</span></p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
        </div>

        <form onSubmit={handleGuardar} className="space-y-4">
          {esJardin && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre del jardín</label>
              <input
                name="institucion"
                value={form.institucion}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo</label>
              <select
                name="tipo"
                value={form.tipo}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                <option value="porcentaje">Porcentaje (%)</option>
                <option value="fijo">Monto fijo ($)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Valor {form.tipo === 'porcentaje' ? '(%)' : '($)'}
              </label>
              <input
                name="valor"
                type="number"
                min="1"
                max={form.tipo === 'porcentaje' ? 100 : undefined}
                value={form.valor}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Límite de usos</label>
            <input
              name="usos_max"
              type="number"
              min="1"
              value={form.usos_max}
              onChange={handleChange}
              placeholder="Dejar vacío = ilimitado"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          {esJardin && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <label className="block text-sm font-semibold text-amber-800 mb-1 flex items-center gap-1.5">
                <Gift size={14} /> Crédito por uso
              </label>
              <div className="flex items-center gap-2">
                <span className="text-amber-700 font-bold">$</span>
                <input
                  name="credito_por_uso"
                  type="number"
                  min="0"
                  value={form.credito_por_uso}
                  onChange={handleChange}
                  placeholder="0"
                  className="flex-1 border border-amber-200 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
                <span className="text-xs text-amber-700">por familia</span>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary py-2.5">Cancelar</button>
            <button type="submit" disabled={cargando} className="flex-1 btn-primary py-2.5 justify-center disabled:opacity-60">
              {cargando ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminCupones() {
  const [cupones, setCupones] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [modalCanjear, setModalCanjear] = useState(null)
  const [modalEditar, setModalEditar] = useState(null)
  const [filtro, setFiltro] = useState('todos')

  const cargar = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('cupones')
      .select('*')
      .order('created_at', { ascending: false })
    setCupones(data || [])
    setLoading(false)
  }

  useEffect(() => { cargar() }, [])

  const toggleActivo = async (cupon) => {
    const { error } = await supabase
      .from('cupones')
      .update({ activo: !cupon.activo })
      .eq('id', cupon.id)
    if (error) { toast.error('Error al actualizar'); return }
    toast.success(cupon.activo ? 'Cupón desactivado' : 'Cupón activado')
    setCupones((prev) => prev.map((c) => c.id === cupon.id ? { ...c, activo: !c.activo } : c))
  }

  const registrarUsoManual = async (cupon) => {
    if (!confirm(`¿Registrar una venta por WhatsApp para "${cupon.institucion}"?\nEsto suma 1 uso y $${cupon.credito_por_uso.toLocaleString('es-AR')} de crédito.`)) return
    const { error } = await supabase.rpc('incrementar_uso_cupon', { p_codigo: cupon.codigo })
    if (error) { toast.error('Error al registrar'); return }
    toast.success(`Uso registrado · +$${cupon.credito_por_uso.toLocaleString('es-AR')} para ${cupon.institucion}`)
    cargar()
  }

  const eliminar = async (cupon) => {
    if (!confirm(`¿Eliminar el cupón "${cupon.codigo}"?`)) return
    const { error } = await supabase.from('cupones').delete().eq('id', cupon.id)
    if (error) { toast.error('Error al eliminar'); return }
    toast.success('Cupón eliminado')
    setCupones((prev) => prev.filter((c) => c.id !== cupon.id))
  }

  const cuponesJardines = cupones.filter((c) => c.institucion)
  const cuponesGenerales = cupones.filter((c) => !c.institucion)
  const cuponesFiltrados = filtro === 'jardines' ? cuponesJardines : filtro === 'generales' ? cuponesGenerales : cupones

  const totalUsosJardines = cuponesJardines.reduce((acc, c) => acc + (c.usos || 0), 0)
  const creditoTotalDisponible = cuponesJardines.reduce((acc, c) => acc + Math.max(0, (c.credito_acumulado || 0) - (c.credito_canjeado || 0)), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Cupones de descuento</h1>
          <p className="text-sm text-muted mt-1">{cupones.length} cupón{cupones.length !== 1 ? 'es' : ''} en total</p>
        </div>
        <button onClick={() => setModalAbierto(true)} className="btn-primary gap-2">
          <Plus size={16} /> Nuevo cupón
        </button>
      </div>

      {cuponesJardines.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-muted uppercase tracking-wide mb-1">Jardines adheridos</p>
            <p className="font-display font-black text-2xl text-primary">{cuponesJardines.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-muted uppercase tracking-wide mb-1">Familias alcanzadas</p>
            <p className="font-display font-black text-2xl text-gray-900">{totalUsosJardines}</p>
          </div>
          <div className={`rounded-2xl p-4 shadow-sm border ${creditoTotalDisponible > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-100'}`}>
            <p className="text-xs text-muted uppercase tracking-wide mb-1">Crédito a entregar</p>
            <p className={`font-display font-black text-2xl ${creditoTotalDisponible > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
              ${creditoTotalDisponible.toLocaleString('es-AR')}
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        {['todos', 'jardines', 'generales'].map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${filtro === f ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {f === 'todos' ? 'Todos' : f === 'jardines' ? `🏫 Jardines (${cuponesJardines.length})` : `General (${cuponesGenerales.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map((i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : cuponesFiltrados.length === 0 ? (
        <div className="text-center py-20 text-muted">
          <Tag size={48} className="mx-auto mb-3 opacity-30" />
          <p>No hay cupones en esta categoría</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Código</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Institución</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Descuento</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Usos</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Crédito</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Estado</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {cuponesFiltrados.map((c) => {
                const creditoDisponible = (c.credito_acumulado || 0) - (c.credito_canjeado || 0)
                return (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <span className="font-display font-bold text-gray-900 tracking-wide">{c.codigo}</span>
                    </td>
                    <td className="px-5 py-4">
                      {c.institucion ? (
                        <div>
                          <span className="flex items-center gap-1 text-primary font-medium">
                            <School size={13} /> {c.institucion}
                          </span>
                          {c.notas && (
                            <div className="mt-1 space-y-0.5">
                              {c.notas.split('\n').map((n, i) => (
                                <p key={i} className="text-xs text-muted">{n}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        c.tipo === 'porcentaje' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {c.tipo === 'porcentaje' ? `${c.valor}%` : `$${Number(c.valor).toLocaleString('es-AR')}`}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-gray-900">{c.usos || 0}</span>
                        {c.usos_max
                          ? <>
                              <span className="text-muted">/ {c.usos_max}</span>
                              <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full"
                                  style={{ width: `${Math.min(100, ((c.usos || 0) / c.usos_max) * 100)}%` }}
                                />
                              </div>
                            </>
                          : <span className="text-muted">/ ∞</span>
                        }
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {c.institucion && c.credito_por_uso > 0 ? (
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <div>
                              <span className={`font-bold ${creditoDisponible > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                                ${creditoDisponible.toLocaleString('es-AR')}
                              </span>
                              <span className="text-xs text-muted block">disponible</span>
                            </div>
                            {creditoDisponible > 0 && (
                              <button
                                onClick={() => setModalCanjear(c)}
                                className="flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold hover:bg-amber-200 transition-colors"
                              >
                                <Gift size={11} /> Canjear
                              </button>
                            )}
                          </div>
                          <button
                            onClick={() => registrarUsoManual(c)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold hover:bg-green-100 transition-colors w-fit"
                          >
                            <Plus size={11} /> Registrar venta WA
                          </button>
                        </div>
                      ) : (
                        <span className="text-muted text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <button onClick={() => toggleActivo(c)} className="flex items-center gap-1.5">
                        {c.activo
                          ? <><ToggleRight size={20} className="text-green-500" /><span className="text-green-600 font-medium">Activo</span></>
                          : <><ToggleLeft size={20} className="text-gray-400" /><span className="text-gray-400">Inactivo</span></>
                        }
                      </button>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => setModalEditar(c)} className="text-gray-400 hover:text-gray-700 transition-colors">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => eliminar(c)} className="text-red-400 hover:text-red-600 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {modalAbierto && (
        <ModalCupon onClose={() => setModalAbierto(false)} onGuardado={cargar} />
      )}
      {modalCanjear && (
        <ModalCanjear cupon={modalCanjear} onClose={() => setModalCanjear(null)} onCanjeado={cargar} />
      )}
      {modalEditar && (
        <ModalEditar cupon={modalEditar} onClose={() => setModalEditar(null)} onGuardado={cargar} />
      )}
    </div>
  )
}
