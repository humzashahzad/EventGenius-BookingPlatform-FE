<template>
  <div class="content-container">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="text-2xl font-bold text-warm-900 dark:text-warm-50 tracking-tight">Bookings</h1>
        <p class="text-sm text-warm-500 dark:text-warm-400 mt-1">Review and manage incoming booking requests for your venues.</p>
      </div>
    </div>

    <!-- Table Card -->
    <div class="card">
      <!-- Loading skeleton -->
      <div v-if="loading" class="p-5 sm:p-6 space-y-4">
        <div v-for="i in 6" :key="i" class="flex gap-4 items-center">
          <div class="skeleton h-4 w-20 rounded-lg"></div>
          <div class="skeleton h-4 w-32 rounded-lg"></div>
          <div class="skeleton h-4 w-24 rounded-lg"></div>
          <div class="skeleton h-4 w-16 rounded-lg"></div>
          <div class="skeleton h-4 w-16 rounded-lg ml-auto"></div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else-if="bookings.length === 0" class="flex flex-col items-center py-16 text-center px-6">
        <div class="w-14 h-14 rounded-2xl bg-warm-100 dark:bg-warm-800 flex items-center justify-center mb-3">
          <AppIcon icon="calendar-event" class="w-7 h-7 text-warm-400 dark:text-warm-500" />
        </div>
        <p class="text-sm font-medium text-warm-700 dark:text-warm-300">No bookings found</p>
        <p class="text-xs text-warm-500 dark:text-warm-400 mt-1">No bookings match the selected filter.</p>
      </div>

      <!-- Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm min-w-[700px]">
          <thead>
            <tr class="bg-warm-50 dark:bg-warm-800/50">
              <th class="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-warm-500 dark:text-warm-400">Booking #</th>
              <th class="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-warm-500 dark:text-warm-400">Event</th>
              <th class="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-warm-500 dark:text-warm-400">Client</th>
              <th class="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-warm-500 dark:text-warm-400">Venue</th>
              <th class="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-warm-500 dark:text-warm-400">Date</th>
              <th class="text-center px-5 py-3 text-xs font-semibold uppercase tracking-wider text-warm-500 dark:text-warm-400">Guests</th>
              <th class="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-warm-500 dark:text-warm-400">Amount</th>
              <th class="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-warm-500 dark:text-warm-400">Status</th>
              <th class="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-warm-500 dark:text-warm-400">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-warm-200 dark:divide-warm-700">
            <tr v-for="b in bookings" :key="b.id" class="hover:bg-warm-50 dark:hover:bg-warm-800/30 transition-colors">
              <td class="px-5 py-3.5"><span class="font-mono text-xs text-primary-600 dark:text-primary-400 font-semibold whitespace-nowrap">{{ b.booking_number }}</span></td>
              <td class="px-5 py-3.5">
                <p class="font-medium text-warm-800 dark:text-warm-200 text-sm">{{ b.event_name }}</p>
                <p class="text-warm-500 dark:text-warm-400 text-xs capitalize">{{ b.event_type?.replace(/_/g, ' ') }}</p>
              </td>
              <td class="px-5 py-3.5 text-warm-700 dark:text-warm-300">{{ b.client?.name }}</td>
              <td class="px-5 py-3.5 text-warm-500 dark:text-warm-400">{{ b.venue?.name }}</td>
              <td class="px-5 py-3.5 text-warm-500 dark:text-warm-400 text-xs whitespace-nowrap">
                <p>{{ formatDate(b.event_date) }}</p>
                <p class="text-warm-400 dark:text-warm-500">{{ b.start_time }} – {{ b.end_time }}</p>
              </td>
              <td class="px-5 py-3.5 text-center text-warm-700 dark:text-warm-300">{{ b.expected_guests }}</td>
              <td class="px-5 py-3.5 text-right font-semibold text-warm-800 dark:text-warm-200">PKR {{ Number(b.total_amount).toLocaleString() }}</td>
              <td class="px-5 py-3.5"><span :class="statusClass(b.status)" class="capitalize">{{ b.status }}</span></td>
              <td class="px-5 py-3.5 text-right">
                <div v-if="b.status === 'pending'" class="flex items-center justify-end gap-1.5">
                  <button @click="doConfirm(b.id)" :disabled="acting" class="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900/30 border border-primary-200 dark:border-primary-800 transition-colors">Confirm</button>
                  <button @click="openReject(b)" :disabled="acting" class="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-coral/10 dark:bg-coral/20 text-coral hover:bg-coral/20 dark:hover:bg-coral/30 border border-coral/20 dark:border-coral/30 transition-colors">Reject</button>
                </div>
                <span v-else class="text-warm-400 dark:text-warm-500 text-xs">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Reject Dialog -->
    <VuexyModal v-model:visible="showRejectDialog" title="Reject Booking" width="28rem">
      <div class="rounded-xl border border-warm-200 dark:border-warm-700 bg-warm-50 dark:bg-warm-800/50 p-4 mb-4">
        <p class="text-xs text-warm-500 dark:text-warm-400">Booking</p>
        <p class="font-semibold text-warm-900 dark:text-warm-50 text-sm mt-0.5">{{ rejectTarget?.event_name }}</p>
        <p class="text-xs text-warm-500 dark:text-warm-400 mt-1">{{ rejectTarget?.client?.name }} · {{ formatDate(rejectTarget?.event_date ?? '') }}</p>
      </div>
      <div>
        <label class="form-label">Rejection Reason <span class="text-coral">*</span></label>
        <textarea v-model="rejectReason" class="form-input" rows="3" placeholder="Explain why this booking is being rejected..."></textarea>
        <p v-if="rejectError" class="text-xs text-coral mt-1.5">{{ rejectError }}</p>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="showRejectDialog = false">Cancel</button>
        <button class="btn-danger gap-1.5" :disabled="acting" @click="submitReject">
          <AppIcon v-if="acting" icon="loader" class="w-4 h-4 animate-spin" />
          Confirm Rejection
        </button>
      </template>
    </VuexyModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import api from '@/lib/axios'
import { useTopBarActionsStore } from '@/stores/topBarActions'
import VuexyModal from '@/components/ui/VuexyModal.vue'
import AppIcon from '@/components/ui/AppIcon.vue'

const bookings    = ref<any[]>([])
const loading     = ref(false)
const acting      = ref(false)
const filterStatus = ref('')
const rejectTarget = ref<any>(null)
const rejectReason = ref('')
const rejectError  = ref('')
const showRejectDialog = ref(false)

const statuses = [
  { value: '', label: 'All' },
  { value: 'pending',   label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected',  label: 'Rejected' },
]

const topBarActions = useTopBarActionsStore()

async function loadBookings() {
  loading.value = true
  try {
    const params: any = { per_page: 20 }
    if (filterStatus.value) params.status = filterStatus.value
    const { data } = await api.get('/store/bookings', { params })
    bookings.value = data.data.data
  } finally { loading.value = false }
}

async function doConfirm(id: number) {
  acting.value = true
  try { await api.patch(`/store/bookings/${id}/confirm`); await loadBookings() }
  finally { acting.value = false }
}

function openReject(b: any) {
  rejectTarget.value = b
  rejectReason.value = ''
  rejectError.value = ''
  showRejectDialog.value = true
}

async function submitReject() {
  if (!rejectReason.value.trim()) { rejectError.value = 'Reason is required.'; return }
  acting.value = true
  try {
    await api.patch(`/store/bookings/${rejectTarget.value.id}/reject`, { reason: rejectReason.value })
    showRejectDialog.value = false
    rejectTarget.value = null
    await loadBookings()
  } finally { acting.value = false }
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })
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

onMounted(() => {
  loadBookings()
  topBarActions.set({
    searchPlaceholder: 'Search bookings...',
    filterOptions: [
      { key: 'status', label: 'Status', options: statuses.map(s => ({ value: s.value, label: s.label })) },
    ],
    initialFilterValues: { status: filterStatus.value },
    onFilter(key: string, value: string) {
      if (key === 'status') filterStatus.value = value
      loadBookings()
    },
  })
})

onUnmounted(() => topBarActions.clear())
</script>
