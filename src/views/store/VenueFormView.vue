<template>
  <div class="content-container">
    <!-- Header -->
    <div class="page-header">
      <div class="flex items-center gap-3">
        <RouterLink :to="{ name: 'shop-venues' }" class="btn-ghost !p-2 rounded-xl">
          <AppIcon icon="chevron-left" class="w-5 h-5 text-warm-600 dark:text-warm-400" />
        </RouterLink>
        <div>
          <h1 class="text-2xl font-bold text-warm-900 dark:text-warm-50 tracking-tight">{{ isEdit ? 'Edit Venue' : 'Add New Venue' }}</h1>
          <p class="text-sm text-warm-500 dark:text-warm-400 mt-1">{{ isEdit ? 'Update venue details and pricing.' : 'Create a new venue listing to attract clients.' }}</p>
        </div>
      </div>
      <button type="button" @click="save" :disabled="saving" class="btn-primary gap-1.5">
        <AppIcon v-if="saving" icon="loader" class="w-4 h-4 animate-spin" />
        <AppIcon v-else icon="check" class="w-4 h-4" />
        {{ saving ? 'Saving...' : isEdit ? 'Update Venue' : 'Create Venue' }}
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

    <form @submit.prevent="save" class="grid grid-cols-1 lg:grid-cols-3 gap-6">

      <!-- Main column -->
      <div class="lg:col-span-2 space-y-6">

        <!-- Basic Info -->
        <div class="card">
          <div class="border-b border-warm-200 dark:border-warm-700 px-5 py-4 sm:px-6 flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <AppIcon icon="info" class="w-4 h-4 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 class="text-sm font-semibold text-warm-900 dark:text-warm-50">Basic Information</h2>
          </div>
          <div class="p-5 sm:p-6 space-y-4">
            <div>
              <label class="form-label">Venue Name <span class="text-coral">*</span></label>
              <input v-model="form.name" required class="form-input" placeholder="e.g. Grand Marquee Hall" />
            </div>
            <div>
              <label class="form-label">Description</label>
              <textarea v-model="form.description" class="form-input" rows="4" placeholder="Describe your venue — features, ambience, what makes it unique..."></textarea>
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
              <label class="form-label">Street Address <span class="text-coral">*</span></label>
              <input v-model="form.address" required class="form-input" placeholder="123 Main Boulevard" />
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="form-label">City <span class="text-coral">*</span></label>
                <input v-model="form.city" required class="form-input" placeholder="Lahore" />
              </div>
              <div>
                <label class="form-label">State / Province</label>
                <input v-model="form.state" class="form-input" placeholder="Punjab" />
              </div>
            </div>
          </div>
        </div>

        <!-- Pricing -->
        <div class="card">
          <div class="border-b border-warm-200 dark:border-warm-700 px-5 py-4 sm:px-6 flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <AppIcon icon="dollar-sign" class="w-4 h-4 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 class="text-sm font-semibold text-warm-900 dark:text-warm-50">Pricing</h2>
          </div>
          <div class="p-5 sm:p-6">
            <label class="form-label">Price Per Head (PKR) <span class="text-coral">*</span></label>
            <input v-model.number="form.price_per_head" type="number" min="0" step="0.01" required class="form-input" placeholder="e.g. 2500" />
            <p class="text-xs text-warm-500 dark:text-warm-400 mt-2">Total = Price per head x Number of guests</p>
          </div>
        </div>

        <!-- Event Types -->
        <div class="card">
          <div class="border-b border-warm-200 dark:border-warm-700 px-5 py-4 sm:px-6 flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <AppIcon icon="tags" class="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 class="text-sm font-semibold text-warm-900 dark:text-warm-50">Event Types</h2>
          </div>
          <div class="p-5 sm:p-6">
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <label
                v-for="et in eventTypes" :key="et.value"
                class="flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all duration-200"
                :class="form.event_types.includes(et.value)
                  ? 'border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/20 ring-1 ring-primary-200 dark:ring-primary-800'
                  : 'border-warm-200 dark:border-warm-700 hover:border-warm-300 dark:hover:border-warm-600'"
              >
                <input type="checkbox" :value="et.value" v-model="form.event_types" class="w-4 h-4 rounded border-warm-300 dark:border-warm-600 text-primary-600 focus:ring-primary-500" />
                <span class="text-sm">{{ et.emoji }}</span>
                <span class="text-xs font-medium text-warm-700 dark:text-warm-300">{{ et.label }}</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Operating Hours -->
        <div class="card">
          <div class="border-b border-warm-200 dark:border-warm-700 px-5 py-4 sm:px-6 flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <AppIcon icon="clock" class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 class="text-sm font-semibold text-warm-900 dark:text-warm-50">Operating Hours</h2>
          </div>
          <div class="p-5 sm:p-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="form-label">Opening Time</label>
                <select v-model="form.operating_start" class="form-select">
                  <option v-for="t in timeSlots" :key="t" :value="t">{{ t }}</option>
                </select>
              </div>
              <div>
                <label class="form-label">Closing Time</label>
                <select v-model="form.operating_end" class="form-select">
                  <option v-for="t in timeSlots" :key="t" :value="t">{{ t }}</option>
                </select>
              </div>
            </div>
            <p class="text-xs text-warm-500 dark:text-warm-400 mt-3">Customers will only be able to book slots within this time range. Use 24-hour format (e.g. 09:00 to 23:00).</p>
          </div>
        </div>

      </div>

      <!-- Sidebar column -->
      <div class="space-y-6">

        <!-- Capacity & Size -->
        <div class="card">
          <div class="border-b border-warm-200 dark:border-warm-700 px-5 py-4 sm:px-6 flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-warm-100 dark:bg-warm-800 flex items-center justify-center">
              <AppIcon icon="users" class="w-4 h-4 text-warm-600 dark:text-warm-400" />
            </div>
            <h2 class="text-sm font-semibold text-warm-900 dark:text-warm-50">Capacity & Size</h2>
          </div>
          <div class="p-5 sm:p-6 space-y-4">
            <div>
              <label class="form-label">Min Capacity</label>
              <input v-model.number="form.capacity_min" type="number" min="1" class="form-input" placeholder="10" />
            </div>
            <div>
              <label class="form-label">Max Capacity <span class="text-coral">*</span></label>
              <input v-model.number="form.capacity_max" required type="number" min="1" class="form-input" placeholder="500" />
            </div>
            <div>
              <label class="form-label">Area (sq ft)</label>
              <input v-model.number="form.area_sqft" type="number" min="0" class="form-input" placeholder="2000" />
            </div>
            <div>
              <label class="form-label">Number of Floors</label>
              <input v-model.number="form.floors" type="number" min="1" class="form-input" placeholder="1" />
            </div>
          </div>
        </div>

        <!-- Status (edit only) -->
        <div v-if="isEdit" class="card">
          <div class="border-b border-warm-200 dark:border-warm-700 px-5 py-4 sm:px-6 flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <AppIcon icon="shield" class="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 class="text-sm font-semibold text-warm-900 dark:text-warm-50">Visibility</h2>
          </div>
          <div class="p-5 sm:p-6">
            <label class="form-label">Status</label>
            <select v-model="form.status" class="form-select">
              <option value="active">Active — visible to clients</option>
              <option value="inactive">Inactive — hidden from listings</option>
            </select>
          </div>
        </div>

        <!-- Gallery shortcut (edit only) -->
        <div v-if="isEdit" class="card">
          <div class="p-5 sm:p-6">
            <p class="font-medium text-warm-900 dark:text-warm-50 text-sm">Venue Gallery</p>
            <p class="text-warm-500 dark:text-warm-400 text-xs mt-1 mb-4">Upload and manage photos that showcase your venue to potential clients.</p>
            <RouterLink :to="`/shop/venues/${route.params.id}/gallery`" class="btn-outline w-full gap-1.5 justify-center">
              <AppIcon icon="image" class="w-4 h-4" />
              Manage Gallery
            </RouterLink>
          </div>
        </div>

      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import api from '@/lib/axios'
import { useCategoriesStore } from '@/stores/categories'
import AppIcon from '@/components/ui/AppIcon.vue'

const route  = useRoute()
const router = useRouter()
const categoriesStore = useCategoriesStore()

const saving     = ref(false)
const successMsg = ref('')
const errorMsg   = ref('')
const isEdit     = computed(() => !!route.params.id)

const eventTypes = computed(() =>
  categoriesStore.categories
    .filter(c => c.is_active)
    .map(c => ({ value: c.slug, label: c.name, emoji: c.emoji }))
)

const form = reactive({
  name: '', description: '', address: '', city: '', state: '',
  capacity_min: 1, capacity_max: 100, area_sqft: null as number | null,
  floors: 1, price_per_head: null as number | null,
  event_types: [] as string[], status: 'active',
  operating_start: '00:00', operating_end: '23:00',
})

const timeSlots = computed(() => {
  const slots = []
  for (let h = 0; h < 24; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`)
  }
  slots.push('23:59')
  return slots
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
      successMsg.value = 'Venue created! Redirecting to gallery...'
      setTimeout(() => router.push(`/shop/venues/${data.data.id}/gallery`), 1500)
    }
  } catch (e: any) {
    errorMsg.value = extractErrorMessage(e)
    setTimeout(() => (errorMsg.value = ''), 4000)
  } finally {
    saving.value = false
  }
}

function extractErrorMessage(error: any): string {
  const response = error?.response?.data
  const fieldErrors = response?.errors

  if (fieldErrors && typeof fieldErrors === 'object') {
    const firstFieldError = Object.values(fieldErrors).flat().find(Boolean)
    if (typeof firstFieldError === 'string') {
      return firstFieldError
    }
  }

  const message = response?.message
  if (typeof message === 'string' && !message.includes('SQLSTATE[')) {
    return message
  }

  return 'Venue could not be saved. Please review the form and try again.'
}

onMounted(() => {
  load()
  categoriesStore.fetchCategories()
})
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
