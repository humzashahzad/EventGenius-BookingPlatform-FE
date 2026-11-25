<template>
  <div class="content-container">
    <div class="mb-5">
      <RouterLink to="/shop/bookings" class="inline-flex items-center gap-1.5 text-sm text-warm-500 hover:text-primary-600 dark:text-warm-400">
        <AppIcon icon="chevron-left" class="w-4 h-4" />
        Back to bookings
      </RouterLink>
    </div>

    <div v-if="loading" class="space-y-4">
      <div class="skeleton h-24 w-full" />
      <div class="grid lg:grid-cols-3 gap-6"><div class="skeleton h-64 lg:col-span-2" /><div class="skeleton h-64" /></div>
    </div>

    <div v-else-if="error" class="card p-8 text-center">
      <div class="empty-state-icon mx-auto"><AppIcon icon="alert-circle" class="w-6 h-6" /></div>
      <p class="empty-state-title">{{ error }}</p>
      <RouterLink to="/shop/bookings" class="btn-outline btn-sm mt-4">Back to bookings</RouterLink>
    </div>

    <template v-else-if="booking">
      <!-- Header -->
      <div class="card p-5 sm:p-6 mb-6">
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div class="min-w-0">
            <p class="font-mono text-xs text-warm-500 dark:text-warm-400">{{ booking.booking_number }}</p>
            <h1 class="page-title mt-1 truncate">{{ booking.event_name }}</h1>
            <div class="flex flex-wrap items-center gap-2 mt-2">
              <span :class="statusBadge(booking.status)" class="capitalize">{{ booking.status }}</span>
              <span v-if="booking.payment_status === 'paid'" class="badge-success"><AppIcon icon="circle-check" class="w-3 h-3" />Paid</span>
              <span v-else-if="booking.payment_status === 'refunded'" class="badge-warm">Refunded</span>
              <span v-else-if="booking.status === 'confirmed'" class="badge-warning">Awaiting payment</span>
              <span class="text-xs text-warm-500 dark:text-warm-400">Requested {{ formatDate(booking.created_at) }}</span>
            </div>
          </div>
          <div v-if="booking.status === 'pending'" class="flex flex-wrap gap-2">
            <button class="btn-outline btn-sm" :disabled="acting" @click="showReject = true">
              <AppIcon icon="x" class="w-4 h-4" /> Reject
            </button>
            <button class="btn-primary btn-sm" :disabled="acting" @click="confirmBooking">
              <AppIcon :icon="acting ? 'loader' : 'check'" :class="acting ? 'w-4 h-4 animate-spin' : 'w-4 h-4'" /> Confirm booking
            </button>
          </div>
        </div>
        <p v-if="booking.status === 'rejected' && booking.rejection_reason" class="mt-4 text-sm rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-4 py-3">
          <strong>Rejection reason:</strong> {{ booking.rejection_reason }}
        </p>
        <p v-if="booking.status === 'cancelled' && booking.cancellation_reason" class="mt-4 text-sm rounded-xl bg-warm-100 dark:bg-warm-800 text-warm-700 dark:text-warm-300 px-4 py-3">
          <strong>Cancellation reason:</strong> {{ booking.cancellation_reason }}
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
          <!-- Event -->
          <section class="card">
            <header class="px-5 py-4 border-b border-warm-200 dark:border-warm-700 flex items-center gap-2">
              <AppIcon icon="calendar-event" class="w-4 h-4 text-primary-600" />
              <h2 class="font-semibold text-warm-900 dark:text-white">Event</h2>
            </header>
            <dl class="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div><dt class="text-warm-500">Venue</dt><dd class="font-medium text-warm-900 dark:text-white mt-0.5">{{ booking.venue?.name }}</dd></div>
              <div><dt class="text-warm-500">Event type</dt><dd class="font-medium text-warm-900 dark:text-white mt-0.5 capitalize">{{ String(booking.event_type || '').replace(/[-_]/g, ' ') }}</dd></div>
              <div><dt class="text-warm-500">Date</dt><dd class="font-medium text-warm-900 dark:text-white mt-0.5">{{ formatDate(booking.event_date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) }}</dd></div>
              <div><dt class="text-warm-500">Time</dt><dd class="font-medium text-warm-900 dark:text-white mt-0.5">{{ formatTimeRange(booking.start_time, booking.end_time) }} <span class="text-warm-500 font-normal">({{ booking.duration_hours }} h)</span></dd></div>
              <div><dt class="text-warm-500">Expected guests</dt><dd class="font-medium text-warm-900 dark:text-white mt-0.5">{{ booking.expected_guests }}</dd></div>
            </dl>
            <div v-if="booking.special_requirements" class="px-5 pb-5">
              <p class="text-sm text-warm-500 mb-1">Special requirements</p>
              <p class="text-sm text-warm-800 dark:text-warm-200 whitespace-pre-line rounded-xl bg-warm-50 dark:bg-warm-800/60 p-4">{{ booking.special_requirements }}</p>
            </div>
          </section>

          <!-- Pricing -->
          <section class="card">
            <header class="px-5 py-4 border-b border-warm-200 dark:border-warm-700 flex items-center gap-2">
              <AppIcon icon="credit-card" class="w-4 h-4 text-primary-600" />
              <h2 class="font-semibold text-warm-900 dark:text-white">Pricing &amp; payment</h2>
            </header>
            <div class="p-5 text-sm space-y-2">
              <div class="flex justify-between"><span class="text-warm-500">Base ({{ booking.expected_guests }} guests)</span><span>{{ formatPKR(booking.base_price) }}</span></div>
              <div v-if="Number(booking.amenities_price) > 0" class="flex justify-between"><span class="text-warm-500">Amenities</span><span>{{ formatPKR(booking.amenities_price) }}</span></div>
              <div class="flex justify-between"><span class="text-warm-500">Tax (5%)</span><span>{{ formatPKR(booking.tax_amount) }}</span></div>
              <div class="flex justify-between pt-3 mt-1 border-t border-warm-200 dark:border-warm-700 font-semibold text-base">
                <span>Total</span><span class="text-primary-600 dark:text-primary-400">{{ formatPKR(booking.total_amount) }}</span>
              </div>
              <p v-if="booking.payment_status === 'paid'" class="text-xs text-warm-500 pt-2">
                Paid {{ formatDate(booking.paid_at) }}<span v-if="booking.payment?.transaction_id"> · Txn {{ booking.payment.transaction_id }}</span>
              </p>
              <p v-else-if="booking.status === 'confirmed'" class="text-xs text-warm-500 pt-2">The customer has been asked to pay via PayFast.</p>
            </div>
          </section>
        </div>

        <!-- Customer -->
        <aside class="space-y-6">
          <section class="card p-5">
            <h2 class="font-semibold text-warm-900 dark:text-white mb-4">Customer</h2>
            <div class="flex items-center gap-3">
              <span class="w-11 h-11 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 flex items-center justify-center font-semibold">
                {{ initials(booking.client?.name) }}
              </span>
              <div class="min-w-0">
                <p class="font-medium text-warm-900 dark:text-white truncate">{{ booking.client?.name }}</p>
                <a v-if="booking.client?.email" :href="`mailto:${booking.client.email}`" class="text-xs text-warm-500 hover:text-primary-600 truncate block">{{ booking.client.email }}</a>
              </div>
            </div>
            <a v-if="booking.client?.phone" :href="`tel:${booking.client.phone}`" class="mt-3 flex items-center gap-2 text-sm text-warm-600 dark:text-warm-300 hover:text-primary-600">
              <AppIcon icon="phone" class="w-4 h-4" />{{ booking.client.phone }}
            </a>
            <RouterLink :to="{ path: '/shop/messages', query: { with: booking.client_id } }" class="btn-outline btn-sm w-full mt-4">
              <AppIcon icon="message" class="w-4 h-4" /> Message customer
            </RouterLink>
          </section>
        </aside>
      </div>
    </template>

    <VuexyModal v-model:visible="showReject" title="Reject booking" width="28rem">
      <label class="form-label">Reason <span class="text-coral">*</span></label>
      <textarea v-model="rejectReason" class="form-input" rows="3" placeholder="Let the customer know why…" />
      <p v-if="rejectError" class="text-xs text-coral mt-1.5">{{ rejectError }}</p>
      <template #footer>
        <button class="btn-ghost" @click="showReject = false">Cancel</button>
        <button class="btn-danger" :disabled="acting" @click="rejectBooking">Reject booking</button>
      </template>
    </VuexyModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { toast } from 'vue-sonner'
import api from '@/lib/axios'
import { formatDate, formatPKR, formatTimeRange } from '@/lib/format'
import AppIcon from '@/components/ui/AppIcon.vue'
import VuexyModal from '@/components/ui/VuexyModal.vue'
import { statusBadgeClass } from '@/lib/status'

const route = useRoute()
const booking = ref<any>(null)
const loading = ref(true)
const error = ref('')
const acting = ref(false)
const showReject = ref(false)
const rejectReason = ref('')
const rejectError = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get(`/store/bookings/${route.params.id}`)
    booking.value = data.data
  } catch (e: any) {
    error.value = e.response?.status === 404 ? 'Booking not found.' : 'Could not load this booking.'
  } finally {
    loading.value = false
  }
}

async function confirmBooking() {
  acting.value = true
  try {
    await api.patch(`/store/bookings/${route.params.id}/confirm`)
    toast.success('Booking confirmed — the customer can now pay.')
    await load()
  } catch (e: any) {
    toast.error(e.response?.data?.message || 'Could not confirm this booking.')
  } finally {
    acting.value = false
  }
}

async function rejectBooking() {
  if (!rejectReason.value.trim()) { rejectError.value = 'Please give a reason.'; return }
  acting.value = true
  rejectError.value = ''
  try {
    await api.patch(`/store/bookings/${route.params.id}/reject`, { reason: rejectReason.value.trim() })
    toast.success('Booking rejected.')
    showReject.value = false
    await load()
  } catch (e: any) {
    rejectError.value = e.response?.data?.message || 'Could not reject this booking.'
  } finally {
    acting.value = false
  }
}

function statusBadge(s: string) {
  return statusBadgeClass(s)
}

function initials(name?: string) {
  return (name || '?').split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
}

onMounted(load)
</script>
