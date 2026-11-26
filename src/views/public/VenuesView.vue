<template>
  <div class="bg-canvas min-h-[70vh]">
    <!-- Page header -->
    <header class="border-b border-line bg-surface">
      <div class="content-container pt-6 pb-5 sm:pt-8">
        <nav aria-label="Breadcrumb" class="text-[0.8125rem] text-ink-muted">
          <RouterLink to="/" class="hover:text-ink">Home</RouterLink>
          <span class="mx-1.5" aria-hidden="true">/</span>
          <span class="text-ink-secondary">Venues</span>
        </nav>
        <h1 class="heading-1 mt-2">{{ pageTitle }}</h1>
        <p class="mt-1 text-[0.9375rem] text-ink-muted">Search in plain words — city, occasion, guest count and budget are picked up automatically.</p>
        <RouterLink :to="{ path: '/ask', query: filters.q.trim() ? { q: filters.q.trim() } : {} }" class="link mt-2 inline-flex items-center gap-1.5 text-sm font-medium">
          <AppIcon icon="message-circle" class="w-4 h-4" />
          Prefer to chat? Ask EventGenius
        </RouterLink>
      </div>
    </header>

    <!-- Sticky search & filter bar -->
    <div class="filter-shell">
      <div class="content-container py-3">
        <div class="filter-grid">
          <div class="filter-search min-w-0">
            <SmartSearchBox
              v-model="filters.q"
              aria-label="Search venues"
              @submit="onSearchSubmit"
              @select="onSuggestionSelect"
              @clear="onSearchClear"
            />
          </div>
          <div class="min-w-0">
            <label for="venue-city" class="sr-only">City</label>
            <Combobox id="venue-city" v-model="cityModel" :options="knownCities" prefix-icon="map-pin" placeholder="Any city" allow-custom clearable aria-label="City" empty-text="Press Enter to search this city" @select="onCityChange" />
          </div>
          <div class="min-w-0">
            <label for="venue-type" class="sr-only">Event type</label>
            <SelectInput id="venue-type" v-model="eventModel" :options="[{ value: '', label: 'Any event type' }, ...categories.map(c => ({ value: c.slug, label: c.name }))]" @change="onEventChange" />
          </div>
          <button
            type="button"
            class="near-me-btn"
            :class="{ 'is-on': hasLocation, 'is-hint': wantsNearMe && !hasLocation }"
            :aria-pressed="hasLocation ? 'true' : 'false'"
            :disabled="locating"
            @click="hasLocation ? clearLocation() : useMyLocation()"
          >
            <AppIcon :icon="locating ? 'loader' : 'map-pin'" :class="locating ? 'w-4 h-4 shrink-0 animate-spin' : 'w-4 h-4 shrink-0'" />
            <span>{{ locating ? 'Locating…' : hasLocation ? 'Near me · on' : 'Near me' }}</span>
          </button>
        </div>

        <p v-if="geoMessage" class="mt-2 text-[0.8125rem] font-medium text-warning-text flex items-start gap-1.5" role="status">
          <AppIcon icon="alert-circle" class="w-4 h-4 mt-px shrink-0" />
          <span>{{ geoMessage }}</span>
        </p>

        <UnderstoodChips v-if="displayChips.length" :chips="displayChips" class="mt-2.5" @remove="removeChip" />
      </div>
    </div>

    <div class="content-container py-6 sm:py-8">
      <!-- Results toolbar -->
      <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-wrap items-center gap-x-3 gap-y-1 min-h-[2rem]" aria-live="polite">
          <p v-if="loading" class="text-sm font-medium text-ink-muted">Searching…</p>
          <p v-else class="text-sm text-ink-secondary">
            <span class="font-semibold text-ink num">{{ meta.total }}</span> {{ meta.total === 1 ? 'venue' : 'venues' }}
            <template v-if="meta.total > 0 && meta.last_page > 1"> · showing {{ rangeFrom }}–{{ rangeTo }}</template>
          </p>
          <button v-if="hasFilters" type="button" class="btn-link" @click="clearFilters">Clear filters</button>
        </div>
        <div class="flex items-center gap-2">
          <label for="venue-sort" class="text-[0.8125rem] text-ink-muted whitespace-nowrap">Sort by</label>
          <SelectInput
            id="venue-sort"
            v-model="filters.sort_by"
            size="sm"
            class="!w-auto"
            :options="[{ value: 'best_match', label: 'Best match' }, { value: 'created_at', label: 'Newest' }, { value: 'avg_rating', label: 'Top rated' }, { value: 'price_per_head', label: 'Price: low to high' }]"
            @change="applyFilters"
          />
          <div class="segmented control-sm hidden sm:inline-flex" role="group" aria-label="Layout">
            <button type="button" :aria-pressed="density === 'grid'" aria-label="Grid view" title="Grid view" @click="setDensity('grid')">
              <AppIcon icon="layout-grid" class="w-4 h-4" />
            </button>
            <button type="button" :aria-pressed="density === 'list'" aria-label="List view" title="List view" @click="setDensity('list')">
              <AppIcon icon="menu" class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <!-- Skeleton only before the first results; later searches keep the cards on screen. -->
      <div v-if="loading && !loadedOnce" :class="gridClass">
        <VenueCardSkeleton v-for="i in 6" :key="i" :layout="density" />
      </div>

      <!-- Error -->
      <div v-else-if="loadFailed" class="card">
        <div class="empty-state">
          <div class="empty-state-icon"><AppIcon icon="alert-triangle" class="w-5 h-5" /></div>
          <p class="empty-state-title">We couldn't load venues</p>
          <p class="empty-state-desc">Check your connection and try again.</p>
          <div class="empty-state-actions"><button type="button" class="btn-primary" @click="loadVenues()">Try again</button></div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else-if="venues.length === 0" class="card">
        <div class="empty-state">
          <div class="empty-state-icon"><AppIcon icon="map-pin-off" class="w-5 h-5" /></div>
          <p class="empty-state-title">No venues found</p>
          <template v-if="relaxOptions.length">
            <p class="empty-state-desc">Nothing matches all of that. Try relaxing one of these:</p>
            <div class="empty-state-actions">
              <button
                v-for="opt in relaxOptions"
                :key="opt.key"
                type="button"
                class="btn-secondary btn-sm max-w-full"
                @click="removeChips(opt.chips)"
              >
                <AppIcon icon="x" class="w-3.5 h-3.5 shrink-0" />
                <span class="truncate">{{ opt.label }}</span>
              </button>
            </div>
          </template>
          <template v-else>
            <p class="empty-state-desc">Try a different search, or browse every venue we list.</p>
            <div class="empty-state-actions">
              <button v-if="hasFilters" type="button" class="btn-primary" @click="clearFilters">Clear filters</button>
              <RouterLink v-else to="/" class="btn-primary">Back to home</RouterLink>
            </div>
          </template>
        </div>
      </div>

      <!-- Results -->
      <ul v-else :class="[gridClass, 'transition-opacity duration-150', loading ? 'opacity-60' : '']" :aria-busy="loading" aria-label="Venue results">
        <li v-for="(venue, index) in venues" :key="venue.id" class="min-w-0">
          <VenueCard
            :venue="venue"
            :layout="density"
            :categories="categories"
            :show-reasons="showReasons"
            :eager="index < 3"
            heading-tag="h2"
            @open="trackClick(venue, index)"
          />
        </li>
      </ul>

      <!-- Pagination -->
      <nav v-if="meta.last_page > 1 && !(loading && !loadedOnce)" class="pagination-bar" aria-label="Pagination">
        <p class="text-[0.8125rem] text-ink-muted">Page {{ meta.current_page }} of {{ meta.last_page }}</p>
        <ul class="flex items-center gap-1">
          <li>
            <button
              class="page-btn"
              :disabled="meta.current_page === 1"
              aria-label="Previous page"
              @click="changePage(meta.current_page - 1)"
            >
              <AppIcon icon="chevron-left" class="w-4 h-4" />
              <span class="hidden sm:inline">Previous</span>
            </button>
          </li>
          <li v-for="page in visiblePages" :key="page">
            <button
              class="page-btn page-num"
              :aria-current="page === meta.current_page ? 'page' : undefined"
              :aria-label="`Page ${page}`"
              @click="changePage(page)"
            >{{ page }}</button>
          </li>
          <li>
            <button
              class="page-btn"
              :disabled="meta.current_page === meta.last_page"
              aria-label="Next page"
              @click="changePage(meta.current_page + 1)"
            >
              <span class="hidden sm:inline">Next</span>
              <AppIcon icon="chevron-right" class="w-4 h-4" />
            </button>
          </li>
        </ul>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import api from '@/lib/axios'
import { cacheGet, cacheSet } from '@/composables/usePageCache'
import { useLiveRefresh } from '@/composables/useLiveRefresh'
import { useLiveChannel } from '@/lib/liveData'
import AppIcon from '@/components/ui/AppIcon.vue'
import SmartSearchBox from '@/components/search/SmartSearchBox.vue'
import { Combobox, SelectInput } from '@/components/forms'
import UnderstoodChips from '@/components/search/UnderstoodChips.vue'
import VenueCard from '@/components/venue/VenueCard.vue'
import VenueCardSkeleton from '@/components/venue/VenueCardSkeleton.vue'
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
const loadedOnce = ref(false)
const loadFailed = ref(false)
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

// Last results per search, so coming back to this page shows them at once.
function resultsKey() {
  return `public:venues:${JSON.stringify([filters.q.trim(), filters.city.trim(), filters.event_type, filters.sort_by, filters.page, filters.lat, filters.lng])}`
}
function showCachedResults(): boolean {
  const hit = cacheGet<{ venues: any[]; meta: typeof meta.value; understood: Understood | null; resultSort: string }>(resultsKey())
  if (!hit) return false
  venues.value = hit.venues
  meta.value = hit.meta
  understood.value = hit.understood
  resultSort.value = hit.resultSort
  loadedOnce.value = true
  return true
}

async function loadVenues(opts: { quiet?: boolean } = {}) {
  const quiet = !!opts.quiet && loadedOnce.value
  const id = ++requestId
  if (!quiet) {
    loading.value = true
    loadFailed.value = false
  }
  try {
    // track=1: this page is a real search even with no text or filters, so the backend logs it
    // (background lists such as the city look-up below are not logged, nor are quiet refreshes).
    const params: Record<string, any> = { per_page: PER_PAGE, page: filters.page, sort_by: filters.sort_by }
    if (!quiet) params.track = 1
    if (filters.sort_by === 'price_per_head') params.sort_dir = 'asc'
    if (filters.sort_by === 'avg_rating') params.sort_dir = 'desc'
    if (filters.sort_by === 'created_at') params.sort_dir = 'desc'
    if (filters.q.trim()) params.q = filters.q.trim()
    if (filters.city.trim()) params.city = filters.city.trim()
    if (filters.event_type) params.event_type = filters.event_type
    if (hasLocation.value) { params.lat = filters.lat; params.lng = filters.lng }
    if (filters.page > 1 && searchId) params.search_id = searchId

    const key = resultsKey()
    const { data } = await api.get('/venues', { params })
    if (id !== requestId) return
    venues.value = data.data.data
    meta.value = {
      current_page: data.data.current_page,
      last_page: data.data.last_page,
      total: data.data.total,
    }
    const search = data.search ?? null
    if (!quiet || search) {
      understood.value = normalizeUnderstood(search?.understood)
      resultSort.value = search?.sort ?? filters.sort_by
    }
    if (!quiet && (filters.page === 1 || !searchId)) searchId = search?.search_id ?? null
    loadedOnce.value = true
    cacheSet(key, { venues: venues.value, meta: meta.value, understood: understood.value, resultSort: resultSort.value })
  } catch (e) {
    if (id !== requestId || quiet) return
    loadFailed.value = true
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

// ─── Layout density (per-viewer preference) ──────────────────────────────────
const DENSITY_KEY = 'eg.venues.density'
function readDensity(): 'grid' | 'list' {
  try { return localStorage.getItem(DENSITY_KEY) === 'list' ? 'list' : 'grid' } catch { return 'grid' }
}
const density = ref<'grid' | 'list'>(readDensity())
function setDensity(d: 'grid' | 'list') {
  density.value = d
  try { localStorage.setItem(DENSITY_KEY, d) } catch { /* ignore */ }
}
const gridClass = computed(() =>
  density.value === 'list' ? 'grid grid-cols-1 gap-4 sm:grid-cols-1 lg:grid-cols-1' : 'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3',
)

const rangeFrom = computed(() => (meta.value.current_page - 1) * PER_PAGE + 1)
const rangeTo = computed(() => Math.min(meta.value.total, meta.value.current_page * PER_PAGE))

const pageTitle = computed(() => {
  const city = filters.city.trim() || understood.value?.city || ''
  const ev = filters.event_type || understood.value?.event_type || ''
  const name = ev ? categoryName(ev).replace(/\b\w/g, (ch: string) => ch.toUpperCase()) : ''
  const what = ev ? `Venues for ${name}` : 'Event venues'
  return city ? `${what} in ${city}` : `${what} in Pakistan`
})

onMounted(() => {
  readQuery()
  // Rewrite an old ?search= link to the new ?q= form.
  if (typeof route.query.search === 'string') writeQuery()
  showCachedResults()
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

// Venues approved, edited, re-rated or removed elsewhere: refresh these results quietly.
useLiveChannel('catalog')
useLiveRefresh(['venue', 'store', 'category'], () => {
  if (route.path === '/venues' && !loading.value) void loadVenues({ quiet: true })
}, 500)
</script>

<style scoped>
.filter-shell {
  background: var(--surface);
  border-bottom: 1px solid var(--line);
}
@media (min-width: 768px) {
  .filter-shell { position: sticky; top: 64px; z-index: var(--z-sticky); box-shadow: var(--shadow-xs); }
}

.filter-grid {
  display: grid;
  gap: 0.5rem;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
}
.filter-search { grid-column: 1 / -1; }
.near-me-btn { grid-column: 1 / -1; }
@media (min-width: 768px) {
  .filter-grid { grid-template-columns: minmax(0, 1fr) 11rem 12rem auto; }
  .filter-search, .near-me-btn { grid-column: auto; }
}
@media (min-width: 1024px) {
  .filter-grid { grid-template-columns: minmax(0, 1fr) 13rem 14rem auto; }
}

.near-me-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  height: var(--control-h-md);
  padding: 0 0.875rem;
  white-space: nowrap;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--ink);
  background: var(--surface);
  border: 1px solid rgb(var(--c-line-strong) / 0.55);
  border-radius: var(--radius-md);
  transition: background-color .15s ease, border-color .15s ease, color .15s ease;
}
.near-me-btn:hover:not(:disabled) { background: var(--surface-hover); border-color: var(--line-strong); }
.near-me-btn.is-on { color: rgb(var(--c-info-text)); background: rgb(var(--c-info-soft)); border-color: rgb(var(--c-info-line)); }
.near-me-btn.is-hint { color: var(--brand-text); border-color: var(--brand-strong); }
.near-me-btn:disabled { opacity: 0.7; cursor: progress; }

.pagination-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 2rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--line);
}
.page-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  min-width: var(--control-h-md);
  height: var(--control-h-md);
  padding: 0 0.625rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--ink-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  transition: background-color .15s ease, border-color .15s ease;
}
.page-btn:hover:not(:disabled) { background: var(--surface-hover); border-color: rgb(var(--c-line-strong) / 0.55); color: var(--ink); }
.page-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.page-btn[aria-current='page'] { background: var(--brand-strong); border-color: var(--brand-strong); color: var(--on-brand); font-weight: 600; }
</style>
