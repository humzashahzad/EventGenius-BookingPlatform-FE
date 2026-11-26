<template>
  <div class="booking-page">
    <!-- Loading -->
    <div v-if="loading" aria-busy="true" aria-label="Loading venue">
      <div class="skeleton h-3 w-32"></div>
      <div class="skeleton mt-3 h-7 w-72 max-w-full"></div>
      <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
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
      <header class="mb-4 min-w-0">
        <RouterLink :to="`/venues/${venue.id}`" class="back-link">
          <AppIcon icon="arrow-left" class="w-4 h-4" />Back to venue
        </RouterLink>
        <h1 class="page-title mt-1 break-words">Book {{ venue.name }}</h1>
        <p class="page-subtitle">Send a request in three steps. The owner confirms before you pay anything.</p>
      </header>

      <BookingStepper class="mb-5" :steps="STEP_LABELS" :short-steps="STEP_SHORT" :current="step" :max-reachable="maxReachable" @go="goStep" />

      <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div class="min-w-0">
          <!-- Step 1: Date & time -->
          <section v-if="step === 0" class="card" aria-labelledby="bk-step-title">
            <div class="card-header">
              <div>
                <h2 id="bk-step-title" ref="stepTitle" tabindex="-1" class="card-title">When is your event?</h2>
                <p class="card-subtitle">Pick a date, then the start and end time. Opening hours {{ openingHours }}.</p>
              </div>
            </div>
            <div class="card-body">
              <BookingDateTime
                ref="dateTime"
                v-model:days="days"
                v-model:active="activeDay"
                :venue-id="venue.id"
                :operating-start="venue.operating_start"
                :operating-end="venue.operating_end"
              />
            </div>
            <div class="card-footer step-actions">
              <RouterLink :to="`/venues/${venue.id}`" class="btn-secondary"><AppIcon icon="arrow-left" class="w-4 h-4" />Back to venue</RouterLink>
              <button type="button" class="btn-primary" :disabled="checking" @click="next">
                <span v-if="checking" class="spinner-border spinner-border-sm" aria-hidden="true"></span>
                Continue to event details <AppIcon icon="arrow-right" class="w-4 h-4" />
              </button>
            </div>
          </section>

          <!-- Step 2: Event details -->
          <section v-else-if="step === 1" class="card" aria-labelledby="bk-step-title">
            <div class="card-header">
              <div>
                <h2 id="bk-step-title" ref="stepTitle" tabindex="-1" class="card-title">About your event</h2>
                <p class="card-subtitle">Tell the venue what you're planning so they can prepare.</p>
              </div>
            </div>
            <form ref="detailsForm" novalidate @submit.prevent="next">
              <div class="card-body space-y-6">
                <FormField label="Occasion" required group :error="v.error('event_type')">
                  <RadioCards
                    v-if="eventTypeOptions.length <= 8"
                    v-model="form.event_type"
                    name="event_type"
                    :columns="2"
                    :options="eventTypeOptions.map(o => ({ value: o.slug, label: o.label }))"
                    @update:model-value="v.touch('event_type')"
                  />
                  <SelectInput
                    v-else
                    v-model="form.event_type"
                    :options="eventTypeOptions.map(o => ({ value: o.slug, label: o.label }))"
                    placeholder="Choose the occasion"
                    @change="v.touch('event_type')"
                    @blur="v.touch('event_type')"
                  />
                </FormField>

                <FormField label="Event name" required hint="Shown to the venue owner with your request." :error="v.error('event_name')">
                  <TextInput v-model="form.event_name" :maxlength="255" placeholder="e.g. Ayesha and Bilal's walima" autocomplete="off" @blur="v.touch('event_name')" />
                </FormField>

                <FormField label="Number of guests" required :hint="guestHint" :error="v.error('expected_guests')">
                  <NumberInput
                    v-model="form.expected_guests"
                    :min="guestMin"
                    :max="guestMax || undefined"
                    :step="5"
                    suffix="guests"
                    class="max-w-[16rem]"
                    @blur="v.touch('expected_guests')"
                  />
                </FormField>

                <FormField v-if="paidAmenities.length" label="Add-ons" optional group hint="Charged once for the event and added to your total.">
                  <CheckboxGroup v-model="selectedAmenityIds" variant="cards" :columns="2" :options="addOnOptions" />
                </FormField>

                <div v-if="includedAmenities.length">
                  <p class="form-label">Included at no extra cost</p>
                  <ul class="mt-1 flex flex-wrap gap-x-4 gap-y-1.5">
                    <li v-for="a in includedAmenities" :key="a.id" class="flex items-center gap-1.5 text-sm text-ink-secondary">
                      <AppIcon icon="check" class="w-4 h-4 text-brand-text shrink-0" />{{ a.name }}
                    </li>
                  </ul>
                </div>

                <FormField label="Special requests" optional :error="v.error('special_requirements')">
                  <TextareaInput
                    v-model="form.special_requirements"
                    :rows="3"
                    auto-grow
                    counter
                    :maxlength="REQ_MAX"
                    placeholder="Menu preferences, decor, stage or sound needs, baraat timings…"
                    @blur="v.touch('special_requirements')"
                  />
                </FormField>
              </div>
              <div class="card-footer step-actions">
                <button type="button" class="btn-secondary" @click="goStep(0)"><AppIcon icon="arrow-left" class="w-4 h-4" />Back</button>
                <button type="submit" class="btn-primary">Review request <AppIcon icon="arrow-right" class="w-4 h-4" /></button>
              </div>
            </form>
          </section>

          <!-- Step 3: Review & send -->
          <section v-else class="card" aria-labelledby="bk-step-title">
            <div class="card-header">
              <div>
                <h2 id="bk-step-title" ref="stepTitle" tabindex="-1" class="card-title">Review and send</h2>
                <p class="card-subtitle">Check the details below, then send your request to the owner.</p>
              </div>
            </div>
            <div class="card-body space-y-4">
              <div class="review-block">
                <div class="review-block-head">
                  <h3>Date and time</h3>
                  <button type="button" class="link text-sm review-edit" @click="goStep(0)">Edit<span class="sr-only"> date and time</span></button>
                </div>
                <ul class="divide-y divide-line">
                  <li v-for="(d, i) in sortedDays" :key="d.date" class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-2 text-sm">
                    <span class="font-medium text-ink"><span v-if="sortedDays.length > 1" class="text-ink-muted font-normal">Day {{ i + 1 }} · </span>{{ formatDay(d.date, true) }}</span>
                    <span class="text-ink-secondary num">{{ timeRange(d.start_time, d.end_time) }} <span class="text-ink-muted">({{ durationLabel(d.start_time, d.end_time) }})</span></span>
                  </li>
                </ul>
              </div>

              <div class="review-block">
                <div class="review-block-head">
                  <h3>Event details</h3>
                  <button type="button" class="link text-sm review-edit" @click="goStep(1)">Edit<span class="sr-only"> event details</span></button>
                </div>
                <dl>
                  <div class="dl-row"><dt>Occasion</dt><dd>{{ labelForSlug(form.event_type) }}</dd></div>
                  <div class="dl-row"><dt>Event name</dt><dd class="break-words min-w-0">{{ form.event_name }}</dd></div>
                  <div class="dl-row"><dt>Guests</dt><dd class="num">{{ form.expected_guests }}</dd></div>
                  <div class="dl-row"><dt>Add-ons</dt><dd>{{ selectedPaidAmenities.length ? selectedPaidAmenities.map((a: any) => a.name).join(', ') : 'None' }}</dd></div>
                </dl>
                <div v-if="form.special_requirements" class="mt-2">
                  <p class="text-xs text-ink-muted">Special requests</p>
                  <p class="mt-0.5 whitespace-pre-line break-words text-sm text-ink-secondary">{{ form.special_requirements }}</p>
                </div>
              </div>

              <div class="review-block">
                <div class="review-block-head"><h3>Price estimate</h3></div>
                <BookingPriceBreakdown :pricing="pricing" :per-head="perHead" :guests="guestsForPrice" :add-ons="selectedPaidAmenities" />
              </div>

              <div class="rounded-lg border border-line bg-surface-sunken p-4">
                <h3 class="text-sm font-semibold text-ink">What happens next</h3>
                <ol class="mt-2 space-y-2 text-sm text-ink-secondary">
                  <li class="flex gap-2"><span class="next-num">1</span>The venue owner reviews your request and confirms or declines it.</li>
                  <li class="flex gap-2"><span class="next-num">2</span>We let you know as soon as they reply.</li>
                  <li class="flex gap-2"><span class="next-num">3</span>Once confirmed, you pay online from your bookings. Nothing is charged now.</li>
                </ol>
              </div>

              <!-- Errors -->
              <div v-if="submitError" ref="errorBox" tabindex="-1" class="alert-danger" role="alert">
                <AppIcon icon="alert-triangle" class="w-5 h-5 shrink-0" />
                <div>
                  <p class="alert-title">{{ submitError }}</p>
                  <ul v-if="Object.keys(extraFieldErrors).length" class="mt-1 list-disc pl-4 text-sm">
                    <li v-for="(msgs, field) in extraFieldErrors" :key="field">{{ msgs[0] }}</li>
                  </ul>
                  <button v-if="fieldErrors.start_time || fieldErrors.end_time || fieldErrors.event_date || /available between/i.test(submitError)" type="button" class="mt-1 text-sm font-semibold underline" @click="goStep(0)">
                    Choose another date or time
                  </button>
                  <button v-else-if="fieldErrors.expected_guests || fieldErrors.event_type || fieldErrors.event_name" type="button" class="mt-1 text-sm font-semibold underline" @click="goStep(1)">
                    Change event details
                  </button>
                </div>
              </div>

              <!-- Success -->
              <div v-if="submitSuccess" class="alert-success" role="status">
                <AppIcon icon="circle-check" class="w-5 h-5 shrink-0" />
                <p>Booking request sent! Taking you to your bookings…</p>
              </div>
            </div>
            <div class="card-footer step-actions">
              <button type="button" class="btn-secondary" :disabled="submitting || submitSuccess" @click="goStep(1)"><AppIcon icon="arrow-left" class="w-4 h-4" />Back</button>
              <button type="button" class="btn-primary" :disabled="submitting || submitSuccess" :aria-busy="submitting || undefined" @click="submitBooking">
                <span v-if="submitting" class="spinner-border spinner-border-sm" aria-hidden="true"></span>
                {{ submitting ? 'Sending…' : 'Send booking request' }}
              </button>
            </div>
          </section>

          <!-- Keeps the last content clear of the fixed bar on phones -->
          <div class="mbar-spacer lg:hidden" aria-hidden="true"></div>
        </div>

        <!-- Summary (desktop) -->
        <aside class="hidden lg:block lg:sticky lg:top-6" aria-label="Booking summary">
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
                <dt>{{ sortedDays.length > 1 ? 'Dates' : 'Date' }}</dt>
                <dd>
                  <template v-if="sortedDays.length">
                    <span v-for="d in sortedDays" :key="d.date" class="block">
                      {{ formatDay(d.date) }}
                      <span v-if="d.start_time && d.end_time" class="block text-xs font-normal text-ink-muted num">{{ timeRange(d.start_time, d.end_time) }}</span>
                    </span>
                  </template>
                  <span v-else class="font-normal text-ink-muted">Not chosen yet</span>
                </dd>
              </div>
              <div class="dl-row"><dt>Guests</dt><dd class="num">{{ form.expected_guests || '—' }}</dd></div>
              <div v-if="form.event_type" class="dl-row"><dt>Occasion</dt><dd>{{ labelForSlug(form.event_type) }}</dd></div>
            </dl>

            <div class="border-t border-line bg-surface-sunken px-4 py-3">
              <h2 class="text-[0.8125rem] font-semibold text-ink">Price estimate</h2>
              <BookingPriceBreakdown class="mt-1" :pricing="pricing" :per-head="perHead" :guests="guestsForPrice" :add-ons="selectedPaidAmenities" />
            </div>
            <p class="flex gap-2 border-t border-line px-4 py-3 text-[0.8125rem] text-ink-muted">
              <AppIcon icon="shield-check" class="w-4 h-4 shrink-0 text-brand-text" />
              No payment now. You pay online after the owner confirms.
            </p>
          </div>
        </aside>
      </div>

      <!-- Phones: running total and the main button -->
      <BookingMobileBar
        :total="fmt(pricing.total)"
        :label="step === 0 ? 'Continue' : step === 1 ? 'Review' : submitting ? 'Sending…' : 'Send request'"
        :show-back="step > 0"
        :busy="submitting || checking"
        :disabled="submitSuccess"
        @primary="step === 2 ? submitBooking() : next()"
        @back="goStep(step - 1)"
      >
        <p v-if="sortedDays.length" class="mb-1 text-xs text-ink-secondary">
          <span v-for="(d, i) in sortedDays" :key="d.date">{{ i ? '; ' : '' }}{{ formatDay(d.date) }}<template v-if="d.start_time && d.end_time">, {{ timeRange(d.start_time, d.end_time) }}</template></span>
        </p>
        <BookingPriceBreakdown :pricing="pricing" :per-head="perHead" :guests="guestsForPrice" :add-ons="selectedPaidAmenities" />
        <p class="mt-1 text-xs text-ink-muted">No payment now. You pay after the owner confirms.</p>
      </BookingMobileBar>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import api from '@/lib/axios'
import { useCategoriesStore } from '@/stores/categories'
import { getStorageUrl } from '@/lib/storageUrl'
import AppIcon from '@/components/ui/AppIcon.vue'
import {
  CheckboxGroup, FormField, NumberInput, RadioCards, SelectInput, TextareaInput, TextInput, rules, useValidation, type Rule,
} from '@/components/forms'
import BookingStepper from '@/components/booking/BookingStepper.vue'
import BookingDateTime from '@/components/booking/BookingDateTime.vue'
import BookingMobileBar from '@/components/booking/BookingMobileBar.vue'
import BookingPriceBreakdown from '@/components/booking/BookingPriceBreakdown.vue'
import { type DaySlot, durationLabel, firstBookableISO, formatDay, operatingWindow, timeRange, toTime } from '@/components/booking/bookingTime'
import { calcPricing, fmt } from '@/components/booking/bookingPricing'

const route = useRoute()
const router = useRouter()
const categoriesStore = useCategoriesStore()

const STEP_KEYS = ['date', 'details', 'review'] as const
const STEP_LABELS = ['Date & time', 'Event details', 'Review & send']
const STEP_SHORT = ['Date', 'Details', 'Review']
const REQ_MAX = 1000

const venue = ref<any>(null)
const loading = ref(true)
const submitting = ref(false)
const checking = ref(false)
const submitError = ref('')
const fieldErrors = ref<Record<string, string[]>>({})
const submitSuccess = ref(false)
const stepTitle = ref<HTMLElement | null>(null)
const errorBox = ref<HTMLElement | null>(null)
const detailsForm = ref<HTMLFormElement | null>(null)
const dateTime = ref<InstanceType<typeof BookingDateTime> | null>(null)

// ── Form state ─────────────────────────────────────────────────────────
const days = ref<DaySlot[]>([{ date: '', start_time: '', end_time: '' }])
const activeDay = ref(0)
const form = reactive({
  event_name: '',
  event_type: '',
  expected_guests: 1 as number | null,
  special_requirements: '' as string | null,
})
const selectedAmenityIds = ref<number[]>([])
/** Furthest step the customer has reached (stepper allows jumping back to it). */
const reached = ref(0)

// ── Categories / event types ───────────────────────────────────────────
const activeCategories = computed(() => categoriesStore.categories.filter(c => c.is_active))
/** Prettify a slug we have no category record for (e.g. "bridal_showers"). */
function labelForSlug(slug: string): string {
  const match = activeCategories.value.find(c => c.slug === slug)
  if (match) return match.name
  return slug.replace(/_/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase())
}
/** The venue's event types; if it lists none, any active category is allowed. */
const eventTypeOptions = computed(() => {
  const offered: string[] = venue.value?.event_types || []
  const slugs = offered.length ? offered : activeCategories.value.map(c => c.slug)
  return slugs.map(slug => ({ slug, label: labelForSlug(slug) }))
})

// ── Guests & validation ────────────────────────────────────────────────
const guestMin = computed(() => Number(venue.value?.capacity_min) || 1)
const guestMax = computed(() => Number(venue.value?.capacity_max) || 0)
const guestHint = computed(() => guestMax.value
  ? `This venue hosts ${guestMin.value.toLocaleString('en-PK')} to ${guestMax.value.toLocaleString('en-PK')} guests.`
  : `This venue needs at least ${guestMin.value.toLocaleString('en-PK')} guests.`)
const guestsRule: Rule<number | null> = g => {
  if (g === null || g === undefined) return true
  if (!Number.isInteger(g) || g < guestMin.value || (guestMax.value && g > guestMax.value)) {
    return guestMax.value
      ? `Enter between ${guestMin.value} and ${guestMax.value} guests (this venue's capacity).`
      : `This venue needs at least ${guestMin.value} guests.`
  }
  return true
}
const v = useValidation(form, {
  event_type: [rules.required('Choose the occasion.')],
  event_name: [rules.required('Enter a name for your event.'), rules.maxLength(255)],
  expected_guests: [rules.required('Enter how many guests you expect.'), guestsRule],
  special_requirements: [rules.maxLength(REQ_MAX)],
})
const detailsValid = () => !!form.event_type && !!form.event_name.trim() && form.event_name.length <= 255
  && form.expected_guests !== null && guestsRule(form.expected_guests) === true && (form.special_requirements || '').length <= REQ_MAX

// ── Amenities & pricing (same maths as the API) ────────────────────────
const amenities = computed<any[]>(() => venue.value?.amenities || [])
const paidAmenities = computed(() => amenities.value.filter(a => a.is_paid))
const includedAmenities = computed(() => amenities.value.filter(a => !a.is_paid))
const addOnOptions = computed(() => paidAmenities.value.map(a => ({ value: a.id, label: a.name, meta: `+ PKR ${Number(a.price || 0).toLocaleString('en-PK')}` })))
const selectedPaidAmenities = computed(() => amenities.value.filter(a => a.is_paid && selectedAmenityIds.value.includes(a.id)))
const perHead = computed(() => Number(venue.value?.price_per_head) || 0)
const guestsForPrice = computed(() => form.expected_guests || 1)
const pricing = computed(() => calcPricing(venue.value?.price_per_head ?? 0, form.expected_guests || 0, selectedPaidAmenities.value.map(a => Number(a.price || 0))))

// ── Venue display ──────────────────────────────────────────────────────
const venueImage = computed(() => {
  const imgs = venue.value?.images || []
  const primary = imgs.find((i: any) => i.is_primary)
  const path = primary?.path || imgs[0]?.path || venue.value?.thumbnail
  return path ? getStorageUrl(path) : null
})
const openingHours = computed(() => {
  const w = operatingWindow(venue.value?.operating_start, venue.value?.operating_end)
  return timeRange(toTime(w.start), toTime(w.end))
})
const sortedDays = computed(() => days.value.filter(d => d.date).slice().sort((a, b) => a.date.localeCompare(b.date)))
const daysComplete = () => days.value.length > 0 && days.value.every(d => d.date && d.start_time && d.end_time)

// ── Steps (kept in the URL so refresh / browser back work) ─────────────
const step = computed(() => {
  const i = STEP_KEYS.indexOf(String(route.query.step || 'date') as typeof STEP_KEYS[number])
  return i < 0 ? 0 : i
})
const maxReachable = computed(() => {
  if (!daysComplete()) return 0
  if (!detailsValid()) return Math.min(reached.value, 1)
  return reached.value
})
function goStep(i: number, replace = false) {
  if (i < 0 || i > 2 || i === step.value) return
  const query = { ...route.query, step: STEP_KEYS[i] }
  if (i === 0) delete (query as any).step
  return replace ? router.replace({ query }) : router.push({ query })
}
async function next() {
  if (step.value === 0) {
    checking.value = true
    const ok = await dateTime.value?.validate()
    checking.value = false
    if (!ok) return
    reached.value = Math.max(reached.value, 1)
    goStep(1)
  } else if (step.value === 1) {
    if (!v.validateAll()) {
      await nextTick()
      const bad = detailsForm.value?.querySelector<HTMLElement>('[aria-invalid="true"]')
      bad?.focus()
      bad?.scrollIntoView({ block: 'center' })
      return
    }
    reached.value = 2
    goStep(2)
  }
}
watch(step, async (s, old) => {
  if (old === undefined) return
  submitError.value = ''
  await nextTick()
  window.scrollTo({ top: 0 })
  stepTitle.value?.focus({ preventScroll: true })
  if (s > maxReachable.value) goStep(maxReachable.value, true)
})

// ── Draft (sessionStorage) so a refresh doesn't wipe the form ──────────
const draftKey = computed(() => `eg-booking-draft:${route.params.id}`)
interface Draft { days: DaySlot[]; active: number; form: typeof form; amenity_ids: number[]; reached: number }
function readDraft(): Draft | null {
  try {
    const raw = sessionStorage.getItem(draftKey.value)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}
function saveDraft() {
  if (!venue.value || submitSuccess.value) return
  try {
    const d: Draft = { days: days.value, active: activeDay.value, form: { ...form }, amenity_ids: selectedAmenityIds.value, reached: reached.value }
    sessionStorage.setItem(draftKey.value, JSON.stringify(d))
  } catch { /* storage unavailable */ }
}
function clearDraft() {
  try { sessionStorage.removeItem(draftKey.value) } catch { /* ignore */ }
}
watch([days, activeDay, form, selectedAmenityIds, reached], saveDraft, { deep: true })

function applyDraft(d: Draft) {
  const first = firstBookableISO()
  const restored = (d.days || []).map(x => ({
    date: typeof x.date === 'string' && x.date >= first ? x.date : '',
    start_time: String(x.start_time || ''),
    end_time: String(x.end_time || ''),
  }))
  if (restored.length) days.value = restored
  activeDay.value = Math.min(Math.max(0, Number(d.active) || 0), days.value.length - 1)
  if (d.form) {
    form.event_name = String(d.form.event_name || '')
    if (eventTypeOptions.value.some(o => o.slug === d.form.event_type) || !(venue.value?.event_types || []).length) form.event_type = String(d.form.event_type || '') || form.event_type
    if (typeof d.form.expected_guests === 'number') form.expected_guests = d.form.expected_guests
    form.special_requirements = String(d.form.special_requirements || '')
  }
  const paidIds = paidAmenities.value.map(a => a.id)
  selectedAmenityIds.value = (d.amenity_ids || []).filter(id => paidIds.includes(id))
  reached.value = Math.min(2, Number(d.reached) || 0)
}

async function loadVenue() {
  loading.value = true
  try {
    const { data } = await api.get(`/venues/${route.params.id}`)
    venue.value = data.data
    // Preselect only when the venue offers exactly one type; otherwise the customer chooses.
    const offered: string[] = venue.value?.event_types || []
    form.event_type = offered.length === 1 ? offered[0] : ''
    form.expected_guests = Number(venue.value?.capacity_min) || 1
    // The venue page passes the guest count from its estimate (?guests=…); use it when it fits.
    const q = Number(route.query.guests)
    const max = Number(venue.value?.capacity_max) || 0
    if (Number.isInteger(q) && q >= form.expected_guests && (!max || q <= max)) form.expected_guests = q
    const draft = readDraft()
    if (draft) applyDraft(draft)
  } catch {
    venue.value = null
  } finally {
    loading.value = false
  }
  // A refreshed or shared link can't skip ahead of what's filled in.
  if (venue.value && step.value > maxReachable.value) goStep(maxReachable.value, true)
}

// ── Submit (payload unchanged) ─────────────────────────────────────────
const extraFieldErrors = computed(() => {
  const out: Record<string, string[]> = {}
  for (const [field, msgs] of Object.entries(fieldErrors.value)) {
    if (msgs?.length && !submitError.value.startsWith(msgs[0])) out[field] = msgs
  }
  return out
})

async function submitBooking() {
  if (submitting.value || submitSuccess.value) return
  if (!daysComplete()) { goStep(0); return }
  if (!v.validateAll()) { goStep(1); return }
  submitting.value = true
  submitError.value = ''
  fieldErrors.value = {}

  const slots = sortedDays.value.map(d => ({ date: d.date, start_time: d.start_time, end_time: d.end_time }))
  // First day is the primary date; all days go in `slots` for multi-day events.
  const primarySlot = slots[0]

  try {
    await api.post('/client/bookings', {
      venue_id: venue.value.id,
      event_name: form.event_name,
      event_type: form.event_type,
      event_date: primarySlot.date,
      start_time: primarySlot.start_time,
      end_time: primarySlot.end_time,
      expected_guests: form.expected_guests,
      special_requirements: form.special_requirements ?? '',
      amenity_ids: selectedPaidAmenities.value.map((a: any) => a.id),
      slots,
    })
    submitSuccess.value = true
    clearDraft()
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
    await nextTick()
    errorBox.value?.focus()
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
.booking-page { max-width: 1120px; margin: 0 auto; min-width: 0; }

.back-link {
  display: inline-flex; align-items: center; gap: 0.375rem; min-height: 44px; margin-left: -0.25rem; padding: 0 0.25rem;
  font-size: 0.875rem; font-weight: 500; color: var(--ink-secondary); border-radius: var(--radius-md);
}
.back-link:hover { color: var(--brand-text); }
.back-link:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }

.card-title:focus { outline: none; }

.step-actions { display: flex; flex-wrap: wrap-reverse; align-items: center; justify-content: space-between; gap: 0.75rem; }
/* Phones use the fixed bottom bar for the main actions. */
@media (max-width: 1023.98px) {
  .step-actions { display: none; }
}

.mbar-spacer { height: calc(5rem + env(safe-area-inset-bottom)); }

.next-num {
  display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
  width: 1.25rem; height: 1.25rem; border-radius: 9999px; background: var(--surface);
  border: 1px solid var(--line); font-size: 0.6875rem; font-weight: 600; color: var(--ink-secondary);
}

.review-block { padding: 1rem; border: 1px solid var(--line); border-radius: var(--radius-md); }
.review-block-head { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; margin-bottom: 0.375rem; }
.review-block-head h3 { font-size: 0.75rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--ink-muted); }
.review-edit { min-height: 44px; min-width: 44px; padding: 0 0.25rem; }
</style>
