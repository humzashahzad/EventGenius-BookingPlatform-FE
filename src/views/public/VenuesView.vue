<template>
  <div class="font-['DM_Sans']">
    <!-- Hero Header -->
    <div class="venues-hero">
      <div class="venues-hero-bg"></div>
      <div class="max-w-7xl mx-auto px-4 sm:px-6 relative z-[2]">
        <h1 class="venues-hero-title">Explore Venues</h1>
        <p class="venues-hero-subtitle">Find the perfect space for your next unforgettable event</p>
      </div>
    </div>

    <div class="max-w-7xl mx-auto flex-grow px-4 py-8">
      <!-- Filters -->
      <div class="filter-bar">
        <div class="filter-search">
          <AppIcon icon="search" class="w-[18px] h-[18px] filter-search-icon" />
          <input v-model="filters.search" @input="debouncedSearch" type="text" class="filter-search-input" placeholder="Search venues..." />
        </div>
        <div class="filter-divider"></div>
        <div class="filter-group">
          <input v-model="filters.city" @change="loadVenues" type="text" class="filter-input" placeholder="City" />
        </div>
        <div class="filter-divider"></div>
        <div class="filter-group">
          <select v-model="filters.event_type" @change="loadVenues" class="filter-select">
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
        <div class="filter-divider"></div>
        <div class="filter-group">
          <select v-model="filters.sort_by" @change="loadVenues" class="filter-select">
            <option value="created_at">Newest</option>
            <option value="avg_rating">Top Rated</option>
            <option value="price_per_head">Price (Low-High)</option>
          </select>
        </div>
      </div>

      <!-- Results Count -->
      <div v-if="!loading && venues.length > 0" class="mb-6">
        <span class="text-sm font-semibold text-warm-500">{{ meta.total }} venues found</span>
      </div>

      <!-- Loading -->
      <div v-if="loading">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="i in 6" :key="i" class="venue-skeleton">
            <div class="venue-skeleton-img shimmer"></div>
            <div class="venue-skeleton-body">
              <div class="shimmer" style="height:16px;width:75%;border-radius:8px;margin-bottom:8px;"></div>
              <div class="shimmer" style="height:12px;width:50%;border-radius:8px;margin-bottom:16px;"></div>
              <div class="shimmer" style="height:14px;width:40%;border-radius:8px;"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else-if="venues.length === 0" class="empty-state">
        <div class="empty-state-icon">
          <AppIcon icon="map-pin-off" class="w-8 h-8" />
        </div>
        <p class="empty-state-title">No venues found</p>
        <p class="empty-state-desc">Try adjusting your search or filters to find what you're looking for.</p>
      </div>

      <!-- Venue Grid -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
        <div v-for="venue in venues" :key="venue.id" class="animate-fade-in-up">
          <RouterLink :to="`/venues/${venue.id}`" class="browse-venue-card">
            <div class="browse-venue-img">
              <img
                v-if="venueCardImage(venue)"
                :src="getImageUrl(venueCardImage(venue)!)"
                :alt="venue.name"
                @error="imgError"
              />
              <div v-else class="browse-venue-placeholder">
                <AppIcon icon="image" class="w-10 h-10 text-[var(--color-text-muted)]" />
              </div>
              <div v-if="venue.is_featured" class="browse-venue-featured">
                <AppIcon icon="sparkles" class="w-3 h-3" />
                Featured
              </div>
              <div class="browse-venue-rating-badge" v-if="venue.avg_rating">
                <AppIcon icon="star-filled" class="w-2.5 h-2.5 text-[#F59E0B]" />
                {{ venue.avg_rating?.toFixed(1) }}
              </div>
            </div>
            <div class="browse-venue-body">
              <h3 class="browse-venue-name">{{ venue.name }}</h3>
              <p class="browse-venue-location">
                <AppIcon icon="map-pin" class="w-3 h-3" />
                {{ venue.city }}, {{ venue.country }}
              </p>
              <p class="browse-venue-desc">{{ venue.description }}</p>
              <div class="browse-venue-footer">
                <div>
                  <span class="browse-venue-price">PKR {{ formatPrice(venue) }}</span>
                  <span class="browse-venue-price-label"> / head</span>
                </div>
                <div class="browse-venue-tags">
                  <span v-for="type in (venue.event_types || []).slice(0, 2)" :key="type" class="browse-venue-tag">{{ type.replace('_', ' ') }}</span>
                </div>
              </div>
            </div>
          </RouterLink>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="meta.last_page > 1" class="pagination-bar">
        <p class="pagination-info">Page {{ meta.current_page }} of {{ meta.last_page }} ({{ meta.total }} venues)</p>
        <nav>
          <ul class="flex items-center gap-1">
            <li>
              <button
                class="pagination-btn"
                :class="{ 'opacity-40 pointer-events-none': meta.current_page === 1 }"
                :disabled="meta.current_page === 1"
                @click="changePage(meta.current_page - 1)"
              >
                <AppIcon icon="chevron-left" class="w-3.5 h-3.5" />
              </button>
            </li>
            <li v-for="page in visiblePages" :key="page">
              <button
                class="pagination-btn"
                :class="{ 'pagination-btn--active': page === meta.current_page }"
                @click="changePage(page)"
              >{{ page }}</button>
            </li>
            <li>
              <button
                class="pagination-btn"
                :class="{ 'opacity-40 pointer-events-none': meta.current_page === meta.last_page }"
                :disabled="meta.current_page === meta.last_page"
                @click="changePage(meta.current_page + 1)"
              >
                <AppIcon icon="chevron-right" class="w-3.5 h-3.5" />
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import api from '@/lib/axios'
import { getStorageUrl } from '@/lib/storageUrl'
import AppIcon from '@/components/ui/AppIcon.vue'

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

const visiblePages = computed(() => {
  const pages: number[] = []
  const total = meta.value.last_page
  const current = meta.value.current_page
  const start = Math.max(1, current - 2)
  const end = Math.min(total, current + 2)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
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
  window.scrollTo({ top: 0, behavior: 'smooth' })
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
/* ─── Hero ─────────────────────────────────────────────────────────────────── */
.venues-hero {
  position: relative;
  padding: 4rem 1rem 3rem;
  background: linear-gradient(145deg, #064E3B, #065F46, #047857);
  overflow: hidden;
}

.venues-hero-bg {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0);
  background-size: 32px 32px;
}

.venues-hero-title {
  font-family: 'DM Sans', sans-serif;
  font-size: 2.25rem;
  font-weight: 800;
  color: white;
  letter-spacing: -0.02em;
  margin-bottom: 0.5rem;
}

.venues-hero-subtitle {
  color: rgba(255,255,255,0.6);
  font-size: 1rem;
  margin-bottom: 0;
}

/* ─── Filter Bar ───────────────────────────────────────────────────────────── */
.filter-bar {
  display: flex;
  align-items: center;
  gap: 0;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-light);
  border-radius: 1rem;
  box-shadow: var(--shadow-card, 0 1px 3px rgba(0,0,0,0.08));
  padding: 0.375rem;
  margin-top: -1.5rem;
  margin-bottom: 2rem;
  position: relative;
  z-index: 10;
}

.filter-search {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1.5;
  padding: 0.5rem 1rem;
}

.filter-search-icon {
  color: var(--color-text-muted);
  font-size: 1.125rem;
}

.filter-search-input {
  border: none;
  background: transparent;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.875rem;
  color: var(--color-text);
  outline: none;
  width: 100%;
}

.filter-search-input::placeholder {
  color: var(--color-text-muted);
}

.filter-divider {
  width: 1px;
  height: 28px;
  background: var(--color-border-light);
  flex-shrink: 0;
}

.filter-group {
  flex: 1;
  padding: 0 0.25rem;
}

.filter-input,
.filter-select {
  border: none;
  background: transparent;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.875rem;
  color: var(--color-text);
  padding: 0.5rem 0.75rem;
  width: 100%;
  outline: none;
  cursor: pointer;
  border-radius: 0.75rem;
  transition: background 0.15s;
}

.filter-input:focus,
.filter-select:focus {
  background: var(--color-bg-hover);
}

.filter-input::placeholder {
  color: var(--color-text-muted);
}

/* ─── Skeleton ─────────────────────────────────────────────────────────────── */
.venue-skeleton {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-light);
  border-radius: 1rem;
  overflow: hidden;
}

.venue-skeleton-img {
  aspect-ratio: 16/10;
  background: var(--color-bg-hover);
}

.venue-skeleton-body {
  padding: 1.25rem;
}

/* ─── Venue Cards ──────────────────────────────────────────────────────────── */
.browse-venue-card {
  display: flex;
  flex-direction: column;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-light);
  border-radius: 1rem;
  overflow: hidden;
  text-decoration: none;
  transition: all 0.35s ease;
  height: 100%;
  box-shadow: var(--shadow-soft, 0 1px 2px rgba(0,0,0,0.05));
}

.browse-venue-card:hover {
  border-color: #6EE7B7;
  box-shadow: var(--shadow-elevated, 0 10px 40px rgba(0,0,0,0.1));
  transform: translateY(-6px);
}

.browse-venue-img {
  position: relative;
  aspect-ratio: 16/10;
  background: var(--color-bg-hover);
  overflow: hidden;
}

.browse-venue-img img {
  width: 100%; height: 100%;
  object-fit: cover;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.browse-venue-card:hover .browse-venue-img img {
  transform: scale(1.06);
}

.browse-venue-placeholder {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
}

.browse-venue-featured {
  position: absolute;
  top: 12px; left: 12px;
  display: flex; align-items: center; gap: 4px;
  padding: 4px 10px;
  background: linear-gradient(135deg, #F59E0B, #D97706);
  color: #1C1917;
  border-radius: 9999px;
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.browse-venue-rating-badge {
  position: absolute;
  top: 12px; right: 12px;
  display: flex; align-items: center; gap: 3px;
  padding: 4px 8px;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(8px);
  border-radius: 0.375rem;
  color: white;
  font-size: 0.75rem;
  font-weight: 700;
}

.browse-venue-body {
  padding: 1.125rem 1.25rem 1.375rem;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.browse-venue-name {
  font-family: 'DM Sans', sans-serif;
  font-size: 1.0625rem;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 0.25rem;
  letter-spacing: -0.01em;
}

.browse-venue-location {
  display: flex; align-items: center; gap: 0.375rem;
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  margin-bottom: 0.5rem;
}

.browse-venue-desc {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 1rem;
}

.browse-venue-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
}

.browse-venue-price {
  font-weight: 800;
  color: #10B981;
  font-size: 1rem;
  letter-spacing: -0.02em;
}

.browse-venue-price-label {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  font-weight: 400;
}

.browse-venue-tags {
  display: flex; gap: 0.375rem;
}

.browse-venue-tag {
  padding: 0.2rem 0.5rem;
  background: #ECFDF5;
  color: #10B981;
  border-radius: 9999px;
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: capitalize;
}

:root.dark .browse-venue-tag {
  background: rgba(16, 185, 129, 0.15);
  color: #34D399;
}

/* ─── Pagination ───────────────────────────────────────────────────────────── */
.pagination-bar {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  margin-top: 2.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border-light);
}

.pagination-info {
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  margin-bottom: 0;
}

.pagination-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 36px;
  padding: 0 0.5rem;
  border-radius: 0.75rem;
  border: 1px solid var(--color-border-light);
  background: var(--color-bg-card);
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.pagination-btn:hover {
  border-color: #10B981;
  color: #10B981;
  background: #ECFDF5;
}

.pagination-btn--active {
  background: #10B981;
  border-color: #10B981;
  color: white;
}

.pagination-btn--active:hover {
  background: #059669;
  border-color: #059669;
  color: white;
}

:root.dark .pagination-btn:hover {
  background: rgba(16, 185, 129, 0.15);
}

:root.dark .pagination-btn--active {
  background: #10B981;
  border-color: #10B981;
  color: white;
}

/* ─── Responsive ───────────────────────────────────────────────────────────── */
@media (max-width: 767.98px) {
  .filter-bar {
    flex-direction: column;
    gap: 0;
    border-radius: 0.75rem;
  }

  .filter-search {
    width: 100%;
  }

  .filter-divider {
    width: 100%;
    height: 1px;
  }

  .filter-group {
    width: 100%;
  }

  .venues-hero-title {
    font-size: 1.75rem;
  }

  .venues-hero-subtitle {
    font-size: 0.875rem;
  }
}

@media (max-width: 400px) {
  .venues-hero-title {
    font-size: 1.5rem;
  }
}
</style>
