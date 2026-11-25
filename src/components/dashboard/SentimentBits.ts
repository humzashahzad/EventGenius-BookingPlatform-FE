/** Shared helpers for AI review-insight panels (store + admin). */
export interface Aspect { name: string; label: string; positive_pct: number; negative_pct?: number; mentions: number }
export interface Distribution { positive?: number; neutral?: number; negative?: number }

export function sentimentLabel(label?: string | null, score?: number | null): string {
  if (label) return label === 'positive' ? 'Mostly positive' : label === 'negative' ? 'Mostly negative' : 'Mixed'
  if (score == null) return 'Not enough data'
  return score >= 63 ? 'Mostly positive' : score < 38 ? 'Mostly negative' : 'Mixed'
}

export function sentimentTone(label?: string | null, score?: number | null): 'success' | 'warning' | 'danger' | 'neutral' {
  if (label === 'positive' || (label == null && score != null && score >= 63)) return 'success'
  if (label === 'negative' || (label == null && score != null && score < 38)) return 'danger'
  if (label === 'neutral' || label === 'mixed' || score != null) return 'warning'
  return 'neutral'
}

export function humanFlag(f: string): string {
  return ({
    spam: 'Spam / promo',
    possible_duplicate: 'Possible duplicate',
    all_caps: 'All caps',
    very_short: 'Very short',
    rating_text_mismatch: 'Rating ≠ text',
  } as Record<string, string>)[f] ?? f.replace(/_/g, ' ')
}
