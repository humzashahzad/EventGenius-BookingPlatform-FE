<template>
  <div class="pb-4">
    <header class="page-header">
      <div class="min-w-0">
        <RouterLink :to="{ name: 'shop-venues' }" class="btn-ghost btn-sm -ml-2 mb-2"><AppIcon icon="chevron-left" class="w-4 h-4" />My venues</RouterLink>
        <h1 class="page-title">{{ isEdit ? (form.name || 'Edit venue') : 'Add a new venue' }}</h1>
        <p class="page-subtitle">{{ isEdit ? 'Update details, pricing, hours and amenities.' : 'Fill in the details below. You can add photos right after saving.' }}</p>
      </div>
      <div v-if="isEdit" class="page-header-actions">
        <RouterLink :to="`/shop/venues/${route.params.id}/gallery`" class="btn-secondary"><AppIcon icon="image" class="w-4 h-4" />Gallery</RouterLink>
      </div>
    </header>

    <!-- Section nav: chips on phones, sticky list on desktop -->
    <nav class="lg:hidden sticky top-[var(--topbar-height)] z-sticky -mx-4 px-4 py-2 mb-4 bg-canvas/95 border-b border-line overflow-x-auto scrollbar-thin" aria-label="Form sections" data-scroll>
      <div class="flex gap-1.5 w-max">
        <a v-for="s in sections" :key="s.id" :href="`#${s.id}`" class="section-chip" :aria-current="activeSection === s.id ? 'true' : undefined" @click.prevent="goTo(s.id)">{{ s.label }}</a>
      </div>
    </nav>

    <div class="lg:grid lg:grid-cols-[200px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)] gap-8 items-start">
      <nav class="hidden lg:block sticky top-[calc(var(--topbar-height)+1.5rem)]" aria-label="Form sections">
        <p class="eyebrow mb-2 px-3">Sections</p>
        <ul class="space-y-0.5">
          <li v-for="s in sections" :key="s.id">
            <a :href="`#${s.id}`" class="section-link" :aria-current="activeSection === s.id ? 'true' : undefined" @click.prevent="goTo(s.id)">
              <AppIcon :icon="s.icon" class="w-4 h-4 shrink-0" />
              <span class="truncate">{{ s.label }}</span>
              <AppIcon v-if="s.complete" icon="check" class="w-3.5 h-3.5 ml-auto text-success-text" />
            </a>
          </li>
        </ul>
      </nav>

      <div class="space-y-6 min-w-0">
        <form id="venue-form" class="space-y-6" novalidate @submit.prevent="save">
          <!-- Basics -->
          <section id="sec-basics" class="card scroll-mt-28">
            <div class="card-header"><div><h2 class="card-title">Basic information</h2><p class="card-subtitle">What guests see first.</p></div></div>
            <div class="card-body space-y-4">
              <FormField id="vf-name" label="Venue name" required>
                <TextInput v-model="form.name" required placeholder="e.g. Grand Marquee Hall" />
              </FormField>
              <FormField id="vf-desc" label="Description" hint="Mention parking, catering, decor and accessibility." :count="(form.description || '').length">
                <TextareaInput v-model="form.description" :rows="5" auto-grow placeholder="Describe your venue — features, ambience, what makes it unique…" />
              </FormField>
            </div>
          </section>

          <!-- Location -->
          <section id="sec-location" class="card scroll-mt-28">
            <div class="card-header"><div><h2 class="card-title">Location</h2><p class="card-subtitle">Used for search, distance and directions.</p></div></div>
            <div class="card-body space-y-5">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField id="vf-country" label="Country" required>
                  <SelectInput
                    :model-value="form.country"
                    :options="countriesList.map(c => c.name)"
                    placeholder="Select country"
                    placeholder-disabled
                    required
                    @update:model-value="v => { form.country = v; onCountryChange() }"
                  />
                </FormField>
                <FormField id="vf-city" label="City" required :hint="loadingCities ? 'Loading cities…' : ''">
                  <Combobox v-model="form.city" :options="citiesList" :placeholder="loadingCities ? 'Loading cities…' : 'Search a city'" required :disabled="!form.country || loadingCities" />
                </FormField>
              </div>

              <div>
                <p class="form-label">Map pin <span class="req">*</span></p>
                <div v-if="form.address || (form.latitude && form.longitude)" class="panel-sunken p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <span class="icon-chip icon-chip-sm tone-brand"><AppIcon icon="map-pin" class="w-4 h-4" /></span>
                  <div class="min-w-0 flex-1">
                    <p v-if="form.address" class="text-sm text-ink font-medium break-words">{{ form.address }}</p>
                    <p class="ref text-xs text-ink-muted mt-0.5">{{ form.latitude?.toFixed(6) }}, {{ form.longitude?.toFixed(6) }}</p>
                  </div>
                  <button type="button" class="btn-secondary btn-sm shrink-0" @click="openMapModal"><AppIcon icon="map" class="w-4 h-4" />Change</button>
                </div>
                <button v-else type="button" @click="openMapModal" class="w-full flex flex-col items-center gap-1 py-6 rounded-lg border-2 border-dashed border-line-strong/60 text-ink-secondary hover:bg-surface-hover hover:border-line-strong transition-colors">
                  <AppIcon icon="map" class="w-6 h-6 text-brand-text" />
                  <span class="text-sm font-medium text-ink">Pick location on map</span>
                  <span class="text-xs text-ink-muted">Search an address or click to drop a pin</span>
                </button>
              </div>
            </div>
          </section>

          <!-- Capacity -->
          <section id="sec-capacity" class="card scroll-mt-28">
            <div class="card-header"><div><h2 class="card-title">Capacity &amp; size</h2><p class="card-subtitle">Guests can only book within this range.</p></div></div>
            <div class="card-body grid grid-cols-2 lg:grid-cols-4 gap-4">
              <FormField id="vf-cmin" label="Min guests">
                <NumberInput v-model="form.capacity_min" :min="1" :step="10" placeholder="10" />
              </FormField>
              <FormField id="vf-cmax" label="Max guests" required>
                <NumberInput v-model="form.capacity_max" :min="1" :step="10" required placeholder="500" :invalid="capacityInvalid" />
              </FormField>
              <FormField id="vf-area" label="Area">
                <NumberInput v-model="form.area_sqft" :min="0" :step="100" :stepper="false" suffix="sq ft" placeholder="2000" />
              </FormField>
              <FormField id="vf-floors" label="Floors">
                <NumberInput v-model="form.floors" :min="1" placeholder="1" />
              </FormField>
              <p v-if="capacityInvalid" class="form-error col-span-full !mt-0">Max guests should be at least the minimum.</p>
            </div>
          </section>

          <!-- Pricing -->
          <section id="sec-pricing" class="card scroll-mt-28">
            <div class="card-header"><div><h2 class="card-title">Pricing</h2><p class="card-subtitle">Total = price per head × number of guests (+ paid amenities and tax).</p></div></div>
            <div class="card-body grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              <FormField id="vf-price" label="Price per head" required>
                <CurrencyInput v-model="form.price_per_head" :decimals="2" suffix="/ head" required placeholder="2,500" />
              </FormField>
              <div v-if="form.price_per_head" class="panel-sunken p-3 text-sm">
                <p class="text-ink-muted text-xs mb-1">Example</p>
                <p class="text-ink num">{{ exampleGuests }} guests × {{ formatPKR(form.price_per_head) }} = <strong>{{ formatPKR(exampleGuests * Number(form.price_per_head)) }}</strong></p>
              </div>
            </div>
          </section>

          <!-- Event types -->
          <section id="sec-events" class="card scroll-mt-28">
            <div class="card-header">
              <div><h2 class="card-title">Event types</h2><p class="card-subtitle">Pick everything this venue suits. Used by search filters.</p></div>
              <span class="badge-neutral num">{{ form.event_types.length }} selected</span>
            </div>
            <div class="card-body">
              <div v-if="!eventTypes.length" class="grid grid-cols-2 sm:grid-cols-3 gap-2"><div v-for="i in 6" :key="i" class="skeleton h-11" /></div>
              <CheckboxGroup v-else v-model="form.event_types" :options="eventTypes.map(e => ({ value: e.value, label: e.label, icon: e.emoji }))" variant="cards" :columns="3" aria-label="Event types" />
            </div>
          </section>

          <!-- Hours -->
          <section id="sec-hours" class="card scroll-mt-28">
            <div class="card-header"><div><h2 class="card-title">Operating hours</h2><p class="card-subtitle">Customers can only book slots inside this range (24-hour clock).</p></div></div>
            <div class="card-body grid grid-cols-2 gap-4">
              <FormField id="vf-open" label="Opens">
                <TimePicker v-model="form.operating_start" :options="timeSlots" />
              </FormField>
              <FormField id="vf-close" label="Closes">
                <TimePicker v-model="form.operating_end" :options="timeSlots" />
              </FormField>
            </div>
          </section>

          <!-- Visibility (edit only) -->
          <section v-if="isEdit" id="sec-visibility" class="card scroll-mt-28">
            <div class="card-header"><div><h2 class="card-title">Visibility</h2><p class="card-subtitle">Inactive venues are hidden from search and can't be booked.</p></div></div>
            <div class="card-body">
              <RadioCards
                v-model="form.status"
                aria-label="Visibility"
                :options="[{ value: 'active', label: 'Active', description: 'Visible to clients', icon: 'eye' }, { value: 'inactive', label: 'Inactive', description: 'Hidden from listings', icon: 'eye-off' }]"
              />
            </div>
          </section>
        </form>

        <!-- Amenities editor (edit only; manages its own API calls) -->
        <div v-if="isEdit" id="sec-amenities" class="scroll-mt-28">
          <AmenityEditor :venue-id="String(route.params.id)" />
        </div>

        <!-- Gallery shortcut -->
        <section id="sec-gallery" class="card scroll-mt-28">
          <div class="card-body flex flex-col sm:flex-row sm:items-center gap-4">
            <span class="icon-chip tone-info"><AppIcon icon="image" class="w-5 h-5" /></span>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-ink">Photo gallery</p>
              <p class="text-sm text-ink-muted">{{ isEdit ? 'Upload photos and choose the cover image guests see first.' : 'You can upload photos right after the venue is created.' }}</p>
            </div>
            <RouterLink v-if="isEdit" :to="`/shop/venues/${route.params.id}/gallery`" class="btn-secondary shrink-0"><AppIcon icon="image" class="w-4 h-4" />Manage gallery</RouterLink>
          </div>
        </section>

        <!-- Sticky save bar -->
        <FormActions
          sticky
          form-id="venue-form"
          cancel-label="Cancel"
          :cancel-to="{ name: 'shop-venues' }"
          :saving="saving"
          :dirty="dirty"
          :error="errorMsg"
          :success="successMsg"
          :idle-text="isEdit ? 'All changes saved' : 'Fields marked * are required'"
          :save-label="isEdit ? 'Save changes' : 'Create venue'"
        />
      </div>
    </div>

    <!-- Map Modal -->
    <div v-if="showMapModal" class="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4" role="dialog" aria-modal="true" aria-label="Select venue location">
      <div class="absolute inset-0 bg-warm-900/60" @click="closeMapModal" />
      <div class="relative bg-surface border border-line w-full max-w-4xl rounded-xl shadow-float overflow-hidden flex flex-col max-h-[92vh]">
        <div class="px-5 py-4 border-b border-line flex items-center justify-between gap-3">
          <div>
            <h2 class="font-sans text-base font-semibold text-ink tracking-normal">Select venue location</h2>
            <p class="text-xs text-ink-muted mt-0.5">Search, or click on the map to pin your venue's exact location.</p>
          </div>
          <button type="button" @click="closeMapModal" class="btn-icon btn-icon-sm" aria-label="Close"><AppIcon icon="x" class="w-5 h-5" /></button>
        </div>

        <div class="px-4 py-3 border-b border-line">
          <TextInput
            type="search"
            prefix-icon="search"
            placeholder="Search for an address or landmark, then press Enter"
            aria-label="Search location"
            @keyup.enter="searchLocation(($event.target as HTMLInputElement).value)"
          />
        </div>

        <div class="flex-1 relative min-h-[320px] sm:min-h-[420px]">
          <div id="location-map" class="absolute inset-0"></div>
        </div>

        <div class="px-5 py-3.5 border-t border-line bg-surface-sunken flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="min-w-0">
            <p v-if="selectedAddress" class="text-sm font-medium text-ink flex items-start gap-1.5">
              <AppIcon icon="map-pin" class="w-4 h-4 text-brand-text shrink-0 mt-0.5" />
              <span class="line-clamp-2">{{ selectedAddress }}</span>
            </p>
            <p v-else class="text-sm text-ink-muted">No location selected yet</p>
            <p v-if="tempCoords" class="ref text-xs text-ink-muted mt-0.5">{{ tempCoords.lat.toFixed(6) }}, {{ tempCoords.lng.toFixed(6) }}</p>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <button type="button" @click="closeMapModal" class="btn-secondary">Cancel</button>
            <button type="button" @click="confirmLocation" :disabled="!tempCoords" class="btn-primary">Use this location</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import api from '@/lib/axios'
import { toast } from 'vue-sonner'
import { useCategoriesStore } from '@/stores/categories'
import AppIcon from '@/components/ui/AppIcon.vue'
import AmenityEditor from '@/components/amenities/AmenityEditor.vue'
import { formatPKR } from '@/lib/format'
import { FormField, TextInput, TextareaInput, SelectInput, Combobox, NumberInput, CurrencyInput, CheckboxGroup, TimePicker, RadioCards, FormActions } from '@/components/forms'

const route  = useRoute()
const router = useRouter()
const categoriesStore = useCategoriesStore()

const saving     = ref(false)
const successMsg = ref('')
const errorMsg   = ref('')
const isEdit     = computed(() => !!route.params.id)

const eventTypes = computed(() =>
  categoriesStore.categories
    .filter(c => c.is_active)
    .map(c => ({ value: c.slug, label: c.name, emoji: c.emoji }))
)

const form = reactive({
  name: '', description: '', address: '', city: '', state: '',
  capacity_min: 1, capacity_max: 100, area_sqft: null as number | null,
  floors: 1, price_per_head: null as number | null,
  event_types: [] as string[], status: 'active',
  operating_start: '00:00', operating_end: '23:00',
  country: 'Pakistan', latitude: null as number | null, longitude: null as number | null,
})

const countriesList = ref<any[]>([])
const citiesList = ref<string[]>([])
const loadingCountries = ref(false)
const loadingCities = ref(false)
const showMapModal = ref(false)
const selectedAddress = ref('')
const tempCoords = ref<{ lat: number; lng: number } | null>(null)
let map: any = null
let marker: any = null

async function openMapModal() {
  showMapModal.value = true
  selectedAddress.value = form.address || ''
  if (form.latitude && form.longitude) {
    tempCoords.value = { lat: form.latitude, lng: form.longitude }
  } else {
    tempCoords.value = null
  }
  
  // Wait for DOM to update
  setTimeout(() => {
    initMap()
  }, 100)
}

function closeMapModal() {
  showMapModal.value = false
  if (map) {
    map.remove()
    map = null
  }
}

async function initMap() {
  if (typeof (window as any).L === 'undefined') {
    setTimeout(initMap, 100)
    return
  }

  const L = (window as any).L
  
  // Default to city or country center if no coordinates
  let center: [number, number] = [31.5204, 74.3587] // Lahore default
  if (tempCoords.value) {
    center = [tempCoords.value.lat, tempCoords.value.lng]
  } else if (form.city || form.country) {
    const searchStr = `${form.city}, ${form.country}`.trim()
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchStr)}`)
      const data = await res.json()
      if (data && data[0]) {
        center = [parseFloat(data[0].lat), parseFloat(data[0].lon)]
      }
    } catch (e) {
      console.error('City search failed', e)
    }
  }

  map = L.map('location-map').setView(center, 13)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map)

  if (tempCoords.value) {
    marker = L.marker([tempCoords.value.lat, tempCoords.value.lng], { draggable: true }).addTo(map)
  }

  map.on('click', async (e: any) => {
    const { lat, lng } = e.latlng
    setMarker(lat, lng)
  })
}

function setMarker(lat: number, lng: number) {
  const L = (window as any).L
  if (marker) {
    marker.setLatLng([lat, lng])
  } else {
    marker = L.marker([lat, lng], { draggable: true }).addTo(map)
    marker.on('dragend', () => {
      const pos = marker.getLatLng()
      tempCoords.value = { lat: pos.lat, lng: pos.lng }
      reverseGeocode(pos.lat, pos.lng)
    })
  }
  tempCoords.value = { lat, lng }
  reverseGeocode(lat, lng)
}

async function reverseGeocode(lat: number, lng: number) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
    const data = await res.json()
    if (data && data.display_name) {
      selectedAddress.value = data.display_name
    }
  } catch (e) {
    console.error('Reverse geocode failed', e)
  }
}

async function searchLocation(query: string) {
  if (!query) return
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
    const data = await res.json()
    if (data && data[0]) {
      const lat = parseFloat(data[0].lat)
      const lon = parseFloat(data[0].lon)
      map.setView([lat, lon], 16)
      setMarker(lat, lon)
    }
  } catch (e) {
    console.error('Search failed', e)
  }
}

function confirmLocation() {
  if (tempCoords.value) {
    form.latitude = tempCoords.value.lat
    form.longitude = tempCoords.value.lng
    form.address = selectedAddress.value
  }
  closeMapModal()
}

// The platform serves Pakistan; keep a reliable built-in list so the form never
// depends on a third-party API (and never sends our auth token to one).
const PK_CITIES = [
  'Abbottabad', 'Bahawalpur', 'Faisalabad', 'Gujranwala', 'Gujrat', 'Hyderabad', 'Islamabad', 'Jhelum',
  'Kamalia', 'Karachi', 'Lahore', 'Larkana', 'Mardan', 'Multan', 'Murree', 'Peshawar', 'Quetta',
  'Rahim Yar Khan', 'Rawalpindi', 'Sahiwal', 'Sargodha', 'Sialkot', 'Sukkur', 'Toba Tek Singh',
]

async function fetchCountries() {
  countriesList.value = [{ name: 'Pakistan', code: 'PK' }]
  loadingCountries.value = false
}

async function fetchCities(countryName: string) {
  if (!countryName) return
  loadingCities.value = true
  citiesList.value = [...PK_CITIES]
  try {
    // Optional enrichment from a public dataset — plain fetch, no credentials.
    const res = await fetch('https://countriesnow.space/api/v0.1/countries/cities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country: countryName }),
    })
    if (res.ok) {
      const json = await res.json()
      const extra: string[] = Array.isArray(json?.data) ? json.data : []
      citiesList.value = Array.from(new Set([...PK_CITIES, ...extra])).sort((x, y) => x.localeCompare(y))
    }
  } catch {
    // Built-in list is enough.
  } finally {
    // Keep the venue's current city selectable even if it isn't in the list.
    if (form.city && !citiesList.value.includes(form.city)) citiesList.value.unshift(form.city)
    loadingCities.value = false
  }
}

function onCountryChange() {
  form.city = ''
  fetchCities(form.country)
}

const timeSlots = computed(() => {
  const slots = []
  for (let h = 0; h < 24; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`)
  }
  slots.push('23:59')
  return slots
})

async function load() {
  if (!isEdit.value) return
  try {
    const { data } = await api.get(`/store/venues/${route.params.id}`)
    Object.assign(form, data.data)
    if (form.country) fetchCities(form.country)
    takeSnapshot()
  } catch {
    errorMsg.value = 'Failed to load venue data.'
  }
}

async function save() {
  if (saving.value) return
  saving.value     = true
  successMsg.value = ''
  errorMsg.value   = ''
  try {
    if (isEdit.value) {
      // The form stays on screen; only the save button shows progress.
      const sent = JSON.stringify(form)
      const { data } = await api.put(`/store/venues/${route.params.id}`, form)
      // Take the saved values from the server, unless the user kept typing meanwhile.
      if (data?.data && JSON.stringify(form) === sent) Object.assign(form, data.data)
      successMsg.value = 'Venue updated successfully!'
      takeSnapshot()
      toast.success('Venue saved.')
      setTimeout(() => (successMsg.value = ''), 3500)
    } else {
      const { data } = await api.post('/store/venues', form)
      successMsg.value = 'Venue created! Redirecting to gallery...'
      toast.success('Venue created — now add some photos.')
      takeSnapshot()
      setTimeout(() => router.push(`/shop/venues/${data.data.id}/gallery`), 1500)
    }
  } catch (e: any) {
    errorMsg.value = extractErrorMessage(e)
    toast.error(errorMsg.value)
    setTimeout(() => (errorMsg.value = ''), 4000)
  } finally {
    saving.value = false
  }
}

function extractErrorMessage(error: any): string {
  const response = error?.response?.data
  const fieldErrors = response?.errors

  if (fieldErrors && typeof fieldErrors === 'object') {
    const firstFieldError = Object.values(fieldErrors).flat().find(Boolean)
    if (typeof firstFieldError === 'string') {
      return firstFieldError
    }
  }

  const message = response?.message
  if (typeof message === 'string' && !message.includes('SQLSTATE[')) {
    return message
  }

  return 'Venue could not be saved. Please review the form and try again.'
}

onMounted(() => {
  load()
  categoriesStore.fetchCategories()
  fetchCountries()
  if (form.country) fetchCities(form.country)

  // Load Leaflet
  if (!document.getElementById('leaflet-css')) {
    const link = document.createElement('link')
    link.id = 'leaflet-css'
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)
  }
  if (!document.getElementById('leaflet-js')) {
    const script = document.createElement('script')
    script.id = 'leaflet-js'
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    document.head.appendChild(script)
  }
})



// ── Section navigation, completeness and unsaved-changes tracking ───────────
const capacityInvalid = computed(() => !!form.capacity_min && !!form.capacity_max && Number(form.capacity_max) < Number(form.capacity_min))
const exampleGuests = computed(() => Math.max(Number(form.capacity_min) || 0, Math.min(300, Number(form.capacity_max) || 300)) || 300)

const sections = computed(() => {
  const list = [
    { id: 'sec-basics', label: 'Basics', icon: 'info', complete: !!form.name },
    { id: 'sec-location', label: 'Location', icon: 'map-pin', complete: !!form.city && !!form.latitude },
    { id: 'sec-capacity', label: 'Capacity', icon: 'users', complete: !!form.capacity_max && !capacityInvalid.value },
    { id: 'sec-pricing', label: 'Pricing', icon: 'banknote', complete: !!form.price_per_head },
    { id: 'sec-events', label: 'Event types', icon: 'tags', complete: form.event_types.length > 0 },
    { id: 'sec-hours', label: 'Hours', icon: 'clock', complete: !!form.operating_start && !!form.operating_end },
  ]
  if (isEdit.value) {
    list.push({ id: 'sec-visibility', label: 'Visibility', icon: 'eye', complete: true })
    list.push({ id: 'sec-amenities', label: 'Amenities', icon: 'circle-check', complete: false })
  }
  list.push({ id: 'sec-gallery', label: 'Gallery', icon: 'image', complete: false })
  return list
})

const activeSection = ref('sec-basics')
let observer: IntersectionObserver | null = null

function goTo(id: string) {
  activeSection.value = id
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function observeSections() {
  observer?.disconnect()
  observer = new IntersectionObserver(entries => {
    const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
    if (visible[0]) activeSection.value = visible[0].target.id
  }, { rootMargin: '-120px 0px -55% 0px' })
  for (const s of sections.value) {
    const el = document.getElementById(s.id)
    if (el) observer.observe(el)
  }
}

const snapshot = ref('')
const dirty = computed(() => !!snapshot.value && JSON.stringify(form) !== snapshot.value)
function takeSnapshot() { snapshot.value = JSON.stringify(form) }

onMounted(async () => {
  await nextTick()
  observeSections()
  if (!isEdit.value) takeSnapshot()
})
onBeforeUnmount(() => observer?.disconnect())
</script>

<style scoped>
.section-link {
  display: flex; align-items: center; gap: 0.625rem;
  padding: 0.5rem 0.75rem; border-radius: var(--radius-md);
  font-size: 0.875rem; color: var(--ink-secondary);
  border-left: 2px solid transparent;
}
.section-link:hover { background-color: var(--surface-hover); color: var(--ink); }
.section-link[aria-current='true'] { background-color: var(--surface); color: var(--ink); font-weight: 600; box-shadow: var(--shadow-xs); }
.section-chip {
  display: inline-flex; align-items: center; white-space: nowrap;
  padding: 0.375rem 0.75rem; border-radius: 9999px; font-size: 0.8125rem;
  color: var(--ink-secondary); border: 1px solid var(--line); background: var(--surface);
}
.section-chip[aria-current='true'] { color: var(--brand-text); border-color: var(--brand-text); background: var(--brand-soft); font-weight: 600; }
</style>
