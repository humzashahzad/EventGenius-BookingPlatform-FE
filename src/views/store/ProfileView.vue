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
            <div>
              <label for="pf-name" class="form-label">Full name</label>
              <input id="pf-name" v-model="form.name" class="form-input" placeholder="Your full name" autocomplete="name" />
            </div>
            <div>
              <label for="pf-phone" class="form-label">Phone number</label>
              <input id="pf-phone" v-model="form.phone" class="form-input" placeholder="+92 300 0000000" autocomplete="tel" />
            </div>
          </div>
        </section>

        <section class="card">
          <div class="card-header"><div><h2 class="card-title">Store details</h2><p class="card-subtitle">Shown on your public store page and venue listings.</p></div></div>
          <div class="card-body space-y-4">
            <div>
              <label for="pf-store" class="form-label">Store name</label>
              <input id="pf-store" v-model="form.store_name" class="form-input" placeholder="My Venue Business" />
            </div>
            <div>
              <label for="pf-desc" class="form-label">Description</label>
              <textarea id="pf-desc" v-model="form.description" class="form-textarea" rows="4" placeholder="Describe your store and the kind of venues you offer…"></textarea>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label for="pf-sphone" class="form-label">Store phone</label>
                <input id="pf-sphone" v-model="form.store_phone" class="form-input" placeholder="+92 300 0000000" />
              </div>
              <div>
                <label for="pf-semail" class="form-label">Store email</label>
                <input id="pf-semail" v-model="form.store_email" type="email" class="form-input" placeholder="store@example.com" />
              </div>
            </div>
            <div>
              <label for="pf-web" class="form-label">Website</label>
              <div class="flex">
                <span class="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-line-strong/60 bg-surface-sunken text-ink-muted text-sm">https://</span>
                <input id="pf-web" v-model="form.website" class="form-input !rounded-l-none min-w-0" placeholder="yourwebsite.com" />
              </div>
            </div>
          </div>
        </section>

        <section class="card">
          <div class="card-header"><div><h2 class="card-title">Location</h2><p class="card-subtitle">Your business address.</p></div></div>
          <div class="card-body space-y-4">
            <div>
              <label for="pf-addr" class="form-label">Street address</label>
              <input id="pf-addr" v-model="form.address" class="form-input" placeholder="123 Main Street" autocomplete="street-address" />
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label for="pf-city" class="form-label">City</label>
                <input id="pf-city" v-model="form.city" class="form-input" placeholder="Lahore" />
              </div>
              <div>
                <label for="pf-state" class="form-label">State / province</label>
                <input id="pf-state" v-model="form.state" class="form-input" placeholder="Punjab" />
              </div>
            </div>
          </div>
        </section>

        <div class="save-bar">
          <div class="min-w-0 flex-1 text-sm" aria-live="polite">
            <p v-if="errorMsg" class="flex items-center gap-2 text-danger-text font-medium"><AppIcon icon="alert-circle" class="w-4 h-4 shrink-0" /><span class="truncate">{{ errorMsg }}</span></p>
            <p v-else-if="successMsg" class="flex items-center gap-2 text-success-text font-medium"><AppIcon icon="circle-check" class="w-4 h-4 shrink-0" /><span class="truncate">{{ successMsg }}</span></p>
            <p v-else class="text-ink-muted hidden sm:block">Changes are saved when you press Save.</p>
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
import { RouterLink } from 'vue-router'
import api from '@/lib/axios'
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
.save-bar {
  position: sticky; bottom: 0; z-index: var(--z-sticky);
  display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem 0.75rem;
  padding: 0.75rem 1rem;
  background-color: var(--surface); border: 1px solid var(--line);
  border-radius: var(--radius-lg); box-shadow: var(--shadow-lg);
}
</style>
