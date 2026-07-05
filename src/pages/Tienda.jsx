import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ProductoCard from '../components/ProductoCard'
import CarritoBoton from '../components/CarritoBoton'
import useSEO from '../hooks/useSEO'

const CATEGORIAS = [
  { label: 'Todos', slug: '' },
  { label: 'Pañales', slug: 'pañales' },
  { label: 'Toallitas', slug: 'toallitas' },
  { label: 'Cremas', slug: 'cremas' },
  { label: 'Higiene', slug: 'higiene' },
  { label: 'Ropa', slug: 'ropa' },
  { label: 'Regalería', slug: 'regaleria' },
  { label: 'Limpieza', slug: 'limpieza' },
  { label: 'Juguetes', slug: 'juguetes' },
]

// Productos de ejemplo para cuando Supabase no está configurado
const PRODUCTOS_DEMO = [
  { id: '1', nombre: 'Pampers Etapas T1 x20', precio: 4500, stock: 15, categoria: 'pañales', marca: 'Pampers', imagen_url: null },
  { id: '2', nombre: 'Pampers Etapas T2 x40', precio: 5850, stock: 18, categoria: 'pañales', marca: 'Pampers', imagen_url: null },
  { id: '3', nombre: 'Pampers Etapas T3 x40', precio: 6100, stock: 12, categoria: 'pañales', marca: 'Pampers', imagen_url: null },
  { id: '4', nombre: 'Huggies Clásicos T2 x40', precio: 5200, stock: 8, categoria: 'pañales', marca: 'Huggies', imagen_url: null },
  { id: '5', nombre: 'Huggies Clásicos T3 x32', precio: 4900, stock: 6, categoria: 'pañales', marca: 'Huggies', imagen_url: null },
  { id: '6', nombre: 'Toallitas Pequeñín x80', precio: 2500, stock: 24, categoria: 'toallitas', marca: 'Pequeñín', imagen_url: null },
  { id: '7', nombre: 'Toallitas Huggies x48', precio: 1900, stock: 20, categoria: 'toallitas', marca: 'Huggies', imagen_url: null },
  { id: '8', nombre: 'Crema Bepanthen 30g', precio: 3200, stock: 10, categoria: 'cremas', marca: 'Bepanthen', imagen_url: null },
  { id: '9', nombre: 'Crema Hipoglos 60g', precio: 2800, stock: 14, categoria: 'cremas', marca: 'Hipoglos', imagen_url: null },
  { id: '10', nombre: 'Shampoo Johnson x200ml', precio: 2800, stock: 9, categoria: 'higiene', marca: "Johnson's", imagen_url: null },
  { id: '11', nombre: 'Talco Johnson x100g', precio: 1900, stock: 0, categoria: 'higiene', marca: "Johnson's", imagen_url: null },
  { id: '12', nombre: 'Skip Bebé x3kg', precio: 4100, stock: 7, categoria: 'limpieza', marca: 'Skip', imagen_url: null },
  { id: '13', nombre: 'Suavitel Bebé x800ml', precio: 1800, stock: 13, categoria: 'limpieza', marca: 'Suavitel', imagen_url: null },
]

export default function Tienda() {
  useSEO({
    titulo: 'Tienda',
    descripcion: 'Explorá nuestro catálogo completo de productos para bebés. Pañales, toallitas, cremas, ropa y más.',
    url: '/tienda',
  })

  const [searchParams, setSearchParams] = useSearchParams()
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const categoriaActiva = searchParams.get('categoria') || ''
  const busquedaParam = searchParams.get('busqueda') || ''
  const [busqueda, setBusqueda] = useState(busquedaParam)

  useEffect(() => {
    cargarProductos()

    // Realtime: actualiza stock sin recargar
    const channel = supabase
      .channel('productos-stock')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'productos',
      }, (payload) => {
        setProductos((prev) =>
          prev.map((p) => p.id === payload.new.id ? { ...p, stock: payload.new.stock, precio: payload.new.precio } : p)
        )
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  async function cargarProductos() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('activo', true)
        .order('nombre')

      if (error || !data?.length) {
        setProductos(PRODUCTOS_DEMO)
      } else {
        setProductos(data)
      }
    } catch {
      setProductos(PRODUCTOS_DEMO)
    }
    setLoading(false)
  }

  const productosFiltrados = productos.filter((p) => {
    const matchCategoria = !categoriaActiva || p.categoria === categoriaActiva
    const matchBusqueda =
      !busqueda ||
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.marca && p.marca.toLowerCase().includes(busqueda.toLowerCase()))
    return matchCategoria && matchBusqueda
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16">
        {/* Header tienda */}
        <div className="bg-white border-b">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <h1 className="font-display text-2xl font-bold text-gray-900 mb-4">Catálogo</h1>

            {/* Buscador */}
            <div className="relative mb-4">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar productos o marcas..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            {/* Filtros por categoría */}
            <div className="flex gap-2 flex-wrap">
              {CATEGORIAS.map(({ label, slug }) => (
                <button
                  key={slug}
                  onClick={() => {
                    if (slug) setSearchParams({ categoria: slug })
                    else setSearchParams({})
                  }}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                    categoriaActiva === slug
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grilla de productos */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="card overflow-hidden animate-pulse">
                  <div className="bg-gray-200 aspect-square" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-1/3" />
                    <div className="h-4 bg-gray-200 rounded w-full" />
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : productosFiltrados.length === 0 ? (
            <div className="text-center py-20 text-muted">
              <p className="text-lg font-display font-semibold mb-2">No encontramos productos</p>
              <p className="text-sm">Intentá con otra búsqueda o categoría</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted mb-4">
                {productosFiltrados.length} producto{productosFiltrados.length !== 1 ? 's' : ''}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {productosFiltrados.map((p) => (
                  <ProductoCard key={p.id} producto={p} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <Footer />
      <CarritoBoton />
    </div>
  )
}
