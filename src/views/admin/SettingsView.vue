<template>
  <div class="content-container">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-warm-900 dark:text-warm-50">Settings</h1>
        <p class="text-warm-500 dark:text-warm-400 mt-1">Manage your admin account and profile picture.</p>
      </div>
      <button @click="save" :disabled="saving" class="btn-primary inline-flex items-center gap-1.5">
        <AppIcon v-if="saving" icon="loader" class="w-4 h-4 animate-spin" />
        <AppIcon v-else icon="check" class="w-4 h-4" />
        {{ saving ? 'Saving...' : 'Save Changes' }}
      </button>
    </div>

    <!-- Alerts -->
    <transition name="fade">
      <div v-if="successMsg" class="rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-3 mb-6 flex items-center gap-2.5">
        <AppIcon icon="circle-check" class="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <span class="text-sm text-emerald-700 dark:text-emerald-300">{{ successMsg }}</span>
      </div>
    </transition>
    <transition name="fade">
      <div v-if="errorMsg" class="rounded-2xl bg-coral/5 dark:bg-coral/10 border border-coral/20 px-4 py-3 mb-6 flex items-center gap-2.5">
        <AppIcon icon="alert-circle" class="w-5 h-5 text-coral flex-shrink-0" />
        <span class="text-sm text-coral">{{ errorMsg }}</span>
      </div>
    </transition>

    <!-- Loading skeleton -->
    <div v-if="loading" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="h-64 rounded-2xl bg-warm-200 dark:bg-warm-800 animate-pulse"></div>
      <div class="lg:col-span-2 h-64 rounded-2xl bg-warm-200 dark:bg-warm-800 animate-pulse"></div>
    </div>

    <!-- Form -->
    <form v-else @submit.prevent="save" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left: Avatar card -->
      <div class="lg:col-span-1">
        <div class="card p-6 text-center">
          <div class="mx-auto mb-4 w-24 h-24">
            <img v-if="avatarUrl" :src="avatarUrl" alt="Profile" class="rounded-2xl w-full h-full object-cover shadow-card" />
            <div v-else class="rounded-2xl w-full h-full flex items-center justify-center bg-primary-50 dark:bg-primary-900/30">
              <span class="text-3xl font-bold text-primary-600 dark:text-primary-400">{{ userInitials }}</span>
            </div>
          </div>
          <ProfileAvatarUpload :current-avatar="authStore.user?.avatar" @update="onAvatarUpdate" />
          <div class="mt-5">
            <h5 class="text-lg font-semibold text-warm-900 dark:text-warm-50 mb-1">{{ form.name || 'Admin' }}</h5>
            <p class="text-sm text-warm-500 dark:text-warm-400 mb-3">{{ form.email }}</p>
            <span class="badge-primary">Admin</span>
          </div>
        </div>
      </div>

      <!-- Right: Account form -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Account info -->
        <div class="card">
          <div class="px-6 py-4 border-b border-warm-100 dark:border-warm-800 flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
              <AppIcon icon="user" class="w-4 h-4 text-primary-600 dark:text-primary-400" />
            </div>
            <h5 class="text-base font-semibold text-warm-900 dark:text-warm-50">Account</h5>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label class="form-label">Name</label>
                <input v-model="form.name" type="text" class="form-input" placeholder="Your name" />
              </div>
              <div>
                <label class="form-label">Email</label>
                <input v-model="form.email" type="email" class="form-input" placeholder="admin@example.com" />
              </div>
            </div>
          </div>
        </div>

        <!-- Change Password -->
        <div class="card">
          <div class="px-6 py-4 border-b border-warm-100 dark:border-warm-800 flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
                <AppIcon icon="lock" class="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <h5 class="text-base font-semibold text-warm-900 dark:text-warm-50">Change Password</h5>
            </div>
            <span class="text-xs text-warm-400 dark:text-warm-500">Leave blank to keep current</span>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label class="form-label">New Password</label>
                <input v-model="form.password" type="password" class="form-input" placeholder="New password" />
              </div>
              <div>
                <label class="form-label">Confirm Password</label>
                <input v-model="form.password_confirmation" type="password" class="form-input" placeholder="Confirm" />
              </div>
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
import AppIcon from '@/components/ui/AppIcon.vue'
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
