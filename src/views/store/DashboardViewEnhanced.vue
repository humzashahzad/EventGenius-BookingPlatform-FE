<template>
  <div class="content-container">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-warm-900 dark:text-warm-50 tracking-tight">Dashboard</h1>
        <p class="text-warm-500 dark:text-warm-400 mt-1">{{ data?.store?.name ? `Overview for ${data.store.name}` : 'Welcome to your store panel.' }}</p>
      </div>
      <div v-if="data?.has_store && data?.store?.status === 'approved'" class="flex items-center gap-3">
        <RouterLink to="/shop/venues/create" class="btn-primary inline-flex items-center gap-1.5 text-sm">
          <AppIcon icon="plus" class="w-4 h-4" />
          Add Venue
        </RouterLink>
        <RouterLink to="/shop/bookings" class="btn-outline inline-flex items-center gap-1.5 text-sm">View Bookings</RouterLink>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-6">
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div v-for="i in 6" :key="i" class="skeleton h-24 rounded-2xl"></div>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="skeleton h-64 rounded-2xl"></div>
        <div class="skeleton h-64 rounded-2xl"></div>
      </div>
    </div>

    <!-- Setup prompt -->
    <div v-else-if="!data?.has_store" class="card">
      <div class="flex flex-col items-center py-16 text-center px-6">
        <div class="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center mb-4">
          <AppIcon icon="building" class="w-8 h-8 text-primary-600 dark:text-primary-400" />
        </div>
        <h3 class="text-lg font-semibold text-warm-800 dark:text-warm-100">Set up your store</h3>
        <p class="text-warm-500 dark:text-warm-400 mt-1 max-w-sm text-sm">Complete your store profile to start listing venues and accepting bookings.</p>
        <RouterLink to="/shop/profile" class="btn-primary mt-5">Set Up Store</RouterLink>
      </div>
    </div>

    <template v-else>
      <!-- Store status alert -->
      <div v-if="data.store?.status !== 'approved'"
        :class="data.store?.status === 'pending'
          ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300'
          : 'bg-coral/10 dark:bg-coral/20 border-coral/30 text-coral dark:text-red-300'"
        class="flex items-start gap-3 p-4 rounded-2xl border mb-6">
        <AppIcon icon="alert-triangle" class="w-5 h-5 flex-shrink-0 mt-0.5" />
        <p class="text-sm font-medium">Your store is currently <strong class="capitalize">{{ data.store?.status }}</strong>.
          <span v-if="data.store?.status === 'pending'"> Waiting for admin approval before you can add venues.</span>
          <span v-else-if="data.store?.status === 'suspended'"> Contact support if you believe this is a mistake.</span>
        </p>
      </div>

      <!-- Stat Cards -->
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div class="stat-card group">
          <div class="stat-icon bg-accent/10 dark:bg-accent/20">
            <AppIcon icon="map-pin" class="w-5 h-5 text-accent" />
          </div>
          <div>
            <h4 class="stat-value">{{ data.stats?.total_venues || 0 }}</h4>
            <span class="stat-label">Venues</span>
          </div>
        </div>
        <div class="stat-card group">
          <div class="stat-icon bg-primary-100 dark:bg-primary-900/30">
            <AppIcon icon="circle-check" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h4 class="stat-value text-primary-600 dark:text-primary-400">{{ data.stats?.active_venues || 0 }}</h4>
            <span class="stat-label">Active</span>
          </div>
        </div>
        <div class="stat-card group">
          <div class="stat-icon bg-emerald-50 dark:bg-emerald-900/30">
            <AppIcon icon="calendar-event" class="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h4 class="stat-value">{{ data.stats?.total_bookings || 0 }}</h4>
            <span class="stat-label">Bookings</span>
          </div>
        </div>
        <div class="stat-card group">
          <div class="stat-icon bg-amber-50 dark:bg-amber-900/30">
            <AppIcon icon="clock" class="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h4 class="stat-value text-amber-600 dark:text-amber-400">{{ data.stats?.pending_bookings || 0 }}</h4>
            <span class="stat-label">Pending</span>
          </div>
        </div>
        <div class="stat-card group">
          <div class="stat-icon bg-primary-50 dark:bg-primary-900/30">
            <AppIcon icon="check" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h4 class="stat-value text-primary-600 dark:text-primary-400">{{ data.stats?.confirmed_bookings || 0 }}</h4>
            <span class="stat-label">Confirmed</span>
          </div>
        </div>
        <div class="stat-card group">
          <div class="stat-icon bg-emerald-50 dark:bg-emerald-900/30">
            <AppIcon icon="dollar-sign" class="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h5 class="stat-value text-emerald-600 dark:text-emerald-400">{{ formatRevenue(data.stats?.total_revenue) }}</h5>
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
            <h5 class="text-base font-semibold text-warm-900 dark:text-warm-50">Bookings by Venue</h5>
          </div>
          <div class="p-5"><BarChart :data="venueBookingsData" /></div>
        </div>
      </div>

      <!-- Recent Bookings Table -->
      <div class="card mb-8">
        <div class="px-5 pt-5 pb-3 flex items-center justify-between border-b border-warm-100 dark:border-warm-800">
          <h5 class="text-base font-semibold text-warm-900 dark:text-warm-50">Recent Bookings</h5>
          <RouterLink to="/shop/bookings" class="btn-ghost text-xs inline-flex items-center gap-1">
            View all <AppIcon icon="chevron-right" class="w-3.5 h-3.5" />
          </RouterLink>
        </div>
        <div v-if="!data.recent_bookings?.length" class="p-5 text-center py-8">
          <div class="w-12 h-12 rounded-2xl bg-warm-100 dark:bg-warm-800 flex items-center justify-center mx-auto mb-3">
            <AppIcon icon="calendar-event" class="w-6 h-6 text-warm-400" />
          </div>
          <p class="text-sm font-medium text-warm-700 dark:text-warm-300">No bookings yet</p>
          <p class="text-xs text-warm-500 dark:text-warm-400 mt-1">Bookings will appear here once clients start booking your venues.</p>
        </div>
        <div v-else class="table-wrapper">
          <table class="w-full">
            <thead>
              <tr class="table-header">
                <th class="text-left px-5 py-3 text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">Client</th>
                <th class="text-left px-5 py-3 text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">Venue</th>
                <th class="text-left px-5 py-3 text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">Date</th>
                <th class="text-left px-5 py-3 text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">Status</th>
                <th class="text-right px-5 py-3 text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="b in data.recent_bookings" :key="b.id" class="table-row">
                <td class="px-5 py-3">
                  <div class="flex items-center gap-2">
                    <div class="w-7 h-7 rounded-lg bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0">
                      <span class="text-[10px] font-bold text-primary-700 dark:text-primary-300">{{ b.client?.name?.[0]?.toUpperCase() }}</span>
                    </div>
                    <span class="text-sm font-medium text-warm-800 dark:text-warm-200">{{ b.client?.name }}</span>
                  </div>
                </td>
                <td class="px-5 py-3 text-sm text-warm-500 dark:text-warm-400">{{ b.venue?.name }}</td>
                <td class="px-5 py-3 text-sm text-warm-500 dark:text-warm-400 whitespace-nowrap">{{ formatDate(b.event_date) }}</td>
                <td class="px-5 py-3"><span :class="statusClass(b.status)" class="capitalize">{{ b.status }}</span></td>
                <td class="px-5 py-3 text-right text-sm font-medium text-warm-700 dark:text-warm-300">PKR {{ Number(b.total_amount).toLocaleString() }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Quick Actions -->
      <div v-if="data.store?.status === 'approved'" class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <RouterLink to="/shop/venues" class="card-hover flex items-center gap-4 p-5 group">
          <div class="w-10 h-10 rounded-xl bg-accent/10 dark:bg-accent/20 flex items-center justify-center group-hover:bg-accent/20 dark:group-hover:bg-accent/30 transition-colors flex-shrink-0">
            <AppIcon icon="map-pin" class="w-5 h-5 text-accent" />
          </div>
          <div>
            <p class="text-sm font-semibold text-warm-800 dark:text-warm-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">Manage Venues</p>
            <p class="text-xs text-warm-500 dark:text-warm-400">{{ data.stats?.total_venues || 0 }} venue{{ data.stats?.total_venues !== 1 ? 's' : '' }} listed</p>
          </div>
        </RouterLink>

        <RouterLink to="/shop/bookings" class="card-hover flex items-center gap-4 p-5 group">
          <div class="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center group-hover:bg-primary-200 dark:group-hover:bg-primary-800/40 transition-colors flex-shrink-0">
            <AppIcon icon="file-text" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <p class="text-sm font-semibold text-warm-800 dark:text-warm-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">All Bookings</p>
            <p class="text-xs text-warm-500 dark:text-warm-400">{{ data.stats?.pending_bookings || 0 }} pending review</p>
          </div>
        </RouterLink>

        <RouterLink to="/shop/profile" class="card-hover flex items-center gap-4 p-5 group">
          <div class="w-10 h-10 rounded-xl bg-warm-100 dark:bg-warm-800 flex items-center justify-center group-hover:bg-warm-200 dark:group-hover:bg-warm-700 transition-colors flex-shrink-0">
            <AppIcon icon="building" class="w-5 h-5 text-warm-600 dark:text-warm-400" />
          </div>
          <div>
            <p class="text-sm font-semibold text-warm-800 dark:text-warm-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">Store Profile</p>
            <p class="text-xs text-warm-500 dark:text-warm-400">Update store information</p>
          </div>
        </RouterLink>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import api from '@/lib/axios'
import LineChart from '@/components/charts/LineChart.vue'
import BarChart from '@/components/charts/BarChart.vue'
import AppIcon from '@/components/ui/AppIcon.vue'

const loading = ref(true)
const data = ref<any>(null)

const revenueData = computed(() => [
  { label: 'Mon', value: 8000 },
  { label: 'Tue', value: 12000 },
  { label: 'Wed', value: 10000 },
  { label: 'Thu', value: 15000 },
  { label: 'Fri', value: 18000 },
  { label: 'Sat', value: 22000 },
  { label: 'Sun', value: 20000 },
])

const venueBookingsData = computed(() => [
  { label: 'Grand Hall', value: 25 },
  { label: 'Garden View', value: 18 },
  { label: 'Rooftop', value: 15 },
  { label: 'Conference', value: 12 },
  { label: 'Banquet', value: 8 },
])

async function load() {
  loading.value = true
  try {
    const { data: res } = await api.get('/store/dashboard')
    data.value = res.data
  } finally { loading.value = false }
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatRevenue(v: number) {
  if (!v) return 'PKR 0'
  if (v >= 1_000_000) return `PKR ${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `PKR ${(v / 1_000).toFixed(0)}K`
  return `PKR ${Number(v).toLocaleString()}`
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

onMounted(load)
</script>
