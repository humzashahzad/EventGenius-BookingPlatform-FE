<template>
  <div class="page-container">
    <!-- Header -->
    <div class="page-header">
      <div class="flex items-center gap-3">
        <router-link :to="{ name: 'store-venues' }" class="btn-ghost btn-icon">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </router-link>
        <div>
          <h1 class="page-title">Gallery — {{ venue?.name || '...' }}</h1>
          <p class="page-subtitle">Manage photos for this venue. First image is set as cover.</p>
        </div>
      </div>
      <label class="btn-primary gap-2 cursor-pointer">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
        </svg>
        Upload Images
        <input
          ref="fileInput"
          type="file"
          multiple
          accept="image/*"
          class="hidden"
          @change="handleUpload"
        />
      </label>
    </div>

    <!-- Upload Progress -->
    <div v-if="uploading" class="alert alert-info">
      <svg class="w-4 h-4 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
      <span>Uploading {{ uploadCount }} image(s)... please wait</span>
    </div>

    <!-- Success/Error alerts -->
    <div v-if="successMsg" class="alert alert-success">
      <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      {{ successMsg }}
    </div>
    <div v-if="errorMsg" class="alert alert-danger">
      <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      {{ errorMsg }}
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="gallery-grid">
      <div v-for="i in 8" :key="i" class="skeleton" style="aspect-ratio:1;border-radius:0.75rem;"></div>
    </div>

    <!-- Gallery Grid -->
    <div v-else-if="images.length" class="card card-body">
      <div class="flex items-center justify-between mb-4">
        <p class="text-sm text-surface-500">{{ images.length }} photo{{ images.length !== 1 ? 's' : '' }}</p>
        <div class="flex items-center gap-2 text-xs text-surface-400">
          <span class="w-3 h-3 rounded-full bg-primary-500 inline-block"></span> Primary (cover)
        </div>
      </div>

      <div class="gallery-grid">
        <div
          v-for="image in images"
          :key="image.id"
          class="gallery-item"
          :class="{ 'primary-img': image.is_primary }"
        >
          <img :src="imageUrl(image.path)" :alt="image.alt_text || venue?.name" loading="lazy" />

          <!-- Primary badge -->
          <div v-if="image.is_primary" class="absolute top-2 left-2 z-10">
            <span class="badge badge-primary text-2xs">Cover</span>
          </div>

          <!-- Actions overlay -->
          <div class="gallery-item-overlay">
            <button
              v-if="!image.is_primary"
              @click="setPrimary(image)"
              :disabled="actionId === image.id"
              class="btn-white btn-sm text-xs gap-1"
              title="Set as cover"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
              </svg>
              Cover
            </button>
            <button
              @click="deleteImage(image)"
              :disabled="actionId === image.id"
              class="btn-danger btn-sm text-xs gap-1"
              title="Delete image"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
              Delete
            </button>
          </div>
        </div>

        <!-- Upload drop zone -->
        <label
          class="relative rounded-xl border-2 border-dashed border-surface-300 hover:border-primary-400
                 flex flex-col items-center justify-center gap-2 cursor-pointer
                 transition-colors duration-200 hover:bg-primary-50 text-surface-400 hover:text-primary-500"
          style="aspect-ratio:1;"
        >
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M12 4v16m8-8H4"/>
          </svg>
          <span class="text-xs font-medium">Add Photos</span>
          <input type="file" multiple accept="image/*" class="hidden" @change="handleUpload" />
        </label>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="card card-body">
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
        </div>
        <p class="empty-state-title">No photos yet</p>
        <p class="empty-state-desc">Upload photos to showcase your venue to potential clients</p>
        <label class="btn-primary mt-4 gap-2 cursor-pointer">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
          </svg>
          Upload Photos
          <input type="file" multiple accept="image/*" class="hidden" @change="handleUpload" />
        </label>
      </div>
    </div>

    <!-- Delete Confirm Modal -->
    <div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget = null">
      <div class="modal max-w-sm">
        <div class="modal-header">
          <h3 class="modal-title">Delete Image</h3>
          <button @click="deleteTarget = null" class="btn-ghost btn-icon">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <img
            :src="imageUrl(deleteTarget.path)"
            class="w-full h-40 object-cover rounded-lg mb-4"
            :alt="deleteTarget.alt_text ?? undefined"
          />
          <p class="text-sm text-surface-600">
            Are you sure you want to delete this image? This action cannot be undone.
          </p>
        </div>
        <div class="modal-footer">
          <button @click="deleteTarget = null" class="btn-ghost">Cancel</button>
          <button @click="confirmDelete" :disabled="deleting" class="btn-danger gap-2">
            <svg v-if="deleting" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            {{ deleting ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/lib/axios'
import { getStorageUrl } from '@/lib/storageUrl'

interface VenueImage {
  id: number
  venue_id: number
  path: string
  alt_text: string | null
  is_primary: boolean
  sort_order: number
}

interface Venue {
  id: number
  name: string
}

const route = useRoute()
const venueId = route.params.id as string

const venue       = ref<Venue | null>(null)
const images      = ref<VenueImage[]>([])
const loading     = ref(false)
const uploading   = ref(false)
const uploadCount = ref(0)
const actionId    = ref<number | null>(null)
const deleting    = ref(false)
const deleteTarget = ref<VenueImage | null>(null)
const successMsg  = ref('')
const errorMsg    = ref('')

function imageUrl(path: string): string {
  return getStorageUrl(path)
}

function showSuccess(msg: string) {
  successMsg.value = msg
  errorMsg.value   = ''
  setTimeout(() => (successMsg.value = ''), 3000)
}

function showError(msg: string) {
  errorMsg.value   = msg
  successMsg.value = ''
  setTimeout(() => (errorMsg.value = ''), 4000)
}

async function loadVenue() {
  loading.value = true
  try {
    const { data } = await api.get(`/store/venues/${venueId}`)
    venue.value  = data.data
    images.value = data.data.images || []
  } catch {
    showError('Failed to load venue.')
  } finally {
    loading.value = false
  }
}

async function handleUpload(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return

  const formData = new FormData()
  uploadCount.value = input.files.length
  for (const file of input.files) {
    formData.append('images[]', file)
  }

  uploading.value = true
  try {
    await api.post(`/store/venues/${venueId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    showSuccess(`${uploadCount.value} image(s) uploaded successfully.`)
    await loadVenue()
  } catch (e: any) {
    showError(e.response?.data?.message || 'Upload failed.')
  } finally {
    uploading.value = false
    input.value = ''
  }
}

function setPrimary(image: VenueImage) {
  actionId.value = image.id
  api.patch(`/store/venues/${venueId}/images/${image.id}/set-primary`)
    .then(() => {
      showSuccess('Cover image updated.')
      return loadVenue()
    })
    .catch(() => showError('Failed to update cover image.'))
    .finally(() => (actionId.value = null))
}

function deleteImage(image: VenueImage) {
  deleteTarget.value = image
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await api.delete(`/store/venues/${venueId}/images/${deleteTarget.value.id}`)
    showSuccess('Image deleted.')
    deleteTarget.value = null
    await loadVenue()
  } catch {
    showError('Failed to delete image.')
  } finally {
    deleting.value = false
  }
}

onMounted(loadVenue)
</script>
