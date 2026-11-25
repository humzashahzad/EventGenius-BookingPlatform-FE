<template>
  <div class="space-y-5">
    <header class="page-header !mb-0">
      <div>
        <h1 class="page-title">My venues</h1>
        <p class="page-subtitle">
          <template v-if="loading">Loading venues…</template>
          <template v-else>{{ venues.length }} venue{{ venues.length === 1 ? '' : 's' }} · {{ activeCount }} active · edit details and photo galleries</template>
        </p>
      </div>
      <div class="page-header-actions">
        <RouterLink to="/shop/venues/create" class="btn-primary"><AppIcon icon="plus" class="w-4 h-4" />Add venue</RouterLink>
      </div>
    </header>

    <!-- Toolbar -->
    <div v-if="!loading && venues.length" class="flex flex-col sm:flex-row gap-3">
      <TextInput v-model="search" type="search" prefix-icon="search" clearable clear-label="Clear search" class="flex-1 min-w-0 sm:max-w-sm" placeholder="Search by name or city" aria-label="Search venues" />
      <SegmentedControl v-model="statusFilter" class="self-start" aria-label="Status" :options="statusFilters.map(s => ({ value: s.value, label: s.label }))" />
    </div>

    <!-- Loading -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4" aria-busy="true">
      <div v-for="i in 3" :key="i" class="card overflow-hidden">
        <div class="skeleton aspect-[16/9] !rounded-none" />
        <div class="p-4 space-y-2"><div class="skeleton h-4 w-2/3" /><div class="skeleton h-3 w-1/3" /><div class="skeleton h-9 w-full mt-4" /></div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="loadError" class="card">
      <div class="empty-state">
        <div class="empty-state-icon"><AppIcon icon="alert-circle" class="w-5 h-5" /></div>
        <p class="empty-state-title">Couldn't load your venues</p>
        <p class="empty-state-desc">{{ loadError }}</p>
        <div class="empty-state-actions"><button class="btn-primary" @click="load">Try again</button></div>
      </div>
    </div>

    <!-- Empty -->
    <div v-else-if="!venues.length" class="card">
      <div class="empty-state">
        <div class="empty-state-icon"><AppIcon icon="building" class="w-5 h-5" /></div>
        <p class="empty-state-title">No venues yet</p>
        <p class="empty-state-desc">Add your first venue to start accepting bookings from clients.</p>
        <div class="empty-state-actions"><RouterLink to="/shop/venues/create" class="btn-primary"><AppIcon icon="plus" class="w-4 h-4" />Add your first venue</RouterLink></div>
      </div>
    </div>

    <div v-else-if="!filteredVenues.length" class="card">
      <div class="empty-state">
        <div class="empty-state-icon"><AppIcon icon="search" class="w-5 h-5" /></div>
        <p class="empty-state-title">No venues match</p>
        <p class="empty-state-desc">Try a different name, city or status.</p>
        <div class="empty-state-actions"><button class="btn-secondary" @click="search = ''; statusFilter = ''">Clear filters</button></div>
      </div>
    </div>

    <!-- Cards -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
      <article v-for="venue in filteredVenues" :key="venue.id" class="card card-hover overflow-hidden flex flex-col">
        <RouterLink :to="`/shop/venues/${venue.id}/edit`" class="relative block aspect-[16/9] bg-surface-sunken" :aria-label="`Edit ${venue.name}`">
          <img v-if="venue.thumbnail" :src="getStorageUrl(venue.thumbnail)" :alt="venue.name" class="w-full h-full object-cover" loading="lazy" />
          <div v-else class="w-full h-full flex flex-col items-center justify-center gap-1 text-ink-muted">
            <AppIcon icon="image" class="w-8 h-8" />
            <span class="text-xs">No cover photo</span>
          </div>
          <div class="absolute top-3 left-3 flex gap-1.5">
            <span :class="statusBadgeClass(venue.status)" class="shadow-xs">{{ statusLabel(venue.status) }}</span>
            <span v-if="venue.is_featured" class="badge-info shadow-xs">Featured</span>
          </div>
        </RouterLink>

        <div class="p-4 flex-1 flex flex-col">
          <div class="min-w-0">
            <h2 class="font-sans text-base font-semibold text-ink truncate tracking-normal">{{ venue.name }}</h2>
            <p class="text-sm text-ink-muted flex items-center gap-1 mt-0.5 min-w-0">
              <AppIcon icon="map-pin" class="w-3.5 h-3.5 shrink-0" /><span class="truncate">{{ venue.address || venue.city }}</span>
            </p>
          </div>

          <dl class="grid grid-cols-3 gap-2 mt-4 text-center">
            <div class="panel-sunken px-2 py-2">
              <dt class="text-[11px] text-ink-muted">Price / head</dt>
              <dd class="text-sm font-semibold text-ink num truncate">{{ venue.price_per_head ? compactPKR(venue.price_per_head).replace('PKR ', '') : '—' }}</dd>
            </div>
            <div class="panel-sunken px-2 py-2">
              <dt class="text-[11px] text-ink-muted">Guests</dt>
              <dd class="text-sm font-semibold text-ink num truncate">{{ venue.capacity_min }}–{{ venue.capacity_max }}</dd>
            </div>
            <div class="panel-sunken px-2 py-2">
              <dt class="text-[11px] text-ink-muted">Rating</dt>
              <dd class="text-sm font-semibold text-ink num inline-flex items-center gap-0.5">
                <AppIcon icon="star-filled" class="w-3 h-3 text-amber-500 fill-current" />{{ Number(venue.avg_rating || 0).toFixed(1) }}
              </dd>
            </div>
          </dl>
          <p class="text-xs text-ink-muted mt-3 num">{{ venue.total_bookings ?? 0 }} bookings · {{ venue.total_reviews ?? 0 }} reviews · {{ venue.images?.length ?? 0 }} photos</p>

          <div class="flex gap-2 mt-4 pt-4 border-t border-line">
            <RouterLink :to="`/shop/venues/${venue.id}/edit`" class="btn-secondary btn-sm flex-1"><AppIcon icon="edit" class="w-4 h-4" />Edit</RouterLink>
            <RouterLink :to="`/shop/venues/${venue.id}/gallery`" class="btn-secondary btn-sm flex-1"><AppIcon icon="image" class="w-4 h-4" />Gallery</RouterLink>
            <a v-if="venue.slug" :href="`/venues/${venue.slug}`" target="_blank" rel="noopener" class="btn-icon btn-icon-sm" :aria-label="`View ${venue.name} public page`" title="View public page">
              <AppIcon icon="external-link" class="w-4 h-4" />
            </a>
            <button class="btn-icon btn-icon-sm hover:!text-danger-text" :aria-label="`Delete ${venue.name}`" title="Delete venue" @click="confirmDelete(venue)">
              <AppIcon icon="trash" class="w-4 h-4" />
            </button>
          </div>
        </div>
      </article>
    </div>

    <!-- Delete Confirm Modal -->
    <VuexyModal v-model:visible="showDeleteModal" title="Delete venue" width="28rem">
      <div class="flex items-start gap-3">
        <span class="icon-chip tone-danger"><AppIcon icon="alert-triangle" class="w-5 h-5" /></span>
        <div>
          <p class="font-medium text-ink text-sm">Delete <strong>{{ deleteTarget?.name }}</strong>?</p>
          <p class="text-ink-muted text-sm mt-1">All gallery images and booking history for this venue will be permanently removed.</p>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <button class="btn-secondary" @click="showDeleteModal = false">Cancel</button>
          <button class="btn-danger" :disabled="acting" @click="doDelete">
            <AppIcon v-if="acting" icon="loader" class="w-4 h-4 animate-spin" />
            Delete venue
          </button>
        </div>
      </template>
    </VuexyModal>
  </div>
</template>

<script setup lang="ts">
import { TextInput, SegmentedControl } from '@/components/forms'
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { toast } from 'vue-sonner'
import api from '@/lib/axios'
import { getStorageUrl } from '@/lib/storageUrl'
import { statusBadgeClass, statusLabel } from '@/lib/status'
import VuexyModal from '@/components/ui/VuexyModal.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { compactPKR } from '@/components/dashboard/metrics'

const venues = ref<any[]>([])
const loading = ref(false)
const loadError = ref('')
const acting = ref(false)
const deleteTarget = ref<any>(null)
const showDeleteModal = ref(false)
const search = ref('')
const statusFilter = ref('')

const statusFilters = [
  { value: '', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

const activeCount = computed(() => venues.value.filter(v => v.status === 'active').length)

const filteredVenues = computed(() => {
  const q = search.value.trim().toLowerCase()
  return venues.value.filter((v: any) => {
    if (statusFilter.value === 'active' && v.status !== 'active') return false
    if (statusFilter.value === 'inactive' && v.status === 'active') return false
    if (!q) return true
    return v.name?.toLowerCase().includes(q) || v.city?.toLowerCase().includes(q)
  })
})

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const { data } = await api.get('/store/venues')
    venues.value = data.data.data
  } catch (e: any) {
    loadError.value = e.response?.data?.message || 'Please check your connection and try again.'
  } finally { loading.value = false }
}

function confirmDelete(venue: any) {
  deleteTarget.value = venue
  showDeleteModal.value = true
}

async function doDelete() {
  if (!deleteTarget.value) return
  acting.value = true
  try {
    await api.delete(`/store/venues/${deleteTarget.value.id}`)
    venues.value = venues.value.filter(v => v.id !== deleteTarget.value.id)
    toast.success('Venue deleted.')
    deleteTarget.value = null
    showDeleteModal.value = false
  } catch (e: any) {
    toast.error(e.response?.data?.message || 'Could not delete this venue.')
  } finally { acting.value = false }
}

onMounted(load)
</script>
