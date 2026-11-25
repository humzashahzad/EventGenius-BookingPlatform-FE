<template>
  <div class="booking-page">
    <!-- Loading -->
    <div v-if="loading" aria-busy="true" aria-label="Loading venue">
      <div class="skeleton h-3 w-32"></div>
      <div class="skeleton mt-3 h-7 w-72 max-w-full"></div>
      <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div class="skeleton h-96 !rounded-xl"></div>
        <div class="skeleton h-80 !rounded-xl hidden lg:block"></div>
      </div>
    </div>

    <!-- Not found -->
    <div v-else-if="!venue" class="card">
      <div class="empty-state">
        <div class="empty-state-icon"><AppIcon icon="building-store" class="w-5 h-5" /></div>
        <p class="empty-state-title">Venue not found</p>
        <p class="empty-state-desc">This venue may have been removed, or the link is incorrect.</p>
        <div class="empty-state-actions"><RouterLink to="/venues" class="btn-primary">Browse venues</RouterLink></div>
      </div>
    </div>

    <template v-else>
      <header class="page-header">
        <div class="min-w-0">
          <p class="page-eyebrow">Book a venue</p>
          <h1 class="page-title truncate">{{ venue.name }}</h1>
          <p class="page-subtitle">Send a booking request. The owner confirms before you pay anything.</p>
        </div>
        <div class="page-header-actions">
          <RouterLink :to="`/venues/${route.params.id}`" class="btn-secondary"><AppIcon icon="arrow-left" class="w-4 h-4" />Venue page</RouterLink>
        </div>
      </header>

      <!-- Progress -->
      <ol class="stepper" aria-label="Booking steps">
        <li
          v-for="(s, i) in steps"
          :key="i"
          class="stepper-item"
          :class="{ 'is-active': step === i, 'is-done': step > i }"
          :aria-current="step === i ? 'step' : undefined"
        >
          <button type="button" class="stepper-btn" :disabled="i >= step" @click="goToStep(i)">
            <span class="stepper-num">
              <AppIcon v-if="step > i" icon="check" class="w-3.5 h-3.5" />
              <span v-else>{{ i + 1 }}</span>
            </span>
            <span class="stepper-label">{{ s }}</span>
          </button>
        </li>
      </ol>
      <p class="mb-4 text-sm text-ink-secondary sm:hidden">Step {{ step + 1 }} of {{ steps.length }} · <span class="font-semibold text-ink">{{ steps[step] }}</span></p>

      <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div class="min-w-0">
          <!-- Step 1: Venue Summary -->
          <section v-if="step === 0" class="card" aria-labelledby="step-title">
            <div class="card-header">
              <div><h2 id="step-title" class="card-title">Venue summary</h2><p class="card-subtitle">Check this is the right venue before you choose a date.</p></div>
            </div>
            <div class="card-body">
              <div class="flex flex-col gap-5 sm:flex-row">
                <div class="aspect-[4/3] w-full shrink-0 overflow-hidden rounded-lg bg-surface-sunken sm:w-56">
                  <img v-if="venueImage" :src="venueImage" :alt="venue.name" class="h-full w-full object-cover" />
                  <div v-else class="flex h-full w-full items-center justify-center text-ink-muted"><AppIcon icon="image" class="w-8 h-8" /></div>
                </div>
                <div class="min-w-0 flex-1">
                  <h3 class="heading-3">{{ venue.name }}</h3>
                  <p v-if="venue.location" class="mt-1 flex items-start gap-1.5 text-sm text-ink-muted">
                    <AppIcon icon="map-pin" class="mt-0.5 w-4 h-4 shrink-0" />{{ venue.location }}
                  </p>
                  <dl class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <div class="panel-sunken px-3 py-2.5">
                      <dt class="text-xs text-ink-muted">Price</dt>
                      <dd class="text-sm font-semibold text-ink num">PKR {{ formatPrice(venue) }} <span class="font-normal text-ink-muted">/ head</span></dd>
                    </div>
                    <div class="panel-sunken px-3 py-2.5">
                      <dt class="text-xs text-ink-muted">Capacity</dt>
                      <dd class="text-sm font-semibold text-ink num">{{ venue.capacity_min }}–{{ venue.capacity_max }} <span class="font-normal text-ink-muted">guests</span></dd>
                    </div>
                    <div v-if="venue.store?.name" class="panel-sunken px-3 py-2.5 col-span-2 sm:col-span-1 min-w-0">
                      <dt class="text-xs text-ink-muted">Hosted by</dt>
                      <dd class="truncate text-sm font-semibold text-ink">{{ venue.store.name }}</dd>
                    </div>
                  </dl>
                  <p v-if="venue.description" class="mt-4 text-sm leading-relaxed text-ink-secondary">
                    {{ venue.description?.substring(0, 200) }}{{ venue.description?.length > 200 ? '...' : '' }}
                  </p>
                </div>
              </div>
              <div class="mt-6 rounded-lg border border-line p-4">
                <h3 class="text-sm font-semibold text-ink">What happens next</h3>
                <ol class="mt-2 grid gap-2 text-sm text-ink-secondary sm:grid-cols-3">
                  <li class="flex gap-2"><span class="next-num">1</span>Pick your date and time</li>
                  <li class="flex gap-2"><span class="next-num">2</span>Add event details and add-ons</li>
                  <li class="flex gap-2"><span class="next-num">3</span>Owner confirms, then you pay</li>
                </ol>
              </div>
            </div>
            <div class="card-footer step-actions">
              <RouterLink :to="`/venues/${route.params.id}`" class="btn-secondary">Back to venue</RouterLink>
              <button type="button" @click="step = 1" class="btn-primary">Continue to date and time <AppIcon icon="arrow-right" class="w-4 h-4" /></button>
            </div>
          </section>

          <!-- Step 2: Date & Time -->
          <section v-if="step === 1" class="card" aria-labelledby="step-title">
            <div class="card-header">
              <div><h2 id="step-title" class="card-title">Select date and time</h2><p class="card-subtitle">Choose your event dates and times. Select several days for a multi-day event.</p></div>
            </div>
            <div class="card-body">
              <BookingCalendar
                :venue-id="venue.id"
                :operating-start="venue.operating_start"
                :operating-end="venue.operating_end"
                @update:selection="onCalendarUpdate"
              />
              <div v-if="calendarSlots.length > 0" class="mt-4 rounded-lg border border-success-line bg-success-soft p-4">
                <h3 class="text-sm font-semibold text-success-text">Your selection</h3>
                <ul class="mt-2 space-y-1.5">
                  <li v-for="slot in calendarSlots" :key="slot.date" class="flex flex-wrap items-center justify-between gap-x-4 text-sm">
                    <span class="font-medium text-ink">{{ formatSlotDate(slot.date) }}</span>
                    <span class="font-semibold text-success-text num">{{ formatTimeRange(slot.start_time, slot.end_time) }}</span>
                  </li>
                </ul>
              </div>
              <p v-else class="mt-4 form-hint flex items-center gap-1.5"><AppIcon icon="info-circle" class="w-4 h-4" />Select at least one day to continue.</p>
            </div>
            <div class="card-footer step-actions">
              <button type="button" @click="step = 0" class="btn-secondary"><AppIcon icon="arrow-left" class="w-4 h-4" />Back</button>
              <button type="button" @click="step = 2" :disabled="calendarSlots.length === 0" class="btn-primary">
                Continue to event details <AppIcon icon="arrow-right" class="w-4 h-4" />
              </button>
            </div>
          </section>

          <!-- Step 3: Event Details -->
          <section v-if="step === 2" class="card" aria-labelledby="step-title">
            <div class="card-header">
              <div><h2 id="step-title" class="card-title">Event details</h2><p class="card-subtitle">Tell the venue about your event so they can prepare.</p></div>
            </div>
            <form @submit.prevent="step = 3" novalidate>
              <div class="card-body space-y-5">
                <FormField id="bk-name" label="Event name" required :error="touched.event_name && !booking.event_name ? 'Enter a name for your event.' : ''" hint="Shown to the venue owner with your request.">
                  <TextInput v-model="booking.event_name" required placeholder="e.g. Ayesha and Bilal's walima" @blur="touched.event_name = true" />
                </FormField>

                <div class="grid gap-5 sm:grid-cols-2">
                  <FormField
                    id="bk-type"
                    label="Event type"
                    required
                    :error="touched.event_type && !booking.event_type ? 'Choose the type of event.' : ''"
                    :hint="venue.event_types?.length ? `This venue hosts: ${eventTypeOptions.map(o => o.label).join(', ')}` : ''"
                  >
                    <SelectInput
                      v-model="booking.event_type"
                      required
                      placeholder="Select an event type"
                      placeholder-disabled
                      :options="eventTypeOptions.map(o => ({ value: o.slug, label: o.label }))"
                      @blur="touched.event_type = true"
                    />
                  </FormField>

                  <FormField
                    id="bk-guests"
                    label="Expected guests"
                    required
                    :error="guestError || (touched.expected_guests && !booking.expected_guests ? 'Enter how many guests you expect.' : '')"
                    :hint="`Venue capacity: ${venue.capacity_min || 1} – ${venue.capacity_max || 'unlimited'}`"
                  >
                    <NumberInput
                      v-model="booking.expected_guests"
                      required
                      :min="venue.capacity_min || 1"
                      :max="venue.capacity_max || 10000"
                      :step="10"
                      :placeholder="`${venue.capacity_min || 1}–${venue.capacity_max || '∞'}`"
                      @blur="touched.expected_guests = true"
                    />
                  </FormField>
                </div>

                <FormField id="bk-req" label="Special requirements" optional>
                  <TextareaInput v-model="booking.special_requirements" :rows="3" auto-grow placeholder="Menu preferences, decor, stage or sound needs, timings for baraat…" />
                </FormField>

                <div class="amenity-wrap">
                  <AmenityPicker v-model="selectedAmenityIds" :amenities="venue.amenities || []" />
                </div>
              </div>
              <div class="card-footer step-actions">
                <button type="button" @click="step = 1" class="btn-secondary"><AppIcon icon="arrow-left" class="w-4 h-4" />Back</button>
                <button
                  type="submit"
                  :disabled="!booking.event_name || !booking.event_type || !booking.expected_guests || !!guestError"
                  class="btn-primary"
                >
                  Review booking <AppIcon icon="arrow-right" class="w-4 h-4" />
                </button>
              </div>
            </form>
          </section>

          <!-- Step 4: Review & Confirm -->
          <section v-if="step === 3" class="card" aria-labelledby="step-title">
            <div class="card-header">
              <div><h2 id="step-title" class="card-title">Review and confirm</h2><p class="card-subtitle">Check everything below, then send your request.</p></div>
            </div>
            <div class="card-body space-y-5">
              <div class="review-block">
                <div class="review-block-head"><h3>Venue</h3></div>
                <p class="text-sm font-medium text-ink">{{ venue.name }}</p>
              </div>

              <div class="review-block">
                <div class="review-block-head">
                  <h3>Date and time</h3>
                  <button type="button" class="link text-sm" @click="step = 1">Change</button>
                </div>
                <ul class="divide-y divide-line">
                  <li v-for="slot in calendarSlots" :key="slot.date" class="flex flex-wrap items-center justify-between gap-x-4 py-2 text-sm">
                    <span class="font-medium text-ink">{{ formatSlotDate(slot.date) }}</span>
                    <span class="text-ink-secondary num">{{ formatTimeRange(slot.start_time, slot.end_time) }}</span>
                  </li>
                </ul>
              </div>

              <div class="review-block">
                <div class="review-block-head">
                  <h3>Event details</h3>
                  <button type="button" class="link text-sm" @click="step = 2">Edit</button>
                </div>
                <dl>
                  <div class="dl-row"><dt>Name</dt><dd>{{ booking.event_name }}</dd></div>
                  <div v-if="booking.event_type" class="dl-row"><dt>Type</dt><dd>{{ labelForSlug(booking.event_type) }}</dd></div>
                  <div class="dl-row"><dt>Guests</dt><dd>{{ booking.expected_guests }}</dd></div>
                </dl>
                <div v-if="booking.special_requirements" class="mt-2">
                  <p class="text-xs text-ink-muted">Requirements</p>
                  <p class="mt-0.5 whitespace-pre-line text-sm text-ink-secondary">{{ booking.special_requirements }}</p>
                </div>
              </div>

              <!-- Errors -->
              <div v-if="submitError" class="alert-danger" role="alert">
                <AppIcon icon="alert-triangle" class="w-5 h-5 shrink-0" />
                <div>
                  <p class="alert-title">{{ submitError }}</p>
                  <ul v-if="Object.keys(fieldErrors).length" class="mt-1 list-disc pl-4 text-sm">
                    <li v-for="(msgs, field) in extraFieldErrors" :key="field">{{ msgs[0] }}</li>
                  </ul>
                  <button v-if="fieldErrors.start_time || fieldErrors.end_time || fieldErrors.event_date" type="button" @click="step = 1" class="mt-1 text-sm font-semibold underline">
                    Choose another date or time
                  </button>
                  <button v-else-if="fieldErrors.expected_guests" type="button" @click="step = 2" class="mt-1 text-sm font-semibold underline">
                    Change guest count
                  </button>
                </div>
              </div>

              <!-- Success -->
              <div v-if="submitSuccess" class="alert-success" role="status">
                <AppIcon icon="circle-check" class="w-5 h-5 shrink-0" />
                <p>Booking submitted successfully! Redirecting to your bookings...</p>
              </div>
            </div>
            <div class="card-footer step-actions">
              <button type="button" @click="step = 2" :disabled="submitting" class="btn-secondary"><AppIcon icon="arrow-left" class="w-4 h-4" />Back</button>
              <button type="button" @click="submitBooking" :disabled="submitting || submitSuccess" class="btn-primary">
                <span v-if="submitting" class="spinner-border spinner-border-sm" aria-hidden="true"></span>
                {{ submitting ? 'Submitting...' : 'Confirm booking' }}
              </button>
            </div>
          </section>
        </div>

        <!-- Summary sidebar -->
        <aside class="lg:sticky lg:top-6" aria-label="Booking summary">
          <div class="card overflow-hidden">
            <div class="flex gap-3 border-b border-line p-4">
              <div class="h-16 w-20 shrink-0 overflow-hidden rounded-md bg-surface-sunken">
                <img v-if="venueImage" :src="venueImage" :alt="venue.name" class="h-full w-full object-cover" />
              </div>
              <div class="min-w-0">
                <p class="truncate font-semibold text-ink">{{ venue.name }}</p>
                <p class="truncate text-[0.8125rem] text-ink-muted">{{ venue.city || venue.location }}</p>
                <p v-if="Number(venue.total_reviews) > 0" class="mt-0.5 flex items-center gap-1 text-[0.8125rem] text-ink-secondary">
                  <AppIcon icon="star-filled" class="fill-current w-3.5 h-3.5 text-[#B45309]" />
                  <span class="num">{{ Number(venue.avg_rating).toFixed(1) }} · {{ venue.total_reviews }} reviews</span>
                </p>
              </div>
            </div>

            <dl class="px-4 py-1">
              <div class="dl-row">
                <dt>Dates</dt>
                <dd>
                  <template v-if="calendarSlots.length">
                    <span v-for="slot in calendarSlots" :key="slot.date" class="block">{{ formatSlotDate(slot.date) }}</span>
                  </template>
                  <span v-else class="font-normal text-ink-muted">Not chosen yet</span>
                </dd>
              </div>
              <div v-if="calendarSlots.length" class="dl-row">
                <dt>Time</dt>
                <dd><span v-for="slot in calendarSlots" :key="slot.date" class="block">{{ formatTimeRange(slot.start_time, slot.end_time) }}</span></dd>
              </div>
              <div class="dl-row"><dt>Guests</dt><dd>{{ booking.expected_guests || '—' }}</dd></div>
              <div v-if="booking.event_type" class="dl-row"><dt>Event</dt><dd>{{ labelForSlug(booking.event_type) }}</dd></div>
            </dl>

            <div class="border-t border-line bg-surface-sunken px-4 py-3">
              <h2 class="text-[0.8125rem] font-semibold text-ink">Price estimate</h2>
              <dl class="mt-1">
                <div class="sum-row"><dt>PKR {{ formatPrice(venue) }} × {{ booking.expected_guests || 1 }} guest{{ booking.expected_guests !== 1 ? 's' : '' }}</dt><dd>PKR {{ fmt(pricing.base) }}</dd></div>
                <div v-for="a in selectedPaidAmenities" :key="a.id" class="sum-row"><dt class="truncate">{{ a.name }}</dt><dd>PKR {{ fmt(Number(a.price || 0)) }}</dd></div>
                <div class="sum-row"><dt>Tax (5%)</dt><dd>PKR {{ fmt(pricing.tax) }}</dd></div>
                <div class="sum-row sum-total"><dt>Estimated total</dt><dd>PKR {{ fmt(pricing.total) }}</dd></div>
              </dl>
            </div>
            <p class="flex gap-2 border-t border-line px-4 py-3 text-[0.8125rem] text-ink-muted">
              <AppIcon icon="shield-check" class="w-4 h-4 shrink-0 text-brand-text" />
              No payment now. You pay online after the owner confirms.
            </p>
          </div>
        </aside>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { FormField, TextInput, SelectInput, NumberInput, TextareaInput } from '@/components/forms'
import { formatTime, formatTimeRange } from '@/lib/format'
import { ref, reactive, computed, onMounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import api from '@/lib/axios'
import { useCategoriesStore } from '@/stores/categories'
import { getStorageUrl } from '@/lib/storageUrl'
import BookingCalendar from '@/components/booking/BookingCalendar.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import AmenityPicker from '@/components/booking/AmenityPicker.vue'
import type { SelectedDaySlot } from '@/components/booking/BookingCalendar.vue'

const route = useRoute()
const router = useRouter()
const categoriesStore = useCategoriesStore()

const activeCategories = computed(() => categoriesStore.categories.filter(c => c.is_active))

/** Prettify a slug we have no category record for (e.g. "bridal_showers"). */
function labelForSlug(slug: string): string {
  const match = activeCategories.value.find(c => c.slug === slug)
  if (match) return match.name
  return slug.replace(/_/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase())
}

/**
 * The venue owner picks which categories the venue hosts; the booking must use
 * one of them. If the venue lists none, any active category is allowed.
 */
const eventTypeOptions = computed(() => {
  const offered: string[] = venue.value?.event_types || []
  const slugs = offered.length ? offered : activeCategories.value.map(c => c.slug)
  return slugs.map(slug => ({ slug, label: labelForSlug(slug) }))
})

const steps = ['Venue', 'Date & Time', 'Event Details', 'Review']
const step = ref(0)
const venue = ref<any>(null)
const loading = ref(true)
const calendarSlots = ref<SelectedDaySlot[]>([])
const submitting = ref(false)
const submitError = ref('')
const fieldErrors = ref<Record<string, string[]>>({})
const submitSuccess = ref(false)
// Fields the user has left, so inline messages only show after they've had a go.
const touched = reactive({ event_name: false, event_type: false, expected_guests: false })

const booking = reactive({
  event_name: '',
  event_type: '',
  expected_guests: 1,
  special_requirements: '',
})

const guestMin = computed(() => Number(venue.value?.capacity_min) || 1)
const guestMax = computed(() => Number(venue.value?.capacity_max) || 0)
const guestError = computed(() => {
  const g = Number(booking.expected_guests)
  if (!g) return ''
  if (!Number.isInteger(g) || g < guestMin.value || (guestMax.value && g > guestMax.value)) {
    return guestMax.value
      ? `This venue accommodates between ${guestMin.value} and ${guestMax.value} guests.`
      : `This venue requires at least ${guestMin.value} guests.`
  }
  return ''
})

// Field errors that add information beyond the headline message.
const extraFieldErrors = computed(() => {
  const out: Record<string, string[]> = {}
  for (const [field, msgs] of Object.entries(fieldErrors.value)) {
    if (msgs?.length && !submitError.value.startsWith(msgs[0])) out[field] = msgs
  }
  return out
})

const venueImage = computed(() => {
  const imgs = venue.value?.images || []
  const primary = imgs.find((i: any) => i.is_primary)
  const path = primary?.path || imgs[0]?.path || venue.value?.thumbnail
  return path ? getStorageUrl(path) : null
})

// ── Amenities & pricing (fix/features) ────────────────────────────────
const selectedAmenityIds = ref<number[]>([])
const selectedPaidAmenities = computed(() =>
  (venue.value?.amenities || []).filter((a: any) => a.is_paid && selectedAmenityIds.value.includes(a.id)),
)
const pricing = computed(() => {
  const round2 = (n: number) => Math.round(n * 100) / 100
  const base = round2((venue.value?.price_per_head ?? 0) * (booking.expected_guests || 1))
  const amenities = round2(selectedPaidAmenities.value.reduce((sum: number, a: any) => sum + Number(a.price || 0), 0))
  const tax = round2((base + amenities) * 0.05)
  return { base, amenities, tax, total: round2(base + amenities + tax) }
})
function fmt(n: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

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
    // Preselect only when the venue offers exactly one type; otherwise the
    // customer chooses. Never fall back to a slug that isn't a real category.
    const offered: string[] = venue.value?.event_types || []
    booking.event_type = offered.length === 1 ? offered[0] : ''
    booking.expected_guests = Number(venue.value?.capacity_min) || 1
    // The venue page passes the guest count from its estimate (?guests=…); use it when it fits.
    const q = Number(route.query.guests)
    const max = Number(venue.value?.capacity_max) || 0
    if (Number.isInteger(q) && q >= booking.expected_guests && (!max || q <= max)) booking.expected_guests = q
  } catch {
    venue.value = null
  } finally {
    loading.value = false
  }
}

async function submitBooking() {
  submitting.value = true
  submitError.value = ''
  fieldErrors.value = {}
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
      amenity_ids: selectedPaidAmenities.value.map((a: any) => a.id),
      // Send all slots for multi-day support
      slots: calendarSlots.value,
    })
    submitSuccess.value = true
    setTimeout(() => router.push('/customer/bookings'), 2000)
  } catch (e: any) {
    const status = e.response?.status
    fieldErrors.value = e.response?.data?.errors || {}
    if (status === 429) {
      submitError.value = e.response?.data?.message || 'Too many requests. Please wait a minute and try again.'
    } else if (!e.response) {
      submitError.value = 'Could not reach the server. Check your connection and try again.'
    } else {
      submitError.value = e.response?.data?.message || 'Booking failed. Please try again.'
    }
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
.booking-page { max-width: 1120px; margin: 0 auto; }

/* Stepper */
.stepper {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}
.stepper-item { position: relative; min-width: 0; }
.stepper-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  min-height: 44px;
  padding: 0.5rem 0 0.5rem;
  border-top: 3px solid var(--line);
  text-align: left;
  cursor: default;
}
.stepper-item.is-done .stepper-btn { border-top-color: var(--brand-strong); cursor: pointer; }
.stepper-item.is-active .stepper-btn { border-top-color: var(--brand-strong); }
.stepper-btn:disabled { opacity: 1; }
.stepper-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  flex-shrink: 0;
  border-radius: 9999px;
  border: 1px solid rgb(var(--c-line-strong) / 0.6);
  background: var(--surface);
  color: var(--ink-muted);
  font-size: 0.75rem;
  font-weight: 600;
}
.stepper-item.is-active .stepper-num { background: var(--brand-strong); border-color: var(--brand-strong); color: var(--on-brand); }
.stepper-item.is-done .stepper-num { background: var(--brand-soft); border-color: var(--brand-muted); color: var(--brand-text); }
.stepper-label { font-size: 0.8125rem; font-weight: 500; color: var(--ink-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.stepper-item.is-active .stepper-label { color: var(--ink); font-weight: 600; }
.stepper-item.is-done .stepper-label { color: var(--ink-secondary); }
.stepper-item.is-done .stepper-btn:hover .stepper-label { color: var(--brand-text); text-decoration: underline; }
@media (max-width: 639.98px) {
  .stepper { margin-bottom: 0.5rem; }
  .stepper-label { display: none; }
}

.step-actions {
  display: flex;
  flex-wrap: wrap-reverse;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}
@media (max-width: 479.98px) {
  .step-actions > * { flex: 1 1 100%; }
}

.next-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
  border-radius: 9999px;
  background: var(--surface-sunken);
  border: 1px solid var(--line);
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--ink-secondary);
}

.review-block { padding: 1rem; border: 1px solid var(--line); border-radius: var(--radius-md); }
.review-block-head { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; margin-bottom: 0.375rem; }
.review-block-head h3 { font-size: 0.75rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--ink-muted); }

.sum-row { display: flex; justify-content: space-between; gap: 1rem; padding: 0.3rem 0; font-size: 0.8125rem; color: var(--ink-secondary); }
.sum-row dt { min-width: 0; }
.sum-row dd { flex-shrink: 0; font-variant-numeric: tabular-nums; color: var(--ink); }
.sum-total { margin-top: 0.375rem; padding-top: 0.625rem; border-top: 1px solid var(--line); font-size: 0.9375rem; font-weight: 600; color: var(--ink); }

/* AmenityPicker (shared component) uses a legacy label class; style it here. */
.amenity-wrap :deep(.form-label-warm) {
  display: block;
  margin-bottom: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--ink);
}
</style>
