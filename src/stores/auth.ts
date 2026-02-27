import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/lib/axios'
import {
  currentPortal,
  detectPortalFromPath,
  getToken,
  setToken,
  removeToken,
  type Portal,
} from '@/lib/portalToken'

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
  const loading     = ref(false)
  const initialized = ref(false)

  /** Reactive token — reads from the current portal's localStorage key. */
  const token = computed(() => getToken(currentPortal.value))

  const isLoggedIn = computed(() => !!token.value && !!user.value)

  // Where to send the user after login based on their role
  const defaultRoute = computed(() => {
    if (!user.value) return { name: 'customer-login' }
    switch (user.value.role) {
      case 'admin':       return { name: 'support-dashboard' }
      case 'store_owner': return { name: 'shop-dashboard' }
      case 'client':
      default:            return { name: 'customer-bookings' }
    }
  })

  /**
   * Switch the active portal. Called by the router guard on every navigation.
   * If the new portal has a token, fetches the user. Otherwise clears user state.
   */
  async function switchPortal(portal: Portal) {
    currentPortal.value = portal
    const portalToken = getToken(portal)

    if (portalToken && (!user.value || !_roleMatchesPortal(user.value.role, portal))) {
      // Token exists for this portal but user is not loaded or mismatched — fetch
      try {
        const { data } = await api.get('/auth/me')
        user.value = data.data
      } catch {
        removeToken(portal)
        user.value = null
      }
    } else if (!portalToken) {
      user.value = null
    }
  }

  /** Check if a backend role matches the expected portal. */
  function _roleMatchesPortal(role: string, portal: Portal): boolean {
    if (portal === 'support'  && role === 'admin')       return true
    if (portal === 'shop'     && role === 'store_owner') return true
    if (portal === 'customer' && role === 'client')      return true
    return false
  }

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
      const { user: userData, token: jwt } = response.data.data
      if (jwt) setToken(jwt, currentPortal.value)
      user.value = userData
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
      // Token is stored by the axios response interceptor from X-Auth-Token header
      user.value = response.data.data.user
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

  // ── Internal: clear auth state for the current portal ─────────────────
  function _clearAuth() {
    user.value = null
    removeToken(currentPortal.value)
  }

  // ── Listen for session-expired event from axios interceptor ───────────
  if (typeof window !== 'undefined') {
    window.addEventListener('auth:session-expired', () => {
      _clearAuth()
    })
  }

  // Initialize: detect portal from current URL, then fetch user if token exists
  currentPortal.value = detectPortalFromPath(window.location.pathname)
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
    switchPortal,
  }
})
