<template>
  <div class="content-container">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="text-2xl font-bold text-warm-900 dark:text-warm-50 tracking-tight">My Venues</h1>
        <p class="text-sm text-warm-500 dark:text-warm-400 mt-1">Manage your venue listings, edit details and upload galleries.</p>
      </div>
      <RouterLink to="/shop/venues/create" class="btn-primary gap-1.5">
        <AppIcon icon="plus" class="w-4 h-4" />
        Add Venue
      </RouterLink>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="i in 6" :key="i" class="skeleton h-[280px] rounded-2xl"></div>
    </div>

    <!-- Empty state -->
    <div v-else-if="filteredVenues.length === 0" class="card">
      <div class="flex flex-col items-center py-16 text-center px-6">
        <div class="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center mb-4">
          <AppIcon icon="map-pin" class="w-8 h-8 text-primary-600 dark:text-primary-400" />
        </div>
        <h3 class="text-lg font-semibold text-warm-800 dark:text-warm-100">No venues yet</h3>
        <p class="text-warm-500 dark:text-warm-400 mt-1 max-w-xs text-sm">Add your first venue to start accepting bookings from clients.</p>
        <RouterLink to="/shop/venues/create" class="btn-primary mt-5">Add Your First Venue</RouterLink>
      </div>
    </div>

    <!-- Venue cards grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="venue in filteredVenues" :key="venue.id" class="card group hover:shadow-elevated transition-all duration-300 overflow-hidden flex flex-col">
        <!-- Image -->
        <div class="relative h-44 overflow-hidden">
          <img v-if="venue.thumbnail" :src="getStorageUrl(venue.thumbnail)" :alt="venue.name" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
          <div v-else class="w-full h-full flex items-center justify-content-center bg-warm-100 dark:bg-warm-800">
            <AppIcon icon="image" class="w-10 h-10 text-warm-300 dark:text-warm-600 mx-auto" />
          </div>
          <div class="absolute top-3 right-3">
            <span :class="venue.status === 'active' ? 'badge-primary' : 'badge-accent'" class="capitalize">{{ venue.status }}</span>
          </div>
        </div>

        <!-- Card body -->
        <div class="p-5 flex-1 flex flex-col">
          <h3 class="text-sm font-semibold text-warm-900 dark:text-warm-50 truncate">{{ venue.name }}</h3>
          <p class="text-warm-500 dark:text-warm-400 text-xs mt-1 flex items-center gap-1">
            <AppIcon icon="map-pin" class="w-3 h-3" />
            {{ venue.city }}
          </p>

          <div class="flex items-center justify-between mt-3 mb-4">
            <div>
              <span class="font-semibold text-warm-900 dark:text-warm-50 text-sm">PKR {{ formatPrice(venue) }}</span>
              <span class="text-warm-500 dark:text-warm-400 text-xs ml-1">/ head</span>
            </div>
            <span class="text-warm-500 dark:text-warm-400 text-xs">{{ venue.capacity_min }}–{{ venue.capacity_max }} guests</span>
          </div>

          <!-- Actions -->
          <div class="flex gap-2 mt-auto">
            <RouterLink :to="`/shop/venues/${venue.id}/gallery`" class="btn-outline btn-sm flex-1 gap-1.5 justify-center">
              <AppIcon icon="image" class="w-3.5 h-3.5" />
              Gallery
            </RouterLink>
            <RouterLink :to="`/shop/venues/${venue.id}/edit`" class="btn-primary btn-sm flex-1 justify-center">Edit</RouterLink>
            <button @click="confirmDelete(venue)" class="btn-danger btn-sm !px-2.5 flex-shrink-0">
              <AppIcon icon="trash" class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirm Modal -->
    <VuexyModal v-model:visible="showDeleteModal" title="Delete Venue" width="28rem">
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 rounded-xl bg-coral/10 dark:bg-coral/20 flex items-center justify-center flex-shrink-0">
          <AppIcon icon="alert-triangle" class="w-5 h-5 text-coral" />
        </div>
        <div>
          <p class="font-medium text-warm-900 dark:text-warm-50 text-sm">Delete <strong>{{ deleteTarget?.name }}</strong>?</p>
          <p class="text-warm-500 dark:text-warm-400 text-xs mt-1">All gallery images and booking history for this venue will be permanently removed.</p>
        </div>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="showDeleteModal = false">Cancel</button>
        <button class="btn-danger" :disabled="acting" @click="doDelete">
          <AppIcon v-if="acting" icon="loader" class="w-4 h-4 animate-spin" />
          Delete Venue
        </button>
      </template>
    </VuexyModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import api from '@/lib/axios'
import { getStorageUrl } from '@/lib/storageUrl'
import { useTopBarActionsStore } from '@/stores/topBarActions'
import VuexyModal from '@/components/ui/VuexyModal.vue'
import AppIcon from '@/components/ui/AppIcon.vue'

const venues      = ref<any[]>([])
const loading     = ref(false)
const acting      = ref(false)
const deleteTarget = ref<any>(null)
const showDeleteModal = ref(false)
const search      = ref('')
const topBarActions = useTopBarActionsStore()

const filteredVenues = computed(() => {
  if (!search.value) return venues.value
  const q = search.value.toLowerCase()
  return venues.value.filter((v: any) => v.name?.toLowerCase().includes(q) || v.city?.toLowerCase().includes(q))
})

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/store/venues')
    venues.value = data.data.data
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
    deleteTarget.value = null
    showDeleteModal.value = false
  } finally { acting.value = false }
}

function formatPrice(v: any) {
  const p = v.price_per_head
  return p ? Number(p).toLocaleString() : 'N/A'
}

onMounted(() => {
  load()
  topBarActions.set({
    searchPlaceholder: 'Search venues...',
    searchValue: search.value,
    onSearch(q: string) {
      search.value = q
    },
  })
})

onUnmounted(() => {
  topBarActions.clear()
})
</script>
