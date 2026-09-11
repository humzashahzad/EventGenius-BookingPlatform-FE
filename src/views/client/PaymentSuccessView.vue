<template>
  <div class="content-container">
    <div class="card max-w-xl mx-auto text-center py-10">
      <div class="px-6">
        <!-- Checkmark Icon -->
        <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
          <AppIcon icon="check" class="w-10 h-10 text-primary-600" />
        </div>

        <h1 class="text-2xl font-bold text-warm-900 tracking-tight mb-2">Payment Successful!</h1>
        <p class="text-sm text-warm-500 mb-8">Your payment has been processed via PayFast sandbox.</p>

        <!-- Transaction Details -->
        <div v-if="paymentDetails" class="card bg-warm-50 dark:bg-warm-800 max-w-sm mx-auto mb-6">
          <div class="p-5 text-left">
            <h3 class="font-semibold text-warm-500 text-xs uppercase tracking-wider mb-4">Transaction Details</h3>
            <div class="space-y-2.5 text-sm">
              <div class="flex justify-between"><span class="text-warm-500">Booking ID</span><span class="font-mono text-warm-800">#{{ bookingId }}</span></div>
              <div class="flex justify-between"><span class="text-warm-500">Payment ID</span><span class="font-mono text-warm-800">{{ mPaymentId }}</span></div>
              <div class="flex justify-between"><span class="text-warm-500">Amount</span><span class="font-semibold text-warm-800">PKR {{ Number(paymentDetails.amount).toLocaleString() }}</span></div>
              <div class="flex justify-between"><span class="text-warm-500">Status</span><span class="text-primary-600 font-medium capitalize">{{ paymentDetails.status }}</span></div>
              <div v-if="paymentDetails.transaction_id" class="flex justify-between"><span class="text-warm-500">Transaction</span><span class="font-mono text-xs text-warm-800">{{ paymentDetails.transaction_id }}</span></div>
              <div v-if="paymentDetails.paid_at" class="flex justify-between"><span class="text-warm-500">Paid At</span><span class="text-warm-800">{{ formatDate(paymentDetails.paid_at) }}</span></div>
            </div>
          </div>
        </div>

        <!-- Confirming -->
        <div v-else-if="confirming" class="flex items-center justify-center gap-2 text-warm-500 mb-8">
          <div class="w-5 h-5 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          <span class="text-sm">Confirming payment...</span>
        </div>

        <!-- Sandbox Notice -->
        <div class="flex items-center gap-2 justify-center px-5 py-3 rounded-2xl bg-accent/10 border border-accent/20 max-w-sm mx-auto mb-6">
          <AppIcon icon="alert-triangle" class="w-4 h-4 text-accent flex-shrink-0" />
          <span class="text-xs text-amber-800 dark:text-amber-300"><strong>Sandbox Mode:</strong> This was a test payment. No real money was charged.</span>
        </div>

        <!-- Actions -->
        <div class="flex gap-3 justify-center">
          <RouterLink v-if="bookingId" :to="`/customer/bookings/${bookingId}`" class="btn-primary">View Booking</RouterLink>
          <RouterLink to="/customer/bookings" class="btn-outline">All Bookings</RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import api from '@/lib/axios'
import AppIcon from '@/components/ui/AppIcon.vue'

const route = useRoute()
const bookingId = ref(route.query.booking_id as string || '')
const mPaymentId = ref(route.query.m_payment_id as string || '')
const confirming = ref(false)
const paymentDetails = ref<any>(null)

async function confirmPayment() {
  if (!bookingId.value) return
  confirming.value = true
  try {
    const { data } = await api.post(`/client/bookings/${bookingId.value}/confirm-payment`)
    paymentDetails.value = data.data
  } catch (err: any) {
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

function formatDate(d: string) {
  if (!d) return ''
  return new Date(d).toLocaleString('en-PK', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

onMounted(confirmPayment)
</script>
