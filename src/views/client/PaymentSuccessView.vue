<template>
  <div class="max-w-xl mx-auto">
    <section class="card overflow-hidden" aria-live="polite">
      <div class="px-6 pt-8 pb-6 text-center">
        <!-- PAID (confirmed by PayFast ITN) -->
        <template v-if="state === 'paid'">
          <span class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success-soft text-success-text border border-success-line">
            <AppIcon icon="check" class="w-7 h-7" />
          </span>
          <h1 class="mt-4 page-title">Payment successful</h1>
          <p class="mt-1 text-sm text-ink-muted">PayFast has confirmed your payment. Your booking is now paid and your date is secured.</p>
        </template>

        <!-- CANCELLED / FAILED -->
        <template v-else-if="state === 'cancelled' || state === 'failed'">
          <span class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-danger-soft text-danger-text border border-danger-line">
            <AppIcon icon="x" class="w-7 h-7" />
          </span>
          <h1 class="mt-4 page-title">Payment {{ state === 'failed' ? 'failed' : 'cancelled' }}</h1>
          <p class="mt-1 text-sm text-ink-muted">PayFast did not complete this payment. No money was taken. You can try again from your booking.</p>
        </template>

        <!-- ERROR loading status -->
        <template v-else-if="state === 'error'">
          <span class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-warning-soft text-warning-text border border-warning-line">
            <AppIcon icon="alert-triangle" class="w-7 h-7" />
          </span>
          <h1 class="mt-4 page-title">Couldn't check payment status</h1>
          <p class="mt-1 text-sm text-ink-muted">{{ errorMessage }}</p>
        </template>

        <!-- PROCESSING: waiting for PayFast ITN -->
        <template v-else>
          <span class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft border border-brand-muted">
            <span class="spinner-border !w-7 !h-7 text-brand-text" aria-hidden="true"></span>
          </span>
          <h1 class="mt-4 page-title">Confirming your payment</h1>
          <p class="mt-1 text-sm text-ink-muted">Waiting for PayFast to confirm your payment&hellip;</p>
          <p class="mt-2 text-xs text-ink-muted">
            <template v-if="!timedOut">This usually takes a few seconds. Please keep this page open.</template>
            <template v-else>Confirmation is taking longer than usual. You'll get a notification once PayFast confirms &mdash; you can also check again below.</template>
          </p>
        </template>
      </div>

      <!-- Transaction Details (real data only) -->
      <div v-if="status?.payment" class="px-6 pb-6">
        <h2 class="eyebrow mb-2">Transaction details</h2>
        <dl class="panel-sunken px-4 py-1 text-sm">
          <div class="dl-row"><dt>Booking</dt><dd class="ref">{{ status.booking_number }}</dd></div>
          <div v-if="status.payment.reference" class="dl-row"><dt>Payment ID</dt><dd class="ref min-w-0 break-all">{{ status.payment.reference }}</dd></div>
          <div class="dl-row"><dt>Amount</dt><dd>{{ formatPKR(status.payment.amount) }}</dd></div>
          <div v-if="status.payment.gateway_amount" class="dl-row"><dt>Charged</dt><dd>R{{ Number(status.payment.gateway_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</dd></div>
          <div class="dl-row"><dt>Status</dt><dd :class="state === 'paid' ? '!text-success-text' : ''" class="capitalize">{{ statusLabel }}</dd></div>
          <div v-if="state === 'paid' && status.payment.transaction_id" class="dl-row"><dt>Transaction</dt><dd class="ref min-w-0 break-all">{{ status.payment.transaction_id }}</dd></div>
          <div v-if="status.paid_at" class="dl-row"><dt>Paid at</dt><dd>{{ formatDate(status.paid_at) }}</dd></div>
        </dl>
      </div>

      <!-- Actions -->
      <div class="card-footer flex-wrap !justify-center">
        <button v-if="state === 'processing' && timedOut" type="button" class="btn-secondary" @click="restartPolling"><AppIcon icon="refresh" class="w-4 h-4" />Check again</button>
        <button v-if="state === 'error'" type="button" class="btn-secondary" @click="restartPolling"><AppIcon icon="refresh" class="w-4 h-4" />Retry</button>
        <RouterLink v-if="bookingId" :to="`/customer/bookings/${bookingId}`" class="btn-primary">View booking</RouterLink>
        <RouterLink to="/customer/bookings" class="btn-ghost">All bookings</RouterLink>
      </div>
    </section>

    <!-- Sandbox Notice -->
    <p class="mt-4 flex items-start justify-center gap-2 text-xs text-ink-muted text-center">
      <AppIcon icon="info-circle" class="w-4 h-4 shrink-0" />
      <span><strong class="font-semibold text-ink-secondary">Sandbox mode:</strong> test payment via the PayFast sandbox. No real money is charged.</span>
    </p>
  </div>
</template>

<script setup lang="ts">
import { formatPKR } from '@/lib/format'
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
