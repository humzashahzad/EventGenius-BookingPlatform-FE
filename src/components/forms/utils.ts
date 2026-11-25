/** Formatting / parsing helpers shared by the form components. No dependencies. */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
export const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] // Pakistan: week starts Monday

/** Per-day state for DatePicker / DateRangePicker calendars (`dayMeta` prop). */
export interface DayMeta {
  /** Colours the day number and adds a dot (e.g. warning = few slots left, danger = fully booked). */
  tone?: 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  /** Read out to screen readers and shown as a tooltip, e.g. "Fully booked". */
  label?: string
  /** Block the day (same as disabledDates). */
  disabled?: boolean
}

const pad = (n: number) => String(n).padStart(2, '0')

/** Date → "2026-11-28" (local time, never UTC-shifted). */
export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** "2026-11-28" (or an ISO datetime) → local Date at midnight, or null. */
export function parseISODate(s: string | null | undefined): Date | null {
  if (!s) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s))
  if (!m) return null
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return Number.isNaN(d.getTime()) ? null : d
}

/** "2026-11-28" → "28 Nov 2026" (Pakistani day-first display). */
export function formatDisplayDate(s: string | null | undefined): string {
  const d = parseISODate(s)
  return d ? `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}` : ''
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d); x.setDate(x.getDate() + n); return x
}
export function addMonths(d: Date, n: number): Date {
  const x = new Date(d.getFullYear(), d.getMonth() + n, 1)
  const last = new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate()
  x.setDate(Math.min(d.getDate(), last))
  return x
}
export function sameDay(a: Date | null, b: Date | null) {
  return !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

/** "14:30" | "14:30:00" → "14:30" (or '' when invalid). */
export function normalizeTime(t: string | null | undefined): string {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(t ?? ''))
  return m ? `${pad(Number(m[1]))}:${m[2]}` : ''
}
/** "14:30" → "2:30 PM" */
export function to12h(t: string | null | undefined): string {
  const n = normalizeTime(t)
  if (!n) return ''
  const [h, m] = n.split(':').map(Number)
  return `${h % 12 === 0 ? 12 : h % 12}:${pad(m)} ${h >= 12 ? 'PM' : 'AM'}`
}
export function timeToMinutes(t: string): number {
  const [h, m] = normalizeTime(t).split(':').map(Number)
  return h * 60 + m
}
export function minutesToTime(min: number): string {
  return `${pad(Math.floor(min / 60))}:${pad(min % 60)}`
}

/** 1234567.5 → "1,234,567.5" using the en-PK grouping the rest of the app uses. */
export function groupNumber(n: number | null | undefined, decimals = 0): string {
  if (n === null || n === undefined || Number.isNaN(n)) return ''
  return n.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: decimals })
}

/** Keep only digits. */
export const digits = (s: string | null | undefined) => String(s ?? '').replace(/\D/g, '')

/**
 * Pakistani mobile: any of 03001234567, 0300-1234567, +92 300 1234567,
 * 923001234567 → "0300-1234567". Partial input is formatted progressively.
 */
export function formatPkMobile(raw: string | null | undefined): string {
  let d = digits(raw)
  if (d.startsWith('92')) d = '0' + d.slice(2)
  else if (d.startsWith('3')) d = '0' + d
  d = d.slice(0, 11)
  return d.length > 4 ? `${d.slice(0, 4)}-${d.slice(4)}` : d
}
/** "0300-1234567" → "+92 300 1234567" */
export function toIntlPkMobile(raw: string | null | undefined): string {
  const d = digits(formatPkMobile(raw))
  return d.length === 11 ? `+92 ${d.slice(1, 4)} ${d.slice(4)}` : String(raw ?? '')
}
export function isPkMobile(raw: string | null | undefined): boolean {
  return /^03\d{9}$/.test(digits(formatPkMobile(raw)))
}

/** "3520212345671" → "35202-1234567-1" */
export function formatCnic(raw: string | null | undefined): string {
  const d = digits(raw).slice(0, 13)
  if (d.length <= 5) return d
  if (d.length <= 12) return `${d.slice(0, 5)}-${d.slice(5)}`
  return `${d.slice(0, 5)}-${d.slice(5, 12)}-${d.slice(12)}`
}
export function isCnic(raw: string | null | undefined): boolean {
  return /^\d{5}-\d{7}-\d$/.test(String(raw ?? ''))
}

/** 1536000 → "1.5 MB" */
export function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${Math.round(b / 1024)} KB`
  return `${(b / 1024 / 1024).toFixed(1).replace(/\.0$/, '')} MB`
}
