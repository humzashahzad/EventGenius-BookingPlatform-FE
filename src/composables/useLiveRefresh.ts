import { onBeforeUnmount } from 'vue'

/**
 * A quiet "data changed" signal. The notifications store emits it for every realtime
 * notification (new booking, payment, review, store approval…); pages that show that
 * data subscribe and refresh in place, without loaders or reloads.
 *
 *   useLiveRefresh(['booking', 'payment'], () => list.refresh())
 *
 * Each entry is matched as a prefix or substring of the notification type, e.g.
 * 'booking' matches booking_created, new_booking_received, booking_confirmed…
 * Calls are debounced so a burst of notifications triggers one refresh.
 */
const EVENT = 'eg:data-changed'

export function emitDataChanged(type: string, data?: unknown): void {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { type, data } }))
}

export function useLiveRefresh(topics: string[], handler: (type: string, data?: any) => void, debounceMs = 400): void {
  let timer: ReturnType<typeof setTimeout> | null = null
  let lastType = ''
  let lastData: any
  const listener = (e: Event) => {
    const { type, data } = (e as CustomEvent).detail || {}
    if (typeof type !== 'string' || !topics.some(t => type.includes(t))) return
    lastType = type
    lastData = data
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => { timer = null; handler(lastType, lastData) }, debounceMs)
  }
  window.addEventListener(EVENT, listener)
  onBeforeUnmount(() => {
    window.removeEventListener(EVENT, listener)
    if (timer) clearTimeout(timer)
  })
}
