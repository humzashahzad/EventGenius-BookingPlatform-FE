<template>
  <div class="space-y-5">
    <header class="page-header !mb-0">
      <div class="min-w-0">
        <RouterLink :to="venue ? `/shop/venues/${venueId}/edit` : { name: 'shop-venues' }" class="btn-ghost btn-sm -ml-2 mb-2"><AppIcon icon="chevron-left" class="w-4 h-4" />{{ venue?.name || 'Venue' }}</RouterLink>
        <h1 class="page-title">Photo gallery</h1>
        <p class="page-subtitle">The cover photo is shown first in search and on the venue page.</p>
      </div>
      <div class="page-header-actions">
        <label class="btn-primary cursor-pointer" :class="uploading && 'opacity-60 pointer-events-none'">
          <AppIcon icon="upload" class="w-4 h-4" />Upload photos
          <input ref="fileInput" type="file" multiple accept="image/*" class="sr-only" @change="handleUpload" />
        </label>
      </div>
    </header>

    <div v-if="uploading" class="alert-info" role="status">
      <AppIcon icon="loader" class="w-5 h-5 animate-spin shrink-0" />
      <p>Uploading {{ uploadCount }} photo{{ uploadCount === 1 ? '' : 's' }}… please wait.</p>
    </div>
    <div v-if="successMsg" class="alert-success" role="status">
      <AppIcon icon="circle-check" class="w-5 h-5 shrink-0" /><p>{{ successMsg }}</p>
    </div>
    <div v-if="errorMsg" class="alert-danger" role="alert">
      <AppIcon icon="alert-circle" class="w-5 h-5 shrink-0" /><p>{{ errorMsg }}</p>
    </div>

    <!-- Loading -->
    <div v-if="loading && !images.length" class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4" aria-busy="true">
      <div v-for="i in 8" :key="i" class="skeleton aspect-[4/3]" />
    </div>

    <template v-else>
      <!-- Drop zone -->
      <label
        class="dropzone"
        :class="dragOver && 'is-over'"
        @dragover.prevent="dragOver = true"
        @dragleave.prevent="dragOver = false"
        @drop.prevent="onDrop"
      >
        <span class="icon-chip tone-brand"><AppIcon icon="cloud-upload" class="w-5 h-5" /></span>
        <span class="text-sm font-medium text-ink">Drag photos here or <span class="text-brand-text underline underline-offset-2">browse</span></span>
        <span class="text-xs text-ink-muted">JPG or PNG, landscape works best. You can select several at once.</span>
        <input type="file" multiple accept="image/*" class="sr-only" @change="handleUpload" />
      </label>

      <section v-if="images.length" class="card">
        <div class="card-header">
          <div><h2 class="card-title">{{ images.length }} photo{{ images.length !== 1 ? 's' : '' }}</h2><p class="card-subtitle">Set a cover or remove photos you no longer want.</p></div>
        </div>
        <div class="card-body">
          <ul class="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
            <li
              v-for="image in images"
              :key="image.id"
              class="rounded-lg border overflow-hidden bg-surface flex flex-col"
              :class="image.is_primary ? 'border-brand-text ring-1 ring-brand-text' : 'border-line'"
            >
              <div class="relative aspect-[4/3] bg-surface-sunken">
                <img :src="imageUrl(image.path)" :alt="image.alt_text || venue?.name || 'Venue photo'" loading="lazy" class="w-full h-full object-cover" />
                <span v-if="image.is_primary" class="absolute top-2 left-2 badge-confirmed shadow-xs">Cover photo</span>
              </div>
              <div class="flex items-center justify-between gap-2 px-2.5 py-2 border-t border-line">
                <button
                  v-if="!image.is_primary"
                  type="button"
                  class="btn-ghost btn-sm"
                  :disabled="actionId === image.id"
                  @click="setPrimary(image)"
                >
                  <AppIcon :icon="actionId === image.id ? 'loader' : 'star'" :class="actionId === image.id ? 'w-4 h-4 animate-spin' : 'w-4 h-4'" />Make cover
                </button>
                <span v-else class="text-xs text-ink-muted px-2">Shown first</span>
                <button type="button" class="btn-icon btn-icon-sm hover:!text-danger-text" :disabled="actionId === image.id" aria-label="Delete photo" title="Delete photo" @click="deleteImage(image)">
                  <AppIcon icon="trash" class="w-4 h-4" />
                </button>
              </div>
            </li>
          </ul>
        </div>
      </section>

      <div v-else class="card">
        <div class="empty-state">
          <div class="empty-state-icon"><AppIcon icon="image" class="w-5 h-5" /></div>
          <p class="empty-state-title">No photos yet</p>
          <p class="empty-state-desc">Venues with 5+ good photos get noticeably more booking requests.</p>
          <div class="empty-state-actions">
            <label class="btn-primary cursor-pointer"><AppIcon icon="upload" class="w-4 h-4" />Upload photos
              <input type="file" multiple accept="image/*" class="sr-only" @change="handleUpload" />
            </label>
          </div>
        </div>
      </div>
    </template>

    <!-- Delete Confirm Modal -->
    <VuexyModal v-model:visible="showDeleteModal" title="Delete photo" width="28rem">
      <div v-if="deleteTarget">
        <img :src="imageUrl(deleteTarget.path)" class="w-full rounded-lg mb-4 aspect-[16/9] object-cover" :alt="deleteTarget.alt_text ?? 'Photo to delete'" />
        <p class="text-ink-secondary text-sm">Delete this photo? This can't be undone.</p>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <button class="btn-secondary" @click="showDeleteModal = false">Cancel</button>
          <button class="btn-danger" :disabled="deleting" @click="confirmDelete">
            <AppIcon v-if="deleting" icon="loader" class="w-4 h-4 animate-spin" />
            {{ deleting ? 'Deleting…' : 'Delete photo' }}
          </button>
        </div>
      </template>
    </VuexyModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
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

const dragOver = ref(false)

function onDrop(e: DragEvent) {
  dragOver.value = false
  const files = Array.from(e.dataTransfer?.files || []).filter(f => f.type.startsWith('image/'))
  if (files.length) uploadFiles(files)
}

async function handleUpload(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return
  try {
    await uploadFiles(Array.from(input.files))
  } finally {
    input.value = ''
  }
}

async function uploadFiles(files: File[]) {
  const formData = new FormData()
  uploadCount.value = files.length
  for (const file of files) {
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
.dropzone {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.375rem;
  padding: 1.5rem 1rem; text-align: center; cursor: pointer;
  border: 2px dashed rgb(var(--c-line-strong) / 0.55); border-radius: var(--radius-lg);
  background-color: var(--surface);
  transition: border-color .15s ease, background-color .15s ease;
}
.dropzone:hover, .dropzone.is-over { border-color: var(--brand-text); background-color: var(--brand-soft); }
.dropzone:focus-within { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
</style>
