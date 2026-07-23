import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { ImageIcon, Upload, AlertTriangle, CheckCircle, Package } from 'lucide-react'

function ProductoCard({ producto, esDuplicado, onActualizar }) {
  const [subiendo, setSubiendo] = useState(false)
  const inputRef = useRef()

  async function manejarImagen(e) {
    const file = e.target.files[0]
    if (!file) return
    setSubiendo(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('productos-img').upload(path, file)
      if (upErr) throw upErr
      const { data: urlData } = supabase.storage.from('productos-img').getPublicUrl(path)
      const nuevaUrl = urlData.publicUrl
      const { error } = await supabase.from('productos').update({ imagen_url: nuevaUrl }).eq('id', producto.id)
      if (error) throw error
      toast.success('Imagen actualizada')
      onActualizar(producto.id, nuevaUrl)
    } catch {
      toast.error('Error al subir imagen')
    }
    setSubiendo(false)
  }

  return (
    <div className={`card overflow-hidden flex flex-col ${esDuplicado ? 'ring-2 ring-orange-400' : ''}`}>
      {/* Badge duplicado */}
      {esDuplicado && (
        <div className="bg-orange-400 text-white text-[10px] font-bold px-2 py-1 flex items-center gap-1">
          <AlertTriangle size={11} /> IMAGEN DUPLICADA
        </div>
      )}

      {/* Imagen */}
      <div className="relative bg-gray-50 aspect-square flex items-center justify-center overflow-hidden">
        {producto.imagen_url ? (
          <img
            src={producto.imagen_url}
            alt={producto.nombre}
            className="w-full h-full object-contain p-2"
            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
          />
        ) : null}
        <div className={`absolute inset-0 flex flex-col items-center justify-center text-gray-300 ${producto.imagen_url ? 'hidden' : 'flex'}`}>
          <Package size={36} />
          <span className="text-xs mt-1">Sin imagen</span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <p className="text-xs font-semibold text-gray-800 leading-tight line-clamp-2">{producto.nombre}</p>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={manejarImagen}
        />
        <button
          onClick={() => inputRef.current.click()}
          disabled={subiendo}
          className="mt-auto w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-xl border-2 border-dashed border-gray-200 text-gray-500 hover:border-primary hover:text-primary transition-colors disabled:opacity-60"
        >
          {subiendo ? (
            <span>Subiendo...</span>
          ) : (
            <><Upload size={13} /> Cambiar imagen</>
          )}
        </button>
      </div>
    </div>
  )
}

export default function AdminImagenes() {
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('todos')

  useEffect(() => {
    async function cargar() {
      const { data } = await supabase.from('productos').select('id, nombre, imagen_url, categoria').eq('activo', true).order('nombre')
      setProductos(data || [])
      setLoading(false)
    }
    cargar()
  }, [])

  // Detectar URLs duplicadas
  const urlCount = {}
  productos.forEach((p) => {
    if (p.imagen_url) urlCount[p.imagen_url] = (urlCount[p.imagen_url] || 0) + 1
  })
  const duplicados = new Set(Object.entries(urlCount).filter(([, c]) => c > 1).map(([url]) => url))

  const sinImagen = productos.filter((p) => !p.imagen_url)
  const conDuplicado = productos.filter((p) => duplicados.has(p.imagen_url))
  const correctos = productos.filter((p) => p.imagen_url && !duplicados.has(p.imagen_url))

  const lista =
    filtro === 'duplicados' ? conDuplicado
    : filtro === 'sin-imagen' ? sinImagen
    : filtro === 'ok' ? correctos
    : productos

  function actualizarUrl(id, nuevaUrl) {
    setProductos((prev) => prev.map((p) => p.id === id ? { ...p, imagen_url: nuevaUrl } : p))
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ImageIcon size={24} className="text-primary" />
          <h1 className="font-display text-2xl font-bold text-gray-900">Revisión de imágenes</h1>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {conDuplicado.length > 0 && (
            <span className="flex items-center gap-1 text-orange-600 font-semibold">
              <AlertTriangle size={15} /> {conDuplicado.length} con imagen duplicada
            </span>
          )}
          {sinImagen.length > 0 && (
            <span className="text-muted">{sinImagen.length} sin imagen</span>
          )}
          <span className="flex items-center gap-1 text-green-600">
            <CheckCircle size={15} /> {correctos.length} correctos
          </span>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit flex-wrap">
        {[
          { key: 'todos', label: `Todos (${productos.length})` },
          { key: 'duplicados', label: `⚠️ Duplicados (${conDuplicado.length})` },
          { key: 'sin-imagen', label: `Sin imagen (${sinImagen.length})` },
          { key: 'ok', label: `✓ Correctos (${correctos.length})` },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFiltro(key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${filtro === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card p-12 text-center text-muted">Cargando productos...</div>
      ) : lista.length === 0 ? (
        <div className="card p-12 text-center text-muted">No hay productos en esta categoría</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {lista.map((p) => (
            <ProductoCard
              key={p.id}
              producto={p}
              esDuplicado={duplicados.has(p.imagen_url)}
              onActualizar={actualizarUrl}
            />
          ))}
        </div>
      )}
    </div>
  )
}
