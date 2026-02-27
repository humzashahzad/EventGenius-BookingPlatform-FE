<template>
  <div class="client-page">
    <!-- Breadcrumb -->
    <nav class="client-breadcrumb">
      <RouterLink to="/customer/bookings">Dashboard</RouterLink>
      <span class="client-breadcrumb-sep">›</span>
      <span>Overview</span>
    </nav>

    <!-- Loading -->
    <div v-if="loading" class="space-y-6">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div v-for="i in 4" :key="i" class="client-stat-card animate-pulse">
          <div class="h-8 bg-surface-200 rounded w-20"></div>
          <div class="h-4 bg-surface-100 rounded w-24 mt-2"></div>
        </div>
      </div>
      <div class="h-64 bg-surface-100 rounded-2xl"></div>
    </div>

    <template v-else>
      <!-- Hero / Promo card -->
      <div class="client-hero-card mb-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p class="text-sm font-medium text-primary-600 mb-0.5">EventGenius</p>
            <h2 class="client-hero-title">Find your perfect venue</h2>
            <p class="client-hero-desc">Track your bookings and discover new spaces for your next event.</p>
            <RouterLink to="/venues" class="client-btn-primary">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              Browse Venues
            </RouterLink>
          </div>
          <div class="hidden sm:block w-32 h-32 rounded-2xl bg-white/50 flex items-center justify-center text-4xl">🏛️</div>
        </div>
      </div>

      <!-- Stat cards row -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="client-stat-card">
          <div class="client-stat-value">{{ stats.total_bookings }}</div>
          <div class="client-stat-label">Total Bookings</div>
        </div>
        <div class="client-stat-card">
          <div class="client-stat-value text-primary-600">{{ stats.upcoming_bookings }}</div>
          <div class="client-stat-label">Upcoming</div>
        </div>
        <div class="client-stat-card">
          <div class="client-stat-value text-emerald-600">{{ stats.completed_bookings }}</div>
          <div class="client-stat-label">Completed</div>
        </div>
        <div class="client-stat-card">
          <div class="client-stat-value text-surface-500">{{ stats.cancelled_bookings }}</div>
          <div class="client-stat-label">Cancelled</div>
        </div>
      </div>

      <!-- Progress + Recent in grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <!-- Completion rate card -->
        <div class="client-card">
          <div class="client-card-body">
            <div class="flex items-center justify-between mb-3">
              <h3 class="client-card-title">Booking completion</h3>
              <span class="text-sm font-bold text-primary-600">{{ completionRate }}%</span>
            </div>
            <div class="h-2 bg-surface-100 rounded-full overflow-hidden">
              <div class="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-500" :style="{ width: completionRate + '%' }"></div>
            </div>
            <div class="flex justify-between mt-2 text-xs text-surface-500">
              <span>{{ stats.completed_bookings }} completed</span>
              <span>{{ stats.total_bookings }} total</span>
            </div>
          </div>
        </div>

        <!-- Recent Bookings card (spans 2) -->
        <div class="lg:col-span-2 client-card">
          <div class="client-card-body">
            <div class="flex items-center justify-between mb-4">
              <h3 class="client-card-title">Recent Bookings</h3>
              <RouterLink to="/customer/bookings" class="text-sm font-medium text-primary-600 hover:text-primary-700">
                View all →
              </RouterLink>
            </div>

            <div v-if="recentBookings.length === 0" class="py-10 text-center">
              <div class="w-14 h-14 rounded-full bg-surface-100 flex items-center justify-center mx-auto mb-3 text-2xl">📅</div>
              <p class="text-sm font-medium text-surface-700">No bookings yet</p>
              <p class="text-xs text-surface-500 mt-0.5">Find and book the perfect venue</p>
              <RouterLink to="/venues" class="client-btn-primary mt-4 inline-flex">Browse Venues</RouterLink>
            </div>

            <div v-else class="space-y-3">
              <RouterLink
                v-for="b in recentBookings"
                :key="b.id"
                :to="`/client/bookings/${b.id}`"
                class="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 transition-colors border border-transparent hover:border-surface-200"
              >
                <div class="w-10 h-10 rounded-xl bg-surface-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                  <img v-if="b.venue?.thumbnail" :src="getImageUrl(b.venue.thumbnail)" class="w-full h-full object-cover" />
                  <span v-else class="text-surface-400 text-sm">🏛️</span>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="font-medium text-surface-800 text-sm truncate">{{ b.venue?.name }}</p>
                  <p class="text-xs text-surface-500">{{ formatDate(b.event_date) }} · PKR {{ Number(b.total_amount).toLocaleString() }}</p>
                </div>
                <span :class="statusClass(b.status)" class="text-xs font-medium px-2.5 py-1 rounded-full capitalize flex-shrink-0">{{ b.status }}</span>
              </RouterLink>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick actions -->
      <h3 class="client-section-title">Quick actions</h3>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <RouterLink to="/venues" class="client-card flex items-center gap-4 p-4 hover:shadow-md hover:border-primary-200 transition-all group no-underline">
          <div class="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center group-hover:bg-primary-200 transition-colors flex-shrink-0">
            <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
          <div>
            <p class="font-semibold text-surface-800 text-sm">Browse Venues</p>
            <p class="text-xs text-surface-500">Discover new places</p>
          </div>
        </RouterLink>
        <RouterLink to="/customer/bookings" class="client-card flex items-center gap-4 p-4 hover:shadow-md hover:border-primary-200 transition-all group no-underline">
          <div class="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center group-hover:bg-primary-200 transition-colors flex-shrink-0">
            <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          </div>
          <div>
            <p class="font-semibold text-surface-800 text-sm">My Bookings</p>
            <p class="text-xs text-surface-500">View all your bookings</p>
          </div>
        </RouterLink>
        <RouterLink to="/customer/profile" class="client-card flex items-center gap-4 p-4 hover:shadow-md hover:border-primary-200 transition-all group no-underline">
          <div class="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center group-hover:bg-primary-200 transition-colors flex-shrink-0">
            <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
          </div>
          <div>
            <p class="font-semibold text-surface-800 text-sm">My Profile</p>
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
    pending: 'bg-warning-100 text-warning-800',
    confirmed: 'bg-success-100 text-success-800',
    completed: 'bg-info-100 text-info-800',
    cancelled: 'bg-danger-100 text-danger-800',
    rejected: 'bg-danger-100 text-danger-800',
  }
  return map[s] || 'bg-surface-100 text-surface-700'
}

onMounted(load)
</script>
