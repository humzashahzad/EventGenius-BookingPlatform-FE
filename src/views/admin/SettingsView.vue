<template>
  <div class="space-y-6">
    <header class="page-header !mb-0">
      <div>
        <h1 class="page-title">Settings</h1>
        <p class="page-subtitle">Your support account, profile picture and password.</p>
      </div>
    </header>

    <div v-if="loading" class="grid grid-cols-1 lg:grid-cols-3 gap-6" aria-busy="true">
      <div class="skeleton h-64"></div>
      <div class="lg:col-span-2 skeleton h-80"></div>
    </div>

    <form v-else @submit.prevent="save" class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <aside class="card lg:sticky lg:top-[calc(var(--topbar-height)+1.5rem)]">
        <div class="card-body text-center">
          <div class="mx-auto mb-4 w-24 h-24">
            <img v-if="avatarUrl" :src="avatarUrl" alt="Profile photo" class="rounded-full w-full h-full object-cover border border-line" />
            <div v-else class="avatar w-full h-full text-2xl">{{ userInitials }}</div>
          </div>
          <ProfileAvatarUpload :current-avatar="authStore.user?.avatar" @update="onAvatarUpdate" />
          <p class="mt-4 font-semibold text-ink">{{ form.name || 'Admin' }}</p>
          <p class="text-sm text-ink-muted truncate">{{ form.email }}</p>
          <span class="badge-info mt-3 inline-flex">Support team</span>
        </div>
      </aside>

      <div class="lg:col-span-2 space-y-6 min-w-0">
        <section class="card">
          <div class="card-header"><div><h2 class="card-title">Account</h2><p class="card-subtitle">Name and sign-in email.</p></div></div>
          <div class="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="st-name" class="form-label">Name</label>
              <input id="st-name" v-model="form.name" type="text" class="form-input" placeholder="Your name" autocomplete="name" />
            </div>
            <div>
              <label for="st-email" class="form-label">Email</label>
              <input id="st-email" v-model="form.email" type="email" class="form-input" placeholder="admin@example.com" autocomplete="email" />
            </div>
          </div>
        </section>

        <section class="card">
          <div class="card-header"><div><h2 class="card-title">Change password</h2><p class="card-subtitle">Leave blank to keep your current password.</p></div></div>
          <div class="card-body grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="sm:col-span-2">
              <label for="st-cur" class="form-label">Current password <span v-if="form.password" class="req">*</span></label>
              <input id="st-cur" v-model="form.current_password" type="password" class="form-input" placeholder="Required to set a new password" autocomplete="current-password" :required="!!form.password" />
            </div>
            <div>
              <label for="st-new" class="form-label">New password</label>
              <input id="st-new" v-model="form.password" type="password" class="form-input" placeholder="New password" autocomplete="new-password" />
            </div>
            <div>
              <label for="st-conf" class="form-label">Confirm new password</label>
              <input id="st-conf" v-model="form.password_confirmation" type="password" class="form-input" placeholder="Repeat new password" autocomplete="new-password" :aria-invalid="mismatch" />
              <p v-if="mismatch" class="form-error">Passwords don't match yet.</p>
            </div>
          </div>
        </section>

        <div class="save-bar">
          <div class="min-w-0 flex-1 text-sm" aria-live="polite">
            <p v-if="errorMsg" class="flex items-center gap-2 text-danger-text font-medium"><AppIcon icon="alert-circle" class="w-4 h-4 shrink-0" /><span class="truncate">{{ errorMsg }}</span></p>
            <p v-else-if="successMsg" class="flex items-center gap-2 text-success-text font-medium"><AppIcon icon="circle-check" class="w-4 h-4 shrink-0" /><span class="truncate">{{ successMsg }}</span></p>
          </div>
          <button type="submit" :disabled="saving" class="btn-primary">
            <AppIcon :icon="saving ? 'loader' : 'check'" :class="saving ? 'w-4 h-4 animate-spin' : 'w-4 h-4'" />
            {{ saving ? 'Saving…' : 'Save changes' }}
          </button>
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
const form = reactive({ name: '', email: '', password: '', password_confirmation: '', current_password: '' })

function getAvatarUrl(path: string | undefined): string | null {
  if (!path) return null
  const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/api\/?$/, '') || 'http://localhost:8000'
  const p = path.startsWith('/') ? path.slice(1) : path
  return p.startsWith('storage/') ? `${base}/${p}` : `${base}/storage/${p}`
}

const mismatch = computed(() => !!form.password_confirmation && form.password !== form.password_confirmation)
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
      payload.current_password = form.current_password
    }
    const { data } = await api.put('/admin/profile', payload)
    authStore.user = { ...authStore.user!, ...data.data }
    successMsg.value = 'Settings saved!'
    form.password = ''
    form.password_confirmation = ''
    form.current_password = ''
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
.save-bar {
  position: sticky; bottom: 0; z-index: var(--z-sticky);
  display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem 0.75rem;
  padding: 0.75rem 1rem;
  background-color: var(--surface); border: 1px solid var(--line);
  border-radius: var(--radius-lg); box-shadow: var(--shadow-lg);
}
</style>
