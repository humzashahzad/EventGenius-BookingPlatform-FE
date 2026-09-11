<template>
  <div class="content-container">
    <!-- Breadcrumb -->
    <nav class="flex items-center gap-2 text-sm text-warm-500 mb-6">
      <RouterLink to="/customer/bookings" class="hover:text-primary-600 transition-colors">Dashboard</RouterLink>
      <span class="text-warm-300">/</span>
      <span class="text-warm-700 font-medium">Overview</span>
    </nav>

    <!-- Loading -->
    <div v-if="loading" class="space-y-6">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div v-for="i in 4" :key="i" class="card animate-pulse p-5">
          <div class="h-8 bg-warm-200 rounded-xl w-20"></div>
          <div class="h-4 bg-warm-100 rounded-xl w-24 mt-2"></div>
        </div>
      </div>
      <div class="h-64 bg-warm-100 rounded-2xl"></div>
    </div>

    <template v-else>
      <!-- Hero / Promo card -->
      <div class="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-6 mb-6 shadow-elevated text-white">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p class="text-sm font-medium text-primary-200 mb-0.5">EventGenius</p>
            <h2 class="text-2xl font-bold text-white mb-1">Find your perfect venue</h2>
            <p class="text-primary-100 text-sm mb-4">Track your bookings and discover new spaces for your next event.</p>
            <RouterLink to="/venues" class="btn-primary inline-flex items-center gap-2 !bg-white !text-primary-700 hover:!bg-primary-50">
              <AppIcon icon="search" class="w-4 h-4" />
              Browse Venues
            </RouterLink>
          </div>
          <div class="hidden sm:flex w-32 h-32 rounded-2xl bg-white/20 items-center justify-center text-5xl">
            <AppIcon icon="building" class="w-16 h-16 text-white/80" />
          </div>
        </div>
      </div>

      <!-- Stat cards row -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="stat-card">
          <div class="stat-icon bg-primary-100 text-primary-600">
            <AppIcon icon="calendar-event" class="w-5 h-5" />
          </div>
          <div class="stat-value">{{ stats.total_bookings }}</div>
          <div class="stat-label">Total Bookings</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon bg-accent/10 text-accent">
            <AppIcon icon="clock" class="w-5 h-5" />
          </div>
          <div class="stat-value text-primary-600">{{ stats.upcoming_bookings }}</div>
          <div class="stat-label">Upcoming</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon bg-primary-100 text-primary-700">
            <AppIcon icon="circle-check" class="w-5 h-5" />
          </div>
          <div class="stat-value text-primary-700">{{ stats.completed_bookings }}</div>
          <div class="stat-label">Completed</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon bg-coral/10 text-coral">
            <AppIcon icon="x" class="w-5 h-5" />
          </div>
          <div class="stat-value text-warm-500">{{ stats.cancelled_bookings }}</div>
          <div class="stat-label">Cancelled</div>
        </div>
      </div>

      <!-- Progress + Recent in grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <!-- Completion rate card -->
        <div class="card">
          <div class="p-5">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-semibold text-warm-800">Booking completion</h3>
              <span class="text-sm font-bold text-primary-600">{{ completionRate }}%</span>
            </div>
            <div class="h-2 bg-warm-100 rounded-full overflow-hidden">
              <div class="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-500" :style="{ width: completionRate + '%' }"></div>
            </div>
            <div class="flex justify-between mt-2 text-xs text-warm-500">
              <span>{{ stats.completed_bookings }} completed</span>
              <span>{{ stats.total_bookings }} total</span>
            </div>
          </div>
        </div>

        <!-- Recent Bookings card (spans 2) -->
        <div class="lg:col-span-2 card">
          <div class="p-5">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-semibold text-warm-800">Recent Bookings</h3>
              <RouterLink to="/customer/bookings" class="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
                View all &rarr;
              </RouterLink>
            </div>

            <div v-if="recentBookings.length === 0" class="py-10 text-center">
              <div class="w-14 h-14 rounded-full bg-warm-100 flex items-center justify-center mx-auto mb-3">
                <AppIcon icon="calendar-event" class="w-7 h-7 text-warm-400" />
              </div>
              <p class="text-sm font-medium text-warm-700">No bookings yet</p>
              <p class="text-xs text-warm-500 mt-0.5">Find and book the perfect venue</p>
              <RouterLink to="/venues" class="btn-primary mt-4 inline-flex">Browse Venues</RouterLink>
            </div>

            <div v-else class="space-y-3">
              <RouterLink
                v-for="b in recentBookings"
                :key="b.id"
                :to="`/customer/bookings/${b.id}`"
                class="flex items-center gap-3 p-3 rounded-xl hover:bg-warm-50 transition-colors border border-transparent hover:border-warm-200"
              >
                <div class="w-10 h-10 rounded-xl bg-warm-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                  <img v-if="b.venue?.thumbnail" :src="getImageUrl(b.venue.thumbnail)" class="w-full h-full object-cover" />
                  <AppIcon v-else icon="building" class="w-5 h-5 text-warm-400" />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="font-medium text-warm-800 text-sm truncate">{{ b.venue?.name }}</p>
                  <p class="text-xs text-warm-500">{{ formatDate(b.event_date) }} &middot; PKR {{ Number(b.total_amount).toLocaleString() }}</p>
                </div>
                <span :class="statusClass(b.status)" class="text-xs font-medium px-2.5 py-1 rounded-full capitalize flex-shrink-0">{{ b.status }}</span>
              </RouterLink>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick actions -->
      <h3 class="text-sm font-semibold text-warm-800 uppercase tracking-wider mb-4">Quick actions</h3>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <RouterLink to="/venues" class="card-hover flex items-center gap-4 p-4 no-underline">
          <div class="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center group-hover:bg-primary-200 transition-colors flex-shrink-0">
            <AppIcon icon="search" class="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <p class="font-semibold text-warm-800 text-sm">Browse Venues</p>
            <p class="text-xs text-warm-500">Discover new places</p>
          </div>
        </RouterLink>
        <RouterLink to="/customer/bookings" class="card-hover flex items-center gap-4 p-4 no-underline">
          <div class="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center group-hover:bg-primary-200 transition-colors flex-shrink-0">
            <AppIcon icon="calendar-event" class="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <p class="font-semibold text-warm-800 text-sm">My Bookings</p>
            <p class="text-xs text-warm-500">View all your bookings</p>
          </div>
        </RouterLink>
        <RouterLink to="/customer/profile" class="card-hover flex items-center gap-4 p-4 no-underline">
          <div class="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center group-hover:bg-primary-200 transition-colors flex-shrink-0">
            <AppIcon icon="user" class="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <p class="font-semibold text-warm-800 text-sm">My Profile</p>
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
import AppIcon from '@/components/ui/AppIcon.vue'

const loading = ref(true)
const stats = reactive({ total_bookings: 0, upcoming_bookings: 0, completed_bookings: 0, cancelled_bookings: 0 })
const recentBookings = ref<any[]>([])

const completionRate = computed(() => {
  if (!stats.total_bookings) return 0
  return Math.round((stats.completed_bookings / stats.total_bookings) * 100)
})

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/client/dashboard')
    Object.assign(stats, data.data.stats)
    recentBookings.value = data.data.recent_bookings
  } finally {
    loading.value = false
  }
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })
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
