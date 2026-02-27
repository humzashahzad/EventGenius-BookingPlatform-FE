<template>
  <div class="client-page">
    <nav class="client-breadcrumb">
      <RouterLink to="/customer/bookings">Dashboard</RouterLink>
      <span class="client-breadcrumb-sep">›</span>
      <span>My Profile</span>
    </nav>

    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-xl font-bold text-surface-800">My Profile</h1>
        <p class="text-sm text-surface-500 mt-0.5">Manage your personal information and account security.</p>
      </div>
      <button @click="saveProfile" :disabled="saving" class="client-btn-primary inline-flex items-center gap-2">
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
      <div v-if="successMsg" class="mb-4 p-4 rounded-xl bg-success-50 text-success-700 text-sm flex items-center gap-2">
        <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        {{ successMsg }}
      </div>
    </transition>
    <transition name="fade">
      <div v-if="errorMsg" class="mb-4 p-4 rounded-xl bg-danger-50 text-danger-700 text-sm flex items-center gap-2">
        <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        {{ errorMsg }}
      </div>
    </transition>

    <form @submit.prevent="saveProfile" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="space-y-5">
        <div class="client-card">
          <div class="client-card-body flex flex-col items-center text-center gap-4">
          <div class="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0 shadow-lg">
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
            <p class="text-base font-semibold text-surface-800">{{ form.name || 'Your Name' }}</p>
            <p class="text-sm text-surface-500 mt-0.5">{{ form.email || authStore.user?.email }}</p>
          </div>
          <div class="w-full pt-3 border-t border-surface-200">
            <div class="flex items-center justify-between text-sm">
              <span class="text-surface-500">Account Type</span>
              <span class="px-2.5 py-1 rounded-lg bg-primary-100 text-primary-700 text-xs font-medium capitalize">{{ authStore.user?.role?.replace('_', ' ') || 'Client' }}</span>
            </div>
          </div>
          </div>
        </div>

        <div class="client-card">
          <div class="client-card-body space-y-3">
          <p class="text-xs font-semibold uppercase tracking-wider text-surface-400">Quick Info</p>
          <div class="flex items-center gap-3 text-sm text-surface-600">
            <svg class="w-4 h-4 text-surface-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
            <span class="truncate text-xs">{{ form.email || 'No email' }}</span>
          </div>
          <div class="flex items-center gap-3 text-sm text-surface-600">
            <svg class="w-4 h-4 text-surface-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
            </svg>
            <span class="text-xs">{{ form.phone || 'No phone set' }}</span>
          </div>
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
              <input v-model="form.name" type="text" class="form-input" placeholder="Your full name" />
            </div>
            <div class="form-group">
              <label class="form-label">Phone Number</label>
              <input v-model="form.phone" type="tel" class="form-input" placeholder="+92 300 0000000" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Email Address</label>
            <input v-model="form.email" type="email" class="form-input" placeholder="your@email.com" />
          </div>
        </div>

        <!-- Change Password -->
        <div class="card card-body space-y-4">
          <div class="flex items-center gap-2 pb-3 border-b border-surface-100">
            <div class="w-7 h-7 rounded-lg bg-warning-100 flex items-center justify-center">
              <svg class="w-3.5 h-3.5 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
            </div>
            <h2 class="text-sm font-semibold text-surface-800">Change Password</h2>
            <span class="text-xs text-surface-400 ml-auto">Leave blank to keep current password</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">New Password</label>
              <input v-model="form.password" type="password" class="form-input" placeholder="Enter new password" />
            </div>
            <div class="form-group">
              <label class="form-label">Confirm Password</label>
              <input v-model="form.password_confirmation" type="password" class="form-input" placeholder="Repeat new password" />
            </div>
          </div>
          <!-- Password strength indicator -->
          <div v-if="form.password" class="space-y-1.5">
            <div class="flex items-center justify-between text-xs">
              <span class="text-surface-500">Password strength</span>
              <span :class="passwordStrength.color" class="font-medium">{{ passwordStrength.label }}</span>
            </div>
            <div class="progress-bar">
              <div
                class="progress-bar-fill transition-all"
                :class="passwordStrength.barColor"
                :style="{ width: passwordStrength.percent + '%' }"
              ></div>
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

function getAvatarUrl(path: string | undefined): string | null {
  if (!path) return null
  const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/api\/?$/, '') || 'http://localhost:8000'
  const p = path.startsWith('/') ? path.slice(1) : path
  return p.startsWith('storage/') ? `${base}/${p}` : `${base}/storage/${p}`
}

const avatarUrl = computed(() => getAvatarUrl(authStore.user?.avatar))

function onAvatarUpdate(_urlOrPath: string | null) {
  // Auth store already updated by AvatarUpload; path is in authStore.user.avatar
}
const saving = ref(false)
const successMsg = ref('')
const errorMsg = ref('')

const form = reactive({ name: '', email: '', phone: '', password: '', password_confirmation: '' })

const userInitials = computed(() => {
  const name = form.name || authStore.user?.name || ''
  return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'ME'
})

const passwordStrength = computed(() => {
  const p = form.password
  if (!p) return { label: '', color: '', barColor: '', percent: 0 }
  let score = 0
  if (p.length >= 8)  score++
  if (p.length >= 12) score++
  if (/[A-Z]/.test(p)) score++
  if (/[0-9]/.test(p)) score++
  if (/[^A-Za-z0-9]/.test(p)) score++
  if (score <= 1) return { label: 'Weak', color: 'text-danger-500', barColor: 'bg-danger-400', percent: 20 }
  if (score <= 2) return { label: 'Fair', color: 'text-warning-500', barColor: 'bg-warning-400', percent: 45 }
  if (score <= 3) return { label: 'Good', color: 'text-info-600', barColor: 'bg-info-500', percent: 65 }
  return { label: 'Strong', color: 'text-success-600', barColor: 'bg-success-500', percent: 100 }
})

async function saveProfile() {
  saving.value = true
  successMsg.value = ''
  errorMsg.value = ''
  try {
    const payload: any = { name: form.name, email: form.email, phone: form.phone }
    if (form.password) {
      payload.password = form.password
      payload.password_confirmation = form.password_confirmation
    }
    const { data } = await api.put('/client/profile', payload)
    authStore.user = data.data
    successMsg.value = 'Profile updated successfully!'
    form.password = ''
    form.password_confirmation = ''
    setTimeout(() => (successMsg.value = ''), 3500)
  } catch (e: any) {
    errorMsg.value = e.response?.data?.message || 'Update failed. Please try again.'
    setTimeout(() => (errorMsg.value = ''), 4000)
  } finally { saving.value = false }
}

onMounted(async () => {
  const { data } = await api.get('/client/profile')
  const user = data.data
  form.name  = user.name
  form.email = user.email
  form.phone = user.phone || ''
})
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
