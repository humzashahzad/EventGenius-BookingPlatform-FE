<template>
  <div class="space-y-6">
    <RouterLink to="/shop/bookings" class="btn-ghost btn-sm -ml-2">
      <AppIcon icon="chevron-left" class="w-4 h-4" />Back to bookings
    </RouterLink>

    <div v-if="loading" class="space-y-4" aria-busy="true">
      <div class="skeleton h-28 w-full" />
      <div class="grid lg:grid-cols-3 gap-6"><div class="skeleton h-72 lg:col-span-2" /><div class="skeleton h-72" /></div>
    </div>

    <div v-else-if="error" class="card">
      <div class="empty-state">
        <div class="empty-state-icon"><AppIcon icon="alert-circle" class="w-5 h-5" /></div>
        <p class="empty-state-title">{{ error }}</p>
        <p class="empty-state-desc">It may have been removed, or belongs to another store.</p>
        <div class="empty-state-actions">
          <button class="btn-secondary" @click="res.load()">Try again</button>
          <RouterLink to="/shop/bookings" class="btn-primary">Back to bookings</RouterLink>
        </div>
      </div>
    </div>

    <template v-else-if="booking">
      <!-- Header -->
      <header class="card p-5">
        <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div class="min-w-0">
            <p class="ref text-ink-muted">{{ booking.booking_number }}</p>
            <h1 class="page-title mt-1 break-words">{{ booking.event_name }}</h1>
            <div class="flex flex-wrap items-center gap-2 mt-2">
              <span :class="statusBadgeClass(booking.status)"><AppIcon v-if="acting" icon="loader" class="w-3 h-3 animate-spin" />{{ statusLabel(booking.status) }}</span>
              <span v-if="booking.payment_status === 'paid'" class="badge-paid">Paid</span>
              <span v-else-if="booking.payment_status === 'refunded'" class="badge-refunded">Refunded</span>
              <span v-else-if="booking.status === 'confirmed'" class="badge-unpaid">Awaiting payment</span>
              <span class="text-meta">Requested {{ formatDate(booking.created_at) }}</span>
            </div>
          </div>
          <div class="flex flex-wrap gap-2 shrink-0">
            <RouterLink :to="{ path: '/shop/messages', query: { with: booking.client_id } }" class="btn-secondary">
              <AppIcon icon="message" class="w-4 h-4" />Message
            </RouterLink>
            <template v-if="booking.status === 'pending'">
              <button class="btn-secondary" :disabled="acting" @click="openReject">
                <AppIcon icon="x" class="w-4 h-4" />Reject
              </button>
              <button class="btn-primary" :disabled="acting" :aria-busy="actions.isPending(bookingKey, 'confirm')" @click="confirmBooking">
                <AppIcon :icon="actions.isPending(bookingKey, 'confirm') ? 'loader' : 'check'" :class="actions.isPending(bookingKey, 'confirm') ? 'w-4 h-4 animate-spin' : 'w-4 h-4'" />Confirm booking
              </button>
            </template>
          </div>
        </div>
        <div v-if="booking.status === 'pending'" class="alert-warning mt-4" role="status">
          <AppIcon icon="clock" class="w-5 h-5 shrink-0" />
          <div><p class="alert-title">Waiting for your answer</p><p>Confirm to let the customer pay, or reject with a reason.</p></div>
        </div>
        <div v-if="booking.status === 'rejected' && booking.rejection_reason" class="alert-danger mt-4">
          <AppIcon icon="x" class="w-5 h-5 shrink-0" />
          <div><p class="alert-title">Rejection reason</p><p>{{ booking.rejection_reason }}</p></div>
        </div>
        <div v-if="booking.status === 'cancelled' && booking.cancellation_reason" class="alert-info mt-4">
          <AppIcon icon="info" class="w-5 h-5 shrink-0" />
          <div><p class="alert-title">Cancellation reason</p><p>{{ booking.cancellation_reason }}</p></div>
        </div>
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6 min-w-0">
          <!-- Event -->
          <section class="card">
            <div class="card-header"><h2 class="card-title">Event</h2></div>
            <div class="card-body">
              <div class="flex gap-4 items-start mb-5">
                <img
                  v-if="venueImage"
                  :src="venueImage"
                  :alt="booking.venue?.name"
                  class="w-24 h-[72px] sm:w-32 sm:h-24 rounded-lg object-cover shrink-0 bg-surface-sunken"
                  loading="lazy"
                />
                <div class="min-w-0">
                  <p class="eyebrow">Venue</p>
                  <p class="font-medium text-ink">{{ booking.venue?.name }}</p>
                  <p v-if="booking.venue?.address || booking.venue?.city" class="text-sm text-ink-muted">{{ formatAddress(booking.venue) }}</p>
                  <p v-if="booking.venue?.capacity_max" class="text-xs text-ink-muted mt-1">Capacity {{ booking.venue.capacity_min }}–{{ booking.venue.capacity_max }} guests</p>
                </div>
              </div>
              <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                <div class="dl-row"><dt>Date</dt><dd>{{ formatDate(booking.event_date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) }}</dd></div>
                <div class="dl-row"><dt>Time</dt><dd>{{ formatTimeRange(booking.start_time, booking.end_time) }}</dd></div>
                <div class="dl-row"><dt>Duration</dt><dd>{{ booking.duration_hours }} h</dd></div>
                <div class="dl-row"><dt>Guests</dt><dd>{{ Number(booking.expected_guests || 0).toLocaleString('en-PK') }}</dd></div>
                <div class="dl-row"><dt>Event type</dt><dd>{{ humanize(booking.event_type) || '—' }}</dd></div>
                <div class="dl-row"><dt>Days to event</dt><dd>{{ daysToEvent }}</dd></div>
              </dl>
              <div v-if="booking.special_requirements" class="mt-5">
                <p class="form-label">Special requirements</p>
                <p class="panel-sunken p-4 text-sm text-ink-secondary whitespace-pre-line">{{ booking.special_requirements }}</p>
              </div>
            </div>
          </section>

          <!-- Pricing -->
          <section class="card">
            <div class="card-header"><h2 class="card-title">Price breakdown</h2></div>
            <div class="card-body">
              <dl>
                <div class="dl-row"><dt>Base ({{ booking.expected_guests }} guests)</dt><dd>{{ formatPKR(booking.base_price) }}</dd></div>
                <div v-if="Number(booking.amenities_price) > 0" class="dl-row"><dt>Amenities</dt><dd>{{ formatPKR(booking.amenities_price) }}</dd></div>
                <div v-if="Number(booking.discount_amount) > 0" class="dl-row"><dt>Discount</dt><dd class="!text-success-text">− {{ formatPKR(booking.discount_amount) }}</dd></div>
                <div class="dl-row"><dt>Tax</dt><dd>{{ formatPKR(booking.tax_amount) }}</dd></div>
              </dl>
              <div class="flex items-baseline justify-between gap-4 pt-3 mt-1 border-t border-line">
                <span class="font-semibold text-ink">Total</span>
                <span class="text-xl font-display font-bold text-ink num">{{ formatPKR(booking.total_amount) }}</span>
              </div>
            </div>
          </section>

          <!-- Payment -->
          <section class="card">
            <div class="card-header">
              <h2 class="card-title">Payment</h2>
              <span v-if="booking.payment" :class="statusBadgeClass(paymentStatus(booking.payment.status))">{{ statusLabel(paymentStatus(booking.payment.status)) }}</span>
            </div>
            <div class="card-body">
              <dl v-if="booking.payment">
                <div class="dl-row"><dt>Amount</dt><dd>{{ formatPKR(booking.payment.amount) }}</dd></div>
                <div class="dl-row"><dt>Method</dt><dd>{{ paymentMethod(booking.payment.payment_method) }}</dd></div>
                <div v-if="booking.payment.transaction_id" class="dl-row"><dt>Transaction</dt><dd class="ref break-all">{{ booking.payment.transaction_id }}</dd></div>
                <div v-if="booking.payment.payment_reference" class="dl-row"><dt>Reference</dt><dd class="ref break-all">{{ booking.payment.payment_reference }}</dd></div>
                <div v-if="booking.payment.paid_at" class="dl-row"><dt>Paid on</dt><dd>{{ formatDateTime(booking.payment.paid_at) }}</dd></div>
                <div v-if="booking.payment.refunded_at" class="dl-row"><dt>Refunded on</dt><dd>{{ formatDateTime(booking.payment.refunded_at) }}</dd></div>
              </dl>
              <div v-else class="flex items-start gap-3 text-sm text-ink-secondary">
                <span class="icon-chip icon-chip-sm tone-neutral"><AppIcon icon="credit-card" class="w-4 h-4" /></span>
                <p v-if="booking.status === 'confirmed'">No payment yet. The customer has been asked to pay online.</p>
                <p v-else-if="booking.status === 'pending'">The customer can pay once you confirm this booking.</p>
                <p v-else>No payment recorded for this booking.</p>
              </div>
            </div>
          </section>
        </div>

        <aside class="space-y-6 min-w-0">
          <!-- Customer -->
          <section class="card">
            <div class="card-header"><h2 class="card-title">Customer</h2></div>
            <div class="card-body">
              <div class="flex items-center gap-3">
                <img v-if="booking.client?.avatar" :src="getStorageUrl(booking.client.avatar)" alt="" class="w-11 h-11 rounded-full object-cover" />
                <span v-else class="avatar w-11 h-11">{{ initials(booking.client?.name) }}</span>
                <div class="min-w-0">
                  <p class="font-medium text-ink truncate">{{ booking.client?.name }}</p>
                  <p v-if="booking.client?.created_at" class="text-xs text-ink-muted">Customer since {{ formatDate(booking.client.created_at, { month: 'short', year: 'numeric' }) }}</p>
                </div>
              </div>
              <ul class="mt-4 space-y-2 text-sm">
                <li v-if="booking.client?.email">
                  <a :href="`mailto:${booking.client.email}`" class="flex items-center gap-2 text-ink-secondary hover:text-brand-text min-w-0">
                    <AppIcon icon="mail" class="w-4 h-4 shrink-0" /><span class="truncate">{{ booking.client.email }}</span>
                  </a>
                </li>
                <li v-if="booking.client?.phone">
                  <a :href="`tel:${booking.client.phone}`" class="flex items-center gap-2 text-ink-secondary hover:text-brand-text">
                    <AppIcon icon="phone" class="w-4 h-4 shrink-0" />{{ booking.client.phone }}
                  </a>
                </li>
              </ul>
            </div>
          </section>

          <!-- Timeline -->
          <section class="card">
            <div class="card-header"><h2 class="card-title">Timeline</h2></div>
            <div class="card-body">
              <ol class="relative">
                <li v-for="(step, i) in timeline" :key="step.key" class="relative pl-8 pb-5 last:pb-0">
                  <span v-if="i < timeline.length - 1" class="absolute left-[11px] top-6 bottom-0 w-px bg-line" aria-hidden="true" />
                  <span
                    class="absolute left-0 top-0.5 w-6 h-6 rounded-full flex items-center justify-center"
                    :class="step.done ? TONE[step.tone] : 'border border-dashed border-line-strong bg-surface text-ink-muted'"
                    aria-hidden="true"
                  >
                    <AppIcon :icon="step.icon" class="w-3.5 h-3.5" />
                  </span>
                  <p class="text-sm font-medium" :class="step.done ? 'text-ink' : 'text-ink-muted'">{{ step.label }}</p>
                  <p class="text-xs text-ink-muted">{{ step.when }}</p>
                </li>
              </ol>
            </div>
          </section>
        </aside>
      </div>
    </template>

    <VuexyModal v-model:visible="showReject" title="Reject booking" width="28rem">
      <FormField id="reject-reason" label="Reason" required :error="rejectError" hint="The customer will see this reason.">
        <TextareaInput v-model="rejectReason" :rows="3" auto-grow placeholder="Let the customer know why…" />
      </FormField>
      <template #footer>
        <div class="flex justify-end gap-2">
          <button class="btn-secondary" @click="showReject = false">Cancel</button>
          <button class="btn-danger" @click="rejectBooking">Reject booking</button>
        </div>
      </template>
    </VuexyModal>
  </div>
</template>

<script setup lang="ts">
import { FormField, TextareaInput } from '@/components/forms'
import { ref, computed, onMounted } from 'vue'
import { useSilentResource } from '@/composables/useSilentList'
import { useRowActions } from '@/composables/useRowActions'
import { useLiveRefresh } from '@/composables/useLiveRefresh'
import { isAboutBooking } from '@/lib/liveData'
import { RouterLink, useRoute } from 'vue-router'
import api from '@/lib/axios'
import { formatDate, formatPKR, formatTimeRange, formatAddress } from '@/lib/format'
import { getStorageUrl } from '@/lib/storageUrl'
import { statusBadgeClass, statusLabel } from '@/lib/status'
import AppIcon from '@/components/ui/AppIcon.vue'
import VuexyModal from '@/components/ui/VuexyModal.vue'
import { humanize, initials } from '@/components/dashboard/metrics'

const route = useRoute()
const bookingKey = String(route.params.id)

// Loads once with a skeleton; after an action or a realtime update it refreshes in place.
const res = useSilentResource<any>(async () => {
  try {
    const { data } = await api.get(`/store/bookings/${route.params.id}`)
    return data.data
  } catch (e: any) {
    throw { response: { data: { message: e?.response?.status === 404 ? 'Booking not found.' : 'Could not load this booking.' } } }
  }
})
const booking = res.data
const loading = res.loading
const error = res.error
const actions = useRowActions()
const acting = computed(() => actions.isPending(bookingKey))
const showReject = ref(false)
const rejectReason = ref('')
const rejectError = ref('')

// Payments, cancellations and changes made elsewhere show up quietly.
useLiveRefresh(['booking', 'payment'], () => { if (!acting.value) res.refresh() }, {
  match: (_t, payload) => (payload?.booking?.id != null ? String(payload.booking.id) === bookingKey : isAboutBooking(payload, bookingKey)),
})

/** Shallow ref: replace the object so the page re-renders with the change. */
function patch(fields: Record<string, any>) {
  if (booking.value) booking.value = { ...booking.value, ...fields }
}

function confirmBooking() {
  const prev = { status: booking.value?.status, confirmed_at: booking.value?.confirmed_at }
  actions.run(bookingKey, {
    apply: () => patch({ status: 'confirmed', confirmed_at: new Date().toISOString() }),
    request: () => api.patch(`/store/bookings/${route.params.id}/confirm`),
    rollback: () => patch(prev),
    success: 'Booking confirmed — the customer can now pay.',
    error: 'Could not confirm this booking.',
    after: () => res.refresh(),
  }, 'confirm')
}

function openReject() {
  rejectReason.value = ''
  rejectError.value = ''
  showReject.value = true
}

function rejectBooking() {
  if (!rejectReason.value.trim()) { rejectError.value = 'Please give a reason.'; return }
  const reason = rejectReason.value.trim()
  const prev = { status: booking.value?.status, rejection_reason: booking.value?.rejection_reason, updated_at: booking.value?.updated_at }
  rejectError.value = ''
  // Close straight away; the page shows the change instantly and rolls back if refused.
  showReject.value = false
  actions.run(bookingKey, {
    apply: () => patch({ status: 'rejected', rejection_reason: reason, updated_at: new Date().toISOString() }),
    request: () => api.patch(`/store/bookings/${route.params.id}/reject`, { reason }),
    rollback: () => patch(prev),
    success: 'Booking rejected.',
    error: 'Could not reject this booking.',
    after: () => res.refresh(),
  }, 'reject')
}

const venueImage = computed(() => {
  const v = booking.value?.venue
  if (!v) return ''
  const img = (v.images || []).find((i: any) => i.is_primary) || (v.images || [])[0]
  if (img?.url) return img.url
  if (img?.path) return getStorageUrl(img.path)
  return v.thumbnail ? getStorageUrl(v.thumbnail) : ''
})

const daysToEvent = computed(() => {
  const d = booking.value?.event_date
  if (!d) return '—'
  const t0 = new Date(); t0.setHours(0, 0, 0, 0)
  const days = Math.round((new Date(String(d).slice(0, 10) + 'T00:00:00').getTime() - t0.getTime()) / 86_400_000)
  if (days === 0) return 'Today'
  return days > 0 ? `In ${days} day${days === 1 ? '' : 's'}` : `${-days} day${days === -1 ? '' : 's'} ago`
})

function formatDateTime(d?: string | null) {
  if (!d) return ''
  return new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
}

function paymentStatus(s?: string) {
  return s === 'completed' ? 'paid' : s || ''
}

function paymentMethod(m?: string) {
  if (!m) return '—'
  if (/pay.?d?_?fast/i.test(m)) return 'PayFast (online)'
  return humanize(m)
}

const TONE: Record<string, string> = { brand: 'tone-brand', success: 'tone-success', warning: 'tone-warning', danger: 'tone-danger', info: 'tone-info', neutral: 'tone-neutral' }

interface Step { key: string; label: string; when: string; done: boolean; icon: string; tone: string }
const timeline = computed<Step[]>(() => {
  const b = booking.value
  if (!b) return []
  const steps: Step[] = [{ key: 'req', label: 'Booking requested', when: formatDateTime(b.created_at), done: true, icon: 'file-text', tone: 'neutral' }]
  if (b.status === 'rejected') {
    steps.push({ key: 'rej', label: 'Rejected', when: formatDateTime(b.updated_at), done: true, icon: 'x', tone: 'danger' })
    return steps
  }
  steps.push(b.confirmed_at
    ? { key: 'conf', label: 'Confirmed by you', when: formatDateTime(b.confirmed_at), done: true, icon: 'check', tone: 'success' }
    : { key: 'conf', label: 'Confirm booking', when: b.status === 'pending' ? 'Waiting for you' : '—', done: false, icon: 'check', tone: 'success' })
  const paidAt = b.payment?.paid_at || b.paid_at
  if (b.status !== 'cancelled' || paidAt) {
    steps.push(paidAt
      ? { key: 'paid', label: 'Payment received', when: formatDateTime(paidAt), done: true, icon: 'wallet', tone: 'info' }
      : { key: 'paid', label: 'Payment', when: b.status === 'confirmed' ? 'Waiting for the customer' : 'After confirmation', done: false, icon: 'wallet', tone: 'info' })
  }
  if (b.status === 'cancelled') {
    steps.push({ key: 'can', label: 'Cancelled', when: formatDateTime(b.cancelled_at || b.updated_at), done: true, icon: 'ban', tone: 'neutral' })
    if (b.payment?.refunded_at || b.payment_status === 'refunded') {
      steps.push({ key: 'ref', label: 'Refunded', when: formatDateTime(b.payment?.refunded_at), done: true, icon: 'refresh', tone: 'info' })
    }
    return steps
  }
  const eventPast = String(b.event_date).slice(0, 10) < new Date().toISOString().slice(0, 10)
  steps.push({ key: 'event', label: 'Event day', when: formatDate(b.event_date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }), done: eventPast || b.status === 'completed', icon: 'calendar-event', tone: 'brand' })
  steps.push({ key: 'done', label: 'Completed', when: b.status === 'completed' ? 'Event finished' : 'After the event', done: b.status === 'completed', icon: 'circle-check', tone: 'success' })
  return steps
})

onMounted(() => res.load())
</script>
