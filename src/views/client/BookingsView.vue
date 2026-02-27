<template>
  <div class="client-page">
    <nav class="client-breadcrumb">
      <RouterLink to="/customer/bookings">Dashboard</RouterLink>
      <span class="client-breadcrumb-sep">›</span>
      <span>My Bookings</span>
    </nav>

    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-xl font-bold text-surface-800">My Bookings</h1>
        <p class="text-sm text-surface-500 mt-0.5">Track and manage all your venue reservations.</p>
      </div>
      <RouterLink to="/venues" class="client-btn-primary inline-flex">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        Book a Venue
      </RouterLink>
    </div>

    <!-- Status filter -->
    <div class="flex gap-2 flex-wrap mb-6">
      <button
        v-for="s in statuses"
        :key="s.value"
        @click="filterStatus = s.value; page = 1; loadBookings()"
        class="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        :class="filterStatus === s.value
          ? 'bg-primary-600 text-white shadow-sm'
          : 'bg-[var(--color-bg-card)] text-surface-600 border border-surface-200 hover:border-primary-300 hover:text-primary-700'"
      >
        {{ s.label }}
      </button>
    </div>

    <div v-if="loading" class="space-y-4">
      <div v-for="i in 4" :key="i" class="client-card h-28 animate-pulse bg-surface-100 rounded-2xl"></div>
    </div>

    <div v-else-if="bookings.length === 0" class="client-card">
      <div class="client-card-body py-14 text-center">
        <div class="w-14 h-14 rounded-full bg-surface-100 flex items-center justify-center mx-auto mb-3 text-2xl">📅</div>
        <p class="client-card-title">No bookings found</p>
        <p class="client-card-subtitle mt-1">{{ filterStatus ? `No ${filterStatus} bookings yet.` : "You haven't made any bookings yet." }}</p>
        <RouterLink to="/venues" class="client-btn-primary mt-4 inline-flex">Browse Venues</RouterLink>
      </div>
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="b in bookings"
        :key="b.id"
        class="client-card hover:shadow-md hover:border-primary-200 transition-all"
      >
        <div class="client-card-body">
          <div class="flex items-start gap-4">
            <div class="w-20 h-20 rounded-xl bg-surface-100 overflow-hidden flex-shrink-0">
              <img v-if="b.venue?.thumbnail" :src="getImageUrl(b.venue.thumbnail)" class="w-full h-full object-cover" :alt="b.venue?.name" />
              <div v-else class="w-full h-full flex items-center justify-center text-2xl">🏛️</div>
            </div>
            <div class="flex-1 min-w-0">
              <span class="font-mono text-xs text-surface-400 tracking-wide">{{ b.booking_number }}</span>
              <h3 class="font-semibold text-surface-800 mt-0.5 truncate">{{ b.venue?.name }}</h3>
              <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-surface-500">
                <span>{{ b.event_name }}</span>
                <span>{{ formatDate(b.event_date) }}</span>
                <span v-if="b.start_time">{{ b.start_time }} – {{ b.end_time }}</span>
              </div>
            </div>
            <div class="text-right flex-shrink-0 hidden sm:block">
              <div class="text-lg font-bold text-surface-800">PKR {{ Number(b.total_amount).toLocaleString() }}</div>
              <span :class="statusClass(b.status)" class="inline-block mt-1 text-xs font-medium px-2.5 py-1 rounded-full capitalize">{{ b.status }}</span>
              <RouterLink :to="`/customer/bookings/${b.id}`" class="text-xs text-primary-600 hover:text-primary-700 font-medium mt-2 block">View Details →</RouterLink>
            </div>
          </div>
          <div class="flex items-center justify-between mt-3 pt-3 border-t border-surface-100 sm:hidden">
            <span class="font-bold text-surface-800">PKR {{ Number(b.total_amount).toLocaleString() }}</span>
            <span :class="statusClass(b.status)" class="text-xs font-medium px-2.5 py-1 rounded-full capitalize">{{ b.status }}</span>
            <RouterLink :to="`/customer/bookings/${b.id}`" class="text-sm text-primary-600 font-medium">View Details →</RouterLink>
          </div>
        </div>
      </div>
    </div>

    <div v-if="meta.last_page > 1" class="flex items-center justify-center gap-2 pt-6">
      <button @click="changePage(meta.current_page - 1)" :disabled="meta.current_page === 1" class="w-9 h-9 rounded-lg border border-surface-200 flex items-center justify-center text-surface-600 hover:bg-surface-50 disabled:opacity-50">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
      </button>
      <div class="flex gap-1">
        <button
          v-for="p in pageNumbers"
          :key="p"
          @click="changePage(p)"
          class="w-9 h-9 rounded-lg text-sm font-medium transition-colors"
          :class="p === meta.current_page ? 'bg-primary-600 text-white' : 'border border-surface-200 text-surface-600 hover:bg-surface-50'"
        >{{ p }}</button>
      </div>
      <button @click="changePage(meta.current_page + 1)" :disabled="meta.current_page === meta.last_page" class="w-9 h-9 rounded-lg border border-surface-200 flex items-center justify-center text-surface-600 hover:bg-surface-50 disabled:opacity-50">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import api from '@/lib/axios'
import { getStorageUrl } from '@/lib/storageUrl'

const bookings = ref<any[]>([])
const loading = ref(false)
const filterStatus = ref('')
const meta = ref({ current_page: 1, last_page: 1 })
let page = 1

const statuses = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

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
    const { data } = await api.get('/client/bookings', { params })
    bookings.value = data.data.data
    meta.value = { current_page: data.data.current_page, last_page: data.data.last_page }
  } finally { loading.value = false }
}

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
    pending: 'bg-warning-100 text-warning-800',
    confirmed: 'bg-success-100 text-success-800',
    completed: 'bg-info-100 text-info-800',
    cancelled: 'bg-danger-100 text-danger-800',
    rejected: 'bg-danger-100 text-danger-800',
  }
  return m[s] || 'bg-surface-100 text-surface-700'
}

onMounted(loadBookings)
</script>
