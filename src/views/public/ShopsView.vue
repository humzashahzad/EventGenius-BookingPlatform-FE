<template>
  <div class="shops-page">
    <div class="content-container">
      <!-- Header -->
      <header class="shops-head">
        <p class="shops-eyebrow">Venue shops</p>
        <h1 class="shops-title">{{ heading }}</h1>
        <p class="shops-sub">
          Browse the companies behind the venues: banquet groups, marquees and event centres. Open a shop to see all its venues, photos and reviews.
        </p>
      </header>

      <!-- Filters -->
      <form class="shops-filters" role="search" @submit.prevent="apply()">
        <TextInput
          v-model="filters.q"
          class="sf-search"
          type="search"
          prefix-icon="search"
          clearable
          clear-label="Clear search"
          placeholder="Search by shop name or area"
          :maxlength="100"
          aria-label="Search shops"
          @keydown.enter.prevent="apply()"
          @clear="apply()"
        />
        <SelectInput v-model="filters.event_type" :options="occasionOptions" aria-label="Occasion" @change="apply()" />
        <SelectInput v-model="filters.sort" :options="sortOptions" aria-label="Sort by" @change="apply()" />
        <button type="button" class="btn-secondary sf-near" :class="{ 'is-on': hasLocation }" :disabled="locating" @click="hasLocation ? clearLocation() : nearMe()">
          <AppIcon :icon="locating ? 'loader' : 'map-pin'" :class="locating ? 'w-4 h-4 animate-spin' : 'w-4 h-4'" />
          {{ hasLocation ? 'Near you' : 'Near me' }}
          <AppIcon v-if="hasLocation" icon="x" class="w-3.5 h-3.5" />
        </button>
      </form>
      <p v-if="locationError" class="shops-note" role="status">{{ locationError }}</p>

      <!-- Cities -->
      <nav v-if="cities.length" class="city-chips" aria-label="Filter by city">
        <button type="button" class="city-chip" :class="{ 'is-on': !filters.city }" :aria-pressed="!filters.city" @click="setCity('')">
          All cities <span class="city-count">{{ totalCityStores }}</span>
        </button>
        <button
          v-for="c in cities"
          :key="c.city"
          type="button"
          class="city-chip"
          :class="{ 'is-on': filters.city === c.city }"
          :aria-pressed="filters.city === c.city"
          @click="setCity(c.city)"
        >
          {{ c.city }} <span class="city-count">{{ c.stores }}</span>
        </button>
      </nav>

      <!-- Toolbar -->
      <div class="shops-toolbar">
        <p class="shops-count" aria-live="polite">
          <template v-if="loading">Finding shops…</template>
          <template v-else>{{ meta.total }} {{ meta.total === 1 ? 'shop' : 'shops' }}<template v-if="filters.city"> in {{ filters.city }}</template></template>
        </p>
        <button v-if="hasFilters" type="button" class="btn-ghost btn-sm" @click="clearAll">Clear filters</button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="shops-grid" aria-busy="true">
        <div v-for="i in 6" :key="i" class="shop-card shop-skel">
          <div class="skeleton shop-skel-img"></div>
          <div class="p-5 space-y-3">
            <div class="skeleton h-5 w-2/3"></div>
            <div class="skeleton h-4 w-1/2"></div>
            <div class="skeleton h-4 w-3/4"></div>
          </div>
        </div>
      </div>

      <!-- Error -->
      <div v-else-if="loadFailed" class="card shops-empty">
        <AppIcon icon="alert-triangle" class="w-6 h-6" />
        <p class="shops-empty-title">We couldn't load shops</p>
        <p class="shops-empty-text">Check your connection and try again.</p>
        <button type="button" class="btn-secondary btn-sm mt-3" @click="load">Try again</button>
      </div>

      <!-- Empty -->
      <div v-else-if="!shops.length" class="card shops-empty">
        <AppIcon icon="building-store" class="w-6 h-6" />
        <p class="shops-empty-title">No shops match</p>
        <p class="shops-empty-text">Try another city or occasion, or clear the filters.</p>
        <button type="button" class="btn-secondary btn-sm mt-3" @click="clearAll">Clear filters</button>
      </div>

      <!-- Grid -->
      <ul v-else class="shops-grid">
        <li v-for="s in shops" :key="s.id">
          <RouterLink :to="`/stores/${s.id}`" class="shop-card" :aria-label="`${s.name}, ${s.city || 'Pakistan'}`">
            <div class="shop-media">
              <img v-if="coverOf(s)" :src="getStorageUrl(coverOf(s))" :alt="''" loading="lazy" @error="onImgError" />
              <div class="shop-media-strip" v-if="s.photos.length > 1">
                <img v-for="p in s.photos.slice(1, 3)" :key="p" :src="getStorageUrl(p)" alt="" loading="lazy" @error="onImgError" />
              </div>
              <span v-if="s.has_featured" class="shop-badge">Featured venues</span>
            </div>

            <div class="shop-body">
              <div class="shop-top">
                <span class="shop-logo" aria-hidden="true">
                  <img v-if="s.logo" :src="getStorageUrl(s.logo)" alt="" @error="onImgError" />
                  <span v-else>{{ initials(s.name) }}</span>
                </span>
                <div class="min-w-0">
                  <h2 class="shop-name">{{ s.name }}</h2>
                  <p class="shop-place">
                    <AppIcon icon="map-pin" class="w-3.5 h-3.5 shrink-0" />
                    <span class="truncate">{{ placeOf(s) }}</span>
                    <span v-if="s.distance_km !== null" class="shop-distance">· {{ distanceText(s.distance_km) }}</span>
                  </p>
                </div>
              </div>

              <p v-if="s.tagline" class="shop-tagline">{{ s.tagline }}</p>

              <dl class="shop-stats">
                <div>
                  <dt>Rating</dt>
                  <dd v-if="s.total_reviews > 0"><AppIcon icon="star-filled" class="w-3.5 h-3.5 shop-star" /> {{ s.avg_rating.toFixed(1) }} <span class="shop-muted">({{ s.total_reviews }})</span></dd>
                  <dd v-else class="shop-muted">New</dd>
                </div>
                <div>
                  <dt>Venues</dt>
                  <dd>{{ s.venue_count }}</dd>
                </div>
                <div>
                  <dt>Guests</dt>
                  <dd>{{ guestRange(s) }}</dd>
                </div>
              </dl>

              <ul v-if="s.event_types.length" class="shop-tags" aria-label="Occasions">
                <li v-for="t in s.event_types.slice(0, 3)" :key="t">{{ typeName(t) }}</li>
                <li v-if="s.event_types.length > 3" class="shop-tag-more">+{{ s.event_types.length - 3 }}</li>
              </ul>

              <div class="shop-foot">
                <p class="shop-price">
                  <template v-if="s.price_from">From <strong>{{ formatPKR(s.price_from) }}</strong> <span class="shop-muted">/ head</span></template>
                  <span v-else class="shop-muted">Price on request</span>
                </p>
                <span class="shop-cta">View shop <AppIcon icon="arrow-right" class="w-4 h-4" /></span>
              </div>
            </div>
          </RouterLink>
        </li>
      </ul>

      <!-- Pagination -->
      <nav v-if="meta.last_page > 1 && !loading" class="shops-pager" aria-label="Pagination">
        <button type="button" class="btn-secondary btn-sm" :disabled="meta.current_page <= 1" @click="goPage(meta.current_page - 1)">
          <AppIcon icon="chevron-left" class="w-4 h-4" /> Previous
        </button>
        <span class="shops-page-info">Page {{ meta.current_page }} of {{ meta.last_page }}</span>
        <button type="button" class="btn-secondary btn-sm" :disabled="meta.current_page >= meta.last_page" @click="goPage(meta.current_page + 1)">
          Next <AppIcon icon="chevron-right" class="w-4 h-4" />
        </button>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import api from '@/lib/axios'
import AppIcon from '@/components/ui/AppIcon.vue'
import { getStorageUrl } from '@/lib/storageUrl'
import { formatPKR } from '@/lib/format'
import { TextInput, SelectInput } from '@/components/forms'

interface Shop {
  id: number; name: string; tagline: string | null; logo: string | null; cover_image: string | null
  address: string | null; city: string | null; state: string | null; distance_km: number | null
  venue_count: number; price_from: number | null; capacity_min: number; capacity_max: number
  total_reviews: number; avg_rating: number; has_featured: boolean; event_types: string[]; photos: string[]
}
interface CityRow { city: string; state: string | null; stores: number }

const route = useRoute()
const router = useRouter()
const PER_PAGE = 12
const SORTS = ['rating', 'distance', 'venues', 'reviews', 'newest', 'name']

const shops = ref<Shop[]>([])
const cities = ref<CityRow[]>([])
const categories = ref<{ slug: string; name: string }[]>([])
const meta = ref({ current_page: 1, last_page: 1, total: 0 })
const loading = ref(true)
const loadFailed = ref(false)
const locating = ref(false)
const locationError = ref('')
let requestId = 0

const filters = reactive({ q: '', city: '', event_type: '', sort: 'rating', page: 1, lat: null as number | null, lng: null as number | null })

const hasLocation = computed(() => filters.lat !== null && filters.lng !== null)
const hasFilters = computed(() => !!(filters.q.trim() || filters.city || filters.event_type || hasLocation.value))
const occasionOptions = computed(() => [{ value: '', label: 'Any occasion' }, ...categories.value.map(c => ({ value: c.slug, label: c.name }))])
const sortOptions = computed(() => [
  { value: 'rating', label: 'Top rated' },
  ...(hasLocation.value ? [{ value: 'distance', label: 'Nearest first' }] : []),
  { value: 'venues', label: 'Most venues' },
  { value: 'reviews', label: 'Most reviewed' },
  { value: 'newest', label: 'Newest' },
  { value: 'name', label: 'Name A–Z' },
])
const totalCityStores = computed(() => cities.value.reduce((n, c) => n + c.stores, 0))
const heading = computed(() => {
  if (hasLocation.value && !filters.city) return 'Venue shops near you'
  if (filters.city) return `Venue shops in ${filters.city}`
  return 'Venue shops across Pakistan'
})

function readQuery() {
  const q = route.query
  filters.q = typeof q.q === 'string' ? q.q : ''
  filters.city = typeof q.city === 'string' ? q.city : ''
  filters.event_type = typeof q.event_type === 'string' ? q.event_type : ''
  const lat = Number(q.lat), lng = Number(q.lng)
  const hasLoc = typeof q.lat === 'string' && typeof q.lng === 'string' && Number.isFinite(lat) && Number.isFinite(lng)
  filters.lat = hasLoc ? lat : null
  filters.lng = hasLoc ? lng : null
  const sort = typeof q.sort === 'string' && SORTS.includes(q.sort) ? q.sort : (hasLoc ? 'distance' : 'rating')
  filters.sort = sort === 'distance' && !hasLoc ? 'rating' : sort
  filters.page = Number(q.page) > 0 ? Math.floor(Number(q.page)) : 1
}

function writeQuery() {
  const query: Record<string, string> = {}
  if (filters.q.trim()) query.q = filters.q.trim()
  if (filters.city) query.city = filters.city
  if (filters.event_type) query.event_type = filters.event_type
  if (hasLocation.value) { query.lat = String(filters.lat); query.lng = String(filters.lng) }
  const defaultSort = hasLocation.value ? 'distance' : 'rating'
  if (filters.sort !== defaultSort) query.sort = filters.sort
  if (filters.page > 1) query.page = String(filters.page)
  router.replace({ query })
}

function apply(resetPage = true) {
  if (resetPage) filters.page = 1
  writeQuery()
}
function setCity(city: string) { filters.city = city; apply() }
function goPage(page: number) {
  filters.page = page
  apply(false)
  window.scrollTo({ top: 0, behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
}
function clearAll() {
  Object.assign(filters, { q: '', city: '', event_type: '', lat: null, lng: null, sort: 'rating' })
  locationError.value = ''
  apply()
}
function clearLocation() {
  filters.lat = filters.lng = null
  if (filters.sort === 'distance') filters.sort = 'rating'
  apply()
}
function nearMe() {
  locationError.value = ''
  if (!('geolocation' in navigator)) { locationError.value = 'Your browser can\'t share your location. Pick a city instead.'; return }
  locating.value = true
  navigator.geolocation.getCurrentPosition(
    pos => {
      locating.value = false
      filters.lat = Math.round(pos.coords.latitude * 1000) / 1000
      filters.lng = Math.round(pos.coords.longitude * 1000) / 1000
      filters.sort = 'distance'
      filters.city = ''
      apply()
    },
    () => { locating.value = false; locationError.value = 'We couldn\'t get your location. Allow location access or pick a city.' },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
  )
}

async function load() {
  const id = ++requestId
  loading.value = true
  loadFailed.value = false
  try {
    const params: Record<string, string | number> = { page: filters.page, per_page: PER_PAGE, sort: filters.sort }
    if (filters.q.trim()) params.q = filters.q.trim()
    if (filters.city) params.city = filters.city
    if (filters.event_type) params.event_type = filters.event_type
    if (hasLocation.value) { params.lat = filters.lat!; params.lng = filters.lng! }
    const { data } = await api.get('/stores', { params })
    if (id !== requestId) return
    shops.value = data.data.data
    meta.value = { current_page: data.data.current_page, last_page: data.data.last_page, total: data.data.total }
  } catch {
    if (id !== requestId) return
    shops.value = []
    loadFailed.value = true
  } finally {
    if (id === requestId) loading.value = false
  }
}

function coverOf(s: Shop): string | null { return s.cover_image || s.photos[0] || null }
function placeOf(s: Shop): string {
  const area = (s.address || '').split(',')[0]?.trim()
  return [area && area !== s.city ? area : null, s.city || 'Pakistan'].filter(Boolean).join(', ')
}
function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]!.toUpperCase()).join('')
}
function guestRange(s: Shop): string {
  if (!s.capacity_max) return '—'
  return `${(s.capacity_min || 1).toLocaleString()}–${s.capacity_max.toLocaleString()}`
}
function distanceText(km: number): string {
  return km < 1 ? 'under 1 km' : `${km < 10 ? km.toFixed(1) : Math.round(km)} km away`
}
function typeName(slug: string): string {
  return categories.value.find(c => c.slug === slug)?.name ?? slug.replace(/_/g, ' ').replace(/\b\w/g, m => m.toUpperCase())
}
function onImgError(e: Event) { (e.target as HTMLImageElement).style.visibility = 'hidden' }

watch(() => route.fullPath, () => {
  if (route.name !== 'shops') return
  readQuery()
  load()
})

onMounted(() => {
  readQuery()
  load()
  api.get('/stores/cities').then(r => { cities.value = r.data?.data ?? [] }).catch(() => {})
  api.get('/categories').then(r => { categories.value = (r.data?.data ?? []).filter((c: any) => c.is_active !== false) }).catch(() => {})
})
</script>

<style scoped>
.shops-page { background: var(--canvas); padding: 32px 0 64px; min-height: 60vh; }
.shops-head { max-width: 720px; }
.shops-eyebrow { margin: 0 0 6px; font-size: 12px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--brand-text); }
.shops-title { margin: 0; font-family: var(--font-display, inherit); font-size: 34px; line-height: 1.15; font-weight: 700; letter-spacing: -0.02em; color: var(--ink); }
.shops-sub { margin: 10px 0 0; font-size: 15px; line-height: 1.6; color: var(--ink-muted); }

.shops-filters {
  margin-top: 24px; display: grid; grid-template-columns: 1fr; gap: 10px;
}
.sf-near { gap: 8px; white-space: nowrap; }
.sf-near.is-on { border-color: var(--brand-strong); color: var(--brand-text); background: var(--brand-soft); }
.shops-note { margin: 8px 0 0; font-size: 13px; color: var(--ink-muted); }

.city-chips { margin-top: 16px; display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: thin; }
.city-chip {
  flex-shrink: 0; display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 14px;
  border-radius: 9999px; border: 1px solid var(--line-strong); background: var(--surface); color: var(--ink-secondary);
  font-size: 14px; font-weight: 500; cursor: pointer; white-space: nowrap;
}
.city-chip:hover { background: var(--surface-hover); color: var(--ink); }
.city-chip.is-on { background: var(--brand-strong); border-color: var(--brand-strong); color: var(--on-brand); }
.city-count { font-size: 12px; opacity: .75; font-variant-numeric: tabular-nums; }

.shops-toolbar { margin-top: 20px; display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 32px; }
.shops-count { margin: 0; font-size: 14px; font-weight: 600; color: var(--ink-secondary); }

.shops-grid { margin: 16px 0 0; padding: 0; list-style: none; display: grid; grid-template-columns: 1fr; gap: 20px; }
.shop-card {
  display: flex; flex-direction: column; height: 100%; overflow: hidden; color: inherit; text-decoration: none;
  background: var(--surface); border: 1px solid var(--line); border-radius: 16px; box-shadow: var(--shadow-xs);
  transition: box-shadow .2s ease, border-color .2s ease;
}
.shop-card:hover { box-shadow: var(--shadow-md); border-color: rgb(var(--c-line-strong) / 0.6); }
.shop-card:focus-visible { outline: 2px solid var(--brand-strong); outline-offset: 2px; }
.shop-media { position: relative; display: grid; grid-template-columns: 1fr; aspect-ratio: 16 / 9; background: var(--surface-sunken); }
.shop-media > img { width: 100%; height: 100%; object-fit: cover; }
.shop-media-strip { position: absolute; right: 10px; bottom: 10px; display: flex; gap: 6px; }
.shop-media-strip img { width: 56px; height: 42px; object-fit: cover; border-radius: 8px; border: 2px solid var(--surface); }
.shop-badge {
  position: absolute; top: 12px; left: 12px; display: inline-flex; align-items: center; height: 24px; padding: 0 10px;
  border-radius: 9999px; background: var(--surface); color: var(--ink); font-size: 12px; font-weight: 600; box-shadow: var(--shadow-sm);
}
.shop-body { display: flex; flex-direction: column; gap: 12px; padding: 16px 18px 18px; flex: 1; }
.shop-top { display: flex; align-items: center; gap: 12px; }
.shop-logo {
  width: 44px; height: 44px; flex-shrink: 0; border-radius: 12px; overflow: hidden; display: grid; place-items: center;
  background: var(--brand-soft); color: var(--brand-text); font-weight: 700; font-size: 15px; border: 1px solid var(--line);
}
.shop-logo img { width: 100%; height: 100%; object-fit: cover; }
.shop-name { margin: 0; font-family: var(--font-display, inherit); font-size: 18px; line-height: 1.3; font-weight: 700; color: var(--ink); }
.shop-place { margin: 2px 0 0; display: flex; align-items: center; gap: 4px; font-size: 13px; color: var(--ink-muted); min-width: 0; }
.shop-distance { flex-shrink: 0; color: var(--brand-text); font-weight: 500; }
.shop-tagline { margin: 0; font-size: 14px; line-height: 1.5; color: var(--ink-secondary); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.shop-stats { margin: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
.shop-stats > div { padding: 8px 10px; min-width: 0; }
.shop-stats > div + div { border-left: 1px solid var(--line); }
.shop-stats dt { font-size: 11px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; color: var(--ink-muted); }
.shop-stats dd { margin: 2px 0 0; display: flex; align-items: center; gap: 4px; font-size: 14px; font-weight: 600; color: var(--ink); font-variant-numeric: tabular-nums; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.shop-star { color: #d97706; }
.shop-muted { color: var(--ink-muted); font-weight: 400; }
.shop-tags { margin: 0; padding: 0; list-style: none; display: flex; flex-wrap: wrap; gap: 6px; }
.shop-tags li { display: inline-flex; align-items: center; height: 24px; padding: 0 10px; border-radius: 9999px; background: var(--surface-sunken); color: var(--ink-secondary); font-size: 12px; font-weight: 500; }
.shop-tags .shop-tag-more { background: transparent; border: 1px solid var(--line); }
.shop-foot { margin-top: auto; padding-top: 12px; border-top: 1px solid var(--line); display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.shop-price { margin: 0; font-size: 14px; color: var(--ink-secondary); }
.shop-price strong { color: var(--ink); font-variant-numeric: tabular-nums; }
.shop-cta { display: inline-flex; align-items: center; gap: 4px; font-size: 14px; font-weight: 600; color: var(--brand-text); white-space: nowrap; }

.shop-skel { pointer-events: none; }
.shop-skel-img { aspect-ratio: 16 / 9; border-radius: 0; }

.shops-empty { margin-top: 16px; padding: 40px 20px; display: flex; flex-direction: column; align-items: center; text-align: center; color: var(--ink-muted); }
.shops-empty-title { margin: 10px 0 0; font-size: 16px; font-weight: 600; color: var(--ink); }
.shops-empty-text { margin: 4px 0 0; font-size: 14px; }

.shops-pager { margin-top: 32px; display: flex; align-items: center; justify-content: center; gap: 12px; }
.shops-page-info { font-size: 14px; color: var(--ink-muted); }

@media (min-width: 640px) {
  .shops-filters { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
  .sf-search { grid-column: 1 / -1; }
  .shops-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (min-width: 1024px) {
  .shops-page { padding-top: 40px; }
  .shops-title { font-size: 40px; }
  .shops-filters { grid-template-columns: minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr) auto; }
  .sf-search { grid-column: auto; }
  .shops-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
</style>
