<template>
  <div class="space-y-6">
    <header class="page-header !mb-0">
      <div>
        <h1 class="page-title">Store profile</h1>
        <p class="page-subtitle">Your personal info and the store details customers see.</p>
      </div>
      <div class="page-header-actions">
        <RouterLink to="/shop/landing" class="btn-secondary"><AppIcon icon="globe" class="w-4 h-4" />Public page</RouterLink>
      </div>
    </header>

    <div v-if="loading" class="grid grid-cols-1 lg:grid-cols-3 gap-6" aria-busy="true">
      <div class="skeleton h-72"></div>
      <div class="lg:col-span-2 skeleton h-96"></div>
    </div>

    <form v-else id="profile-form" @submit.prevent="save" class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <!-- Left: identity -->
      <aside class="space-y-6 lg:sticky lg:top-[calc(var(--topbar-height)+1.5rem)]">
        <section class="card">
          <div class="card-body text-center">
            <div class="mx-auto mb-4 w-24 h-24">
              <img v-if="avatarUrl" :src="avatarUrl" alt="Profile photo" class="rounded-full w-full h-full object-cover border border-line" />
              <div v-else class="avatar w-full h-full text-2xl">{{ initials }}</div>
            </div>
            <ProfileAvatarUpload :current-avatar="storeUserAvatar" @update="onAvatarUpdate" />
            <p class="mt-4 font-semibold text-ink">{{ form.name || 'Your name' }}</p>
            <p class="text-xs text-ink-muted">Store owner · {{ form.store_name || 'Store' }}</p>
            <span :class="statusBadgeClass(storeStatus)" class="mt-3 inline-flex">Store {{ statusLabel(storeStatus).toLowerCase() }}</span>
          </div>
          <div class="card-footer">
            <ul class="space-y-2 text-sm">
              <li class="flex items-center gap-2.5 min-w-0"><AppIcon icon="mail" class="w-4 h-4 text-ink-muted shrink-0" /><span class="truncate text-ink-secondary">{{ form.store_email || 'No email set' }}</span></li>
              <li class="flex items-center gap-2.5"><AppIcon icon="phone" class="w-4 h-4 text-ink-muted shrink-0" /><span class="text-ink-secondary">{{ form.store_phone || 'No phone set' }}</span></li>
              <li class="flex items-center gap-2.5"><AppIcon icon="map-pin" class="w-4 h-4 text-ink-muted shrink-0" /><span class="text-ink-secondary">{{ form.city ? `${form.city}${form.state ? ', ' + form.state : ''}` : 'No location set' }}</span></li>
            </ul>
          </div>
        </section>
      </aside>

      <!-- Right: form -->
      <div class="lg:col-span-2 space-y-6 min-w-0">
        <section class="card">
          <div class="card-header"><div><h2 class="card-title">Personal information</h2><p class="card-subtitle">Only used for your account.</p></div></div>
          <div class="card-body grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField id="pf-name" label="Full name"><TextInput v-model="form.name" placeholder="Your full name" autocomplete="name" /></FormField>
            <FormField id="pf-phone" label="Phone number"><PhoneInput v-model="form.phone" model-format="raw" placeholder="+92 300 0000000" /></FormField>
          </div>
        </section>

        <section class="card">
          <div class="card-header"><div><h2 class="card-title">Store details</h2><p class="card-subtitle">Shown on your public store page and venue listings.</p></div></div>
          <div class="card-body space-y-4">
            <FormField id="pf-store" label="Store name"><TextInput v-model="form.store_name" placeholder="My Venue Business" /></FormField>
            <FormField id="pf-desc" label="Description" :count="(form.description || '').length">
              <TextareaInput v-model="form.description" :rows="4" auto-grow placeholder="Describe your store and the kind of venues you offer…" />
            </FormField>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField id="pf-sphone" label="Store phone"><PhoneInput v-model="form.store_phone" model-format="raw" placeholder="+92 300 0000000" /></FormField>
              <FormField id="pf-semail" label="Store email"><TextInput v-model="form.store_email" type="email" prefix-icon="mail" placeholder="store@example.com" /></FormField>
            </div>
            <FormField id="pf-web" label="Website"><TextInput v-model="form.website" prefix="https://" placeholder="yourwebsite.com" /></FormField>
          </div>
        </section>

        <section class="card">
          <div class="card-header"><div><h2 class="card-title">Location</h2><p class="card-subtitle">Your business address.</p></div></div>
          <div class="card-body space-y-4">
            <FormField id="pf-addr" label="Street address"><TextInput v-model="form.address" prefix-icon="map-pin" placeholder="123 Main Street" autocomplete="street-address" /></FormField>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField id="pf-city" label="City"><TextInput v-model="form.city" placeholder="Lahore" autocomplete="address-level2" /></FormField>
              <FormField id="pf-state" label="State / province"><TextInput v-model="form.state" placeholder="Punjab" autocomplete="address-level1" /></FormField>
            </div>
          </div>
        </section>

        <FormActions sticky submit :saving="saving" :error="errorMsg" :success="successMsg" idle-text="Changes are saved when you press Save." />
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { FormField, TextInput, TextareaInput, PhoneInput, FormActions } from '@/components/forms'
import { ref, reactive, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { toast } from 'vue-sonner'
import api from '@/lib/axios'
import { useLiveRefresh } from '@/composables/useLiveRefresh'
import { statusBadgeClass, statusLabel } from '@/lib/status'
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

// What was last loaded, to tell whether the owner has started editing.
let loaded = ''
const snapshot = () => JSON.stringify(form)

async function load(opts: { quiet?: boolean } = {}) {
  const quiet = !!opts.quiet && !loading.value
  if (!quiet) loading.value = true
  try {
    const { data } = await api.get('/store/profile')
    const { user, store } = data.data
    authStore.user = { ...authStore.user!, ...user }
    if (store?.status) storeStatus.value = store.status
    // A background refresh never overwrites what the owner is typing.
    if (quiet && (saving.value || snapshot() !== loaded)) return
    form.name        = user.name  || ''
    form.phone       = user.phone || ''
    if (store) {
      form.store_name    = store.name        || ''
      form.description   = store.description || ''
      form.city          = store.city        || ''
      form.state         = store.state       || ''
      form.address       = store.address     || ''
      form.store_phone   = store.phone       || ''
      form.store_email   = store.email       || ''
      form.website       = (store.website || '').replace(/^https?:\/\//, '')
    }
    loaded = snapshot()
  } catch {
    // Quiet refresh failed: keep the form as it is.
  } finally {
    loading.value = false
  }
}

async function save() {
  if (saving.value) return
  saving.value     = true
  successMsg.value = ''
  errorMsg.value   = ''
  try {
    const payload = { ...form, website: form.website ? `https://${form.website.replace(/^https?:\/\//, '')}` : '' }
    const { data } = await api.put('/store/profile', payload)
    // Update what's shown (sidebar name, status) from the saved values; the form stays put.
    const { user, store } = data?.data ?? {}
    if (user && authStore.user) authStore.user = { ...authStore.user, ...user }
    if (store?.status) storeStatus.value = store.status
    loaded = snapshot()
    successMsg.value = 'Profile saved successfully!'
    toast.success('Profile saved.')
    setTimeout(() => (successMsg.value = ''), 3500)
  } catch (e: any) {
    errorMsg.value = e.response?.data?.message || 'Failed to save. Please try again.'
    toast.error(errorMsg.value)
    setTimeout(() => (errorMsg.value = ''), 4000)
  } finally {
    saving.value = false
  }
}

onMounted(() => load())

// Support approved or suspended the shop, or it was edited on another device.
useLiveRefresh(['store', 'user.'], () => { void load({ quiet: true }) }, 500)
</script>
