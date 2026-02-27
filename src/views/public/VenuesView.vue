<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h1 class="page-title">Browse Venues</h1>
        <p class="page-subtitle">Find the perfect venue for your event.</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="card">
      <div class="card-body">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="form-group">
            <label class="form-label">Search</label>
            <input v-model="filters.search" @input="debouncedSearch" type="text" class="form-input" placeholder="Venue name, city..." />
          </div>
          <div class="form-group">
            <label class="form-label">City</label>
            <input v-model="filters.city" @change="loadVenues" type="text" class="form-input" placeholder="Lahore, Karachi..." />
          </div>
          <div class="form-group">
            <label class="form-label">Event Type</label>
            <select v-model="filters.event_type" @change="loadVenues" class="form-select">
              <option value="">All Types</option>
              <option value="wedding">Wedding</option>
              <option value="corporate">Corporate</option>
              <option value="birthday">Birthday</option>
              <option value="film_shoot">Film Shoot</option>
              <option value="concert">Concert</option>
              <option value="exhibition">Exhibition</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Sort By</label>
            <select v-model="filters.sort_by" @change="loadVenues" class="form-select">
              <option value="created_at">Newest</option>
              <option value="avg_rating">Top Rated</option>
              <option value="price_per_head">Price (Low-High)</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="i in 6" :key="i" class="skeleton h-72 rounded-xl"></div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="venues.length === 0" class="card">
      <div class="card-body">
        <div class="empty-state py-14">
          <div class="empty-state-icon">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
            </svg>
          </div>
          <p class="empty-state-title">No venues found</p>
          <p class="empty-state-desc">Try adjusting your search or filters.</p>
        </div>
      </div>
    </div>

    <!-- Venue Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <RouterLink v-for="venue in venues" :key="venue.id" :to="`/venues/${venue.id}`" class="venue-card">
        <div class="venue-card-image">
          <img
            v-if="venueCardImage(venue)"
            :src="getImageUrl(venueCardImage(venue))"
            :alt="venue.name"
            @error="imgError"
          />
          <div v-else class="w-full h-full flex items-center justify-center bg-surface-100">
            <svg class="w-12 h-12 text-surface-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14"/>
            </svg>
          </div>
          <div v-if="venue.is_featured" class="absolute top-3 left-3">
            <span class="badge badge-warning">Featured</span>
          </div>
        </div>
        <div class="venue-card-body">
          <div class="flex justify-between items-start gap-2 mb-1">
            <h3 class="venue-card-title line-clamp-1">{{ venue.name }}</h3>
            <div class="flex items-center gap-1 text-sm text-amber-500 flex-shrink-0">
              <span>★</span>
              <span class="text-surface-700 font-medium">{{ venue.avg_rating?.toFixed(1) || 'New' }}</span>
            </div>
          </div>
          <p class="venue-card-location">{{ venue.city }}, {{ venue.country }}</p>
          <p class="text-xs text-surface-400 mb-3 line-clamp-2">{{ venue.description }}</p>
          <div class="flex justify-between items-center mt-auto">
            <span class="venue-card-price">PKR {{ formatPrice(venue) }}</span>
            <span class="text-xs text-surface-400">/ head</span>
          </div>
          <div class="mt-2 flex flex-wrap gap-1">
            <span v-for="type in (venue.event_types || []).slice(0, 3)" :key="type" class="badge badge-info text-xs capitalize">{{ type.replace('_', ' ') }}</span>
          </div>
        </div>
      </RouterLink>
    </div>

    <!-- Pagination -->
    <div v-if="meta.last_page > 1" class="pagination">
      <p class="pagination-info">Page {{ meta.current_page }} of {{ meta.last_page }} ({{ meta.total }} venues)</p>
      <div class="pagination-controls">
        <button @click="changePage(meta.current_page - 1)" :disabled="meta.current_page === 1" class="pagination-btn">Previous</button>
        <button @click="changePage(meta.current_page + 1)" :disabled="meta.current_page === meta.last_page" class="pagination-btn">Next</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import api from '@/lib/axios'
import { getStorageUrl } from '@/lib/storageUrl'

const venues = ref<any[]>([])
const loading = ref(false)
const meta = ref({ current_page: 1, last_page: 1, total: 0 })
let searchTimeout: ReturnType<typeof setTimeout>

const filters = reactive({
  search: '',
  city: '',
  event_type: '',
  sort_by: 'created_at',
  page: 1,
})

async function loadVenues() {
  loading.value = true
  try {
    const params: Record<string, any> = { per_page: 12, page: filters.page, sort_by: filters.sort_by }
    if (filters.search) params.search = filters.search
    if (filters.city) params.city = filters.city
    if (filters.event_type) params.event_type = filters.event_type

    const { data } = await api.get('/venues', { params })
    venues.value = data.data.data
    meta.value = {
      current_page: data.data.current_page,
      last_page: data.data.last_page,
      total: data.data.total,
    }
  } catch (e) {
    venues.value = []
  } finally {
    loading.value = false
  }
}

function debouncedSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => loadVenues(), 400)
}

function changePage(page: number) {
  filters.page = page
  loadVenues()
}

function formatPrice(venue: any) {
  const price = venue.price_per_head
  return price ? Number(price).toLocaleString() : 'Contact'
}

function venueCardImage(venue: any): string | null {
  return venue.thumbnail || venue.images?.[0]?.path || null
}

function getImageUrl(path: string) {
  return getStorageUrl(path)
}

function imgError(e: Event) {
  (e.target as HTMLImageElement).style.display = 'none'
}

onMounted(loadVenues)
</script>

<style scoped>
/* Amber gradient overlay on venue card image hover */
.venue-card:hover .venue-card-image::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(217, 119, 6, 0.06) 100%);
  pointer-events: none;
  transition: opacity 0.3s ease;
}

.venue-card .venue-card-image::after {
  content: '';
  position: absolute;
  inset: 0;
  background: transparent;
  transition: background 0.3s ease;
}
</style>
