/**
 * Shared display formatters so every portal shows times, dates and money the same way.
 */

/** "14:30:00" | "14:30" → "2:30 PM". Returns '' for empty input. */
export function formatTime(t: string | null | undefined): string {
  if (!t) return ''
  const [hStr, mStr = '00'] = String(t).split(':')
  const h = Number(hStr)
  if (Number.isNaN(h)) return String(t)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${mStr.padStart(2, '0').slice(0, 2)} ${suffix}`
}

/** "10:00:00", "20:00:00" → "10:00 AM – 8:00 PM" */
export function formatTimeRange(start?: string | null, end?: string | null): string {
  if (!start && !end) return ''
  return `${formatTime(start)} – ${formatTime(end)}`
}

/** 40792.5 → "PKR 40,793". Whole rupees; pass decimals for gateway amounts. */
export function formatPKR(amount: number | string | null | undefined, decimals = 0): string {
  const n = Number(amount ?? 0)
  return `PKR ${n.toLocaleString('en-PK', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`
}

/** Compact money for stat tiles: 252000 → "PKR 252K", 1250000 → "PKR 1.3M" */
export function formatPKRCompact(amount: number | string | null | undefined): string {
  const n = Number(amount ?? 0)
  if (n >= 1_000_000) return `PKR ${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 10_000) return `PKR ${Math.round(n / 1000)}K`
  return formatPKR(n)
}

/** ISO/date string → "28 Dec 2026" */
export function formatDate(d: string | null | undefined, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }): string {
  if (!d) return ''
  const date = new Date(d)
  return Number.isNaN(date.getTime()) ? String(d) : date.toLocaleDateString('en-GB', opts)
}

/** Join address parts without repeating the city/country when the address already contains them. */
export function formatAddress(v: { address?: string | null; city?: string | null; country?: string | null } | null | undefined): string {
  if (!v) return ''
  const address = (v.address || '').trim()
  const lower = address.toLowerCase()
  const parts = [address]
  for (const extra of [v.city, v.country]) {
    const e = (extra || '').trim()
    if (e && !lower.includes(e.toLowerCase())) parts.push(e)
  }
  return parts.filter(Boolean).join(', ')
}
