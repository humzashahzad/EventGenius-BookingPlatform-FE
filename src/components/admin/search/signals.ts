// Shared metadata for the admin "Search & Ranking" page.

export type SignalKey =
  | 'relevance' | 'quality' | 'popularity' | 'reliability' | 'price_fit'
  | 'capacity_fit' | 'distance' | 'engagement' | 'freshness' | 'personal'

export interface RankingSettings {
  weights: Record<SignalKey, number>
  featured_boost: number
  personalization: boolean
  learning: boolean
  exploration: boolean
  rating_prior_reviews: number
  popularity_window_days: number
  distance_half_km: number
  [key: string]: unknown
}

export interface SignalMeta {
  key: SignalKey
  label: string
  help: string
  color: string
}

// Colours are CSS variables (defined in SearchRankingView.vue, with dark-mode steps).
// Slots 1-8 are a CVD-validated categorical order; the last two are neutral greys and
// are always paired with a legend, tooltip and the per-signal details table.
export const SIGNALS: SignalMeta[] = [
  { key: 'relevance', label: 'Relevance', help: 'How well the venue’s name, type, amenities and description match the words searched.', color: 'var(--sig-relevance)' },
  { key: 'quality', label: 'Quality (rating)', help: 'Customer rating, adjusted so a few reviews don’t outrank many.', color: 'var(--sig-quality)' },
  { key: 'popularity', label: 'Popularity', help: 'How many confirmed or completed bookings the venue had recently.', color: 'var(--sig-popularity)' },
  { key: 'reliability', label: 'Reliability', help: 'Owner accepts bookings and rarely cancels them.', color: 'var(--sig-reliability)' },
  { key: 'price_fit', label: 'Price fit', help: 'Price sits within the customer’s budget (or is good value when none is given).', color: 'var(--sig-price-fit)' },
  { key: 'capacity_fit', label: 'Capacity fit', help: 'Venue comfortably holds the number of guests asked for, without being far too big.', color: 'var(--sig-capacity-fit)' },
  { key: 'distance', label: 'Distance', help: 'Close to the customer’s location, or in the city they asked for.', color: 'var(--sig-distance)' },
  { key: 'engagement', label: 'Engagement (learning)', help: 'Venues customers click on more often in search results rise over time.', color: 'var(--sig-engagement)' },
  { key: 'freshness', label: 'Freshness (new venues)', help: 'Gives venues added in the last 45 days a chance to be seen.', color: 'var(--sig-freshness)' },
  { key: 'personal', label: 'Personalisation', help: 'Matches the cities, event types and price range the signed-in customer booked before.', color: 'var(--sig-personal)' },
]

export const SIGNAL_MAP: Record<string, SignalMeta> = Object.fromEntries(SIGNALS.map(s => [s.key, s]))

export const PRESET_LABELS: Record<string, { label: string; icon: string }> = {
  balanced: { label: 'Balanced', icon: 'sliders' },
  quality_first: { label: 'Quality first', icon: 'star' },
  popularity: { label: 'Popularity', icon: 'users' },
  budget: { label: 'Budget', icon: 'currency-dollar' },
  nearby: { label: 'Nearby', icon: 'map-pin' },
}

export function cloneSettings<T>(s: T): T {
  return JSON.parse(JSON.stringify(s)) as T
}

export function apiError(e: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const err = e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }
  const data = err?.response?.data
  if (data?.errors) {
    const first = Object.values(data.errors)[0]
    if (first?.length) return first[0]
  }
  return data?.message || fallback
}

export function pct(v: number | null | undefined, digits = 1): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '—'
  return `${Number(v).toFixed(digits)}%`
}

export function num(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—'
  return Number(v).toLocaleString('en-PK')
}
