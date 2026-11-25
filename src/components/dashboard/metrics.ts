/**
 * Small, dependency-free helpers for portal dashboards and data tables:
 * compact numbers, period-over-period deltas and time bucketing.
 */

/** 1250 → "1.3K", 377_600_000 → "377.6M". */
export function compactNumber(n: number | string | null | undefined, digits = 1): string {
  const v = Number(n ?? 0)
  const abs = Math.abs(v)
  const fmt = (x: number) => x.toFixed(digits).replace(/\.0+$/, '')
  if (abs >= 1_000_000_000) return `${fmt(v / 1_000_000_000)}B`
  if (abs >= 1_000_000) return `${fmt(v / 1_000_000)}M`
  if (abs >= 1_000) return `${fmt(v / 1_000)}K`
  return Math.round(v).toLocaleString('en-PK')
}

/** Money for KPI tiles and chart axes: "PKR 377.6M". */
export function compactPKR(n: number | string | null | undefined): string {
  return `PKR ${compactNumber(n)}`
}

/** % change from `prev` to `cur`; null when there is no baseline. */
export function pctDelta(cur: number, prev: number): number | null {
  if (!prev) return cur ? null : 0
  return ((cur - prev) / prev) * 100
}

export interface Bucket {
  key: string
  label: string
  /** Long label for tooltips / table view. */
  title: string
  start: Date
  end: Date
  value: number
}

const DAY = 86_400_000

function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

/** `count` daily buckets ending today (oldest first). */
export function dayBuckets(count: number, now = new Date()): Bucket[] {
  const today = startOfDay(now)
  return Array.from({ length: count }, (_, i) => {
    const start = new Date(today.getTime() - (count - 1 - i) * DAY)
    const end = new Date(start.getTime() + DAY)
    return {
      key: start.toISOString().slice(0, 10),
      label: start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      title: start.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
      start,
      end,
      value: 0,
    }
  })
}

/** `count` calendar-month buckets ending with the current month (oldest first). */
export function monthBuckets(count: number, now = new Date()): Bucket[] {
  return Array.from({ length: count }, (_, i) => {
    const start = new Date(now.getFullYear(), now.getMonth() - (count - 1 - i), 1)
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1)
    return {
      key: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`,
      label: start.toLocaleDateString('en-GB', { month: 'short' }),
      title: start.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
      start,
      end,
      value: 0,
    }
  })
}

/** Add `value(row)` of every row whose `date(row)` falls in a bucket. */
export function fillBuckets<T>(buckets: Bucket[], rows: T[], date: (r: T) => string | null | undefined, value: (r: T) => number = () => 1): Bucket[] {
  const out = buckets.map(b => ({ ...b, value: 0 }))
  if (!out.length) return out
  const first = out[0].start.getTime()
  const last = out[out.length - 1].end.getTime()
  for (const r of rows) {
    const raw = date(r)
    if (!raw) continue
    const t = new Date(raw).getTime()
    if (Number.isNaN(t) || t < first || t >= last) continue
    const b = out.find(x => t >= x.start.getTime() && t < x.end.getTime())
    if (b) b.value += value(r)
  }
  return out
}

/** Sum of `value(row)` for rows whose date is in [from, to). */
export function sumBetween<T>(rows: T[], date: (r: T) => string | null | undefined, from: Date, to: Date, value: (r: T) => number = () => 1): number {
  const a = from.getTime(), b = to.getTime()
  let s = 0
  for (const r of rows) {
    const raw = date(r)
    if (!raw) continue
    const t = new Date(raw).getTime()
    if (t >= a && t < b) s += value(r)
  }
  return s
}

/** "3 min ago", "2 h ago", "4 days ago", then a date. */
export function timeAgo(d: string | null | undefined): string {
  if (!d) return ''
  const t = new Date(d).getTime()
  if (Number.isNaN(t)) return ''
  const s = Math.round((Date.now() - t) / 1000)
  if (s < 0) return 'just now'
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)} min ago`
  if (s < 86_400) return `${Math.floor(s / 3600)} h ago`
  if (s < 86_400 * 7) return `${Math.floor(s / 86_400)} day${Math.floor(s / 86_400) === 1 ? '' : 's'} ago`
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function initials(name?: string | null): string {
  return (name || '?').trim().split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase()
}

export function humanize(s?: string | null): string {
  if (!s) return ''
  const t = String(s).replace(/[-_]+/g, ' ').trim()
  return t.charAt(0).toUpperCase() + t.slice(1)
}
