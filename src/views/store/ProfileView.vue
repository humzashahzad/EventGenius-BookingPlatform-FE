<template>
  <div class="page-container">

    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Store Profile</h1>
        <p class="page-subtitle">Manage your personal info and store details.</p>
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

    <!-- Alerts -->
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

    <!-- Skeleton -->
    <div v-if="loading" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="skeleton h-72 rounded-xl"></div>
      <div class="skeleton h-72 rounded-xl lg:col-span-2"></div>
    </div>

    <form v-else @submit.prevent="save" class="grid grid-cols-1 lg:grid-cols-3 gap-6">

      <!-- ── Left: Avatar card ─────────────────────────────────────── -->
      <div class="space-y-5">
        <div class="card card-body flex flex-col items-center text-center gap-4">
          <div class="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-primary flex items-center justify-center shadow-glow flex-shrink-0">
            <img
              v-if="avatarUrl"
              :src="avatarUrl"
              alt="Profile"
              class="w-full h-full object-cover"
            />
            <span v-else class="text-white text-3xl font-bold select-none">{{ initials }}</span>
          </div>
          <ProfileAvatarUpload
            :current-avatar="storeUserAvatar"
            @update="onAvatarUpdate"
          />
          <div>
            <p class="text-base font-semibold text-surface-900">{{ form.name || 'Your Name' }}</p>
            <p class="text-sm text-surface-500 mt-0.5">Store Owner</p>
          </div>
          <div class="w-full pt-3 border-t border-surface-100">
            <div class="flex items-center justify-between text-sm">
              <span class="text-surface-500">Store Status</span>
              <span :class="storeStatusClass">{{ storeStatus }}</span>
            </div>
          </div>
        </div>

        <!-- Quick info -->
        <div class="card card-body space-y-3">
          <p class="text-xs font-semibold uppercase tracking-wider text-surface-400">Quick Info</p>
          <div class="flex items-center gap-3 text-sm text-surface-600">
            <svg class="w-4 h-4 text-surface-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
            <span class="truncate text-xs">{{ form.store_email || 'No email set' }}</span>
          </div>
          <div class="flex items-center gap-3 text-sm text-surface-600">
            <svg class="w-4 h-4 text-surface-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
            </svg>
            <span class="text-xs">{{ form.store_phone || 'No phone set' }}</span>
          </div>
          <div class="flex items-center gap-3 text-sm text-surface-600">
            <svg class="w-4 h-4 text-surface-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <span class="text-xs">{{ form.city ? `${form.city}${form.state ? ', ' + form.state : ''}` : 'No location set' }}</span>
          </div>
        </div>
      </div>

      <!-- ── Right: Form sections ──────────────────────────────────── -->
      <div class="lg:col-span-2 space-y-5">

        <!-- Personal Info -->
        <div class="card card-body space-y-4">
          <div class="flex items-center gap-2 pb-3 border-b border-surface-100">
            <div class="w-7 h-7 rounded-lg bg-primary-100 flex items-center justify-center">
              <svg class="w-3.5 h-3.5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
            </div>
            <h2 class="text-sm font-semibold text-surface-800">Personal Information</h2>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">Full Name</label>
              <input v-model="form.name" class="form-input" placeholder="Your full name" />
            </div>
            <div class="form-group">
              <label class="form-label">Phone Number</label>
              <input v-model="form.phone" class="form-input" placeholder="+92 300 0000000" />
            </div>
          </div>
        </div>

        <!-- Store Details -->
        <div class="card card-body space-y-4">
          <div class="flex items-center gap-2 pb-3 border-b border-surface-100">
            <div class="w-7 h-7 rounded-lg bg-secondary-100 flex items-center justify-center">
              <svg class="w-3.5 h-3.5 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
            </div>
            <h2 class="text-sm font-semibold text-surface-800">Store Details</h2>
          </div>
          <div class="form-group">
            <label class="form-label">Store Name</label>
            <input v-model="form.store_name" class="form-input" placeholder="My Venue Business" />
          </div>
          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea v-model="form.description" class="form-input" rows="3"
              placeholder="Describe your store and the kind of venues you offer…"></textarea>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">Store Phone</label>
              <input v-model="form.store_phone" class="form-input" placeholder="+92 300 0000000" />
            </div>
            <div class="form-group">
              <label class="form-label">Store Email</label>
              <input v-model="form.store_email" type="email" class="form-input" placeholder="store@example.com" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Website</label>
            <div class="relative">
              <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 text-sm select-none">https://</span>
              <input v-model="form.website" class="form-input pl-[4.5rem]" placeholder="yourwebsite.com" />
            </div>
          </div>
        </div>

        <!-- Location -->
        <div class="card card-body space-y-4">
          <div class="flex items-center gap-2 pb-3 border-b border-surface-100">
            <div class="w-7 h-7 rounded-lg bg-accent-100 flex items-center justify-center">
              <svg class="w-3.5 h-3.5 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>
            <h2 class="text-sm font-semibold text-surface-800">Location</h2>
          </div>
          <div class="form-group">
            <label class="form-label">Street Address</label>
            <input v-model="form.address" class="form-input" placeholder="123 Main Street" />
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">City</label>
              <input v-model="form.city" class="form-input" placeholder="Lahore" />
            </div>
            <div class="form-group">
              <label class="form-label">State / Province</label>
              <input v-model="form.state" class="form-input" placeholder="Punjab" />
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
const avatarUrl = computed(() => getAvatarUrl(storeUserAvatar.value))
const storeUserAvatar = computed(() => authStore.user?.avatar ?? null)

function onAvatarUpdate() {
  // Auth store updated by AvatarUpload
}

const storeStatusClass = computed(() => {
  const m: Record<string, string> = { approved: 'badge badge-success', pending: 'badge badge-warning', suspended: 'badge badge-danger', rejected: 'badge badge-danger' }
  return `${m[storeStatus.value] || 'badge badge-gray'} capitalize`
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
