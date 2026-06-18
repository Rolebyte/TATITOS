import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Baby, Menu, X } from 'lucide-react'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleAnchor = (anchor) => (e) => {
    e.preventDefault()
    setOpen(false)
    if (location.pathname !== '/') {
      navigate('/')
      setTimeout(() => {
        document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' })
      }, 300)
    } else {
      document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const links = [
    { to: '/', label: 'Inicio', anchor: null },
    { to: '/tienda', label: 'Catálogo', anchor: null },
    { to: '/#nosotros', label: 'Nosotros', anchor: 'nosotros' },
    { to: '/#contacto', label: 'Contacto', anchor: 'contacto' },
  ]

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 bg-white transition-shadow duration-200 ${
        scrolled ? 'shadow-md' : ''
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-xl text-primary">
          <img src="/logo2.png" alt="Tatitos" className="h-10 w-auto object-contain" />
          <span className="hidden sm:inline">Tatitos Pañalera</span>
        </Link>

        <ul className="hidden md:flex items-center gap-6">
          {links.map((l) => (
            <li key={l.to}>
              {l.anchor ? (
                <a
                  href={l.to}
                  onClick={handleAnchor(l.anchor)}
                  className="font-body font-medium text-sm hover:text-primary transition-colors text-gray-600 cursor-pointer"
                >
                  {l.label}
                </a>
              ) : (
                <Link
                  to={l.to}
                  className={`font-body font-medium text-sm hover:text-primary transition-colors ${
                    location.pathname === l.to ? 'text-primary' : 'text-gray-600'
                  }`}
                >
                  {l.label}
                </Link>
              )}
            </li>
          ))}
        </ul>

        <Link to="/tienda" className="hidden md:inline-flex btn-primary text-sm py-2 px-5">
          Ver catálogo →
        </Link>

        <button
          className="md:hidden text-gray-600"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-white border-t px-4 py-4 flex flex-col gap-4">
          {links.map((l) => (
            l.anchor ? (
              <a
                key={l.to}
                href={l.to}
                onClick={handleAnchor(l.anchor)}
                className="font-medium text-gray-700 hover:text-primary cursor-pointer"
              >
                {l.label}
              </a>
            ) : (
              <Link
                key={l.to}
                to={l.to}
                className="font-medium text-gray-700 hover:text-primary"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            )
          ))}
          <Link to="/tienda" className="btn-primary text-sm text-center" onClick={() => setOpen(false)}>
            Ver catálogo →
          </Link>
        </div>
      )}
    </nav>
  )
}
