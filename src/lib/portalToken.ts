import { ref } from 'vue'
import { hostPortal, sharedCookieDomain } from '@/lib/portalHost'

export type Portal = 'customer' | 'shop' | 'support'

/** Reactive trigger — increments whenever a token is written/removed so computed properties recompute. */
export const tokenVersion = ref(0)

export const TOKEN_KEYS: Record<Portal, string> = {
  customer: 'auth_token_customer',
  shop:     'auth_token_shop',
  support:  'auth_token_support',
}

/** The currently active portal — updated by the router guard on every navigation. */
export const currentPortal = ref<Portal>('customer')

/** Detect portal from a router path (on a portal subdomain, the subdomain decides). */
export function detectPortalFromPath(path: string): Portal {
  if (hostPortal) return hostPortal
  if (path.startsWith('/support')) return 'support'
  if (path.startsWith('/shop'))    return 'shop'
  return 'customer'
}

/** Get the localStorage key for a portal. */
export function getTokenKey(portal?: Portal): string {
  return TOKEN_KEYS[portal ?? currentPortal.value]
}

// On the real domain, tokens live in a cookie shared by eventgenius.m-dev.me and its
// customer./shop./support. subdomains, so signing in on one is seen by all of them.
// Elsewhere (localhost, previews) they stay in localStorage as before.
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days; the API still enforces the JWT expiry

function readCookie(name: string): string | null {
  const hit = document.cookie.split('; ').find(c => c.startsWith(name + '='))
  return hit ? decodeURIComponent(hit.slice(name.length + 1)) : null
}

function writeCookie(name: string, value: string, maxAge: number): void {
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${name}=${encodeURIComponent(value)}; Domain=${sharedCookieDomain}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`
}

function safeLocal<T>(fn: () => T, fallback: T): T {
  try { return fn() } catch { return fallback }
}

/** Read the JWT token for a portal (defaults to current). */
export function getToken(portal?: Portal): string | null {
  const key = getTokenKey(portal)
  if (!sharedCookieDomain) return safeLocal(() => localStorage.getItem(key), null)

  const fromCookie = readCookie(key)
  if (fromCookie) return fromCookie
  // Sessions created before subdomains existed: move the token into the shared cookie.
  const legacy = safeLocal(() => localStorage.getItem(key), null)
  if (legacy) {
    writeCookie(key, legacy, COOKIE_MAX_AGE)
    safeLocal(() => localStorage.removeItem(key), undefined)
  }
  return legacy
}

/** Store a JWT token for a portal (defaults to current). */
export function setToken(token: string, portal?: Portal): void {
  const key = getTokenKey(portal ?? currentPortal.value)
  if (sharedCookieDomain) {
    writeCookie(key, token, COOKIE_MAX_AGE)
    safeLocal(() => localStorage.removeItem(key), undefined)
  } else {
    safeLocal(() => localStorage.setItem(key, token), undefined)
  }
  tokenVersion.value++
}

/** Remove the JWT token for a portal (defaults to current). */
export function removeToken(portal?: Portal): void {
  const key = getTokenKey(portal ?? currentPortal.value)
  if (sharedCookieDomain) writeCookie(key, '', 0)
  safeLocal(() => localStorage.removeItem(key), undefined)
  tokenVersion.value++
}

/**
 * One-time migration: move old `auth_token` to the correct portal key.
 * Called once on app startup. We call /auth/me with the old token to discover the role,
 * then store it under the appropriate new key.
 */
export async function migrateOldToken(): Promise<void> {
  const oldToken = localStorage.getItem('auth_token')
  if (!oldToken) return

  // Check if any new key already has a token — if so, skip migration
  const hasNewTokens = (Object.keys(TOKEN_KEYS) as Portal[]).some(p => getToken(p))
  if (hasNewTokens) {
    localStorage.removeItem('auth_token')
    return
  }

  try {
    const { default: api } = await import('@/lib/axios')
    // Temporarily set the old token so the request interceptor picks it up
    const portal = detectPortalFromPath(window.location.pathname)
    setToken(oldToken, portal)
    const { data } = await api.get('/auth/me')
    const role = data.data?.role

    // Map backend role to portal
    let targetPortal: Portal = 'customer'
    if (role === 'admin')       targetPortal = 'support'
    if (role === 'store_owner') targetPortal = 'shop'

    // Store under correct key (it might already be there if portal matched)
    if (targetPortal !== portal) {
      removeToken(portal)
      setToken(oldToken, targetPortal)
    }
  } catch {
    // Token is invalid — just clean up
    ;(Object.keys(TOKEN_KEYS) as Portal[]).forEach(p => removeToken(p))
  } finally {
    localStorage.removeItem('auth_token')
  }
}
