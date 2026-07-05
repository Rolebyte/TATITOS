import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { Plus, Upload, X, Check, ToggleLeft, ToggleRight, Pencil, Trash2, Bell } from 'lucide-react'

const CATEGORIAS = ['pañales', 'pañales adultos', 'toallitas', 'cremas', 'higiene', 'ropa', 'regaleria', 'limpieza', 'puericultura', 'perfumería', 'juguetes']

const STOCK_DEMO = [
  { id: '1', nombre: 'Pampers Etapas T2 x40', categoria: 'pañales', marca: 'Pampers', precio: 5850, stock: 18, activo: true, imagen_url: null, descripcion: '' },
  { id: '2', nombre: 'Huggies Clásicos T2 x40', categoria: 'pañales', marca: 'Huggies', precio: 5200, stock: 3, activo: true, imagen_url: null, descripcion: '' },
  { id: '3', nombre: 'Toallitas Pequeñín x80', categoria: 'toallitas', marca: 'Pequeñín', precio: 2500, stock: 24, activo: true, imagen_url: null, descripcion: '' },
  { id: '4', nombre: 'Crema Bepanthen 30g', categoria: 'cremas', marca: 'Bepanthen', precio: 3200, stock: 0, activo: false, imagen_url: null, descripcion: '' },
]

const TALLES = ['RN Prematuro', 'RN', 'RN+', 'P', 'T2', 'T3', 'M', 'T4', 'G', 'T5', 'XG', 'XXG', 'XXXG']

const FORM_EMPTY = { nombre: '', precio: '', stock: '', categoria: 'pañales', marca: '', descripcion: '', talle: '', cantidad_unidades: '' }

function stockColor(stock) {
  if (stock <= 0) return 'bg-red-100 text-red-600'
  if (stock <= 5) return 'bg-yellow-100 text-yellow-700'
  return 'bg-green-100 text-green-700'
}
function stockLabel(stock) {
  if (stock <= 0) return 'Sin stock'
  if (stock <= 5) return 'Bajo'
  return 'OK'
}

function EditableCell({ value, onSave, prefix = '' }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value)
  const ref = useRef()
  useEffect(() => { if (editing) ref.current?.focus() }, [editing])
  const save = () => { onSave(Number(val)); setEditing(false) }
  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-gray-400 text-xs">{prefix}</span>
        <input ref={ref} type="number" value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
          className="w-20 border border-primary rounded px-1.5 py-0.5 text-sm focus:outline-none"
        />
        <button onClick={save} className="text-green-600"><Check size={14} /></button>
        <button onClick={() => setEditing(false)} className="text-gray-400"><X size={14} /></button>
      </div>
    )
  }
  return (
    <button onClick={() => setEditing(true)} className="text-sm font-semibold text-gray-900 hover:text-primary hover:underline">
      {prefix}{Number(value).toLocaleString('es-AR')}
    </button>
  )
}

function ModalProducto({ producto, onClose, onGuardado }) {
  const esEdicion = !!producto
  const [form, setForm] = useState(
    esEdicion
      ? { nombre: producto.nombre, precio: producto.precio, stock: producto.stock, categoria: producto.categoria, marca: producto.marca || '', descripcion: producto.descripcion || '', talle: producto.talle || '', cantidad_unidades: producto.cantidad_unidades || '' }
      : FORM_EMPTY
  )
  const [catalogoTodo, setCatalogoTodo] = useState([])
  const [selectedLinea, setSelectedLinea] = useState('')
  const [cantidadBloqueada, setCantidadBloqueada] = useState(false)
  const [imagen, setImagen] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [preview, setPreview] = useState(producto?.imagen_url || null)
  const [catalogImagenUrl, setCatalogImagenUrl] = useState(producto?.imagen_url || null)
  const [imagenesExtra, setImagenesExtra] = useState(producto?.imagenes || [])
  const [urlInput, setUrlInput] = useState('')

  useEffect(() => {
    supabase.from('catalogo_productos').select('*').eq('activo', true).eq('categoria', form.categoria)
      .order('marca').order('linea').order('presentacion')
      .then(({ data }) => {
        setCatalogoTodo(data || [])
        setSelectedLinea('')
        setCantidadBloqueada(false)
      })
  }, [form.categoria])

  const marcasOpts = [...new Set(catalogoTodo.map(c => c.marca))].sort()
  const lineasOpts = [...new Set(catalogoTodo.filter(c => c.marca === form.marca).map(c => c.linea))].sort()
  const presOpts = catalogoTodo.filter(c => c.marca === form.marca && c.linea === selectedLinea)

  const [busqueda, setBusqueda] = useState('')
  const [resultados, setResultados] = useState([])
  const [mostrarResultados, setMostrarResultados] = useState(false)

  useEffect(() => {
    if (busqueda.trim().length < 2) { setResultados([]); return }
    const q = busqueda.toLowerCase()
    supabase.from('catalogo_productos').select('*').eq('activo', true)
      .or(`marca.ilike.%${q}%,linea.ilike.%${q}%,presentacion.ilike.%${q}%,categoria.ilike.%${q}%`)
      .order('categoria').order('marca').order('linea').limit(20)
      .then(({ data }) => { setResultados(data || []); setMostrarResultados(true) })
  }, [busqueda])

  const seleccionarDeResultado = (item) => {
    const nombreAuto = [item.marca, item.linea, item.presentacion].filter(Boolean).join(' ')
    setForm(f => ({
      ...f,
      categoria: item.categoria,
      marca: item.marca,
      talle: item.presentacion || '',
      cantidad_unidades: item.cantidad_unidades ?? '',
      nombre: f.nombre || nombreAuto,
    }))
    setSelectedLinea(item.linea)
    setCantidadBloqueada(item.cantidad_unidades != null)
    setBusqueda('')
    setMostrarResultados(false)
    if (item.imagen_url) { setPreview(item.imagen_url); setCatalogImagenUrl(item.imagen_url) }
    supabase.from('catalogo_productos').select('*').eq('activo', true).eq('categoria', item.categoria)
      .order('marca').order('linea').order('presentacion')
      .then(({ data }) => setCatalogoTodo(data || []))
  }

  const handleImagen = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImagen(file)
    setPreview(URL.createObjectURL(file))
  }

  const guardar = async () => {
    if (!form.nombre || !form.precio || form.stock === '') {
      toast.error('Nombre, precio y stock son obligatorios'); return
    }
    setGuardando(true)
    try {
      let imagen_url = catalogImagenUrl || producto?.imagen_url || null

      if (imagen) {
        const ext = imagen.name.split('.').pop()
        const path = `${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage.from('productos-img').upload(path, imagen)
        if (!upErr) {
          const { data: urlData } = supabase.storage.from('productos-img').getPublicUrl(path)
          imagen_url = urlData.publicUrl
        }
      }

      const payload = {
        nombre: form.nombre,
        descripcion: form.descripcion,
        precio: Number(form.precio),
        stock: Number(form.stock),
        categoria: form.categoria,
        marca: form.marca,
        imagen_url,
        imagenes: imagenesExtra,
        talle: form.talle || null,
        cantidad_unidades: form.cantidad_unidades ? Number(form.cantidad_unidades) : null,
      }

      if (esEdicion) {
        const { data, error } = await supabase.from('productos').update(payload).eq('id', producto.id).select().single()
        if (error) throw error
        onGuardado({ ...producto, ...data })
        toast.success('Producto actualizado')
      } else {
        const { data, error } = await supabase.from('productos').insert({ ...payload, activo: true }).select().single()
        if (error) throw error
        onGuardado(data)
        toast.success('Producto creado')
      }
      onClose()
    } catch {
      toast.error('Error al guardar')
    }
    setGuardando(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-lg">{esEdicion ? 'Editar producto' : 'Nuevo producto'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
        </div>

        <div className="space-y-3">
          {/* Imagen preview */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Imagen</label>
            <label className="flex items-center gap-3 border-2 border-dashed border-gray-200 rounded-xl p-3 cursor-pointer hover:border-primary transition-colors">
              {preview
                ? <img src={preview} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                : <Upload size={20} className="text-gray-400 shrink-0" />
              }
              <span className="text-sm text-gray-500">{imagen ? imagen.name : preview ? 'Cambiar imagen...' : 'Subir imagen...'}</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImagen} />
            </label>
          </div>

          {/* Imágenes extra de galería */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Imágenes adicionales (galería)</label>
            <div className="flex gap-2 mb-2">
              <input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && urlInput.trim()) {
                    e.preventDefault()
                    setImagenesExtra([...imagenesExtra, urlInput.trim()])
                    setUrlInput('')
                  }
                }}
                placeholder="https://... (Enter para agregar)"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                type="button"
                onClick={() => { if (urlInput.trim()) { setImagenesExtra([...imagenesExtra, urlInput.trim()]); setUrlInput('') } }}
                className="px-3 py-2 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-pink-500"
              >
                +
              </button>
            </div>
            {imagenesExtra.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {imagenesExtra.map((url, i) => (
                  <div key={i} className="relative group">
                    <img src={url} alt="" className="w-12 h-12 rounded-lg object-cover border border-gray-200" />
                    <button
                      type="button"
                      onClick={() => setImagenesExtra(imagenesExtra.filter((_, j) => j !== i))}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre *</label>
            <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Pampers Etapas T2 x40"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>

          {/* Buscador rápido de catálogo */}
          <div className="relative">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Buscar producto del catálogo</label>
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onFocus={() => busqueda.length >= 2 && setMostrarResultados(true)}
              onBlur={() => setTimeout(() => setMostrarResultados(false), 150)}
              placeholder="Ej: Huggies, Pampers Deluxe, shampoo Dove..."
              className="w-full border border-primary/40 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-pink-50"
            />
            {mostrarResultados && resultados.length > 0 && (
              <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
                {resultados.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onMouseDown={() => seleccionarDeResultado(item)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-pink-50 border-b border-gray-50 last:border-0 flex items-center gap-2"
                  >
                    {item.imagen_url
                      ? <img src={item.imagen_url} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0 border border-gray-100" />
                      : <div className="w-9 h-9 rounded-lg bg-gray-100 shrink-0 flex items-center justify-center text-gray-300 text-xs">?</div>
                    }
                    <div className="min-w-0">
                      <span className="font-semibold text-gray-800">{item.marca} {item.linea}</span>
                      {item.presentacion && <span className="text-gray-500"> — {item.presentacion}</span>}
                      {item.cantidad_unidades && <span className="text-primary font-semibold"> x{item.cantidad_unidades}u</span>}
                      <span className="ml-2 text-xs text-gray-400 capitalize">[{item.categoria}]</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {mostrarResultados && busqueda.length >= 2 && resultados.length === 0 && (
              <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2 text-sm text-gray-400">
                Sin resultados
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Categoría *</label>
            <select value={form.categoria}
              onChange={(e) => {
                setForm({ ...form, categoria: e.target.value, marca: '', talle: '', cantidad_unidades: '' })
                setSelectedLinea('')
                setCantidadBloqueada(false)
              }}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
              {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Cascada: Marca → Línea → Presentación → Cantidad auto */}
          {marcasOpts.length > 0 ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Marca *</label>
                <select value={form.marca}
                  onChange={(e) => {
                    setForm(f => ({ ...f, marca: e.target.value, talle: '', cantidad_unidades: '' }))
                    setSelectedLinea('')
                    setCantidadBloqueada(false)
                  }}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="">Seleccionar marca...</option>
                  {marcasOpts.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              {form.marca && lineasOpts.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Línea / Tipo</label>
                  <select value={selectedLinea}
                    onChange={(e) => {
                      setSelectedLinea(e.target.value)
                      setForm(f => ({ ...f, talle: '', cantidad_unidades: '' }))
                      setCantidadBloqueada(false)
                    }}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                    <option value="">Seleccionar línea...</option>
                    {lineasOpts.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              )}

              {selectedLinea && presOpts.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Presentación / Talle</label>
                  <select value={form.talle}
                    onChange={(e) => {
                      const item = presOpts.find(p => p.presentacion === e.target.value)
                      const nombreAuto = [form.marca, selectedLinea, e.target.value].filter(Boolean).join(' ')
                      setForm(f => ({
                        ...f,
                        talle: e.target.value,
                        cantidad_unidades: item?.cantidad_unidades ?? '',
                        nombre: f.nombre || nombreAuto,
                      }))
                      setCantidadBloqueada(item?.cantidad_unidades != null)
                      if (item?.imagen_url) { setPreview(item.imagen_url); setCatalogImagenUrl(item.imagen_url) }
                    }}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                    <option value="">Seleccionar presentación...</option>
                    {presOpts.map(p => (
                      <option key={p.id} value={p.presentacion}>
                        {p.presentacion}{p.cantidad_unidades ? ` — ${p.cantidad_unidades} unidades` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Marca</label>
              <input value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })}
                placeholder="ej: Pampers"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          )}

          {/* Unidades: bloqueada si vino del catálogo, editable si no */}
          {(form.talle || !marcasOpts.length) && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Talle / Presentación</label>
                <input value={form.talle} onChange={(e) => { setForm({ ...form, talle: e.target.value }); setCantidadBloqueada(false) }}
                  placeholder="ej: G, 500ml..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Unidades en el pack
                  {cantidadBloqueada && <span className="ml-1 text-green-600 font-normal">(auto)</span>}
                </label>
                {cantidadBloqueada
                  ? (
                    <div className="flex items-center gap-2 border border-green-200 bg-green-50 rounded-xl px-3 py-2">
                      <span className="text-sm font-bold text-green-700 flex-1">{form.cantidad_unidades} u</span>
                      <button type="button" onClick={() => setCantidadBloqueada(false)} className="text-xs text-gray-400 hover:text-gray-600">editar</button>
                    </div>
                  ) : (
                    <input type="number" value={form.cantidad_unidades} onChange={(e) => setForm({ ...form, cantidad_unidades: e.target.value })}
                      placeholder="ej: 60"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  )
                }
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Descripción</label>
            <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Descripción del producto..." rows={2}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Precio *</label>
              <input type="number" value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })}
                placeholder="5850"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Stock *</label>
              <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })}
                placeholder="10"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 btn-secondary justify-center py-2.5 text-sm">Cancelar</button>
          <button onClick={guardar} disabled={guardando} className="flex-1 btn-primary justify-center py-2.5 text-sm disabled:opacity-60">
            {guardando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear producto'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminStock() {
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)         // false = cerrado, null = nuevo, objeto = editar
  const [busqueda, setBusqueda] = useState('')
  const [confirmarEliminar, setConfirmarEliminar] = useState(null)
  const [avisos, setAvisos] = useState([])

  useEffect(() => { cargar(); cargarAvisos() }, [])

  async function cargarAvisos() {
    const { data } = await supabase
      .from('avisos_stock')
      .select('*, productos(nombre)')
      .eq('notificado', false)
      .order('created_at', { ascending: false })
    if (data) setAvisos(data)
  }

  async function marcarNotificado(id) {
    await supabase.from('avisos_stock').update({ notificado: true }).eq('id', id)
    setAvisos((prev) => prev.filter((a) => a.id !== id))
    toast.success('Marcado como notificado')
  }

  async function cargar() {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('productos').select('*').order('nombre')
      if (error || !data) throw error
      setProductos(data)
    } catch {
      setProductos(STOCK_DEMO)
    }
    setLoading(false)
  }

  async function actualizarCampo(id, campo, valor) {
    try {
      const { error } = await supabase.from('productos').update({ [campo]: valor }).eq('id', id)
      if (error) throw error
      setProductos((prev) => prev.map((p) => (p.id === id ? { ...p, [campo]: valor } : p)))
      toast.success('Actualizado')
    } catch { toast.error('Error al actualizar') }
  }

  async function toggleActivo(id, activo) {
    await actualizarCampo(id, 'activo', !activo)
  }

  async function eliminarProducto(id) {
    try {
      const { error } = await supabase.from('productos').delete().eq('id', id)
      if (error) throw error
      setProductos((prev) => prev.filter((p) => p.id !== id))
      toast.success('Producto eliminado')
    } catch { toast.error('Error al eliminar') }
    setConfirmarEliminar(null)
  }

  const handleGuardado = (productoActualizado) => {
    setProductos((prev) => {
      const existe = prev.find((p) => p.id === productoActualizado.id)
      if (existe) return prev.map((p) => p.id === productoActualizado.id ? productoActualizado : p)
      return [productoActualizado, ...prev]
    })
  }

  const filtrados = productos.filter((p) =>
    !busqueda || p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || (p.marca || '').toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-gray-900">Stock</h1>
        <button onClick={() => setModal(null)} className="btn-primary text-sm py-2">
          <Plus size={16} /> Agregar producto
        </button>
      </div>

      {/* Avisos de stock */}
      {avisos.length > 0 && (
        <div className="card p-4 mb-6 border-l-4 border-primary">
          <div className="flex items-center gap-2 mb-3">
            <Bell size={16} className="text-primary" />
            <h2 className="font-display font-bold text-gray-800">
              Clientes esperando stock ({avisos.length})
            </h2>
          </div>
          <div className="space-y-2">
            {avisos.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 bg-pink-50 rounded-xl px-4 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {a.nombre} — <span className="text-primary">{a.telefono}</span>
                  </p>
                  <p className="text-xs text-muted truncate">
                    {a.productos?.nombre}{a.variante_label ? ` · ${a.variante_label}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`https://wa.me/549${a.telefono.replace(/\D/g,'')}?text=${encodeURIComponent(`Hola ${a.nombre}! 👋 Te avisamos que el producto que pediste volvió a tener stock en Tatitos Pañalera. ¡Aprovechá antes que se agote! 🛒`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs bg-[#25D366] text-white px-3 py-1.5 rounded-full font-semibold hover:bg-[#20b958]"
                  >
                    WhatsApp
                  </a>
                  <button
                    onClick={() => marcarNotificado(a.id)}
                    className="text-xs text-muted hover:text-green-600 px-2 py-1.5 rounded-full hover:bg-green-50"
                  >
                    <Check size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Buscador */}
      <div className="mb-4">
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar producto o marca..."
          className="w-full max-w-sm border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
      </div>

      {loading ? (
        <div className="text-center py-20 text-muted">Cargando...</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Producto</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Categoría</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Precio</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Stock</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Estado</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Activo</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtrados.map((p) => (
                <tr key={p.id} className={`hover:bg-gray-50 ${!p.activo ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.imagen_url
                        ? <img src={p.imagen_url} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                        : <div className="w-9 h-9 rounded-lg bg-gray-100 shrink-0" />
                      }
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{p.nombre}</p>
                        {p.marca && <p className="text-xs text-muted">{p.marca}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 capitalize text-gray-600 text-sm">{p.categoria}</td>
                  <td className="px-4 py-3">
                    <EditableCell value={p.precio} prefix="$" onSave={(v) => actualizarCampo(p.id, 'precio', v)} />
                  </td>
                  <td className="px-4 py-3">
                    <EditableCell value={p.stock} onSave={(v) => actualizarCampo(p.id, 'stock', v)} />
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge text-xs ${stockColor(p.stock)}`}>{stockLabel(p.stock)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActivo(p.id, p.activo)} className="text-gray-400 hover:text-primary">
                      {p.activo ? <ToggleRight size={22} className="text-green-500" /> : <ToggleLeft size={22} />}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setModal(p)}
                        className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-secondary/10 hover:text-secondary flex items-center justify-center transition-colors"
                        title="Editar"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => setConfirmarEliminar(p)}
                        className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtrados.length === 0 && (
            <p className="text-center py-10 text-muted text-sm">No se encontraron productos</p>
          )}
        </div>
      )}

      {/* Modal crear / editar */}
      {modal !== false && (
        <ModalProducto
          producto={modal}
          onClose={() => setModal(false)}
          onGuardado={handleGuardado}
        />
      )}

      {/* Confirmar eliminar */}
      {confirmarEliminar && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 text-center">
            <Trash2 size={32} className="text-red-400 mx-auto mb-3" />
            <h3 className="font-display font-bold text-lg text-gray-900 mb-1">¿Eliminar producto?</h3>
            <p className="text-sm text-muted mb-6">
              "<span className="font-medium text-gray-700">{confirmarEliminar.nombre}</span>" se eliminará permanentemente.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmarEliminar(null)} className="flex-1 btn-secondary justify-center py-2.5 text-sm">
                Cancelar
              </button>
              <button
                onClick={() => eliminarProducto(confirmarEliminar.id)}
                className="flex-1 bg-red-500 text-white font-semibold py-2.5 rounded-full text-sm hover:bg-red-600 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
