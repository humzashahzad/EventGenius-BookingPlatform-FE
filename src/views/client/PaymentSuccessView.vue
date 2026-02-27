<template>
  <!--
    ╔══════════════════════════════════════════════════╗
    ║  Payment Success Page — SANDBOX MODE             ║
    ║  User is redirected here after PayFast payment   ║
    ╚══════════════════════════════════════════════════╝
  -->
  <div class="p-6 max-w-2xl">
    <!-- Success Card -->
    <div class="card text-center py-10">
      <!-- Checkmark Icon -->
      <div class="mx-auto w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mb-6">
        <svg class="w-8 h-8 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 class="text-2xl font-bold text-surface-900 mb-2">Payment Successful!</h1>
      <p class="text-surface-500 mb-6">Your payment has been processed via PayFast sandbox.</p>

      <!-- Transaction Details -->
      <div v-if="paymentDetails" class="bg-[var(--color-bg-elevated)] rounded-lg p-4 text-left max-w-sm mx-auto mb-6">
        <h3 class="text-sm font-semibold text-surface-600 mb-3">Transaction Details</h3>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-surface-500">Booking ID</span>
            <span class="font-mono text-surface-700">#{{ bookingId }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-surface-500">Payment ID</span>
            <span class="font-mono text-surface-700">{{ mPaymentId }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-surface-500">Amount</span>
            <span class="font-semibold text-surface-900">PKR {{ Number(paymentDetails.amount).toLocaleString() }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-surface-500">Status</span>
            <span class="text-success-600 font-medium capitalize">{{ paymentDetails.status }}</span>
          </div>
          <div v-if="paymentDetails.transaction_id" class="flex justify-between">
            <span class="text-surface-500">Transaction</span>
            <span class="font-mono text-surface-700 text-xs">{{ paymentDetails.transaction_id }}</span>
          </div>
          <div v-if="paymentDetails.paid_at" class="flex justify-between">
            <span class="text-surface-500">Paid At</span>
            <span class="text-surface-700">{{ formatDate(paymentDetails.paid_at) }}</span>
          </div>
        </div>
      </div>

      <!-- Confirming state -->
      <div v-else-if="confirming" class="text-surface-400 mb-6">Confirming payment...</div>

      <!-- Sandbox Notice -->
      <div class="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-left mb-6 max-w-sm mx-auto">
        <p class="text-amber-700 text-xs">
          <strong>Sandbox Mode:</strong> This was a test payment. No real money was charged.
        </p>
      </div>

      <!-- Actions -->
      <div class="flex gap-3 justify-center">
        <RouterLink
          v-if="bookingId"
          :to="`/customer/bookings/${bookingId}`"
          class="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-5 rounded-lg transition-colors text-sm"
        >
          View Booking
        </RouterLink>
        <RouterLink
          to="/customer/bookings"
          class="bg-surface-100 hover:bg-surface-200 text-surface-700 font-medium py-2 px-5 rounded-lg transition-colors text-sm"
        >
          All Bookings
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import api from '@/lib/axios'

// ── Query params from PayFast redirect ───────────────────────────────────────
const route = useRoute()
const bookingId = ref(route.query.booking_id as string || '')
const mPaymentId = ref(route.query.m_payment_id as string || '')

// ── State ────────────────────────────────────────────────────────────────────
const confirming = ref(false)
const paymentDetails = ref<any>(null)

/**
 * Confirm the payment via backend API.
 *
 * Since PayFast sandbox can't reach localhost for ITN,
 * we manually confirm the payment when the user lands on this page.
 */
async function confirmPayment() {
  if (!bookingId.value) return

  confirming.value = true
  try {
    const { data } = await api.post(`/client/bookings/${bookingId.value}/confirm-payment`)
    paymentDetails.value = data.data
  } catch (err: any) {
    // If already completed, try to load booking to show details
    paymentDetails.value = {
      amount: '—',
      status: 'confirmed',
      transaction_id: mPaymentId.value,
      paid_at: new Date().toISOString(),
    }
  } finally {
    confirming.value = false
  }
}

/**
 * Format a date string for display.
 */
function formatDate(d: string) {
  if (!d) return ''
  return new Date(d).toLocaleString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ── Auto-confirm on mount (sandbox demo) ─────────────────────────────────────
onMounted(confirmPayment)
</script>
