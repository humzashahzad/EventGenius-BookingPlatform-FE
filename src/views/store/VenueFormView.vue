<template>
  <div class="page-container">

    <!-- Header -->
    <div class="page-header">
      <div class="flex items-center gap-3">
        <RouterLink :to="{ name: 'store-venues' }" class="btn-ghost btn-icon">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </RouterLink>
        <div>
          <h1 class="page-title">{{ isEdit ? 'Edit Venue' : 'Add New Venue' }}</h1>
          <p class="page-subtitle">{{ isEdit ? 'Update venue details and pricing.' : 'Create a new venue listing to attract clients.' }}</p>
        </div>
      </div>
      <button type="button" @click="save" :disabled="saving" class="btn-primary gap-2">
        <svg v-if="saving" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
        </svg>
        {{ saving ? 'Saving…' : isEdit ? 'Update Venue' : 'Create Venue' }}
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

    <form @submit.prevent="save" class="grid grid-cols-1 lg:grid-cols-3 gap-6">

      <!-- ── Main column ───────────────────────────────────────────── -->
      <div class="lg:col-span-2 space-y-5">

        <!-- Basic Info -->
        <div class="card card-body space-y-4">
          <div class="flex items-center gap-2 pb-3 border-b border-surface-100">
            <div class="w-7 h-7 rounded-lg bg-primary-100 flex items-center justify-center">
              <svg class="w-3.5 h-3.5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h2 class="text-sm font-semibold text-surface-800">Basic Information</h2>
          </div>
          <div class="form-group">
            <label class="form-label">Venue Name <span class="text-danger-500">*</span></label>
            <input v-model="form.name" required class="form-input" placeholder="e.g. Grand Marquee Hall" />
          </div>
          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea v-model="form.description" class="form-input" rows="4"
              placeholder="Describe your venue — features, ambience, what makes it unique…"></textarea>
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
            <label class="form-label">Street Address <span class="text-danger-500">*</span></label>
            <input v-model="form.address" required class="form-input" placeholder="123 Main Boulevard" />
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">City <span class="text-danger-500">*</span></label>
              <input v-model="form.city" required class="form-input" placeholder="Lahore" />
            </div>
            <div class="form-group">
              <label class="form-label">State / Province</label>
              <input v-model="form.state" class="form-input" placeholder="Punjab" />
            </div>
          </div>
        </div>

        <!-- Pricing -->
        <div class="card card-body space-y-4">
          <div class="flex items-center gap-2 pb-3 border-b border-surface-100">
            <div class="w-7 h-7 rounded-lg bg-success-100 flex items-center justify-center">
              <svg class="w-3.5 h-3.5 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h2 class="text-sm font-semibold text-surface-800">Pricing</h2>
          </div>

          <div class="form-group">
            <label class="form-label">Pricing Type <span class="text-danger-500">*</span></label>
            <select v-model="form.pricing_type" required class="form-input">
              <option value="per_hour">Per Hour</option>
              <option value="per_day">Per Day</option>
              <option value="per_event">Per Event</option>
              <option value="negotiable">Negotiable</option>
            </select>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="form-group">
              <label class="form-label">Per Hour (PKR)</label>
              <input v-model.number="form.price_per_hour" type="number" min="0" class="form-input" placeholder="0" />
            </div>
            <div class="form-group">
              <label class="form-label">Per Day (PKR)</label>
              <input v-model.number="form.price_per_day" type="number" min="0" class="form-input" placeholder="0" />
            </div>
            <div class="form-group">
              <label class="form-label">Per Event (PKR)</label>
              <input v-model.number="form.price_per_event" type="number" min="0" class="form-input" placeholder="0" />
            </div>
          </div>
        </div>

        <!-- Event Types -->
        <div class="card card-body space-y-4">
          <div class="flex items-center gap-2 pb-3 border-b border-surface-100">
            <div class="w-7 h-7 rounded-lg bg-info-100 flex items-center justify-center">
              <svg class="w-3.5 h-3.5 text-info-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
              </svg>
            </div>
            <h2 class="text-sm font-semibold text-surface-800">Event Types</h2>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <label
              v-for="et in eventTypes"
              :key="et.value"
              class="flex items-center gap-2.5 p-3 rounded-lg border-2 cursor-pointer transition-all duration-150 select-none"
              :class="form.event_types.includes(et.value)
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-surface-200 bg-white text-surface-600 hover:border-primary-300'"
            >
              <input type="checkbox" :value="et.value" v-model="form.event_types" class="sr-only" />
              <span class="text-lg">{{ et.emoji }}</span>
              <span class="text-xs font-medium">{{ et.label }}</span>
            </label>
          </div>
        </div>

      </div>

      <!-- ── Sidebar column ─────────────────────────────────────────── -->
      <div class="space-y-5">

        <!-- Capacity & Size -->
        <div class="card card-body space-y-4">
          <div class="flex items-center gap-2 pb-3 border-b border-surface-100">
            <div class="w-7 h-7 rounded-lg bg-secondary-100 flex items-center justify-center">
              <svg class="w-3.5 h-3.5 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>
            <h2 class="text-sm font-semibold text-surface-800">Capacity & Size</h2>
          </div>
          <div class="form-group">
            <label class="form-label">Min Capacity</label>
            <input v-model.number="form.capacity_min" type="number" min="1" class="form-input" placeholder="10" />
          </div>
          <div class="form-group">
            <label class="form-label">Max Capacity <span class="text-danger-500">*</span></label>
            <input v-model.number="form.capacity_max" required type="number" min="1" class="form-input" placeholder="500" />
          </div>
          <div class="form-group">
            <label class="form-label">Area (sq ft)</label>
            <input v-model.number="form.area_sqft" type="number" min="0" class="form-input" placeholder="2000" />
          </div>
          <div class="form-group">
            <label class="form-label">Number of Floors</label>
            <input v-model.number="form.floors" type="number" min="1" class="form-input" placeholder="1" />
          </div>
        </div>

        <!-- Status (edit only) -->
        <div v-if="isEdit" class="card card-body space-y-4">
          <div class="flex items-center gap-2 pb-3 border-b border-surface-100">
            <div class="w-7 h-7 rounded-lg bg-warning-100 flex items-center justify-center">
              <svg class="w-3.5 h-3.5 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
            </div>
            <h2 class="text-sm font-semibold text-surface-800">Visibility</h2>
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <select v-model="form.status" class="form-input">
              <option value="active">Active — visible to clients</option>
              <option value="inactive">Inactive — hidden from listings</option>
            </select>
          </div>
        </div>

        <!-- Gallery shortcut (edit only) -->
        <div v-if="isEdit" class="card card-body">
          <p class="text-sm font-medium text-surface-700 mb-3">Venue Gallery</p>
          <p class="text-xs text-surface-500 mb-4">Upload and manage photos that showcase your venue to potential clients.</p>
          <RouterLink :to="`/store/venues/${route.params.id}/gallery`" class="btn-primary-outline w-full gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            Manage Gallery
          </RouterLink>
        </div>

      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import api from '@/lib/axios'

const route  = useRoute()
const router = useRouter()

const saving     = ref(false)
const successMsg = ref('')
const errorMsg   = ref('')
const isEdit     = computed(() => !!route.params.id)

const eventTypes = [
  { value: 'wedding',    label: 'Wedding',    emoji: '💍' },
  { value: 'corporate',  label: 'Corporate',  emoji: '💼' },
  { value: 'birthday',   label: 'Birthday',   emoji: '🎂' },
  { value: 'film_shoot', label: 'Film Shoot', emoji: '🎬' },
  { value: 'concert',    label: 'Concert',    emoji: '🎵' },
  { value: 'exhibition', label: 'Exhibition', emoji: '🖼️' },
  { value: 'outdoor',    label: 'Outdoor',    emoji: '🌿' },
  { value: 'other',      label: 'Other',      emoji: '✨' },
]

const form = reactive({
  name: '', description: '', address: '', city: '', state: '',
  capacity_min: 1, capacity_max: 100, area_sqft: null as number | null,
  floors: 1, price_per_hour: null as number | null, price_per_day: null as number | null,
  price_per_event: null as number | null, pricing_type: 'per_hour',
  event_types: [] as string[], status: 'active',
})

async function load() {
  if (!isEdit.value) return
  try {
    const { data } = await api.get(`/store/venues/${route.params.id}`)
    Object.assign(form, data.data)
  } catch {
    errorMsg.value = 'Failed to load venue data.'
  }
}

async function save() {
  saving.value     = true
  successMsg.value = ''
  errorMsg.value   = ''
  try {
    if (isEdit.value) {
      await api.put(`/store/venues/${route.params.id}`, form)
      successMsg.value = 'Venue updated successfully!'
      setTimeout(() => (successMsg.value = ''), 3500)
    } else {
      const { data } = await api.post('/store/venues', form)
      successMsg.value = 'Venue created! Redirecting to gallery…'
      setTimeout(() => router.push(`/store/venues/${data.data.id}/gallery`), 1500)
    }
  } catch (e: any) {
    errorMsg.value = e.response?.data?.message || 'Save failed. Please check your inputs.'
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
