/**
 * Format a venue's price for display.
 * Uses price_per_head as the single pricing model.
 */
export function formatPrice(venue: { price_per_head?: number | null }): string {
  const price = venue.price_per_head
  return price ? Number(price).toLocaleString() : 'Contact'
}
