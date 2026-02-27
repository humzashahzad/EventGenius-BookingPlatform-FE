<template>
  <div class="page-container">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">My Bookings</h1>
        <p class="page-subtitle">Track and manage all your venue reservations.</p>
      </div>
      <RouterLink to="/venues" class="btn-primary gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        Book a Venue
      </RouterLink>
    </div>

    <!-- Status filter pills with counts -->
    <div class="flex gap-2 flex-wrap">
      <button
        v-for="s in statuses"
        :key="s.value"
        @click="filterStatus = s.value; page = 1; loadBookings()"
        class="filter-pill"
        :class="filterStatus === s.value ? 'filter-pill-active' : ''"
      >
        <span v-if="s.dot" class="w-1.5 h-1.5 rounded-full flex-shrink-0" :class="s.dot"></span>
        {{ s.label }}
        <span v-if="statusCounts[s.value] !== undefined" class="status-count">{{ statusCounts[s.value] }}</span>
      </button>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-4">
      <div v-for="i in 4" :key="i" class="skeleton h-32 rounded-xl"></div>
    </div>

    <!-- Empty state -->
    <div v-else-if="bookings.length === 0" class="card card-body">
      <div class="empty-state py-14">
        <div class="empty-state-icon">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
        </div>
        <p class="empty-state-title">No bookings found</p>
        <p class="empty-state-desc">
          {{ filterStatus ? `No ${filterStatus} bookings yet.` : 'You haven\'t made any bookings yet.' }}
        </p>
        <RouterLink to="/venues" class="btn-primary mt-4">Browse Venues</RouterLink>
      </div>
    </div>

    <!-- Enhanced Booking Cards -->
    <div v-else class="space-y-4">
      <div
        v-for="b in bookings"
        :key="b.id"
        class="booking-card"
        :class="`booking-card-${b.status}`"
      >
        <div class="booking-card-header">
          <div class="flex items-center gap-3">
            <div class="booking-card-thumbnail">
              <img
                v-if="b.venue?.thumbnail"
                :src="getImageUrl(b.venue.thumbnail)"
                class="w-full h-full object-cover"
                :alt="b.venue?.name"
              />
              <div v-else class="w-full h-full flex items-center justify-center bg-surface-100">
                <svg class="w-10 h-10 text-surface-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                </svg>
              </div>
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-2 mb-1">
                <div class="min-w-0">
                  <span class="booking-number">{{ b.booking_number }}</span>
                  <h3 class="booking-venue-name">{{ b.venue?.name }}</h3>
                </div>
                <span :class="statusClass(b.status)" class="capitalize flex-shrink-0">{{ b.status }}</span>
              </div>

              <div class="booking-meta">
                <div class="booking-meta-item">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                  </svg>
                  <span class="font-medium">{{ b.event_name }}</span>
                </div>

                <div class="booking-meta-item">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  <span>{{ formatDate(b.event_date) }}</span>
                </div>

                <div v-if="b.start_time" class="booking-meta-item">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span>{{ b.start_time }} – {{ b.end_time }}</span>
                </div>

                <div v-if="b.guests_count" class="booking-meta-item">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
                  <span>{{ b.guests_count }} guests</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="booking-card-footer">
          <div class="booking-amount">
            <span class="booking-amount-label">Total Amount</span>
            <span class="booking-amount-value">PKR {{ Number(b.total_amount).toLocaleString() }}</span>
          </div>

          <div class="booking-actions">
            <RouterLink :to="`/client/bookings/${b.id}`" class="btn-ghost btn-sm">
              View Details
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </RouterLink>
          </div>
        </div>

        <!-- Status-specific actions or info -->
        <div v-if="b.status === 'pending'" class="booking-card-alert booking-card-alert-warning">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span>Awaiting confirmation from venue owner</span>
        </div>

        <div v-if="b.status === 'confirmed' && isUpcoming(b.event_date)" class="booking-card-alert booking-card-alert-success">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span>{{ getDaysUntil(b.event_date) }}</span>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="meta.last_page > 1" class="flex items-center justify-center gap-2 pt-2">
      <button
        @click="changePage(meta.current_page - 1)"
        :disabled="meta.current_page === 1"
        class="pagination-btn"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
      </button>
      <div class="flex gap-1">
        <button
          v-for="p in pageNumbers"
          :key="p"
          @click="changePage(p)"
          class="pagination-btn"
          :class="p === meta.current_page ? 'active' : ''"
        >{{ p }}</button>
      </div>
      <button
        @click="changePage(meta.current_page + 1)"
        :disabled="meta.current_page === meta.last_page"
        class="pagination-btn"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import api from '@/lib/axios'
import { getStorageUrl } from '@/lib/storageUrl'

const bookings = ref<any[]>([])
const loading = ref(false)
const filterStatus = ref('')
const meta = ref({ current_page: 1, last_page: 1 })
const statusCounts = ref<Record<string, number>>({})
let page = 1

const statuses = [
  { value: '',          label: 'All',       dot: '' },
  { value: 'pending',   label: 'Pending',   dot: 'bg-warning-400' },
  { value: 'confirmed', label: 'Confirmed', dot: 'bg-success-500' },
  { value: 'completed', label: 'Completed', dot: 'bg-info-500' },
  { value: 'cancelled', label: 'Cancelled', dot: 'bg-danger-500' },
]

const pageNumbers = computed(() => {
  const total = meta.value.last_page
  const current = meta.value.current_page
  const pages: number[] = []
  for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) {
    pages.push(i)
  }
  return pages
})

async function loadBookings() {
  loading.value = true
  try {
    const params: any = { per_page: 10, page }
    if (filterStatus.value) params.status = filterStatus.value

    const { data } = await api.get('/client/bookings', { params })
    bookings.value = data.data.data
    meta.value = { current_page: data.data.current_page, last_page: data.data.last_page }

    // Load status counts for filter badges
    if (!filterStatus.value) {
      await loadStatusCounts()
    }
  } finally {
    loading.value = false
  }
}

async function loadStatusCounts() {
  try {
    const { data } = await api.get('/client/bookings', { params: { per_page: 1000 } })
    const allBookings = data.data.data

    statusCounts.value = {
      '': allBookings.length,
      'pending': allBookings.filter((b: any) => b.status === 'pending').length,
      'confirmed': allBookings.filter((b: any) => b.status === 'confirmed').length,
      'completed': allBookings.filter((b: any) => b.status === 'completed').length,
      'cancelled': allBookings.filter((b: any) => b.status === 'cancelled').length,
    }
  } catch (error) {
    console.error('Failed to load status counts:', error)
  }
}

function changePage(p: number) {
  page = p
  loadBookings()
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })
}

function isUpcoming(dateStr: string) {
  const eventDate = new Date(dateStr)
  const now = new Date()
  return eventDate > now
}

function getDaysUntil(dateStr: string) {
  const eventDate = new Date(dateStr)
  const now = new Date()
  const diffTime = eventDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Event is today!'
  if (diffDays === 1) return 'Event is tomorrow!'
  if (diffDays <= 7) return `Event in ${diffDays} days`
  return `Event in ${Math.floor(diffDays / 7)} weeks`
}

function getImageUrl(path: string) {
  return getStorageUrl(path)
}

function statusClass(s: string) {
  const m: Record<string, string> = {
    pending: 'badge-warning',
    confirmed: 'badge-success',
    completed: 'badge-info',
    cancelled: 'badge-danger',
    rejected: 'badge-danger'
  }
  return m[s] || 'badge-info'
}

onMounted(loadBookings)
</script>

<style scoped>
/* Enhanced Booking Card Styles */
.booking-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.booking-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: var(--accent-color, var(--color-text-muted));
  transition: width 0.3s;
}

.booking-card:hover {
  border-color: var(--color-primary-300);
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -4px rgb(0 0 0 / 0.05);
  transform: translateY(-2px);
}

.booking-card:hover::before {
  width: 6px;
}

/* Status-specific accent colors */
.booking-card-pending {
  --accent-color: var(--color-warning-500);
}

.booking-card-confirmed {
  --accent-color: var(--color-success-500);
}

.booking-card-completed {
  --accent-color: var(--color-info-500);
}

.booking-card-cancelled {
  --accent-color: var(--color-danger-500);
}

.booking-card-header {
  padding: 1.25rem;
}

.booking-card-thumbnail {
  width: 5.5rem;
  height: 5.5rem;
  border-radius: 0.875rem;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05);
  flex-shrink: 0;
}

.booking-number {
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
  font-size: 0.6875rem;
  color: var(--color-text-muted);
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  display: block;
}

.booking-venue-name {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
  margin-top: 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.booking-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1.25rem;
  margin-top: 0.75rem;
}

.booking-meta-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
}

.booking-meta-item svg {
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.booking-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  background: var(--color-bg-elevated);
  border-top: 1px solid var(--color-border);
}

.booking-amount {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.booking-amount-label {
  font-size: 0.6875rem;
  color: var(--color-text-muted);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.booking-amount-value {
  font-size: 1.125rem;
  font-weight: 800;
  color: var(--color-text);
}

.booking-actions {
  display: flex;
  gap: 0.5rem;
}

.booking-card-alert {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  font-size: 0.8125rem;
  font-weight: 500;
  border-top: 1px solid var(--color-border);
}

.booking-card-alert svg {
  flex-shrink: 0;
}

.booking-card-alert-warning {
  background: var(--color-warning-50);
  color: var(--color-warning-700);
}

.booking-card-alert-success {
  background: var(--color-success-50);
  color: var(--color-success-700);
}

.status-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.25rem;
  height: 1.25rem;
  padding: 0 0.375rem;
  font-size: 0.6875rem;
  font-weight: 700;
  border-radius: 0.5rem;
  background: var(--color-border);
  color: var(--color-text-secondary);
}

.filter-pill-active .status-count {
  background: rgba(255, 255, 255, 0.15);
  color: white;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .booking-card-thumbnail {
    width: 4.5rem;
    height: 4.5rem;
  }

  .booking-meta {
    gap: 0.5rem 1rem;
  }

  .booking-card-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .booking-actions {
    width: 100%;
  }

  .booking-actions .btn-ghost {
    width: 100%;
    justify-content: center;
  }
}
</style>
