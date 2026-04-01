<template>
  <div class="content-container">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-warm-900 dark:text-warm-50">Bookings</h1>
        <p class="text-warm-500 dark:text-warm-400 mt-1">Monitor all bookings across every venue on the platform.</p>
      </div>
      <span v-if="!loading" class="text-sm text-warm-400 dark:text-warm-500">{{ meta.total }} bookings</span>
    </div>

    <!-- Table Card -->
    <div class="card">
      <!-- Loading -->
      <div v-if="loading" class="p-5">
        <div v-for="i in 8" :key="i" class="flex gap-3 py-3 border-b border-warm-100 dark:border-warm-800 last:border-0 animate-pulse">
          <div class="h-4 w-1/12 rounded-lg bg-warm-200 dark:bg-warm-700"></div>
          <div class="h-4 w-1/6 rounded-lg bg-warm-200 dark:bg-warm-700"></div>
          <div class="h-4 w-1/4 rounded-lg bg-warm-200 dark:bg-warm-700"></div>
          <div class="h-4 w-1/12 rounded-lg bg-warm-200 dark:bg-warm-700"></div>
          <div class="h-4 w-1/12 rounded-lg bg-warm-200 dark:bg-warm-700 ml-auto"></div>
        </div>
      </div>

      <!-- Empty -->
      <div v-else-if="bookings.length === 0" class="p-5 text-center py-12">
        <div class="w-14 h-14 rounded-2xl bg-warm-100 dark:bg-warm-800 flex items-center justify-center mx-auto mb-4">
          <AppIcon icon="calendar-event" class="w-7 h-7 text-warm-400" />
        </div>
        <p class="font-medium text-warm-700 dark:text-warm-300 mb-1">No bookings found</p>
        <p class="text-warm-500 dark:text-warm-400 text-sm">Try adjusting your filters.</p>
      </div>

      <!-- Table -->
      <div v-else class="table-wrapper overflow-x-auto">
        <table class="w-full min-w-[700px]">
          <thead>
            <tr class="table-header">
              <th class="text-left px-5 py-3 text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">Booking #</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">Client</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">Venue</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">Event Type</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">Date</th>
              <th class="text-right px-5 py-3 text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">Amount</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="b in bookings" :key="b.id" class="table-row">
              <td class="px-5 py-3">
                <span class="text-sm font-semibold text-primary-600 dark:text-primary-400 font-mono">{{ b.booking_number }}</span>
              </td>
              <td class="px-5 py-3">
                <div class="flex items-center gap-2">
                  <div class="w-7 h-7 rounded-lg bg-warm-100 dark:bg-warm-800 flex items-center justify-center flex-shrink-0">
                    <span class="text-[10px] font-bold text-warm-600 dark:text-warm-400">{{ b.client?.name?.[0]?.toUpperCase() }}</span>
                  </div>
                  <span class="text-sm font-medium text-warm-800 dark:text-warm-200">{{ b.client?.name }}</span>
                </div>
              </td>
              <td class="px-5 py-3">
                <p class="text-sm text-warm-800 dark:text-warm-200 mb-0">{{ b.venue?.name }}</p>
                <span class="text-xs text-warm-400 dark:text-warm-500">{{ b.venue?.city }}</span>
              </td>
              <td class="px-5 py-3 text-sm text-warm-500 dark:text-warm-400 capitalize">{{ b.event_type?.replace(/_/g, ' ') }}</td>
              <td class="px-5 py-3 text-sm text-warm-500 dark:text-warm-400 whitespace-nowrap">{{ formatDate(b.event_date) }}</td>
              <td class="px-5 py-3 text-right text-sm font-semibold text-warm-800 dark:text-warm-200">PKR {{ Number(b.total_amount).toLocaleString() }}</td>
              <td class="px-5 py-3"><span :class="statusClass(b.status)" class="capitalize">{{ b.status }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="meta.last_page > 1" class="flex flex-wrap items-center justify-between mt-6">
      <p class="text-sm text-warm-500 dark:text-warm-400">Showing {{ (meta.current_page - 1) * perPage + 1 }}--{{ Math.min(meta.current_page * perPage, meta.total) }} of {{ meta.total }} bookings</p>
      <nav class="flex items-center gap-1">
        <button class="w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-all" :class="meta.current_page === 1 ? 'text-warm-300 dark:text-warm-600 cursor-not-allowed' : 'text-warm-600 dark:text-warm-400 hover:bg-warm-100 dark:hover:bg-warm-800'" :disabled="meta.current_page === 1" @click="changePage(meta.current_page - 1)">
          <AppIcon icon="chevron-left" class="w-4 h-4" />
        </button>
        <template v-for="p in pageRange" :key="p">
          <span v-if="p === '...'" class="w-8 h-8 flex items-center justify-center text-sm text-warm-400 dark:text-warm-500">...</span>
          <button v-else class="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-medium transition-all" :class="meta.current_page === p ? 'bg-primary-600 text-white shadow-soft' : 'text-warm-600 dark:text-warm-400 hover:bg-warm-100 dark:hover:bg-warm-800'" @click="changePage(Number(p))">{{ p }}</button>
        </template>
        <button class="w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-all" :class="meta.current_page === meta.last_page ? 'text-warm-300 dark:text-warm-600 cursor-not-allowed' : 'text-warm-600 dark:text-warm-400 hover:bg-warm-100 dark:hover:bg-warm-800'" :disabled="meta.current_page === meta.last_page" @click="changePage(meta.current_page + 1)">
          <AppIcon icon="chevron-right" class="w-4 h-4" />
        </button>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import api from '@/lib/axios'
import { useTopBarActionsStore } from '@/stores/topBarActions'
import AppIcon from '@/components/ui/AppIcon.vue'

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
  const m: Record<string, string> = { pending: 'badge-accent', confirmed: 'badge-primary', completed: 'badge-primary', cancelled: 'badge-coral', rejected: 'badge-coral' }
  return m[s] || 'badge-warm'
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
    searchPlaceholder: 'Booking # or event name...',
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
