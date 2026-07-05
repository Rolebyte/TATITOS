import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Baby, Package, ShoppingBag, BarChart2, LogOut, Users, History, Tag, Megaphone, Menu, X } from 'lucide-react'
import useAuthStore from '../store/authStore'

const navLinks = [
  { to: '/admin/pedidos',   label: 'Pedidos',     icon: ShoppingBag },
  { to: '/admin/stock',     label: 'Stock',       icon: Package },
  { to: '/admin/ventas',    label: 'Ventas',      icon: BarChart2 },
  { to: '/admin/clientes',  label: 'Clientes',    icon: Users },
  { to: '/admin/historico', label: 'Historial',   icon: History },
  { to: '/admin/cupones',   label: 'Cupones',     icon: Tag },
  { to: '/admin/promos',    label: 'Promos',      icon: Megaphone },
]

// Solo los 4 más usados en el bottom bar móvil
const bottomLinks = [
  { to: '/admin/pedidos', label: 'Pedidos', icon: ShoppingBag },
  { to: '/admin/stock',   label: 'Stock',   icon: Package },
  { to: '/admin/ventas',  label: 'Ventas',  icon: BarChart2 },
  { to: '/admin/cupones', label: 'Cupones', icon: Tag },
]

export default function AdminLayout() {
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/admin')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* ── SIDEBAR desktop ── */}
      <aside className="hidden lg:flex w-56 bg-dark flex-col fixed h-full z-30">
        <div className="p-5 flex items-center gap-2 text-primary font-display font-bold">
          <Baby size={24} />
          <span className="text-sm">Tatitos Admin</span>
        </div>
        <nav className="flex-1 px-3 py-2 space-y-1">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive ? 'bg-primary text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-7 py-4 text-gray-500 hover:text-white text-sm transition-colors border-t border-gray-700"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </aside>

      {/* ── HEADER móvil ── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-dark flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2 text-primary font-display font-bold text-sm">
          <Baby size={20} />
          Tatitos Admin
        </div>
        <button
          onClick={() => setMenuOpen(true)}
          className="text-gray-400 hover:text-white p-1"
        >
          <Menu size={22} />
        </button>
      </header>

      {/* ── DRAWER menú completo móvil ── */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)} />
          <aside className="relative w-64 bg-dark flex flex-col h-full shadow-xl">
            <div className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary font-display font-bold text-sm">
                <Baby size={20} />
                Tatitos Admin
              </div>
              <button onClick={() => setMenuOpen(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 px-3 py-2 space-y-1">
              {navLinks.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      isActive ? 'bg-primary text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                    }`
                  }
                >
                  <Icon size={18} />
                  {label}
                </NavLink>
              ))}
            </nav>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-7 py-4 text-gray-500 hover:text-white text-sm transition-colors border-t border-gray-700"
            >
              <LogOut size={16} />
              Cerrar sesión
            </button>
          </aside>
        </div>
      )}

      {/* ── CONTENIDO ── */}
      <main className="flex-1 lg:ml-56 pt-14 lg:pt-0 pb-20 lg:pb-0 overflow-auto">
        <div className="p-4 lg:p-8">
          <Outlet />
        </div>
      </main>

      {/* ── BOTTOM TAB BAR móvil ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-dark border-t border-gray-700 flex">
        {bottomLinks.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] font-semibold transition-colors ${
                isActive ? 'text-primary' : 'text-gray-500'
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
        <button
          onClick={() => setMenuOpen(true)}
          className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] font-semibold text-gray-500"
        >
          <Menu size={20} />
          Más
        </button>
      </nav>

    </div>
  )
}
