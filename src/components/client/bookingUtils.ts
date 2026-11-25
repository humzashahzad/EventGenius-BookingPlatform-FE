/**
 * Small helpers shared by the customer booking pages (dashboard, list, detail).
 * Pure functions only — no API calls.
 */
import { getStorageUrl } from '@/lib/storageUrl'

export const FALLBACK_VENUE_IMAGE = '/images/venue-hall.jpg'

/** Venue photo for a booking (thumbnail → first image → stock photo). */
export function venueImage(b: any): string {
  const v = b?.venue
  const path = v?.thumbnail || v?.images?.find((i: any) => i.is_primary)?.path || v?.images?.[0]?.path
  return path ? getStorageUrl(path) : FALLBACK_VENUE_IMAGE
}

/** Swap a broken venue image for the stock photo (use as @error handler). */
export function onImageError(e: Event) {
  const img = e.target as HTMLImageElement
  if (img && !img.src.endsWith(FALLBACK_VENUE_IMAGE)) img.src = FALLBACK_VENUE_IMAGE
}

/**
 * The API sends event dates as "2027-09-08T00:00:00.000000Z" (a calendar date).
 * Read only the Y-M-D part so the date never shifts with the viewer's timezone,
 * then add the start time if there is one.
 */
export function eventDateTime(date?: string | null, time?: string | null): Date | null {
  if (!date) return null
  const m = String(date).match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) {
    const d = new Date(date)
    return Number.isNaN(d.getTime()) ? null : d
  }
  const [h, min] = String(time || '00:00').split(':').map(Number)
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), h || 0, min || 0)
}

/** "Sat, 28 Nov 2026" (or a custom format) for an event calendar date. */
export function formatEventDate(date?: string | null, opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }): string {
  const d = eventDateTime(date)
  return d ? d.toLocaleDateString('en-GB', opts) : ''
}

/** Whole days from today until the event date (0 = today, negative = past). */
export function daysUntil(date?: string | null): number | null {
  const d = eventDateTime(date)
  if (!d) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - today.getTime()) / 86_400_000)
}

/** "Today", "Tomorrow", "In 3 days", "In 5 weeks", "In 4 months". */
export function countdownLabel(date?: string | null): string {
  const n = daysUntil(date)
  if (n == null) return ''
  if (n < 0) return n === -1 ? 'Yesterday' : `${-n} days ago`
  if (n === 0) return 'Today'
  if (n === 1) return 'Tomorrow'
  if (n < 14) return `In ${n} days`
  if (n < 60) return `In ${Math.round(n / 7)} weeks`
  return `In ${Math.round(n / 30)} months`
}

export function isUpcomingBooking(b: any): boolean {
  const n = daysUntil(b?.event_date)
  return n != null && n >= 0 && ['pending', 'confirmed'].includes(b?.status)
}

/** Confirmed but not paid yet → the customer has to pay. */
export function needsPayment(b: any): boolean {
  return b?.status === 'confirmed' && (b?.payment_status ?? 'unpaid') === 'unpaid'
}

/** Payment badge for a booking, or null when payment is not relevant yet. */
export function paymentBadge(b: any): { cls: string; label: string } | null {
  const p = b?.payment_status
  if (p === 'paid') return { cls: 'badge-paid', label: 'Paid' }
  if (p === 'refunded') return { cls: 'badge-refunded', label: 'Refunded' }
  if (p === 'partially_paid') return { cls: 'badge-unpaid', label: 'Partly paid' }
  if (b?.status === 'confirmed') return { cls: 'badge-unpaid', label: 'Unpaid' }
  return null
}

export function guestsOf(b: any): number | null {
  const g = b?.expected_guests ?? b?.guests_count
  return g == null ? null : Number(g)
}

export function eventTypeLabel(t?: string | null): string {
  if (!t) return ''
  const s = t.replace(/_/g, ' ').replace(/\s+parties$/, ' party')
  return s.charAt(0).toUpperCase() + s.slice(1)
}
