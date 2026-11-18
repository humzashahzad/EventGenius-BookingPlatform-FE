import axios, { type InternalAxiosRequestConfig } from 'axios'
import { currentPortal, detectPortalFromPath, getToken, setToken, removeToken, type Portal } from '@/lib/portalToken'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  // JWT is sent via Authorization header; cookies are not required.
  // Keeping credentials disabled prevents stricter CORS credential checks.
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

/** Which portal/token a request was sent with, so a 401 only clears that exact token. */
type AuthTaggedConfig = InternalAxiosRequestConfig & { _authPortal?: Portal; _authToken?: string | null }

function isApiRequest(config: { url?: string; baseURL?: string }) {
  const url = String(config.url || '')
  // Absolute URLs to other hosts never get our token.
  return !/^https?:\/\//i.test(url) || url.startsWith(String(config.baseURL || '') )
}

// ── Request interceptor — attach JWT token for the active portal ────────────
api.interceptors.request.use((config: AuthTaggedConfig) => {
  // Use the auth store's active portal, not the address bar: right after signing
  // in (e.g. a shop owner on the customer sign-in page) the URL still points at
  // the old portal while the new token is already stored for the new one.
  const portal = currentPortal.value
  const token = getToken(portal)
  const url = String(config.url || '')
  const isPublicAuthEndpoint = /^\/?auth\/(login|register|forgot-password|reset-password)/.test(url)

  config._authPortal = portal
  config._authToken = null
  // Do not attach Authorization to public auth endpoints or third-party URLs.
  if (token && !isPublicAuthEndpoint && isApiRequest(config)) {
    config.headers.Authorization = `Bearer ${token}`
    config._authToken = token
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
    const config = (error.config || {}) as AuthTaggedConfig
    if (error.response?.status === 401) {
      const portal = config._authPortal
      const sentToken = config._authToken
      // Only treat this as "session expired" when the request carried the token
      // that is *still* stored. A 401 for a request sent without a token, or with
      // a token that has since been replaced by a fresh sign-in, must not log the
      // user out (that race made sign-in fail on the first click).
      if (portal && sentToken && getToken(portal) === sentToken) {
        removeToken(portal)
        window.dispatchEvent(new CustomEvent('auth:session-expired', { detail: { portal } }))
        const path = window.location.pathname
        if (!path.includes('/sign-in') && !path.includes('/sign-up')) {
          window.location.href = portal === 'support' ? '/support/sign-in' : portal === 'shop' ? '/shop/sign-in' : '/customer/sign-in'
        }
      }
    }
    return Promise.reject(error)
  },
)

export default api
