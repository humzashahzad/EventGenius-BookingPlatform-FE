<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h1 class="page-title">Geo-Fencing Locations</h1>
        <p class="page-subtitle">Manage allowed countries, cities, and areas for shop registration and bookings.</p>
      </div>
      <button @click="openCreateModal('country')" class="btn-primary gap-1.5">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        Add Country
      </button>
    </div>

    <!-- Loading -->
    <div v-if="locationsStore.loading && !locationsStore.tree.length" class="flex justify-center py-16">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2" style="border-color: var(--color-primary)"></div>
    </div>

    <!-- Content: Tree + Map -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Left: Location Tree -->
      <div class="card card-body space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
        <div v-if="locationsStore.tree.length === 0" class="empty-state py-12">
          <p class="empty-state-title">No locations configured</p>
          <p class="empty-state-desc">Add your first country to start defining allowed areas.</p>
        </div>

        <!-- Countries -->
        <div v-for="country in locationsStore.tree" :key="country.id" class="location-tree-item">
          <div class="location-row" @click="selectLocation(country)">
            <div class="flex items-center gap-2 flex-1 min-w-0">
              <button type="button" class="location-expand" @click.stop="toggleExpand(country.id)">
                <svg class="w-4 h-4 transition-transform" :class="{ 'rotate-90': expanded.has(country.id) }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </button>
              <span class="text-lg">🌍</span>
              <span class="font-semibold text-sm truncate" style="color: var(--color-text)">{{ country.name }}</span>
              <span :class="country.is_active ? 'badge-success' : 'badge-warning'" class="text-xs ml-auto flex-shrink-0">
                {{ country.is_active ? 'Active' : 'Inactive' }}
              </span>
            </div>
            <div class="location-actions">
              <button @click.stop="openCreateModal('city', country)" class="location-action-btn" title="Add city">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
              </button>
              <button @click.stop="toggleActive(country)" class="location-action-btn" :title="country.is_active ? 'Deactivate' : 'Activate'">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path v-if="country.is_active" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
                  <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </button>
              <button @click.stop="confirmDelete(country)" class="location-action-btn text-danger-500" title="Delete">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
            </div>
          </div>

          <!-- Cities -->
          <div v-if="expanded.has(country.id)" class="pl-8 space-y-1 mt-1">
            <div v-for="city in (country.children || [])" :key="city.id" class="location-tree-item">
              <div class="location-row location-row--sub" @click="selectLocation(city)">
                <div class="flex items-center gap-2 flex-1 min-w-0">
                  <button type="button" class="location-expand" @click.stop="toggleExpand(city.id)">
                    <svg class="w-3.5 h-3.5 transition-transform" :class="{ 'rotate-90': expanded.has(city.id) }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                  </button>
                  <span class="text-base">🏙️</span>
                  <span class="font-medium text-sm truncate" style="color: var(--color-text)">{{ city.name }}</span>
                  <span :class="city.is_active ? 'badge-success' : 'badge-warning'" class="text-xs ml-auto flex-shrink-0">
                    {{ city.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </div>
                <div class="location-actions">
                  <button @click.stop="openCreateModal('area', city)" class="location-action-btn" title="Add area">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                  </button>
                  <button @click.stop="toggleActive(city)" class="location-action-btn">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path v-if="city.is_active" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
                      <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </button>
                  <button @click.stop="confirmDelete(city)" class="location-action-btn text-danger-500">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              </div>

              <!-- Areas -->
              <div v-if="expanded.has(city.id)" class="pl-8 space-y-1 mt-1">
                <div v-for="area in (city.children || [])" :key="area.id">
                  <div class="location-row location-row--leaf" @click="selectLocation(area)">
                    <div class="flex items-center gap-2 flex-1 min-w-0">
                      <span class="text-sm">📍</span>
                      <span class="text-sm truncate" style="color: var(--color-text)">{{ area.name }}</span>
                      <span :class="area.is_active ? 'badge-success' : 'badge-warning'" class="text-xs ml-auto flex-shrink-0">
                        {{ area.is_active ? 'Active' : 'Inactive' }}
                      </span>
                    </div>
                    <div class="location-actions">
                      <button @click.stop="toggleActive(area)" class="location-action-btn">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path v-if="area.is_active" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
                          <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      </button>
                      <button @click.stop="confirmDelete(area)" class="location-action-btn text-danger-500">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Map -->
      <div class="card card-body" style="min-height: 500px;">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-semibold" style="color: var(--color-text)">
            {{ selectedLocation ? `Boundary: ${selectedLocation.name}` : 'Select a location to view boundary' }}
          </h3>
          <button v-if="selectedLocation" @click="saveBoundary" :disabled="savingBoundary" class="btn-primary btn-sm gap-1">
            <svg v-if="savingBoundary" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Save Boundary
          </button>
        </div>
        <div ref="mapContainer" class="rounded-lg overflow-hidden" style="height: 450px; background: var(--color-bg-hover);"></div>
        <p class="text-xs mt-2" style="color: var(--color-text-muted)">
          Click on the map to draw a polygon boundary. Double-click to finish. Select a location from the tree first.
        </p>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <Teleport to="body">
      <div v-if="modalOpen" class="modal-overlay" @click.self="modalOpen = false">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title">Add {{ modalLevel }}</h3>
            <button @click="modalOpen = false" class="btn-icon btn-ghost">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="modal-body space-y-4">
            <div v-if="modalParent" class="text-sm" style="color: var(--color-text-secondary)">
              Parent: <strong>{{ modalParent.name }}</strong>
            </div>
            <div class="form-group">
              <label class="form-label">Name <span class="text-danger-500">*</span></label>
              <input v-model="modalName" type="text" class="form-input" :placeholder="`e.g. ${modalLevel === 'country' ? 'Pakistan' : modalLevel === 'city' ? 'Lahore' : 'Gulberg'}`" />
            </div>
          </div>
          <div class="modal-footer">
            <button @click="modalOpen = false" class="btn-ghost">Cancel</button>
            <button @click="createLocation" :disabled="!modalName.trim() || creating" class="btn-primary gap-1.5">
              <svg v-if="creating" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Create
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Delete Modal -->
    <Teleport to="body">
      <div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget = null">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title">Delete Location</h3>
            <button @click="deleteTarget = null" class="btn-icon btn-ghost">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="modal-body">
            <p class="text-sm" style="color: var(--color-text)">
              Delete <strong>{{ deleteTarget.name }}</strong>? This cannot be undone.
            </p>
          </div>
          <div class="modal-footer">
            <button @click="deleteTarget = null" class="btn-ghost">Cancel</button>
            <button @click="doDelete" :disabled="deleting" class="btn-danger">Delete</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useLocationsStore, type LocationNode } from '@/stores/locations'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const locationsStore = useLocationsStore()

// Tree state
const expanded = ref(new Set<number>())
const selectedLocation = ref<LocationNode | null>(null)

// Map
const mapContainer = ref<HTMLElement | null>(null)
let map: L.Map | null = null
let polygonLayer: L.Polygon | null = null
let drawPoints: L.LatLng[] = []
let drawMarkers: L.Marker[] = []
const savingBoundary = ref(false)

// Modal
const modalOpen = ref(false)
const modalLevel = ref<'country' | 'city' | 'area'>('country')
const modalParent = ref<LocationNode | null>(null)
const modalName = ref('')
const creating = ref(false)

// Delete
const deleteTarget = ref<LocationNode | null>(null)
const deleting = ref(false)

function toggleExpand(id: number) {
  if (expanded.value.has(id)) {
    expanded.value.delete(id)
  } else {
    expanded.value.add(id)
  }
}

function selectLocation(loc: LocationNode) {
  selectedLocation.value = loc
  showBoundaryOnMap(loc)
}

function showBoundaryOnMap(loc: LocationNode) {
  if (!map) return

  // Clear existing
  clearDrawing()
  if (polygonLayer) {
    map.removeLayer(polygonLayer)
    polygonLayer = null
  }

  if (loc.boundary) {
    let coords: [number, number][] = []
    const b = loc.boundary

    if (b.type === 'Polygon' && b.coordinates?.[0]) {
      coords = b.coordinates[0].map((c: number[]) => [c[1], c[0]] as [number, number])
    } else if (Array.isArray(b) && b.length > 0) {
      coords = b.map((c: number[]) => [c[1], c[0]] as [number, number])
    }

    if (coords.length > 0) {
      polygonLayer = L.polygon(coords, {
        color: '#f59e0b',
        weight: 2,
        fillOpacity: 0.15,
        fillColor: '#f59e0b',
      }).addTo(map)
      map.fitBounds(polygonLayer.getBounds(), { padding: [40, 40] })
    }
  }
}

function clearDrawing() {
  drawMarkers.forEach(m => map?.removeLayer(m))
  drawMarkers = []
  drawPoints = []
}

function initMap() {
  if (!mapContainer.value || map) return

  map = L.map(mapContainer.value, {
    center: [30.3753, 69.3451], // Pakistan center
    zoom: 5,
    zoomControl: true,
  })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(map)

  // Click to draw polygon points
  map.on('click', (e: L.LeafletMouseEvent) => {
    if (!selectedLocation.value) return

    drawPoints.push(e.latlng)
    const marker = L.circleMarker(e.latlng, {
      radius: 5,
      color: '#f59e0b',
      fillColor: '#f59e0b',
      fillOpacity: 1,
    }).addTo(map!)
    drawMarkers.push(marker as any)

    // Update polygon preview
    if (polygonLayer) {
      map!.removeLayer(polygonLayer)
    }
    if (drawPoints.length >= 3) {
      polygonLayer = L.polygon(drawPoints, {
        color: '#f59e0b',
        weight: 2,
        fillOpacity: 0.15,
        fillColor: '#f59e0b',
        dashArray: '5, 5',
      }).addTo(map!)
    }
  })

  // Double-click to finish polygon
  map.on('dblclick', (e: L.LeafletMouseEvent) => {
    L.DomEvent.stopPropagation(e as any)
    if (drawPoints.length >= 3 && polygonLayer) {
      // Finalize polygon — remove dashes
      polygonLayer.setStyle({ dashArray: undefined })
      clearDrawing() // Clear markers only
    }
  })
}

async function saveBoundary() {
  if (!selectedLocation.value || !polygonLayer) return

  savingBoundary.value = true
  try {
    const latLngs = polygonLayer.getLatLngs()[0] as L.LatLng[]
    const geoJson = {
      type: 'Polygon',
      coordinates: [latLngs.map(ll => [ll.lng, ll.lat])],
    }

    await locationsStore.updateLocation(selectedLocation.value.id, {
      boundary: geoJson,
    })
    await locationsStore.fetchTree()
  } catch {
    // Error handled silently
  } finally {
    savingBoundary.value = false
  }
}

function openCreateModal(level: 'country' | 'city' | 'area', parent?: LocationNode) {
  modalLevel.value = level
  modalParent.value = parent || null
  modalName.value = ''
  modalOpen.value = true
}

async function createLocation() {
  if (!modalName.value.trim()) return
  creating.value = true
  try {
    await locationsStore.createLocation({
      name: modalName.value.trim(),
      level: modalLevel.value,
      parent_id: modalParent.value?.id ?? null,
    })
    modalOpen.value = false
    await locationsStore.fetchTree()

    // Auto-expand parent
    if (modalParent.value) {
      expanded.value.add(modalParent.value.id)
    }
  } catch {
    // Error handled silently
  } finally {
    creating.value = false
  }
}

async function toggleActive(loc: LocationNode) {
  try {
    await locationsStore.toggleLocation(loc.id)
    await locationsStore.fetchTree()
  } catch {
    // Error handled silently
  }
}

function confirmDelete(loc: LocationNode) {
  deleteTarget.value = loc
}

async function doDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await locationsStore.deleteLocation(deleteTarget.value.id)
    deleteTarget.value = null
    if (selectedLocation.value?.id === deleteTarget.value?.id) {
      selectedLocation.value = null
    }
    await locationsStore.fetchTree()
  } catch {
    // Error handled silently
  } finally {
    deleting.value = false
  }
}

onMounted(async () => {
  await locationsStore.fetchTree()
  await nextTick()
  initMap()
})

onBeforeUnmount(() => {
  if (map) {
    map.remove()
    map = null
  }
})
</script>

<style scoped>
.location-tree-item {
  border-radius: 0.5rem;
}

.location-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background 0.15s;
}

.location-row:hover {
  background: var(--color-bg-hover);
}

.location-row--sub {
  padding: 0.375rem 0.625rem;
}

.location-row--leaf {
  padding: 0.3rem 0.625rem;
}

.location-expand {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.location-expand:hover {
  background: var(--color-bg-hover);
}

.location-actions {
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 0.15s;
  flex-shrink: 0;
}

.location-row:hover .location-actions {
  opacity: 1;
}

.location-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--color-text-muted);
  transition: all 0.15s;
}

.location-action-btn:hover {
  background: var(--color-bg-elevated);
  color: var(--color-text);
}

.location-action-btn.text-danger-500:hover {
  color: var(--danger-text);
  background: var(--danger-bg);
}
</style>
