<template>
  <div class="content-container">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="text-2xl font-bold text-warm-900 dark:text-warm-50 tracking-tight">Store Profile</h1>
        <p class="text-sm text-warm-500 dark:text-warm-400 mt-1">Manage your personal info and store details.</p>
      </div>
      <button @click="save" :disabled="saving" class="btn-primary gap-1.5">
        <AppIcon v-if="saving" icon="loader" class="w-4 h-4 animate-spin" />
        <AppIcon v-else icon="check" class="w-4 h-4" />
        {{ saving ? 'Saving...' : 'Save Changes' }}
      </button>
    </div>

    <!-- Alerts -->
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

    <!-- Skeleton -->
    <div v-if="loading" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="skeleton h-72 rounded-2xl"></div>
      <div class="lg:col-span-2 skeleton h-72 rounded-2xl"></div>
    </div>

    <form v-else @submit.prevent="save" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left: Avatar card -->
      <div class="space-y-6">
        <div class="card">
          <div class="p-5 sm:p-6 text-center">
            <div class="mx-auto mb-4 w-24 h-24">
              <img v-if="avatarUrl" :src="avatarUrl" alt="Profile" class="rounded-2xl w-full h-full object-cover shadow-soft" />
              <div v-else class="rounded-2xl w-full h-full flex items-center justify-center bg-primary-100 dark:bg-primary-900/30">
                <span class="text-2xl font-bold text-primary-600 dark:text-primary-400">{{ initials }}</span>
              </div>
            </div>
            <ProfileAvatarUpload :current-avatar="storeUserAvatar" @update="onAvatarUpdate" />
            <div class="mt-4">
              <h3 class="text-base font-semibold text-warm-900 dark:text-warm-50">{{ form.name || 'Your Name' }}</h3>
              <p class="text-warm-500 dark:text-warm-400 text-xs mt-1">Store Owner</p>
              <div class="mt-3">
                <span :class="storeStatusClass" class="capitalize">{{ storeStatus }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick info -->
        <div class="card">
          <div class="p-5 sm:p-6">
            <p class="text-[11px] font-semibold uppercase tracking-wider text-warm-500 dark:text-warm-400 mb-3">Quick Info</p>
            <div class="space-y-2.5">
              <div class="flex items-center gap-2.5">
                <AppIcon icon="mail" class="w-4 h-4 text-warm-400 dark:text-warm-500 flex-shrink-0" />
                <span class="text-sm text-warm-700 dark:text-warm-300 truncate">{{ form.store_email || 'No email set' }}</span>
              </div>
              <div class="flex items-center gap-2.5">
                <AppIcon icon="phone" class="w-4 h-4 text-warm-400 dark:text-warm-500 flex-shrink-0" />
                <span class="text-sm text-warm-700 dark:text-warm-300">{{ form.store_phone || 'No phone set' }}</span>
              </div>
              <div class="flex items-center gap-2.5">
                <AppIcon icon="map-pin" class="w-4 h-4 text-warm-400 dark:text-warm-500 flex-shrink-0" />
                <span class="text-sm text-warm-700 dark:text-warm-300">{{ form.city ? `${form.city}${form.state ? ', ' + form.state : ''}` : 'No location set' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Form sections -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Personal Info -->
        <div class="card">
          <div class="border-b border-warm-200 dark:border-warm-700 px-5 py-4 sm:px-6 flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <AppIcon icon="user" class="w-4 h-4 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 class="text-sm font-semibold text-warm-900 dark:text-warm-50">Personal Information</h2>
          </div>
          <div class="p-5 sm:p-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="form-label">Full Name</label>
                <input v-model="form.name" class="form-input" placeholder="Your full name" />
              </div>
              <div>
                <label class="form-label">Phone Number</label>
                <input v-model="form.phone" class="form-input" placeholder="+92 300 0000000" />
              </div>
            </div>
          </div>
        </div>

        <!-- Store Details -->
        <div class="card">
          <div class="border-b border-warm-200 dark:border-warm-700 px-5 py-4 sm:px-6 flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-warm-100 dark:bg-warm-800 flex items-center justify-center">
              <AppIcon icon="building" class="w-4 h-4 text-warm-600 dark:text-warm-400" />
            </div>
            <h2 class="text-sm font-semibold text-warm-900 dark:text-warm-50">Store Details</h2>
          </div>
          <div class="p-5 sm:p-6 space-y-4">
            <div>
              <label class="form-label">Store Name</label>
              <input v-model="form.store_name" class="form-input" placeholder="My Venue Business" />
            </div>
            <div>
              <label class="form-label">Description</label>
              <textarea v-model="form.description" class="form-input" rows="3" placeholder="Describe your store and the kind of venues you offer..."></textarea>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="form-label">Store Phone</label>
                <input v-model="form.store_phone" class="form-input" placeholder="+92 300 0000000" />
              </div>
              <div>
                <label class="form-label">Store Email</label>
                <input v-model="form.store_email" type="email" class="form-input" placeholder="store@example.com" />
              </div>
            </div>
            <div>
              <label class="form-label">Website</label>
              <div class="flex">
                <span class="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-warm-300 dark:border-warm-600 bg-warm-50 dark:bg-warm-800 text-warm-500 dark:text-warm-400 text-sm">https://</span>
                <input v-model="form.website" class="form-input !rounded-l-none" placeholder="yourwebsite.com" />
              </div>
            </div>
          </div>
        </div>

        <!-- Location -->
        <div class="card">
          <div class="border-b border-warm-200 dark:border-warm-700 px-5 py-4 sm:px-6 flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-accent/10 dark:bg-accent/20 flex items-center justify-center">
              <AppIcon icon="map-pin" class="w-4 h-4 text-accent" />
            </div>
            <h2 class="text-sm font-semibold text-warm-900 dark:text-warm-50">Location</h2>
          </div>
          <div class="p-5 sm:p-6 space-y-4">
            <div>
              <label class="form-label">Street Address</label>
              <input v-model="form.address" class="form-input" placeholder="123 Main Street" />
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="form-label">City</label>
                <input v-model="form.city" class="form-input" placeholder="Lahore" />
              </div>
              <div>
                <label class="form-label">State / Province</label>
                <input v-model="form.state" class="form-input" placeholder="Punjab" />
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
import ProfileAvatarUpload from '@/components/profile/AvatarUpload.vue'
import AppIcon from '@/components/ui/AppIcon.vue'

const authStore  = useAuthStore()
const loading    = ref(true)
const saving      = ref(false)
const successMsg  = ref('')
const errorMsg    = ref('')
const storeStatus = ref('pending')

const form = reactive({
  name: '', phone: '', store_name: '', description: '', city: '', state: '',
  address: '', store_phone: '', store_email: '', website: '',
})

const initials = computed(() => {
  const n = form.name || form.store_name || ''
  return n.split(' ').map((p: string) => p[0]).join('').toUpperCase().slice(0, 2) || 'EG'
})

function getAvatarUrl(path: string | undefined): string | null {
  if (!path) return null
  const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/api\/?$/, '') || 'http://localhost:8000'
  const p = path.startsWith('/') ? path.slice(1) : path
  return p.startsWith('storage/') ? `${base}/${p}` : `${base}/storage/${p}`
}
const storeUserAvatar = computed<string | undefined>(() => authStore.user?.avatar || undefined)
const avatarUrl = computed(() => getAvatarUrl(storeUserAvatar.value))

function onAvatarUpdate() {}

const storeStatusClass = computed(() => {
  const m: Record<string, string> = {
    approved: 'badge-primary',
    pending: 'badge-accent',
    suspended: 'badge-coral',
    rejected: 'badge-coral',
  }
  return m[storeStatus.value] || 'badge-warm'
})

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/store/profile')
    const { user, store } = data.data
    authStore.user = { ...authStore.user!, ...user }
    form.name        = user.name  || ''
    form.phone       = user.phone || ''
    if (store) {
      storeStatus.value  = store.status      || 'pending'
      form.store_name    = store.name        || ''
      form.description   = store.description || ''
      form.city          = store.city        || ''
      form.state         = store.state       || ''
      form.address       = store.address     || ''
      form.store_phone   = store.phone       || ''
      form.store_email   = store.email       || ''
      form.website       = (store.website || '').replace(/^https?:\/\//, '')
    }
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value     = true
  successMsg.value = ''
  errorMsg.value   = ''
  try {
    const payload = { ...form, website: form.website ? `https://${form.website.replace(/^https?:\/\//, '')}` : '' }
    await api.put('/store/profile', payload)
    successMsg.value = 'Profile saved successfully!'
    setTimeout(() => (successMsg.value = ''), 3500)
  } catch (e: any) {
    errorMsg.value = e.response?.data?.message || 'Failed to save. Please try again.'
    setTimeout(() => (errorMsg.value = ''), 4000)
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
