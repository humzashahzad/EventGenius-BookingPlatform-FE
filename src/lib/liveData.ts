/**
 * Keeps open pages in step with changes made by other people.
 *
 * The API broadcasts `entity.changed` (ids only) on:
 *   - `user.{id}`  (private) — records that involve the signed-in user
 *   - `admins`     (private) — every change, for admin accounts
 *   - `catalog`    (public)  — catalogue-level changes (venues, stores, categories)
 *   - `venue.{id}` (public)  — one venue's page and availability
 *
 * Each event is re-emitted as `emitDataChanged(`${entity}.${action}`, payload)`, so pages
 * keep using `useLiveRefresh([...])`. Public channels are joined only while a page needs
 * them (`useLiveChannel`), ref-counted so several components share one subscription.
 * Guests get a socket only when such a page is open, and it closes shortly after they
 * leave. One Echo connection is shared with chat/notifications.
 */
import { onBeforeUnmount, watch, type WatchSource } from 'vue'
import type Echo from 'laravel-echo'
import { currentEcho, getEcho, onEchoInstance, onEchoStateChange, reconnectEcho, disconnectEcho } from '@/lib/echo'
import { emitDataChanged, RESYNC } from '@/composables/useLiveRefresh'

export interface EntityChange {
  entity: string
  id: number | string
  action: 'created' | 'updated' | 'deleted' | string
  venue_id?: number | string
  store_id?: number | string
  booking_id?: number | string
  client_id?: number | string
  fields?: string[]
  at?: string
}

const EVENT = '.entity.changed'
const GUEST_IDLE_MS = 15_000

/** Public channels wanted by open pages → how many. */
const publicRefs = new Map<string, number>()
let user: { id: number; admin: boolean } | null = null

/** What is bound on the current Echo instance. */
let boundEcho: Echo<'reverb'> | null = null
const boundPublic = new Set<string>()
let boundUserId: number | null = null
let boundAdmins = false

let idleTimer: ReturnType<typeof setTimeout> | null = null
let everConnected = false
let lostSinceConnected = false

// Same change may arrive on more than one channel (e.g. user.{id} and venue.{id}).
const recent = new Map<string, number>()

function handle(raw: any): void {
  const e = raw as EntityChange
  if (!e || typeof e.entity !== 'string') return
  const key = `${e.entity}|${e.id}|${e.action}|${e.at ?? ''}|${(e.fields || []).join(',')}`
  const now = Date.now()
  const seen = recent.get(key)
  if (seen && now - seen < 3000) return
  recent.set(key, now)
  if (recent.size > 200) {
    for (const [k, t] of recent) if (now - t > 3000) recent.delete(k)
  }
  emitDataChanged(`${e.entity}.${e.action || 'updated'}`, e)
}

function resetBindings(echo: Echo<'reverb'> | null): void {
  boundEcho = echo
  boundPublic.clear()
  boundUserId = null
  boundAdmins = false
}

function wantsSocket(): boolean {
  return publicRefs.size > 0 || user !== null
}

/** Bring the current Echo instance in line with what is wanted. */
function sync(createIfNeeded: boolean): void {
  let echo = currentEcho()
  if (!echo) {
    if (!createIfNeeded || publicRefs.size === 0) return
    echo = getEcho()
  }
  if (echo !== boundEcho) resetBindings(echo)

  // Public channels
  for (const name of [...boundPublic]) {
    if (!publicRefs.has(name)) {
      try { echo.leaveChannel(name) } catch { /* socket gone */ }
      boundPublic.delete(name)
    }
  }
  for (const name of publicRefs.keys()) {
    if (boundPublic.has(name)) continue
    echo.channel(name).listen(EVENT, handle)
    boundPublic.add(name)
  }

  // Personal channel (shared with chat and notifications: only our listener is touched).
  const wantUser = user?.id ?? null
  if (boundUserId !== null && boundUserId !== wantUser) {
    try { echo.private(`user.${boundUserId}`).stopListening(EVENT, handle) } catch { /* ignore */ }
    boundUserId = null
  }
  if (wantUser !== null && boundUserId === null) {
    const ch = echo.private(`user.${wantUser}`)
    ch.stopListening(EVENT, handle)
    ch.listen(EVENT, handle)
    boundUserId = wantUser
  }

  const wantAdmins = !!user?.admin
  if (boundAdmins && !wantAdmins) {
    try { echo.leaveChannel('private-admins') } catch { /* ignore */ }
    boundAdmins = false
  }
  if (wantAdmins && !boundAdmins) {
    echo.private('admins').listen(EVENT, handle)
    boundAdmins = true
  }

  scheduleIdleClose()
}

/** Guests: close the socket a little while after the last page that needed it is gone. */
function scheduleIdleClose(): void {
  if (idleTimer) { clearTimeout(idleTimer); idleTimer = null }
  if (wantsSocket()) return
  idleTimer = setTimeout(() => {
    idleTimer = null
    if (!wantsSocket() && currentEcho()) disconnectEcho()
  }, GUEST_IDLE_MS)
}

let installed = false
function install(): void {
  if (installed || typeof window === 'undefined') return
  installed = true

  onEchoInstance((echo) => {
    // A fresh socket: pages load their own data, so its first connect is not a resync.
    everConnected = false
    lostSinceConnected = false
    if (echo) {
      resetBindings(echo)
      // Bind after the creator has finished its own setup.
      queueMicrotask(() => sync(false))
    } else {
      resetBindings(null)
      // Torn down (sign-out / account switch) while public pages are open: reopen for them.
      if (publicRefs.size) setTimeout(() => { if (!currentEcho()) sync(true) }, 0)
    }
  })

  onEchoStateChange((current) => {
    if (current === 'connected') {
      if (everConnected && lostSinceConnected) emitDataChanged(RESYNC)
      everConnected = true
      lostSinceConnected = false
    } else if (current === 'unavailable' || current === 'failed' || current === 'connecting' || current === 'disconnected') {
      if (everConnected) lostSinceConnected = true
    }
  })

  // Wake the socket up when the device or tab comes back; the reconnect sends one resync.
  const wake = () => { if (currentEcho() && wantsSocket()) reconnectEcho() }
  window.addEventListener('online', wake)
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') wake() })
}

/** Set (or clear) the signed-in account. Call before chat/notifications connect. */
export function setLiveUser(next: { id: number; role?: string } | null): void {
  install()
  const value = next ? { id: next.id, admin: next.role === 'admin' } : null
  if (value?.id === user?.id && value?.admin === user?.admin) return
  user = value
  sync(false)
}

/** Join a public channel ('catalog', 'venue.12'). Returns a release function. */
export function retainChannel(name: string): () => void {
  install()
  publicRefs.set(name, (publicRefs.get(name) || 0) + 1)
  sync(true)
  let released = false
  return () => {
    if (released) return
    released = true
    const n = (publicRefs.get(name) || 0) - 1
    if (n > 0) publicRefs.set(name, n)
    else publicRefs.delete(name)
    // Leave a moment later so a page that re-joins straight away (route change) keeps it.
    setTimeout(() => sync(false), 1000)
  }
}

/**
 * Keep public channels joined while the calling component is mounted. Accepts a list or a
 * getter (re-evaluated when it changes, e.g. the venue id in the route). Null/empty entries
 * are skipped.
 */
export function useLiveChannel(source: string | null | (string | null | undefined)[] | WatchSource<string | null | undefined | (string | null | undefined)[]>): void {
  let releases: (() => void)[] = []
  const apply = (value: unknown) => {
    const list = (Array.isArray(value) ? value : [value]).filter((v): v is string => typeof v === 'string' && v.length > 0)
    const old = releases
    releases = list.map(retainChannel)
    old.forEach(r => r())
  }
  if (typeof source === 'function' || (source && typeof source === 'object' && !Array.isArray(source))) {
    watch(source as WatchSource<unknown>, apply, { immediate: true })
  } else {
    apply(source)
  }
  onBeforeUnmount(() => { releases.forEach(r => r()); releases = [] })
}

/** The venue a payload is about (its own id for venue events). */
export function venueIdOf(data: any): string | null {
  if (!data || typeof data !== 'object') return null
  if (data.venue_id != null) return String(data.venue_id)
  if (data.entity === 'venue' && data.id != null) return String(data.id)
  return null
}

/** The store a payload is about (its own id for store events). */
export function storeIdOf(data: any): string | null {
  if (!data || typeof data !== 'object') return null
  if (data.store_id != null) return String(data.store_id)
  if (data.entity === 'store' && data.id != null) return String(data.id)
  return null
}

/** True unless the payload is clearly about a different venue. */
export function isAboutVenue(data: any, venueId: number | string | null | undefined): boolean {
  if (venueId == null || venueId === '') return true
  const v = venueIdOf(data)
  return v === null || v === String(venueId)
}

/** True unless the payload is clearly about a different store. */
export function isAboutStore(data: any, storeId: number | string | null | undefined): boolean {
  if (storeId == null || storeId === '') return true
  const s = storeIdOf(data)
  return s === null || s === String(storeId)
}

/** Lets tests feed an event through the same path as the socket. Harmless in production. */
export const __liveTest = {
  inject: (payload: EntityChange) => handle(payload),
  channels: () => ({ wanted: Object.fromEntries(publicRefs), bound: [...boundPublic], user: boundUserId, admins: boundAdmins }),
}
if (typeof window !== 'undefined') (window as any).__egLive = __liveTest
