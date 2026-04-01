<template>
  <div class="booking-wizard-page font-['DM_Sans']">
    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-24">
      <div class="flex flex-col items-center gap-3">
        <div class="w-10 h-10 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
        <span class="text-sm text-warm-500">Loading venue...</span>
      </div>
    </div>

    <!-- Not found -->
    <div v-else-if="!venue" class="text-center py-24">
      <h5 class="font-semibold text-warm-800 dark:text-warm-200">Venue not found</h5>
      <RouterLink to="/venues" class="inline-flex items-center gap-2 mt-4 px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-soft hover:shadow-elevated">Browse Venues</RouterLink>
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
            <AppIcon v-if="step > i" icon="check" class="w-3.5 h-3.5" />
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
            <div v-else class="w-full h-full flex items-center justify-center bg-warm-100 dark:bg-warm-800">
              <AppIcon icon="image" class="w-12 h-12 text-[var(--color-text-muted)]" />
            </div>
          </div>
          <div class="venue-summary-info">
            <h3 class="text-lg font-bold text-warm-800 dark:text-warm-100">{{ venue.name }}</h3>
            <p v-if="venue.location" class="text-sm mt-1 text-warm-500">
              <AppIcon icon="map-pin" class="w-3.5 h-3.5 mr-1" />
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
            <p v-if="venue.description" class="text-sm mt-4 text-warm-500">
              {{ venue.description?.substring(0, 200) }}{{ venue.description?.length > 200 ? '...' : '' }}
            </p>
          </div>
        </div>
        <div class="wizard-actions">
          <RouterLink :to="`/venues/${route.params.id}`" class="wizard-btn-secondary">Back to Venue</RouterLink>
          <button @click="step = 1" class="wizard-btn-primary">Continue to Date & Time</button>
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
          <h4 class="text-sm font-semibold mb-2 text-warm-800 dark:text-warm-100">Your Selection</h4>
          <div class="selection-summary-list">
            <div v-for="slot in calendarSlots" :key="slot.date" class="selection-summary-item">
              <span class="font-medium text-warm-800 dark:text-warm-100">{{ formatSlotDate(slot.date) }}</span>
              <span class="text-primary-500 font-semibold">{{ slot.start_time }} — {{ slot.end_time }}</span>
            </div>
          </div>
        </div>
        <div class="wizard-actions">
          <button @click="step = 0" class="wizard-btn-secondary">Back</button>
          <button @click="step = 2" :disabled="calendarSlots.length === 0" class="wizard-btn-primary">
            Continue to Event Details
          </button>
        </div>
      </div>

      <!-- Step 3: Event Details -->
      <div v-if="step === 2" class="wizard-card">
        <h2 class="wizard-card-title">Event Details</h2>
        <p class="wizard-card-desc">Tell us about your event so the venue can prepare accordingly.</p>
        <form @submit.prevent="step = 3" class="flex flex-col gap-5">
          <div>
            <label class="form-label-warm">Event Name *</label>
            <input v-model="booking.event_name" type="text" required class="form-input-warm" placeholder="e.g. My Wedding Reception" />
          </div>
          <div>
            <label class="form-label-warm">Event Type *</label>
            <select v-model="booking.event_type" required class="form-input-warm">
              <option value="">Select type</option>
              <option v-for="cat in activeCategories" :key="cat.slug" :value="cat.slug">
                {{ cat.emoji }} {{ cat.name }}
              </option>
            </select>
          </div>
          <div>
            <label class="form-label-warm">Expected Guests *</label>
            <input
              v-model.number="booking.expected_guests"
              type="number"
              required
              class="form-input-warm"
              :min="venue.capacity_min || 1"
              :max="venue.capacity_max || 10000"
              :placeholder="`${venue.capacity_min || 1}–${venue.capacity_max || '∞'}`"
            />
            <p class="text-xs text-warm-400 mt-1.5">
              Venue capacity: {{ venue.capacity_min || 1 }} – {{ venue.capacity_max || 'unlimited' }}
            </p>
          </div>
          <div>
            <label class="form-label-warm">Special Requirements</label>
            <textarea v-model="booking.special_requirements" class="form-input-warm" rows="3" placeholder="Any special requests, equipment needs, dietary requirements..."></textarea>
          </div>
          <div class="wizard-actions">
            <button type="button" @click="step = 1" class="wizard-btn-secondary">Back</button>
            <button
              type="submit"
              :disabled="!booking.event_name || !booking.event_type || !booking.expected_guests"
              class="wizard-btn-primary"
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

          <!-- Price estimate -->
          <div class="review-section review-section--highlight">
            <h4 class="review-section-title">Estimated Total</h4>
            <p class="text-2xl font-bold text-primary-500 mb-1">PKR {{ estimatedTotal }}</p>
            <p class="text-sm text-warm-500 mb-0">
              PKR {{ formatPrice(venue) }} / head x {{ booking.expected_guests }} guest{{ booking.expected_guests !== 1 ? 's' : '' }}
            </p>
          </div>
        </div>

        <!-- Errors -->
        <div v-if="submitError" class="alert-error mt-4">
          <AppIcon icon="alert-triangle" class="w-4 h-4 flex-shrink-0 mt-0.5" />
          {{ submitError }}
        </div>

        <!-- Success -->
        <div v-if="submitSuccess" class="alert-success mt-4">
          <AppIcon icon="circle-check" class="w-4 h-4 flex-shrink-0 mt-0.5" />
          Booking submitted successfully! Redirecting to your bookings...
        </div>

        <div class="wizard-actions">
          <button @click="step = 2" :disabled="submitting" class="wizard-btn-secondary">Back</button>
          <button @click="submitBooking" :disabled="submitting || submitSuccess" class="wizard-btn-primary inline-flex items-center gap-2">
            <span v-if="submitting" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            {{ submitting ? 'Submitting...' : 'Confirm Booking' }}
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import api from '@/lib/axios'
import { useCategoriesStore } from '@/stores/categories'
import { getStorageUrl } from '@/lib/storageUrl'
import BookingCalendar from '@/components/booking/BookingCalendar.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import type { SelectedDaySlot } from '@/components/booking/BookingCalendar.vue'

const route = useRoute()
const router = useRouter()
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
    await api.post('/client/bookings', {
      venue_id: venue.value.id,
      event_name: booking.event_name,
      event_type: booking.event_type,
      event_date: primarySlot.date,
      start_time: primarySlot.start_time,
      end_time: primarySlot.end_time,
      expected_guests: booking.expected_guests,
      special_requirements: booking.special_requirements,
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
  background: var(--color-border-light);
  transition: background 0.2s ease;
}

.wizard-step--done + .wizard-step::before {
  background: #10B981;
}

.wizard-step-num {
  width: 28px;
  height: 28px;
  border-radius: 9999px;
  border: 2px solid var(--color-border-light);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-text-muted);
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.wizard-step--active .wizard-step-num {
  border-color: #10B981;
  background: #10B981;
  color: #fff;
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.15);
}

.wizard-step--done .wizard-step-num {
  border-color: #10B981;
  background: #ECFDF5;
  color: #10B981;
}

:root.dark .wizard-step--done .wizard-step-num {
  background: rgba(16, 185, 129, 0.15);
  color: #34D399;
}

.wizard-step--done {
  cursor: pointer;
}

.wizard-step-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-muted);
  white-space: nowrap;
  transition: color 0.15s ease;
}

.wizard-step--active .wizard-step-label {
  color: var(--color-text);
  font-weight: 600;
}

.wizard-step--done .wizard-step-label {
  color: #10B981;
}

@media (max-width: 640px) {
  .wizard-step-label {
    display: none;
  }

  .wizard-card {
    padding: 1rem;
  }

  .wizard-card-title {
    font-size: 1.125rem;
  }

  .wizard-actions {
    margin-top: 1.25rem;
    padding-top: 1rem;
  }

  .booking-wizard-page {
    padding: 0.75rem 0;
  }
}

/* Card */
.wizard-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-light);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: var(--shadow-card, 0 2px 8px rgba(0,0,0,0.06));
}

.wizard-card-title {
  font-family: 'DM Sans', sans-serif;
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
  border-top: 1px solid var(--color-border-light);
}

/* Buttons */
.wizard-btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.5rem;
  background: #10B981;
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
  border-radius: 0.75rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25);
}

.wizard-btn-primary:hover {
  background: #059669;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.35);
  transform: translateY(-1px);
}

.wizard-btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.wizard-btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.5rem;
  background: var(--color-bg);
  color: var(--color-text-secondary);
  font-weight: 600;
  font-size: 0.875rem;
  border-radius: 0.75rem;
  border: 1px solid var(--color-border-light);
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s ease;
}

.wizard-btn-secondary:hover {
  border-color: var(--color-border);
  background: var(--color-bg-hover);
  box-shadow: var(--shadow-soft, 0 1px 3px rgba(0,0,0,0.06));
}

/* Form controls */
.form-label-warm {
  display: block;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 0.375rem;
}

.form-input-warm {
  width: 100%;
  padding: 0.625rem 0.875rem;
  background: var(--color-bg);
  border: 1px solid var(--color-border-light);
  border-radius: 0.75rem;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.875rem;
  color: var(--color-text);
  transition: all 0.2s ease;
  outline: none;
}

.form-input-warm:focus {
  border-color: #10B981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
}

.form-input-warm::placeholder {
  color: var(--color-text-muted);
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
  border-radius: 0.75rem;
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
  background: #ECFDF5;
  border: 1px solid #A7F3D0;
  border-radius: 0.75rem;
}

:root.dark .selection-summary {
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.25);
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
  border: 1px solid var(--color-border-light);
  border-radius: 0.75rem;
}

.review-section--highlight {
  background: #ECFDF5;
  border-color: #A7F3D0;
}

:root.dark .review-section--highlight {
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.25);
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
  color: #10B981;
}

/* Alerts */
.alert-error {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.875rem 1rem;
  border-radius: 0.75rem;
  background: rgba(249, 112, 102, 0.1);
  color: #F97066;
  font-size: 0.875rem;
  border: 1px solid rgba(249, 112, 102, 0.2);
}

.alert-success {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.875rem 1rem;
  border-radius: 0.75rem;
  background: rgba(16, 185, 129, 0.1);
  color: #10B981;
  font-size: 0.875rem;
  border: 1px solid rgba(16, 185, 129, 0.2);
}
</style>
