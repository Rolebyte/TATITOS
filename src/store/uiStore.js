import { create } from 'zustand'

const useUiStore = create((set) => ({
  carritoAbierto: false,
  abrirCarrito: () => set({ carritoAbierto: true }),
  cerrarCarrito: () => set({ carritoAbierto: false }),
  toggleCarrito: () => set((s) => ({ carritoAbierto: !s.carritoAbierto })),
}))

export default useUiStore
