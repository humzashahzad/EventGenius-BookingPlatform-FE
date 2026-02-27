<template>
  <div class="page-container">
    <div class="page-header">
      <div><h1 class="page-title">My Venues</h1><p class="page-subtitle">Manage your venue listings, edit details and upload galleries.</p></div>
      <RouterLink to="/shop/venues/create" class="btn-primary gap-1.5">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        Add Venue
      </RouterLink>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="i in 6" :key="i" class="skeleton h-64 rounded-xl"></div>
    </div>

    <!-- Empty state -->
    <div v-else-if="venues.length === 0" class="card">
      <div class="card-body flex flex-col items-center py-16 text-center">
        <div class="w-16 h-16 bg-accent-100 rounded-2xl flex items-center justify-center mb-4">
          <svg class="w-8 h-8 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
        </div>
        <h3 class="text-lg font-semibold text-surface-800">No venues yet</h3>
        <p class="text-surface-500 mt-1 max-w-xs">Add your first venue to start accepting bookings from clients.</p>
        <RouterLink to="/shop/venues/create" class="btn-primary mt-5">Add Your First Venue</RouterLink>
      </div>
    </div>

    <!-- Venue cards grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="venue in venues" :key="venue.id" class="venue-card group">
        <!-- Image -->
        <div class="venue-card-image">
          <img v-if="venue.thumbnail" :src="getStorageUrl(venue.thumbnail)" :alt="venue.name" />
          <div v-else class="w-full h-full flex items-center justify-center bg-surface-100">
            <svg class="w-12 h-12 text-surface-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          </div>
          <!-- Status badge overlay -->
          <div class="absolute top-3 right-3">
            <span :class="venue.status === 'active' ? 'badge-success' : 'badge-warning'" class="capitalize shadow-sm">{{ venue.status }}</span>
          </div>
        </div>

        <!-- Card body -->
        <div class="venue-card-body">
          <h3 class="venue-card-title line-clamp-1">{{ venue.name }}</h3>
          <p class="venue-card-location">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/></svg>
            {{ venue.city }}
          </p>

          <div class="flex items-center justify-between mt-2 mb-4">
            <div>
              <span class="venue-card-price">PKR {{ formatPrice(venue) }}</span>
              <span class="text-xs text-surface-400 ml-1">/ head</span>
            </div>
            <span class="text-xs text-surface-400">{{ venue.capacity_min }}–{{ venue.capacity_max }} guests</span>
          </div>

          <!-- Actions -->
          <div class="flex gap-2 mt-auto">
            <RouterLink :to="`/shop/venues/${venue.id}/gallery`"
              class="btn btn-sm border border-surface-200 text-surface-600 hover:border-primary-300 hover:text-primary-700 flex-1 text-center gap-1.5">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              Gallery
            </RouterLink>
            <RouterLink :to="`/shop/venues/${venue.id}/edit`" class="btn-primary btn-sm flex-1 text-center">Edit</RouterLink>
            <button @click="confirmDelete(venue)" class="btn-danger btn-sm px-3">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirm Modal -->
    <Teleport to="body">
      <div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget = null">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title">Delete Venue</h3>
            <button @click="deleteTarget = null" class="btn-icon btn-ghost"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
          </div>
          <div class="modal-body">
            <div class="flex items-start gap-4">
              <div class="w-10 h-10 rounded-full bg-danger-100 flex items-center justify-center flex-shrink-0">
                <svg class="w-5 h-5 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              </div>
              <div>
                <p class="text-sm font-medium text-surface-800">Delete <strong>{{ deleteTarget.name }}</strong>?</p>
                <p class="text-sm text-surface-500 mt-1">All gallery images and booking history for this venue will be permanently removed.</p>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button @click="deleteTarget = null" class="btn-ghost">Cancel</button>
            <button @click="doDelete" :disabled="acting" class="btn-danger">
              <svg v-if="acting" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              Delete Venue
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import api from '@/lib/axios'
import { getStorageUrl } from '@/lib/storageUrl'

const venues      = ref<any[]>([])
const loading     = ref(false)
const acting      = ref(false)
const deleteTarget = ref<any>(null)

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/store/venues')
    venues.value = data.data.data
  } finally { loading.value = false }
}

function confirmDelete(venue: any) { deleteTarget.value = venue }

async function doDelete() {
  if (!deleteTarget.value) return
  acting.value = true
  try {
    await api.delete(`/store/venues/${deleteTarget.value.id}`)
    venues.value = venues.value.filter(v => v.id !== deleteTarget.value.id)
    deleteTarget.value = null
  } finally { acting.value = false }
}

function formatPrice(v: any) {
  const p = v.price_per_head
  return p ? Number(p).toLocaleString() : 'N/A'
}

onMounted(load)
</script>
