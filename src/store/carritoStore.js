import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Clave única por producto + variante
const itemKey = (productoId, varianteLabel) =>
  varianteLabel ? `${productoId}__${varianteLabel}` : productoId

const useCarritoStore = create(
  persist(
    (set, get) => ({
      items: [],

      // variante: { label, precio, stock } | null
      agregarItem: (producto, variante = null) => {
        const key = itemKey(producto.id, variante?.label)
        const items = get().items
        const existente = items.find((i) => i._key === key)
        const precio = variante ? variante.precio : producto.precio
        const nombre = variante
          ? `${producto.nombre} (${variante.label})`
          : producto.nombre

        if (existente) {
          set({
            items: items.map((i) =>
              i._key === key ? { ...i, cantidad: i.cantidad + 1 } : i
            ),
          })
        } else {
          set({
            items: [
              ...items,
              {
                ...producto,
                _key: key,
                precio,
                nombre,
                variante: variante?.label || null,
                cantidad: 1,
              },
            ],
          })
        }
      },

      quitarItem: (key) => {
        set({ items: get().items.filter((i) => i._key !== key) })
      },

      cambiarCantidad: (key, cantidad) => {
        if (cantidad < 1) {
          set({ items: get().items.filter((i) => i._key !== key) })
          return
        }
        set({
          items: get().items.map((i) =>
            i._key === key ? { ...i, cantidad } : i
          ),
        })
      },

      vaciarCarrito: () => set({ items: [] }),

      get totalItems() {
        return get().items.reduce((acc, i) => acc + i.cantidad, 0)
      },

      get subtotal() {
        return get().items.reduce((acc, i) => acc + i.precio * i.cantidad, 0)
      },
    }),
    {
      name: 'tatitos-carrito',
    }
  )
)

export default useCarritoStore
