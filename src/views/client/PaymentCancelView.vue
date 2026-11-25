<template>
  <div class="max-w-xl mx-auto">
    <section class="card overflow-hidden">
      <div class="px-6 pt-8 pb-6 text-center">
        <span class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-neutral-soft text-neutral-text border border-neutral-line">
          <AppIcon icon="x" class="w-7 h-7" />
        </span>
        <h1 class="mt-4 page-title">Payment cancelled</h1>
        <p class="mt-1 text-sm text-ink-muted">
          You left PayFast before paying. No money was taken and your booking is still unpaid.
          You can pay any time from the booking page.
        </p>

        <div v-if="bookingId" class="mt-5 inline-flex items-center gap-2 panel-sunken px-3 py-1.5 text-sm text-ink-secondary">
          Booking <span class="ref text-ink">#{{ bookingId }}</span>
        </div>

        <p v-if="recording" class="mt-4 text-xs text-ink-muted" role="status">Updating payment record&hellip;</p>
        <p v-else-if="recordError" class="mt-4 form-error" role="alert">{{ recordError }}</p>
      </div>

      <div class="card-footer flex-wrap !justify-center">
        <RouterLink v-if="bookingId" :to="`/customer/bookings/${bookingId}`" class="btn-primary">Back to booking</RouterLink>
        <RouterLink to="/customer/bookings" class="btn-ghost">All bookings</RouterLink>
      </div>
    </section>
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
