<template>
  <div class="max-w-[500px]">
    <div class="flex items-center gap-4 mb-5">
      <div class="relative w-[100px] h-[100px] rounded-full overflow-hidden flex-shrink-0 border-2 border-warm-200 dark:border-warm-700 shadow-card">
        <img v-if="displayAvatarUrl" :src="displayAvatarUrl" alt="Avatar preview" class="w-full h-full object-cover" />
        <div v-else class="w-full h-full flex items-center justify-center bg-warm-100 dark:bg-warm-800">
          <AppIcon icon="user" class="w-8 h-8 text-warm-400 dark:text-warm-500" />
        </div>

        <!-- Loading overlay -->
        <div v-if="uploading" class="absolute inset-0 flex items-center justify-center bg-warm-900/50 backdrop-blur-sm">
          <div class="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        </div>
      </div>

      <div>
        <p class="font-semibold text-warm-900 dark:text-warm-50 mb-1">Profile Picture</p>
        <p class="text-warm-500 dark:text-warm-400 text-sm">JPG, PNG or GIF. Max size 2MB.</p>
      </div>
    </div>

    <div class="flex gap-3 mb-5">
      <!-- File input (hidden) -->
      <input
        ref="fileInput"
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        @change="handleFileSelect"
        class="hidden"
      />

      <button @click="triggerFileInput" :disabled="uploading" class="btn-primary">
        <AppIcon icon="upload" class="w-4 h-4" />
        {{ uploading ? 'Uploading...' : 'Upload Photo' }}
      </button>

      <button v-if="currentAvatar && !uploading" @click="handleRemove" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-coral/30 text-coral font-semibold text-sm hover:bg-coral/10 transition-colors">
        <AppIcon icon="trash" class="w-4 h-4" />
        Remove
      </button>
    </div>

    <!-- Drag & Drop Area -->
    <div
      @dragover.prevent="dragover = true"
      @dragleave.prevent="dragover = false"
      @drop.prevent="handleDrop"
      class="border-2 border-dashed rounded-2xl text-center p-8 transition-colors"
      :class="dragover ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20' : 'border-warm-300 dark:border-warm-600 bg-warm-50 dark:bg-warm-800/50'"
    >
      <AppIcon icon="cloud-upload" class="w-10 h-10 text-warm-400 dark:text-warm-500 mb-3 block" />
      <p class="font-medium text-warm-700 dark:text-warm-300 mb-1">Drop your image here</p>
      <p class="text-warm-400 dark:text-warm-500 text-sm">or click "Upload Photo" above</p>
    </div>

    <!-- Error message -->
    <div v-if="error" class="flex items-center gap-3 mt-4 p-4 rounded-2xl bg-coral/10 text-coral border border-coral/20">
      <AppIcon icon="alert-circle" class="w-[18px] h-[18px]" />
      <span class="text-sm font-medium">{{ error }}</span>
    </div>

    <!-- Success message -->
    <div v-if="success" class="flex items-center gap-3 mt-4 p-4 rounded-2xl bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 border border-primary-200 dark:border-primary-800">
      <AppIcon icon="check" class="w-[18px] h-[18px]" />
      <span class="text-sm font-medium">{{ success }}</span>
    </div>
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
      success.value = 'Avatar uploaded successfully!'
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
      success.value = 'Avatar removed successfully!'
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
