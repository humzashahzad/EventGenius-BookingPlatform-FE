import { ref } from 'vue'

export type Portal = 'customer' | 'shop' | 'support'

export const TOKEN_KEYS: Record<Portal, string> = {
  customer: 'auth_token_customer',
  shop:     'auth_token_shop',
  support:  'auth_token_support',
}

/** The currently active portal — updated by the router guard on every navigation. */
export const currentPortal = ref<Portal>('customer')

/** Detect portal from a URL path. */
export function detectPortalFromPath(path: string): Portal {
  if (path.startsWith('/support')) return 'support'
  if (path.startsWith('/shop'))    return 'shop'
  return 'customer'
}

/** Get the localStorage key for a portal. */
export function getTokenKey(portal?: Portal): string {
  return TOKEN_KEYS[portal ?? currentPortal.value]
}

/** Read the JWT token for a portal (defaults to current). */
export function getToken(portal?: Portal): string | null {
  return localStorage.getItem(getTokenKey(portal))
}

/** Store a JWT token for a portal (defaults to current). */
export function setToken(token: string, portal?: Portal): void {
  localStorage.setItem(getTokenKey(portal ?? currentPortal.value), token)
}

/** Remove the JWT token for a portal (defaults to current). */
export function removeToken(portal?: Portal): void {
  localStorage.removeItem(getTokenKey(portal ?? currentPortal.value))
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
  const hasNewTokens = Object.values(TOKEN_KEYS).some(k => localStorage.getItem(k))
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
    Object.values(TOKEN_KEYS).forEach(k => localStorage.removeItem(k))
  } finally {
    localStorage.removeItem('auth_token')
  }
}
