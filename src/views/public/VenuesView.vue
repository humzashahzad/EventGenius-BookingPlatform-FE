<template>
  <div class="font-['DM_Sans']">
    <!-- Hero Header -->
    <div class="venues-hero">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 relative z-[2]">
        <h1 class="venues-hero-title">Explore Venues</h1>
        <p class="venues-hero-subtitle">Find the perfect space for your next unforgettable event</p>
      </div>
    </div>

    <div class="max-w-7xl mx-auto flex-grow px-4 py-8">
      <!-- Filters -->
      <div class="filter-bar">
        <div class="filter-search">
          <SmartSearchBox
            v-model="filters.q"
            aria-label="Search venues"
            @submit="onSearchSubmit"
            @select="onSuggestionSelect"
            @clear="onSearchClear"
          />
        </div>
        <div class="filter-divider"></div>
        <div class="filter-group">
          <input v-model="cityModel" @change="onCityChange" type="text" list="venue-cities" class="filter-input" placeholder="City" aria-label="City" />
          <datalist id="venue-cities">
            <option v-for="c in knownCities" :key="c" :value="c" />
          </datalist>
        </div>
        <div class="filter-divider"></div>
        <div class="filter-group">
          <select v-model="eventModel" @change="onEventChange" class="filter-select" aria-label="Event type">
            <option value="">All Types</option>
            <option v-for="c in categories" :key="c.slug" :value="c.slug">{{ c.name }}</option>
          </select>
        </div>
        <div class="filter-divider"></div>
        <div class="filter-group">
          <select v-model="filters.sort_by" @change="applyFilters" class="filter-select" aria-label="Sort by">
            <option value="best_match">Best match</option>
            <option value="created_at">Newest</option>
            <option value="avg_rating">Top Rated</option>
            <option value="price_per_head">Price (Low-High)</option>
          </select>
        </div>
        <div class="filter-divider"></div>
        <div class="filter-near">
          <button
            type="button"
            class="near-me-btn"
            :class="{ 'near-me-btn--on': hasLocation, 'near-me-btn--hint': wantsNearMe && !hasLocation }"
            :aria-pressed="hasLocation ? 'true' : 'false'"
            :disabled="locating"
            @click="hasLocation ? clearLocation() : useMyLocation()"
          >
            <AppIcon :icon="locating ? 'loader' : 'map-pin'" :class="locating ? 'w-4 h-4 shrink-0 animate-spin' : 'w-4 h-4 shrink-0'" />
            <span>{{ locating ? 'Locating…' : 'Near me' }}</span>
          </button>
        </div>
      </div>

      <p v-if="geoMessage" class="-mt-5 mb-4 text-xs font-medium text-amber-700 dark:text-amber-400 flex items-start gap-1.5" role="status">
        <AppIcon icon="alert-circle" class="w-3.5 h-3.5 mt-px shrink-0" />
        <span>{{ geoMessage }}</span>
      </p>

      <UnderstoodChips v-if="displayChips.length" :chips="displayChips" class="-mt-4 mb-5" @remove="removeChip" />

      <!-- Results Count -->
      <div v-if="hasFilters || (!loading && venues.length > 0)" class="mb-6 min-h-[20px]">
        <span v-if="loading" class="text-sm font-semibold text-warm-500">Searching…</span>
        <span v-else class="text-sm font-semibold text-warm-500">{{ meta.total }} {{ meta.total === 1 ? 'venue' : 'venues' }} found</span>
        <button v-if="hasFilters" type="button" class="ml-3 text-sm font-semibold text-primary-700 dark:text-primary-400 hover:underline" @click="clearFilters">Clear filters</button>
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
        <template v-if="relaxOptions.length">
          <p class="empty-state-desc">Nothing matches all of that. Try relaxing one of these:</p>
          <div class="flex flex-wrap justify-center gap-2 mt-4">
            <button
              v-for="opt in relaxOptions"
              :key="opt.key"
              type="button"
              class="inline-flex items-center gap-1.5 rounded-full border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-3 py-1.5 text-sm font-semibold hover:bg-primary-100 dark:hover:bg-primary-900/50 max-w-full"
              @click="removeChips(opt.chips)"
            >
              <AppIcon icon="x" class="w-3.5 h-3.5 shrink-0" />
              <span class="truncate">{{ opt.label }}</span>
            </button>
          </div>
        </template>
        <p v-else class="empty-state-desc">Try adjusting your search or filters to find what you're looking for.</p>
      </div>

      <!-- Venue Grid -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
        <div v-for="(venue, index) in venues" :key="venue.id" class="animate-fade-in-up min-w-0">
          <RouterLink :to="`/venues/${venue.id}`" class="browse-venue-card" @click="trackClick(venue, index)" @auxclick="(e: MouseEvent) => e.button === 1 && trackClick(venue, index)">
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
                <AppIcon icon="star-filled" class="w-3 h-3" />
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
              <MatchReasons v-if="showReasons" :reasons="venue.match?.reasons" />
              <p class="browse-venue-desc">{{ venue.description }}</p>
              <div class="browse-venue-footer">
                <div>
                  <span class="browse-venue-price">PKR {{ formatPrice(venue) }}</span>
                  <span class="browse-venue-price-label"> / head</span>
                </div>
                <div class="browse-venue-tags">
                  <span v-for="type in (venue.event_types || []).slice(0, 2)" :key="type" class="browse-venue-tag">{{ type.replace(/_/g, ' ') }}</span>
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
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import api from '@/lib/axios'
import { getStorageUrl } from '@/lib/storageUrl'
import AppIcon from '@/components/ui/AppIcon.vue'
import SmartSearchBox from '@/components/search/SmartSearchBox.vue'
import UnderstoodChips from '@/components/search/UnderstoodChips.vue'
import MatchReasons from '@/components/search/MatchReasons.vue'
import { normalizeUnderstood, type SearchChip, type Suggestion, type Understood } from '@/components/search/types'
import { removeChipFromQuery } from '@/components/search/queryRewrite'

const route = useRoute()
const router = useRouter()

const PER_PAGE = 12
const SORTS = ['best_match', 'created_at', 'avg_rating', 'price_per_head']
const DEFAULT_SORT = 'best_match'

const venues = ref<any[]>([])
const categories = ref<any[]>([])
const knownCities = ref<string[]>([])
const loading = ref(false)
const meta = ref({ current_page: 1, last_page: 1, total: 0 })
const understood = ref<Understood | null>(null)
const resultSort = ref<string>(DEFAULT_SORT)
// Ties later pages of one search together in the search log.
let searchId: string | null = null

const filters = reactive({
  q: '',
  city: '',
  event_type: '',
  sort_by: DEFAULT_SORT,
  page: 1,
  lat: null as number | null,
  lng: null as number | null,
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

const hasLocation = computed(() => filters.lat !== null && filters.lng !== null)
const hasFilters = computed(() => !!(filters.q.trim() || filters.city.trim() || filters.event_type || hasLocation.value))
const showReasons = computed(() => filters.sort_by === 'best_match' && resultSort.value === 'best_match')
const wantsNearMe = computed(() => !!understood.value?.intents.includes('near_me'))

// Dropdowns show what was understood from the text until the user picks something explicitly.
const cityModel = computed({
  get: () => filters.city || understood.value?.city || '',
  set: (v: string) => { filters.city = v },
})
const eventModel = computed({
  get: () => filters.event_type || understood.value?.event_type || '',
  set: (v: string) => { filters.event_type = v },
})

function categoryName(slug: string) {
  return categories.value.find(c => c.slug === slug)?.name || slug.replace(/_/g, ' ')
}

/** Chips understood from the query, minus those an explicit dropdown overrides, plus "Near you". */
const displayChips = computed<SearchChip[]>(() => {
  const chips = (understood.value?.chips ?? []).filter(c => {
    if (c.type === 'city' && filters.city.trim()) return false
    if (c.type === 'event_type' && filters.event_type) return false
    // The location chip below already says this.
    if (c.type === 'intent' && c.value === 'near_me' && hasLocation.value) return false
    return true
  })
  if (hasLocation.value) chips.push({ type: 'near_me', label: 'Near you', source: 'location' })
  return chips
})

/** Every constraint currently in force, explicit or understood, for the "relax" buttons. */
function constraintChips(type: SearchChip['type']): SearchChip[] {
  const out = (understood.value?.chips ?? []).filter(c => c.type === type)
  if (type === 'city' && filters.city.trim()) out.push({ type: 'city', label: filters.city, value: filters.city, source: 'filter' })
  if (type === 'event_type' && filters.event_type) out.push({ type: 'event_type', label: categoryName(filters.event_type), value: filters.event_type, source: 'filter' })
  return out
}

// Most restrictive first: budget and size cut the most venues, then keywords, then place/type.
const relaxOptions = computed(() => {
  const opts: { key: string; label: string; chips: SearchChip[] }[] = []
  const budget = [...constraintChips('max_price'), ...constraintChips('min_price')]
  if (budget.length) opts.push({ key: 'budget', label: 'Remove budget', chips: budget })
  const guests = constraintChips('guests')
  if (guests.length) opts.push({ key: 'guests', label: 'Any guest count', chips: guests })
  for (const c of [...constraintChips('amenity'), ...constraintChips('term')].slice(0, 2)) {
    opts.push({ key: `w-${c.type}-${c.value}`, label: `Remove ${c.label}`, chips: [c] })
  }
  const ev = constraintChips('event_type')
  if (ev.length) opts.push({ key: 'event', label: 'Any event type', chips: ev })
  const city = constraintChips('city')
  if (city.length) opts.push({ key: 'city', label: 'Any city', chips: city })
  if (hasLocation.value) opts.push({ key: 'near', label: 'Anywhere, not just near me', chips: [{ type: 'near_me', label: 'Near you', source: 'location' }] })
  return opts.slice(0, 4)
})

// Only the newest request may update the list, so a slow older search can't overwrite it.
let requestId = 0

async function loadVenues() {
  const id = ++requestId
  loading.value = true
  try {
    // track=1: this page is a real search even with no text or filters, so the backend logs it
    // (background lists such as the city look-up below are not logged).
    const params: Record<string, any> = { per_page: PER_PAGE, page: filters.page, sort_by: filters.sort_by, track: 1 }
    if (filters.sort_by === 'price_per_head') params.sort_dir = 'asc'
    if (filters.sort_by === 'avg_rating') params.sort_dir = 'desc'
    if (filters.sort_by === 'created_at') params.sort_dir = 'desc'
    if (filters.q.trim()) params.q = filters.q.trim()
    if (filters.city.trim()) params.city = filters.city.trim()
    if (filters.event_type) params.event_type = filters.event_type
    if (hasLocation.value) { params.lat = filters.lat; params.lng = filters.lng }
    if (filters.page > 1 && searchId) params.search_id = searchId

    const { data } = await api.get('/venues', { params })
    if (id !== requestId) return
    venues.value = data.data.data
    meta.value = {
      current_page: data.data.current_page,
      last_page: data.data.last_page,
      total: data.data.total,
    }
    const search = data.search ?? null
    understood.value = normalizeUnderstood(search?.understood)
    resultSort.value = search?.sort ?? filters.sort_by
    if (filters.page === 1 || !searchId) searchId = search?.search_id ?? null
  } catch (e) {
    if (id !== requestId) return
    venues.value = []
    meta.value = { current_page: 1, last_page: 1, total: 0 }
  } finally {
    if (id === requestId) loading.value = false
  }
}

function parseCoord(v: unknown, limit: number): number | null {
  if (typeof v !== 'string' || v.trim() === '') return null
  const n = Number(v)
  return Number.isFinite(n) && Math.abs(n) <= limit ? Math.round(n * 1000) / 1000 : null
}

// Keep filters in the URL so links from the home page and refreshes keep the search.
function readQuery() {
  const q = route.query
  // `search` is the old name of `q`; old links keep working.
  filters.q = typeof q.q === 'string' ? q.q : (typeof q.search === 'string' ? q.search : '')
  filters.city = typeof q.city === 'string' ? q.city : ''
  filters.event_type = typeof q.event_type === 'string' ? q.event_type : ''
  filters.sort_by = typeof q.sort === 'string' && SORTS.includes(q.sort) ? q.sort : DEFAULT_SORT
  filters.page = Number(q.page) > 0 ? Math.floor(Number(q.page)) : 1
  const lat = parseCoord(q.lat, 90)
  const lng = parseCoord(q.lng, 180)
  filters.lat = lat !== null && lng !== null ? lat : null
  filters.lng = lat !== null && lng !== null ? lng : null
  searchId = null
}

let lastWritten = ''
function buildQuery() {
  const query: Record<string, string> = {}
  if (filters.q.trim()) query.q = filters.q.trim()
  if (filters.city.trim()) query.city = filters.city.trim()
  if (filters.event_type) query.event_type = filters.event_type
  if (filters.sort_by !== DEFAULT_SORT) query.sort = filters.sort_by
  if (hasLocation.value) { query.lat = String(filters.lat); query.lng = String(filters.lng) }
  if (filters.page > 1) query.page = String(filters.page)
  return query
}

function writeQuery() {
  const query = buildQuery()
  lastWritten = JSON.stringify(query)
  router.replace({ query })
}

// Any filter change starts again from page 1 as a new search.
function applyFilters() {
  filters.page = 1
  searchId = null
  writeQuery()
  loadVenues()
}

function onSearchSubmit(q: string) {
  filters.q = q
  applyFilters()
}

function onSearchClear() {
  filters.q = ''
  applyFilters()
}

/** Drops the half-typed last word when a suggestion completes it ("wedding in lah" + Lahore). */
function withoutPartialWord(q: string, s: Suggestion) {
  const words = q.trim().split(/\s+/).filter(Boolean)
  const last = words[words.length - 1]?.toLowerCase() ?? ''
  const targets = [s.value, s.city ?? '', ...s.label.split(/\s+/)].map(t => t.toLowerCase().replace(/_/g, ' '))
  if (last && targets.some(t => t && t.startsWith(last))) words.pop()
  if (/^(in|at|near|for)$/i.test(words[words.length - 1] ?? '')) words.pop()
  return words.join(' ')
}

function onSuggestionSelect(s: Suggestion) {
  if (s.type === 'city') {
    filters.q = withoutPartialWord(filters.q, s)
    filters.city = s.city || s.value
  } else if (s.type === 'category') {
    filters.q = withoutPartialWord(filters.q, s)
    filters.event_type = s.value
  } else if (s.type === 'query') {
    filters.q = s.value
  }
  applyFilters()
}

// Clearing a dropdown that only showed an understood value also takes it out of the text,
// otherwise the same value would come straight back.
function onCityChange() {
  if (!filters.city.trim() && understood.value?.city) {
    filters.q = removeChipFromQuery(filters.q, { type: 'city', label: understood.value.city, value: understood.value.city })
  }
  applyFilters()
}

function onEventChange() {
  if (!filters.event_type && understood.value?.event_type) {
    const slug = understood.value.event_type
    filters.q = removeChipFromQuery(filters.q, { type: 'event_type', label: categoryName(slug), value: slug })
  }
  applyFilters()
}

function dropChip(chip: SearchChip) {
  if (chip.type === 'near_me') {
    filters.lat = null
    filters.lng = null
    return
  }
  if (chip.source === 'filter') {
    if (chip.type === 'city') filters.city = ''
    if (chip.type === 'event_type') filters.event_type = ''
  }
  // Also take it out of the text, so an explicit filter removal does not fall back to the same value.
  filters.q = removeChipFromQuery(filters.q, chip)
  if (chip.type === 'city' && filters.city && filters.city.toLowerCase() === String(chip.value ?? '').toLowerCase()) filters.city = ''
  if (chip.type === 'event_type' && filters.event_type === chip.value) filters.event_type = ''
}

function removeChip(chip: SearchChip) {
  dropChip(chip)
  applyFilters()
}

function removeChips(chips: SearchChip[]) {
  chips.forEach(dropChip)
  applyFilters()
}

function clearFilters() {
  filters.q = ''
  filters.city = ''
  filters.event_type = ''
  filters.lat = null
  filters.lng = null
  applyFilters()
}

// ─── Near me ─────────────────────────────────────────────────────────────────
const locating = ref(false)
const geoMessage = ref('')
let geoMessageTimer: ReturnType<typeof setTimeout> | undefined

function showGeoMessage(msg: string) {
  geoMessage.value = msg
  clearTimeout(geoMessageTimer)
  geoMessageTimer = setTimeout(() => { geoMessage.value = '' }, 6000)
}

function useMyLocation() {
  if (!('geolocation' in navigator) || !window.isSecureContext) {
    showGeoMessage('Your browser cannot share your location here. Pick a city instead.')
    return
  }
  locating.value = true
  navigator.geolocation.getCurrentPosition(
    pos => {
      locating.value = false
      geoMessage.value = ''
      filters.lat = Math.round(pos.coords.latitude * 1000) / 1000
      filters.lng = Math.round(pos.coords.longitude * 1000) / 1000
      applyFilters()
    },
    err => {
      locating.value = false
      showGeoMessage(err.code === err.PERMISSION_DENIED
        ? 'Location access is blocked. Allow it in your browser settings, or pick a city instead.'
        : 'We could not find your location right now. Pick a city instead.')
    },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 },
  )
}

function clearLocation() {
  filters.lat = null
  filters.lng = null
  applyFilters()
}

// ─── Click tracking ──────────────────────────────────────────────────────────
// Fire and forget: never awaited, errors swallowed, so it can't slow or break navigation.
function trackClick(venue: any, index: number) {
  if (!venue?.id) return
  const position = (meta.value.current_page - 1) * PER_PAGE + index + 1
  const body: Record<string, any> = { position }
  if (searchId) body.search_id = searchId
  try {
    api.post(`/venues/${venue.id}/click`, body).catch(() => {})
  } catch { /* ignore */ }
}

function changePage(page: number) {
  if (page < 1 || page > meta.value.last_page || page === meta.value.current_page) return
  filters.page = page
  writeQuery()
  loadVenues()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Back/forward or a new link to this page: reload from the URL.
watch(() => route.fullPath, () => {
  if (route.path !== '/venues') return
  if (JSON.stringify(route.query) === lastWritten) return
  readQuery()
  loadVenues()
})

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

onMounted(() => {
  readQuery()
  // Rewrite an old ?search= link to the new ?q= form.
  if (typeof route.query.search === 'string') writeQuery()
  loadVenues()
  api.get('/categories')
    .then(r => { categories.value = (r.data?.data ?? []).filter((c: any) => c.is_active !== false) })
    .catch(() => {})
  api.get('/venues', { params: { per_page: 100, sort_by: 'created_at' } })
    .then(r => {
      knownCities.value = [...new Set<string>((r.data?.data?.data ?? []).map((v: any) => v.city).filter(Boolean))].sort()
    })
    .catch(() => {})
})

onBeforeUnmount(() => clearTimeout(geoMessageTimer))
</script>

<style scoped>
/* ─── Hero ─────────────────────────────────────────────────────────────────── */
.venues-hero {
  position: relative;
  padding: 4rem 1rem 3rem;
  background: #064E3B;
  overflow: hidden;
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
  flex: 3;
  min-width: 0;
}

.filter-near {
  flex: 0 0 auto;
  padding: 0 0.25rem;
}

.near-me-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  white-space: nowrap;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  padding: 0.5rem 0.75rem;
  border-radius: 0.75rem;
  border: 1px solid transparent;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.near-me-btn:hover,
.near-me-btn:focus-visible {
  background: var(--color-bg-hover);
  outline: none;
}

.near-me-btn--on {
  color: #0369A1;
  background: #F0F9FF;
  border-color: #BAE6FD;
}

.near-me-btn--hint {
  color: #047857;
  border-color: #6EE7B7;
}

:root.dark .near-me-btn--on {
  color: #7DD3FC;
  background: rgba(14, 165, 233, 0.15);
  border-color: rgba(14, 165, 233, 0.4);
}

:root.dark .near-me-btn--hint {
  color: #34D399;
  border-color: rgba(16, 185, 129, 0.5);
}

.near-me-btn:disabled {
  opacity: 0.7;
  cursor: progress;
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
  background: #FBBF24;
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

  .filter-near {
    width: 100%;
    padding: 0.25rem;
  }

  .near-me-btn {
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
