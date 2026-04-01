<template>
  <div class="content-container">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <h1 class="text-2xl font-bold text-warm-900 tracking-tight">Welcome back, {{ authStore.user?.name?.split(' ')[0] || 'there' }}</h1>
        <p class="text-sm text-warm-500 mt-1">{{ today }} &middot; Here's your booking overview.</p>
      </div>
      <RouterLink to="/venues" class="btn-primary gap-2">
        <AppIcon icon="search" class="w-4 h-4" />
        Browse Venues
      </RouterLink>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-6">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div v-for="i in 4" :key="i" class="card animate-pulse h-28 rounded-2xl"></div>
      </div>
      <div class="card animate-pulse h-72 rounded-2xl"></div>
    </div>

    <template v-else>
      <!-- KPI Stat Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div class="gradient-stat-card bg-gradient-to-br from-primary-700 to-primary-500">
          <div class="gradient-stat-icon">
            <AppIcon icon="calendar-event" class="w-5 h-5" />
          </div>
          <div class="gradient-stat-value">{{ stats.total_bookings }}</div>
          <div class="gradient-stat-label">Total Bookings</div>
        </div>

        <div class="gradient-stat-card bg-gradient-to-br from-amber-700 to-accent">
          <div class="gradient-stat-icon">
            <AppIcon icon="clock" class="w-5 h-5" />
          </div>
          <div class="gradient-stat-value">{{ stats.upcoming_bookings }}</div>
          <div class="gradient-stat-label">Upcoming</div>
        </div>

        <div class="gradient-stat-card bg-gradient-to-br from-primary-800 to-primary-400">
          <div class="gradient-stat-icon">
            <AppIcon icon="circle-check" class="w-5 h-5" />
          </div>
          <div class="gradient-stat-value">{{ stats.completed_bookings }}</div>
          <div class="gradient-stat-label">Completed</div>
        </div>

        <div class="gradient-stat-card bg-gradient-to-br from-red-700 to-coral">
          <div class="gradient-stat-icon">
            <AppIcon icon="x" class="w-5 h-5" />
          </div>
          <div class="gradient-stat-value">{{ stats.cancelled_bookings }}</div>
          <div class="gradient-stat-label">Cancelled</div>
        </div>
      </div>

      <!-- Booking Activity Chart & Upcoming Events -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <!-- Booking Activity -->
        <div class="card">
          <div class="p-5">
            <h2 class="text-sm font-semibold text-warm-800 uppercase tracking-wider mb-4">Your Booking Activity</h2>
            <BarChart :data="bookingActivityData" />
          </div>
        </div>

        <!-- Upcoming Events -->
        <div class="card">
          <div class="p-5">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-sm font-semibold text-warm-800 uppercase tracking-wider">Upcoming Events</h2>
              <RouterLink to="/customer/bookings" class="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 transition-colors">
                View all
                <AppIcon icon="chevron-right" class="w-3.5 h-3.5" />
              </RouterLink>
            </div>

            <div v-if="upcomingEvents.length === 0" class="text-center py-8">
              <div class="w-16 h-16 mx-auto mb-3 rounded-full bg-warm-100 flex items-center justify-center">
                <AppIcon icon="calendar-event" class="w-8 h-8 text-warm-400" />
              </div>
              <p class="text-sm text-warm-500">No upcoming events</p>
            </div>

            <div v-else class="space-y-3">
              <div v-for="event in upcomingEvents" :key="event.id" class="event-card">
                <div class="event-date">
                  <div class="event-month">{{ formatMonth(event.event_date) }}</div>
                  <div class="event-day">{{ formatDay(event.event_date) }}</div>
                </div>
                <div class="event-details">
                  <h3 class="event-title">{{ event.event_name }}</h3>
                  <p class="event-venue">{{ event.venue?.name }}</p>
                  <div class="flex items-center gap-3 text-xs text-warm-500 mt-1">
                    <span class="flex items-center gap-1">
                      <AppIcon icon="clock" class="w-3.5 h-3.5" />
                      {{ event.start_time }}
                    </span>
                    <span class="flex items-center gap-1">
                      <AppIcon icon="users" class="w-3.5 h-3.5" />
                      {{ event.guests_count }} guests
                    </span>
                  </div>
                </div>
                <span :class="statusClass(event.status)" class="capitalize self-start">{{ event.status }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Booking progress bar -->
      <div class="card p-5 mb-8" v-if="stats.total_bookings > 0">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-semibold text-warm-700">Booking Completion Rate</h3>
          <span class="text-sm font-bold text-primary-600">{{ completionRate }}%</span>
        </div>
        <div class="h-2 bg-warm-100 rounded-full overflow-hidden">
          <div class="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-500" :style="{ width: completionRate + '%' }"></div>
        </div>
        <div class="flex justify-between mt-2 text-xs text-warm-400">
          <span>{{ stats.completed_bookings }} completed</span>
          <span>{{ stats.total_bookings }} total</span>
        </div>
      </div>

      <!-- Recent Bookings -->
      <div class="card mb-8">
        <div class="p-5">
          <div class="flex items-center justify-between mb-5">
            <h2 class="text-sm font-semibold text-warm-800 uppercase tracking-wider">Recent Bookings</h2>
            <RouterLink to="/customer/bookings" class="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 transition-colors">
              View all
              <AppIcon icon="chevron-right" class="w-3.5 h-3.5" />
            </RouterLink>
          </div>

          <!-- Empty state -->
          <div v-if="recentBookings.length === 0" class="text-center py-12">
            <div class="w-16 h-16 mx-auto mb-3 rounded-full bg-warm-100 flex items-center justify-center">
              <AppIcon icon="calendar-event" class="w-8 h-8 text-warm-400" />
            </div>
            <p class="text-sm font-medium text-warm-700">No bookings yet</p>
            <p class="text-xs text-warm-500 mt-1">Find and book the perfect venue for your next event.</p>
            <RouterLink to="/venues" class="btn-primary mt-4 inline-flex">Browse Venues</RouterLink>
          </div>

          <!-- Bookings table -->
          <div v-else class="overflow-x-auto -mx-5">
            <table class="w-full text-left">
              <thead>
                <tr class="border-b border-warm-200">
                  <th class="px-5 py-3 text-xs font-semibold text-warm-500 uppercase tracking-wider">Booking #</th>
                  <th class="px-5 py-3 text-xs font-semibold text-warm-500 uppercase tracking-wider">Venue</th>
                  <th class="px-5 py-3 text-xs font-semibold text-warm-500 uppercase tracking-wider">Event Date</th>
                  <th class="px-5 py-3 text-xs font-semibold text-warm-500 uppercase tracking-wider">Amount</th>
                  <th class="px-5 py-3 text-xs font-semibold text-warm-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-warm-100">
                <tr v-for="b in recentBookings" :key="b.id" class="cursor-pointer hover:bg-primary-50/30 transition-colors">
                  <td class="px-5 py-3">
                    <RouterLink :to="`/customer/bookings/${b.id}`" class="font-mono text-xs text-primary-600 font-semibold hover:text-primary-700">
                      {{ b.booking_number }}
                    </RouterLink>
                  </td>
                  <td class="px-5 py-3">
                    <div class="flex items-center gap-2.5">
                      <div class="w-8 h-8 rounded-lg bg-warm-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                        <img v-if="b.venue?.thumbnail" :src="getImageUrl(b.venue.thumbnail)" class="w-full h-full object-cover" />
                        <AppIcon v-else icon="map-pin" class="w-4 h-4 text-warm-400" />
                      </div>
                      <span class="font-medium text-warm-800 text-sm">{{ b.venue?.name }}</span>
                    </div>
                  </td>
                  <td class="px-5 py-3 text-warm-500 text-sm whitespace-nowrap">{{ formatDate(b.event_date) }}</td>
                  <td class="px-5 py-3 font-semibold text-warm-800 text-sm">PKR {{ Number(b.total_amount).toLocaleString() }}</td>
                  <td class="px-5 py-3"><span :class="statusClass(b.status)" class="capitalize">{{ b.status }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <RouterLink to="/venues" class="card-hover flex items-center gap-4 p-4 no-underline group">
          <div class="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center group-hover:bg-primary-200 transition-colors flex-shrink-0">
            <AppIcon icon="search" class="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <p class="text-sm font-semibold text-warm-800">Browse Venues</p>
            <p class="text-xs text-warm-500">Discover new places</p>
          </div>
        </RouterLink>

        <RouterLink to="/customer/bookings" class="card-hover flex items-center gap-4 p-4 no-underline group">
          <div class="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center group-hover:bg-primary-100 transition-colors flex-shrink-0">
            <AppIcon icon="calendar-event" class="w-5 h-5 text-primary-700" />
          </div>
          <div>
            <p class="text-sm font-semibold text-warm-800">My Bookings</p>
            <p class="text-xs text-warm-500">View all your bookings</p>
          </div>
        </RouterLink>

        <RouterLink to="/customer/profile" class="card-hover flex items-center gap-4 p-4 no-underline group">
          <div class="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center group-hover:bg-primary-100 transition-colors flex-shrink-0">
            <AppIcon icon="user" class="w-5 h-5 text-primary-700" />
          </div>
          <div>
            <p class="text-sm font-semibold text-warm-800">My Profile</p>
            <p class="text-xs text-warm-500">Update your information</p>
          </div>
        </RouterLink>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import api from '@/lib/axios'
import { getStorageUrl } from '@/lib/storageUrl'
import { useAuthStore } from '@/stores/auth'
import BarChart from '@/components/charts/BarChart.vue'
import AppIcon from '@/components/ui/AppIcon.vue'

const authStore = useAuthStore()
const loading = ref(true)
const stats = reactive({ total_bookings: 0, upcoming_bookings: 0, completed_bookings: 0, cancelled_bookings: 0 })
const recentBookings = ref<any[]>([])
const upcomingEvents = ref<any[]>([])

const today = new Date().toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

const completionRate = computed(() => {
  if (!stats.total_bookings) return 0
  return Math.round((stats.completed_bookings / stats.total_bookings) * 100)
})

// Chart data for booking activity by status
const bookingActivityData = computed(() => [
  { label: 'Pending', value: stats.total_bookings > 0 ? Math.max(stats.total_bookings - stats.upcoming_bookings - stats.completed_bookings - stats.cancelled_bookings, 0) : 5 },
  { label: 'Upcoming', value: stats.upcoming_bookings || 8 },
  { label: 'Completed', value: stats.completed_bookings || 12 },
  { label: 'Cancelled', value: stats.cancelled_bookings || 2 },
])

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/client/dashboard')
    Object.assign(stats, data.data.stats)
    recentBookings.value = data.data.recent_bookings

    // Filter upcoming events (future bookings with confirmed/pending status)
    const now = new Date()
    upcomingEvents.value = data.data.recent_bookings
      .filter((b: any) => {
        const eventDate = new Date(b.event_date)
        return eventDate >= now && (b.status === 'confirmed' || b.status === 'pending')
      })
      .sort((a: any, b: any) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
      .slice(0, 3) // Show only next 3 upcoming events
  } finally {
    loading.value = false
  }
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatMonth(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
}

function formatDay(d: string) {
  return new Date(d).getDate().toString()
}

function getImageUrl(path: string) {
  return getStorageUrl(path)
}

function statusClass(s: string) {
  const map: Record<string, string> = {
    pending: 'badge-accent',
    confirmed: 'badge-primary',
    completed: 'badge-primary',
    cancelled: 'badge-coral',
    rejected: 'badge-coral',
  }
  return map[s] || 'badge-warm'
}

onMounted(load)
</script>

<style scoped>
/* Gradient Stat Cards */
.gradient-stat-card {
  border-radius: 1rem;
  padding: 1.25rem;
  color: white;
  position: relative;
  overflow: hidden;
  box-shadow: var(--shadow-card), 0 4px 15px rgba(16, 185, 129, 0.2);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.gradient-stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-elevated), 0 8px 25px rgba(16, 185, 129, 0.3);
}

.gradient-stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.75rem;
}

.gradient-stat-value {
  font-size: 1.875rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1;
}

.gradient-stat-label {
  font-size: 0.8125rem;
  font-weight: 500;
  margin-top: 0.25rem;
  opacity: 0.9;
}

/* Event Card Styles */
.event-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 0.75rem;
  border: 1px solid var(--color-warm-200, #e7e5e4);
  background: var(--color-bg, #FAFAF9);
  transition: all 0.2s ease;
}

.event-card:hover {
  border-color: #6ee7b7;
  background: #f5f5f4;
  transform: translateY(-2px);
  box-shadow: var(--shadow-card);
}

.event-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 0.75rem;
  background: linear-gradient(135deg, #10B981, #34D399);
  color: white;
  flex-shrink: 0;
}

.event-month {
  font-size: 0.625rem;
  font-weight: 600;
  line-height: 1;
  opacity: 0.9;
}

.event-day {
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1;
  margin-top: 0.125rem;
}

.event-details {
  flex: 1;
  min-width: 0;
}

.event-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text, #1C1917);
  margin-bottom: 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.event-venue {
  font-size: 0.75rem;
  color: var(--color-warm-500, #78716c);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
