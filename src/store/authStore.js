import { create } from 'zustand'
import { supabase } from '../lib/supabase'

const useAuthStore = create((set) => ({
  user: null,
  loading: true,

  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),

  logout: async () => {
    await supabase.auth.signOut()
    set({ user: null })
  },
}))

export default useAuthStore
