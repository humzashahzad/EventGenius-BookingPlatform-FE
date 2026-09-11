<template>
  <div class="p-6 max-w-3xl">
    <div class="flex items-center gap-3 mb-6">
      <RouterLink to="/client/bookings" class="text-gray-500 hover:text-gray-700">← Back to Bookings</RouterLink>
    </div>

    <div v-if="loading" class="text-center py-12 text-gray-400">Loading...</div>

    <div v-else-if="booking">
      <div class="flex justify-between items-start mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Booking Details</h1>
          <p class="text-gray-500 font-mono text-sm">{{ booking.booking_number }}</p>
        </div>
        <span :class="statusClass(booking.status)" class="capitalize text-sm px-3 py-1">{{ booking.status }}</span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div class="card">
          <h2 class="font-semibold text-gray-900 mb-3">Venue</h2>
          <h3 class="text-lg font-medium text-gray-900">{{ booking.venue?.name }}</h3>
          <p class="text-sm text-gray-500">{{ booking.venue?.city }}</p>
        </div>
        <div class="card">
          <h2 class="font-semibold text-gray-900 mb-3">Event Details</h2>
          <p class="text-sm text-gray-700"><span class="font-medium">Name:</span> {{ booking.event_name }}</p>
          <p class="text-sm text-gray-700 capitalize"><span class="font-medium">Type:</span> {{ booking.event_type?.replace('_', ' ') }}</p>
          <p class="text-sm text-gray-700"><span class="font-medium">Guests:</span> {{ booking.expected_guests }}</p>
        </div>
        <div class="card">
          <h2 class="font-semibold text-gray-900 mb-3">Date & Time</h2>
          <p class="text-sm text-gray-700"><span class="font-medium">Date:</span> {{ formatDate(booking.event_date) }}</p>
          <p class="text-sm text-gray-700"><span class="font-medium">Time:</span> {{ booking.start_time }} – {{ booking.end_time }}</p>
          <p class="text-sm text-gray-700"><span class="font-medium">Duration:</span> {{ booking.duration_hours }}h</p>
        </div>
        <div class="card">
          <h2 class="font-semibold text-gray-900 mb-3">Pricing</h2>
          <div class="space-y-1 text-sm">
            <div class="flex justify-between text-gray-600"><span>Base Price</span><span>PKR {{ Number(booking.base_price).toLocaleString() }}</span></div>
            <div class="flex justify-between text-gray-600"><span>Tax (5%)</span><span>PKR {{ Number(booking.tax_amount).toLocaleString() }}</span></div>
            <div class="flex justify-between font-semibold text-gray-900 border-t pt-1"><span>Total</span><span>PKR {{ Number(booking.total_amount).toLocaleString() }}</span></div>
          </div>
        </div>
      </div>

      <div v-if="booking.special_requirements" class="card mb-6">
        <h2 class="font-semibold text-gray-900 mb-2">Special Requirements</h2>
        <p class="text-sm text-gray-600">{{ booking.special_requirements }}</p>
      </div>

      <div v-if="booking.cancellation_reason" class="card mb-6 border-red-100">
        <h2 class="font-semibold text-red-700 mb-2">Cancellation Reason</h2>
        <p class="text-sm text-red-600">{{ booking.cancellation_reason }}</p>
      </div>

      <!-- Pay Now Button — shows for confirmed bookings without payment -->
      <div v-if="booking.status === 'confirmed' && !booking.payment?.paid_at" class="mb-4">
        <RouterLink
          :to="`/client/bookings/${booking.id}/pay`"
          class="inline-block bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors text-sm"
        >
          Pay Now — PKR {{ Number(booking.total_amount).toLocaleString() }}
        </RouterLink>
        <p class="text-xs text-gray-400 mt-1">Pay via PayFast (Sandbox Demo)</p>
      </div>

      <!-- Payment Completed Badge -->
      <div v-if="booking.payment?.paid_at" class="mb-4 card bg-green-50 border-green-200">
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <span class="text-green-700 font-medium text-sm">Payment Completed</span>
        </div>
        <p v-if="booking.payment?.transaction_id" class="text-xs text-green-600 mt-1 font-mono">
          Transaction: {{ booking.payment.transaction_id }}
        </p>
      </div>

      <!-- Cancel -->
      <div v-if="['pending', 'confirmed'].includes(booking.status)">
        <button @click="showCancel = true" class="btn-danger text-sm">Cancel Booking</button>
        <div v-if="showCancel" class="mt-4 card border-red-100">
          <h3 class="font-semibold text-gray-900 mb-3">Cancel this booking?</h3>
          <textarea v-model="cancelReason" class="form-input mb-3" rows="2" placeholder="Reason for cancellation (optional)"></textarea>
          <div class="flex gap-3">
            <button @click="cancelBooking" :disabled="cancelling" class="btn-danger text-sm">
              {{ cancelling ? 'Cancelling...' : 'Confirm Cancel' }}
            </button>
            <button @click="showCancel = false" class="btn-secondary text-sm">Never mind</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import api from '@/lib/axios'

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
  const m: Record<string, string> = { pending: 'badge-warning', confirmed: 'badge-success', completed: 'badge-info', cancelled: 'badge-danger', rejected: 'badge-danger' }
  return m[s] || 'badge-info'
}

onMounted(load)
</script>
