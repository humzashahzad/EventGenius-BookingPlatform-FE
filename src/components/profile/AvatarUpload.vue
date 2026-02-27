<template>
  <div class="avatar-upload">
    <div class="avatar-preview">
      <div class="avatar-preview-circle">
        <img v-if="previewUrl || currentAvatar" :src="previewUrl || currentAvatar" alt="Avatar preview" />
        <div v-else class="avatar-placeholder">
          <svg class="w-12 h-12 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
          </svg>
        </div>

        <!-- Loading overlay -->
        <div v-if="uploading" class="avatar-loading-overlay">
          <div class="spinner"></div>
        </div>
      </div>

      <div class="avatar-info">
        <p class="avatar-info-title">Profile Picture</p>
        <p class="avatar-info-text">JPG, PNG or GIF. Max size 2MB.</p>
      </div>
    </div>

    <div class="avatar-actions">
      <!-- File input (hidden) -->
      <input
        ref="fileInput"
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        @change="handleFileSelect"
        class="hidden"
      />

      <!-- Upload button -->
      <button
        @click="triggerFileInput"
        :disabled="uploading"
        class="btn btn-primary"
      >
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
        {{ uploading ? 'Uploading...' : 'Upload Photo' }}
      </button>

      <!-- Remove button -->
      <button
        v-if="currentAvatar && !uploading"
        @click="handleRemove"
        class="btn btn-outline-danger"
      >
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>
        Remove
      </button>
    </div>

    <!-- Drag & Drop Area -->
    <div
      @dragover.prevent="dragover = true"
      @dragleave.prevent="dragover = false"
      @drop.prevent="handleDrop"
      :class="{ 'dragover': dragover }"
      class="avatar-dropzone"
    >
      <svg class="w-8 h-8 mb-2 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
      </svg>
      <p class="text-sm font-medium text-surface-700">Drop your image here</p>
      <p class="text-xs text-surface-500 mt-1">or click "Upload Photo" above</p>
    </div>

    <!-- Error message -->
    <div v-if="error" class="avatar-error">
      <svg class="w-5 h-5 text-danger-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      {{ error }}
    </div>

    <!-- Success message -->
    <div v-if="success" class="avatar-success">
      <svg class="w-5 h-5 text-success-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      {{ success }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import api from '@/lib/axios'
import { useAuthStore } from '@/stores/auth'

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

function triggerFileInput() {
  fileInput.value?.click()
}

function validateFile(file: File): string | null {
  // Check file type
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!validTypes.includes(file.type)) {
    return 'Please select a valid image file (JPG, PNG, GIF, or WebP)'
  }

  // Check file size (2MB max)
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

  // Validate file
  const validationError = validateFile(file)
  if (validationError) {
    error.value = validationError
    return
  }

  // Show preview
  const reader = new FileReader()
  reader.onload = (e) => {
    previewUrl.value = e.target?.result as string
  }
  reader.readAsDataURL(file)

  // Upload file
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
      // Backend stores path like "avatars/xxx"; avatar_url is "/storage/avatars/xxx"
      const path = (avatarUrl || '').replace(/^\/storage\//, '') || null
      emit('update', path || avatarUrl)

      // Update auth store with path so URL builders (base + /storage/ + path) work
      if (authStore.user) {
        authStore.user.avatar = path || (authStore.user.avatar ?? null)
      }

      // Clear preview after 2 seconds
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

      // Update auth store
      if (authStore.user) {
        authStore.user.avatar = null
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

<style scoped>
.avatar-upload {
  max-width: 500px;
}

.avatar-preview {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.avatar-preview-circle {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--color-bg-elevated, #f3f4f6);
  flex-shrink: 0;
  border: 3px solid var(--color-border, #e5e7eb);
}

.avatar-preview-circle img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-info-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary, #1f2937);
  margin-bottom: 4px;
}

.avatar-info-text {
  font-size: 13px;
  color: var(--color-text-secondary, #6b7280);
}

.avatar-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.avatar-dropzone {
  padding: 32px;
  border: 2px dashed var(--color-border, #e5e7eb);
  border-radius: 12px;
  text-align: center;
  transition: all 0.2s ease;
  background: var(--color-bg-elevated, #f9fafb);
  cursor: pointer;
}

.avatar-dropzone.dragover {
  border-color: var(--color-primary-500);
  background: var(--color-primary-50, #eff6ff);
}

.avatar-error,
.avatar-success {
  margin-top: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  font-size: 14px;
}

.avatar-error {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.avatar-success {
  background: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
