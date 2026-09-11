<template>
  <div class="content-container">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <h1 class="text-2xl font-bold text-warm-900 tracking-tight">My Profile</h1>
        <p class="text-sm text-warm-500 mt-1">Manage your personal information and account security.</p>
      </div>
      <button @click="saveProfile" :disabled="saving" class="btn-primary inline-flex items-center gap-2">
        <AppIcon v-if="saving" icon="loader" class="w-4 h-4 animate-spin" />
        <AppIcon v-else icon="check" class="w-4 h-4" />
        {{ saving ? 'Saving...' : 'Save Changes' }}
      </button>
    </div>

    <!-- Alerts -->
    <transition name="fade">
      <div v-if="successMsg" class="flex items-center gap-3 px-5 py-3 rounded-2xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800/30 mb-6">
        <AppIcon icon="circle-check" class="w-5 h-5 text-primary-600 flex-shrink-0" />
        <span class="text-sm font-medium text-primary-700 dark:text-primary-400">{{ successMsg }}</span>
      </div>
    </transition>
    <transition name="fade">
      <div v-if="errorMsg" class="flex items-center gap-3 px-5 py-3 rounded-2xl bg-coral/10 border border-coral/20 mb-6">
        <AppIcon icon="alert-circle" class="w-5 h-5 text-coral flex-shrink-0" />
        <span class="text-sm font-medium text-coral">{{ errorMsg }}</span>
      </div>
    </transition>

    <form @submit.prevent="saveProfile" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Left: Avatar card -->
      <div class="lg:col-span-1 space-y-6">
        <div class="card">
          <div class="p-6 text-center">
            <div class="mx-auto mb-4 w-24 h-24">
              <img v-if="avatarUrl" :src="avatarUrl" alt="Profile" class="rounded-2xl w-full h-full object-cover shadow-soft" />
              <div v-else class="rounded-2xl w-full h-full flex items-center justify-center bg-primary-100 dark:bg-primary-900/30">
                <span class="text-3xl font-bold text-primary-600">{{ userInitials }}</span>
              </div>
            </div>
            <ProfileAvatarUpload :current-avatar="authStore.user?.avatar" @update="onAvatarUpdate" />
            <div class="mt-4">
              <h3 class="text-lg font-semibold text-warm-900 mb-1">{{ form.name || 'Your Name' }}</h3>
              <p class="text-sm text-warm-500 mb-3">{{ form.email || authStore.user?.email }}</p>
              <span class="badge-primary capitalize">{{ authStore.user?.role?.replace('_', ' ') || 'Client' }}</span>
            </div>
          </div>
        </div>

        <!-- Quick Info -->
        <div class="card">
          <div class="p-5">
            <p class="text-xs font-semibold uppercase text-warm-400 tracking-wider mb-4">Quick Info</p>
            <div class="space-y-3">
              <div class="flex items-center gap-3">
                <AppIcon icon="mail" class="w-4 h-4 text-warm-400 flex-shrink-0" />
                <span class="text-sm text-warm-700 truncate">{{ form.email || 'No email' }}</span>
              </div>
              <div class="flex items-center gap-3">
                <AppIcon icon="phone" class="w-4 h-4 text-warm-400 flex-shrink-0" />
                <span class="text-sm text-warm-700">{{ form.phone || 'No phone set' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Form sections -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Personal Info -->
        <div class="card">
          <div class="flex items-center gap-3 px-5 py-4 border-b border-warm-100 dark:border-warm-700">
            <div class="w-8 h-8 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <AppIcon icon="user" class="w-4 h-4 text-primary-600" />
            </div>
            <h2 class="text-sm font-semibold text-warm-800">Personal Information</h2>
          </div>
          <div class="p-5">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label class="form-label">Full Name</label>
                <input v-model="form.name" type="text" class="form-input" placeholder="Your full name" />
              </div>
              <div>
                <label class="form-label">Phone Number</label>
                <input v-model="form.phone" type="tel" class="form-input" placeholder="+92 300 0000000" />
              </div>
              <div class="sm:col-span-2">
                <label class="form-label">Email Address</label>
                <input :value="form.email" type="email" class="form-input bg-warm-100 dark:bg-warm-700 cursor-not-allowed opacity-70" disabled placeholder="your@email.com" />
                <p class="text-xs text-warm-400 dark:text-warm-500 mt-1">Email cannot be changed.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Change Password -->
        <div class="card">
          <div class="flex items-center justify-between px-5 py-4 border-b border-warm-100 dark:border-warm-700">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center">
                <AppIcon icon="lock" class="w-4 h-4 text-accent" />
              </div>
              <h2 class="text-sm font-semibold text-warm-800">Change Password</h2>
            </div>
            <span class="text-xs text-warm-400">Leave blank to keep current password</span>
          </div>
          <div class="p-5">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label class="form-label">New Password</label>
                <input v-model="form.password" type="password" class="form-input" placeholder="Enter new password" />
              </div>
              <div>
                <label class="form-label">Confirm Password</label>
                <input v-model="form.password_confirmation" type="password" class="form-input" placeholder="Repeat new password" />
              </div>
            </div>
            <!-- Password strength -->
            <div v-if="form.password" class="mt-4">
              <div class="flex items-center justify-between text-xs mb-1.5">
                <span class="text-warm-500">Password strength</span>
                <span :class="passwordStrength.color" class="font-medium">{{ passwordStrength.label }}</span>
              </div>
              <div class="h-1.5 bg-warm-100 rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all duration-300" :class="passwordStrength.barColor" :style="{ width: passwordStrength.percent + '%' }"></div>
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
import AppIcon from '@/components/ui/AppIcon.vue'
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
  // Auth store already updated by AvatarUpload
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
  if (score <= 1) return { label: 'Weak', color: 'text-coral', barColor: 'bg-coral', percent: 20 }
  if (score <= 2) return { label: 'Fair', color: 'text-accent', barColor: 'bg-accent', percent: 45 }
  if (score <= 3) return { label: 'Good', color: 'text-primary-500', barColor: 'bg-primary-500', percent: 65 }
  return { label: 'Strong', color: 'text-primary-600', barColor: 'bg-primary-600', percent: 100 }
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
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
