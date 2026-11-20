<template>
  <div class="venues-page">
    <div class="venues-inner">
      <!-- Header -->
      <header class="venues-head">
        <div>
          <h1 class="venues-title">{{ heading }}</h1>
          <p class="venues-sub">
            <template v-if="loading">Finding venues…</template>
            <template v-else>{{ meta.total }} {{ meta.total === 1 ? 'venue' : 'venues' }} {{ hasFilters ? (meta.total === 1 ? 'matches your search' : 'match your search') : 'across Pakistan' }}</template>
          </p>
        </div>
      </header>

      <!-- Filters -->
      <form class="filter-bar" role="search" @submit.prevent="apply()">
        <label class="filter-field filter-search">
          <AppIcon icon="search" class="w-[18px] h-[18px] filter-icon" />
          <span class="sr-only">Search venues</span>
          <input v-model="filters.search" type="search" placeholder="Search by venue or area" @input="debouncedApply" />
        </label>
        <label class="filter-field">
          <AppIcon icon="map-pin" class="w-[18px] h-[18px] filter-icon" />
          <span class="sr-only">City</span>
          <input v-model="filters.city" type="text" list="venue-cities" placeholder="Any city" @change="apply()" />
          <datalist id="venue-cities">
            <option v-for="c in knownCities" :key="c" :value="c" />
          </datalist>
        </label>
        <label class="filter-field">
          <AppIcon icon="sparkles" class="w-[18px] h-[18px] filter-icon" />
          <span class="sr-only">Event type</span>
          <select v-model="filters.event_type" @change="apply()">
            <option value="">Any event</option>
            <option v-for="c in categories" :key="c.slug" :value="c.slug">{{ c.name }}</option>
          </select>
        </label>
        <label class="filter-field filter-sort">
          <span class="sr-only">Sort by</span>
          <select v-model="filters.sort_by" @change="apply()">
            <option value="created_at">Newest</option>
            <option value="avg_rating">Top rated</option>
            <option value="price_per_head">Lowest price</option>
          </select>
        </label>
      </form>

      <div v-if="hasFilters" class="active-filters">
        <span v-if="filters.search" class="active-chip">“{{ filters.search }}”</span>
        <span v-if="filters.city" class="active-chip">{{ filters.city }}</span>
        <span v-if="filters.event_type" class="active-chip">{{ categoryName(filters.event_type) }}</span>
        <button type="button" class="btn-ghost btn-sm" @click="clearFilters">Clear filters</button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="venue-grid" aria-busy="true">
        <div v-for="i in 6" :key="i" class="card overflow-hidden">
          <div class="skeleton" style="aspect-ratio: 3 / 2; border-radius: 0"></div>
          <div class="p-5 flex flex-col gap-2">
            <div class="skeleton h-5 w-2/3"></div>
            <div class="skeleton h-4 w-1/2"></div>
            <div class="skeleton h-4 w-1/3 mt-3"></div>
          </div>
        </div>
      </div>

      <!-- Empty -->
      <div v-else-if="venues.length === 0" class="card empty-state">
        <div class="empty-state-icon"><AppIcon icon="map-pin-off" class="w-6 h-6" /></div>
        <p class="empty-state-title">{{ hasFilters ? 'No matching venues' : 'No venues listed yet' }}</p>
        <p class="empty-state-desc">
          {{ hasFilters ? 'Try another city or event type, or clear the filters to see every venue.' : 'Venues appear here once a store is approved.' }}
        </p>
        <button v-if="hasFilters" type="button" class="btn-secondary btn-sm mt-4" @click="clearFilters">Clear filters</button>
      </div>

      <!-- Grid -->
      <div v-else class="venue-grid">
        <VenueCard v-for="venue in venues" :key="venue.id" :venue="venue" />
      </div>

      <!-- Pagination -->
      <nav v-if="meta.last_page > 1" class="pager" aria-label="Pagination">
        <p class="pager-info">Page {{ meta.current_page }} of {{ meta.last_page }}</p>
        <ul class="pager-list">
          <li>
            <button class="pager-btn" :disabled="meta.current_page === 1" aria-label="Previous page" @click="changePage(meta.current_page - 1)">
              <AppIcon icon="chevron-left" class="w-4 h-4" />
            </button>
          </li>
          <li v-for="page in visiblePages" :key="page">
            <button
              class="pager-btn"
              :aria-current="page === meta.current_page ? 'page' : undefined"
              @click="changePage(page)"
            >{{ page }}</button>
          </li>
          <li>
            <button class="pager-btn" :disabled="meta.current_page === meta.last_page" aria-label="Next page" @click="changePage(meta.current_page + 1)">
              <AppIcon icon="chevron-right" class="w-4 h-4" />
            </button>
          </li>
        </ul>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/lib/axios'
import AppIcon from '@/components/ui/AppIcon.vue'
import VenueCard from '@/components/venue/VenueCard.vue'

const route = useRoute()
const router = useRouter()

const venues = ref<any[]>([])
const categories = ref<any[]>([])
const knownCities = ref<string[]>([])
const loading = ref(false)
const meta = ref({ current_page: 1, last_page: 1, total: 0 })
let searchTimeout: ReturnType<typeof setTimeout>

const filters = reactive({ search: '', city: '', event_type: '', sort_by: 'created_at', page: 1 })

const hasFilters = computed(() => !!(filters.search.trim() || filters.city.trim() || filters.event_type))
const heading = computed(() => {
  const type = filters.event_type ? categoryName(filters.event_type).toLowerCase() : ''
  if (type && filters.city) return `Venues for ${type} in ${filters.city}`
  if (type) return `Venues for ${type}`
  if (filters.city) return `Venues in ${filters.city}`
  return 'Find a venue'
})

const visiblePages = computed(() => {
  const pages: number[] = []
  const { last_page: total, current_page: current } = meta.value
  for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) pages.push(i)
  return pages
})

function categoryName(slug: string) {
  return categories.value.find(c => c.slug === slug)?.name ?? slug.replace(/_/g, ' ')
}

// Filters live in the URL, so searches from the home page and shared links open filtered.
function readQuery() {
  const q = route.query
  filters.search = typeof q.search === 'string' ? q.search : ''
  filters.city = typeof q.city === 'string' ? q.city : ''
  filters.event_type = typeof q.event_type === 'string' ? q.event_type : ''
  filters.sort_by = typeof q.sort === 'string' && ['created_at', 'avg_rating', 'price_per_head'].includes(q.sort) ? q.sort : 'created_at'
  filters.page = Number(q.page) > 0 ? Number(q.page) : 1
}

let lastWritten = ''
// Only the newest request may update the list, so a slow older search can't overwrite it.
let requestId = 0

function apply(resetPage = true) {
  clearTimeout(searchTimeout)
  if (resetPage) filters.page = 1
  const query: Record<string, string> = {}
  if (filters.search.trim()) query.search = filters.search.trim()
  if (filters.city.trim()) query.city = filters.city.trim()
  if (filters.event_type) query.event_type = filters.event_type
  if (filters.sort_by !== 'created_at') query.sort = filters.sort_by
  if (filters.page > 1) query.page = String(filters.page)
  lastWritten = JSON.stringify(query)
  router.replace({ query })
}

function debouncedApply() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => apply(), 400)
}

function clearFilters() {
  filters.search = ''
  filters.city = ''
  filters.event_type = ''
  apply()
}

function changePage(page: number) {
  filters.page = page
  apply(false)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function loadVenues() {
  const id = ++requestId
  loading.value = true
  try {
    const params: Record<string, any> = { per_page: 12, page: filters.page, sort_by: filters.sort_by }
    if (filters.sort_by === 'avg_rating') params.sort_dir = 'desc'
    if (filters.sort_by === 'price_per_head') params.sort_dir = 'asc'
    if (filters.search.trim()) params.search = filters.search.trim()
    if (filters.city.trim()) params.city = filters.city.trim()
    if (filters.event_type) params.event_type = filters.event_type
    const { data } = await api.get('/venues', { params })
    if (id !== requestId) return
    venues.value = data.data.data
    meta.value = { current_page: data.data.current_page, last_page: data.data.last_page, total: data.data.total }
  } catch {
    if (id !== requestId) return
    venues.value = []
    meta.value = { current_page: 1, last_page: 1, total: 0 }
  } finally {
    if (id === requestId) loading.value = false
  }
}

// Back/forward or a new link: reload from the URL. Skip URLs this page just wrote,
// so the search box isn't rewritten (e.g. a trailing space dropped) while typing.
watch(() => route.fullPath, () => {
  if (route.path !== '/venues') return
  if (JSON.stringify(route.query) === lastWritten) { loadVenues(); return }
  readQuery()
  loadVenues()
})

onMounted(() => {
  readQuery()
  loadVenues()
  api.get('/categories').then(r => { categories.value = (r.data?.data ?? []).filter((c: any) => c.is_active) }).catch(() => {})
  api.get('/venues', { params: { per_page: 100 } })
    .then(r => { knownCities.value = [...new Set<string>((r.data?.data?.data ?? []).map((v: any) => v.city).filter(Boolean))].sort() })
    .catch(() => {})
})
</script>

<style scoped>
.venues-page { background: var(--canvas); padding: 40px 16px 64px; }
.venues-inner { max-width: 80rem; margin: 0 auto; }
.venues-head { margin-bottom: 24px; }
.venues-title {
  margin: 0; font-family: var(--font-display); font-size: 36px; line-height: 42px; font-weight: 700;
  letter-spacing: -0.025em; color: var(--ink);
}
.venues-sub { margin: 6px 0 0; font-size: 15px; color: var(--ink-muted); }

.filter-bar {
  display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr) minmax(0, 1fr) auto; gap: 6px; padding: 6px;
  background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-lg); box-shadow: var(--shadow-card);
  position: sticky; top: 72px; z-index: 20;
}
.filter-field { position: relative; display: flex; align-items: center; min-width: 0; }
.filter-field + .filter-field { border-left: 1px solid var(--line); }
.filter-icon { position: absolute; left: 14px; color: var(--ink-muted); pointer-events: none; }
.filter-field input, .filter-field select {
  width: 100%; height: 44px; padding: 0 14px 0 42px; border: 0; border-radius: var(--radius-md);
  background: transparent; color: var(--ink); font-size: 15px; outline-offset: -2px;
}
.filter-field select { appearance: none; cursor: pointer; }
.filter-field input::placeholder { color: var(--ink-muted); }
.filter-field input:hover, .filter-field select:hover { background: var(--surface-hover); }
.filter-sort select { padding-left: 14px; padding-right: 32px; font-weight: 500; }

.active-filters { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 16px; }
.active-chip {
  display: inline-flex; align-items: center; height: 32px; padding: 0 12px; border-radius: 9999px;
  background: var(--brand-soft); color: var(--brand-text); font-size: 13px; font-weight: 500;
}

.venue-grid { margin-top: 28px; display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; }
.empty-state.card { margin-top: 28px; }

.pager { margin-top: 40px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; }
.pager-info { margin: 0; font-size: 14px; color: var(--ink-muted); }
.pager-list { display: flex; gap: 4px; list-style: none; margin: 0; padding: 0; }
.pager-btn {
  min-width: 40px; height: 40px; padding: 0 10px; display: grid; place-items: center; border-radius: var(--radius-sm);
  border: 1px solid var(--line); background: var(--surface); color: var(--ink-secondary); font-weight: 500; cursor: pointer;
}
.pager-btn:hover:not(:disabled) { background: var(--surface-hover); color: var(--ink); }
.pager-btn:disabled { opacity: .4; cursor: not-allowed; }
.pager-btn[aria-current='page'] { background: var(--brand-strong); border-color: var(--brand-strong); color: var(--on-brand); }

@media (max-width: 767px) {
  .filter-bar { grid-template-columns: 1fr 1fr; position: static; }
  .filter-search { grid-column: span 2; }
  .filter-field + .filter-field { border-left: 0; }
  .filter-field:nth-child(n + 2) { border-top: 1px solid var(--line); }
  .venues-title { font-size: 28px; line-height: 34px; }
}
</style>
