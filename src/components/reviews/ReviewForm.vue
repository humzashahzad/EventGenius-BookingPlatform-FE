<template>
  <!-- Self-contained review section for a client booking. Renders nothing
       unless the booking is reviewable or already reviewed. -->
  <section
    v-if="!loading && (state.eligible || state.review)"
    id="review"
    class="card overflow-hidden scroll-mt-24"
    aria-labelledby="review-title"
  >
    <div class="card-header">
      <div class="flex items-center gap-3 min-w-0">
        <span class="icon-chip icon-chip-sm tone-warning"><AppIcon icon="message-star" class="w-4 h-4" /></span>
        <div class="min-w-0">
          <h2 id="review-title" class="card-title">{{ state.review ? 'Your review' : 'How was your event?' }}</h2>
          <p class="card-subtitle">
            {{ state.review ? `Posted ${formatDate(state.review.created_at)}` : `Tell other customers about ${venueName || 'the venue'}.` }}
          </p>
        </div>
      </div>
      <span v-if="state.review && !state.review.is_approved" class="badge-cancelled">Hidden</span>
    </div>

    <!-- Existing review -->
    <div v-if="state.review" class="card-body space-y-3">
      <div class="flex flex-wrap items-center gap-2">
        <span class="inline-flex gap-0.5" role="img" :aria-label="`${state.review.rating} out of 5 stars`">
          <AppIcon v-for="i in 5" :key="i" icon="star" :class="i <= state.review.rating ? 'w-5 h-5 text-[#F59E0B] fill-current' : 'w-5 h-5 text-ink-muted/50'" />
        </span>
        <span class="text-sm font-semibold text-ink num">{{ state.review.rating }}.0</span>
        <span class="text-sm text-ink-muted">{{ ratingWords[state.review.rating - 1] }}</span>
      </div>
      <p v-if="state.review.title" class="font-semibold text-ink">{{ state.review.title }}</p>
      <p v-if="state.review.comment" class="text-sm text-ink-secondary whitespace-pre-line leading-relaxed">{{ state.review.comment }}</p>

      <dl v-if="existingSubRatings.length" class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
        <div v-for="s in existingSubRatings" :key="s.key" class="panel-sunken px-3 py-2">
          <dt class="text-xs text-ink-muted">{{ s.label }}</dt>
          <dd class="text-sm font-semibold text-ink num">{{ s.value }}/5</dd>
        </div>
      </dl>

      <p v-if="!state.review.is_approved" class="text-xs text-ink-muted">This review is currently hidden by a moderator.</p>

      <div v-if="state.review.store_reply" class="panel-sunken p-4 mt-2">
        <p class="text-xs font-semibold text-brand-text mb-1 inline-flex items-center gap-1.5">
          <AppIcon icon="arrow-back-up" class="w-3.5 h-3.5" /> Reply from the venue
        </p>
        <p class="text-sm text-ink-secondary whitespace-pre-line">{{ state.review.store_reply }}</p>
      </div>
    </div>

    <!-- New review form -->
    <form v-else class="card-body space-y-5" novalidate @submit.prevent="submit">
      <FormField id="review-rating" label="Overall rating" required group :error="errors.rating || (ratingTouched && !form.rating ? 'Choose a star rating to continue.' : '')">
        <RatingInput :model-value="form.rating" name="rating" size="lg" show-text @update:model-value="v => (form.rating = v ?? 0)" />
      </FormField>

      <fieldset>
        <legend class="form-label">Rate the details <span class="form-optional">(optional)</span></legend>
        <div class="grid grid-cols-1 min-[420px]:grid-cols-2 gap-x-6 gap-y-1">
          <div v-for="sub in subRatings" :key="sub.key" class="flex items-center justify-between gap-3">
            <span :id="`sub-${sub.key}`" class="text-sm text-ink-secondary">{{ sub.label }}</span>
            <RatingInput v-model="form[sub.key]" :name="sub.key" :labelledby="`sub-${sub.key}`" size="sm" />
          </div>
        </div>
      </fieldset>

      <FormField id="review-title-input" label="Title" optional :error="errors.title">
        <TextInput v-model="form.title" :maxlength="255" placeholder="Sum up your event in a few words" />
      </FormField>
      <FormField id="review-comment" label="Your review" optional :error="errors.comment" hint="Reviews are public and show your first name." :count="form.comment.length" :maxlength="5000">
        <TextareaInput v-model="form.comment" :rows="4" :maxlength="5000" auto-grow placeholder="What went well? How were the food, decor and staff? What could be better?" />
      </FormField>

      <div v-if="errorMsg" class="alert-danger" role="alert">
        <AppIcon icon="alert-circle" class="w-5 h-5 shrink-0" />
        <p>{{ errorMsg }}</p>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <button type="submit" :disabled="submitting" class="btn-primary">
          <AppIcon v-if="submitting" icon="loader" class="w-4 h-4 animate-spin" />
          <AppIcon v-else icon="send" class="w-4 h-4" />
          {{ submitting ? 'Submitting…' : 'Submit review' }}
        </button>
        <p class="text-xs text-ink-muted">You can only review a booking once.</p>
      </div>
    </form>
  </section>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { toast } from 'vue-sonner'
import api from '@/lib/axios'
import { cacheGet, cacheSet } from '@/composables/usePageCache'
import { useLiveRefresh } from '@/composables/useLiveRefresh'
import AppIcon from '@/components/ui/AppIcon.vue'
import { FormField, RatingInput, TextInput, TextareaInput } from '@/components/forms'

const props = defineProps<{ bookingId: number | string; venueName?: string }>()
const emit = defineEmits<{ submitted: [review: any]; loaded: [state: { eligible: boolean; review: any | null }] }>()

type SubKey = 'cleanliness_rating' | 'value_rating' | 'service_rating' | 'location_rating'
const subRatings: { key: SubKey; label: string }[] = [
  { key: 'cleanliness_rating', label: 'Cleanliness' },
  { key: 'value_rating', label: 'Value' },
  { key: 'service_rating', label: 'Service' },
  { key: 'location_rating', label: 'Location' },
]
const ratingWords = ['Poor', 'Fair', 'Good', 'Very good', 'Excellent']

type ReviewState = { eligible: boolean; review: any | null }
const cacheKey = () => `client:review:${props.bookingId}`
const cached = cacheGet<ReviewState>(cacheKey())
// Known from an earlier visit: show it at once (no pop-in), then refresh quietly.
const loading = ref(!cached)
const submitting = ref(false)
const ratingTouched = ref(false)
const errorMsg = ref('')
const errors = ref<Record<string, string[]>>({})
const state = reactive<ReviewState>({ eligible: cached?.eligible ?? false, review: cached?.review ?? null })
const form = reactive<Record<SubKey, number | null> & { rating: number; title: string; comment: string }>({
  rating: 0, title: '', comment: '',
  cleanliness_rating: null, value_rating: null, service_rating: null, location_rating: null,
})

const existingSubRatings = computed(() =>
  subRatings
    .map(s => ({ ...s, value: state.review?.[s.key] as number | null }))
    .filter(s => s.value),
)

function formatDate(d?: string) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

let seq = 0
async function load(opts: { quiet?: boolean } = {}) {
  const id = ++seq
  const key = cacheKey()
  if (!opts.quiet) {
    const known = cacheGet<ReviewState>(key)
    loading.value = !known
    if (known) { state.eligible = known.eligible; state.review = known.review }
  }
  let failed = false
  try {
    const { data } = await api.get(`/client/bookings/${props.bookingId}/review`)
    if (id !== seq) return
    state.eligible = !!data.data?.eligible
    state.review = data.data?.review || null
    cacheSet(key, { eligible: state.eligible, review: state.review })
  } catch {
    if (id !== seq) return
    failed = true
    // A quiet refresh that fails keeps what is shown.
    if (!opts.quiet && !cacheGet<ReviewState>(key)) {
      state.eligible = false
      state.review = null
    }
  } finally {
    if (id === seq) {
      loading.value = false
      if (!opts.quiet || !failed) emit('loaded', { eligible: state.eligible, review: state.review })
    }
  }
}

// The venue replies to the review (or a moderator hides it): update quietly.
useLiveRefresh(['review'], () => { if (!submitting.value) void load({ quiet: true }) })

async function submit() {
  ratingTouched.value = true
  if (!form.rating) return
  submitting.value = true
  errorMsg.value = ''
  errors.value = {}
  try {
    const payload: Record<string, unknown> = { rating: form.rating }
    if (form.title.trim()) payload.title = form.title.trim()
    if (form.comment.trim()) payload.comment = form.comment.trim()
    for (const s of subRatings) if (form[s.key]) payload[s.key] = form[s.key]
    const { data } = await api.post(`/client/bookings/${props.bookingId}/review`, payload)
    state.review = data.data
    state.eligible = false
    cacheSet(cacheKey(), { eligible: false, review: data.data })
    toast.success('Thanks! Your review was posted.')
    emit('submitted', data.data)
  } catch (e: any) {
    errors.value = e.response?.data?.errors || {}
    errorMsg.value = e.response?.data?.message || 'Could not submit your review.'
  } finally {
    submitting.value = false
  }
}

watch(() => props.bookingId, () => { void load() })
onMounted(() => { void load() })
defineExpose({ reload: load })
</script>
