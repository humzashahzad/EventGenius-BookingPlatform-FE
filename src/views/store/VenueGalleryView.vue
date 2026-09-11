<template>
  <div class="content-container">
    <!-- Header -->
    <div class="page-header">
      <div class="flex items-center gap-3">
        <router-link :to="{ name: 'shop-venues' }" class="btn-ghost !p-2 rounded-xl">
          <AppIcon icon="chevron-left" class="w-5 h-5 text-warm-600 dark:text-warm-400" />
        </router-link>
        <div>
          <h1 class="text-2xl font-bold text-warm-900 dark:text-warm-50 tracking-tight">Gallery — {{ venue?.name || '...' }}</h1>
          <p class="text-sm text-warm-500 dark:text-warm-400 mt-1">Manage photos for this venue. First image is set as cover.</p>
        </div>
      </div>
      <label class="btn-primary gap-1.5 cursor-pointer">
        <AppIcon icon="upload" class="w-4 h-4" />
        Upload Images
        <input ref="fileInput" type="file" multiple accept="image/*" class="hidden" @change="handleUpload" />
      </label>
    </div>

    <!-- Upload Progress -->
    <transition name="fade">
      <div v-if="uploading" class="flex items-center gap-3 p-4 rounded-2xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300 mb-6">
        <AppIcon icon="loader" class="w-5 h-5 animate-spin flex-shrink-0" />
        <p class="text-sm font-medium">Uploading {{ uploadCount }} image(s)... please wait</p>
      </div>
    </transition>

    <!-- Success/Error alerts -->
    <transition name="fade">
      <div v-if="successMsg" class="flex items-center gap-3 p-4 rounded-2xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300 mb-6">
        <AppIcon icon="circle-check" class="w-5 h-5 flex-shrink-0" />
        <p class="text-sm font-medium">{{ successMsg }}</p>
      </div>
    </transition>
    <transition name="fade">
      <div v-if="errorMsg" class="flex items-center gap-3 p-4 rounded-2xl bg-coral/10 dark:bg-coral/20 border border-coral/30 text-coral dark:text-red-300 mb-6">
        <AppIcon icon="alert-circle" class="w-5 h-5 flex-shrink-0" />
        <p class="text-sm font-medium">{{ errorMsg }}</p>
      </div>
    </transition>

    <!-- Loading skeleton -->
    <div v-if="loading" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      <div v-for="i in 8" :key="i" class="skeleton aspect-square rounded-2xl"></div>
    </div>

    <!-- Gallery Grid -->
    <div v-else-if="images.length" class="card">
      <div class="p-5 sm:p-6">
        <div class="flex items-center justify-between mb-4">
          <p class="text-warm-500 dark:text-warm-400 text-xs">{{ images.length }} photo{{ images.length !== 1 ? 's' : '' }}</p>
          <div class="flex items-center gap-2 text-xs text-warm-500 dark:text-warm-400">
            <span class="inline-block w-2.5 h-2.5 rounded-full bg-primary-500"></span> Primary (cover)
          </div>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          <div
            v-for="image in images"
            :key="image.id"
            class="group relative aspect-square rounded-2xl overflow-hidden"
            :class="image.is_primary ? 'ring-2 ring-primary-500 ring-offset-2 ring-offset-warm-50 dark:ring-offset-warm-900' : ''"
          >
            <img :src="imageUrl(image.path)" :alt="image.alt_text || venue?.name" loading="lazy" class="w-full h-full object-cover" />

            <!-- Primary badge -->
            <div v-if="image.is_primary" class="absolute top-2 left-2 z-10">
              <span class="badge-primary text-[10px]">Cover</span>
            </div>

            <!-- Actions overlay -->
            <div class="absolute inset-0 bg-warm-950/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
              <button
                v-if="!image.is_primary"
                @click="setPrimary(image)"
                :disabled="actionId === image.id"
                class="btn-secondary btn-sm !text-xs gap-1"
                title="Set as cover"
              >
                <AppIcon icon="star" class="w-3 h-3" />
                Cover
              </button>
              <button
                @click="deleteImage(image)"
                :disabled="actionId === image.id"
                class="btn-danger btn-sm !text-xs gap-1"
                title="Delete image"
              >
                <AppIcon icon="trash" class="w-3 h-3" />
                Delete
              </button>
            </div>
          </div>

          <!-- Upload drop zone -->
          <label
            class="aspect-square rounded-2xl border-2 border-dashed border-warm-300 dark:border-warm-600 hover:border-primary-400 dark:hover:border-primary-500 flex flex-col items-center justify-center gap-2 cursor-pointer text-warm-400 dark:text-warm-500 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
          >
            <AppIcon icon="plus" class="w-8 h-8" />
            <span class="text-xs font-medium">Add Photos</span>
            <input type="file" multiple accept="image/*" class="hidden" @change="handleUpload" />
          </label>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="card">
      <div class="flex flex-col items-center py-16 text-center px-6">
        <div class="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center mb-4">
          <AppIcon icon="image" class="w-8 h-8 text-primary-600 dark:text-primary-400" />
        </div>
        <h3 class="text-lg font-semibold text-warm-800 dark:text-warm-100">No photos yet</h3>
        <p class="text-warm-500 dark:text-warm-400 mt-1 max-w-xs text-sm">Upload photos to showcase your venue to potential clients.</p>
        <label class="btn-primary mt-5 cursor-pointer gap-1.5">
          <AppIcon icon="upload" class="w-4 h-4" />
          Upload Photos
          <input type="file" multiple accept="image/*" class="hidden" @change="handleUpload" />
        </label>
      </div>
    </div>

    <!-- Delete Confirm Modal -->
    <VuexyModal v-model:visible="showDeleteModal" title="Delete Image" width="28rem">
      <div v-if="deleteTarget">
        <img :src="imageUrl(deleteTarget.path)" class="w-full rounded-2xl mb-4 h-40 object-cover" :alt="deleteTarget.alt_text ?? undefined" />
        <p class="text-warm-500 dark:text-warm-400 text-sm">Are you sure you want to delete this image? This action cannot be undone.</p>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="showDeleteModal = false">Cancel</button>
        <button class="btn-danger gap-1.5" :disabled="deleting" @click="confirmDelete">
          <AppIcon v-if="deleting" icon="loader" class="w-4 h-4 animate-spin" />
          {{ deleting ? 'Deleting...' : 'Delete' }}
        </button>
      </template>
    </VuexyModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/lib/axios'
import { getStorageUrl } from '@/lib/storageUrl'
import VuexyModal from '@/components/ui/VuexyModal.vue'
import AppIcon from '@/components/ui/AppIcon.vue'

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
const showDeleteModal = ref(false)
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
  showDeleteModal.value = true
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await api.delete(`/store/venues/${venueId}/images/${deleteTarget.value.id}`)
    showSuccess('Image deleted.')
    deleteTarget.value = null
    showDeleteModal.value = false
    await loadVenue()
  } catch {
    showError('Failed to delete image.')
  } finally {
    deleting.value = false
  }
}

onMounted(loadVenue)
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
