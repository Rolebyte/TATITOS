import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Package,
  Truck,
  CreditCard,
  Star,
  Baby,
  Heart,
  Droplets,
  MapPin,
  ArrowRight,
  Phone,
  Mail,
  Clock,
  ExternalLink,
  Search,
  Tag,
  Zap,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ProductoCard from '../components/ProductoCard'
import CarritoBoton from '../components/CarritoBoton'
import useSEO from '../hooks/useSEO'

const categorias = [
  { label: 'Pañales y descartables', slug: 'pañales', icon: Baby, color: 'bg-pink-50 text-pink-500' },
  { label: 'Toallitas húmedas', slug: 'toallitas', icon: Droplets, color: 'bg-blue-50 text-blue-500' },
  { label: 'Higiene bebé', slug: 'higiene', icon: Heart, color: 'bg-rose-50 text-rose-500' },
  { label: 'Regalería', slug: 'regaleria', icon: Star, color: 'bg-yellow-50 text-yellow-600' },
]

const marcas = ['Pampers', 'Huggies', "Johnson's", 'Pequeñín', 'Bepanthen', 'Suavitel', 'Skip']

const DESTACADOS_DEMO = [
  { id: '1', nombre: 'Pampers Etapas T2 x40', precio: 5850, stock: 18, categoria: 'pañales', marca: 'Pampers', imagen_url: null },
  { id: '6', nombre: 'Toallitas Pequeñín x80', precio: 2500, stock: 24, categoria: 'toallitas', marca: 'Pequeñín', imagen_url: null },
  { id: '8', nombre: 'Crema Bepanthen 30g', precio: 3200, stock: 10, categoria: 'cremas', marca: 'Bepanthen', imagen_url: null },
  { id: '12', nombre: 'Skip Bebé x3kg', precio: 4100, stock: 7, categoria: 'limpieza', marca: 'Skip', imagen_url: null },
]

export default function Landing() {
  useSEO({
    titulo: 'Inicio',
    descripcion: 'Pañalera online en Rafaela, Santa Fe. Pañales, toallitas, cremas y todo para tu bebé con envío a domicilio.',
    url: '/',
  })

  const navigate = useNavigate()
  const [busqueda, setBusqueda] = useState('')
  const [destacados, setDestacados] = useState([])
  const [ofertas, setOfertas] = useState([])
  const [tiempos, setTiempos] = useState({})

  useEffect(() => {
    async function cargarDestacados() {
      try {
        const { data, error } = await supabase
          .from('productos')
          .select('*')
          .eq('activo', true)
          .gt('stock', 0)
          .order('created_at', { ascending: false })
          .limit(4)
        if (error || !data?.length) throw error
        setDestacados(data)
      } catch {
        setDestacados(DESTACADOS_DEMO)
      }
    }
    cargarDestacados()
  }, [])

  useEffect(() => {
    async function cargarOfertas() {
      try {
        const { data } = await supabase
          .from('ofertas')
          .select('*, productos(*)')
          .eq('activa', true)
          .gt('fecha_fin', new Date().toISOString())
          .order('created_at', { ascending: false })
        setOfertas(data || [])
      } catch { /* sin ofertas */ }
    }
    cargarOfertas()
  }, [])

  useEffect(() => {
    if (!ofertas.length) return
    function calcularTiempos() {
      const t = {}
      ofertas.forEach((o) => {
        const diff = new Date(o.fecha_fin) - new Date()
        if (diff <= 0) { t[o.id] = 'Vencida'; return }
        const d = Math.floor(diff / 86400000)
        const h = Math.floor((diff % 86400000) / 3600000)
        const m = Math.floor((diff % 3600000) / 60000)
        const s = Math.floor((diff % 60000) / 1000)
        t[o.id] = d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m ${s}s`
      })
      setTiempos(t)
    }
    calcularTiempos()
    const interval = setInterval(calcularTiempos, 1000)
    return () => clearInterval(interval)
  }, [ofertas])

  const handleBuscar = (e) => {
    e.preventDefault()
    if (busqueda.trim()) {
      navigate(`/tienda?busqueda=${encodeURIComponent(busqueda.trim())}`)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-16 bg-gradient-to-b from-light to-white">
        <div className="max-w-6xl mx-auto px-4 py-10 md:py-20 text-center">
          <img src="/logo2.png" alt="Tatitos Pañalera" className="w-[500px] max-w-full mx-auto mb-2 drop-shadow-md object-contain" />
          <h1 className="font-display text-3xl md:text-5xl font-black text-gray-900 leading-tight mb-4">
            Pañalera online en Rafaela —{' '}
            <span className="text-primary">en la puerta de tu hogar</span>
          </h1>
          <p className="text-base text-muted max-w-xl mx-auto mb-10">
            Pañales, ropa, cremas, higiene y más. Rafaela y todo el país.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            <Link to="/tienda" className="btn-primary text-base px-8 py-4">
              Comprar ahora <ArrowRight size={18} />
            </Link>
            <a href="#categorias" className="btn-secondary text-base px-8 py-4">
              Ver categorías
            </a>
          </div>

          {/* Buscador */}
          <form onSubmit={handleBuscar} className="max-w-lg mx-auto">
            <div className="relative flex items-center">
              <Search size={18} className="absolute left-4 text-gray-400" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscá pañales, toallitas, cremas..."
                className="w-full pl-11 pr-32 py-3.5 rounded-full border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
              />
              <button
                type="submit"
                className="absolute right-1.5 bg-primary text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-pink-500 transition-colors"
              >
                Buscar
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Ofertas de la semana — justo debajo del hero */}
      {ofertas.length > 0 && (
        <section className="py-10 bg-white border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Zap size={18} className="text-primary" />
                <h2 className="font-display text-2xl font-bold text-gray-900">Ofertas de la semana</h2>
                <span className="text-xs font-semibold text-primary bg-pink-50 px-2 py-0.5 rounded-full ml-1">¡Tiempo limitado!</span>
              </div>
              <Link to="/tienda" className="text-primary font-semibold text-sm hover:underline flex items-center gap-1 hidden sm:flex">
                Ver tienda <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {ofertas.map((oferta) => {
                const prod = oferta.productos
                if (!prod) return null
                const pctOff = Math.round((1 - oferta.precio_oferta / prod.precio) * 100)
                const pocasUnidades = prod.stock <= 5
                return (
                  <Link
                    key={oferta.id}
                    to={`/tienda/producto/${prod.id}`}
                    className="card overflow-hidden hover:shadow-lg transition-shadow duration-200 group"
                  >
                    <div className="relative">
                      <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                        {prod.imagen_url
                          ? <img src={prod.imagen_url} alt={prod.nombre} className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-200" />
                          : <Package size={40} className="text-gray-200" />
                        }
                      </div>
                      <span className="absolute top-2 left-2 bg-primary text-white text-xs font-black px-2 py-1 rounded-lg shadow-sm">
                        {pctOff}% OFF
                      </span>
                      {pocasUnidades && (
                        <span className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                          ¡{prod.stock} left!
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-semibold text-gray-800 leading-tight line-clamp-2 mb-2">{prod.nombre}</p>
                      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                        <span className="text-xs line-through text-muted">${prod.precio.toLocaleString('es-AR')}</span>
                        <span className="text-base font-black text-primary">${oferta.precio_oferta.toLocaleString('es-AR')}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-orange-600 font-semibold bg-orange-50 rounded-lg px-2 py-1">
                        <Clock size={10} />
                        <span>{tiempos[oferta.id] || '...'}</span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Categorías */}
      <section id="categorias" className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-display text-3xl font-bold text-center text-gray-900 mb-2">
            Nuestras categorías
          </h2>
          <p className="text-center text-muted mb-10">Encontrá todo lo que necesitás en un solo lugar</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {categorias.map(({ label, slug, icon: Icon, color }) => (
              <Link
                key={slug}
                to={`/tienda?categoria=${slug}`}
                className="card p-6 flex flex-col items-center gap-3 hover:scale-105 transition-transform duration-200 cursor-pointer"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${color}`}>
                  <Icon size={28} />
                </div>
                <span className="font-display font-semibold text-sm text-center text-gray-800">
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Productos destacados */}
      {destacados.length > 0 && (
        <section className="py-16 bg-light">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-primary font-semibold text-sm uppercase tracking-wider">Lo más vendido</span>
                <h2 className="font-display text-3xl font-bold text-gray-900 mt-1">Productos destacados</h2>
              </div>
              <Link to="/tienda" className="text-primary font-semibold text-sm hover:underline flex items-center gap-1">
                Ver todo <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {destacados.map((p) => (
                <ProductoCard key={p.id} producto={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Por qué elegirnos */}
      <section className="py-16 bg-light">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-display text-3xl font-bold text-center text-gray-900 mb-10">
            ¿Por qué elegirnos?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Truck size={32} className="text-primary" />,
                title: 'Envíos a todo el país',
                desc: 'Despachamos por Correo Argentino y OCA. Tu pedido llega a donde estés.',
              },
              {
                icon: <CreditCard size={32} className="text-secondary" />,
                title: 'Pagás como querés',
                desc: 'Mercado Pago, tarjeta de crédito, débito o transferencia bancaria.',
              },
              {
                icon: <Package size={32} className="text-accent" style={{ filter: 'brightness(0.75)' }} />,
                title: 'Stock permanente',
                desc: 'Siempre tenemos las marcas que necesitás, sin quedarnos sin productos.',
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="card p-8 text-center">
                <div className="flex justify-center mb-4">{icon}</div>
                <h3 className="font-display font-bold text-lg text-gray-900 mb-2">{title}</h3>
                <p className="text-muted text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Marcas */}
      <section className="py-12 bg-white border-t border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-center text-sm text-muted font-semibold uppercase tracking-wider mb-6">
            Marcas que vendemos
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {marcas.map((marca) => (
              <span
                key={marca}
                className="bg-gray-100 text-gray-700 font-display font-bold px-5 py-2 rounded-full text-sm"
              >
                {marca}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Nosotros */}
      <section id="nosotros" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-primary font-semibold text-sm uppercase tracking-wider">Sobre nosotros</span>
              <h2 className="font-display text-4xl font-black text-gray-900 mt-2 mb-5 leading-tight">
                Nacimos en Rafaela,<br />crecimos con vos
              </h2>
              <p className="text-muted leading-relaxed mb-4">
                Tatitos nació de entender algo simple: cuando tenés un bebé, no querés perder tiempo
                buscando lo que necesitás. Querés encontrarlo rápido, a buen precio, y que te llegue sin drama.
                Eso es exactamente lo que hacemos.
              </p>
              <p className="text-muted leading-relaxed mb-8">
                Somos un emprendimiento rafaelino, familiar y con ganas de crecer junto a las familias de nuestra ciudad
                y de todo el país. Cuando llega tu pedido, queremos que sientas que lo armó alguien que entiende lo que es tener un bebé en casa — no una empresa que simplemente empaqueta y manda.
              </p>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-pink-50 flex items-center justify-center shrink-0">
                    <MapPin size={18} className="text-primary" />
                  </div>
                  <span className="text-gray-700 text-sm">A. Díaz 34, Rafaela, Santa Fe</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-pink-50 flex items-center justify-center shrink-0">
                    <Clock size={18} className="text-primary" />
                  </div>
                  <span className="text-gray-700 text-sm">Lunes a sábado · 9 a 20hs</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-pink-50 flex items-center justify-center shrink-0">
                    <Truck size={18} className="text-primary" />
                  </div>
                  <span className="text-gray-700 text-sm">Envíos a domicilio en Rafaela y a todo el país</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { num: '1+', label: 'Año de experiencia' },
                { num: '14', label: 'Marcas disponibles' },
                { num: '100%', label: 'Envíos a todo el país' },
                { num: '⭐', label: 'Atención personalizada' },
              ].map(({ num, label }) => (
                <div key={label} className="card p-6 text-center">
                  <p className="font-display font-black text-3xl text-primary mb-1">{num}</p>
                  <p className="text-sm text-muted">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contacto */}
      <section id="contacto" className="py-20 bg-light">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">Contacto</span>
            <h2 className="font-display text-4xl font-black text-gray-900 mt-2">
              Estamos para ayudarte
            </h2>
            <p className="text-muted mt-3 max-w-md mx-auto">
              ¿Duda con un producto? ¿Querés saber si hay stock? Escribinos sin compromiso — somos personas reales, no un bot.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <a
              href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER || '5493492710605'}?text=Hola%20Tatitos!%20Quiero%20ver%20el%20cat%C3%A1logo%20y%20consultar%20precios%20%F0%9F%91%B6`}
              target="_blank"
              rel="noopener noreferrer"
              className="card p-6 text-center hover:scale-105 transition-transform duration-200 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-3 group-hover:bg-green-200 transition-colors">
                <Phone size={24} className="text-green-600" />
              </div>
              <h3 className="font-display font-bold text-gray-900 mb-1">WhatsApp</h3>
              <p className="text-sm text-muted mb-2">Consultás y te respondemos al toque</p>
              <p className="text-xs font-semibold text-green-600">+54 3492 710605</p>
            </a>

            <a
              href="https://instagram.com/tatitos_rafaela"
              target="_blank"
              rel="noopener noreferrer"
              className="card p-6 text-center hover:scale-105 transition-transform duration-200 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-pink-100 flex items-center justify-center mx-auto mb-3 group-hover:bg-pink-200 transition-colors">
                <ExternalLink size={24} className="text-primary" />
              </div>
              <h3 className="font-display font-bold text-gray-900 mb-1">Instagram</h3>
              <p className="text-sm text-muted mb-3">Novedades, ofertas y productos nuevos</p>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-bold rounded-full">
                Seguir @tatitos_rafaela
              </span>
            </a>

            <a
              href="mailto:tatitosrafaela@gmail.com"
              className="card p-6 text-center hover:scale-105 transition-transform duration-200 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-200 transition-colors">
                <Mail size={24} className="text-blue-600" />
              </div>
              <h3 className="font-display font-bold text-gray-900 mb-1">Email</h3>
              <p className="text-sm text-muted mb-2">Para consultas o pedidos especiales</p>
              <p className="text-xs font-semibold text-blue-600">tatitosrafaela@gmail.com</p>
            </a>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-16 bg-primary">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="font-display text-3xl font-bold text-white mb-4">
            Todo lo que tu bebé necesita, en un solo lugar
          </h2>
          <p className="text-pink-100 mb-8">
            Más de 14 marcas, precios accesibles y envíos a todo el país. Empezá a comprar hoy.
          </p>
          <Link
            to="/tienda"
            className="bg-white text-primary font-display font-bold px-10 py-4 rounded-full text-lg hover:bg-pink-50 transition-colors inline-flex items-center gap-2"
          >
            Ir al catálogo <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      <Footer />
      <CarritoBoton />
    </div>
  )
}
