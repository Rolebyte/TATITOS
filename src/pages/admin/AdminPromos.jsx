import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { Plus, Megaphone, X, ToggleLeft, ToggleRight, Trash2, Pencil } from 'lucide-react'

const COLORES = [
  { value: 'primary', label: 'Rosa (marca)', clase: 'bg-primary' },
  { value: 'verde', label: 'Verde', clase: 'bg-green-500' },
  { value: 'amarillo', label: 'Amarillo', clase: 'bg-amber-400' },
  { value: 'oscuro', label: 'Oscuro', clase: 'bg-gray-900' },
]

const FORM_EMPTY = { tipo: 'barra', mensaje: '', color: 'primary' }

function ModalPromo({ inicial, onClose, onGuardado }) {
  const [form, setForm] = useState(inicial || FORM_EMPTY)
  const [cargando, setCargando] = useState(false)
  const esEdicion = !!inicial?.id

  const handleGuardar = async (e) => {
    e.preventDefault()
    if (!form.mensaje.trim()) { toast.error('Escribí un mensaje'); return }
    setCargando(true)

    const payload = { tipo: form.tipo, mensaje: form.mensaje.trim(), color: form.color }
    const { error } = esEdicion
      ? await supabase.from('promos').update(payload).eq('id', inicial.id)
      : await supabase.from('promos').insert(payload)

    setCargando(false)
    if (error) { toast.error('Error al guardar'); return }
    toast.success(esEdicion ? 'Promo actualizada' : 'Promo creada')
    onGuardado()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-lg text-gray-900">
            {esEdicion ? 'Editar promo' : 'Nueva promo'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
        </div>

        <form onSubmit={handleGuardar} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo</label>
            <div className="flex gap-2">
              {[
                { value: 'barra', label: '— Barra superior' },
                { value: 'popup', label: '⬜ Pop-up' },
              ].map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, tipo: t.value }))}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-colors ${
                    form.tipo === t.value ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-500'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Mensaje</label>
            <textarea
              value={form.mensaje}
              onChange={(e) => setForm((f) => ({ ...f, mensaje: e.target.value }))}
              rows={3}
              placeholder={form.tipo === 'barra'
                ? 'ej: 🎉 Usá TATITOS10 y llevate 10% off en tu primera compra'
                : 'ej: ¡Bienvenido! Usá TATITOS10 para obtener 10% de descuento en tu primera compra.'
              }
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Color</label>
            <div className="flex gap-2">
              {COLORES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, color: c.value }))}
                  className={`flex-1 flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-colors ${
                    form.color === c.value ? 'border-gray-900' : 'border-transparent'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full ${c.clase}`} />
                  <span className="text-xs text-gray-600">{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Vista previa</label>
            {form.tipo === 'barra' ? (
              <div className={`rounded-xl px-4 py-2 text-center text-sm font-semibold text-white ${
                form.color === 'primary' ? 'bg-primary' :
                form.color === 'verde' ? 'bg-green-500' :
                form.color === 'amarillo' ? 'bg-amber-400 text-gray-900' :
                'bg-gray-900'
              }`}>
                {form.mensaje || 'Tu mensaje aparece acá'}
              </div>
            ) : (
              <div className="border border-gray-200 rounded-xl p-4 text-center bg-gray-50">
                <p className="text-xs text-muted mb-1 font-semibold">¡Bienvenido a Tatitos!</p>
                <p className="text-xs text-gray-600">{form.mensaje || 'Tu mensaje aparece acá'}</p>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary py-2.5">Cancelar</button>
            <button type="submit" disabled={cargando} className="flex-1 btn-primary py-2.5 justify-center disabled:opacity-60">
              {cargando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear promo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminPromos() {
  const [promos, setPromos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)

  const cargar = async () => {
    setLoading(true)
    const { data } = await supabase.from('promos').select('*').order('created_at', { ascending: false })
    setPromos(data || [])
    setLoading(false)
  }

  useEffect(() => { cargar() }, [])

  const toggleActivo = async (promo) => {
    const { error } = await supabase.from('promos').update({ activo: !promo.activo }).eq('id', promo.id)
    if (error) { toast.error('Error al actualizar'); return }
    toast.success(promo.activo ? 'Promo desactivada' : 'Promo activada')
    setPromos((prev) => prev.map((p) => p.id === promo.id ? { ...p, activo: !p.activo } : p))
  }

  const eliminar = async (promo) => {
    if (!confirm('¿Eliminar esta promo?')) return
    const { error } = await supabase.from('promos').delete().eq('id', promo.id)
    if (error) { toast.error('Error al eliminar'); return }
    toast.success('Promo eliminada')
    setPromos((prev) => prev.filter((p) => p.id !== promo.id))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Promociones</h1>
          <p className="text-sm text-muted mt-1">Barra superior y pop-ups de bienvenida</p>
        </div>
        <button onClick={() => setModal({})} className="btn-primary gap-2">
          <Plus size={16} /> Nueva promo
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : promos.length === 0 ? (
        <div className="text-center py-20 text-muted">
          <Megaphone size={48} className="mx-auto mb-3 opacity-30" />
          <p>No hay promos todavía</p>
        </div>
      ) : (
        <div className="space-y-4">
          {promos.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Preview de la promo */}
              <div className={`px-5 py-3 text-sm font-semibold ${
                p.tipo === 'barra'
                  ? `text-white ${p.color === 'primary' ? 'bg-primary' : p.color === 'verde' ? 'bg-green-500' : p.color === 'amarillo' ? 'bg-amber-400 text-gray-900' : 'bg-gray-900'}`
                  : 'bg-gray-50 text-gray-700 border-b border-gray-100 italic'
              }`}>
                {p.tipo === 'popup' && <span className="not-italic font-bold text-primary mr-2">[Pop-up]</span>}
                {p.mensaje}
              </div>

              {/* Controles */}
              <div className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    p.tipo === 'barra' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {p.tipo === 'barra' ? 'Barra' : 'Pop-up'}
                  </span>
                  <button onClick={() => toggleActivo(p)} className="flex items-center gap-1.5">
                    {p.activo
                      ? <><ToggleRight size={20} className="text-green-500" /><span className="text-green-600 font-medium text-sm">Activa</span></>
                      : <><ToggleLeft size={20} className="text-gray-400" /><span className="text-gray-400 text-sm">Inactiva</span></>
                    }
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setModal(p)} className="text-gray-400 hover:text-gray-700 transition-colors">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => eliminar(p)} className="text-red-400 hover:text-red-600 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal !== null && (
        <ModalPromo
          inicial={modal?.id ? modal : null}
          onClose={() => setModal(null)}
          onGuardado={cargar}
        />
      )}
    </div>
  )
}
