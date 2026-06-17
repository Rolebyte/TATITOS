import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Baby, Package, ShoppingBag, BarChart2, LogOut, Users, History } from 'lucide-react'
import useAuthStore from '../store/authStore'

const navLinks = [
  { to: '/admin/pedidos', label: 'Pedidos', icon: ShoppingBag },
  { to: '/admin/stock', label: 'Stock', icon: Package },
  { to: '/admin/ventas', label: 'Ventas', icon: BarChart2 },
  { to: '/admin/clientes', label: 'Clientes', icon: Users },
  { to: '/admin/historico', label: 'Historial TN', icon: History },
]

export default function AdminLayout() {
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/admin')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-dark flex flex-col fixed h-full">
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

      {/* Content */}
      <main className="ml-56 flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
