/**
 * Role Mapping — Maps backend role values to frontend display labels and route prefixes.
 * Backend roles (client, store_owner, admin) remain unchanged in API calls and auth logic.
 * Only the frontend labels and URL paths change.
 */

export type BackendRole = 'client' | 'store_owner' | 'admin'

/** Human-readable labels for the UI */
export const ROLE_LABELS: Record<BackendRole, string> = {
  client: 'Customer',
  store_owner: 'Shop Owner',
  admin: 'Support',
}

/** Route path prefixes (without leading slash) */
export const ROLE_ROUTE_PREFIX: Record<BackendRole, string> = {
  client: 'customer',
  store_owner: 'shop',
  admin: 'support',
}

/** Login route names per backend role */
export const ROLE_LOGIN_ROUTE: Record<BackendRole, string> = {
  client: 'customer-login',
  store_owner: 'shop-login',
  admin: 'support-login',
}

export function getRoleLabel(role: string): string {
  return ROLE_LABELS[role as BackendRole] || role.replace('_', ' ')
}

export function getRoutePrefix(role: string): string {
  return ROLE_ROUTE_PREFIX[role as BackendRole] || role
}

export function getLoginRoute(role: string): string {
  return ROLE_LOGIN_ROUTE[role as BackendRole] || 'customer-login'
}
