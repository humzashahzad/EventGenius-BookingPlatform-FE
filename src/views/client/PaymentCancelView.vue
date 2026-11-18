<template>
  <div class="content-container">
    <div class="card max-w-xl mx-auto text-center py-10">
      <div class="px-6">
        <!-- X Icon -->
        <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-coral/10 flex items-center justify-center">
          <AppIcon icon="x" class="w-10 h-10 text-coral" />
        </div>

        <h1 class="text-2xl font-bold text-warm-900 tracking-tight mb-2 dark:text-white">Payment Cancelled</h1>
        <p class="text-sm text-warm-500 mb-8">
          Your payment was cancelled. No charges were made and your booking remains unpaid.<br />
          You can try again from your booking details page.
        </p>

        <!-- Booking Reference -->
        <div v-if="bookingId" class="card bg-warm-50 dark:bg-warm-800 max-w-sm mx-auto mb-8">
          <div class="p-4">
            <p class="text-sm text-warm-500">
              Booking ID: <span class="font-mono font-medium text-warm-700 dark:text-warm-200">#{{ bookingId }}</span>
            </p>
          </div>
        </div>

        <p v-if="recording" class="text-xs text-warm-400 mb-6">Updating payment record&hellip;</p>
        <p v-else-if="recordError" class="text-xs text-coral mb-6">{{ recordError }}</p>

        <!-- Actions -->
        <div class="flex gap-3 justify-center">
          <RouterLink v-if="bookingId" :to="`/customer/bookings/${bookingId}`" class="btn-primary">Back to Booking</RouterLink>
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
const mPaymentId = (route.query.m_payment_id as string) || ''
const recording = ref(false)
const recordError = ref('')

// Tell the API the client abandoned checkout: flips their own *pending* payment to cancelled.
async function recordCancellation() {
  if (!bookingId.value) return
  recording.value = true
  try {
    await api.post(`/client/bookings/${bookingId.value}/payment-cancelled`, mPaymentId ? { m_payment_id: mPaymentId } : {})
  } catch (err: any) {
    recordError.value = err.response?.data?.message || 'Could not update the payment record.'
  } finally {
    recording.value = false
  }
}

onMounted(recordCancellation)
</script>
