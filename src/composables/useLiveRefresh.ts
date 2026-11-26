import { onBeforeUnmount } from 'vue'

/**
 * A quiet "data changed" signal. It is emitted for every realtime notification (new
 * booking, payment, review, store approval…) and for every `entity.changed` broadcast
 * (see `@/lib/liveData`, type = `${entity}.${action}`, data = the payload). Pages that show
 * that data subscribe and refresh in place, without loaders or reloads.
 *
 *   useLiveRefresh(['booking', 'payment'], () => list.refresh())
 *
 * Each entry is matched as a prefix or substring of the type, e.g. 'booking' matches
 * booking_created, new_booking_received, booking.updated…
 *
 * - Calls are debounced so a burst of events triggers one refresh.
 * - While the tab is hidden nothing is fetched; one catch-up call runs when it is shown again.
 * - `match` drops events about other records (e.g. another venue) before they count.
 * - A resync (`RESYNC`, sent after the socket reconnects) reaches every listener.
 */
const EVENT = 'eg:data-changed'

/** Type sent when events may have been missed (socket reconnected): every page refreshes. */
export const RESYNC = '*'

export function emitDataChanged(type: string, data?: unknown): void {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { type, data } }))
}

export interface LiveRefreshOptions {
  debounceMs?: number
  /** Return false to ignore an event (e.g. it is about a different venue). Not called for resyncs. */
  match?: (type: string, data: any) => boolean
}

export function useLiveRefresh(
  topics: string[],
  handler: (type: string, data?: any) => void,
  options: number | LiveRefreshOptions = 400,
): void {
  const opts: LiveRefreshOptions = typeof options === 'number' ? { debounceMs: options } : options
  const debounceMs = opts.debounceMs ?? 400
  let timer: ReturnType<typeof setTimeout> | null = null
  let pendingWhileHidden = false
  let lastType = ''
  let lastData: any

  const fire = () => {
    timer = null
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      pendingWhileHidden = true
      return
    }
    handler(lastType, lastData)
  }

  const listener = (e: Event) => {
    const { type, data } = (e as CustomEvent).detail || {}
    if (typeof type !== 'string') return
    if (type !== RESYNC) {
      if (!topics.some(t => type.includes(t))) return
      if (opts.match) {
        try { if (!opts.match(type, data)) return } catch { return }
      }
    }
    lastType = type
    lastData = data
    if (timer) clearTimeout(timer)
    timer = setTimeout(fire, debounceMs)
  }

  const onVisible = () => {
    if (document.visibilityState !== 'visible' || !pendingWhileHidden) return
    pendingWhileHidden = false
    if (timer) clearTimeout(timer)
    timer = setTimeout(fire, 150)
  }

  window.addEventListener(EVENT, listener)
  document.addEventListener('visibilitychange', onVisible)
  onBeforeUnmount(() => {
    window.removeEventListener(EVENT, listener)
    document.removeEventListener('visibilitychange', onVisible)
    if (timer) clearTimeout(timer)
  })
}

/** Helper for `match`: true when the payload is about this id (or carries no such id). */
export function aboutId(data: any, key: string, id: number | string | null | undefined): boolean {
  if (id == null || id === '') return true
  if (!data || typeof data !== 'object') return true
  const value = data[key]
  if (value == null) return true
  return String(value) === String(id)
}
