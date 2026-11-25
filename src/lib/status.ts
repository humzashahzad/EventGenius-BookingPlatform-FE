/**
 * Status → badge class / label helpers. Each status has its own colour
 * (see the `.badge-<status>` classes in src/assets/main.css):
 *
 *   pending   amber    confirmed  emerald   completed  blue
 *   cancelled stone    rejected   red
 *   paid      teal     unpaid     orange    refunded   violet
 *
 * Usage: <span :class="statusBadgeClass(b.status)">{{ statusLabel(b.status) }}</span>
 */

const STATUS_CLASS: Record<string, string> = {
  // bookings
  pending: 'badge-pending',
  confirmed: 'badge-confirmed',
  completed: 'badge-completed',
  cancelled: 'badge-cancelled',
  canceled: 'badge-cancelled',
  rejected: 'badge-rejected',
  // payments
  paid: 'badge-paid',
  unpaid: 'badge-unpaid',
  partially_paid: 'badge-unpaid',
  failed: 'badge-rejected',
  refunded: 'badge-refunded',
  // stores / venues / users
  approved: 'badge-confirmed',
  active: 'badge-confirmed',
  inactive: 'badge-cancelled',
  suspended: 'badge-rejected',
  under_maintenance: 'badge-pending',
}

export function statusBadgeClass(status?: string | null): string {
  if (!status) return 'badge-dot'
  return STATUS_CLASS[status.toLowerCase()] ?? 'badge-dot'
}

export function statusLabel(status?: string | null): string {
  if (!status) return '—'
  const s = status.replace(/_/g, ' ')
  return s.charAt(0).toUpperCase() + s.slice(1)
}
