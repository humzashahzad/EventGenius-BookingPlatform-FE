<template>
  <div class="space-y-5">
    <header class="page-header !mb-0">
      <div class="min-w-0">
        <RouterLink :to="venue ? `/shop/venues/${venueId}/edit` : { name: 'shop-venues' }" class="btn-ghost btn-sm -ml-2 mb-2"><AppIcon icon="chevron-left" class="w-4 h-4" />{{ venue?.name || 'Venue' }}</RouterLink>
        <h1 class="page-title">Photo gallery</h1>
        <p class="page-subtitle">The cover photo is shown first in search and on the venue page.</p>
      </div>
      <div class="page-header-actions">
        <label class="btn-primary cursor-pointer">
          <AppIcon icon="upload" class="w-4 h-4" />Upload photos
          <input ref="fileInput" type="file" multiple accept="image/*" class="sr-only" @change="handleUpload" />
        </label>
      </div>
    </header>

    <!-- Loading -->
    <div v-if="loading" class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4" aria-busy="true">
      <div v-for="i in 8" :key="i" class="skeleton aspect-[4/3]" />
    </div>

    <template v-else>
      <!-- Drop zone -->
      <FileUpload
        accept="image/*"
        multiple
        instant
        icon="cloud-upload"
        title="Drag photos here or"
        hint="JPG or PNG, landscape works best. You can select several at once."
        @select="uploadFiles"
      />

      <div v-if="loadError && !images.length" class="alert-danger" role="alert">
        <AppIcon icon="alert-circle" class="w-5 h-5 shrink-0" /><p>{{ loadError }}</p>
        <button type="button" class="btn-secondary btn-sm ml-auto" @click="loadVenue">Try again</button>
      </div>

      <section v-if="images.length || uploads.length" class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">{{ images.length }} photo{{ images.length !== 1 ? 's' : '' }}</h2>
            <p class="card-subtitle">Set a cover, change the order with the arrows, or remove photos you no longer want.</p>
          </div>
          <span v-if="orderSaving" class="text-xs text-ink-muted inline-flex items-center gap-1.5" role="status"><AppIcon icon="loader" class="w-3.5 h-3.5 animate-spin" />Saving order…</span>
        </div>
        <div class="card-body">
          <TransitionGroup tag="ul" name="tile" class="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
            <li
              v-for="(image, i) in images"
              :key="image.id"
              class="rounded-lg border overflow-hidden bg-surface flex flex-col"
              :class="image.is_primary ? 'border-brand-text ring-1 ring-brand-text' : 'border-line'"
            >
              <div class="relative aspect-[4/3] bg-surface-sunken">
                <img :src="imageUrl(image.path)" :alt="image.alt_text || venue?.name || 'Venue photo'" loading="lazy" class="w-full h-full object-cover" />
                <span v-if="image.is_primary" class="absolute top-2 left-2 badge-confirmed shadow-xs">Cover photo</span>
              </div>
              <div class="flex items-center justify-between gap-1 px-2.5 py-2 border-t border-line">
                <button
                  v-if="!image.is_primary"
                  type="button"
                  class="btn-ghost btn-sm"
                  :disabled="actions.isPending(image.id)"
                  @click="setPrimary(image)"
                >
                  <AppIcon :icon="actions.isPending(image.id, 'primary') ? 'loader' : 'star'" :class="actions.isPending(image.id, 'primary') ? 'w-4 h-4 animate-spin' : 'w-4 h-4'" />Make cover
                </button>
                <span v-else class="text-xs text-ink-muted px-2">Shown first</span>
                <div class="flex items-center gap-0.5 shrink-0">
                  <button type="button" class="btn-icon btn-icon-sm" :disabled="i === 0" aria-label="Move photo earlier" title="Move earlier" @click="move(i, -1)">
                    <AppIcon icon="chevron-left" class="w-4 h-4" />
                  </button>
                  <button type="button" class="btn-icon btn-icon-sm" :disabled="i === images.length - 1" aria-label="Move photo later" title="Move later" @click="move(i, 1)">
                    <AppIcon icon="chevron-right" class="w-4 h-4" />
                  </button>
                  <button type="button" class="btn-icon btn-icon-sm hover:!text-danger-text" :disabled="actions.isPending(image.id)" aria-label="Delete photo" title="Delete photo" @click="deleteImage(image)">
                    <AppIcon icon="trash" class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </li>
            <!-- Photos still uploading: local previews hold their place in the grid. -->
            <li v-for="u in uploads" :key="u.key" class="rounded-lg border border-line overflow-hidden bg-surface flex flex-col" aria-live="polite">
              <div class="relative aspect-[4/3] bg-surface-sunken">
                <img :src="u.preview" alt="" class="w-full h-full object-cover opacity-60" />
                <span class="absolute inset-0 flex items-center justify-center"><span class="badge-neutral shadow-xs"><AppIcon icon="loader" class="w-3.5 h-3.5 animate-spin" />Uploading</span></span>
              </div>
              <div class="flex items-center px-2.5 py-2 border-t border-line min-h-[2.75rem]">
                <span class="text-xs text-ink-muted truncate">{{ u.name }}</span>
              </div>
            </li>
          </TransitionGroup>
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
          <button class="btn-danger" @click="confirmDelete">Delete photo</button>
        </div>
      </template>
    </VuexyModal>
  </div>
</template>

<script setup lang="ts">
import { FileUpload } from '@/components/forms'
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { toast } from 'vue-sonner'
import api from '@/lib/axios'
import { getStorageUrl } from '@/lib/storageUrl'
import { useRowActions } from '@/composables/useRowActions'
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

interface PendingUpload { key: string; name: string; preview: string }

const route = useRoute()
const venueId = route.params.id as string

const venue       = ref<Venue | null>(null)
const images      = ref<VenueImage[]>([])
const loading     = ref(true)
const loadError   = ref('')
const uploads     = ref<PendingUpload[]>([])
const deleteTarget = ref<VenueImage | null>(null)
const showDeleteModal = ref(false)
// Per-photo pending state, so several photos can be changed one after another.
const actions = useRowActions()

function imageUrl(path: string): string {
  return getStorageUrl(path)
}

function sortImages(list: VenueImage[]) {
  return [...list].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
}

let loadSeq = 0
/** First call shows the skeleton; later calls swap in fresh data quietly. */
async function loadVenue() {
  const id = ++loadSeq
  try {
    const { data } = await api.get(`/store/venues/${venueId}`)
    if (id !== loadSeq) return
    venue.value  = data.data
    images.value = sortImages(data.data.images || [])
    loadError.value = ''
  } catch {
    if (id === loadSeq && loading.value) loadError.value = 'Failed to load venue.'
  } finally {
    if (id === loadSeq) loading.value = false
  }
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

let uploadSeq = 0
async function uploadFiles(files: File[]) {
  if (!files.length) return
  const formData = new FormData()
  for (const file of files) {
    formData.append('images[]', file)
  }
  // Show local previews straight away; they turn into real photos when the upload finishes.
  const batch: PendingUpload[] = files.map(f => ({ key: `up-${++uploadSeq}`, name: f.name, preview: URL.createObjectURL(f) }))
  uploads.value.push(...batch)
  const done = () => {
    const keys = new Set(batch.map(b => b.key))
    uploads.value = uploads.value.filter(u => !keys.has(u.key))
    batch.forEach(b => URL.revokeObjectURL(b.preview))
  }
  try {
    const { data } = await api.post(`/store/venues/${venueId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    const added: VenueImage[] = Array.isArray(data?.data) ? data.data : []
    const known = new Set(images.value.map(i => i.id))
    images.value.push(...added.filter(i => !known.has(i.id)))
    done()
    toast.success(`${files.length} photo${files.length === 1 ? '' : 's'} uploaded.`)
    loadVenue()
  } catch (e: any) {
    done()
    toast.error(e.response?.data?.message || 'Upload failed.')
  }
}

function setPrimary(image: VenueImage) {
  const prevPrimary = images.value.find(i => i.is_primary) ?? null
  actions.run(image.id, {
    apply: () => {
      images.value.forEach(i => { i.is_primary = i.id === image.id })
    },
    request: () => api.patch(`/store/venues/${venueId}/images/${image.id}/set-primary`),
    rollback: () => {
      images.value.forEach(i => { i.is_primary = !!prevPrimary && i.id === prevPrimary.id })
    },
    success: 'Cover photo updated.',
    error: 'Failed to update cover image.',
  }, 'primary')
}

function deleteImage(image: VenueImage) {
  deleteTarget.value = image
  showDeleteModal.value = true
}

function confirmDelete() {
  const image = deleteTarget.value
  if (!image) return
  // Close straight away; the photo disappears and comes back if the server refuses.
  deleteTarget.value = null
  showDeleteModal.value = false
  let index = -1
  let promoted: VenueImage | null = null
  actions.run(image.id, {
    apply: () => {
      index = images.value.findIndex(i => i.id === image.id)
      if (index !== -1) images.value.splice(index, 1)
      // Same rule as the server: the next photo becomes the cover.
      if (image.is_primary && images.value.length) {
        promoted = sortImages(images.value)[0]
        promoted.is_primary = true
      }
    },
    request: () => api.delete(`/store/venues/${venueId}/images/${image.id}`),
    rollback: () => {
      if (promoted) promoted.is_primary = false
      if (!images.value.some(i => i.id === image.id)) images.value.splice(Math.max(0, Math.min(index, images.value.length)), 0, image)
    },
    success: 'Photo deleted.',
    error: 'Failed to delete image.',
  }, 'delete')
}

// ── Reorder: moves apply instantly; the new order is saved once clicks settle ──
const orderSaving = ref(false)
let savedOrder: number[] = []
let orderTimer: ReturnType<typeof setTimeout> | null = null

function move(index: number, dir: -1 | 1) {
  const j = index + dir
  if (j < 0 || j >= images.value.length) return
  if (!orderTimer && !orderSaving.value) savedOrder = images.value.map(i => i.id)
  const list = [...images.value]
  ;[list[index], list[j]] = [list[j], list[index]]
  list.forEach((img, k) => { img.sort_order = k })
  images.value = list
  if (orderTimer) clearTimeout(orderTimer)
  orderTimer = setTimeout(saveOrder, 600)
}

async function saveOrder() {
  orderTimer = null
  const order = images.value.map(i => i.id)
  orderSaving.value = true
  try {
    await api.post(`/store/venues/${venueId}/images/reorder`, { order })
    savedOrder = order
    if (!orderTimer) toast.success('Photo order saved.')
  } catch (e: any) {
    if (!orderTimer) {
      const byId = new Map(images.value.map(i => [i.id, i]))
      const restored = savedOrder.map(id => byId.get(id)).filter(Boolean) as VenueImage[]
      for (const img of images.value) if (!savedOrder.includes(img.id)) restored.push(img)
      restored.forEach((img, k) => { img.sort_order = k })
      images.value = restored
    }
    toast.error(e.response?.data?.message || 'Could not save the new photo order.')
  } finally {
    orderSaving.value = false
  }
}

onMounted(loadVenue)
onBeforeUnmount(() => {
  if (orderTimer) { clearTimeout(orderTimer); saveOrder() }
  uploads.value.forEach(u => URL.revokeObjectURL(u.preview))
})
</script>

<style scoped>
.tile-move { transition: transform 200ms ease; }
@media (prefers-reduced-motion: reduce) { .tile-move { transition: none; } }
</style>
