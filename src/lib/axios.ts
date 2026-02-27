import axios from 'axios'
import { detectPortalFromPath, getToken, setToken, removeToken } from '@/lib/portalToken'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// ── Request interceptor — attach JWT token for the active portal ────────────
api.interceptors.request.use((config) => {
  const portal = detectPortalFromPath(window.location.pathname)
  const token = getToken(portal)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Response interceptor — capture JWT from headers + handle 401 ────────────
api.interceptors.response.use(
  (response) => {
    const newToken = response.headers['x-auth-token']
    if (newToken) {
      const portal = detectPortalFromPath(window.location.pathname)
      setToken(newToken, portal)
    }
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      const portal = detectPortalFromPath(window.location.pathname)
      removeToken(portal)
      window.dispatchEvent(new CustomEvent('auth:session-expired'))
      const path = window.location.pathname
      const isOnSignIn = path.includes('/sign-in')
      if (!isOnSignIn) {
        if (path.startsWith('/support')) {
          window.location.href = '/support/sign-in'
        } else if (path.startsWith('/shop')) {
          window.location.href = '/shop/sign-in'
        } else {
          window.location.href = '/customer/sign-in'
        }
      }
    }
    return Promise.reject(error)
  },
)

export default api
