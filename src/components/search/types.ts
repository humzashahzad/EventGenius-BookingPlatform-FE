// Shapes shared by the smart search components (see docs/smart-search.md in the backend repo).

export type ChipType =
  | 'city' | 'event_type' | 'guests' | 'max_price' | 'min_price'
  | 'intent' | 'term' | 'amenity'
  // Added by the page, not by the parser:
  | 'near_me'

export interface SearchChip {
  type: ChipType
  label: string
  param?: string
  value?: string | number | null
  /** 'query' = understood from the text, 'filter' = chosen in a dropdown, 'location' = Near me. */
  source?: 'query' | 'filter' | 'location'
}

export interface Understood {
  raw: string
  terms: string[]
  city: string | null
  event_type: string | null
  guests: number | null
  max_price: number | null
  min_price: number | null
  intents: string[]
  amenities: string[]
  chips: SearchChip[]
}

export type SuggestionType = 'venue' | 'city' | 'category' | 'query'

export interface Suggestion {
  type: SuggestionType
  label: string
  value: string
  venue_id?: number
  city?: string
}

export const EXAMPLE_QUERIES = [
  'wedding hall in Lahore for 300 guests under 3000',
  'cheap birthday venue in Karachi',
  'top rated conference hall Islamabad',
  'rooftop for 50 people',
]

export function normalizeUnderstood(raw: any): Understood | null {
  if (!raw || typeof raw !== 'object') return null
  const arr = (v: any) => (Array.isArray(v) ? v : [])
  return {
    raw: typeof raw.raw === 'string' ? raw.raw : '',
    terms: arr(raw.terms).map(String),
    city: raw.city ?? null,
    event_type: raw.event_type ?? null,
    guests: raw.guests != null ? Number(raw.guests) : null,
    max_price: raw.max_price != null ? Number(raw.max_price) : null,
    min_price: raw.min_price != null ? Number(raw.min_price) : null,
    intents: arr(raw.intents).map(String),
    amenities: arr(raw.amenities).map(String),
    chips: arr(raw.chips)
      .filter((c: any) => c && typeof c.label === 'string')
      .map((c: any) => ({ type: c.type, label: c.label, param: c.param, value: c.value, source: 'query' as const })),
  }
}
