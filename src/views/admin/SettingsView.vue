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
            <FormField id="st-name" label="Name"><TextInput v-model="form.name" placeholder="Your name" autocomplete="name" /></FormField>
            <FormField id="st-email" label="Email"><TextInput v-model="form.email" type="email" prefix-icon="mail" placeholder="admin@example.com" autocomplete="email" /></FormField>
          </div>
        </section>

        <section class="card">
          <div class="card-header"><div><h2 class="card-title">Change password</h2><p class="card-subtitle">Leave blank to keep your current password.</p></div></div>
          <div class="card-body grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField id="st-cur" label="Current password" :required="!!form.password" class="sm:col-span-2">
              <PasswordInput v-model="form.current_password" placeholder="Required to set a new password" autocomplete="current-password" :required="!!form.password" toggle-name="current password" />
            </FormField>
            <FormField id="st-new" label="New password">
              <PasswordInput v-model="form.password" placeholder="New password" autocomplete="new-password" toggle-name="new password" />
            </FormField>
            <FormField id="st-conf" label="Confirm new password" :error="mismatch ? 'Passwords don\'t match yet.' : ''">
              <PasswordInput v-model="form.password_confirmation" placeholder="Repeat new password" autocomplete="new-password" toggle-name="password confirmation" />
            </FormField>
          </div>
        </section>

        <FormActions sticky submit :saving="saving" :error="errorMsg" :success="successMsg" />
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { FormField, TextInput, PasswordInput, FormActions } from '@/components/forms'
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
