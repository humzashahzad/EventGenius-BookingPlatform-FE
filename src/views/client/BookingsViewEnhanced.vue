<template>
  <div class="content-container">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <h1 class="text-xl font-bold text-warm-900 tracking-tight">My Bookings</h1>
        <p class="text-sm text-warm-500 mt-0.5">Track and manage all your venue reservations.</p>
      </div>
      <RouterLink to="/venues" class="btn-primary inline-flex items-center gap-2">
        <AppIcon icon="plus" class="w-4 h-4" />
        Book a Venue
      </RouterLink>
    </div>


    <!-- Loading skeleton -->
    <div v-if="loading">
      <div v-for="i in 4" :key="i" class="card animate-pulse h-36 rounded-2xl mb-4"></div>
    </div>

    <!-- Empty state -->
    <div v-else-if="bookings.length === 0" class="card">
      <div class="p-8 py-14 text-center">
        <div class="w-16 h-16 rounded-full bg-warm-100 flex items-center justify-center mx-auto mb-4">
          <AppIcon icon="calendar-event" class="w-8 h-8 text-warm-400" />
        </div>
        <h3 class="text-base font-semibold text-warm-800">No bookings found</h3>
        <p class="text-sm text-warm-500 mt-1 max-w-xs mx-auto">
          {{ filterStatus ? `No ${filterStatus} bookings yet.` : 'You haven\'t made any bookings yet.' }}
        </p>
        <RouterLink to="/venues" class="btn-primary mt-4 inline-flex">Browse Venues</RouterLink>
      </div>
    </div>

    <!-- Booking Cards -->
    <div v-else class="space-y-4">
      <div
        v-for="b in bookings"
        :key="b.id"
        class="booking-card"
        :class="`booking-card-${b.status}`"
      >
        <!-- Card body -->
        <div class="p-5">
          <div class="flex items-start gap-4">
            <!-- Thumbnail -->
            <div class="booking-thumb flex-shrink-0 rounded-xl overflow-hidden bg-warm-100">
              <img v-if="b.venue?.thumbnail" :src="getImageUrl(b.venue.thumbnail)" class="w-full h-full object-cover" :alt="b.venue?.name" />
              <div v-else class="w-full h-full flex items-center justify-center">
                <AppIcon icon="map-pin" class="w-8 h-8 text-warm-300" />
              </div>
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-2 mb-1">
                <div class="min-w-0">
                  <span class="font-mono text-xs text-warm-400 tracking-wide uppercase">{{ b.booking_number }}</span>
                  <h3 class="font-semibold text-warm-800 truncate mt-0.5">{{ b.venue?.name }}</h3>
                </div>
                <span :class="statusClass(b.status)" class="capitalize flex-shrink-0">{{ b.status }}</span>
              </div>

              <div class="flex flex-wrap gap-3 mt-2">
                <span class="flex items-center gap-1.5 text-sm text-warm-500">
                  <AppIcon icon="tags" class="w-3.5 h-3.5" />
                  <span class="font-medium">{{ b.event_name }}</span>
                </span>
                <span class="flex items-center gap-1.5 text-sm text-warm-500">
                  <AppIcon icon="calendar-event" class="w-3.5 h-3.5" />
                  {{ formatDate(b.event_date) }}
                </span>
                <span v-if="b.start_time" class="flex items-center gap-1.5 text-sm text-warm-500">
                  <AppIcon icon="clock" class="w-3.5 h-3.5" />
                  {{ b.start_time }} &ndash; {{ b.end_time }}
                </span>
                <span v-if="b.guests_count" class="flex items-center gap-1.5 text-sm text-warm-500">
                  <AppIcon icon="users" class="w-3.5 h-3.5" />
                  {{ b.guests_count }} guests
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-between px-5 py-3 bg-primary-50/50 dark:bg-warm-800/50 border-t border-warm-100 dark:border-warm-700">
          <div>
            <span class="text-xs text-warm-500 uppercase font-semibold tracking-wide">Total Amount</span>
            <p class="font-bold text-lg text-warm-900">PKR {{ Number(b.total_amount).toLocaleString() }}</p>
          </div>
          <RouterLink :to="`/customer/bookings/${b.id}`" class="btn-outline text-sm inline-flex items-center gap-1">
            View Details
            <AppIcon icon="chevron-right" class="w-4 h-4" />
          </RouterLink>
        </div>

        <!-- Status alerts -->
        <div v-if="b.status === 'pending'" class="flex items-center gap-2 px-5 py-2.5 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-200/50 dark:border-amber-800/30 text-amber-700 dark:text-amber-400">
          <AppIcon icon="clock" class="w-4 h-4 flex-shrink-0" />
          <span class="text-sm">Awaiting confirmation from venue owner</span>
        </div>
        <div v-if="b.status === 'confirmed' && isUpcoming(b.event_date)" class="flex items-center gap-2 px-5 py-2.5 bg-primary-50 dark:bg-primary-900/20 border-t border-primary-200/50 dark:border-primary-800/30 text-primary-700 dark:text-primary-400">
          <AppIcon icon="circle-check" class="w-4 h-4 flex-shrink-0" />
          <span class="text-sm">{{ getDaysUntil(b.event_date) }}</span>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <nav v-if="meta.last_page > 1" class="flex justify-center mt-6">
      <div class="flex items-center gap-1">
        <button
          @click="changePage(meta.current_page - 1)"
          :disabled="meta.current_page === 1"
          class="w-9 h-9 rounded-xl border border-warm-200 flex items-center justify-center text-warm-600 hover:bg-warm-50 disabled:opacity-50 transition-colors"
        >
          <AppIcon icon="chevron-left" class="w-4 h-4" />
        </button>
        <button
          v-for="p in pageNumbers"
          :key="p"
          @click="changePage(p)"
          class="w-9 h-9 rounded-xl text-sm font-medium transition-all duration-200"
          :class="p === meta.current_page ? 'bg-primary-600 text-white shadow-soft' : 'border border-warm-200 text-warm-600 hover:bg-warm-50'"
        >{{ p }}</button>
        <button
          @click="changePage(meta.current_page + 1)"
          :disabled="meta.current_page === meta.last_page"
          class="w-9 h-9 rounded-xl border border-warm-200 flex items-center justify-center text-warm-600 hover:bg-warm-50 disabled:opacity-50 transition-colors"
        >
          <AppIcon icon="chevron-right" class="w-4 h-4" />
        </button>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import api from '@/lib/axios'
import AppIcon from '@/components/ui/AppIcon.vue'
import { getStorageUrl } from '@/lib/storageUrl'
import { useTopBarActionsStore } from '@/stores/topBarActions'

const bookings = ref<any[]>([])
const loading = ref(false)
const filterStatus = ref('')
const search = ref('')
const meta = ref({ current_page: 1, last_page: 1 })
const statusCounts = ref<Record<string, number>>({})
let page = 1
const topBarActions = useTopBarActionsStore()

const pageNumbers = computed(() => {
  const total = meta.value.last_page
  const current = meta.value.current_page
  const pages: number[] = []
  for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) {
    pages.push(i)
  }
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

    if (!filterStatus.value) {
      await loadStatusCounts()
    }
  } finally {
    loading.value = false
  }
}

function resetAndLoad() { page = 1; loadBookings() }

async function loadStatusCounts() {
  try {
    const { data } = await api.get('/client/bookings', { params: { per_page: 1000 } })
    const allBookings = data.data.data

    statusCounts.value = {
      '': allBookings.length,
      'pending': allBookings.filter((b: any) => b.status === 'pending').length,
      'confirmed': allBookings.filter((b: any) => b.status === 'confirmed').length,
      'completed': allBookings.filter((b: any) => b.status === 'completed').length,
      'cancelled': allBookings.filter((b: any) => b.status === 'cancelled').length,
    }
  } catch (error) {
    console.error('Failed to load status counts:', error)
  }
}

function changePage(p: number) {
  page = p
  loadBookings()
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })
}

function isUpcoming(dateStr: string) {
  const eventDate = new Date(dateStr)
  const now = new Date()
  return eventDate > now
}

function getDaysUntil(dateStr: string) {
  const eventDate = new Date(dateStr)
  const now = new Date()
  const diffTime = eventDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Event is today!'
  if (diffDays === 1) return 'Event is tomorrow!'
  if (diffDays <= 7) return `Event in ${diffDays} days`
  return `Event in ${Math.floor(diffDays / 7)} weeks`
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

<style scoped>
.booking-thumb {
  width: 5.5rem;
  height: 5.5rem;
}

.booking-card {
  border-left: 4px solid transparent;
  border-radius: 1rem;
  background-color: white;
  box-shadow: var(--shadow-card, 0 1px 3px rgba(0,0,0,0.08));
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  overflow: hidden;
}

:root.dark .booking-card {
  background-color: var(--color-warm-800, #292524);
}

.booking-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-elevated, 0 10px 25px rgba(0,0,0,0.1));
}

.booking-card-pending   { border-left-color: #F59E0B; }
.booking-card-confirmed { border-left-color: #10B981; }
.booking-card-completed { border-left-color: #10B981; }
.booking-card-cancelled { border-left-color: #F97066; }

@media (max-width: 576px) {
  .booking-thumb {
    width: 4rem;
    height: 4rem;
  }
}
</style>
