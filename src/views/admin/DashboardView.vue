<template>
  <div class="page-container">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Dashboard</h1>
        <p class="page-subtitle">Welcome back, {{ authStore.user?.name?.split(' ')[0] }}. Here's what's happening today.</p>
      </div>
      <div class="flex items-center gap-3">
        <div class="text-sm text-surface-400 font-medium hidden sm:block">{{ today }}</div>
        <RouterLink to="/admin-panel/stores" class="btn-white btn-sm gap-1.5">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16"/></svg>
          Review Stores
        </RouterLink>
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

    <template v-else>
      <!-- Stat Cards -->
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div class="stat-card stat-card-accent" style="--accent-color: var(--color-primary-500);">
          <div class="stat-icon bg-primary-100">
            <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          </div>
          <div><div class="kpi-value">{{ stats.total_clients }}</div><div class="stat-label">Total Clients</div></div>
        </div>
        <div class="stat-card stat-card-accent" style="--accent-color: var(--color-info-500);">
          <div class="stat-icon bg-info-100">
            <svg class="w-5 h-5 text-info-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
          </div>
          <div><div class="kpi-value">{{ stats.total_stores }}</div><div class="stat-label">Total Stores</div></div>
        </div>
        <div class="stat-card stat-card-accent" style="--accent-color: var(--color-warning-500);">
          <div class="stat-icon bg-warning-100">
            <svg class="w-5 h-5 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <div>
            <div class="kpi-value text-warning-600 flex items-center gap-1.5">
              {{ stats.pending_stores }}
              <span v-if="stats.pending_stores > 0" class="notification-dot" style="position:static;width:8px;height:8px;"></span>
            </div>
            <div class="stat-label">Pending Stores</div>
          </div>
        </div>
        <div class="stat-card stat-card-accent" style="--accent-color: var(--color-accent-500);">
          <div class="stat-icon bg-accent-100">
            <svg class="w-5 h-5 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          </div>
          <div><div class="kpi-value">{{ stats.total_venues }}</div><div class="stat-label">Total Venues</div></div>
        </div>
        <div class="stat-card stat-card-accent" style="--accent-color: var(--color-success-500);">
          <div class="stat-icon bg-success-100">
            <svg class="w-5 h-5 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          </div>
          <div><div class="kpi-value">{{ stats.total_bookings }}</div><div class="stat-label">Bookings</div></div>
        </div>
        <div class="stat-card stat-card-accent" style="--accent-color: var(--color-success-500);">
          <div class="stat-icon bg-success-100">
            <svg class="w-5 h-5 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <div><div class="kpi-value text-success-600 !text-base">{{ formatRevenue(stats.total_revenue) }}</div><div class="stat-label">Revenue</div></div>
        </div>
      </div>

      <!-- Tables -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Recent Bookings -->
        <div class="card">
          <div class="card-body">
            <div class="flex items-center justify-between mb-5">
              <h2 class="section-title">Recent Bookings</h2>
              <RouterLink to="/admin-panel/bookings" class="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                View all <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
              </RouterLink>
            </div>
            <div v-if="!recentBookings.length" class="empty-state py-8">
              <div class="empty-state-icon"><svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg></div>
              <p class="empty-state-title">No bookings yet</p>
            </div>
            <div v-else class="table-wrapper">
              <table class="table">
                <thead><tr>
                  <th>Client</th><th>Venue</th><th>Status</th><th class="text-right">Amount</th>
                </tr></thead>
                <tbody>
                  <tr v-for="b in recentBookings" :key="b.id">
                    <td>
                      <div class="flex items-center gap-2.5">
                        <div class="w-7 h-7 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0 shadow-glow-sm">
                          <span class="text-2xs font-bold text-white">{{ b.client?.name?.[0]?.toUpperCase() }}</span>
                        </div>
                        <span class="font-medium text-surface-800">{{ b.client?.name }}</span>
                      </div>
                    </td>
                    <td class="text-surface-500">{{ b.venue?.name }}</td>
                    <td><span :class="statusClass(b.status)" class="capitalize">{{ b.status }}</span></td>
                    <td class="text-right font-medium text-surface-700">PKR {{ Number(b.total_amount).toLocaleString() }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Recent Stores -->
        <div class="card">
          <div class="card-body">
            <div class="flex items-center justify-between mb-5">
              <h2 class="section-title">Recent Stores</h2>
              <RouterLink to="/admin-panel/stores" class="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                View all <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
              </RouterLink>
            </div>
            <div v-if="!recentStores.length" class="empty-state py-8">
              <div class="empty-state-icon"><svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16"/></svg></div>
              <p class="empty-state-title">No stores yet</p>
            </div>
            <div v-else class="divide-y divide-surface-100">
              <div v-for="s in recentStores" :key="s.id" class="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0 shadow-glow-sm">
                    <span class="text-xs font-bold text-white">{{ s.name?.[0]?.toUpperCase() }}</span>
                  </div>
                  <div>
                    <p class="text-sm font-semibold text-surface-800">{{ s.name }}</p>
                    <p class="text-xs text-surface-400">{{ s.owner?.email }}</p>
                  </div>
                </div>
                <span :class="storeStatusClass(s.status)" class="capitalize">{{ s.status }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Admin Actions -->
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <RouterLink to="/admin-panel/users" class="card card-body flex items-center gap-3 hover:shadow-md hover:border-primary-200 border border-transparent transition-all group">
          <div class="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center group-hover:bg-primary-200 transition-colors flex-shrink-0">
            <svg class="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          </div>
          <div>
            <p class="text-sm font-semibold text-surface-800">Manage Users</p>
            <p class="text-xs text-surface-500">{{ stats.total_clients }} clients</p>
          </div>
        </RouterLink>

        <RouterLink to="/admin-panel/stores" class="card card-body flex items-center gap-3 hover:shadow-md hover:border-warning-200 border border-transparent transition-all group">
          <div class="w-9 h-9 rounded-xl bg-warning-100 flex items-center justify-center group-hover:bg-warning-200 transition-colors flex-shrink-0 relative">
            <svg class="w-4 h-4 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16"/></svg>
            <span v-if="stats.pending_stores > 0" class="notification-dot">{{ stats.pending_stores }}</span>
          </div>
          <div>
            <p class="text-sm font-semibold text-surface-800">Review Stores</p>
            <p class="text-xs text-surface-500">{{ stats.pending_stores }} awaiting approval</p>
          </div>
        </RouterLink>

        <RouterLink to="/admin-panel/venues" class="card card-body flex items-center gap-3 hover:shadow-md hover:border-accent-200 border border-transparent transition-all group">
          <div class="w-9 h-9 rounded-xl bg-accent-100 flex items-center justify-center group-hover:bg-accent-200 transition-colors flex-shrink-0">
            <svg class="w-4 h-4 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/></svg>
          </div>
          <div>
            <p class="text-sm font-semibold text-surface-800">All Venues</p>
            <p class="text-xs text-surface-500">{{ stats.total_venues }} venues listed</p>
          </div>
        </RouterLink>

        <RouterLink to="/admin-panel/bookings" class="card card-body flex items-center gap-3 hover:shadow-md hover:border-success-200 border border-transparent transition-all group">
          <div class="w-9 h-9 rounded-xl bg-success-100 flex items-center justify-center group-hover:bg-success-200 transition-colors flex-shrink-0">
            <svg class="w-4 h-4 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
          </div>
          <div>
            <p class="text-sm font-semibold text-surface-800">All Bookings</p>
            <p class="text-xs text-surface-500">{{ stats.total_bookings }} total</p>
          </div>
        </RouterLink>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import api from '@/lib/axios'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const loading = ref(true)
const stats = reactive({ total_clients: 0, total_stores: 0, pending_stores: 0, total_venues: 0, total_bookings: 0, total_revenue: 0 })
const recentBookings = ref<any[]>([])
const recentStores = ref<any[]>([])

const today = new Date().toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

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
  const m: Record<string, string> = { pending: 'badge-warning', confirmed: 'badge-success', completed: 'badge-info', cancelled: 'badge-danger', rejected: 'badge-danger' }
  return m[s] || 'badge-gray'
}

function storeStatusClass(s: string) {
  const m: Record<string, string> = { approved: 'badge-success', pending: 'badge-warning', suspended: 'badge-danger', rejected: 'badge-danger' }
  return m[s] || 'badge-gray'
}

onMounted(load)
</script>
