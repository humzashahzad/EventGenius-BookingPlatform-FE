<template>
  <div class="content-container">
    <!-- Breadcrumb -->
    <nav class="flex items-center gap-2 text-sm text-warm-500 mb-6">
      <RouterLink to="/customer/bookings" class="hover:text-primary-600 transition-colors">Dashboard</RouterLink>
      <span class="text-warm-300">/</span>
      <span class="text-warm-700 font-medium">My Bookings</span>
    </nav>

    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-xl font-bold text-warm-900 dark:text-warm-50 tracking-tight">My Bookings</h1>
        <p class="text-sm text-warm-500 mt-0.5">Track and manage all your venue reservations.</p>
      </div>
      <RouterLink to="/venues" class="btn-primary inline-flex items-center gap-2">
        <AppIcon icon="plus" class="w-4 h-4" />
        Book a Venue
      </RouterLink>
    </div>


    <!-- Loading -->
    <div v-if="loading" class="space-y-4">
      <div v-for="i in 4" :key="i" class="card h-28 animate-pulse rounded-2xl"></div>
    </div>

    <!-- Empty state -->
    <div v-else-if="bookings.length === 0" class="card">
      <div class="p-8 py-14 text-center">
        <div class="w-14 h-14 rounded-full bg-warm-100 dark:bg-warm-800 flex items-center justify-center mx-auto mb-3">
          <AppIcon icon="calendar-event" class="w-7 h-7 text-warm-400" />
        </div>
        <p class="text-sm font-semibold text-warm-800 dark:text-warm-200">No bookings found</p>
        <p class="text-xs text-warm-500 dark:text-warm-400 mt-1">{{ filterStatus ? `No ${filterStatus} bookings yet.` : "You haven't made any bookings yet." }}</p>
        <RouterLink to="/venues" class="btn-primary mt-4 inline-flex">Browse Venues</RouterLink>
      </div>
    </div>

    <!-- Booking cards -->
    <div v-else class="space-y-4">
      <div
        v-for="b in bookings"
        :key="b.id"
        class="card hover:shadow-elevated transition-all duration-200"
      >
        <div class="p-5">
          <div class="flex items-start gap-4">
            <div class="w-20 h-20 rounded-xl bg-warm-100 overflow-hidden flex-shrink-0">
              <img v-if="b.venue?.thumbnail" :src="getImageUrl(b.venue.thumbnail)" class="w-full h-full object-cover" :alt="b.venue?.name" />
              <div v-else class="w-full h-full flex items-center justify-center">
                <AppIcon icon="building" class="w-8 h-8 text-warm-300" />
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <span class="font-mono text-xs text-warm-400 tracking-wide">{{ b.booking_number }}</span>
              <h3 class="font-semibold text-warm-800 dark:text-warm-100 mt-0.5 truncate">{{ b.venue?.name }}</h3>
              <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-warm-500">
                <span>{{ b.event_name }}</span>
                <span>{{ formatDate(b.event_date) }}</span>
                <span v-if="b.start_time">{{ b.start_time }} &ndash; {{ b.end_time }}</span>
              </div>
            </div>
            <div class="text-right flex-shrink-0 hidden sm:block">
              <div class="text-lg font-bold text-warm-800 dark:text-warm-100">PKR {{ Number(b.total_amount).toLocaleString() }}</div>
              <span :class="statusClass(b.status)" class="inline-block mt-1 capitalize">{{ b.status }}</span>
              <RouterLink :to="`/customer/bookings/${b.id}`" class="text-xs text-primary-600 hover:text-primary-700 font-medium mt-2 block transition-colors">View Details &rarr;</RouterLink>
            </div>
          </div>
          <!-- Mobile footer -->
          <div class="flex items-center justify-between mt-3 pt-3 border-t border-warm-100 dark:border-warm-700 sm:hidden">
            <span class="font-bold text-warm-800 dark:text-warm-100">PKR {{ Number(b.total_amount).toLocaleString() }}</span>
            <span :class="statusClass(b.status)" class="capitalize">{{ b.status }}</span>
            <RouterLink :to="`/customer/bookings/${b.id}`" class="text-sm text-primary-600 font-medium">View Details &rarr;</RouterLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="meta.last_page > 1" class="flex items-center justify-center gap-2 pt-6">
      <button @click="changePage(meta.current_page - 1)" :disabled="meta.current_page === 1" class="w-9 h-9 rounded-xl border border-warm-200 dark:border-warm-700 flex items-center justify-center text-warm-600 dark:text-warm-400 hover:bg-warm-50 dark:hover:bg-warm-800 disabled:opacity-50 transition-colors">
        <AppIcon icon="chevron-left" class="w-4 h-4" />
      </button>
      <div class="flex gap-1">
        <button
          v-for="p in pageNumbers"
          :key="p"
          @click="changePage(p)"
          class="w-9 h-9 rounded-xl text-sm font-medium transition-all duration-200"
          :class="p === meta.current_page ? 'bg-primary-600 text-white shadow-soft' : 'border border-warm-200 dark:border-warm-700 text-warm-600 dark:text-warm-400 hover:bg-warm-50 dark:hover:bg-warm-800'"
        >{{ p }}</button>
      </div>
      <button @click="changePage(meta.current_page + 1)" :disabled="meta.current_page === meta.last_page" class="w-9 h-9 rounded-xl border border-warm-200 dark:border-warm-700 flex items-center justify-center text-warm-600 dark:text-warm-400 hover:bg-warm-50 dark:hover:bg-warm-800 disabled:opacity-50 transition-colors">
        <AppIcon icon="chevron-right" class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import api from '@/lib/axios'
import { getStorageUrl } from '@/lib/storageUrl'
import { useTopBarActionsStore } from '@/stores/topBarActions'
import AppIcon from '@/components/ui/AppIcon.vue'

const bookings = ref<any[]>([])
const loading = ref(false)
const filterStatus = ref('')
const search = ref('')
const meta = ref({ current_page: 1, last_page: 1 })
let page = 1
const topBarActions = useTopBarActionsStore()

const pageNumbers = computed(() => {
  const total = meta.value.last_page
  const current = meta.value.current_page
  const pages: number[] = []
  for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) pages.push(i)
  return pages
})

async function loadBookings() {
  loading.value = true
  try {
    const params: any = { per_page: 10, page }
    if (filterStatus.value) params.status = filterStatus.value
    if (search.value) params.search = search.value
    const { data } = await api.get('/client/bookings', { params })
    bookings.value = data.data.data
    meta.value = { current_page: data.data.current_page, last_page: data.data.last_page }
  } finally { loading.value = false }
}

function resetAndLoad() { page = 1; loadBookings() }

function changePage(p: number) {
  page = p
  loadBookings()
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getImageUrl(path: string) {
  return getStorageUrl(path)
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
    searchValue: search.value,
    filterOptions: [
      { key: 'status', label: 'All Status', options: [
        { value: 'pending', label: 'Pending' },
        { value: 'confirmed', label: 'Confirmed' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' },
      ]},
    ],
    initialFilterValues: { status: filterStatus.value },
    onSearch(q: string) {
      search.value = q
      resetAndLoad()
    },
    onFilter(key: string, value: string) {
      if (key === 'status') filterStatus.value = value
      resetAndLoad()
    },
  })
})

onUnmounted(() => {
  topBarActions.clear()
})
</script>
