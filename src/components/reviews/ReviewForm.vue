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
        <StarRating :model-value="state.review.rating" readonly />
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
      <div>
        <p id="rating-label" class="form-label">Overall rating <span class="req">*</span></p>
        <StarInput
          v-model="form.rating"
          name="rating"
          labelledby="rating-label"
          :describedby="errors.rating || ratingTouched ? 'rating-error' : undefined"
          size="lg"
          show-text
        />
        <p v-if="errors.rating" id="rating-error" class="form-error">{{ errors.rating[0] }}</p>
        <p v-else-if="ratingTouched && !form.rating" id="rating-error" class="form-error">Choose a star rating to continue.</p>
      </div>

      <fieldset>
        <legend class="form-label">Rate the details <span class="text-ink-muted font-normal">(optional)</span></legend>
        <div class="grid grid-cols-1 min-[420px]:grid-cols-2 gap-x-6 gap-y-3">
          <div v-for="sub in subRatings" :key="sub.key" class="flex items-center justify-between gap-3">
            <span :id="`sub-${sub.key}`" class="text-sm text-ink-secondary">{{ sub.label }}</span>
            <StarInput v-model="form[sub.key]" :name="sub.key" :labelledby="`sub-${sub.key}`" size="sm" />
          </div>
        </div>
      </fieldset>

      <div>
        <label for="review-title-input" class="form-label">Title <span class="text-ink-muted font-normal">(optional)</span></label>
        <input id="review-title-input" v-model="form.title" maxlength="255" class="form-input" placeholder="Sum up your event in a few words" :aria-invalid="!!errors.title" />
        <p v-if="errors.title" class="form-error">{{ errors.title[0] }}</p>
      </div>
      <div>
        <label for="review-comment" class="form-label">Your review <span class="text-ink-muted font-normal">(optional)</span></label>
        <textarea
          id="review-comment"
          v-model="form.comment"
          rows="4"
          maxlength="5000"
          class="form-textarea"
          placeholder="What went well? How were the food, decor and staff? What could be better?"
          :aria-invalid="!!errors.comment"
          aria-describedby="review-comment-hint"
        ></textarea>
        <p v-if="errors.comment" class="form-error">{{ errors.comment[0] }}</p>
        <p v-else id="review-comment-hint" class="form-hint flex justify-between gap-2">
          <span>Reviews are public and show your first name.</span>
          <span class="num">{{ form.comment.length }}/5000</span>
        </p>
      </div>

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
import api from '@/lib/axios'
import AppIcon from '@/components/ui/AppIcon.vue'
import StarRating from '@/components/reviews/StarRating.vue'
import StarInput from '@/components/client/StarInput.vue'

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

const loading = ref(true)
const submitting = ref(false)
const ratingTouched = ref(false)
const errorMsg = ref('')
const errors = ref<Record<string, string[]>>({})
const state = reactive<{ eligible: boolean; review: any | null }>({ eligible: false, review: null })
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

async function load() {
  loading.value = true
  try {
    const { data } = await api.get(`/client/bookings/${props.bookingId}/review`)
    state.eligible = !!data.data?.eligible
    state.review = data.data?.review || null
  } catch {
    state.eligible = false
    state.review = null
  } finally {
    loading.value = false
    emit('loaded', { eligible: state.eligible, review: state.review })
  }
}

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
    emit('submitted', data.data)
  } catch (e: any) {
    errors.value = e.response?.data?.errors || {}
    errorMsg.value = e.response?.data?.message || 'Could not submit your review.'
  } finally {
    submitting.value = false
  }
}

watch(() => props.bookingId, load)
onMounted(load)
defineExpose({ reload: load })
</script>
