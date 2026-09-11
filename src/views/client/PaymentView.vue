<template>
  <!--
    ╔══════════════════════════════════════════════════╗
    ║  PayFast Payment Page — SANDBOX MODE             ║
    ║  Final Year Project Demo Only                    ║
    ╚══════════════════════════════════════════════════╝

    Flow:
    1. Loads booking details from API
    2. Fetches PayFast form fields + signature from backend
    3. Renders a hidden form pointing to PayFast sandbox URL
    4. User clicks "Pay Now" → form submits to PayFast
    5. PayFast redirects to success or cancel URL
  -->
  <div class="p-6 max-w-2xl">
    <!-- Back Link -->
    <div class="flex items-center gap-3 mb-6">
      <RouterLink :to="`/client/bookings/${route.params.id}`" class="text-gray-500 hover:text-gray-700">
        ← Back to Booking
      </RouterLink>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12 text-gray-400">Loading payment details...</div>

    <!-- Error State -->
    <div v-else-if="error" class="card border-red-200 bg-red-50 p-6">
      <h2 class="text-lg font-semibold text-red-700 mb-2">Payment Error</h2>
      <p class="text-red-600 text-sm">{{ error }}</p>
      <RouterLink :to="`/client/bookings/${route.params.id}`" class="inline-block mt-4 text-sm text-primary-600 hover:underline">
        ← Back to Booking
      </RouterLink>
    </div>

    <!-- Payment Form -->
    <div v-else-if="paymentData">
      <!-- Sandbox Banner -->
      <div v-if="paymentData.sandbox" class="bg-amber-50 border border-amber-300 rounded-lg px-4 py-3 mb-6">
        <p class="text-amber-800 text-sm font-medium">
          ⚠ SANDBOX MODE — This is a test payment. No real money will be charged.
        </p>
      </div>

      <!-- Booking Summary -->
      <div class="card mb-6">
        <h1 class="text-xl font-bold text-gray-900 mb-4">Payment Summary</h1>

        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-500">Booking</span>
            <span class="font-mono text-gray-700">{{ booking?.booking_number }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Event</span>
            <span class="text-gray-700">{{ booking?.event_name }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Venue</span>
            <span class="text-gray-700">{{ booking?.venue?.name }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Date</span>
            <span class="text-gray-700">{{ formatDate(booking?.event_date) }}</span>
          </div>
          <div class="border-t pt-2 mt-2">
            <div class="flex justify-between">
              <span class="text-gray-500">Base Price</span>
              <span class="text-gray-700">PKR {{ Number(booking?.base_price).toLocaleString() }}</span>
            </div>
            <div v-if="booking?.amenities_price > 0" class="flex justify-between">
              <span class="text-gray-500">Amenities</span>
              <span class="text-gray-700">PKR {{ Number(booking?.amenities_price).toLocaleString() }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Tax (5%)</span>
              <span class="text-gray-700">PKR {{ Number(booking?.tax_amount).toLocaleString() }}</span>
            </div>
          </div>
          <div class="border-t pt-2 flex justify-between font-semibold text-lg">
            <span class="text-gray-900">Total Amount</span>
            <span class="text-primary-700">PKR {{ Number(booking?.total_amount).toLocaleString() }}</span>
          </div>
        </div>
      </div>

      <!-- PayFast Hidden Form -->
      <!-- This form POSTs directly to PayFast's sandbox URL with all required fields -->
      <form
        ref="payFastForm"
        :action="paymentData.action_url"
        method="POST"
      >
        <!-- Hidden fields: all PayFast parameters including signature -->
        <input
          v-for="(value, key) in paymentData.fields"
          :key="key"
          type="hidden"
          :name="key"
          :value="value"
        />

        <!-- Pay Now Button -->
        <button
          type="submit"
          class="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-lg"
        >
          Pay Now — PKR {{ Number(booking?.total_amount).toLocaleString() }}
        </button>
      </form>

      <!-- Payment Details (for demo/debug) -->
      <div v-if="paymentData.sandbox" class="mt-6 card bg-gray-50 border-gray-200">
        <h3 class="text-sm font-semibold text-gray-600 mb-2">Sandbox Details (Debug)</h3>
        <div class="text-xs text-gray-500 space-y-1 font-mono">
          <p>Payment ID: {{ paymentData.fields.m_payment_id }}</p>
          <p>Merchant ID: {{ paymentData.fields.merchant_id }}</p>
          <p>Amount: {{ paymentData.fields.amount }}</p>
          <p>Signature: {{ paymentData.fields.signature }}</p>
          <p>Action URL: {{ paymentData.action_url }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import api from '@/lib/axios'

// ── Route params ─────────────────────────────────────────────────────────────
const route = useRoute()

// ── Reactive state ───────────────────────────────────────────────────────────
const loading = ref(true)
const error = ref('')
const booking = ref<any>(null)
const paymentData = ref<any>(null)
const payFastForm = ref<HTMLFormElement | null>(null)

/**
 * Load booking details and PayFast payment form data from the backend.
 */
async function loadPaymentData() {
  loading.value = true
  error.value = ''
  try {
    // Step 1: Fetch booking details for display
    const bookingRes = await api.get(`/client/bookings/${route.params.id}`)
    booking.value = bookingRes.data.data

    // Step 2: Fetch PayFast form fields + signature
    const paymentRes = await api.get(`/client/bookings/${route.params.id}/payment-data`)
    paymentData.value = paymentRes.data.data
  } catch (err: any) {
    // Show error message from API or generic error
    error.value = err.response?.data?.message || 'Failed to load payment details. Please try again.'
  } finally {
    loading.value = false
  }
}

/**
 * Format a date string for display.
 */
function formatDate(d: string) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-PK', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// ── Load data on mount ───────────────────────────────────────────────────────
onMounted(loadPaymentData)
</script>
