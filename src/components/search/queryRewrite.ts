// Removes the words behind one "We understood" chip from the free-text query, so that
// removing a chip and searching again does not bring the same chip back.
// The parser lives on the server; this mirrors its vocabulary closely enough for removal.
import type { SearchChip } from './types'

const EVENT_WORDS: Record<string, string[]> = {
  weddings: ['shadi', 'shaadi', 'wedding', 'weddings', 'marriage', 'barat', 'baraat', 'walima', 'valima', 'nikah', 'nikkah', 'mehndi', 'mehendi'],
  engagement_parties: ['ring ceremony', 'engagement', 'engagements', 'mangni'],
  birthday_parties: ['birthday party', 'birthday', 'birthdays', 'bday', 'salgirah'],
  conferences: ['conference', 'conferences'],
  seminars_workshops: ['seminar', 'seminars', 'workshop', 'workshops', 'training'],
  corporate_events: ['corporate', 'office', 'meeting', 'company'],
  concerts_music_events: ['concert', 'concerts', 'music', 'gig', 'qawwali'],
  graduation_parties: ['graduation', 'convocation'],
  baby_showers: ['baby shower', 'aqiqa', 'aqeeqa'],
  bridal_showers: ['bridal shower'],
  anniversaries: ['anniversary', 'anniversaries'],
  festivals: ['festival', 'festivals', 'mela'],
  religious_events: ['religious', 'milad', 'majlis', 'iftar', 'dars'],
}

const CITY_ALIASES: Record<string, string[]> = {
  lahore: ['lhr'],
  karachi: ['khi'],
  islamabad: ['isb', 'isl'],
  rawalpindi: ['pindi', 'rwp'],
  faisalabad: ['fsd', 'lyallpur'],
  multan: ['mul'],
  peshawar: ['pesh', 'psh'],
}

const INTENT_WORDS: Record<string, string[]> = {
  top_rated: ['top rated', 'highest rated', 'best', 'top'],
  popular: ['popular', 'trending'],
  cheap: ['cheap', 'affordable', 'budget', 'sasta'],
  luxury: ['luxury', 'premium', '5 star', 'five star'],
  near_me: ['near me', 'nearby', 'close to me'],
  new: ['newest', 'latest', 'new'],
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function tidy(q: string): string {
  return q
    .replace(/\s{2,}/g, ' ')
    // Dangling prepositions left behind ("hall in", "for under").
    .replace(/\b(in|at|for|with|of)\s*$/i, '')
    .replace(/^\s*(in|at|for|with)\b/i, '')
    .replace(/\b(in|at|for)\s+(in|at|for)\b/gi, '$2')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function removePhrase(q: string, phrase: string, withPreposition = false): string {
  const prep = withPreposition ? '(?:\\b(?:in|at|near)\\s+)?' : ''
  const re = new RegExp(`${prep}\\b${escapeRe(phrase).replace(/ /g, '\\s+')}\\b`, 'gi')
  return q.replace(re, ' ')
}

function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0]
    dp[0] = i
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j]
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1))
      prev = tmp
    }
  }
  return dp[b.length]
}

/** Regex source matching a number as people type it: 3000, 3,000, 3k, 3.5k. */
function numberPattern(n: number): string {
  const variants = new Set<string>([String(n), n.toLocaleString('en-US')])
  if (n >= 1000 && n % 100 === 0) variants.add(`${n / 1000}k`)
  return `(?:${[...variants].map(escapeRe).sort((a, b) => b.length - a.length).join('|')})`
}

function removeCity(q: string, city: string): string {
  const lower = city.toLowerCase()
  let out = removePhrase(q, city, true)
  for (const alias of CITY_ALIASES[lower] ?? []) out = removePhrase(out, alias, true)
  if (out !== q) return out
  // Typo ("lahor", "karachii"): drop the closest word.
  return q.replace(/(?:\b(?:in|at|near)\s+)?\b([a-z]{4,})\b/gi, (m, w: string) =>
    w.length >= 4 && levenshtein(w.toLowerCase(), lower) <= 2 ? ' ' : m)
}

export function removeChipFromQuery(q: string, chip: SearchChip): string {
  if (!q.trim()) return ''
  const value = chip.value
  let out = q

  switch (chip.type) {
    case 'city':
      if (value) out = removeCity(out, String(value))
      break
    case 'event_type': {
      const words = EVENT_WORDS[String(value)] ?? []
      for (const w of [...words].sort((a, b) => b.length - a.length)) out = removePhrase(out, w)
      // Category name itself ("Weddings", "Corporate Events").
      if (out === q && chip.label) out = removePhrase(out, chip.label)
      break
    }
    case 'guests': {
      const n = Number(value)
      if (n > 0) {
        out = out.replace(
          new RegExp(`(?:\\bfor\\s+)?\\b${numberPattern(n)}\\s*(?:\\+\\s*)?(?:guests?|people|persons?|pax|log|afrad|members)?\\b`, 'gi'),
          ' ',
        )
      }
      break
    }
    case 'max_price':
    case 'min_price': {
      // "between 2000 and 4000" holds both limits, so it goes as a whole.
      out = out.replace(/\bbetween\s+(?:rs\.?|pkr)?\s*[\d,.]+k?\s*(?:and|to|-)\s*(?:rs\.?|pkr)?\s*[\d,.]+k?(?:\s*(?:per|\/|a)\s*head)?/gi, ' ')
      const n = Number(value)
      if (out === q && n > 0) {
        out = out.replace(
          new RegExp(
            `(?:\\b(?:under|below|less\\s+than|max(?:imum)?|up\\s*to|upto|within|budget(?:\\s+of)?|above|over|more\\s+than|min(?:imum)?|from)\\s+)?` +
            `(?:\\b(?:rs\\.?|pkr)\\s*)?\\b${numberPattern(n)}\\b(?:\\s*(?:rs|pkr|rupees))?(?:\\s*(?:per|\\/|a)\\s*head)?`,
            'gi',
          ),
          ' ',
        )
      }
      // "budget" on its own means the cheap intent, keep it; but "per head" alone is noise.
      out = out.replace(/\b(per|a)\s+head\b/gi, ' ')
      break
    }
    case 'intent': {
      const words = INTENT_WORDS[String(value)] ?? []
      for (const w of words) out = removePhrase(out, w)
      break
    }
    case 'term':
    case 'amenity': {
      const text = String(value ?? chip.label).replace(/[“”"]/g, '')
      out = removePhrase(out, text)
      // Multi-word amenity typed partially ("parking" for "Free Parking").
      if (out === q) for (const w of text.split(/\s+/).filter(w => w.length > 2)) out = removePhrase(out, w)
      break
    }
  }
  return tidy(out)
}
