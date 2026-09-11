<template>
  <div class="content-container">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-warm-900 dark:text-warm-50">Dashboard</h1>
        <p class="text-warm-500 dark:text-warm-400 mt-1">Welcome back, {{ authStore.user?.name?.split(' ')[0] }}. Here's what's happening today.</p>
      </div>
      <div class="flex items-center gap-3">
        <div class="text-sm text-warm-400 dark:text-warm-500 font-medium hidden sm:block">{{ today }}</div>
        <RouterLink to="/support/stores" class="btn-outline inline-flex items-center gap-1.5 text-sm">
          <AppIcon icon="building" class="w-3.5 h-3.5" />
          Review Stores
        </RouterLink>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-6">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div v-for="i in 6" :key="i" class="h-24 rounded-2xl bg-warm-200 dark:bg-warm-800 animate-pulse"></div>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="h-64 rounded-2xl bg-warm-200 dark:bg-warm-800 animate-pulse"></div>
        <div class="h-64 rounded-2xl bg-warm-200 dark:bg-warm-800 animate-pulse"></div>
      </div>
    </div>

    <template v-else>
      <!-- Stat Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div class="stat-card">
          <div class="stat-icon bg-primary-50 dark:bg-primary-900/30">
            <AppIcon icon="users" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <div class="stat-value">{{ stats.total_clients }}</div>
            <div class="stat-label">Total Clients</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon bg-accent/10 dark:bg-accent/20">
            <AppIcon icon="building" class="w-5 h-5 text-accent dark:text-amber-400" />
          </div>
          <div>
            <div class="stat-value">{{ stats.total_stores }}</div>
            <div class="stat-label">Total Stores</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon bg-amber-50 dark:bg-amber-900/30">
            <AppIcon icon="clock" class="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <div class="stat-value text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              {{ stats.pending_stores }}
              <span v-if="stats.pending_stores > 0" class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            </div>
            <div class="stat-label">Pending Stores</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon bg-primary-50 dark:bg-primary-900/30">
            <AppIcon icon="map-pin" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <div class="stat-value">{{ stats.total_venues }}</div>
            <div class="stat-label">Total Venues</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon bg-emerald-50 dark:bg-emerald-900/30">
            <AppIcon icon="calendar-event" class="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <div class="stat-value">{{ stats.total_bookings }}</div>
            <div class="stat-label">Bookings</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon bg-emerald-50 dark:bg-emerald-900/30">
            <AppIcon icon="dollar-sign" class="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <div class="stat-value text-emerald-600 dark:text-emerald-400 !text-base">{{ formatRevenue(stats.total_revenue) }}</div>
            <div class="stat-label">Revenue</div>
          </div>
        </div>
      </div>

      <!-- Tables -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <!-- Recent Bookings -->
        <div class="card">
          <div class="p-5 pb-0">
            <div class="flex items-center justify-between mb-5">
              <h2 class="text-base font-semibold text-warm-900 dark:text-warm-50">Recent Bookings</h2>
              <RouterLink to="/support/bookings" class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium flex items-center gap-1">
                View all <AppIcon icon="chevron-right" class="w-3.5 h-3.5" />
              </RouterLink>
            </div>
          </div>
          <div v-if="!recentBookings.length" class="px-5 pb-5 text-center py-8">
            <div class="w-12 h-12 rounded-2xl bg-warm-100 dark:bg-warm-800 flex items-center justify-center mx-auto mb-3">
              <AppIcon icon="calendar-event" class="w-6 h-6 text-warm-400" />
            </div>
            <p class="text-sm font-medium text-warm-500 dark:text-warm-400">No bookings yet</p>
          </div>
          <div v-else class="table-wrapper overflow-x-auto">
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
                    <div class="flex items-center gap-2.5">
                      <div class="w-7 h-7 rounded-xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0">
                        <span class="text-[10px] font-bold text-primary-700 dark:text-primary-300">{{ b.client?.name?.[0]?.toUpperCase() }}</span>
                      </div>
                      <span class="font-medium text-warm-800 dark:text-warm-200 text-sm">{{ b.client?.name }}</span>
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
          <div class="p-5">
            <div class="flex items-center justify-between mb-5">
              <h2 class="text-base font-semibold text-warm-900 dark:text-warm-50">Recent Stores</h2>
              <RouterLink to="/support/stores" class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium flex items-center gap-1">
                View all <AppIcon icon="chevron-right" class="w-3.5 h-3.5" />
              </RouterLink>
            </div>
            <div v-if="!recentStores.length" class="text-center py-8">
              <div class="w-12 h-12 rounded-2xl bg-warm-100 dark:bg-warm-800 flex items-center justify-center mx-auto mb-3">
                <AppIcon icon="building" class="w-6 h-6 text-warm-400" />
              </div>
              <p class="text-sm font-medium text-warm-500 dark:text-warm-400">No stores yet</p>
            </div>
            <div v-else class="divide-y divide-warm-100 dark:divide-warm-800">
              <div v-for="s in recentStores" :key="s.id" class="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-accent/10 dark:bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <span class="text-xs font-bold text-accent dark:text-amber-400">{{ s.name?.[0]?.toUpperCase() }}</span>
                  </div>
                  <div>
                    <p class="text-sm font-semibold text-warm-800 dark:text-warm-200">{{ s.name }}</p>
                    <p class="text-xs text-warm-400 dark:text-warm-500">{{ s.owner?.email }}</p>
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
          <div class="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center group-hover:bg-primary-100 dark:group-hover:bg-primary-900/50 transition-colors flex-shrink-0">
            <AppIcon icon="users" class="w-4 h-4 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <p class="text-sm font-semibold text-warm-800 dark:text-warm-200">Manage Users</p>
            <p class="text-xs text-warm-500 dark:text-warm-400">{{ stats.total_clients }} clients</p>
          </div>
        </RouterLink>

        <RouterLink to="/support/stores" class="card-hover flex items-center gap-3 p-4 group">
          <div class="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center group-hover:bg-amber-100 dark:group-hover:bg-amber-900/50 transition-colors flex-shrink-0 relative">
            <AppIcon icon="building" class="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span v-if="stats.pending_stores > 0" class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-coral text-white text-[9px] font-bold flex items-center justify-center">{{ stats.pending_stores }}</span>
          </div>
          <div>
            <p class="text-sm font-semibold text-warm-800 dark:text-warm-200">Review Stores</p>
            <p class="text-xs text-warm-500 dark:text-warm-400">{{ stats.pending_stores }} awaiting approval</p>
          </div>
        </RouterLink>

        <RouterLink to="/support/venues" class="card-hover flex items-center gap-3 p-4 group">
          <div class="w-9 h-9 rounded-xl bg-accent/10 dark:bg-accent/20 flex items-center justify-center group-hover:bg-accent/20 dark:group-hover:bg-accent/30 transition-colors flex-shrink-0">
            <AppIcon icon="map-pin" class="w-4 h-4 text-accent dark:text-amber-400" />
          </div>
          <div>
            <p class="text-sm font-semibold text-warm-800 dark:text-warm-200">All Venues</p>
            <p class="text-xs text-warm-500 dark:text-warm-400">{{ stats.total_venues }} venues listed</p>
          </div>
        </RouterLink>

        <RouterLink to="/support/bookings" class="card-hover flex items-center gap-3 p-4 group">
          <div class="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 transition-colors flex-shrink-0">
            <AppIcon icon="calendar-event" class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p class="text-sm font-semibold text-warm-800 dark:text-warm-200">All Bookings</p>
            <p class="text-xs text-warm-500 dark:text-warm-400">{{ stats.total_bookings }} total</p>
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
import AppIcon from '@/components/ui/AppIcon.vue'

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
  const m: Record<string, string> = { pending: 'badge-accent', confirmed: 'badge-primary', completed: 'badge-primary', cancelled: 'badge-coral', rejected: 'badge-coral' }
  return m[s] || 'badge-warm'
}

function storeStatusClass(s: string) {
  const m: Record<string, string> = { approved: 'badge-primary', pending: 'badge-accent', suspended: 'badge-coral', rejected: 'badge-coral' }
  return m[s] || 'badge-warm'
}

onMounted(load)
</script>
