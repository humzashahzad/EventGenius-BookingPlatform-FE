<template>
  <div class="page-container">
    <div class="page-header">
      <div><h1 class="page-title">Bookings</h1><p class="page-subtitle">Review and manage incoming booking requests for your venues.</p></div>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="table-wrapper">
      <div v-for="i in 6" :key="i" class="flex gap-4 px-4 py-4 border-b border-surface-100 bg-[var(--color-bg-card)]">
        <div class="skeleton h-4 w-24 rounded"></div>
        <div class="skeleton h-4 w-32 rounded"></div>
        <div class="skeleton h-4 w-28 rounded"></div>
        <div class="skeleton h-4 w-20 rounded ml-auto"></div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="bookings.length === 0" class="empty-state card">
      <div class="empty-state-icon"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg></div>
      <p class="empty-state-title">No bookings found</p>
      <p class="empty-state-desc">No bookings match the selected filter.</p>
    </div>

    <!-- Bookings table -->
    <div v-else class="table-wrapper">
      <table class="table">
        <thead><tr>
          <th>Booking #</th><th>Event</th><th>Client</th><th>Venue</th>
          <th>Date</th><th>Guests</th><th class="text-right">Amount</th>
          <th>Status</th><th class="text-right">Actions</th>
        </tr></thead>
        <tbody>
          <tr v-for="b in bookings" :key="b.id">
            <td class="font-mono text-xs text-primary-600 font-semibold whitespace-nowrap">{{ b.booking_number }}</td>
            <td>
              <p class="font-medium text-surface-800">{{ b.event_name }}</p>
              <p class="text-xs text-surface-400 capitalize">{{ b.event_type?.replace(/_/g, ' ') }}</p>
            </td>
            <td class="text-surface-700">{{ b.client?.name }}</td>
            <td class="text-surface-500">{{ b.venue?.name }}</td>
            <td class="text-surface-500 text-xs whitespace-nowrap">
              <p>{{ formatDate(b.event_date) }}</p>
              <p class="text-surface-400">{{ b.start_time }} – {{ b.end_time }}</p>
            </td>
            <td class="text-center text-surface-600">{{ b.expected_guests }}</td>
            <td class="text-right font-semibold text-surface-800">PKR {{ Number(b.total_amount).toLocaleString() }}</td>
            <td><span :class="statusClass(b.status)" class="capitalize">{{ b.status }}</span></td>
            <td class="text-right">
              <div v-if="b.status === 'pending'" class="flex items-center justify-end gap-1">
                <button @click="doConfirm(b.id)" :disabled="acting" class="px-2.5 py-1.5 rounded-lg text-xs font-medium text-success-700 hover:bg-success-50 transition-colors">Confirm</button>
                <button @click="openReject(b)" :disabled="acting" class="px-2.5 py-1.5 rounded-lg text-xs font-medium text-danger-600 hover:bg-danger-50 transition-colors">Reject</button>
              </div>
              <span v-else class="text-surface-300 text-xs">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Reject Dialog -->
    <Dialog v-model:visible="showRejectDialog" modal header="Reject Booking" :style="{ width: '28rem' }" :pt="dialogPt">
      <div class="space-y-4">
        <div class="bg-[var(--color-bg-elevated)] rounded-lg p-3 border border-[var(--color-border)]">
          <p class="text-xs text-surface-500 mb-0.5">Booking</p>
          <p class="text-sm font-semibold text-surface-800">{{ rejectTarget?.event_name }}</p>
          <p class="text-xs text-surface-400">{{ rejectTarget?.client?.name }} · {{ formatDate(rejectTarget?.event_date ?? '') }}</p>
        </div>
        <div class="form-group">
          <label class="form-label">Rejection Reason <span class="text-danger-500">*</span></label>
          <textarea v-model="rejectReason" class="form-textarea" rows="3" placeholder="Explain why this booking is being rejected…"></textarea>
          <p v-if="rejectError" class="form-error">{{ rejectError }}</p>
        </div>
      </div>
      <template #footer>
        <Button label="Cancel" severity="secondary" text @click="showRejectDialog = false" />
        <Button label="Confirm Rejection" severity="danger" :loading="acting" @click="submitReject" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import api from '@/lib/axios'
import { useTopBarActionsStore } from '@/stores/topBarActions'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'

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

const dialogPt = {
  root: { class: '!bg-[var(--color-bg-card)] !border-[var(--color-border)] !text-[var(--color-text)]' },
  header: { class: '!bg-[var(--color-bg-card)] !text-[var(--color-text)] !border-b !border-[var(--color-border)]' },
  content: { class: '!bg-[var(--color-bg-card)] !text-[var(--color-text)]' },
  footer: { class: '!bg-[var(--color-bg-card)] !border-t !border-[var(--color-border)]' },
}

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
  const m: Record<string, string> = { pending: 'badge-warning', confirmed: 'badge-success', completed: 'badge-info', cancelled: 'badge-danger', rejected: 'badge-danger' }
  return m[s] || 'badge-gray'
}

onMounted(() => {
  loadBookings()
  topBarActions.set({
    searchPlaceholder: 'Search bookings…',
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
