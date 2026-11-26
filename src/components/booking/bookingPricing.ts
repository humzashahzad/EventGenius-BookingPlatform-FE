/**
 * Booking price estimate — same maths as the API (App\Services\BookingPricing):
 * price per head × guests, plus paid add-ons, plus 5% tax on both.
 */
export interface Pricing { base: number; amenities: number; tax: number; total: number }

const round2 = (n: number) => Math.round(n * 100) / 100

export function calcPricing(pricePerHead: number, guests: number, addOnPrices: number[]): Pricing {
  const base = round2((pricePerHead ?? 0) * (guests || 1))
  const amenities = round2(addOnPrices.reduce((sum, p) => sum + Number(p || 0), 0))
  const tax = round2((base + amenities) * 0.05)
  return { base, amenities, tax, total: round2(base + amenities + tax) }
}

export function fmt(n: number) {
  return n.toLocaleString('en-PK', { maximumFractionDigits: 2 })
}
