<template>
  <div class="content-container">
    <!-- Back -->
    <div class="mb-6">
      <RouterLink to="/customer/bookings" class="inline-flex items-center gap-1.5 text-sm font-medium text-warm-500 dark:text-warm-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
        <AppIcon icon="chevron-left" class="w-4 h-4" />
        Back to Bookings
      </RouterLink>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-6">
      <div class="h-20 rounded-2xl bg-warm-200 dark:bg-warm-800 animate-pulse"></div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div v-for="i in 4" :key="i" class="h-44 rounded-2xl bg-warm-200 dark:bg-warm-800 animate-pulse"></div>
      </div>
    </div>

    <div v-else-if="booking" class="animate-fade-in">
      <!-- Header Card -->
      <div class="card mb-8">
        <div class="p-5 sm:p-6">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                <AppIcon icon="file-text" class="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h1 class="text-xl font-bold text-warm-900 dark:text-warm-50 tracking-tight">Booking Details</h1>
                <p class="font-mono text-xs text-warm-400 dark:text-warm-500 tracking-wide mt-0.5">{{ booking.booking_number }}</p>
              </div>
            </div>
            <span :class="statusClass(booking.status)" class="capitalize text-sm self-start sm:self-center">{{ booking.status }}</span>
          </div>
        </div>
      </div>

      <!-- Payment Completed Banner -->
      <div v-if="booking.payment?.paid_at" class="flex items-center gap-3 px-5 py-4 rounded-2xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800/30 mb-6">
        <div class="w-9 h-9 rounded-xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0">
          <AppIcon icon="circle-check" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <span class="font-semibold text-sm text-primary-700 dark:text-primary-400">Payment Completed</span>
          <p v-if="booking.payment?.transaction_id" class="font-mono text-xs text-primary-600/70 dark:text-primary-400/60 mt-0.5">
            Txn: {{ booking.payment.transaction_id }}
          </p>
        </div>
      </div>

      <!-- Cancellation Reason Banner -->
      <div v-if="booking.cancellation_reason" class="flex items-center gap-3 px-5 py-4 rounded-2xl bg-coral/5 dark:bg-red-900/20 border border-coral/20 dark:border-red-800/30 mb-6">
        <div class="w-9 h-9 rounded-xl bg-coral/10 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
          <AppIcon icon="x" class="w-5 h-5 text-coral dark:text-red-400" />
        </div>
        <div>
          <span class="font-semibold text-sm text-coral dark:text-red-400">Cancelled</span>
          <p class="text-xs text-warm-600 dark:text-warm-400 mt-0.5">{{ booking.cancellation_reason }}</p>
        </div>
      </div>

      <!-- Detail Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <!-- Venue -->
        <div class="card overflow-hidden">
          <div class="flex items-center gap-3 px-5 py-3.5 border-b border-warm-100 dark:border-warm-800">
            <div class="w-7 h-7 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
              <AppIcon icon="map-pin" class="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 class="text-sm font-semibold text-warm-800 dark:text-warm-200">Venue</h2>
          </div>
          <div class="p-5">
            <h3 class="font-semibold text-warm-900 dark:text-warm-50 mb-1">{{ booking.venue?.name }}</h3>
            <p class="text-sm text-warm-500 dark:text-warm-400 flex items-center gap-1.5">
              <AppIcon icon="map-pin" class="w-3.5 h-3.5 flex-shrink-0" />
              {{ booking.venue?.city || 'N/A' }}
            </p>
          </div>
        </div>

        <!-- Event Details -->
        <div class="card overflow-hidden">
          <div class="flex items-center gap-3 px-5 py-3.5 border-b border-warm-100 dark:border-warm-800">
            <div class="w-7 h-7 rounded-lg bg-accent/10 dark:bg-accent/20 flex items-center justify-center">
              <AppIcon icon="star" class="w-3.5 h-3.5 text-accent dark:text-amber-400" />
            </div>
            <h2 class="text-sm font-semibold text-warm-800 dark:text-warm-200">Event Details</h2>
          </div>
          <div class="p-5">
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-sm text-warm-500 dark:text-warm-400">Event Name</span>
                <span class="text-sm font-medium text-warm-800 dark:text-warm-200">{{ booking.event_name }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-warm-500 dark:text-warm-400">Type</span>
                <span class="text-sm font-medium text-warm-800 dark:text-warm-200 capitalize">{{ booking.event_type?.replace('_', ' ') }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-warm-500 dark:text-warm-400">Expected Guests</span>
                <span class="text-sm font-medium text-warm-800 dark:text-warm-200">{{ booking.expected_guests }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Date & Time -->
        <div class="card overflow-hidden">
          <div class="flex items-center gap-3 px-5 py-3.5 border-b border-warm-100 dark:border-warm-800">
            <div class="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
              <AppIcon icon="calendar-event" class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 class="text-sm font-semibold text-warm-800 dark:text-warm-200">Date & Time</h2>
          </div>
          <div class="p-5">
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-sm text-warm-500 dark:text-warm-400">Date</span>
                <span class="text-sm font-medium text-warm-800 dark:text-warm-200">{{ formatDate(booking.event_date) }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-warm-500 dark:text-warm-400">Time</span>
                <span class="text-sm font-medium text-warm-800 dark:text-warm-200">{{ booking.start_time }} &ndash; {{ booking.end_time }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-warm-500 dark:text-warm-400">Duration</span>
                <span class="text-sm font-medium text-warm-800 dark:text-warm-200">{{ booking.duration_hours }} hours</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Pricing -->
        <div class="card overflow-hidden">
          <div class="flex items-center gap-3 px-5 py-3.5 border-b border-warm-100 dark:border-warm-800">
            <div class="w-7 h-7 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
              <AppIcon icon="dollar-sign" class="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 class="text-sm font-semibold text-warm-800 dark:text-warm-200">Pricing</h2>
          </div>
          <div class="p-5">
            <div class="space-y-2.5">
              <div class="flex items-center justify-between text-sm">
                <span class="text-warm-500 dark:text-warm-400">Base Price</span>
                <span class="text-warm-700 dark:text-warm-300">PKR {{ Number(booking.base_price).toLocaleString() }}</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-warm-500 dark:text-warm-400">Tax (5%)</span>
                <span class="text-warm-700 dark:text-warm-300">PKR {{ Number(booking.tax_amount).toLocaleString() }}</span>
              </div>
              <div class="border-t border-warm-100 dark:border-warm-700 pt-2.5 mt-1">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-bold text-warm-900 dark:text-warm-50">Total</span>
                  <span class="text-base font-bold text-primary-600 dark:text-primary-400">PKR {{ Number(booking.total_amount).toLocaleString() }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Special Requirements -->
      <div v-if="booking.special_requirements" class="card mb-6 overflow-hidden">
        <div class="flex items-center gap-3 px-5 py-3.5 border-b border-warm-100 dark:border-warm-800">
          <div class="w-7 h-7 rounded-lg bg-warm-100 dark:bg-warm-700 flex items-center justify-center">
            <AppIcon icon="file-text" class="w-3.5 h-3.5 text-warm-500 dark:text-warm-400" />
          </div>
          <h2 class="text-sm font-semibold text-warm-800 dark:text-warm-200">Special Requirements</h2>
        </div>
        <div class="p-5">
          <p class="text-sm text-warm-600 dark:text-warm-300 leading-relaxed">{{ booking.special_requirements }}</p>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex flex-wrap items-center gap-3">
        <!-- Pay Now -->
        <RouterLink
          v-if="booking.status === 'confirmed' && !booking.payment?.paid_at"
          :to="`/customer/bookings/${booking.id}/pay`"
          class="btn-primary inline-flex items-center gap-2"
        >
          <AppIcon icon="credit-card" class="w-4 h-4" />
          Pay Now &mdash; PKR {{ Number(booking.total_amount).toLocaleString() }}
        </RouterLink>

        <!-- Cancel -->
        <button
          v-if="['pending', 'confirmed'].includes(booking.status)"
          @click="showCancel = true"
          class="btn-outline inline-flex items-center gap-2 border-coral/40 text-coral hover:bg-coral/5 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
        >
          <AppIcon icon="x" class="w-4 h-4" />
          Cancel Booking
        </button>
      </div>

      <!-- Cancel Confirmation Panel -->
      <div v-if="showCancel" class="card border-coral/20 dark:border-red-800/30 mt-4">
        <div class="p-5">
          <h3 class="font-semibold text-warm-900 dark:text-warm-50 mb-1">Cancel this booking?</h3>
          <p class="text-xs text-warm-500 dark:text-warm-400 mb-4">This action cannot be undone. Optionally provide a reason below.</p>
          <textarea v-model="cancelReason" class="form-input w-full mb-4" rows="2" placeholder="Reason for cancellation (optional)"></textarea>
          <div class="flex gap-3">
            <button @click="cancelBooking" :disabled="cancelling" class="btn-danger inline-flex items-center gap-2">
              <AppIcon v-if="cancelling" icon="loader" class="w-4 h-4 animate-spin" />
              {{ cancelling ? 'Cancelling...' : 'Confirm Cancel' }}
            </button>
            <button @click="showCancel = false" class="btn-ghost">Never mind</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Not Found -->
    <div v-else class="flex flex-col items-center justify-center py-20 text-center">
      <div class="w-16 h-16 rounded-2xl bg-warm-100 dark:bg-warm-800 flex items-center justify-center mb-4">
        <AppIcon icon="alert-circle" class="w-8 h-8 text-warm-400 dark:text-warm-500" />
      </div>
      <h3 class="text-lg font-semibold text-warm-700 dark:text-warm-300">Booking not found</h3>
      <p class="text-sm text-warm-500 dark:text-warm-400 mt-1 mb-4">This booking may have been removed or doesn't exist.</p>
      <RouterLink to="/customer/bookings" class="btn-primary text-sm">Back to Bookings</RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import api from '@/lib/axios'
import AppIcon from '@/components/ui/AppIcon.vue'

const route = useRoute()
const router = useRouter()
const booking = ref<any>(null)
const loading = ref(true)
const showCancel = ref(false)
const cancelReason = ref('')
const cancelling = ref(false)

async function load() {
  loading.value = true
  try {
    const { data } = await api.get(`/client/bookings/${route.params.id}`)
    booking.value = data.data
  } finally { loading.value = false }
}

async function cancelBooking() {
  cancelling.value = true
  try {
    await api.patch(`/client/bookings/${route.params.id}/cancel`, { reason: cancelReason.value })
    await load()
    showCancel.value = false
  } finally { cancelling.value = false }
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function statusClass(s: string) {
  const m: Record<string, string> = {
    pending: 'badge-accent',
    confirmed: 'badge-primary',
    completed: 'badge-primary',
    cancelled: 'badge-coral',
    rejected: 'badge-coral',
  }
  return m[s] || 'badge-warm'
}

onMounted(load)
</script>

<style scoped>
.animate-fade-in {
  animation: fadeInUp 0.4s ease both;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>
