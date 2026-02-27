<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h1 class="page-title">Dashboard</h1>
        <p class="page-subtitle">{{ data?.store?.name ? `Overview for ${data.store.name}` : 'Welcome to your store panel.' }}</p>
      </div>
      <div class="flex gap-3" v-if="data?.has_store && data?.store?.status === 'approved'">
        <RouterLink to="/shop/venues/create" class="btn-primary btn-sm gap-1.5">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          Add Venue
        </RouterLink>
        <RouterLink to="/shop/bookings" class="btn-white btn-sm">View Bookings</RouterLink>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-6">
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div v-for="i in 6" :key="i" class="skeleton h-24 rounded-xl"></div>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="skeleton h-64 rounded-xl"></div>
        <div class="skeleton h-64 rounded-xl"></div>
      </div>
    </div>

    <!-- Setup prompt -->
    <div v-else-if="!data?.has_store" class="card">
      <div class="card-body flex flex-col items-center py-16 text-center">
        <div class="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mb-4">
          <svg class="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
        </div>
        <h3 class="text-lg font-semibold text-surface-800">Set up your store</h3>
        <p class="text-surface-500 mt-1 max-w-sm">Complete your store profile to start listing venues and accepting bookings.</p>
        <RouterLink to="/shop/profile" class="btn-primary mt-5">Set Up Store</RouterLink>
      </div>
    </div>

    <template v-else>
      <!-- Store status alert -->
      <div v-if="data.store?.status !== 'approved'"
        :class="data.store?.status === 'pending' ? 'alert-warning' : 'alert-danger'"
        class="alert">
        <svg class="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
        <p>Your store is currently <strong class="capitalize">{{ data.store?.status }}</strong>.
          <span v-if="data.store?.status === 'pending'"> Waiting for admin approval before you can add venues.</span>
          <span v-else-if="data.store?.status === 'suspended'"> Contact support if you believe this is a mistake.</span>
        </p>
      </div>

      <!-- Stat Cards (Gradient) -->
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div class="stat-card-gradient gradient-sky">
          <div class="stat-icon w-10 h-10 rounded-xl mb-3">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          </div>
          <div class="kpi-value text-2xl">{{ data.stats?.total_venues || 0 }}</div>
          <div class="stat-label">Venues</div>
        </div>
        <div class="stat-card-gradient gradient-green">
          <div class="stat-icon w-10 h-10 rounded-xl mb-3">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <div class="kpi-value text-2xl">{{ data.stats?.active_venues || 0 }}</div>
          <div class="stat-label">Active</div>
        </div>
        <div class="stat-card-gradient gradient-gold">
          <div class="stat-icon w-10 h-10 rounded-xl mb-3">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          </div>
          <div class="kpi-value text-2xl">{{ data.stats?.total_bookings || 0 }}</div>
          <div class="stat-label">Bookings</div>
        </div>
        <div class="stat-card-gradient gradient-amber">
          <div class="stat-icon w-10 h-10 rounded-xl mb-3">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <div class="kpi-value text-2xl">{{ data.stats?.pending_bookings || 0 }}</div>
          <div class="stat-label">Pending</div>
        </div>
        <div class="stat-card-gradient gradient-indigo">
          <div class="stat-icon w-10 h-10 rounded-xl mb-3">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
          </div>
          <div class="kpi-value text-2xl">{{ data.stats?.confirmed_bookings || 0 }}</div>
          <div class="stat-label">Confirmed</div>
        </div>
        <div class="stat-card-gradient gradient-rose">
          <div class="stat-icon w-10 h-10 rounded-xl mb-3">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <div class="kpi-value text-lg">{{ formatRevenue(data.stats?.total_revenue) }}</div>
          <div class="stat-label">Revenue</div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Revenue Chart -->
        <div class="card">
          <div class="card-body">
            <h2 class="section-title mb-4">Revenue Trend (Last 7 Days)</h2>
            <LineChart :data="revenueData" color="#10b981" />
          </div>
        </div>

        <!-- Bookings Chart -->
        <div class="card">
          <div class="card-body">
            <h2 class="section-title mb-4">Bookings by Venue</h2>
            <BarChart :data="venueBookingsData" />
          </div>
        </div>
      </div>

      <!-- Recent Bookings Table -->
      <div class="card">
        <div class="card-body">
          <div class="flex items-center justify-between mb-5">
            <h2 class="section-title">Recent Bookings</h2>
            <RouterLink to="/shop/bookings" class="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              View all <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            </RouterLink>
          </div>
          <div v-if="!data.recent_bookings?.length" class="empty-state py-10">
            <div class="empty-state-icon"><svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg></div>
            <p class="empty-state-title">No bookings yet</p>
            <p class="empty-state-desc">Bookings will appear here once clients start booking your venues.</p>
          </div>
          <div v-else class="table-wrapper">
            <table class="table">
              <thead><tr>
                <th>Booking #</th><th>Client</th><th>Venue</th><th>Date</th><th>Status</th><th class="text-right">Amount</th>
              </tr></thead>
              <tbody>
                <tr v-for="b in data.recent_bookings" :key="b.id">
                  <td class="font-mono text-xs text-primary-600 font-semibold">{{ b.booking_number }}</td>
                  <td class="font-medium text-surface-800">{{ b.client?.name }}</td>
                  <td class="text-surface-500">{{ b.venue?.name }}</td>
                  <td class="text-surface-500 text-xs whitespace-nowrap">{{ formatDate(b.event_date) }}</td>
                  <td><span :class="statusClass(b.status)" class="capitalize">{{ b.status }}</span></td>
                  <td class="text-right font-semibold text-surface-800">PKR {{ Number(b.total_amount).toLocaleString() }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Quick Actions (approved stores only) -->
      <div v-if="data.store?.status === 'approved'" class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <RouterLink to="/shop/venues" class="card card-body flex items-center gap-4 hover:shadow-md hover:border-accent-200 border border-transparent transition-all group">
          <div class="w-10 h-10 rounded-xl bg-accent-100 flex items-center justify-center group-hover:bg-accent-200 transition-colors flex-shrink-0">
            <svg class="w-5 h-5 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
            </svg>
          </div>
          <div>
            <p class="text-sm font-semibold text-surface-800">Manage Venues</p>
            <p class="text-xs text-surface-500">{{ data.stats?.total_venues || 0 }} venue{{ data.stats?.total_venues !== 1 ? 's' : '' }} listed</p>
          </div>
        </RouterLink>

        <RouterLink to="/shop/bookings" class="card card-body flex items-center gap-4 hover:shadow-md hover:border-primary-200 border border-transparent transition-all group">
          <div class="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center group-hover:bg-primary-200 transition-colors flex-shrink-0">
            <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
          </div>
          <div>
            <p class="text-sm font-semibold text-surface-800">All Bookings</p>
            <p class="text-xs text-surface-500">{{ data.stats?.pending_bookings || 0 }} pending review</p>
          </div>
        </RouterLink>

        <RouterLink to="/shop/profile" class="card card-body flex items-center gap-4 hover:shadow-md hover:border-secondary-200 border border-transparent transition-all group">
          <div class="w-10 h-10 rounded-xl bg-secondary-100 flex items-center justify-center group-hover:bg-secondary-200 transition-colors flex-shrink-0">
            <svg class="w-5 h-5 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
          </div>
          <div>
            <p class="text-sm font-semibold text-surface-800">Store Profile</p>
            <p class="text-xs text-surface-500">Update store information</p>
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

const loading = ref(true)
const data = ref<any>(null)

// Sample chart data (replace with real data from API)
const revenueData = computed(() => [
  { label: 'Mon', value: 8000 },
  { label: 'Tue', value: 12000 },
  { label: 'Wed', value: 10000 },
  { label: 'Thu', value: 15000 },
  { label: 'Fri', value: 18000 },
  { label: 'Sat', value: 22000 },
  { label: 'Sun', value: 20000 },
])

const venueBookingsData = computed(() => {
  // This would come from API - showing top 5 venues by bookings
  return [
    { label: 'Grand Hall', value: 25 },
    { label: 'Garden View', value: 18 },
    { label: 'Rooftop', value: 15 },
    { label: 'Conference', value: 12 },
    { label: 'Banquet', value: 8 },
  ]
})

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
  const m: Record<string, string> = { pending: 'badge-warning', confirmed: 'badge-success', completed: 'badge-info', cancelled: 'badge-danger', rejected: 'badge-danger' }
  return m[s] || 'badge-gray'
}

onMounted(load)
</script>
