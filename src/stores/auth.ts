import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import api from '@/lib/axios'
import {
  currentPortal,
  detectPortalFromPath,
  getToken,
  setToken,
  removeToken,
  tokenVersion,
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
  const SESSION_CHECK_MS = 15000
  let sessionTimer: ReturnType<typeof setInterval> | null = null
  let sessionCheckInFlight = false

  /** Reactive token — reads from the current portal's localStorage key. */
  const token = computed(() => {
    void tokenVersion.value          // subscribe to token changes in localStorage
    return getToken(currentPortal.value)
  })

  const isLoggedIn = computed(() => !!token.value && !!user.value)

  function routeForRole(role?: string) {
    switch (role) {
      case 'admin':
        return { name: 'support-dashboard' }
      case 'store_owner':
        return { name: 'shop-dashboard' }
      case 'client':
      default:
        return { name: 'customer-bookings' }
    }
  }

  function portalForRole(role?: string): Portal {
    if (role === 'admin') return 'support'
    if (role === 'store_owner') return 'shop'
    return 'customer'
  }

  // Where to send the user after login based on their role
  const defaultRoute = computed(() => (user.value ? routeForRole(user.value.role) : { name: 'customer-login' }))

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

  async function verifySession() {
    if (!user.value || !token.value || sessionCheckInFlight) return
    sessionCheckInFlight = true
    try {
      await api.get('/auth/me')
    } catch {
      // 401 handling + redirect is centralized in axios interceptor.
    } finally {
      sessionCheckInFlight = false
    }
  }

  function startSessionWatcher() {
    if (sessionTimer || typeof window === 'undefined') return
    sessionTimer = setInterval(() => {
      void verifySession()
    }, SESSION_CHECK_MS)
  }

  function stopSessionWatcher() {
    if (!sessionTimer) return
    clearInterval(sessionTimer)
    sessionTimer = null
  }

  // ── Login ──────────────────────────────────────────────────────────────
  async function login(email: string, password: string) {
    loading.value = true
    try {
      // Ensure login writes token to the portal of the active URL (support/shop/customer).
      currentPortal.value = detectPortalFromPath(window.location.pathname)
      const response = await api.post('/auth/login', { email, password })
      const payload = response.data?.data ?? {}
      const userData = payload.user ?? null
      const jwt =
        payload.token ??
        payload.access_token ??
        userData?.token ??
        response.headers?.['x-auth-token'] ??
        null

      const rolePortal = portalForRole(userData?.role)
      if (jwt) {
        setToken(jwt, rolePortal)
        if (rolePortal !== currentPortal.value) removeToken(currentPortal.value)
      }
      currentPortal.value = rolePortal
      user.value = userData
      const redirectTo = routeForRole(userData?.role)

      // If token was not stored, guards will keep the user on sign-in.
      if (!getToken(rolePortal)) {
        return {
          success: false,
          message: 'Login succeeded but no auth token was received. Please check backend login response format.',
        }
      }

      return { success: true, redirectTo }
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
    stopSessionWatcher()
  }

  function redirectToSignInForCurrentPath() {
    const path = window.location.pathname
    if (path.includes('/sign-in')) return
    if (path.startsWith('/support')) {
      window.location.href = '/support/sign-in'
    } else if (path.startsWith('/shop')) {
      window.location.href = '/shop/sign-in'
    } else {
      window.location.href = '/customer/sign-in'
    }
  }

  // ── Listen for session-expired event from axios interceptor ───────────
  if (typeof window !== 'undefined') {
    window.addEventListener('auth:session-expired', () => {
      _clearAuth()
      redirectToSignInForCurrentPath()
    })
    // Re-check session immediately when tab regains focus.
    window.addEventListener('focus', () => {
      void verifySession()
    })
  }

  // Start/stop session watcher based on auth state.
  watch(
    () => [user.value?.id ?? null, token.value] as const,
    ([userId, jwt]) => {
      if (userId && jwt) startSessionWatcher()
      else stopSessionWatcher()
    },
    { immediate: true },
  )

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
    verifySession,
    switchPortal,
  }
})
