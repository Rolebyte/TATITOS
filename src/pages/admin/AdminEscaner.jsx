import { useState, useEffect, useRef } from 'react'
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { ScanLine, Camera, CameraOff, Plus, Minus, Check, Search, X, Package, Link } from 'lucide-react'

const OFF_URL = 'https://world.openfoodfacts.org/api/v0/product'

async function buscarEnOpenFoodFacts(ean) {
  try {
    const res = await fetch(`${OFF_URL}/${ean}.json`)
    const json = await res.json()
    if (json.status !== 1) return null
    const p = json.product
    return {
      nombre: p.product_name_es || p.product_name || '',
      marca:  p.brands?.split(',')[0]?.trim() || '',
      imagen_url: p.image_front_small_url || p.image_url || null,
    }
  } catch {
    return null
  }
}

export default function AdminEscaner() {
  const videoRef = useRef(null)
  const readerRef = useRef(null)
  const [escaneando, setEscaneando] = useState(false)
  const [eanManual, setEanManual] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [cantidad, setCantidad] = useState(1)
  const [proveedor, setProveedor] = useState('')
  const [notas, setNotas] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [exito, setExito] = useState(false)

  // Buscador manual de producto
  const [busquedaManual, setBusquedaManual] = useState('')
  const [productosManual, setProductosManual] = useState([])
  const [buscandoManual, setBuscandoManual] = useState(false)
  const [productoManualSeleccionado, setProductoManualSeleccionado] = useState(null)

  useEffect(() => { return () => pararEscaner() }, [])

  // Búsqueda manual debounced
  useEffect(() => {
    if (!busquedaManual.trim() || busquedaManual.length < 2) { setProductosManual([]); return }
    const t = setTimeout(async () => {
      setBuscandoManual(true)
      const { data } = await supabase
        .from('productos')
        .select('id, nombre, marca, stock, precio, imagen_url, ean')
        .eq('activo', true)
        .ilike('nombre', `%${busquedaManual}%`)
        .limit(6)
      setProductosManual(data || [])
      setBuscandoManual(false)
    }, 300)
    return () => clearTimeout(t)
  }, [busquedaManual])

  async function iniciarEscaner() {
    try {
      const reader = new BrowserMultiFormatReader()
      readerRef.current = reader
      setEscaneando(true)
      await reader.decodeFromVideoDevice(null, videoRef.current, (result, err) => {
        if (result) { pararEscaner(); buscarProducto(result.getText()) }
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

  async function buscarProducto(ean) {
    const eanLimpio = ean.trim()
    if (!eanLimpio) return
    setBuscando(true)
    setResultado(null)
    setExito(false)
    setCantidad(1)
    setProductoManualSeleccionado(null)
    setBusquedaManual('')
    setProductosManual([])

    try {
      // 1) Buscar directamente en productos por EAN
      const { data: prodDirecto } = await supabase
        .from('productos')
        .select('*')
        .eq('activo', true)
        .eq('ean', eanLimpio)
        .maybeSingle()

      if (prodDirecto) {
        setResultado({
          ean: eanLimpio,
          nombre: prodDirecto.nombre,
          marca: prodDirecto.marca || '',
          imagen_url: prodDirecto.imagen_url,
          productoExistente: prodDirecto,
          fuente: 'productos',
          necesitaBuscadorManual: false,
        })
        setBuscando(false)
        return
      }

      // 2) Buscar en catalogo_productos por EAN
      const { data: cat } = await supabase
        .from('catalogo_productos')
        .select('*')
        .eq('ean', eanLimpio)
        .eq('activo', true)
        .limit(1)
        .maybeSingle()

      if (cat) {
        const nombreAuto = [cat.marca, cat.linea, cat.presentacion].filter(Boolean).join(' ')
        const { data: prods } = await supabase
          .from('productos')
          .select('*')
          .eq('activo', true)
          .ilike('nombre', `%${cat.marca || ''}%`)
          .limit(5)
        setResultado({
          ean: eanLimpio,
          nombre: nombreAuto,
          marca: cat.marca,
          imagen_url: cat.imagen_url,
          productoExistente: prods?.[0] || null,
          fuente: 'catalogo',
          necesitaBuscadorManual: !prods?.[0],
        })
        setBuscando(false)
        return
      }

      // 3) Open Food Facts
      const off = await buscarEnOpenFoodFacts(eanLimpio)
      if (off && off.nombre) {
        const { data: prods } = await supabase
          .from('productos')
          .select('*')
          .eq('activo', true)
          .ilike('nombre', `%${off.marca || off.nombre.split(' ')[0]}%`)
          .limit(5)
        setResultado({
          ean: eanLimpio,
          nombre: off.nombre,
          marca: off.marca,
          imagen_url: off.imagen_url,
          productoExistente: prods?.[0] || null,
          fuente: 'openfoodfacts',
          necesitaBuscadorManual: !prods?.[0],
        })
        setBuscando(false)
        return
      }

      // 4) No encontrado — mostrar buscador manual
      setResultado({
        ean: eanLimpio,
        nombre: '',
        marca: '',
        imagen_url: null,
        productoExistente: null,
        fuente: 'manual',
        necesitaBuscadorManual: true,
      })
    } catch {
      toast.error('Error al buscar el producto')
    }
    setBuscando(false)
  }

  function seleccionarProductoManual(prod) {
    setProductoManualSeleccionado(prod)
    setBusquedaManual(prod.nombre)
    setProductosManual([])
    setResultado(prev => ({ ...prev, productoExistente: prod, necesitaBuscadorManual: false }))
  }

  async function confirmarIngreso() {
    if (!resultado) return
    setGuardando(true)
    try {
      const prod = resultado.productoExistente

      if (prod) {
        // Guardar EAN en el producto si no lo tenía (para reconocimiento futuro)
        if (!prod.ean && resultado.ean) {
          await supabase.from('productos').update({ stock: prod.stock + cantidad, ean: resultado.ean }).eq('id', prod.id)
        } else {
          await supabase.from('productos').update({ stock: prod.stock + cantidad }).eq('id', prod.id)
        }
      }

      await supabase.from('ingresos_stock').insert({
        producto_id: prod?.id || null,
        nombre_producto: prod?.nombre || resultado.nombre || `EAN ${resultado.ean}`,
        marca: prod?.marca || resultado.marca || null,
        categoria: prod?.categoria || null,
        cantidad,
        precio_venta: prod?.precio || 0,
        proveedor: proveedor.trim() || null,
        notas: notas.trim() || null,
        ean: resultado.ean,
      })

      toast.success(prod
        ? `+${cantidad} unidades agregadas a "${prod.nombre}"`
        : 'Ingreso registrado sin producto vinculado')

      setExito(true)
      setTimeout(() => {
        setResultado(null); setExito(false); setCantidad(1)
        setProveedor(''); setNotas(''); setEanManual('')
        setProductoManualSeleccionado(null); setBusquedaManual('')
      }, 2000)
    } catch {
      toast.error('Error al guardar')
    }
    setGuardando(false)
  }

  const prod = resultado?.productoExistente

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <ScanLine size={24} className="text-primary" />
        <h1 className="font-display text-2xl font-bold text-gray-900">Escanear producto</h1>
      </div>

      {/* Scanner */}
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

      {/* Ingreso manual de EAN */}
      <div className="card p-4 mb-4">
        <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">O ingresá el código manualmente</p>
        <div className="flex gap-2">
          <input
            value={eanManual}
            onChange={(e) => setEanManual(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && buscarProducto(eanManual)}
            placeholder="Ej: 7790580018016"
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            onClick={() => buscarProducto(eanManual)}
            disabled={!eanManual.trim() || buscando}
            className="btn-primary px-4 py-2 disabled:opacity-50"
          >
            <Search size={16} />
          </button>
        </div>
      </div>

      {buscando && (
        <div className="card p-8 text-center text-muted">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
          Buscando producto...
        </div>
      )}

      {resultado && !buscando && (
        <div className={`card overflow-hidden transition-all ${exito ? 'border-2 border-green-400' : ''}`}>
          {exito && (
            <div className="bg-green-50 py-3 flex items-center justify-center gap-2 text-green-700 font-semibold text-sm">
              <Check size={18} /> ¡Ingreso registrado!
            </div>
          )}

          <div className="p-5">
            {/* Header */}
            <div className="flex gap-4 mb-4">
              {resultado.imagen_url ? (
                <img src={resultado.imagen_url} alt="" className="w-20 h-20 object-contain rounded-xl border border-gray-100 shrink-0" />
              ) : (
                <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                  <Package size={32} className="text-gray-300" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-semibold text-primary uppercase mb-0.5">
                  {resultado.fuente === 'productos' ? 'Encontrado en tienda' :
                   resultado.fuente === 'catalogo' ? 'Catálogo Tatitos' :
                   resultado.fuente === 'openfoodfacts' ? 'Open Food Facts' : 'EAN escaneado'}
                </p>
                <p className="font-display font-bold text-gray-900 leading-tight">
                  {resultado.nombre || <span className="text-gray-400 italic">Sin nombre externo</span>}
                </p>
                {resultado.marca && <p className="text-sm text-muted mt-0.5">{resultado.marca}</p>}
                <p className="text-xs text-gray-400 mt-1 font-mono">EAN: {resultado.ean}</p>
              </div>
            </div>

            {/* Producto vinculado o buscador manual */}
            {prod && !resultado.necesitaBuscadorManual ? (
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-green-700">
                    {resultado.fuente === 'productos' ? 'Producto identificado' : 'Producto en tienda'}
                  </p>
                  <p className="text-sm text-gray-800 font-medium">{prod.nombre}</p>
                  <p className="text-xs text-green-600">
                    Stock actual: {prod.stock} ud.
                    {prod.precio ? ` · $${prod.precio.toLocaleString('es-AR')}` : ''}
                    {!prod.ean && resultado.ean ? ' · Se guardará el EAN al confirmar' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {!prod.ean && resultado.ean && <Link size={14} className="text-green-500" />}
                  <Check size={20} className="text-green-500 shrink-0" />
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2.5 mb-3">
                  <p className="text-xs font-semibold text-yellow-700">Producto no identificado automáticamente</p>
                  <p className="text-xs text-yellow-600 mt-0.5">Buscá el nombre del producto para vincularlo y guardar el EAN</p>
                </div>

                {/* Buscador manual */}
                <div className="relative">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        value={busquedaManual}
                        onChange={(e) => { setBusquedaManual(e.target.value); setProductoManualSeleccionado(null) }}
                        placeholder="Buscar producto en la tienda..."
                        className="w-full pl-8 pr-3 border border-gray-200 rounded-xl py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    {productoManualSeleccionado && (
                      <button
                        onClick={() => {
                          setProductoManualSeleccionado(null)
                          setBusquedaManual('')
                          setResultado(prev => ({ ...prev, productoExistente: null, necesitaBuscadorManual: true }))
                        }}
                        className="btn-secondary px-3"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {buscandoManual && <div className="text-xs text-muted mt-1 px-1">Buscando...</div>}

                  {productosManual.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-xl shadow-lg mt-1 overflow-hidden">
                      {productosManual.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => seleccionarProductoManual(p)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 border-b last:border-0 text-left"
                        >
                          {p.imagen_url
                            ? <img src={p.imagen_url} alt="" className="w-10 h-10 object-contain rounded-lg shrink-0" />
                            : <div className="w-10 h-10 bg-gray-100 rounded-lg shrink-0 flex items-center justify-center"><Package size={16} className="text-gray-300" /></div>
                          }
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{p.nombre}</p>
                            <p className="text-xs text-muted">Stock: {p.stock} ud.</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {productoManualSeleccionado && (
                  <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 mt-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-green-700">Producto seleccionado</p>
                      <p className="text-sm text-gray-800 font-medium">{productoManualSeleccionado.nombre}</p>
                      <p className="text-xs text-green-600">Stock: {productoManualSeleccionado.stock} ud. · EAN se guardará para reconocimiento futuro</p>
                    </div>
                    <Link size={16} className="text-green-500 shrink-0" />
                  </div>
                )}
              </div>
            )}

            {/* Cantidad */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 mb-2">Unidades que ingresan al stock</label>
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
                <span className="text-sm text-muted">
                  {prod ? `→ stock: ${prod.stock + cantidad} ud.` : 'unidades'}
                </span>
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
              <button
                onClick={() => { setResultado(null); setEanManual(''); setProductoManualSeleccionado(null); setBusquedaManual('') }}
                className="btn-secondary py-3 px-4"
              >
                <X size={16} />
              </button>
              <button
                onClick={confirmarIngreso}
                disabled={guardando || exito}
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
