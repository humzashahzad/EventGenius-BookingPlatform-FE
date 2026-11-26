import { ref, onBeforeUnmount, type Ref } from 'vue'

/**
 * Page data that survives route changes within a portal.
 *
 * The first visit to a page shows its loading state; when the user comes back to it
 * later (or the page is re-created by a route change), the last data is shown straight
 * away and refreshed quietly in the background, so moving between pages never flashes
 * a skeleton.
 *
 *   const res = useCachedResource(() => `client:booking:${route.params.id}`, loader)
 *   onMounted(res.load)
 *   // after an action:
 *   res.refresh()
 *
 * - `loading` is true only while there is nothing to show yet.
 * - `refresh()` merges overlapping calls and ignores stale responses; a failed quiet
 *   refresh keeps the data on screen.
 * - Mutating `data.value` in place (optimistic updates) also updates the cached copy.
 * - Keys are scoped to the signed-in user; `clearPageCache()` drops everything (sign out).
 */
const store = new Map<string, unknown>()
let scope = ''

export function setPageCacheScope(userId: string | number | null | undefined): void {
  const next = userId == null ? '' : String(userId)
  if (next !== scope) store.clear()
  scope = next
}

export function clearPageCache(): void {
  store.clear()
}

export function cacheGet<T>(key: string): T | undefined {
  return store.get(`${scope}|${key}`) as T | undefined
}

export function cacheSet<T>(key: string, value: T): void {
  store.set(`${scope}|${key}`, value)
}

export interface CachedResourceOptions {
  /** Refresh quietly when the tab becomes visible again / the device comes back online. */
  refreshOnFocus?: boolean
  minFocusGapMs?: number
}

export function useCachedResource<T>(
  key: () => string,
  loader: () => Promise<T>,
  opts: CachedResourceOptions = {},
) {
  const initial = cacheGet<T>(key())
  const data = ref(initial ?? null) as Ref<T | null>
  const loading = ref(initial === undefined)
  const refreshing = ref(false)
  const error = ref('')
  const errorStatus = ref<number | null>(null)

  let seq = 0
  let inFlight: Promise<void> | null = null
  let queued = false
  let lastRun = 0
  let currentKey = key()

  async function run(showLoading: boolean): Promise<void> {
    const id = ++seq
    const k = key()
    if (showLoading) {
      loading.value = true
      error.value = ''
      errorStatus.value = null
    }
    refreshing.value = true
    try {
      const value = await loader()
      if (id !== seq) return
      data.value = value
      cacheSet(k, value)
      error.value = ''
      errorStatus.value = null
    } catch (e: any) {
      if (id !== seq) return
      // A quiet refresh that fails keeps what is on screen.
      if (showLoading || data.value === null) {
        error.value = e?.response?.data?.message || 'Please check your connection and try again.'
        errorStatus.value = e?.response?.status ?? null
      }
    } finally {
      if (id === seq) {
        loading.value = false
        refreshing.value = false
      }
      lastRun = Date.now()
    }
  }

  /**
   * Load for the current key: shows cached data at once (and refreshes it quietly),
   * or the loading state when there is nothing cached yet. Call again after the key
   * changes (e.g. a different booking id).
   */
  function load(): Promise<void> {
    const k = key()
    if (k !== currentKey) {
      currentKey = k
      const cached = cacheGet<T>(k)
      data.value = cached ?? null
      error.value = ''
      errorStatus.value = null
    }
    inFlight = null
    queued = false
    return run(data.value === null)
  }

  /** Explicit retry after a failed first load. */
  function retry(): Promise<void> {
    return run(true)
  }

  /** Quiet refresh: keeps the current data on screen and swaps in fresh data. */
  function refresh(): Promise<void> {
    if (inFlight) {
      queued = true
      return inFlight
    }
    const p: Promise<void> = run(data.value === null).finally(() => {
      if (inFlight === p) inFlight = null
      if (queued) {
        queued = false
        void refresh()
      }
    })
    inFlight = p
    return p
  }

  if (opts.refreshOnFocus !== false && typeof window !== 'undefined') {
    const gap = opts.minFocusGapMs ?? 30_000
    const onVisible = () => {
      if (document.visibilityState === 'visible' && data.value !== null && Date.now() - lastRun > gap) void refresh()
    }
    const onOnline = () => { if (data.value !== null) void refresh() }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', onOnline)
    onBeforeUnmount(() => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', onOnline)
    })
  }

  return { data, loading, refreshing, error, errorStatus, load, retry, refresh }
}
