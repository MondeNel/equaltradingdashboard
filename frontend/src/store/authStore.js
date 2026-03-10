import { create } from 'zustand'
import { authAPI } from '../services/api'

const useAuthStore = create((set) => ({
  user:      null,
  token:     localStorage.getItem('access_token'),
  isLoading: false,
  error:     null,

  login: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      const res = await authAPI.login({ email, password })
      localStorage.setItem('access_token', res.data.access_token)
      const me = await authAPI.me()
      set({ user: me.data, token: res.data.access_token, isLoading: false })
      return true
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Login failed', isLoading: false })
      return false
    }
  },

  register: async (email, password, displayName) => {
    set({ isLoading: true, error: null })
    try {
      const res = await authAPI.register({ email, password, display_name: displayName })
      localStorage.setItem('access_token', res.data.access_token)
      const me = await authAPI.me()
      set({ user: me.data, token: res.data.access_token, isLoading: false })
      return true
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Registration failed', isLoading: false })
      return false
    }
  },

  logout: () => {
    localStorage.removeItem('access_token')
    set({ user: null, token: null })
  },

  loadUser: async () => {
    const token = localStorage.getItem('access_token')
    if (!token) return
    try {
      const me = await authAPI.me()
      set({ user: me.data })
    } catch {
      localStorage.removeItem('access_token')
      set({ user: null, token: null })
    }
  },
}))

export default useAuthStore