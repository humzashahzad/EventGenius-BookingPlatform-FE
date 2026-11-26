import { ref, onBeforeUnmount, type Ref } from 'vue'
import { toast } from 'vue-sonner'

/**
 * A server-paginated list (search, filters and pages are applied by the API) that
 * never falls back to a skeleton after its first load.
 *
 *   const table = useServerTable(async () => {
 *     const { data } = await api.get('/admin/users', { params: { page: table.page.value, ... } })
 *     return { rows: data.data.data, total: data.data.total, page: data.data.current_page }
 *   }, { key: u => u.id, lock: u => actions.isPending(u.id) })
 *
 * - `loading` is true only until the first response (show skeletons for that only).
 * - `fetch()` is for filter, search and page changes: the current rows stay on screen
 *   and `fetching` is true so the page can dim them / show a thin progress bar.
 * - `refresh()` is a quiet re-sync (after an action, on a realtime event, when the tab
 *   is shown again). Overlapping calls are merged.
 * - Only the newest request may update the rows, so a slow older answer never
 *   overwrites a newer one.
 * - Rows with an action in flight (`lock`) keep their local, optimistic version when
 *   a refresh lands, and rows removed with `remove()` stay hidden.
 */
export interface ServerPage<T> {
  rows: T[]
  total: number
  page?: number
  perPage?: number
}

export interface ServerTableOptions<T> {
  key?: (row: T) => string | number
  lock?: (row: T) => boolean
  errorMessage?: string
  refreshOnFocus?: boolean
  minFocusGapMs?: number
}

export function useServerTable<T>(fetcher: () => Promise<ServerPage<T>>, opts: ServerTableOptions<T> = {}) {
  const rows = ref<T[]>([]) as Ref<T[]>
  const total = ref(0)
  const page = ref(1)
  const perPage = ref<number | null>(null)
  const loading = ref(true)
  const fetching = ref(false)
  const error = ref('')
  const loadedOnce = ref(false)

  const keyOf = opts.key ?? ((r: any) => r?.id)
  const removed = new Set<string | number>()
  let seq = 0
  let lastRun = 0
  let quietInFlight: Promise<void> | null = null
  let quietQueued = false

  function merge(incoming: T[]): T[] {
    const current = new Map(rows.value.map(r => [keyOf(r), r]))
    return incoming
      .filter(r => !removed.has(keyOf(r)))
      .map(r => {
        const local = current.get(keyOf(r))
        return local && opts.lock?.(local) ? local : r
      })
  }

  async function run(mode: 'load' | 'fetch' | 'quiet'): Promise<void> {
    const id = ++seq
    if (!loadedOnce.value) {
      loading.value = true
      error.value = ''
    }
    if (mode === 'fetch' && loadedOnce.value) fetching.value = true
    try {
      const res = await fetcher()
      if (id !== seq) return
      // The last row of a later page was removed: step back a page instead of showing "nothing here".
      if (!(res.rows ?? []).length && Number(res.total) > 0 && page.value > 1) {
        page.value -= 1
        return run(mode)
      }
      rows.value = merge(res.rows ?? [])
      total.value = Math.max(0, Number(res.total ?? rows.value.length))
      if (res.page) page.value = res.page
      if (res.perPage) perPage.value = res.perPage
      loadedOnce.value = true
      error.value = ''
    } catch (e: any) {
      if (id !== seq) return
      const msg = e?.response?.data?.message || opts.errorMessage || 'Please check your connection and try again.'
      if (!loadedOnce.value) error.value = msg
      // A failed filter change keeps the old rows and says so; a failed quiet refresh stays quiet.
      else if (mode === 'fetch') toast.error(msg)
    } finally {
      if (id === seq) {
        loading.value = false
        fetching.value = false
      }
      lastRun = Date.now()
    }
  }

  /** First load, or a retry after the first load failed. */
  function load(): Promise<void> {
    return run('load')
  }

  /** Filters, search or page changed: keep rows visible, show `fetching`. */
  function fetch(): Promise<void> {
    return run('fetch')
  }

  /** Quiet re-sync with the server. */
  function refresh(): Promise<void> {
    if (!loadedOnce.value) return run('load')
    if (quietInFlight) {
      quietQueued = true
      return quietInFlight
    }
    quietInFlight = run('quiet').finally(() => {
      quietInFlight = null
      if (quietQueued) {
        quietQueued = false
        refresh()
      }
    })
    return quietInFlight
  }

  /** Go to a page (keeps rows on screen until the new page arrives). */
  function goTo(p: number): Promise<void> {
    page.value = Math.max(1, p)
    return fetch()
  }

  /** Back to page 1 (after a filter or search change) and fetch. */
  function reset(): Promise<void> {
    page.value = 1
    return fetch()
  }

  /**
   * Remove a row straight away (optimistic delete). Returns a function that puts it
   * back where it was, for when the server refuses.
   */
  function remove(id: string | number): () => void {
    const idx = rows.value.findIndex(r => keyOf(r) === id)
    removed.add(id)
    if (idx < 0) return () => { removed.delete(id) }
    const row = rows.value[idx]
    rows.value = rows.value.filter((_, i) => i !== idx)
    total.value = Math.max(0, total.value - 1)
    return () => {
      removed.delete(id)
      if (rows.value.some(r => keyOf(r) === id)) return
      const next = [...rows.value]
      next.splice(Math.min(idx, next.length), 0, row)
      rows.value = next
      total.value += 1
    }
  }

  /** Find the row with this key, if it is on the current page. */
  function find(id: string | number): T | undefined {
    return rows.value.find(r => keyOf(r) === id)
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

  return { rows, total, page, perPage, loading, fetching, error, loadedOnce, load, fetch, refresh, goTo, reset, remove, find }
}
