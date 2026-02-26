<template>
  <div class="store-profile-page">
    <!-- Loading -->
    <div v-if="loading" class="loading-container">
      <div class="spinner-lg"></div>
      <p class="text-sm text-surface-500 mt-4">Loading store profile...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="error-container">
      <svg class="w-16 h-16 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <h2 class="text-xl font-semibold text-surface-800 mb-2">Store Not Found</h2>
      <p class="text-surface-600">{{ error }}</p>
      <RouterLink to="/venues" class="btn btn-primary mt-6">
        Browse All Venues
      </RouterLink>
    </div>

    <!-- Store Profile Content -->
    <div v-else-if="store" class="store-profile-content">
      <!-- Header -->
      <div class="store-header">
        <div class="store-header-content">
          <!-- Avatar -->
          <div class="store-avatar">
            <img v-if="store.user.avatar" :src="getAvatarUrl(store.user.avatar)" :alt="store.user.name" />
            <span v-else class="store-avatar-initials">{{ getInitials(store.user.name) }}</span>
          </div>

          <!-- Info -->
          <div class="store-info">
            <h1 class="store-name">{{ store.user.name }}</h1>
            <p v-if="store.user.email" class="store-email">
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
              {{ store.user.email }}
            </p>
            <p v-if="store.user.phone" class="store-phone">
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
              </svg>
              {{ store.user.phone }}
            </p>
          </div>

          <!-- Contact Button -->
          <button @click="startChat" class="btn btn-primary">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
            Contact Store
          </button>
        </div>
      </div>

      <!-- Stats -->
      <div class="store-stats">
        <div class="stat-card">
          <svg class="stat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
          </svg>
          <div>
            <p class="stat-value">{{ stats?.total_venues || 0 }}</p>
            <p class="stat-label">Total Venues</p>
          </div>
        </div>

        <div class="stat-card">
          <svg class="stat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          <div>
            <p class="stat-value">{{ stats?.total_bookings || 0 }}</p>
            <p class="stat-label">Total Bookings</p>
          </div>
        </div>

        <div class="stat-card">
          <svg class="stat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <div>
            <p class="stat-value">{{ stats?.member_since || 'N/A' }}</p>
            <p class="stat-label">Member Since</p>
          </div>
        </div>
      </div>

      <!-- Venues Section -->
      <div class="store-venues">
        <h2 class="section-title">
          <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
          </svg>
          Our Venues
        </h2>

        <!-- No venues -->
        <div v-if="!store.venues || store.venues.length === 0" class="empty-state">
          <svg class="w-16 h-16 text-surface-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
          </svg>
          <p class="text-sm text-surface-500">No venues available yet</p>
        </div>

        <!-- Venues grid -->
        <div v-else class="venues-grid">
          <div v-for="venue in store.venues" :key="venue.id" class="venue-card">
            <!-- Venue image -->
            <div class="venue-image">
              <img
                v-if="venue.images && venue.images.length > 0"
                :src="getImageUrl(venue.images[0].path)"
                :alt="venue.name"
              />
              <div v-else class="venue-image-placeholder">
                <svg class="w-12 h-12 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
              </div>
              <span v-if="venue.status === 'active'" class="venue-badge venue-badge-active">Active</span>
              <span v-else class="venue-badge venue-badge-inactive">Inactive</span>
            </div>

            <!-- Venue info -->
            <div class="venue-info">
              <h3 class="venue-name">{{ venue.name }}</h3>
              <p class="venue-location">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                {{ venue.location }}
              </p>
              <p class="venue-description">{{ truncate(venue.description, 100) }}</p>

              <div class="venue-meta">
                <span class="venue-capacity">
                  <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
                  Capacity: {{ venue.capacity }}
                </span>
                <span class="venue-price">₨{{ Number(venue.price_per_day).toLocaleString() }}/day</span>
              </div>

              <RouterLink :to="`/venues/${venue.id}`" class="btn btn-outline w-full mt-3">
                View Details
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import api from '@/lib/axios'
import { useChat } from '@/composables/useChat'

const route = useRoute()
const { startConversation } = useChat()

const store = ref<any>(null)
const stats = ref<any>(null)
const loading = ref(true)
const error = ref<string | null>(null)

async function fetchStoreProfile() {
  try {
    loading.value = true
    error.value = null

    const storeId = route.params.id
    const response = await api.get(`/stores/${storeId}/profile`)

    if (response.data.success) {
      store.value = response.data.data.store
      stats.value = response.data.data.stats
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load store profile'
  } finally {
    loading.value = false
  }
}

async function startChat() {
  if (store.value?.user?.id) {
    await startConversation(store.value.user.id)
  }
}

function getAvatarUrl(path: string): string {
  if (path.startsWith('http')) return path
  return `${import.meta.env.VITE_API_BASE_URL}/storage/${path}`
}

function getImageUrl(path: string): string {
  if (path.startsWith('http')) return path
  return `${import.meta.env.VITE_API_BASE_URL}/storage/${path}`
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'ST'
}

function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.substring(0, length) + '...'
}

onMounted(() => {
  fetchStoreProfile()
})
</script>

<style scoped>
.store-profile-page {
  min-height: 100vh;
  background: var(--color-bg, #f9fafb);
  padding: 32px 20px;
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
}

.store-profile-content {
  max-width: 1200px;
  margin: 0 auto;
}

.store-header {
  background: linear-gradient(135deg, var(--color-primary-600), var(--color-primary-500));
  border-radius: 16px;
  padding: 40px;
  margin-bottom: 32px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.store-header-content {
  display: flex;
  align-items: center;
  gap: 24px;
}

.store-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  background: white;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4px solid rgba(255, 255, 255, 0.3);
}

.store-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.store-avatar-initials {
  font-size: 32px;
  font-weight: 700;
  color: var(--color-primary-600);
}

.store-info {
  flex: 1;
}

.store-name {
  font-size: 32px;
  font-weight: 700;
  color: white;
  margin-bottom: 8px;
}

.store-email,
.store-phone {
  display: flex;
  align-items: center;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  margin-top: 6px;
}

.store-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.stat-card {
  background: var(--color-bg-card, white);
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 48px;
  height: 48px;
  color: var(--color-primary-600);
  flex-shrink: 0;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text-primary, #1f2937);
}

.stat-label {
  font-size: 14px;
  color: var(--color-text-secondary, #6b7280);
  margin-top: 4px;
}

.section-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-primary, #1f2937);
  margin-bottom: 24px;
  display: flex;
  align-items: center;
}

.venues-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.venue-card {
  background: var(--color-bg-card, white);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.venue-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.venue-image {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
  background: var(--color-bg-elevated, #f3f4f6);
}

.venue-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.venue-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.venue-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.venue-badge-active {
  background: #10b981;
  color: white;
}

.venue-badge-inactive {
  background: #6b7280;
  color: white;
}

.venue-info {
  padding: 20px;
}

.venue-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary, #1f2937);
  margin-bottom: 8px;
}

.venue-location {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: var(--color-text-secondary, #6b7280);
  margin-bottom: 12px;
}

.venue-description {
  font-size: 14px;
  color: var(--color-text-secondary, #6b7280);
  line-height: 1.5;
  margin-bottom: 16px;
}

.venue-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border, #e5e7eb);
}

.venue-capacity {
  display: flex;
  align-items: center;
  color: var(--color-text-secondary, #6b7280);
}

.venue-price {
  font-weight: 600;
  color: var(--color-primary-600);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.spinner-lg {
  width: 48px;
  height: 48px;
  border: 4px solid var(--color-border, #e5e7eb);
  border-top-color: var(--color-primary-600);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .store-header {
    padding: 24px;
  }

  .store-header-content {
    flex-direction: column;
    text-align: center;
  }

  .store-name {
    font-size: 24px;
  }

  .venues-grid {
    grid-template-columns: 1fr;
  }
}
</style>
