<template>
  <div
    class="rounded-xl border border-dashed p-4 transition-colors"
    :class="dragover ? 'border-brand bg-brand-soft' : 'border-line-strong/50 bg-surface-sunken/50'"
    @dragover.prevent="dragover = true"
    @dragleave.prevent="dragover = false"
    @drop.prevent="handleDrop"
  >
    <div class="flex flex-col min-[420px]:flex-row items-center gap-4 text-center min-[420px]:text-left">
      <div class="relative w-20 h-20 rounded-full overflow-hidden shrink-0 border border-line bg-surface-sunken">
        <img v-if="displayAvatarUrl" :src="displayAvatarUrl" alt="Profile photo" class="w-full h-full object-cover" />
        <div v-else class="w-full h-full flex items-center justify-center text-ink-muted">
          <AppIcon icon="user" class="w-8 h-8" />
        </div>
        <div v-if="uploading" class="absolute inset-0 flex items-center justify-center bg-warm-900/60">
          <span class="spinner-border text-white" aria-hidden="true"></span>
        </div>
      </div>

      <div class="min-w-0 flex-1">
        <p class="text-sm font-semibold text-ink">Profile photo</p>
        <p class="text-xs text-ink-muted">JPG, PNG, GIF or WebP, up to 2 MB. Drag an image here or choose a file.</p>
        <div class="mt-3 flex flex-wrap justify-center min-[420px]:justify-start gap-2">
          <input
            ref="fileInput"
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            class="hidden"
            @change="handleFileSelect"
          />
          <button type="button" :disabled="uploading" class="btn-secondary btn-sm" @click="triggerFileInput">
            <AppIcon icon="upload" class="w-4 h-4" />
            {{ uploading ? 'Uploading…' : currentAvatar ? 'Change photo' : 'Upload photo' }}
          </button>
          <button v-if="currentAvatar && !uploading" type="button" class="btn-danger-ghost btn-sm" @click="handleRemove">
            <AppIcon icon="trash" class="w-4 h-4" />
            Remove
          </button>
        </div>
      </div>
    </div>

    <p v-if="error" class="form-error mt-3 flex items-center gap-1.5" role="alert">
      <AppIcon icon="alert-circle" class="w-4 h-4 shrink-0" />{{ error }}
    </p>
    <p v-if="success" class="mt-3 text-sm font-medium text-success-text flex items-center gap-1.5" role="status">
      <AppIcon icon="check" class="w-4 h-4 shrink-0" />{{ success }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import api from '@/lib/axios'
import { useAuthStore } from '@/stores/auth'
import AppIcon from '@/components/ui/AppIcon.vue'

const props = defineProps<{
  currentAvatar?: string
}>()

const emit = defineEmits<{
  'update': [url: string | null]
}>()

const authStore = useAuthStore()
const fileInput = ref<HTMLInputElement | null>(null)
const previewUrl = ref<string | null>(null)
const uploading = ref(false)
const dragover = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)

const baseUrl = (() => {
  const u = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
  return u.replace(/\/api\/?$/, '')
})()

const currentAvatarUrl = computed(() => {
  if (!props.currentAvatar) return null
  if (props.currentAvatar.startsWith('http')) return props.currentAvatar
  const path = props.currentAvatar.startsWith('/') ? props.currentAvatar.slice(1) : props.currentAvatar
  return path.startsWith('storage/') ? `${baseUrl}/${path}` : `${baseUrl}/storage/${path}`
})

const displayAvatarUrl = computed(() => previewUrl.value || currentAvatarUrl.value)

function triggerFileInput() {
  fileInput.value?.click()
}

function validateFile(file: File): string | null {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!validTypes.includes(file.type)) {
    return 'Please select a valid image file (JPG, PNG, GIF, or WebP)'
  }
  const maxSize = 2 * 1024 * 1024
  if (file.size > maxSize) {
    return 'Image size must be less than 2MB'
  }
  return null
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    processFile(file)
  }
  target.value = ''
}

function handleDrop(event: DragEvent) {
  dragover.value = false
  const file = event.dataTransfer?.files[0]
  if (file) {
    processFile(file)
  }
}

async function processFile(file: File) {
  error.value = null
  success.value = null

  const validationError = validateFile(file)
  if (validationError) {
    error.value = validationError
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    previewUrl.value = e.target?.result as string
  }
  reader.readAsDataURL(file)

  await uploadFile(file)
}

async function uploadFile(file: File) {
  try {
    uploading.value = true
    error.value = null

    const formData = new FormData()
    formData.append('avatar', file)

    const response = await api.post('/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    if (response.data.success) {
      success.value = 'Photo updated.'
      const avatarUrl = response.data.avatar_url
      const path = (avatarUrl || '').replace(/^\/storage\//, '') || null
      emit('update', path || avatarUrl)

      if (authStore.user) {
        authStore.user.avatar = path || (authStore.user.avatar ?? null)
      }

      setTimeout(() => {
        previewUrl.value = null
        success.value = null
      }, 2000)
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to upload avatar'
    previewUrl.value = null
  } finally {
    uploading.value = false
  }
}

async function handleRemove() {
  if (!confirm('Are you sure you want to remove your profile picture?')) {
    return
  }

  try {
    uploading.value = true
    error.value = null

    const response = await api.delete('/profile/avatar')

    if (response.data.success) {
      success.value = 'Photo removed.'
      emit('update', null)
      previewUrl.value = null

      if (authStore.user) {
        authStore.user.avatar = undefined
      }

      setTimeout(() => {
        success.value = null
      }, 2000)
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to remove avatar'
  } finally {
    uploading.value = false
  }
}
</script>
