<template>
  <div class="content-container">
    <div class="card max-w-xl mx-auto text-center py-10">
      <div class="px-6">
        <!-- PAID (confirmed by PayFast ITN) -->
        <template v-if="state === 'paid'">
          <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <AppIcon icon="check" class="w-10 h-10 text-primary-600" />
          </div>
          <h1 class="text-2xl font-bold text-warm-900 tracking-tight mb-2">Payment Successful!</h1>
          <p class="text-sm text-warm-500 mb-8">PayFast has confirmed your payment. Your booking is now paid.</p>
        </template>

        <!-- CANCELLED / FAILED -->
        <template v-else-if="state === 'cancelled' || state === 'failed'">
          <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-coral/10 flex items-center justify-center">
            <AppIcon icon="x" class="w-10 h-10 text-coral" />
          </div>
          <h1 class="text-2xl font-bold text-warm-900 tracking-tight mb-2">Payment {{ state === 'failed' ? 'Failed' : 'Cancelled' }}</h1>
          <p class="text-sm text-warm-500 mb-8">PayFast did not complete this payment. You can try again from your booking.</p>
        </template>

        <!-- ERROR loading status -->
        <template v-else-if="state === 'error'">
          <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-coral/10 flex items-center justify-center">
            <AppIcon icon="alert-triangle" class="w-10 h-10 text-coral" />
          </div>
          <h1 class="text-2xl font-bold text-warm-900 tracking-tight mb-2">Couldn't check payment status</h1>
          <p class="text-sm text-warm-500 mb-8">{{ errorMessage }}</p>
        </template>

        <!-- PROCESSING: waiting for PayFast ITN -->
        <template v-else>
          <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-accent/10 flex items-center justify-center">
            <div class="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          </div>
          <h1 class="text-2xl font-bold text-warm-900 tracking-tight mb-2">Processing Payment</h1>
          <p class="text-sm text-warm-500 mb-2">Waiting for PayFast to confirm your payment&hellip;</p>
          <p class="text-xs text-warm-400 mb-8">
            <template v-if="!timedOut">This usually takes a few seconds. Please keep this page open.</template>
            <template v-else>Confirmation is taking longer than usual. You'll get a notification once PayFast confirms &mdash; you can also check again below.</template>
          </p>
        </template>

        <!-- Transaction Details (real data only) -->
        <div v-if="status?.payment" class="card bg-warm-50 dark:bg-warm-800 max-w-sm mx-auto mb-6">
          <div class="p-5 text-left">
            <h3 class="font-semibold text-warm-500 text-xs uppercase tracking-wider mb-4">Transaction Details</h3>
            <div class="space-y-2.5 text-sm">
              <div class="flex justify-between"><span class="text-warm-500">Booking</span><span class="font-mono text-warm-800">{{ status.booking_number }}</span></div>
              <div v-if="status.payment.reference" class="flex justify-between gap-3"><span class="text-warm-500">Payment ID</span><span class="font-mono text-xs text-warm-800 truncate">{{ status.payment.reference }}</span></div>
              <div class="flex justify-between"><span class="text-warm-500">Amount</span><span class="font-semibold text-warm-800">PKR {{ Number(status.payment.amount).toLocaleString() }}</span></div>
              <div v-if="status.payment.gateway_amount" class="flex justify-between"><span class="text-warm-500">Charged</span><span class="text-warm-800">R{{ Number(status.payment.gateway_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span></div>
              <div class="flex justify-between"><span class="text-warm-500">Status</span><span :class="state === 'paid' ? 'text-primary-600' : 'text-warm-700'" class="font-medium capitalize">{{ statusLabel }}</span></div>
              <div v-if="state === 'paid' && status.payment.transaction_id" class="flex justify-between gap-3"><span class="text-warm-500">Transaction</span><span class="font-mono text-xs text-warm-800 truncate">{{ status.payment.transaction_id }}</span></div>
              <div v-if="status.paid_at" class="flex justify-between"><span class="text-warm-500">Paid At</span><span class="text-warm-800">{{ formatDate(status.paid_at) }}</span></div>
            </div>
          </div>
        </div>

        <!-- Sandbox Notice -->
        <div class="flex items-center gap-2 justify-center px-5 py-3 rounded-2xl bg-accent/10 border border-accent/20 max-w-sm mx-auto mb-6">
          <AppIcon icon="alert-triangle" class="w-4 h-4 text-accent flex-shrink-0" />
          <span class="text-xs text-amber-800 dark:text-amber-300"><strong>Sandbox Mode:</strong> Test payment via PayFast sandbox. No real money is charged.</span>
        </div>

        <!-- Actions -->
        <div class="flex flex-wrap gap-3 justify-center">
          <button v-if="state === 'processing' && timedOut" @click="restartPolling" class="btn-outline">Check again</button>
          <button v-if="state === 'error'" @click="restartPolling" class="btn-outline">Retry</button>
          <RouterLink v-if="bookingId" :to="`/customer/bookings/${bookingId}`" class="btn-primary">View Booking</RouterLink>
          <RouterLink to="/customer/bookings" class="btn-outline">All Bookings</RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import api from '@/lib/axios'
import AppIcon from '@/components/ui/AppIcon.vue'

type PayState = 'processing' | 'paid' | 'cancelled' | 'failed' | 'refunded' | 'unpaid' | 'error'

const POLL_INTERVAL_MS = 3000
const MAX_POLLS = 60 // ~3 minutes

const route = useRoute()
const bookingId = (route.query.booking_id as string) || ''
const mPaymentId = (route.query.m_payment_id as string) || ''

const status = ref<any>(null)
const state = ref<PayState>('processing')
const errorMessage = ref('')
const timedOut = ref(false)
let polls = 0
let timer: ReturnType<typeof setTimeout> | null = null

const statusLabel = computed(() => {
  if (state.value === 'paid') return 'Paid'
  if (state.value === 'processing' || state.value === 'unpaid') return 'Awaiting PayFast confirmation'
  return state.value
})

async function fetchStatus() {
  if (!bookingId) {
    state.value = 'error'
    errorMessage.value = 'No booking reference was returned from PayFast.'
    return
  }
  try {
    const { data } = await api.get(`/client/bookings/${bookingId}/payment-status`, {
      params: mPaymentId ? { m_payment_id: mPaymentId } : {},
    })
    status.value = data.data
    // Returning to the success URL is NOT proof of payment: only the ITN-backed state counts.
    const s = data.data.state as PayState
    state.value = s === 'unpaid' ? 'processing' : s
  } catch (err: any) {
    state.value = 'error'
    errorMessage.value = err.response?.data?.message || 'Please try again in a moment.'
    return
  }

  if (state.value === 'processing') {
    polls++
    if (polls >= MAX_POLLS) {
      timedOut.value = true
      return
    }
    timer = setTimeout(fetchStatus, POLL_INTERVAL_MS)
  }
}

function restartPolling() {
  if (timer) clearTimeout(timer)
  polls = 0
  timedOut.value = false
  state.value = 'processing'
  fetchStatus()
}

function formatDate(d: string) {
  if (!d) return ''
  return new Date(d).toLocaleString('en-PK', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

onMounted(fetchStatus)
onBeforeUnmount(() => { if (timer) clearTimeout(timer) })
</script>
