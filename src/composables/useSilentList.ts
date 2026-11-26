import { ref, shallowRef, onBeforeUnmount, type Ref } from 'vue'

/**
 * Loads a list once with a visible loading state, then refreshes it quietly.
 *
 * - `loading` is true only for the very first load (show skeletons for that only).
 * - `refresh()` updates the data in place without touching `loading`, so the page
 *   never flashes back to a skeleton after an action.
 * - Overlapping refreshes are merged, and a slow older response never overwrites a
 *   newer one.
 * - Optionally refreshes quietly when the tab becomes visible again or the device
 *   comes back online (throttled).
 */
export function useSilentList<T>(
  loader: () => Promise<T[]>,
  opts: { refreshOnFocus?: boolean; minFocusGapMs?: number } = {},
) {
  const items = ref<T[]>([]) as Ref<T[]>
  const loading = ref(true)
  const error = ref('')
  const loadedOnce = ref(false)
  const refreshing = ref(false)

  let seq = 0
  let inFlight: Promise<void> | null = null
  let queued = false
  let lastRun = 0

  async function run(silent: boolean): Promise<void> {
    const id = ++seq
    if (!silent || !loadedOnce.value) {
      loading.value = !loadedOnce.value
      error.value = ''
    }
    refreshing.value = true
    try {
      const data = await loader()
      if (id !== seq) return
      items.value = data
      loadedOnce.value = true
      error.value = ''
    } catch (e: any) {
      if (id !== seq) return
      // A failed quiet refresh keeps the data on screen; only the first load shows an error.
      if (!loadedOnce.value) error.value = e?.response?.data?.message || 'Please check your connection and try again.'
    } finally {
      if (id === seq) {
        loading.value = false
        refreshing.value = false
      }
      lastRun = Date.now()
    }
  }

  /** First load (or a deliberate retry after an error): shows the loading state. */
  function load(): Promise<void> {
    return run(false)
  }

  /** Quiet refresh: keeps the current rows on screen and swaps in fresh data. */
  function refresh(): Promise<void> {
    if (inFlight) {
      queued = true
      return inFlight
    }
    inFlight = run(true).finally(() => {
      inFlight = null
      if (queued) {
        queued = false
        refresh()
      }
    })
    return inFlight
  }

  if (opts.refreshOnFocus !== false) {
    const gap = opts.minFocusGapMs ?? 30_000
    const onVisible = () => {
      if (document.visibilityState === 'visible' && loadedOnce.value && Date.now() - lastRun > gap) refresh()
    }
    const onOnline = () => { if (loadedOnce.value) refresh() }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', onOnline)
    onBeforeUnmount(() => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', onOnline)
    })
  }

  return { items, loading, error, refreshing, loadedOnce, load, refresh }
}

/** Same idea for a single object (dashboards, detail pages). */
export function useSilentResource<T>(loader: () => Promise<T>, opts: { refreshOnFocus?: boolean; minFocusGapMs?: number } = {}) {
  const list = useSilentList<T>(async () => [await loader()], opts)
  const data = shallowRef<T | null>(null)
  const sync = () => { data.value = list.items.value[0] ?? null }
  const load = async () => { await list.load(); sync() }
  const refresh = async () => { await list.refresh(); sync() }
  return { data, loading: list.loading, error: list.error, refreshing: list.refreshing, load, refresh }
}
