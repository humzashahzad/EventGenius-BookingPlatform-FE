/**
 * Portal subdomains.
 *
 * Each user type has its own subdomain, while the app keeps its internal route paths:
 *
 *   address bar                               router path
 *   eventgenius.m-dev.me/venues/90        ↔   /venues/90            (public site)
 *   customer.eventgenius.m-dev.me/bookings ↔  /customer/bookings
 *   shop.eventgenius.m-dev.me/dashboard   ↔   /shop/dashboard
 *   support.eventgenius.m-dev.me/users    ↔   /support/users
 *
 * A history wrapper translates between the two, so every existing RouterLink, router.push
 * and route definition keeps working. Links to another portal (or to the public site)
 * become full links to the right subdomain. On any other host (localhost, previews)
 * nothing changes and the app uses plain paths as before.
 */
import { createWebHistory, type RouterHistory } from 'vue-router'

export type HostPortal = 'customer' | 'shop' | 'support'

const PORTALS: HostPortal[] = ['customer', 'shop', 'support']
export const ROOT_DOMAIN: string = import.meta.env.VITE_ROOT_DOMAIN || 'eventgenius.m-dev.me'

const hostname = typeof window !== 'undefined' ? window.location.hostname : ''

/** The portal this host serves, or null on the public site / other hosts. */
export const hostPortal: HostPortal | null =
  PORTALS.find(p => hostname === `${p}.${ROOT_DOMAIN}`) ?? null

/** True when running on the real domain (root or a portal subdomain). */
export const subdomainsEnabled: boolean = hostname === ROOT_DOMAIN || hostPortal !== null

/** Cookie domain shared by the root domain and every portal subdomain. */
export const sharedCookieDomain: string | null = subdomainsEnabled ? `.${ROOT_DOMAIN}` : null

function originFor(portal: HostPortal | null): string {
  const { protocol, port } = window.location
  return `${protocol}//${portal ? `${portal}.` : ''}${ROOT_DOMAIN}${port ? `:${port}` : ''}`
}

/** Split "/a/b?x=1#h" into ["/a/b", "?x=1#h"]. */
function splitPath(full: string): [string, string] {
  const i = full.search(/[?#]/)
  return i === -1 ? [full || '/', ''] : [full.slice(0, i) || '/', full.slice(i)]
}

function portalOfRouterPath(path: string): HostPortal | null {
  const first = path.split('/')[1] as HostPortal
  return PORTALS.includes(first) ? first : null
}

/** Where a router path lives: its host portal and the path shown in that host's address bar. */
export function locate(routerFullPath: string): { portal: HostPortal | null; urlPath: string } {
  const [path, rest] = splitPath(routerFullPath)
  const portal = portalOfRouterPath(path)
  if (!portal) return { portal: null, urlPath: path + rest }
  const stripped = path.slice(portal.length + 1) || '/'
  return { portal, urlPath: stripped + rest }
}

/** Absolute URL for a router path, on the subdomain it belongs to. */
export function hrefFor(routerFullPath: string): string {
  if (!subdomainsEnabled) return routerFullPath
  const { portal, urlPath } = locate(routerFullPath)
  return originFor(portal) + urlPath
}

/** If a router path belongs on another host, its absolute URL; otherwise null. */
export function crossHostHref(routerFullPath: string): string | null {
  if (!subdomainsEnabled) return null
  const { portal } = locate(routerFullPath)
  return portal === hostPortal ? null : hrefFor(routerFullPath)
}

/** Path for this host's address bar (router path with this host's portal prefix removed). */
function toUrlPath(routerFullPath: string): string {
  const { portal, urlPath } = locate(routerFullPath)
  return portal && portal === hostPortal ? urlPath : routerFullPath
}

// Set by the router after it is created; tells whether a router path matches a real route.
let hasRoute: (path: string) => boolean = () => true
export function setRouteMatcher(fn: (path: string) => boolean): void {
  hasRoute = fn
}

/** Router path for what is in this host's address bar. */
function toRouterPath(urlFullPath: string): string {
  if (!hostPortal) return urlFullPath
  const [path, rest] = splitPath(urlFullPath)
  // Already a full router path (old links, /shop/... typed on another portal) — keep it.
  if (portalOfRouterPath(path)) return urlFullPath
  const prefixed = `/${hostPortal}${path === '/' ? '' : path}`
  // Public pages opened on a portal host (e.g. /venues/90) stay public; the router
  // guard then sends them to the main domain.
  if (!hasRoute(prefixed) && hasRoute(path)) return urlFullPath
  return prefixed + rest
}

/** Router history that shows clean per-portal paths in the address bar. */
export function createPortalHistory(): RouterHistory {
  const inner = createWebHistory('/')
  if (!subdomainsEnabled) return inner

  const go = (to: string, data: unknown, replace: boolean) => {
    const external = crossHostHref(to)
    if (external) {
      // Normally the router guard handles this before history is touched.
      replace ? window.location.replace(external) : window.location.assign(external)
      return
    }
    const url = toUrlPath(to)
    replace ? inner.replace(url, data as any) : inner.push(url, data as any)
  }

  return {
    get base() { return inner.base },
    get location() { return toRouterPath(inner.location) },
    get state() { return inner.state },
    push: (to, data) => go(to, data, false),
    replace: (to, data) => go(to, data, true),
    go: (delta, triggerListeners) => inner.go(delta, triggerListeners),
    listen: cb => inner.listen((to, from, info) => cb(toRouterPath(to), toRouterPath(from), info)),
    createHref: location => crossHostHref(location) ?? inner.createHref(toUrlPath(location)),
    destroy: () => inner.destroy(),
  }
}

/** After the first navigation, show the clean path (e.g. /customer/sign-in → /sign-in). */
export function cleanAddressBar(routerFullPath: string): void {
  if (!subdomainsEnabled || crossHostHref(routerFullPath)) return
  const clean = toUrlPath(routerFullPath)
  const current = window.location.pathname + window.location.search + window.location.hash
  if (clean !== current) {
    const state = window.history.state && typeof window.history.state === 'object'
      ? { ...window.history.state, current: clean }
      : window.history.state
    window.history.replaceState(state, '', clean)
  }
}
