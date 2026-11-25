<template>
  <div class="space-y-6">
    <RouterLink :to="`/customer/bookings/${route.params.id}`" class="btn-ghost btn-sm -ml-2">
      <AppIcon icon="chevron-left" class="w-4 h-4" />
      Back to booking
    </RouterLink>

    <!-- Loading -->
    <div v-if="loading" class="grid grid-cols-1 lg:grid-cols-5 gap-6 max-w-5xl" aria-busy="true" aria-label="Loading payment">
      <div class="lg:col-span-3 card h-80 skeleton"></div>
      <div class="lg:col-span-2 card h-80 skeleton"></div>
    </div>

    <!-- Already paid -->
    <div v-else-if="booking && booking.payment_status === 'paid'" class="card max-w-xl">
      <div class="empty-state">
        <span class="icon-chip tone-success"><AppIcon icon="circle-check" class="w-5 h-5" /></span>
        <p class="empty-state-title mt-3">This booking is already paid</p>
        <p class="empty-state-desc">{{ booking.event_name }} · <span class="ref">{{ booking.booking_number }}</span>. There is nothing more to pay.</p>
        <div class="empty-state-actions"><RouterLink :to="`/customer/bookings/${route.params.id}`" class="btn-primary">View booking</RouterLink></div>
      </div>
    </div>

    <!-- Not payable -->
    <div v-else-if="booking && booking.status !== 'confirmed'" class="card max-w-xl">
      <div class="empty-state">
        <span class="icon-chip" :class="booking.status === 'pending' ? 'tone-warning' : 'tone-neutral'"><AppIcon :icon="booking.status === 'pending' ? 'clock' : 'ban'" class="w-5 h-5" /></span>
        <p class="empty-state-title mt-3">{{ booking.status === 'pending' ? 'Waiting for the venue to confirm' : 'This booking can’t be paid' }}</p>
        <p class="empty-state-desc">{{ booking.status === 'pending' ? 'You can pay as soon as the venue owner confirms your request. We’ll notify you.' : `The booking is ${booking.status}.` }}</p>
        <div class="empty-state-actions"><RouterLink :to="`/customer/bookings/${route.params.id}`" class="btn-secondary">Back to booking</RouterLink></div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="card max-w-xl">
      <div class="empty-state">
        <span class="icon-chip tone-danger"><AppIcon icon="alert-triangle" class="w-5 h-5" /></span>
        <p class="empty-state-title mt-3">We couldn't start the payment</p>
        <p class="empty-state-desc">{{ error }}</p>
        <div class="empty-state-actions">
          <button type="button" class="btn-primary" @click="loadPaymentData"><AppIcon icon="refresh" class="w-4 h-4" />Try again</button>
          <RouterLink :to="`/customer/bookings/${route.params.id}`" class="btn-secondary">Back to booking</RouterLink>
        </div>
      </div>
    </div>

    <!-- Checkout -->
    <template v-else-if="paymentData">
      <header class="page-header !mb-0">
        <div>
          <p class="page-eyebrow">Checkout</p>
          <h1 class="page-title">Pay for your booking</h1>
          <p class="page-subtitle">Review the details, then continue to PayFast to pay securely.</p>
        </div>
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start max-w-5xl">
        <!-- Summary -->
        <section class="card overflow-hidden lg:col-span-3" aria-labelledby="summary-title">
          <div class="flex gap-4 p-5 border-b border-line">
            <img :src="venueImage(booking)" alt="" class="w-20 h-20 sm:w-24 sm:h-24 rounded-lg object-cover shrink-0 bg-surface-sunken" @error="onImageError" />
            <div class="min-w-0">
              <h2 id="summary-title" class="text-base font-semibold text-ink break-words">{{ booking?.event_name }}</h2>
              <p class="text-sm text-ink-secondary break-words">{{ booking?.venue?.name }}<template v-if="booking?.venue?.city"> · {{ booking.venue.city }}</template></p>
              <p class="mt-1 text-sm text-ink-muted">{{ formatDate(booking?.event_date) }}<template v-if="booking?.start_time"> · {{ formatTimeRange(booking.start_time, booking.end_time) }}</template></p>
              <p class="mt-1 ref text-ink-muted">{{ booking?.booking_number }}</p>
            </div>
          </div>
          <div class="card-body">
            <dl>
              <div class="dl-row"><dt>Venue</dt><dd>{{ formatPKR(booking?.base_price) }}</dd></div>
              <div v-if="booking?.amenities_price > 0" class="dl-row"><dt>Amenities</dt><dd>{{ formatPKR(booking?.amenities_price) }}</dd></div>
              <div v-if="booking?.discount_amount > 0" class="dl-row"><dt>Discount</dt><dd class="!text-success-text">− {{ formatPKR(booking?.discount_amount) }}</dd></div>
              <div class="dl-row"><dt>Tax (5%)</dt><dd>{{ formatPKR(booking?.tax_amount) }}</dd></div>
              <div class="dl-row !border-t !border-line pt-3 mt-1">
                <dt class="!text-ink font-semibold">Total</dt>
                <dd class="text-lg !font-bold">PKR {{ formatPkr(amount.app_amount) }}</dd>
              </div>
            </dl>
          </div>
        </section>

        <!-- Pay -->
        <section class="card lg:col-span-2 lg:sticky lg:top-24" aria-labelledby="pay-title">
          <div class="card-body space-y-4">
            <div>
              <h2 id="pay-title" class="text-sm font-medium text-ink-muted">Amount to pay</h2>
              <p class="font-display text-3xl font-bold tracking-tight text-ink num">PKR {{ formatPkr(amount.app_amount) }}</p>
            </div>
            <div class="panel-sunken px-4 py-3 text-sm text-ink-secondary">
              Charged as <strong class="text-ink num">R{{ formatZar(amount.gateway_amount) }}</strong> by PayFast
              <span class="block text-xs text-ink-muted mt-0.5">Rate: 1 PKR = {{ amount.exchange_rate }} ZAR</span>
            </div>

            <!-- PayFast form (fields come from the API unchanged) -->
            <form ref="payFastForm" :action="paymentData.action_url" method="POST">
              <input v-for="(value, key) in paymentData.fields" :key="String(key)" type="hidden" :name="String(key)" :value="value" />
              <button type="submit" class="btn-primary btn-lg btn-block">
                <AppIcon icon="lock" class="w-4 h-4" />
                Continue to PayFast
              </button>
            </form>

            <ul class="space-y-2 text-sm text-ink-secondary">
              <li class="flex gap-2"><AppIcon icon="shield-check" class="w-4 h-4 mt-0.5 shrink-0 text-brand-text" />Card details are entered on PayFast's secure page, never on EventGenius.</li>
              <li class="flex gap-2"><AppIcon icon="circle-check" class="w-4 h-4 mt-0.5 shrink-0 text-brand-text" />Your booking is marked paid as soon as PayFast confirms.</li>
              <li class="flex gap-2"><AppIcon icon="receipt" class="w-4 h-4 mt-0.5 shrink-0 text-brand-text" />You'll get a notification and can see the transaction on your booking.</li>
            </ul>
          </div>
        </section>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { formatPKR, formatTimeRange } from '@/lib/format'
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import api from '@/lib/axios'
import AppIcon from '@/components/ui/AppIcon.vue'
import { venueImage, onImageError, formatEventDate } from '@/components/client/bookingUtils'

const route = useRoute()
const loading = ref(true)
const error = ref('')
const booking = ref<any>(null)
const paymentData = ref<any>(null)
const payFastForm = ref<HTMLFormElement | null>(null)

const amount = computed(() => paymentData.value?.amount ?? {
  app_amount: Number(booking.value?.total_amount ?? 0),
  app_currency: 'PKR',
  gateway_amount: Number(paymentData.value?.fields?.amount ?? 0),
  gateway_currency: 'ZAR',
  exchange_rate: 0,
})

function formatPkr(n: number | string) {
  return Number(n ?? 0).toLocaleString('en-PK', { maximumFractionDigits: 2 })
}

function formatZar(n: number | string) {
  return Number(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

async function loadPaymentData() {
  loading.value = true
  error.value = ''
  try {
    const bookingRes = await api.get(`/client/bookings/${route.params.id}`)
    booking.value = bookingRes.data.data
    // Nothing to pay: show a friendly state instead of the API's 422 message.
    if (booking.value?.payment_status === 'paid' || booking.value?.status !== 'confirmed') return
    const paymentRes = await api.get(`/client/bookings/${route.params.id}/payment-data`)
    paymentData.value = paymentRes.data.data
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load payment details. Please try again.'
  } finally {
    loading.value = false
  }
}

function formatDate(d: string) {
  return formatEventDate(d, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

onMounted(loadPaymentData)
</script>
