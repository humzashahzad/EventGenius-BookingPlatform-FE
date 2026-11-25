<template>
  <div class="space-y-6">
    <header class="page-header !mb-0">
      <div>
        <h1 class="page-title">My profile</h1>
        <p class="page-subtitle">Manage your personal details, photo and password.</p>
      </div>
    </header>

    <!-- Loading -->
    <div v-if="loading" class="grid grid-cols-1 lg:grid-cols-3 gap-6" aria-busy="true" aria-label="Loading profile">
      <div class="card h-64 skeleton"></div>
      <div class="lg:col-span-2 space-y-6"><div class="card h-72 skeleton"></div><div class="card h-64 skeleton"></div></div>
    </div>

    <div v-else-if="loadError" class="card">
      <div class="empty-state">
        <div class="empty-state-icon"><AppIcon icon="alert-triangle" class="w-5 h-5" /></div>
        <p class="empty-state-title">We couldn't load your profile</p>
        <p class="empty-state-desc">{{ loadError }}</p>
        <div class="empty-state-actions"><button type="button" class="btn-primary" @click="loadProfile"><AppIcon icon="refresh" class="w-4 h-4" />Try again</button></div>
      </div>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <!-- Summary -->
      <aside class="card lg:sticky lg:top-24">
        <div class="card-body flex flex-col items-center text-center">
          <div class="w-24 h-24 rounded-full overflow-hidden border border-line bg-brand-soft flex items-center justify-center">
            <img v-if="avatarUrl" :src="avatarUrl" alt="" class="w-full h-full object-cover" />
            <span v-else class="font-display text-3xl font-bold text-brand-text" aria-hidden="true">{{ userInitials }}</span>
          </div>
          <p class="mt-3 text-lg font-semibold text-ink break-words max-w-full">{{ saved.name || 'Your name' }}</p>
          <p class="text-sm text-ink-muted break-all">{{ saved.email }}</p>
          <span class="badge-confirmed mt-3">Customer account</span>
        </div>
        <dl class="border-t border-line px-5 py-2 text-sm">
          <div class="dl-row"><dt>Phone</dt><dd>{{ saved.phone || 'Not set' }}</dd></div>
          <div v-if="memberSince" class="dl-row"><dt>Member since</dt><dd>{{ memberSince }}</dd></div>
        </dl>
      </aside>

      <div class="lg:col-span-2 space-y-6 min-w-0">
        <!-- Personal info -->
        <section class="card" aria-labelledby="personal-title">
          <div class="card-header">
            <div>
              <h2 id="personal-title" class="card-title">Personal information</h2>
              <p class="card-subtitle">Venues see your name and phone on your bookings.</p>
            </div>
          </div>
          <form class="card-body space-y-5" novalidate @submit.prevent="savePersonal">
            <ProfileAvatarUpload :current-avatar="authStore.user?.avatar" @update="onAvatarUpdate" />

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FormField id="profile-name" label="Full name" required :error="personalErrors.name">
                <TextInput v-model="form.name" autocomplete="name" placeholder="Your full name" @blur="touched.name = true" />
              </FormField>
              <FormField id="profile-phone" label="Phone number" :error="personalErrors.phone" hint="For example 0300 1234567 or +92 300 1234567.">
                <PhoneInput v-model="form.phone" model-format="raw" placeholder="0300 1234567" @blur="touched.phone = true" />
              </FormField>
              <FormField id="profile-email" label="Email address" class="sm:col-span-2" hint="Your sign-in email can't be changed. Contact support if you need to update it.">
                <TextInput :model-value="form.email" type="email" disabled />
              </FormField>
            </div>

            <div v-if="personalMsg" :class="personalMsg.ok ? 'alert-success' : 'alert-danger'" role="status">
              <AppIcon :icon="personalMsg.ok ? 'circle-check' : 'alert-circle'" class="w-5 h-5 shrink-0" />
              <p>{{ personalMsg.text }}</p>
            </div>

            <div class="flex flex-wrap items-center gap-3 pt-1">
              <button type="submit" class="btn-primary" :disabled="savingPersonal || !personalDirty">
                <AppIcon :icon="savingPersonal ? 'loader' : 'check'" :class="savingPersonal ? 'w-4 h-4 animate-spin' : 'w-4 h-4'" />
                {{ savingPersonal ? 'Saving…' : 'Save changes' }}
              </button>
              <button v-if="personalDirty" type="button" class="btn-ghost" @click="resetPersonal">Discard</button>
              <span v-if="!personalDirty && !personalMsg" class="text-sm text-ink-muted">No unsaved changes</span>
            </div>
          </form>
        </section>

        <!-- Password -->
        <section class="card" aria-labelledby="password-title">
          <div class="card-header">
            <div>
              <h2 id="password-title" class="card-title">Change password</h2>
              <p class="card-subtitle">Use at least 8 characters with a mix of letters, numbers and symbols.</p>
            </div>
            <span class="icon-chip icon-chip-sm tone-neutral"><AppIcon icon="lock" class="w-4 h-4" /></span>
          </div>
          <form class="card-body space-y-5" novalidate @submit.prevent="savePassword">
            <!-- Hidden username helps password managers pair the new password with this account. -->
            <input type="text" name="username" :value="form.email" autocomplete="username" hidden readonly tabindex="-1" aria-hidden="true" />
            <PasswordField
              id="current-password"
              v-model="pw.current_password"
              label="Current password"
              autocomplete="current-password"
              :error="pwErrors.current_password"
              @blur="pwTouched.current = true"
            />
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <PasswordField
                id="new-password"
                v-model="pw.password"
                label="New password"
                autocomplete="new-password"
                :error="pwErrors.password"
                @blur="pwTouched.password = true"
              >
                <PasswordStrength :password="pw.password" />
              </PasswordField>
              <PasswordField
                id="confirm-password"
                v-model="pw.password_confirmation"
                label="Confirm new password"
                autocomplete="new-password"
                :error="pwErrors.password_confirmation"
                @blur="pwTouched.confirm = true"
              />
            </div>

            <div v-if="pwMsg" :class="pwMsg.ok ? 'alert-success' : 'alert-danger'" role="status">
              <AppIcon :icon="pwMsg.ok ? 'circle-check' : 'alert-circle'" class="w-5 h-5 shrink-0" />
              <p>{{ pwMsg.text }}</p>
            </div>

            <button type="submit" class="btn-primary" :disabled="savingPassword || !pw.password">
              <AppIcon :icon="savingPassword ? 'loader' : 'key'" :class="savingPassword ? 'w-4 h-4 animate-spin' : 'w-4 h-4'" />
              {{ savingPassword ? 'Updating…' : 'Update password' }}
            </button>
          </form>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { FormField, TextInput, PhoneInput } from '@/components/forms'
import { ref, reactive, computed, onMounted } from 'vue'
import api from '@/lib/axios'
import AppIcon from '@/components/ui/AppIcon.vue'
import { useAuthStore } from '@/stores/auth'
import ProfileAvatarUpload from '@/components/profile/AvatarUpload.vue'
import PasswordField from '@/components/auth/PasswordField.vue'
import PasswordStrength from '@/components/auth/PasswordStrength.vue'

const authStore = useAuthStore()

function getAvatarUrl(path: string | undefined): string | null {
  if (!path) return null
  if (path.startsWith('http')) return path
  const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/api\/?$/, '') || 'http://localhost:8000'
  const p = path.startsWith('/') ? path.slice(1) : path
  return p.startsWith('storage/') ? `${base}/${p}` : `${base}/storage/${p}`
}

const avatarUrl = computed(() => getAvatarUrl(authStore.user?.avatar))

function onAvatarUpdate(_urlOrPath: string | null) {
  // Auth store already updated by AvatarUpload
}

const loading = ref(true)
const loadError = ref('')
const createdAt = ref<string | null>(null)

const saved = reactive({ name: '', email: '', phone: '' })
const form = reactive({ name: '', email: '', phone: '' })
const touched = reactive({ name: false, phone: false })
const serverErrors = ref<Record<string, string[]>>({})
const savingPersonal = ref(false)
const personalMsg = ref<{ ok: boolean; text: string } | null>(null)

const pw = reactive({ current_password: '', password: '', password_confirmation: '' })
const pwTouched = reactive({ current: false, password: false, confirm: false, submit: false })
const pwServerErrors = ref<Record<string, string[]>>({})
const savingPassword = ref(false)
const pwMsg = ref<{ ok: boolean; text: string } | null>(null)

const userInitials = computed(() => {
  const name = saved.name || authStore.user?.name || ''
  return name.split(' ').filter(Boolean).map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'ME'
})
const memberSince = computed(() => createdAt.value ? new Date(createdAt.value).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : '')

const personalDirty = computed(() => form.name.trim() !== saved.name || form.phone.trim() !== saved.phone)

const PHONE_RE = /^\+?[0-9][0-9\s-]{8,16}$/
const personalErrors = computed(() => {
  const e: Record<string, string> = {}
  if (touched.name) {
    if (!form.name.trim()) e.name = 'Enter your full name.'
    else if (form.name.trim().length < 2) e.name = 'Name must be at least 2 characters.'
  }
  const phone = form.phone.trim()
  if (touched.phone && phone && phone !== saved.phone && !PHONE_RE.test(phone)) e.phone = 'Enter a valid phone number, e.g. 0300 1234567.'
  if (serverErrors.value.name) e.name = serverErrors.value.name[0]
  if (serverErrors.value.phone) e.phone = serverErrors.value.phone[0]
  return e
})

const pwErrors = computed(() => {
  const e: Record<string, string> = {}
  const t = pwTouched
  if ((t.current || t.submit) && pw.password && !pw.current_password) e.current_password = 'Enter your current password.'
  if ((t.password || t.submit) && pw.password && pw.password.length < 8) e.password = 'Use at least 8 characters.'
  if ((t.confirm || t.submit) && pw.password_confirmation !== pw.password) e.password_confirmation = "Passwords don't match."
  for (const k of ['current_password', 'password', 'password_confirmation']) {
    if (pwServerErrors.value[k]) e[k] = pwServerErrors.value[k][0]
  }
  return e
})

function resetPersonal() {
  form.name = saved.name
  form.phone = saved.phone
  touched.name = touched.phone = false
  serverErrors.value = {}
}

function applyUser(user: any) {
  saved.name = user?.name || ''
  saved.email = user?.email || ''
  saved.phone = user?.phone || ''
  form.name = saved.name
  form.email = saved.email
  form.phone = saved.phone
  createdAt.value = user?.created_at || createdAt.value
}

async function savePersonal() {
  touched.name = touched.phone = true
  serverErrors.value = {}
  personalMsg.value = null
  if (Object.keys(personalErrors.value).length) return
  savingPersonal.value = true
  try {
    const { data } = await api.put('/client/profile', { name: form.name.trim(), email: form.email, phone: form.phone.trim() })
    authStore.user = data.data
    applyUser(data.data)
    touched.name = touched.phone = false
    personalMsg.value = { ok: true, text: 'Your details were saved.' }
    setTimeout(() => { if (personalMsg.value?.ok) personalMsg.value = null }, 3500)
  } catch (e: any) {
    serverErrors.value = e.response?.data?.errors || {}
    personalMsg.value = { ok: false, text: e.response?.data?.message || 'Update failed. Please try again.' }
  } finally { savingPersonal.value = false }
}

async function savePassword() {
  pwTouched.submit = true
  pwServerErrors.value = {}
  pwMsg.value = null
  if (Object.keys(pwErrors.value).length) return
  savingPassword.value = true
  try {
    const { data } = await api.put('/client/profile', {
      name: saved.name,
      email: saved.email,
      phone: saved.phone,
      password: pw.password,
      password_confirmation: pw.password_confirmation,
      current_password: pw.current_password,
    })
    authStore.user = data.data
    pw.current_password = pw.password = pw.password_confirmation = ''
    Object.assign(pwTouched, { current: false, password: false, confirm: false, submit: false })
    pwMsg.value = { ok: true, text: 'Your password was updated.' }
    setTimeout(() => { if (pwMsg.value?.ok) pwMsg.value = null }, 3500)
  } catch (e: any) {
    pwServerErrors.value = e.response?.data?.errors || {}
    pwMsg.value = { ok: false, text: e.response?.data?.message || 'Could not update your password. Please try again.' }
  } finally { savingPassword.value = false }
}

async function loadProfile() {
  loading.value = true
  loadError.value = ''
  try {
    const { data } = await api.get('/client/profile')
    applyUser(data.data)
  } catch (e: any) {
    loadError.value = e?.response?.data?.message || 'Please check your connection and try again.'
  } finally { loading.value = false }
}

onMounted(loadProfile)
</script>
