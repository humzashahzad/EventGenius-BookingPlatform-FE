// Small display helpers shared by the public venue pages and cards.
import { getStorageUrl } from '@/lib/storageUrl'

export interface CategoryLike { slug: string; name: string }

/** Primary photo path for a venue (primary image, first image, then thumbnail). */
export function venueImagePath(v: any): string | null {
  const imgs: any[] = Array.isArray(v?.images) ? v.images : []
  const primary = imgs.find(i => i?.is_primary)
  return primary?.path || imgs[0]?.path || v?.thumbnail || null
}

export function venueImageUrl(v: any): string {
  const p = venueImagePath(v)
  return p ? getStorageUrl(p) : ''
}

/** "baby_showers" → "Baby Showers", preferring the real category name. */
export function eventTypeLabel(slug: string, categories: CategoryLike[] = []): string {
  const match = categories.find(c => c.slug === slug)
  if (match) return match.name
  return String(slug || '').replace(/_/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase())
}

export function formatNumber(n: number | string | null | undefined): string {
  const v = Number(n ?? 0)
  return Number.isFinite(v) ? v.toLocaleString('en-PK') : '0'
}

/** "300–1,200" or "Up to 500" */
export function capacityRange(v: any): string {
  const min = Number(v?.capacity_min) || 0
  const max = Number(v?.capacity_max) || 0
  if (min && max) return `${formatNumber(min)}–${formatNumber(max)}`
  if (max) return `Up to ${formatNumber(max)}`
  if (min) return `${formatNumber(min)}+`
  return '—'
}

export function hasPerHeadPrice(v: any): boolean {
  return Number(v?.price_per_head) > 0
}

/** Rating with one decimal, or null when the venue has no reviews yet. */
export function ratingText(v: any): string | null {
  const n = Number(v?.total_reviews) || 0
  const r = Number(v?.avg_rating)
  return n > 0 && Number.isFinite(r) && r > 0 ? r.toFixed(1) : null
}

/** "15:00" → "3:00 PM" */
export function formatClock(t: string | null | undefined): string {
  if (!t) return ''
  const [hs, ms = '00'] = String(t).split(':')
  const h = Number(hs)
  if (Number.isNaN(h)) return String(t)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${ms.padStart(2, '0').slice(0, 2)} ${suffix}`
}

const EVENT_ICONS: Record<string, string> = {
  weddings: 'heart',
  engagement_parties: 'heart',
  anniversaries: 'calendar-check',
  bridal_showers: 'smile',
  baby_showers: 'smile',
  birthday_parties: 'smile',
  graduation_parties: 'star',
  corporate_events: 'building',
  conferences: 'users',
  seminars_workshops: 'notes',
  concerts_music_events: 'mic',
  festivals: 'star',
  religious_events: 'building',
}

export function eventTypeIcon(slug: string): string {
  return EVENT_ICONS[slug] || 'tags'
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${formatNumber(n)} ${n === 1 ? one : many}`
}
