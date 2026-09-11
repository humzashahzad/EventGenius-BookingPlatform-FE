<template>
  <div class="content-container">
    <div class="page-header">
      <div>
        <h1 class="text-2xl font-bold text-warm-900 dark:text-warm-50 tracking-tight">Dashboard</h1>
        <p class="text-sm text-warm-500 dark:text-warm-400 mt-1">{{ data?.store?.name ? `Overview for ${data.store.name}` : 'Welcome to your store panel.' }}</p>
      </div>
      <div class="flex gap-3" v-if="data?.has_store && data?.store?.status === 'approved'">
        <RouterLink to="/shop/venues/create" class="btn-primary btn-sm gap-1.5">
          <AppIcon icon="plus" class="w-4 h-4" />
          Add Venue
        </RouterLink>
        <RouterLink to="/shop/bookings" class="btn-outline btn-sm">View Bookings</RouterLink>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-6">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div v-for="i in 6" :key="i" class="skeleton h-24 rounded-2xl"></div>
      </div>
      <div class="skeleton h-64 rounded-2xl"></div>
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
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div class="stat-card">
          <div class="stat-icon bg-accent/10 dark:bg-accent/20">
            <AppIcon icon="map-pin" class="w-5 h-5 text-accent" />
          </div>
          <div><div class="stat-value">{{ data.stats?.total_venues }}</div><div class="stat-label">Venues</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon bg-primary-100 dark:bg-primary-900/30">
            <AppIcon icon="circle-check" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div><div class="stat-value text-primary-600 dark:text-primary-400">{{ data.stats?.active_venues }}</div><div class="stat-label">Active</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon bg-primary-100 dark:bg-primary-900/30">
            <AppIcon icon="calendar-event" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div><div class="stat-value">{{ data.stats?.total_bookings }}</div><div class="stat-label">Bookings</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon bg-amber-100 dark:bg-amber-900/30">
            <AppIcon icon="clock" class="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div><div class="stat-value text-amber-600 dark:text-amber-400">{{ data.stats?.pending_bookings }}</div><div class="stat-label">Pending</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon bg-primary-100 dark:bg-primary-900/30">
            <AppIcon icon="check" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div><div class="stat-value text-primary-600 dark:text-primary-400">{{ data.stats?.confirmed_bookings }}</div><div class="stat-label">Confirmed</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon bg-primary-100 dark:bg-primary-900/30">
            <AppIcon icon="dollar-sign" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div><div class="stat-value text-primary-600 dark:text-primary-400 !text-base">{{ formatRevenue(data.stats?.total_revenue) }}</div><div class="stat-label">Revenue</div></div>
        </div>
      </div>

      <!-- Recent Bookings Table -->
      <div class="card">
        <div class="p-5 sm:p-6">
          <div class="flex items-center justify-between mb-5">
            <h2 class="text-base font-semibold text-warm-900 dark:text-warm-50">Recent Bookings</h2>
            <RouterLink to="/shop/bookings" class="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium flex items-center gap-1 transition-colors">
              View all <AppIcon icon="chevron-right" class="w-3.5 h-3.5" />
            </RouterLink>
          </div>
          <div v-if="!data.recent_bookings?.length" class="flex flex-col items-center py-10 text-center">
            <div class="w-14 h-14 rounded-2xl bg-warm-100 dark:bg-warm-800 flex items-center justify-center mb-3">
              <AppIcon icon="calendar-event" class="w-7 h-7 text-warm-400 dark:text-warm-500" />
            </div>
            <p class="text-sm font-medium text-warm-700 dark:text-warm-300">No bookings yet</p>
            <p class="text-xs text-warm-500 dark:text-warm-400 mt-1">Bookings will appear here once clients start booking your venues.</p>
          </div>
          <div v-else class="overflow-x-auto rounded-xl border border-warm-200 dark:border-warm-700">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-warm-50 dark:bg-warm-800/50">
                  <th class="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-warm-500 dark:text-warm-400">Booking #</th>
                  <th class="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-warm-500 dark:text-warm-400">Client</th>
                  <th class="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-warm-500 dark:text-warm-400">Venue</th>
                  <th class="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-warm-500 dark:text-warm-400">Date</th>
                  <th class="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-warm-500 dark:text-warm-400">Status</th>
                  <th class="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-warm-500 dark:text-warm-400">Amount</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-warm-200 dark:divide-warm-700">
                <tr v-for="b in data.recent_bookings" :key="b.id" class="hover:bg-warm-50 dark:hover:bg-warm-800/30 transition-colors">
                  <td class="px-4 py-3 font-mono text-xs text-primary-600 dark:text-primary-400 font-semibold">{{ b.booking_number }}</td>
                  <td class="px-4 py-3 font-medium text-warm-800 dark:text-warm-200">{{ b.client?.name }}</td>
                  <td class="px-4 py-3 text-warm-500 dark:text-warm-400">{{ b.venue?.name }}</td>
                  <td class="px-4 py-3 text-warm-500 dark:text-warm-400 text-xs whitespace-nowrap">{{ formatDate(b.event_date) }}</td>
                  <td class="px-4 py-3"><span :class="statusClass(b.status)" class="capitalize">{{ b.status }}</span></td>
                  <td class="px-4 py-3 text-right font-semibold text-warm-800 dark:text-warm-200">PKR {{ Number(b.total_amount).toLocaleString() }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Quick Actions (approved stores only) -->
      <div v-if="data.store?.status === 'approved'" class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <RouterLink to="/shop/venues" class="card-hover flex items-center gap-4 p-5 group">
          <div class="w-10 h-10 rounded-xl bg-accent/10 dark:bg-accent/20 flex items-center justify-center group-hover:bg-accent/20 dark:group-hover:bg-accent/30 transition-colors flex-shrink-0">
            <AppIcon icon="map-pin" class="w-5 h-5 text-accent" />
          </div>
          <div>
            <p class="text-sm font-semibold text-warm-800 dark:text-warm-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">Manage Venues</p>
            <p class="text-xs text-warm-500 dark:text-warm-400">{{ data.stats?.total_venues }} venue{{ data.stats?.total_venues !== 1 ? 's' : '' }} listed</p>
          </div>
        </RouterLink>

        <RouterLink to="/shop/bookings" class="card-hover flex items-center gap-4 p-5 group">
          <div class="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center group-hover:bg-primary-200 dark:group-hover:bg-primary-800/40 transition-colors flex-shrink-0">
            <AppIcon icon="calendar-event" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <p class="text-sm font-semibold text-warm-800 dark:text-warm-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">All Bookings</p>
            <p class="text-xs text-warm-500 dark:text-warm-400">{{ data.stats?.pending_bookings }} pending review</p>
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
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import api from '@/lib/axios'
import AppIcon from '@/components/ui/AppIcon.vue'

const loading = ref(true)
const data    = ref<any>(null)

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
