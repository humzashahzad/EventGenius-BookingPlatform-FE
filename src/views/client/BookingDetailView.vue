<template>
  <div class="space-y-6">
    <RouterLink to="/customer/bookings" class="btn-ghost btn-sm -ml-2">
      <AppIcon icon="chevron-left" class="w-4 h-4" />
      All bookings
    </RouterLink>

    <!-- Loading -->
    <div v-if="loading" class="space-y-6" aria-busy="true" aria-label="Loading booking">
      <div class="space-y-2"><div class="skeleton h-4 w-32"></div><div class="skeleton h-8 w-2/3"></div><div class="skeleton h-4 w-1/2"></div></div>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6"><div class="card h-40 skeleton"></div><div class="card h-56 skeleton"></div></div>
        <div class="space-y-6"><div class="card h-72 skeleton"></div><div class="card h-48 skeleton"></div></div>
      </div>
    </div>

    <!-- Error / not found -->
    <div v-else-if="!booking" class="card">
      <div class="empty-state">
        <div class="empty-state-icon"><AppIcon icon="alert-circle" class="w-5 h-5" /></div>
        <p class="empty-state-title">{{ notFound ? 'Booking not found' : "We couldn't load this booking" }}</p>
        <p class="empty-state-desc">{{ notFound ? "This booking may have been removed or doesn't belong to your account." : loadError }}</p>
        <div class="empty-state-actions">
          <button v-if="!notFound" type="button" class="btn-secondary" @click="res.retry()"><AppIcon icon="refresh" class="w-4 h-4" />Try again</button>
          <RouterLink to="/customer/bookings" class="btn-primary">Back to bookings</RouterLink>
        </div>
      </div>
    </div>

    <template v-else>
      <!-- Header -->
      <header class="page-header !mb-0">
        <div class="min-w-0">
          <p class="ref text-ink-muted mb-1">{{ booking.booking_number }}</p>
          <h1 class="page-title break-words">{{ booking.event_name }}</h1>
          <p class="page-subtitle">
            {{ booking.venue?.name }} · {{ formatEventDate(booking.event_date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) }}
          </p>
          <div class="mt-3 flex flex-wrap items-center gap-2">
            <span :class="statusBadgeClass(booking.status)">{{ statusLabel(booking.status) }}</span>
            <span v-if="paymentBadge(booking)" :class="paymentBadge(booking)!.cls">{{ paymentBadge(booking)!.label }}</span>
            <span v-if="isUpcomingBooking(booking)" class="badge-dot">{{ countdownLabel(booking.event_date) }}</span>
          </div>
        </div>
        <div class="page-header-actions">
          <RouterLink v-if="ownerUserId" :to="{ path: '/customer/messages', query: { with: ownerUserId } }" class="btn-secondary">
            <AppIcon icon="message" class="w-4 h-4" /> Message venue
          </RouterLink>
          <RouterLink v-if="canPay" :to="`/customer/bookings/${booking.id}/pay`" class="btn-primary">
            <AppIcon icon="credit-card" class="w-4 h-4" /> Pay {{ formatPKR(booking.total_amount) }}
          </RouterLink>
        </div>
      </header>

      <!-- Status message -->
      <div v-if="banner" :class="banner.cls" role="status">
        <AppIcon :icon="banner.icon" class="w-5 h-5 shrink-0" />
        <div class="min-w-0">
          <p class="alert-title">{{ banner.title }}</p>
          <p class="text-sm break-words">{{ banner.text }}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <!-- Main column -->
        <div class="lg:col-span-2 space-y-6 min-w-0">
          <!-- Timeline -->
          <section class="card" aria-labelledby="timeline-title">
            <div class="card-header"><h2 id="timeline-title" class="card-title">Booking progress</h2></div>
            <ol class="card-body">
              <li v-for="(step, i) in timeline" :key="step.key" class="relative flex gap-3 pb-5 last:pb-0">
                <span
                  v-if="i < timeline.length - 1"
                  class="absolute left-[15px] top-8 bottom-0 w-px"
                  :class="step.state === 'done' ? 'bg-brand' : 'bg-line'"
                  aria-hidden="true"
                ></span>
                <span
                  class="relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full border"
                  :class="stepClass(step.state)"
                >
                  <AppIcon :icon="stepIcon(step)" class="w-4 h-4" />
                </span>
                <div class="min-w-0 pt-1">
                  <p class="text-sm font-semibold" :class="step.state === 'todo' ? 'text-ink-muted' : 'text-ink'">
                    {{ step.label }}
                    <span class="sr-only">({{ stepStateText[step.state] }})</span>
                  </p>
                  <p v-if="step.when" class="text-xs text-ink-muted">{{ step.when }}</p>
                  <p v-if="step.note" class="mt-1 text-sm text-ink-secondary break-words">{{ step.note }}</p>
                </div>
              </li>
            </ol>
          </section>

          <!-- Event details -->
          <section class="card" aria-labelledby="event-title">
            <div class="card-header"><h2 id="event-title" class="card-title">Event details</h2></div>
            <div class="card-body grid grid-cols-1 sm:grid-cols-2 gap-x-8">
              <dl>
                <div class="dl-row"><dt>Event</dt><dd class="break-words min-w-0">{{ booking.event_name }}</dd></div>
                <div class="dl-row"><dt>Type</dt><dd>{{ eventTypeLabel(booking.event_type) || '—' }}</dd></div>
                <div class="dl-row"><dt>Guests</dt><dd>{{ guestsOf(booking) ?? '—' }}</dd></div>
              </dl>
              <dl>
                <div class="dl-row"><dt>Date</dt><dd>{{ formatEventDate(booking.event_date) }}</dd></div>
                <div class="dl-row"><dt>Time</dt><dd>{{ formatTimeRange(booking.start_time, booking.end_time) || '—' }}</dd></div>
                <div class="dl-row"><dt>Duration</dt><dd>{{ booking.duration_hours ? `${booking.duration_hours} hours` : '—' }}</dd></div>
              </dl>
            </div>
            <div v-if="booking.special_requirements" class="card-footer !block">
              <p class="text-xs font-semibold text-ink-muted mb-1">Special requirements</p>
              <p class="text-sm text-ink-secondary whitespace-pre-line break-words">{{ booking.special_requirements }}</p>
            </div>
          </section>

          <!-- Review -->
          <ReviewForm :booking-id="booking.id" :venue-name="booking.venue?.name" @loaded="onReviewLoaded" />

          <!-- Cancel -->
          <section v-if="canCancel" class="card" aria-labelledby="cancel-title">
            <div class="card-body">
              <template v-if="!showCancel">
                <div class="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div class="flex-1">
                    <h2 id="cancel-title" class="text-sm font-semibold text-ink">Need to cancel?</h2>
                    <p class="text-sm text-ink-muted">You can cancel while the booking is unpaid. The venue will be notified.</p>
                  </div>
                  <button type="button" class="btn-danger-ghost border border-danger-line" @click="openCancel">
                    <AppIcon icon="x" class="w-4 h-4" /> Cancel booking
                  </button>
                </div>
              </template>
              <form v-else class="space-y-4" @submit.prevent="cancelBooking">
                <div>
                  <h2 id="cancel-title" class="text-base font-semibold text-ink">Cancel this booking?</h2>
                  <p class="text-sm text-ink-muted">This can't be undone. The date will be released for other customers.</p>
                </div>
                <FormField id="cancel-reason" label="Reason" optional :count="cancelReason.length" :maxlength="500">
                  <TextareaInput ref="cancelReasonRef" v-model="cancelReason" :rows="2" :maxlength="500" auto-grow placeholder="For example: we changed the date" />
                </FormField>
                <p v-if="cancelError" class="form-error" role="alert">{{ cancelError }}</p>
                <div class="flex flex-wrap gap-2">
                  <button type="submit" :disabled="cancelling" class="btn-danger">
                    <AppIcon v-if="cancelling" icon="loader" class="w-4 h-4 animate-spin" />
                    {{ cancelling ? 'Cancelling…' : 'Yes, cancel booking' }}
                  </button>
                  <button type="button" class="btn-ghost" @click="showCancel = false">Keep booking</button>
                </div>
              </form>
            </div>
          </section>
        </div>

        <!-- Side column -->
        <aside class="space-y-6 min-w-0">
          <!-- Venue -->
          <section class="card overflow-hidden" aria-labelledby="venue-title">
            <img :src="venueImage(booking)" :alt="booking.venue?.name || 'Venue photo'" class="w-full aspect-[16/9] object-cover bg-surface-sunken" @error="onImageError" />
            <div class="card-body space-y-3">
              <div>
                <h2 id="venue-title" class="text-base font-semibold text-ink break-words">{{ booking.venue?.name }}</h2>
                <p v-if="venueAddress" class="mt-0.5 text-sm text-ink-muted flex items-start gap-1.5">
                  <AppIcon icon="map-pin" class="w-4 h-4 mt-0.5 shrink-0" />{{ venueAddress }}
                </p>
              </div>
              <dl v-if="booking.store" class="text-sm">
                <div class="dl-row"><dt>Hosted by</dt><dd class="break-words min-w-0">{{ booking.store.name }}</dd></div>
                <div v-if="booking.store.phone" class="dl-row"><dt>Phone</dt><dd><a :href="`tel:${booking.store.phone}`" class="link">{{ booking.store.phone }}</a></dd></div>
                <div v-if="booking.store.email" class="dl-row"><dt>Email</dt><dd class="min-w-0 break-all"><a :href="`mailto:${booking.store.email}`" class="link">{{ booking.store.email }}</a></dd></div>
              </dl>
              <div class="flex flex-wrap gap-2 pt-1">
                <RouterLink v-if="ownerUserId" :to="{ path: '/customer/messages', query: { with: ownerUserId } }" class="btn-secondary btn-sm flex-1">
                  <AppIcon icon="message" class="w-4 h-4" /> Message
                </RouterLink>
                <RouterLink v-if="booking.venue?.id" :to="`/venues/${booking.venue.id}`" class="btn-ghost btn-sm flex-1">
                  View venue <AppIcon icon="external-link" class="w-4 h-4" />
                </RouterLink>
              </div>
            </div>
          </section>

          <!-- Price -->
          <section class="card" aria-labelledby="price-title">
            <div class="card-header"><h2 id="price-title" class="card-title">Price breakdown</h2></div>
            <div class="card-body">
              <dl>
                <div class="dl-row"><dt>Venue</dt><dd>{{ formatPKR(booking.base_price) }}</dd></div>
                <div v-if="Number(booking.amenities_price) > 0" class="dl-row"><dt>Amenities</dt><dd>{{ formatPKR(booking.amenities_price) }}</dd></div>
                <div v-if="Number(booking.discount_amount) > 0" class="dl-row"><dt>Discount</dt><dd class="!text-success-text">− {{ formatPKR(booking.discount_amount) }}</dd></div>
                <div class="dl-row"><dt>Tax (5%)</dt><dd>{{ formatPKR(booking.tax_amount) }}</dd></div>
                <div class="dl-row !border-t !border-line pt-3 mt-1">
                  <dt class="!text-ink font-semibold">Total</dt>
                  <dd class="text-base !font-bold">{{ formatPKR(booking.total_amount) }}</dd>
                </div>
              </dl>
            </div>
          </section>

          <!-- Payment -->
          <section class="card" aria-labelledby="payment-title">
            <div class="card-header">
              <h2 id="payment-title" class="card-title">Payment</h2>
              <span v-if="paymentBadge(booking)" :class="paymentBadge(booking)!.cls">{{ paymentBadge(booking)!.label }}</span>
            </div>
            <div class="card-body">
              <template v-if="booking.payment_status === 'paid' || booking.payment_status === 'refunded'">
                <dl class="text-sm">
                  <div class="dl-row"><dt>Amount</dt><dd>{{ formatPKR(booking.payment?.amount ?? booking.total_amount) }}</dd></div>
                  <div v-if="booking.payment?.gateway_amount" class="dl-row"><dt>Charged</dt><dd>R{{ formatZar(booking.payment.gateway_amount) }} via PayFast</dd></div>
                  <div v-if="booking.paid_at" class="dl-row"><dt>Paid on</dt><dd>{{ formatDateTime(booking.paid_at) }}</dd></div>
                  <div v-if="booking.payment?.refunded_at" class="dl-row"><dt>Refunded</dt><dd>{{ formatDateTime(booking.payment.refunded_at) }}</dd></div>
                  <div v-if="booking.payment?.transaction_id" class="dl-row"><dt>Transaction</dt><dd class="ref min-w-0 break-all">{{ booking.payment.transaction_id }}</dd></div>
                </dl>
                <div class="mt-4 grid grid-cols-2 gap-2"><RouterLink :to="`/customer/bookings/${booking.id}/invoice`" class="btn-secondary"><AppIcon icon="receipt" class="w-4 h-4" />Invoice</RouterLink><InvoiceDownloadButton :booking-id="booking.id" :booking-number="booking.booking_number" label="PDF" busy-label="PDF" /></div>
              </template>
              <template v-else-if="canPay">
                <p class="text-sm text-ink-secondary">The venue confirmed your booking. Pay securely with PayFast to lock in the date.</p>
                <RouterLink :to="`/customer/bookings/${booking.id}/pay`" class="btn-primary btn-block mt-4">
                  <AppIcon icon="credit-card" class="w-4 h-4" /> Pay {{ formatPKR(booking.total_amount) }}
                </RouterLink>
                <p class="mt-2 text-xs text-ink-muted flex items-center gap-1.5"><AppIcon icon="shield-check" class="w-3.5 h-3.5" />Card details are entered on PayFast, not here.</p>
              </template>
              <p v-else-if="booking.status === 'pending'" class="text-sm text-ink-secondary">You can pay once the venue confirms your request. We'll notify you.</p>
              <p v-else class="text-sm text-ink-muted">No payment is due for this booking.</p>
            </div>
          </section>
        </aside>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { FormField, TextareaInput } from '@/components/forms'
import { ref, computed, nextTick, onMounted, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { toast } from 'vue-sonner'
import api from '@/lib/axios'
import { useCachedResource, cacheGet } from '@/composables/usePageCache'
import { useLiveRefresh } from '@/composables/useLiveRefresh'
import AppIcon from '@/components/ui/AppIcon.vue'
import ReviewForm from '@/components/reviews/ReviewForm.vue'
import InvoiceDownloadButton from '@/components/invoice/InvoiceDownloadButton.vue'
import { formatTimeRange, formatPKR, formatAddress } from '@/lib/format'
import { statusBadgeClass, statusLabel } from '@/lib/status'
import {
  venueImage, onImageError, formatEventDate, countdownLabel, isUpcomingBooking,
  paymentBadge, guestsOf, eventTypeLabel,
} from '@/components/client/bookingUtils'

const route = useRoute()
// Shown at once when this booking was opened before, then refreshed quietly.
const res = useCachedResource<any>(() => `client:booking:${route.params.id}`, async () => {
  const { data } = await api.get(`/client/bookings/${route.params.id}`)
  return data.data
})
const booking = computed(() => res.data.value)
const loading = res.loading
const loadError = res.error
const notFound = computed(() => !res.data.value && (res.errorStatus.value === 404 || res.errorStatus.value === 403))
const showCancel = ref(false)
const cancelReason = ref('')
const cancelError = ref('')
const cancelling = ref(false)
const cancelReasonRef = ref<{ focus: () => void } | null>(null)

// Same rules as before: pay when confirmed + unpaid; cancel while pending/confirmed and not paid.
const canPay = computed(() => booking.value?.status === 'confirmed' && booking.value?.payment_status === 'unpaid')
const canCancel = computed(() => ['pending', 'confirmed'].includes(booking.value?.status) && booking.value?.payment_status !== 'paid')
const ownerUserId = computed(() => booking.value?.store?.user_id ?? null)
const venueAddress = computed(() => formatAddress(booking.value?.venue))

type StepState = 'done' | 'current' | 'todo' | 'failed'
interface Step { key: string; label: string; state: StepState; when?: string; note?: string }
const stepStateText: Record<StepState, string> = { done: 'done', current: 'in progress', todo: 'not yet', failed: 'stopped' }

const timeline = computed<Step[]>(() => {
  const b = booking.value
  if (!b) return []
  const steps: Step[] = [{ key: 'requested', label: 'Booking requested', state: 'done', when: formatDateTime(b.created_at) }]

  if (b.status === 'rejected') {
    steps.push({ key: 'rejected', label: 'Declined by the venue', state: 'failed', when: formatDateTime(b.updated_at), note: b.rejection_reason || 'No reason was given.' })
    return steps
  }

  const confirmed = !!b.confirmed_at || ['confirmed', 'completed'].includes(b.status)
  const paid = ['paid', 'refunded'].includes(b.payment_status)

  if (b.status === 'cancelled') {
    if (confirmed) steps.push({ key: 'confirmed', label: 'Confirmed by the venue', state: 'done', when: formatDateTime(b.confirmed_at) })
    if (paid) steps.push({ key: 'paid', label: 'Payment received', state: 'done', when: formatDateTime(b.paid_at) })
    steps.push({ key: 'cancelled', label: 'Booking cancelled', state: 'failed', when: formatDateTime(b.cancelled_at || b.updated_at), note: b.cancellation_reason || undefined })
    if (b.payment_status === 'refunded') steps.push({ key: 'refunded', label: 'Payment refunded', state: 'done', when: formatDateTime(b.payment?.refunded_at) })
    return steps
  }

  steps.push({
    key: 'confirmed', label: confirmed ? 'Confirmed by the venue' : 'Waiting for the venue to confirm',
    state: confirmed ? 'done' : 'current', when: confirmed ? formatDateTime(b.confirmed_at) : 'Venues usually reply within a day',
  })
  steps.push({
    key: 'paid', label: paid ? 'Payment received' : 'Payment',
    state: paid ? 'done' : confirmed ? 'current' : 'todo',
    when: paid ? formatDateTime(b.paid_at) : confirmed ? `${formatPKR(b.total_amount)} due` : 'After the venue confirms',
  })
  const completed = b.status === 'completed'
  steps.push({
    key: 'event', label: completed ? 'Event completed' : 'Event day',
    state: completed ? 'done' : paid ? 'current' : 'todo',
    when: `${formatEventDate(b.event_date)}${!completed && isUpcomingBooking(b) ? ` · ${countdownLabel(b.event_date)}` : ''}`,
  })
  return steps
})

function stepClass(s: StepState) {
  return {
    done: 'bg-brand-strong border-brand-strong text-white',
    current: 'bg-brand-soft border-brand text-brand-text',
    todo: 'bg-surface border-line text-ink-muted',
    failed: 'bg-danger-soft border-danger-line text-danger-text',
  }[s]
}
function stepIcon(step: Step) {
  if (step.state === 'done') return step.key === 'refunded' ? 'arrow-back-up' : 'check'
  if (step.state === 'failed') return step.key === 'rejected' ? 'x' : 'ban'
  if (step.key === 'paid') return 'credit-card'
  if (step.key === 'event') return 'calendar-event'
  return 'clock'
}

const banner = computed(() => {
  const b = booking.value
  if (!b) return null
  if (b.status === 'rejected') return { cls: 'alert-danger', icon: 'x', title: 'The venue declined this request', text: b.rejection_reason || 'No reason was given. You can look for another date or venue.' }
  if (b.status === 'cancelled') return { cls: 'alert-info', icon: 'ban', title: b.payment_status === 'refunded' ? 'Cancelled and refunded' : 'This booking was cancelled', text: b.cancellation_reason ? `Reason: ${b.cancellation_reason}` : 'The date has been released.' }
  if (b.status === 'pending') return { cls: 'alert-warning', icon: 'clock', title: 'Waiting for the venue to confirm', text: "We'll notify you as soon as the venue replies. You can pay after it confirms." }
  if (canPay.value) return { cls: 'alert-warning', icon: 'credit-card', title: 'Payment due', text: `The venue confirmed your booking. Pay ${formatPKR(b.total_amount)} to secure your date.` }
  return null
})

function formatDateTime(d?: string | null) {
  if (!d) return ''
  return new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
}
function formatZar(n: number | string) {
  return Number(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// The venue confirms or declines, or a payment lands: update this page quietly.
useLiveRefresh(['booking', 'payment'], (_type, data) => {
  if (!data?.booking_id || String(data.booking_id) === String(route.params.id)) void res.refresh()
})

// Opening another booking from a notification reuses this page.
watch(() => route.params.id, (id, old) => {
  if (id && id !== old && route.name === 'customer-booking-detail') {
    showCancel.value = false
    cancelReason.value = ''
    cancelError.value = ''
    void res.load()
  }
})

function onReviewLoaded(s: { eligible: boolean; review: any }) {
  if (route.hash === '#review' && (s.eligible || s.review)) {
    nextTick(() => document.getElementById('review')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }
}

function openCancel() {
  showCancel.value = true
  cancelError.value = ''
  nextTick(() => cancelReasonRef.value?.focus())
}

async function cancelBooking() {
  const b = booking.value
  if (!b || cancelling.value) return
  cancelling.value = true
  cancelError.value = ''
  const id = route.params.id
  const reason = cancelReason.value
  // Show the result straight away; put it back if the server says no.
  const before = { status: b.status, cancellation_reason: b.cancellation_reason, cancelled_at: b.cancelled_at }
  const listRow = (cacheGet<any[]>('client:bookings') || []).find(x => String(x.id) === String(b.id))
  const listBefore = listRow ? listRow.status : null
  b.status = 'cancelled'
  b.cancellation_reason = reason || b.cancellation_reason
  b.cancelled_at = new Date().toISOString()
  if (listRow) listRow.status = 'cancelled'
  showCancel.value = false
  try {
    await api.patch(`/client/bookings/${id}/cancel`, { reason })
    toast.success('Booking cancelled.')
    void res.refresh()
  } catch (e: any) {
    Object.assign(b, before)
    if (listRow && listBefore) listRow.status = listBefore
    cancelError.value = e?.response?.data?.message || 'Could not cancel this booking. Please try again.'
    showCancel.value = true
    toast.error(cancelError.value)
  } finally { cancelling.value = false }
}

onMounted(() => { void res.load() })

</script>
