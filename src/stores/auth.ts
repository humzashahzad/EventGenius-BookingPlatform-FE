import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/lib/axios'

export interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'store_owner' | 'client'
  phone?: string
  avatar?: string
  is_active?: boolean
  created_at: string
}

export const useAuthStore = defineStore('auth', () => {
  const user        = ref<User | null>(null)
  const token       = ref<string | null>(localStorage.getItem('auth_token'))
  const loading     = ref(false)
  const initialized = ref(false)

  const isLoggedIn = computed(() => !!token.value && !!user.value)

  // Where to send the user after login based on their role
  const defaultRoute = computed(() => {
    if (!user.value) return { name: 'client-login' }
    switch (user.value.role) {
      case 'admin':       return { name: 'admin-dashboard' }
      case 'store_owner': return { name: 'store-dashboard' }
      case 'client':
      default:            return { name: 'client-dashboard' }
    }
  })

  // ── Fetch current user ─────────────────────────────────────────────────
  async function fetchUser() {
    if (!token.value) { initialized.value = true; return }
    try {
      const { data } = await api.get('/auth/me')
      user.value = data.data
    } catch {
      _clearAuth()
    } finally {
      initialized.value = true
    }
  }

  // ── Login ──────────────────────────────────────────────────────────────
  async function login(email: string, password: string) {
    loading.value = true
    try {
      const response = await api.post('/auth/login', { email, password })
      token.value = localStorage.getItem('auth_token')
      user.value  = response.data.data.user
      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
        errors:  error.response?.data?.errors,
      }
    } finally {
      loading.value = false
    }
  }

  // ── Register ───────────────────────────────────────────────────────────
  async function register(payload: Record<string, string>) {
    loading.value = true
    try {
      const response = await api.post('/auth/register', payload)
      token.value = localStorage.getItem('auth_token')
      user.value  = response.data.data.user
      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        errors:  error.response?.data?.errors,
        message: error.response?.data?.message,
      }
    } finally {
      loading.value = false
    }
  }

  // ── Logout (current session) ───────────────────────────────────────────
  async function logout() {
    try {
      await api.post('/auth/logout')
    } catch { /* ignore */ }
    _clearAuth()
  }

  // ── Logout all devices ─────────────────────────────────────────────────
  async function logoutAll() {
    try {
      await api.post('/auth/logout-all')
    } catch { /* ignore */ }
    _clearAuth()
  }

  // ── Internal: clear auth state ─────────────────────────────────────────
  function _clearAuth() {
    token.value = null
    user.value  = null
    localStorage.removeItem('auth_token')
  }

  // ── Listen for session-expired event from axios interceptor ───────────
  if (typeof window !== 'undefined') {
    window.addEventListener('auth:session-expired', () => {
      _clearAuth()
    })
  }

  // Initialize user on app load — returns a promise the router guard can await
  const initPromise = fetchUser()

  return {
    user,
    token,
    loading,
    initialized,
    initPromise,
    isLoggedIn,
    defaultRoute,
    fetchUser,
    login,
    register,
    logout,
    logoutAll,
  }
})
