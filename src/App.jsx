import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

import Landing from './pages/Landing'
import Tienda from './pages/Tienda'
import Carrito from './pages/Carrito'
import Producto from './pages/Producto'
import PagoExito from './pages/PagoExito'
import PagoPendiente from './pages/PagoPendiente'
import PagoError from './pages/PagoError'

import AdminLogin from './pages/admin/AdminLogin'
import AdminPedidos from './pages/admin/AdminPedidos'
import AdminStock from './pages/admin/AdminStock'
import AdminVentas from './pages/admin/AdminVentas'
import AdminClientes from './pages/admin/AdminClientes'
import AdminHistorico from './pages/admin/AdminHistorico'
import AdminCupones from './pages/admin/AdminCupones'
import AdminPromos from './pages/admin/AdminPromos'
import AdminLayout from './components/AdminLayout'
import ProtectedRoute from './components/ProtectedRoute'
import CarritoDrawer from './components/CarritoDrawer'
import WhatsAppBoton from './components/WhatsAppBoton'
import BarraPromo from './components/BarraPromo'
import PopupPromo from './components/PopupPromo'

function GlobalUI() {
  const location = useLocation()
  const esAdmin = location.pathname.startsWith('/admin')
  if (esAdmin) return null
  return (
    <>
      <BarraPromo />
      <PopupPromo />
      <CarritoDrawer />
      <WhatsAppBoton />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { fontFamily: 'Inter, sans-serif', fontSize: '14px' },
          success: { iconTheme: { primary: '#FF6B9D', secondary: '#fff' } },
          duration: 2000,
        }}
      />
      <GlobalUI />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/tienda" element={<Tienda />} />
        <Route path="/tienda/producto/:id" element={<Producto />} />
        <Route path="/tienda/carrito" element={<Carrito />} />
        <Route path="/pago/exito" element={<PagoExito />} />
        <Route path="/pago/pendiente" element={<PagoPendiente />} />
        <Route path="/pago/error" element={<PagoError />} />

        <Route path="/admin" element={<AdminLogin />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/pedidos" element={<AdminPedidos />} />
            <Route path="/admin/stock" element={<AdminStock />} />
            <Route path="/admin/ventas" element={<AdminVentas />} />
            <Route path="/admin/clientes" element={<AdminClientes />} />
            <Route path="/admin/historico" element={<AdminHistorico />} />
            <Route path="/admin/cupones" element={<AdminCupones />} />
            <Route path="/admin/promos" element={<AdminPromos />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
