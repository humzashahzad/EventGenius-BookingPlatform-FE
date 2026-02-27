<template>
  <div class="page-container">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Welcome back, {{ authStore.user?.name?.split(' ')[0] || 'there' }} 👋</h1>
        <p class="page-subtitle">{{ today }} · Here's your booking overview.</p>
      </div>
      <RouterLink to="/venues" class="btn-primary gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        Browse Venues
      </RouterLink>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-6">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div v-for="i in 4" :key="i" class="skeleton h-28 rounded-xl"></div>
      </div>
      <div class="skeleton h-72 rounded-xl"></div>
    </div>

    <template v-else>
      <!-- KPI Stat Cards — Gradient -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="gradient-stat-card" style="background: linear-gradient(135deg, #d97706, #f59e0b);">
          <div class="gradient-stat-icon">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          </div>
          <div class="gradient-stat-value">{{ stats.total_bookings }}</div>
          <div class="gradient-stat-label">Total Bookings</div>
        </div>

        <div class="gradient-stat-card" style="background: linear-gradient(135deg, #b45309, #d97706);">
          <div class="gradient-stat-icon">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div class="gradient-stat-value">{{ stats.upcoming_bookings }}</div>
          <div class="gradient-stat-label">Upcoming</div>
        </div>

        <div class="gradient-stat-card" style="background: linear-gradient(135deg, #059669, #34d399);">
          <div class="gradient-stat-icon">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div class="gradient-stat-value">{{ stats.completed_bookings }}</div>
          <div class="gradient-stat-label">Completed</div>
        </div>

        <div class="gradient-stat-card" style="background: linear-gradient(135deg, #dc2626, #f87171);">
          <div class="gradient-stat-icon">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </div>
          <div class="gradient-stat-value">{{ stats.cancelled_bookings }}</div>
          <div class="gradient-stat-label">Cancelled</div>
        </div>
      </div>

      <!-- Booking Activity Chart & Upcoming Events -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Booking Activity -->
        <div class="card">
          <div class="card-body">
            <h2 class="section-title mb-4">Your Booking Activity</h2>
            <BarChart :data="bookingActivityData" />
          </div>
        </div>

        <!-- Upcoming Events -->
        <div class="card">
          <div class="card-body">
            <div class="flex items-center justify-between mb-4">
              <h2 class="section-title">Upcoming Events</h2>
              <RouterLink to="/customer/bookings" class="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                View all
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </RouterLink>
            </div>

            <div v-if="upcomingEvents.length === 0" class="text-center py-8">
              <div class="w-16 h-16 mx-auto mb-3 rounded-full bg-surface-100 flex items-center justify-center">
                <svg class="w-8 h-8 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
              </div>
              <p class="text-sm text-surface-500">No upcoming events</p>
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
                  <div class="flex items-center gap-3 text-xs text-surface-500 mt-1">
                    <span class="flex items-center gap-1">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      {{ event.start_time }}
                    </span>
                    <span class="flex items-center gap-1">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                      </svg>
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
      <div class="card card-body" v-if="stats.total_bookings > 0">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-semibold text-surface-700">Booking Completion Rate</h3>
          <span class="text-sm font-bold text-success-600">{{ completionRate }}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-bar-fill bg-success-500" :style="{ width: completionRate + '%' }"></div>
        </div>
        <div class="flex justify-between mt-2 text-xs text-surface-400">
          <span>{{ stats.completed_bookings }} completed</span>
          <span>{{ stats.total_bookings }} total</span>
        </div>
      </div>

      <!-- Recent Bookings -->
      <div class="card">
        <div class="card-body">
          <div class="flex items-center justify-between mb-5">
            <h2 class="section-title">Recent Bookings</h2>
            <RouterLink to="/customer/bookings" class="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              View all
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </RouterLink>
          </div>

          <!-- Empty state -->
          <div v-if="recentBookings.length === 0" class="empty-state py-12">
            <div class="empty-state-icon">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
            <p class="empty-state-title">No bookings yet</p>
            <p class="empty-state-desc">Find and book the perfect venue for your next event.</p>
            <RouterLink to="/venues" class="btn-primary mt-4">Browse Venues</RouterLink>
          </div>

          <!-- Bookings table -->
          <div v-else class="table-wrapper">
            <table class="table">
              <thead>
                <tr>
                  <th>Booking #</th>
                  <th>Venue</th>
                  <th>Event Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="b in recentBookings" :key="b.id" class="cursor-pointer hover:bg-primary-50/30 transition-colors">
                  <td>
                    <RouterLink :to="`/customer/bookings/${b.id}`" class="font-mono text-xs text-primary-600 font-semibold hover:text-primary-700">
                      {{ b.booking_number }}
                    </RouterLink>
                  </td>
                  <td>
                    <div class="flex items-center gap-2.5">
                      <div class="w-8 h-8 rounded-lg bg-surface-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                        <img v-if="b.venue?.thumbnail" :src="getImageUrl(b.venue.thumbnail)" class="w-full h-full object-cover" />
                        <svg v-else class="w-4 h-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                        </svg>
                      </div>
                      <span class="font-medium text-surface-800 text-sm">{{ b.venue?.name }}</span>
                    </div>
                  </td>
                  <td class="text-surface-500 text-sm whitespace-nowrap">{{ formatDate(b.event_date) }}</td>
                  <td class="font-semibold text-surface-800 text-sm">PKR {{ Number(b.total_amount).toLocaleString() }}</td>
                  <td><span :class="statusClass(b.status)" class="capitalize">{{ b.status }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <RouterLink to="/venues" class="card card-body flex items-center gap-4 hover:shadow-md hover:border-primary-200 border border-transparent transition-all group">
          <div class="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center group-hover:bg-primary-200 transition-colors flex-shrink-0">
            <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
          <div>
            <p class="text-sm font-semibold text-surface-800">Browse Venues</p>
            <p class="text-xs text-surface-500">Discover new places</p>
          </div>
        </RouterLink>

        <RouterLink to="/customer/bookings" class="card card-body flex items-center gap-4 hover:shadow-md hover:border-primary-200 border border-transparent transition-all group">
          <div class="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center group-hover:bg-primary-100 transition-colors flex-shrink-0">
            <svg class="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
          </div>
          <div>
            <p class="text-sm font-semibold text-surface-800">My Bookings</p>
            <p class="text-xs text-surface-500">View all your bookings</p>
          </div>
        </RouterLink>

        <RouterLink to="/customer/profile" class="card card-body flex items-center gap-4 hover:shadow-md hover:border-primary-200 border border-transparent transition-all group">
          <div class="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center group-hover:bg-primary-100 transition-colors flex-shrink-0">
            <svg class="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
          </div>
          <div>
            <p class="text-sm font-semibold text-surface-800">My Profile</p>
            <p class="text-xs text-surface-500">Update your information</p>
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
    pending: 'badge-warning',
    confirmed: 'badge-success',
    completed: 'badge-info',
    cancelled: 'badge-danger',
    rejected: 'badge-danger',
  }
  return map[s] || 'badge-info'
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
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s, box-shadow 0.2s;
}

.gradient-stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

.gradient-stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
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
  border: 1px solid var(--color-border);
  background: var(--color-bg-elevated);
  transition: all 0.2s;
}

.event-card:hover {
  border-color: rgba(245, 158, 11, 0.2);
  background: var(--color-bg-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}

.event-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 0.5rem;
  background: linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600));
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
  color: var(--color-text);
  margin-bottom: 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.event-venue {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
