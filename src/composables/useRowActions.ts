import { reactive } from 'vue'
import { toast } from 'vue-sonner'

/**
 * Per-row pending state + optimistic updates for list actions.
 *
 *   const actions = useRowActions()
 *   actions.isPending(b.id)            // disable / spin only THIS row's buttons
 *   await actions.run(b.id, {
 *     apply: () => { b.status = 'confirmed' },            // instant UI change
 *     request: () => api.patch(`/store/bookings/${b.id}/confirm`),
 *     rollback: () => { b.status = 'pending' },           // if the server says no
 *     success: 'Booking confirmed',
 *     error: 'Could not confirm this booking',
 *     after: () => list.refresh(),                        // optional quiet re-sync
 *   })
 *
 * Several rows can be in flight at once, so users can click Accept on one booking
 * after another without waiting. A second click on the same row while it is
 * pending is ignored (no double requests).
 */
export interface RowAction<R = unknown> {
  apply?: () => void
  request: () => Promise<R>
  rollback?: () => void
  /** Called with the server response on success (e.g. merge returned fields into the row). */
  onSuccess?: (result: R) => void
  success?: string | ((result: R) => string) | false
  error?: string | false
  /** Runs after success (not awaited by the caller's UI), e.g. a quiet list refresh. */
  after?: () => unknown
}

export function useRowActions() {
  const pending = reactive(new Map<string | number, string>())

  function isPending(id: string | number, kind?: string): boolean {
    const k = pending.get(id)
    return kind ? k === kind : k !== undefined
  }

  async function run<R>(id: string | number, action: RowAction<R>, kind = 'action'): Promise<boolean> {
    if (pending.has(id)) return false
    pending.set(id, kind)
    action.apply?.()
    try {
      const result = await action.request()
      action.onSuccess?.(result)
      if (action.success) toast.success(typeof action.success === 'function' ? action.success(result) : action.success)
      Promise.resolve(action.after?.()).catch(() => {})
      return true
    } catch (e: any) {
      action.rollback?.()
      if (action.error !== false) {
        toast.error(e?.response?.data?.message || action.error || 'Something went wrong. Please try again.')
      }
      return false
    } finally {
      pending.delete(id)
    }
  }

  return { pending, isPending, run }
}
