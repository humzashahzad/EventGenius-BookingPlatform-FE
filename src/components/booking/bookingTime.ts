/**
 * Time and date helpers for the booking flow (VenueBookingView).
 * Times are "HH:mm" (24-hour) — the format the API stores.
 */
import { formatTime } from '@/lib/format'
import { minutesToTime, normalizeTime, timeToMinutes, toISODate } from '@/components/forms'

export interface DaySlot {
  date: string        // YYYY-MM-DD ('' while not chosen)
  start_time: string  // HH:mm
  end_time: string    // HH:mm
}

export interface BookedSlot {
  start_time: string
  end_time: string
  event_name?: string
  status?: string
}

export interface Range { start: number; end: number }

/** Minutes kept free before and after another event for setup and cleanup. */
export const CHANGEOVER_MIN = 60
/** Shortest booking we offer. */
export const MIN_DURATION_MIN = 60
/** Times are offered every 30 minutes. */
export const TIME_STEP_MIN = 30

export const toMin = (t: string) => timeToMinutes(normalizeTime(t))
export const toTime = (m: number) => minutesToTime(Math.max(0, Math.min(m, 23 * 60 + 59)))

/** Venue opening hours, with the same defaults the API uses (00:00–23:59). */
export function operatingWindow(start?: string | null, end?: string | null): Range {
  const s = toMin(start || '00:00')
  let e = toMin(end || '23:59')
  if (e === 0 || e === 24 * 60) e = 23 * 60 + 59
  return { start: s, end: e }
}

/** Bookings on the day, widened by the changeover time on both sides. */
export function blockedRanges(slots: BookedSlot[]): Range[] {
  return slots.map(b => ({ start: toMin(b.start_time) - CHANGEOVER_MIN, end: toMin(b.end_time) + CHANGEOVER_MIN }))
}

export const overlaps = (a: Range, b: Range) => a.start < b.end && a.end > b.start

/** The first existing booking a chosen time clashes with (including changeover), or null. */
export function findConflict(start: string, end: string, slots: BookedSlot[]): BookedSlot | null {
  if (!start || !end) return null
  const want = { start: toMin(start), end: toMin(end) }
  return slots.find(b => overlaps(want, { start: toMin(b.start_time) - CHANGEOVER_MIN, end: toMin(b.end_time) + CHANGEOVER_MIN })) ?? null
}

/** Start times inside opening hours that leave room for the minimum duration and aren't taken. */
export function startOptions(win: Range, blocked: Range[]): string[] {
  const out: string[] = []
  for (let m = win.start; m + MIN_DURATION_MIN <= win.end; m += TIME_STEP_MIN) {
    if (!blocked.some(r => overlaps({ start: m, end: m + MIN_DURATION_MIN }, r))) out.push(toTime(m))
  }
  return out
}

/** End times after `start` up to closing, stopping at the next taken period. */
export function endOptions(start: string, win: Range, blocked: Range[]): string[] {
  if (!start) return []
  const s = toMin(start)
  const out: string[] = []
  let m = s + MIN_DURATION_MIN
  for (; m <= win.end; m += TIME_STEP_MIN) {
    if (blocked.some(r => overlaps({ start: s, end: m }, r))) break
    out.push(toTime(m))
  }
  // Venues open until midnight close at 23:59 (what the API accepts).
  const last = out[out.length - 1]
  if (m > win.end && win.end % TIME_STEP_MIN !== 0 && toTime(win.end) !== last && !blocked.some(r => overlaps({ start: s, end: win.end }, r)) && win.end - s >= MIN_DURATION_MIN) {
    out.push(toTime(win.end))
  }
  return out
}

export interface QuickSlot { key: string; label: string; start: string; end: string; available: boolean }

/** Common event times, clipped to opening hours (lunch, dinner, the whole day). */
export function quickSlots(win: Range, blocked: Range[]): QuickSlot[] {
  const parts = [
    { key: 'morning', label: 'Morning', start: 9 * 60, end: 13 * 60 },
    { key: 'afternoon', label: 'Afternoon', start: 13 * 60, end: 17 * 60 },
    { key: 'evening', label: 'Evening', start: 19 * 60, end: 23 * 60 },
  ]
  const out: QuickSlot[] = []
  for (const p of parts) {
    const s = Math.max(p.start, win.start)
    const e = Math.min(p.end, win.end)
    if (e - s < 3 * 60) continue
    out.push({ key: p.key, label: p.label, start: toTime(s), end: toTime(e), available: !blocked.some(r => overlaps({ start: s, end: e }, r)) })
  }
  if (win.end - win.start >= 4 * 60) {
    out.push({ key: 'full', label: 'Whole day', start: toTime(win.start), end: toTime(win.end), available: !blocked.some(r => overlaps(win, r)) })
  }
  return out
}

/** "4 hours", "2 hours 30 minutes", "11 hours 59 minutes". */
export function durationLabel(start: string, end: string): string {
  if (!start || !end) return ''
  const d = toMin(end) - toMin(start)
  if (d <= 0) return ''
  const h = Math.floor(d / 60)
  const m = d % 60
  const hs = h ? `${h} hour${h === 1 ? '' : 's'}` : ''
  const ms = m ? `${m} minute${m === 1 ? '' : 's'}` : ''
  return [hs, ms].filter(Boolean).join(' ')
}

export const timeRange = (start: string, end: string) => `${formatTime(start)} – ${formatTime(end)}`

/** "Sat, 28 Nov 2026" */
export function formatDay(iso: string, long = false): string {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-GB', long
    ? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
    : { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

/** The API needs event_date after today, so the first bookable day is tomorrow. */
export function firstBookableISO(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 1)
  return toISODate(d)
}
