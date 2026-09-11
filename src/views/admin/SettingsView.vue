<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h1 class="page-title">Settings</h1>
        <p class="page-subtitle">Manage your admin account and profile picture.</p>
      </div>
      <button @click="save" :disabled="saving" class="btn-primary gap-2">
        <svg v-if="saving" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
        </svg>
        {{ saving ? 'Saving…' : 'Save Changes' }}
      </button>
    </div>

    <transition name="fade">
      <div v-if="successMsg" class="alert alert-success">
        <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        {{ successMsg }}
      </div>
    </transition>
    <transition name="fade">
      <div v-if="errorMsg" class="alert alert-danger">
        <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        {{ errorMsg }}
      </div>
    </transition>

    <div v-if="loading" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="skeleton h-64 rounded-xl"></div>
      <div class="skeleton h-64 rounded-xl lg:col-span-2"></div>
    </div>

    <form v-else @submit.prevent="save" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left: Avatar card -->
      <div class="space-y-5">
        <div class="card card-body flex flex-col items-center text-center gap-4">
          <div class="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-primary flex items-center justify-center shadow-glow flex-shrink-0">
            <img
              v-if="avatarUrl"
              :src="avatarUrl"
              alt="Profile"
              class="w-full h-full object-cover"
            />
            <span v-else class="text-white text-3xl font-bold select-none">{{ userInitials }}</span>
          </div>
          <ProfileAvatarUpload
            :current-avatar="authStore.user?.avatar"
            @update="onAvatarUpdate"
          />
          <div>
            <p class="text-base font-semibold text-surface-900">{{ form.name || 'Admin' }}</p>
            <p class="text-sm text-surface-500 mt-0.5">{{ form.email }}</p>
          </div>
          <div class="w-full pt-3 border-t border-surface-100">
            <span class="badge badge-primary">Admin</span>
          </div>
        </div>
      </div>

      <!-- Right: Account form -->
      <div class="lg:col-span-2 space-y-5">
        <div class="card card-body space-y-4">
          <div class="flex items-center gap-2 pb-3 border-b border-surface-100">
            <div class="w-7 h-7 rounded-lg bg-primary-100 flex items-center justify-center">
              <svg class="w-3.5 h-3.5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
            </div>
            <h2 class="text-sm font-semibold text-surface-800">Account</h2>
          </div>
          <div class="form-group">
            <label class="form-label">Name</label>
            <input v-model="form.name" type="text" class="form-input" placeholder="Your name" />
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input v-model="form.email" type="email" class="form-input" placeholder="admin@example.com" />
          </div>
        </div>

        <div class="card card-body space-y-4">
          <div class="flex items-center gap-2 pb-3 border-b border-surface-100">
            <div class="w-7 h-7 rounded-lg bg-warning-100 flex items-center justify-center">
              <svg class="w-3.5 h-3.5 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
            </div>
            <h2 class="text-sm font-semibold text-surface-800">Change Password</h2>
            <span class="text-xs text-surface-400 ml-auto">Leave blank to keep current</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">New Password</label>
              <input v-model="form.password" type="password" class="form-input" placeholder="New password" />
            </div>
            <div class="form-group">
              <label class="form-label">Confirm Password</label>
              <input v-model="form.password_confirmation" type="password" class="form-input" placeholder="Confirm" />
            </div>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import api from '@/lib/axios'
import { useAuthStore } from '@/stores/auth'
import ProfileAvatarUpload from '@/components/profile/AvatarUpload.vue'

const authStore = useAuthStore()
const loading = ref(true)
const saving = ref(false)
const successMsg = ref('')
const errorMsg = ref('')
const form = reactive({ name: '', email: '', password: '', password_confirmation: '' })

function getAvatarUrl(path: string | undefined): string | null {
  if (!path) return null
  const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/api\/?$/, '') || 'http://localhost:8000'
  const p = path.startsWith('/') ? path.slice(1) : path
  return p.startsWith('storage/') ? `${base}/${p}` : `${base}/storage/${p}`
}

const avatarUrl = computed(() => getAvatarUrl(authStore.user?.avatar))
const userInitials = computed(() => {
  const name = form.name || authStore.user?.name || ''
  return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'AD'
})

function onAvatarUpdate() {
  // Auth store updated by AvatarUpload
}

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/admin/profile')
    const user = data.data
    authStore.user = { ...authStore.user!, ...user }
    form.name = user.name || ''
    form.email = user.email || ''
  } catch {
    errorMsg.value = 'Failed to load profile.'
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  successMsg.value = ''
  errorMsg.value = ''
  try {
    const payload: Record<string, string> = { name: form.name, email: form.email }
    if (form.password) {
      payload.password = form.password
      payload.password_confirmation = form.password_confirmation
    }
    const { data } = await api.put('/admin/profile', payload)
    authStore.user = { ...authStore.user!, ...data.data }
    successMsg.value = 'Settings saved!'
    form.password = ''
    form.password_confirmation = ''
    setTimeout(() => (successMsg.value = ''), 3500)
  } catch (e: any) {
    errorMsg.value = e.response?.data?.message || 'Save failed.'
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
