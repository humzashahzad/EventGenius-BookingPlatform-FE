<template>
  <div class="booking-wizard-page">
    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="flex flex-col items-center gap-3">
        <svg class="w-8 h-8 animate-spin" style="color: var(--color-primary)" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        <span class="text-sm" style="color: var(--color-text-muted)">Loading venue...</span>
      </div>
    </div>

    <!-- Not found -->
    <div v-else-if="!venue" class="text-center py-20">
      <p class="text-lg font-semibold" style="color: var(--color-text)">Venue not found</p>
      <RouterLink to="/venues" class="btn-primary mt-4 inline-flex">Browse Venues</RouterLink>
    </div>

    <!-- Wizard -->
    <template v-else>
      <!-- Progress steps -->
      <div class="wizard-progress">
        <div
          v-for="(s, i) in steps"
          :key="i"
          class="wizard-step"
          :class="{ 'wizard-step--active': step === i, 'wizard-step--done': step > i }"
          @click="goToStep(i)"
        >
          <div class="wizard-step-num">
            <svg v-if="step > i" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
            </svg>
            <span v-else>{{ i + 1 }}</span>
          </div>
          <span class="wizard-step-label">{{ s }}</span>
        </div>
      </div>

      <!-- Step 1: Venue Summary -->
      <div v-if="step === 0" class="wizard-card">
        <h2 class="wizard-card-title">Venue Summary</h2>
        <div class="venue-summary">
          <div class="venue-summary-image">
            <img v-if="venueImage" :src="venueImage" :alt="venue.name" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full flex items-center justify-center" style="background: var(--color-bg-elevated); color: var(--color-text-muted)">
              <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
          </div>
          <div class="venue-summary-info">
            <h3 class="text-xl font-bold" style="color: var(--color-text)">{{ venue.name }}</h3>
            <p v-if="venue.location" class="text-sm mt-1" style="color: var(--color-text-secondary)">
              <svg class="w-4 h-4 inline -mt-0.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              {{ venue.location }}
            </p>
            <div class="flex flex-wrap gap-4 mt-4">
              <div class="venue-summary-stat">
                <span class="venue-summary-stat-label">Price</span>
                <span class="venue-summary-stat-value">PKR {{ formatPrice(venue) }}</span>
                <span class="venue-summary-stat-unit">per head</span>
              </div>
              <div class="venue-summary-stat">
                <span class="venue-summary-stat-label">Capacity</span>
                <span class="venue-summary-stat-value">{{ venue.capacity_min }}–{{ venue.capacity_max }}</span>
                <span class="venue-summary-stat-unit">guests</span>
              </div>
              <div v-if="venue.store?.name" class="venue-summary-stat">
                <span class="venue-summary-stat-label">Hosted by</span>
                <span class="venue-summary-stat-value">{{ venue.store.name }}</span>
              </div>
            </div>
            <p v-if="venue.description" class="text-sm mt-4 leading-relaxed" style="color: var(--color-text-secondary)">
              {{ venue.description?.substring(0, 200) }}{{ venue.description?.length > 200 ? '...' : '' }}
            </p>
          </div>
        </div>
        <div class="wizard-actions">
          <RouterLink :to="`/venues/${route.params.id}`" class="btn-ghost">Back to Venue</RouterLink>
          <button @click="step = 1" class="btn-primary">Continue to Date & Time</button>
        </div>
      </div>

      <!-- Step 2: Date & Time -->
      <div v-if="step === 1" class="wizard-card">
        <h2 class="wizard-card-title">Select Date & Time</h2>
        <p class="wizard-card-desc">Choose your event dates and times. Select multiple days for multi-day events.</p>
        <BookingCalendar
          :venue-id="venue.id"
          @update:selection="onCalendarUpdate"
        />
        <div v-if="calendarSlots.length > 0" class="selection-summary">
          <h4 class="text-sm font-semibold mb-2" style="color: var(--color-text)">Your Selection</h4>
          <div class="selection-summary-list">
            <div v-for="slot in calendarSlots" :key="slot.date" class="selection-summary-item">
              <span class="font-medium" style="color: var(--color-text)">{{ formatSlotDate(slot.date) }}</span>
              <span style="color: var(--color-primary)">{{ slot.start_time }} — {{ slot.end_time }}</span>
            </div>
          </div>
        </div>
        <div class="wizard-actions">
          <button @click="step = 0" class="btn-ghost">Back</button>
          <button @click="step = 2" :disabled="calendarSlots.length === 0" class="btn-primary">
            Continue to Event Details
          </button>
        </div>
      </div>

      <!-- Step 3: Event Details -->
      <div v-if="step === 2" class="wizard-card">
        <h2 class="wizard-card-title">Event Details</h2>
        <p class="wizard-card-desc">Tell us about your event so the venue can prepare accordingly.</p>
        <form @submit.prevent="step = 3" class="space-y-4">
          <div>
            <label class="form-label">Event Name *</label>
            <input v-model="booking.event_name" type="text" required class="form-input" placeholder="e.g. My Wedding Reception" />
          </div>
          <div>
            <label class="form-label">Event Type *</label>
            <select v-model="booking.event_type" required class="form-input">
              <option value="">Select type</option>
              <option v-for="cat in activeCategories" :key="cat.slug" :value="cat.slug">
                {{ cat.emoji }} {{ cat.name }}
              </option>
            </select>
          </div>
          <div>
            <label class="form-label">Expected Guests *</label>
            <input
              v-model.number="booking.expected_guests"
              type="number"
              required
              class="form-input"
              :min="venue.capacity_min || 1"
              :max="venue.capacity_max || 10000"
              :placeholder="`${venue.capacity_min || 1}–${venue.capacity_max || '∞'}`"
            />
            <p class="text-xs mt-1" style="color: var(--color-text-muted)">
              Venue capacity: {{ venue.capacity_min || 1 }} – {{ venue.capacity_max || 'unlimited' }}
            </p>
          </div>
          <div>
            <label class="form-label">Special Requirements</label>
            <textarea v-model="booking.special_requirements" class="form-input" rows="3" placeholder="Any special requests, equipment needs, dietary requirements..."></textarea>
          </div>
          <div class="wizard-actions">
            <button type="button" @click="step = 1" class="btn-ghost">Back</button>
            <button
              type="submit"
              :disabled="!booking.event_name || !booking.event_type || !booking.expected_guests"
              class="btn-primary"
            >
              Review Booking
            </button>
          </div>
        </form>
      </div>

      <!-- Step 4: Review & Confirm -->
      <div v-if="step === 3" class="wizard-card">
        <h2 class="wizard-card-title">Review & Confirm</h2>
        <p class="wizard-card-desc">Please review your booking details before confirming.</p>

        <div class="review-sections">
          <!-- Venue -->
          <div class="review-section">
            <h4 class="review-section-title">Venue</h4>
            <p class="review-value">{{ venue.name }}</p>
          </div>

          <!-- Dates & Times -->
          <div class="review-section">
            <h4 class="review-section-title">Date & Time</h4>
            <div v-for="slot in calendarSlots" :key="slot.date" class="review-slot">
              <span class="review-slot-date">{{ formatSlotDate(slot.date) }}</span>
              <span class="review-slot-time">{{ slot.start_time }} — {{ slot.end_time }}</span>
            </div>
          </div>

          <!-- Event -->
          <div class="review-section">
            <h4 class="review-section-title">Event Details</h4>
            <div class="review-grid">
              <div><span class="review-label">Name</span><span class="review-value">{{ booking.event_name }}</span></div>
              <div><span class="review-label">Type</span><span class="review-value">{{ booking.event_type }}</span></div>
              <div><span class="review-label">Guests</span><span class="review-value">{{ booking.expected_guests }}</span></div>
            </div>
            <div v-if="booking.special_requirements" class="mt-2">
              <span class="review-label">Requirements</span>
              <p class="review-value text-sm">{{ booking.special_requirements }}</p>
            </div>
          </div>

          <!-- Geolocation -->
          <div class="review-section">
            <h4 class="review-section-title">Location Verification</h4>
            <div v-if="coords.latitude !== Infinity" class="flex items-center gap-2 text-sm" style="color: var(--success-text)">
              <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Location captured (accuracy: {{ Math.round(coords.accuracy) }}m)
            </div>
            <div v-else-if="geoError" class="flex items-center gap-2 text-sm" style="color: var(--color-text-muted)">
              <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              Location unavailable — booking will proceed without it
            </div>
            <div v-else class="flex items-center gap-2 text-sm" style="color: var(--color-text-muted)">
              <svg class="w-4 h-4 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Acquiring location...
            </div>
          </div>

          <!-- Price estimate -->
          <div class="review-section review-section--highlight">
            <h4 class="review-section-title">Estimated Total</h4>
            <p class="text-2xl font-bold" style="color: var(--color-primary)">PKR {{ estimatedTotal }}</p>
            <p class="text-xs" style="color: var(--color-text-muted)">
              PKR {{ formatPrice(venue) }} / head × {{ booking.expected_guests }} guest{{ booking.expected_guests !== 1 ? 's' : '' }}
            </p>
          </div>
        </div>

        <!-- Errors -->
        <div v-if="submitError" class="mt-4 flex items-start gap-2.5 text-sm rounded-lg px-3.5 py-3" style="color: var(--danger-text); background: var(--danger-bg); border: 1px solid rgba(239,68,68,0.2);">
          <svg class="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          {{ submitError }}
        </div>

        <!-- Success -->
        <div v-if="submitSuccess" class="mt-4 flex items-start gap-2.5 text-sm rounded-lg px-3.5 py-3" style="color: var(--success-text); background: var(--success-bg); border: 1px solid rgba(34,197,94,0.2);">
          <svg class="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          Booking submitted successfully! Redirecting to your bookings...
        </div>

        <div class="wizard-actions">
          <button @click="step = 2" :disabled="submitting" class="btn-ghost">Back</button>
          <button @click="submitBooking" :disabled="submitting || submitSuccess" class="btn-primary gap-2">
            <svg v-if="submitting" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            {{ submitting ? 'Submitting...' : 'Confirm Booking' }}
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import api from '@/lib/axios'
import { useAuthStore } from '@/stores/auth'
import { useCategoriesStore } from '@/stores/categories'
import { getStorageUrl } from '@/lib/storageUrl'
import { useGeolocation } from '@vueuse/core'
import BookingCalendar from '@/components/booking/BookingCalendar.vue'
import type { SelectedDaySlot } from '@/components/booking/BookingCalendar.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const categoriesStore = useCategoriesStore()

const activeCategories = computed(() => categoriesStore.categories.filter(c => c.is_active))

const steps = ['Venue', 'Date & Time', 'Event Details', 'Review']
const step = ref(0)
const venue = ref<any>(null)
const loading = ref(true)
const calendarSlots = ref<SelectedDaySlot[]>([])
const submitting = ref(false)
const submitError = ref('')
const submitSuccess = ref(false)

// Geolocation — request when entering event details step
const { coords, error: geoError, resume: resumeGeo, pause: pauseGeo } = useGeolocation({
  enableHighAccuracy: true,
  immediate: false,
})
const geoRequested = ref(false)

watch(step, (s) => {
  if (s === 2 && !geoRequested.value) {
    geoRequested.value = true
    resumeGeo()
  }
})

const booking = reactive({
  event_name: '',
  event_type: '',
  expected_guests: 1,
  special_requirements: '',
})

const venueImage = computed(() => {
  const imgs = venue.value?.images || []
  const primary = imgs.find((i: any) => i.is_primary)
  const path = primary?.path || imgs[0]?.path || venue.value?.thumbnail
  return path ? getStorageUrl(path) : null
})

const estimatedTotal = computed(() => {
  const pricePerHead = venue.value?.price_per_head ?? 0
  const guests = booking.expected_guests || 1
  return Number(pricePerHead * guests).toLocaleString()
})

function formatPrice(v: any) {
  const price = v.price_per_head
  return price ? Number(price).toLocaleString() : 'Contact'
}

function formatSlotDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function goToStep(i: number) {
  if (i < step.value) step.value = i
}

function onCalendarUpdate(slots: SelectedDaySlot[]) {
  calendarSlots.value = slots
}

async function loadVenue() {
  loading.value = true
  try {
    const { data } = await api.get(`/venues/${route.params.id}`)
    venue.value = data.data
  } catch {
    venue.value = null
  } finally {
    loading.value = false
  }
}

async function submitBooking() {
  submitting.value = true
  submitError.value = ''
  submitSuccess.value = false

  // Use first slot as primary date for backward compatibility
  const primarySlot = calendarSlots.value[0]

  try {
    await api.post('/customer/bookings', {
      venue_id: venue.value.id,
      event_name: booking.event_name,
      event_type: booking.event_type,
      event_date: primarySlot.date,
      start_time: primarySlot.start_time,
      end_time: primarySlot.end_time,
      expected_guests: booking.expected_guests,
      special_requirements: booking.special_requirements,
      // Geolocation
      latitude: coords.value.latitude !== Infinity ? coords.value.latitude : null,
      longitude: coords.value.longitude !== Infinity ? coords.value.longitude : null,
      geo_accuracy: coords.value.accuracy !== Infinity ? coords.value.accuracy : null,
      // Send all slots for multi-day support
      slots: calendarSlots.value,
    })
    submitSuccess.value = true
    setTimeout(() => router.push('/customer/bookings'), 2000)
  } catch (e: any) {
    submitError.value = e.response?.data?.message || 'Booking failed. Please try again.'
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadVenue()
  categoriesStore.fetchCategories()
})
</script>

<style scoped>
.booking-wizard-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem 0;
}

/* Progress */
.wizard-progress {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-bottom: 1.5rem;
  padding: 0 0.5rem;
}

.wizard-step {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  cursor: default;
  position: relative;
}

.wizard-step + .wizard-step::before {
  content: '';
  position: absolute;
  left: -0.5rem;
  top: 50%;
  width: 0.5rem;
  height: 2px;
  background: var(--color-border);
}

.wizard-step--done + .wizard-step::before {
  background: var(--color-primary);
}

.wizard-step-num {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-text-muted);
  flex-shrink: 0;
  transition: all 0.2s;
}

.wizard-step--active .wizard-step-num {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: #1a1a00;
}

.wizard-step--done .wizard-step-num {
  border-color: var(--color-primary);
  background: rgba(245, 158, 11, 0.15);
  color: var(--color-primary);
}

.wizard-step--done {
  cursor: pointer;
}

.wizard-step-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.wizard-step--active .wizard-step-label {
  color: var(--color-text);
  font-weight: 600;
}

.wizard-step--done .wizard-step-label {
  color: var(--color-primary);
}

@media (max-width: 640px) {
  .wizard-step-label {
    display: none;
  }
}

/* Card */
.wizard-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.5rem;
}

.wizard-card-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 0.25rem;
}

.wizard-card-desc {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin-bottom: 1.25rem;
}

/* Actions */
.wizard-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--color-border);
}

/* Venue summary */
.venue-summary {
  display: flex;
  gap: 1.5rem;
  margin-top: 1rem;
}

@media (max-width: 640px) {
  .venue-summary {
    flex-direction: column;
  }
}

.venue-summary-image {
  width: 240px;
  min-width: 240px;
  height: 160px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .venue-summary-image {
    width: 100%;
    min-width: 0;
    height: 180px;
  }
}

.venue-summary-info {
  flex: 1;
  min-width: 0;
}

.venue-summary-stat {
  display: flex;
  flex-direction: column;
}

.venue-summary-stat-label {
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-muted);
}

.venue-summary-stat-value {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.2;
}

.venue-summary-stat-unit {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

/* Selection summary */
.selection-summary {
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(245, 158, 11, 0.05);
  border: 1px solid rgba(245, 158, 11, 0.15);
  border-radius: 8px;
}

.selection-summary-list {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.selection-summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
}

/* Review sections */
.review-sections {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}

.review-section {
  padding: 1rem;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
}

.review-section--highlight {
  background: rgba(245, 158, 11, 0.05);
  border-color: rgba(245, 158, 11, 0.2);
}

.review-section-title {
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-muted);
  margin-bottom: 0.5rem;
}

.review-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.5rem;
}

.review-label {
  display: block;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.review-value {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
}

.review-slot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.375rem 0;
}

.review-slot + .review-slot {
  border-top: 1px solid var(--color-border-light);
}

.review-slot-date {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
}

.review-slot-time {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-primary);
}
</style>
