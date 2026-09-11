<template>
  <div class="content-container">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-warm-900 dark:text-warm-50">Dashboard</h1>
        <p class="text-warm-500 dark:text-warm-400 mt-1">Welcome back, {{ authStore.user?.name?.split(' ')[0] }}. Here's what's happening today.</p>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-sm text-warm-400 dark:text-warm-500 hidden sm:block">{{ today }}</span>
        <RouterLink to="/support/stores" class="btn-outline inline-flex items-center gap-1.5 text-sm">
          <AppIcon icon="building" class="w-4 h-4" />
          Review Stores
        </RouterLink>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading">
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div v-for="i in 6" :key="i" class="h-24 rounded-2xl bg-warm-200 dark:bg-warm-800 animate-pulse"></div>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="h-64 rounded-2xl bg-warm-200 dark:bg-warm-800 animate-pulse"></div>
        <div class="h-64 rounded-2xl bg-warm-200 dark:bg-warm-800 animate-pulse"></div>
      </div>
    </div>

    <template v-else>
      <!-- Stat Cards -->
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div class="stat-card group">
          <div class="stat-icon bg-primary-50 dark:bg-primary-900/30">
            <AppIcon icon="users" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h4 class="stat-value">{{ stats.total_clients }}</h4>
            <span class="stat-label">Total Clients</span>
          </div>
        </div>
        <div class="stat-card group">
          <div class="stat-icon bg-accent/10 dark:bg-accent/20">
            <AppIcon icon="building" class="w-5 h-5 text-accent dark:text-amber-400" />
          </div>
          <div>
            <h4 class="stat-value">{{ stats.total_stores }}</h4>
            <span class="stat-label">Total Stores</span>
          </div>
        </div>
        <div class="stat-card group">
          <div class="stat-icon bg-amber-50 dark:bg-amber-900/30">
            <AppIcon icon="clock" class="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h4 class="stat-value text-amber-600 dark:text-amber-400 flex items-center gap-2">
              {{ stats.pending_stores }}
              <span v-if="stats.pending_stores > 0" class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white dark:bg-warm-800 text-amber-600 dark:text-amber-400 text-[10px] font-bold shadow-soft">!</span>
            </h4>
            <span class="stat-label">Pending Stores</span>
          </div>
        </div>
        <div class="stat-card group">
          <div class="stat-icon bg-primary-50 dark:bg-primary-900/30">
            <AppIcon icon="map-pin" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h4 class="stat-value">{{ stats.total_venues }}</h4>
            <span class="stat-label">Total Venues</span>
          </div>
        </div>
        <div class="stat-card group">
          <div class="stat-icon bg-emerald-50 dark:bg-emerald-900/30">
            <AppIcon icon="calendar-event" class="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h4 class="stat-value">{{ stats.total_bookings }}</h4>
            <span class="stat-label">Bookings</span>
          </div>
        </div>
        <div class="stat-card group">
          <div class="stat-icon bg-emerald-50 dark:bg-emerald-900/30">
            <AppIcon icon="dollar-sign" class="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h5 class="stat-value text-emerald-600 dark:text-emerald-400">{{ formatRevenue(stats.total_revenue) }}</h5>
            <span class="stat-label">Revenue</span>
          </div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div class="card">
          <div class="px-5 pt-5 pb-2 border-b border-warm-100 dark:border-warm-800">
            <h5 class="text-base font-semibold text-warm-900 dark:text-warm-50">Revenue Trend (Last 7 Days)</h5>
          </div>
          <div class="p-5"><LineChart :data="revenueData" color="#10B981" /></div>
        </div>
        <div class="card">
          <div class="px-5 pt-5 pb-2 border-b border-warm-100 dark:border-warm-800">
            <h5 class="text-base font-semibold text-warm-900 dark:text-warm-50">Bookings Overview (Last 7 Days)</h5>
          </div>
          <div class="p-5"><BarChart :data="bookingsData" :colors="['#10B981', '#F97066', '#059669', '#F59E0B', '#0D9488', '#047857', '#10B981']" /></div>
        </div>
      </div>

      <!-- Donut + Activity -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div class="card">
          <div class="px-5 pt-5 pb-2 border-b border-warm-100 dark:border-warm-800">
            <h5 class="text-base font-semibold text-warm-900 dark:text-warm-50">Booking Status Distribution</h5>
          </div>
          <div class="p-5"><DonutChart :data="bookingStatusData" /></div>
        </div>
        <div class="card">
          <div class="px-5 pt-5 pb-2 border-b border-warm-100 dark:border-warm-800">
            <h5 class="text-base font-semibold text-warm-900 dark:text-warm-50">Recent Activity</h5>
          </div>
          <div class="p-5">
            <div class="space-y-4">
              <div v-for="(activity, index) in recentActivity" :key="index" class="flex gap-3 relative">
                <!-- Timeline line -->
                <div v-if="index < recentActivity.length - 1" class="absolute left-[13px] top-8 bottom-0 w-0.5 bg-warm-100 dark:bg-warm-800"></div>
                <!-- Indicator -->
                <div class="w-7 h-7 rounded-full bg-primary-50 dark:bg-primary-900/30 border-2 border-white dark:border-warm-900 flex items-center justify-center flex-shrink-0 z-10 shadow-soft">
                  <AppIcon v-if="activity.type === 'booking'" icon="calendar-event" class="w-3 h-3 text-primary-600 dark:text-primary-400" />
                  <AppIcon v-else-if="activity.type === 'store'" icon="building" class="w-3 h-3 text-primary-600 dark:text-primary-400" />
                  <AppIcon v-else icon="user" class="w-3 h-3 text-primary-600 dark:text-primary-400" />
                </div>
                <!-- Content -->
                <div class="flex-1 pt-0.5">
                  <p class="text-sm font-medium text-warm-800 dark:text-warm-200 mb-0.5">{{ activity.text }}</p>
                  <span class="text-xs text-warm-400 dark:text-warm-500">{{ activity.time }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tables -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <!-- Recent Bookings -->
        <div class="card">
          <div class="px-5 pt-5 pb-3 flex items-center justify-between border-b border-warm-100 dark:border-warm-800">
            <h5 class="text-base font-semibold text-warm-900 dark:text-warm-50">Recent Bookings</h5>
            <RouterLink to="/support/bookings" class="btn-ghost text-xs inline-flex items-center gap-1">
              View all <AppIcon icon="chevron-right" class="w-3.5 h-3.5" />
            </RouterLink>
          </div>
          <div v-if="!recentBookings.length" class="p-5 text-center py-8">
            <div class="w-12 h-12 rounded-2xl bg-warm-100 dark:bg-warm-800 flex items-center justify-center mx-auto mb-3">
              <AppIcon icon="calendar-event" class="w-6 h-6 text-warm-400" />
            </div>
            <p class="text-sm text-warm-500 dark:text-warm-400">No bookings yet</p>
          </div>
          <div v-else class="table-wrapper">
            <table class="w-full">
              <thead>
                <tr class="table-header">
                  <th class="text-left px-5 py-3 text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">Client</th>
                  <th class="text-left px-5 py-3 text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">Venue</th>
                  <th class="text-left px-5 py-3 text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">Status</th>
                  <th class="text-right px-5 py-3 text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="b in recentBookings" :key="b.id" class="table-row">
                  <td class="px-5 py-3">
                    <div class="flex items-center gap-2">
                      <div class="w-7 h-7 rounded-lg bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0">
                        <span class="text-[10px] font-bold text-primary-700 dark:text-primary-300">{{ b.client?.name?.[0]?.toUpperCase() }}</span>
                      </div>
                      <span class="text-sm font-medium text-warm-800 dark:text-warm-200">{{ b.client?.name }}</span>
                    </div>
                  </td>
                  <td class="px-5 py-3 text-sm text-warm-500 dark:text-warm-400">{{ b.venue?.name }}</td>
                  <td class="px-5 py-3"><span :class="statusClass(b.status)" class="capitalize">{{ b.status }}</span></td>
                  <td class="px-5 py-3 text-right text-sm font-medium text-warm-700 dark:text-warm-300">PKR {{ Number(b.total_amount).toLocaleString() }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Recent Stores -->
        <div class="card">
          <div class="px-5 pt-5 pb-3 flex items-center justify-between border-b border-warm-100 dark:border-warm-800">
            <h5 class="text-base font-semibold text-warm-900 dark:text-warm-50">Recent Stores</h5>
            <RouterLink to="/support/stores" class="btn-ghost text-xs inline-flex items-center gap-1">
              View all <AppIcon icon="chevron-right" class="w-3.5 h-3.5" />
            </RouterLink>
          </div>
          <div v-if="!recentStores.length" class="p-5 text-center py-8">
            <div class="w-12 h-12 rounded-2xl bg-warm-100 dark:bg-warm-800 flex items-center justify-center mx-auto mb-3">
              <AppIcon icon="building" class="w-6 h-6 text-warm-400" />
            </div>
            <p class="text-sm text-warm-500 dark:text-warm-400">No stores yet</p>
          </div>
          <div v-else class="p-5">
            <div class="divide-y divide-warm-100 dark:divide-warm-800">
              <div v-for="s in recentStores" :key="s.id" class="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:bg-warm-50 dark:hover:bg-warm-800/50 -mx-2 px-2 rounded-xl transition-colors">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-xl bg-accent/10 dark:bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <span class="text-xs font-bold text-accent dark:text-amber-400">{{ s.name?.[0]?.toUpperCase() }}</span>
                  </div>
                  <div>
                    <h6 class="text-sm font-semibold text-warm-800 dark:text-warm-200 mb-0">{{ s.name }}</h6>
                    <span class="text-xs text-warm-400 dark:text-warm-500">{{ s.owner?.email }}</span>
                  </div>
                </div>
                <span :class="storeStatusClass(s.status)" class="capitalize">{{ s.status }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Admin Actions -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <RouterLink to="/support/users" class="card-hover flex items-center gap-3 p-4 group">
          <div class="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center group-hover:bg-primary-100 dark:group-hover:bg-primary-900/50 transition-colors flex-shrink-0">
            <AppIcon icon="users" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h6 class="text-sm font-semibold text-warm-800 dark:text-warm-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">Manage Users</h6>
            <span class="text-xs text-warm-500 dark:text-warm-400">{{ stats.total_clients }} clients</span>
          </div>
        </RouterLink>

        <RouterLink to="/support/stores" class="card-hover flex items-center gap-3 p-4 group">
          <div class="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center group-hover:bg-amber-100 dark:group-hover:bg-amber-900/50 transition-colors flex-shrink-0 relative">
            <AppIcon icon="building" class="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <span v-if="stats.pending_stores > 0" class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-coral text-white text-[10px] font-bold flex items-center justify-center shadow-soft">{{ stats.pending_stores }}</span>
          </div>
          <div>
            <h6 class="text-sm font-semibold text-warm-800 dark:text-warm-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">Review Stores</h6>
            <span class="text-xs text-warm-500 dark:text-warm-400">{{ stats.pending_stores }} awaiting</span>
          </div>
        </RouterLink>

        <RouterLink to="/support/venues" class="card-hover flex items-center gap-3 p-4 group">
          <div class="w-10 h-10 rounded-xl bg-accent/10 dark:bg-accent/20 flex items-center justify-center group-hover:bg-accent/20 dark:group-hover:bg-accent/30 transition-colors flex-shrink-0">
            <AppIcon icon="map-pin" class="w-5 h-5 text-accent dark:text-amber-400" />
          </div>
          <div>
            <h6 class="text-sm font-semibold text-warm-800 dark:text-warm-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">All Venues</h6>
            <span class="text-xs text-warm-500 dark:text-warm-400">{{ stats.total_venues }} venues</span>
          </div>
        </RouterLink>

        <RouterLink to="/support/bookings" class="card-hover flex items-center gap-3 p-4 group">
          <div class="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 transition-colors flex-shrink-0">
            <AppIcon icon="file-text" class="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h6 class="text-sm font-semibold text-warm-800 dark:text-warm-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">All Bookings</h6>
            <span class="text-xs text-warm-500 dark:text-warm-400">{{ stats.total_bookings }} total</span>
          </div>
        </RouterLink>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { RouterLink } from 'vue-router'
import api from '@/lib/axios'
import { useAuthStore } from '@/stores/auth'
import AppIcon from '@/components/ui/AppIcon.vue'
import LineChart from '@/components/charts/LineChart.vue'
import BarChart from '@/components/charts/BarChart.vue'
import DonutChart from '@/components/charts/DonutChart.vue'

const authStore = useAuthStore()
const loading = ref(true)
const stats = reactive({ total_clients: 0, total_stores: 0, pending_stores: 0, total_venues: 0, total_bookings: 0, total_revenue: 0 })
const recentBookings = ref<any[]>([])
const recentStores = ref<any[]>([])

const today = new Date().toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

const revenueData = computed(() => [
  { label: 'Mon', value: 12000 },
  { label: 'Tue', value: 19000 },
  { label: 'Wed', value: 15000 },
  { label: 'Thu', value: 25000 },
  { label: 'Fri', value: 22000 },
  { label: 'Sat', value: 30000 },
  { label: 'Sun', value: 28000 },
])

const bookingsData = computed(() => [
  { label: 'Mon', value: 12 },
  { label: 'Tue', value: 19 },
  { label: 'Wed', value: 15 },
  { label: 'Thu', value: 25 },
  { label: 'Fri', value: 22 },
  { label: 'Sat', value: 30 },
  { label: 'Sun', value: 28 },
])

const bookingStatusData = computed(() => [
  { label: 'Confirmed', value: 45, color: '#10B981' },
  { label: 'Pending', value: 25, color: '#F59E0B' },
  { label: 'Completed', value: 20, color: '#059669' },
  { label: 'Cancelled', value: 10, color: '#F97066' },
])

const recentActivity = computed(() => [
  { type: 'booking', text: 'New booking from John Doe', time: '2 minutes ago' },
  { type: 'store', text: 'Store "Event Palace" submitted for approval', time: '15 minutes ago' },
  { type: 'user', text: 'New user registration: Jane Smith', time: '1 hour ago' },
  { type: 'booking', text: 'Booking #1234 was confirmed', time: '2 hours ago' },
  { type: 'store', text: 'Store "Grand Hall" approved', time: '3 hours ago' },
])

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/admin/dashboard')
    Object.assign(stats, data.data.stats)
    recentBookings.value = data.data.recent_bookings
    recentStores.value = data.data.recent_stores
  } finally { loading.value = false }
}

function formatRevenue(v: number) {
  if (v >= 1_000_000) return `PKR ${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `PKR ${(v / 1_000).toFixed(0)}K`
  return `PKR ${Number(v || 0).toLocaleString()}`
}

function statusClass(s: string) {
  const m: Record<string, string> = { pending: 'badge-accent', confirmed: 'badge-primary', completed: 'badge-primary', cancelled: 'badge-coral', rejected: 'badge-coral' }
  return m[s] || 'badge-warm'
}

function storeStatusClass(s: string) {
  const m: Record<string, string> = { approved: 'badge-primary', pending: 'badge-accent', suspended: 'badge-coral', rejected: 'badge-coral' }
  return m[s] || 'badge-warm'
}

onMounted(load)
</script>
