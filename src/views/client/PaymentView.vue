<template>
  <div class="content-container">
    <!-- Back -->
    <div class="mb-6">
      <RouterLink :to="`/customer/bookings/${route.params.id}`" class="btn-ghost inline-flex items-center gap-1.5 text-sm">
        <AppIcon icon="chevron-left" class="w-4 h-4" />
        Back to Booking
      </RouterLink>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-16">
      <div class="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
    </div>

    <!-- Already paid / not payable -->
    <div v-else-if="booking && booking.payment_status === 'paid'" class="card max-w-xl mx-auto p-8 text-center">
      <div class="w-14 h-14 mx-auto rounded-2xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 flex items-center justify-center mb-4">
        <AppIcon icon="circle-check" class="w-7 h-7" />
      </div>
      <h2 class="text-lg font-semibold text-warm-900 dark:text-white">This booking is already paid</h2>
      <p class="text-sm text-warm-500 mt-1">Booking {{ booking.booking_number }} — nothing more to pay.</p>
      <RouterLink :to="`/customer/bookings/${route.params.id}`" class="btn-primary btn-sm mt-5">View booking</RouterLink>
    </div>
    <div v-else-if="booking && booking.status !== 'confirmed'" class="card max-w-xl mx-auto p-8 text-center">
      <div class="w-14 h-14 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center mb-4">
        <AppIcon icon="clock" class="w-7 h-7" />
      </div>
      <h2 class="text-lg font-semibold text-warm-900 dark:text-white">{{ booking.status === 'pending' ? 'Waiting for the venue to confirm' : 'This booking can’t be paid' }}</h2>
      <p class="text-sm text-warm-500 mt-1">{{ booking.status === 'pending' ? 'You can pay as soon as the venue owner confirms your request. We’ll notify you.' : `The booking is ${booking.status}.` }}</p>
      <RouterLink :to="`/customer/bookings/${route.params.id}`" class="btn-outline btn-sm mt-5">Back to booking</RouterLink>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="card border-coral/30 bg-coral/5 max-w-xl mx-auto">
      <div class="p-6">
        <h2 class="text-lg font-semibold text-coral mb-2">Payment Error</h2>
        <p class="text-sm text-coral/80 mb-4">{{ error }}</p>
        <RouterLink :to="`/customer/bookings/${route.params.id}`" class="btn-outline inline-flex items-center gap-1.5 text-sm">
          <AppIcon icon="chevron-left" class="w-4 h-4" />
          Back to Booking
        </RouterLink>
      </div>
    </div>

    <!-- Payment Form -->
    <div v-else-if="paymentData" class="max-w-xl mx-auto">
      <!-- Sandbox Banner -->
      <div v-if="paymentData.sandbox" class="flex items-center gap-3 px-5 py-3 rounded-2xl bg-accent/10 border border-accent/20 mb-6">
        <AppIcon icon="alert-triangle" class="w-5 h-5 text-accent flex-shrink-0" />
        <span class="font-medium text-sm text-amber-800 dark:text-amber-300">SANDBOX MODE &mdash; This is a test payment. No real money will be charged.</span>
      </div>

      <!-- Booking Summary -->
      <div class="card mb-6">
        <div class="px-5 py-4 border-b border-warm-100 dark:border-warm-700">
          <h2 class="text-sm font-semibold text-warm-800 dark:text-warm-100">Payment Summary</h2>
        </div>
        <div class="p-5 text-sm">
          <div class="flex justify-between mb-3"><span class="text-warm-500">Booking</span><span class="font-mono text-warm-800 dark:text-warm-100">{{ booking?.booking_number }}</span></div>
          <div class="flex justify-between mb-3"><span class="text-warm-500">Event</span><span class="text-warm-800 dark:text-warm-100">{{ booking?.event_name }}</span></div>
          <div class="flex justify-between mb-3"><span class="text-warm-500">Venue</span><span class="text-warm-800 dark:text-warm-100">{{ booking?.venue?.name }}</span></div>
          <div class="flex justify-between mb-4"><span class="text-warm-500">Date</span><span class="text-warm-800 dark:text-warm-100">{{ formatDate(booking?.event_date) }}</span></div>
          <div class="border-t border-warm-100 dark:border-warm-700 pt-4">
            <div class="flex justify-between mb-2"><span class="text-warm-500">Base Price</span><span class="text-warm-800 dark:text-warm-100">{{ formatPKR(booking?.base_price) }}</span></div>
            <div v-if="booking?.amenities_price > 0" class="flex justify-between mb-2"><span class="text-warm-500">Amenities</span><span class="text-warm-800 dark:text-warm-100">{{ formatPKR(booking?.amenities_price) }}</span></div>
            <div class="flex justify-between mb-2"><span class="text-warm-500">Tax (5%)</span><span class="text-warm-800 dark:text-warm-100">{{ formatPKR(booking?.tax_amount) }}</span></div>
          </div>
          <div class="border-t border-warm-100 dark:border-warm-700 pt-4 mt-2">
            <div class="flex justify-between font-bold text-lg">
              <span class="text-warm-900 dark:text-white">Total Amount</span>
              <span class="text-primary-600">PKR {{ formatPkr(amount.app_amount) }}</span>
            </div>
            <div class="flex items-center justify-between gap-3 mt-3 px-4 py-3 rounded-xl bg-warm-50 dark:bg-warm-800/60 border border-warm-100 dark:border-warm-700">
              <span class="text-warm-500 text-xs leading-relaxed">
                Charged as <strong class="text-warm-800 dark:text-warm-100">R{{ formatZar(amount.gateway_amount) }}</strong>
                in PayFast{{ paymentData.sandbox ? ' sandbox' : '' }} at rate 1 PKR = {{ amount.exchange_rate }} ZAR
              </span>
              <span class="font-semibold text-warm-800 dark:text-warm-100 whitespace-nowrap">R{{ formatZar(amount.gateway_amount) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- PayFast Hidden Form -->
      <form ref="payFastForm" :action="paymentData.action_url" method="POST">
        <input v-for="(value, key) in paymentData.fields" :key="String(key)" type="hidden" :name="String(key)" :value="value" />
        <button type="submit" class="btn-primary w-full py-3.5 text-base font-semibold">
          Pay Now &mdash; PKR {{ formatPkr(amount.app_amount) }} (R{{ formatZar(amount.gateway_amount) }})
        </button>
      </form>

      <!-- Sandbox Debug -->
      <div v-if="paymentData.sandbox" class="card mt-6">
        <div class="p-5">
          <h3 class="font-semibold text-warm-500 text-xs uppercase tracking-wider mb-3">Sandbox Details (Debug)</h3>
          <div class="text-xs font-mono text-warm-500 space-y-1">
            <p>Payment ID: {{ paymentData.fields.m_payment_id }}</p>
            <p>Merchant ID: {{ paymentData.fields.merchant_id }}</p>
            <p>Amount: {{ paymentData.fields.amount }} ZAR (PKR {{ amount.app_amount }} &times; {{ amount.exchange_rate }})</p>
            <p>Signature: {{ paymentData.fields.signature }}</p>
            <p>Action URL: {{ paymentData.action_url }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatPKR } from '@/lib/format'
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import api from '@/lib/axios'
import AppIcon from '@/components/ui/AppIcon.vue'

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
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

onMounted(loadPaymentData)
</script>
