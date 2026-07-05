import { useState, useEffect, useRef } from 'react'
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { ScanLine, Camera, CameraOff, Plus, Minus, Check, Search, X, Package, ChevronRight, ArrowLeft } from 'lucide-react'

async function fetchImagenOFF(ean) {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${ean}.json`)
    const json = await res.json()
    if (json.status !== 1) return null
    const p = json.product
    return p.image_front_small_url || p.image_url || null
  } catch {
    return null
  }
}

const FASE = { ESCANEAR: 'escanear', BUSCAR: 'buscar', CONFIRMAR: 'confirmar' }

export default function AdminEscaner() {
  const videoRef = useRef(null)
  const readerRef = useRef(null)
  const busquedaRef = useRef(null)

  const [fase, setFase] = useState(FASE.ESCANEAR)
  const [escaneando, setEscaneando] = useState(false)
  const [eanManual, setEanManual] = useState('')

  // Fase BUSCAR
  const [eanCapturado, setEanCapturado] = useState('')
  const [imagenOff, setImagenOff] = useState(null)
  const [cargandoImagen, setCargandoImagen] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [todosLosProductos, setTodosLosProductos] = useState([])
  const [productoPreseleccionado, setProductoPreseleccionado] = useState(null)

  // Fase CONFIRMAR
  const [productoSeleccionado, setProductoSeleccionado] = useState(null) // null = no está en DB
  const [nombreManual, setNombreManual] = useState('')
  const [cantidad, setCantidad] = useState(1)
  const [proveedor, setProveedor] = useState('')
  const [notas, setNotas] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [exito, setExito] = useState(false)

  useEffect(() => { return () => pararEscaner() }, [])

  useEffect(() => {
    supabase.from('productos').select('id, nombre, marca, stock, precio, imagen_url, ean, categoria')
      .eq('activo', true).order('nombre')
      .then(({ data }) => setTodosLosProductos(data || []))
  }, [])

  // Auto-focus en buscador al entrar a fase buscar
  useEffect(() => {
    if (fase === FASE.BUSCAR) {
      setTimeout(() => busquedaRef.current?.focus(), 100)
    }
  }, [fase])

  const productosFiltered = busqueda.trim().length >= 1
    ? todosLosProductos.filter((p) =>
        p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (p.marca || '').toLowerCase().includes(busqueda.toLowerCase())
      )
    : todosLosProductos

  async function iniciarEscaner() {
    try {
      const reader = new BrowserMultiFormatReader()
      readerRef.current = reader
      setEscaneando(true)
      await reader.decodeFromVideoDevice(null, videoRef.current, (result, err) => {
        if (result) {
          pararEscaner()
          entrarFaseBuscar(result.getText())
        }
        if (err && !(err instanceof NotFoundException)) console.error(err)
      })
    } catch {
      toast.error('No se pudo acceder a la cámara')
      setEscaneando(false)
    }
  }

  function pararEscaner() {
    readerRef.current?.reset()
    setEscaneando(false)
  }

  async function entrarFaseBuscar(ean) {
    const eanLimpio = ean.trim()
    if (!eanLimpio) return

    setEanCapturado(eanLimpio)
    setBusqueda('')
    setImagenOff(null)
    setProductoPreseleccionado(null)
    setFase(FASE.BUSCAR)

    // Buscar imagen en OFF en background
    setCargandoImagen(true)
    fetchImagenOFF(eanLimpio).then((img) => {
      setImagenOff(img)
      setCargandoImagen(false)
    })

    // Verificar si el EAN ya está en la DB → pre-seleccionar
    const { data: prodDirecto } = await supabase
      .from('productos')
      .select('*')
      .eq('activo', true)
      .eq('ean', eanLimpio)
      .maybeSingle()

    if (prodDirecto) {
      setProductoPreseleccionado(prodDirecto)
    }
  }

  function seleccionarProducto(prod) {
    setProductoSeleccionado(prod)
    setNombreManual('')
    setCantidad(1)
    setProveedor('')
    setNotas('')
    setExito(false)
    setFase(FASE.CONFIRMAR)
  }

  function seleccionarNoEsta() {
    setProductoSeleccionado(null)
    setNombreManual('')
    setCantidad(1)
    setProveedor('')
    setNotas('')
    setExito(false)
    setFase(FASE.CONFIRMAR)
  }

  function resetear() {
    pararEscaner()
    setFase(FASE.ESCANEAR)
    setEanCapturado('')
    setImagenOff(null)
    setBusqueda('')
    setProductoPreseleccionado(null)
    setProductoSeleccionado(null)
    setNombreManual('')
    setCantidad(1)
    setProveedor('')
    setNotas('')
    setEanManual('')
    setExito(false)
  }

  async function confirmarIngreso() {
    const nombreFinal = productoSeleccionado?.nombre || nombreManual.trim()
    if (!nombreFinal) { toast.error('Ingresá el nombre del producto'); return }

    setGuardando(true)
    try {
      if (productoSeleccionado) {
        const updates = { stock: productoSeleccionado.stock + cantidad }
        if (!productoSeleccionado.ean && eanCapturado) updates.ean = eanCapturado
        await supabase.from('productos').update(updates).eq('id', productoSeleccionado.id)
      }

      await supabase.from('ingresos_stock').insert({
        producto_id: productoSeleccionado?.id || null,
        nombre_producto: nombreFinal,
        marca: productoSeleccionado?.marca || null,
        categoria: productoSeleccionado?.categoria || null,
        cantidad,
        precio_venta: productoSeleccionado?.precio || 0,
        proveedor: proveedor.trim() || null,
        notas: notas.trim() || null,
        ean: eanCapturado || null,
      })

      toast.success(`+${cantidad} unidades agregadas${productoSeleccionado ? ` a "${productoSeleccionado.nombre}"` : ''}`)
      setExito(true)
      setTimeout(resetear, 2000)
    } catch {
      toast.error('Error al guardar')
    }
    setGuardando(false)
  }

  const imagenProducto = productoSeleccionado?.imagen_url || imagenOff

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <ScanLine size={24} className="text-primary" />
        <h1 className="font-display text-2xl font-bold text-gray-900">Escanear producto</h1>
      </div>

      {/* ── FASE: ESCANEAR ── */}
      {fase === FASE.ESCANEAR && (
        <>
          <div className="card overflow-hidden mb-4">
            <div className="relative bg-gray-900 aspect-video flex items-center justify-center">
              <video ref={videoRef} className={`w-full h-full object-cover ${escaneando ? 'block' : 'hidden'}`} />
              {!escaneando && (
                <div className="flex flex-col items-center gap-3 text-gray-500 py-10">
                  <Camera size={48} />
                  <p className="text-sm">Cámara apagada</p>
                </div>
              )}
              {escaneando && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-56 h-32 border-2 border-primary rounded-lg opacity-70" />
                </div>
              )}
            </div>
            <div className="p-4 flex gap-3">
              {!escaneando ? (
                <button onClick={iniciarEscaner} className="flex-1 btn-primary justify-center gap-2">
                  <Camera size={18} /> Activar cámara
                </button>
              ) : (
                <button onClick={pararEscaner} className="flex-1 btn-secondary justify-center gap-2">
                  <CameraOff size={18} /> Detener
                </button>
              )}
            </div>
          </div>

          <div className="card p-4">
            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">O ingresá el código manualmente</p>
            <div className="flex gap-2">
              <input
                value={eanManual}
                onChange={(e) => setEanManual(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && entrarFaseBuscar(eanManual)}
                placeholder="Ej: 7790580018016"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                onClick={() => entrarFaseBuscar(eanManual)}
                disabled={!eanManual.trim()}
                className="btn-primary px-4 py-2 disabled:opacity-50"
              >
                <Search size={16} />
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── FASE: BUSCAR ── */}
      {fase === FASE.BUSCAR && (
        <div className="card overflow-hidden">
          {/* EAN capturado */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <ScanLine size={16} className="text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted">EAN escaneado</p>
              <p className="font-mono text-sm font-bold text-gray-800 truncate">{eanCapturado}</p>
            </div>
            <button onClick={resetear} className="text-gray-400 hover:text-gray-600 p-1">
              <X size={18} />
            </button>
          </div>

          <div className="p-4">
            {/* Si ya está en DB por EAN */}
            {productoPreseleccionado && (
              <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                {productoPreseleccionado.imagen_url
                  ? <img src={productoPreseleccionado.imagen_url} alt="" className="w-10 h-10 object-contain rounded-lg border border-white shrink-0" />
                  : <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center shrink-0"><Package size={16} className="text-green-400" /></div>
                }
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-green-700 mb-0.5">Reconocido automáticamente</p>
                  <p className="text-sm font-bold text-gray-900 truncate">{productoPreseleccionado.nombre}</p>
                  <p className="text-xs text-green-600">Stock: {productoPreseleccionado.stock} ud.</p>
                </div>
                <button
                  onClick={() => seleccionarProducto(productoPreseleccionado)}
                  className="btn-primary px-3 py-1.5 text-sm shrink-0"
                >
                  Usar <ChevronRight size={14} />
                </button>
              </div>
            )}

            {/* Buscador */}
            <p className="text-xs font-semibold text-gray-600 mb-2">
              {productoPreseleccionado ? 'O buscá otro producto:' : '¿A qué producto corresponde este código?'}
            </p>
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={busquedaRef}
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Escribí el nombre del producto..."
                className="w-full pl-8 pr-3 border border-gray-200 rounded-xl py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Lista de productos */}
            <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-200 divide-y divide-gray-50 mb-3">
              {productosFiltered.length === 0 && busqueda.trim() ? (
                <p className="text-center py-4 text-xs text-muted">Sin resultados para "{busqueda}"</p>
              ) : (
                productosFiltered.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => seleccionarProducto(p)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-pink-50 text-left transition-colors"
                  >
                    {p.imagen_url
                      ? <img src={p.imagen_url} alt="" className="w-9 h-9 object-contain rounded-lg shrink-0 border border-gray-100" />
                      : <div className="w-9 h-9 bg-gray-100 rounded-lg shrink-0 flex items-center justify-center"><Package size={14} className="text-gray-300" /></div>
                    }
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate leading-tight">{p.nombre}</p>
                      <p className="text-xs text-muted">{p.marca ? `${p.marca} · ` : ''}{p.stock} ud. en stock</p>
                    </div>
                    {p.ean && <span className="text-xs font-medium text-green-500 shrink-0">EAN ✓</span>}
                    <ChevronRight size={14} className="text-gray-300 shrink-0" />
                  </button>
                ))
              )}
            </div>

            {/* No está en DB */}
            <button
              onClick={seleccionarNoEsta}
              className="w-full text-center text-xs text-gray-400 hover:text-primary py-2 border border-dashed border-gray-200 hover:border-primary rounded-xl transition-colors"
            >
              No está en el catálogo — ingresar de todas formas
            </button>
          </div>
        </div>
      )}

      {/* ── FASE: CONFIRMAR ── */}
      {fase === FASE.CONFIRMAR && (
        <div className={`card overflow-hidden transition-all ${exito ? 'border-2 border-green-400' : ''}`}>
          {exito && (
            <div className="bg-green-50 py-3 flex items-center justify-center gap-2 text-green-700 font-semibold text-sm">
              <Check size={18} /> ¡Ingreso registrado!
            </div>
          )}

          {/* Header producto */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b">
            <button onClick={() => setFase(FASE.BUSCAR)} className="text-gray-400 hover:text-gray-700 p-1 -ml-1">
              <ArrowLeft size={18} />
            </button>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <ScanLine size={16} className="text-primary" />
            </div>
            <p className="font-mono text-xs text-muted truncate">{eanCapturado}</p>
          </div>

          <div className="p-5">
            {/* Producto card */}
            <div className="flex gap-4 mb-5">
              {imagenProducto ? (
                <img src={imagenProducto} alt="" className="w-20 h-20 object-contain rounded-xl border border-gray-100 shrink-0 bg-white" />
              ) : cargandoImagen ? (
                <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                  <Package size={32} className="text-gray-300" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                {productoSeleccionado ? (
                  <>
                    <p className="text-xs font-semibold text-primary uppercase mb-0.5">Producto de la tienda</p>
                    <p className="font-display font-bold text-gray-900 leading-tight">{productoSeleccionado.nombre}</p>
                    {productoSeleccionado.marca && <p className="text-sm text-muted mt-0.5">{productoSeleccionado.marca}</p>}
                    <p className="text-xs text-green-600 mt-1">Stock actual: {productoSeleccionado.stock} ud.</p>
                    {!productoSeleccionado.ean && eanCapturado && (
                      <p className="text-xs text-blue-500 mt-0.5">Se guardará el EAN al confirmar</p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-xs font-semibold text-yellow-600 uppercase mb-1">Producto no vinculado</p>
                    <input
                      value={nombreManual}
                      onChange={(e) => setNombreManual(e.target.value)}
                      placeholder="Nombre del producto..."
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
                      autoFocus
                    />
                    <p className="text-xs text-muted mt-1">Solo se registrará el ingreso, sin afectar stock</p>
                  </>
                )}
              </div>
            </div>

            {/* Cantidad */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 mb-2">Unidades que ingresan</label>
              <div className="flex items-center gap-3">
                <button onClick={() => setCantidad(Math.max(1, cantidad - 1))} className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                  <Minus size={16} />
                </button>
                <input
                  type="number"
                  value={cantidad}
                  onChange={(e) => setCantidad(Math.max(1, Number(e.target.value)))}
                  className="w-20 text-center text-xl font-bold border border-gray-200 rounded-xl py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button onClick={() => setCantidad(cantidad + 1)} className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                  <Plus size={16} />
                </button>
                {productoSeleccionado && (
                  <span className="text-sm text-muted">→ {productoSeleccionado.stock + cantidad} ud.</span>
                )}
              </div>
            </div>

            {/* Proveedor y notas */}
            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Proveedor <span className="text-gray-400 font-normal">(opcional)</span></label>
                <input value={proveedor} onChange={(e) => setProveedor(e.target.value)} placeholder="Ej: Distribuidora Norte"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Notas <span className="text-gray-400 font-normal">(opcional)</span></label>
                <input value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Ej: Lote nuevo, vence 12/2026"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={resetear} className="btn-secondary py-3 px-4">
                <X size={16} />
              </button>
              <button
                onClick={confirmarIngreso}
                disabled={guardando || exito || (!productoSeleccionado && !nombreManual.trim())}
                className="flex-1 btn-primary justify-center py-3 disabled:opacity-60"
              >
                {guardando ? 'Guardando...' : `Confirmar +${cantidad} unidades`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
