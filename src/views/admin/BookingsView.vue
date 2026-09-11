<template>
  <div class="page-container">
    <div class="page-header">
      <div><h1 class="page-title">Bookings</h1><p class="page-subtitle">Monitor all bookings across every venue on the platform.</p></div>
    </div>

    <div v-if="!loading" class="text-sm text-surface-500 mb-3">{{ meta.total }} bookings</div>

    <!-- Table -->
    <div class="table-wrapper">
      <div v-if="loading" class="bg-white">
        <div v-for="i in 8" :key="i" class="flex gap-4 px-4 py-4 border-b border-surface-100">
          <div class="skeleton h-4 w-24 rounded"></div>
          <div class="skeleton h-4 w-32 rounded"></div>
          <div class="skeleton h-4 w-36 rounded"></div>
          <div class="skeleton h-4 w-20 rounded"></div>
          <div class="skeleton h-4 w-16 rounded ml-auto"></div>
        </div>
      </div>
      <div v-else-if="bookings.length === 0" class="empty-state bg-white rounded-xl">
        <div class="empty-state-icon"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg></div>
        <p class="empty-state-title">No bookings found</p>
        <p class="empty-state-desc">Try adjusting your filters.</p>
      </div>
      <table v-else class="table">
        <thead><tr>
          <th>Booking #</th><th>Client</th><th>Venue</th>
          <th>Event Type</th><th>Date</th>
          <th class="text-right">Amount</th><th>Status</th>
        </tr></thead>
        <tbody>
          <tr v-for="b in bookings" :key="b.id">
            <td class="font-mono text-xs text-primary-600 font-semibold">{{ b.booking_number }}</td>
            <td>
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-full bg-surface-100 flex items-center justify-center flex-shrink-0">
                  <span class="text-2xs font-semibold text-surface-600">{{ b.client?.name?.[0]?.toUpperCase() }}</span>
                </div>
                <span class="text-sm text-surface-700 font-medium">{{ b.client?.name }}</span>
              </div>
            </td>
            <td>
              <p class="text-sm text-surface-700">{{ b.venue?.name }}</p>
              <p class="text-xs text-surface-400">{{ b.venue?.city }}</p>
            </td>
            <td class="text-surface-600 capitalize">{{ b.event_type?.replace(/_/g, ' ') }}</td>
            <td class="text-surface-500 text-xs whitespace-nowrap">{{ formatDate(b.event_date) }}</td>
            <td class="text-right font-semibold text-surface-800">PKR {{ Number(b.total_amount).toLocaleString() }}</td>
            <td><span :class="statusClass(b.status)" class="capitalize">{{ b.status }}</span></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="meta.last_page > 1" class="pagination">
      <p class="pagination-info">Showing {{ (meta.current_page - 1) * perPage + 1 }}–{{ Math.min(meta.current_page * perPage, meta.total) }} of {{ meta.total }} bookings</p>
      <div class="pagination-controls">
        <button @click="changePage(meta.current_page - 1)" :disabled="meta.current_page === 1" class="pagination-btn">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <template v-for="p in pageRange" :key="p">
          <span v-if="p === '...'" class="w-8 h-8 flex items-center justify-center text-surface-400 text-sm">…</span>
          <button v-else @click="changePage(Number(p))" :class="['pagination-btn', meta.current_page === p ? 'active' : '']">{{ p }}</button>
        </template>
        <button @click="changePage(meta.current_page + 1)" :disabled="meta.current_page === meta.last_page" class="pagination-btn">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import api from '@/lib/axios'
import { useTopBarActionsStore } from '@/stores/topBarActions'

const bookings     = ref<any[]>([])
const loading      = ref(false)
const search       = ref('')
const statusFilter = ref('')
const perPage      = 15
const meta         = ref({ current_page: 1, last_page: 1, total: 0 })
let page = 1
let searchTimeout: ReturnType<typeof setTimeout>
const topBarActions = useTopBarActionsStore()

async function load() {
  loading.value = true
  try {
    const params: any = { per_page: perPage, page }
    if (search.value)       params.search = search.value
    if (statusFilter.value) params.status = statusFilter.value
    const { data } = await api.get('/admin/bookings', { params })
    bookings.value = data.data.data
    meta.value     = { current_page: data.data.current_page, last_page: data.data.last_page, total: data.data.total }
  } finally { loading.value = false }
}

function resetAndLoad() { page = 1; load() }
function changePage(p: number) { page = p; load() }

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })
}

function statusClass(s: string) {
  const m: Record<string, string> = { pending: 'badge-warning', confirmed: 'badge-success', completed: 'badge-info', cancelled: 'badge-danger', rejected: 'badge-danger' }
  return m[s] || 'badge-gray'
}

const pageRange = computed(() => {
  const total = meta.value.last_page, cur = meta.value.current_page
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | string)[] = [1]
  if (cur > 3) pages.push('...')
  for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i)
  if (cur < total - 2) pages.push('...')
  pages.push(total)
  return pages
})

onMounted(() => {
  load()
  topBarActions.set({
    searchPlaceholder: 'Booking # or event name…',
    searchValue: search.value,
    filterOptions: [
      { key: 'status', label: 'Status', options: [
        { value: '', label: 'All Status' },
        { value: 'pending', label: 'Pending' },
        { value: 'confirmed', label: 'Confirmed' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' },
        { value: 'rejected', label: 'Rejected' },
      ]},
    ],
    initialFilterValues: { status: statusFilter.value },
    onSearch(q: string) { search.value = q; clearTimeout(searchTimeout); searchTimeout = setTimeout(() => resetAndLoad(), 400) },
    onFilter(key: string, value: string) { statusFilter.value = value; resetAndLoad() },
  })
})

onUnmounted(() => { clearTimeout(searchTimeout); topBarActions.clear() })
</script>
