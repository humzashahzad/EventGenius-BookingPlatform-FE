import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// ── Request interceptor — attach JWT token ─────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Response interceptor — capture JWT from headers + handle 401 ───────────
api.interceptors.response.use(
  (response) => {
    // JWT is returned in X-Auth-Token header on login/register
    const newToken = response.headers['x-auth-token']
    if (newToken) {
      localStorage.setItem('auth_token', newToken)
    }
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or session revoked — clear and redirect
      localStorage.removeItem('auth_token')
      // Emit event so Pinia stores can react before redirect
      window.dispatchEvent(new CustomEvent('auth:session-expired'))
      const path = window.location.pathname
      const isOnSignIn = path.includes('/sign-in')
      if (!isOnSignIn) {
        if (path.startsWith('/admin-panel')) {
          window.location.href = '/admin-panel/sign-in'
        } else if (path.startsWith('/store')) {
          window.location.href = '/store/sign-in'
        } else {
          window.location.href = '/client/sign-in'
        }
      }
    }
    return Promise.reject(error)
  },
)

export default api
