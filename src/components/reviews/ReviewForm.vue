<template>
  <!-- Self-contained review section for a client booking. Renders nothing
       unless the booking is reviewable or already reviewed. -->
  <div v-if="!loading && (state.eligible || state.review)" class="card mt-6 overflow-hidden">
    <div class="flex items-center gap-3 px-5 py-3.5 border-b border-warm-100 dark:border-warm-800">
      <div class="w-7 h-7 rounded-lg bg-accent/10 dark:bg-accent/20 flex items-center justify-center">
        <AppIcon icon="message-star" class="w-3.5 h-3.5 text-accent dark:text-amber-400" />
      </div>
      <h2 class="text-sm font-semibold text-warm-800 dark:text-warm-200">
        {{ state.review ? 'Your Review' : 'Review your experience' }}
      </h2>
    </div>

    <!-- Existing review -->
    <div v-if="state.review" class="p-5 space-y-2">
      <StarRating :model-value="state.review.rating" readonly />
      <p v-if="state.review.title" class="font-semibold text-warm-900 dark:text-warm-50">{{ state.review.title }}</p>
      <p v-if="state.review.comment" class="text-sm text-warm-600 dark:text-warm-300 whitespace-pre-line">{{ state.review.comment }}</p>
      <p v-if="!state.review.is_approved" class="text-xs text-warm-400">This review is currently hidden by a moderator.</p>
      <div v-if="state.review.store_reply" class="mt-3 pl-4 border-l-2 border-primary-300 dark:border-primary-700">
        <p class="text-xs font-semibold text-primary-600 dark:text-primary-400 mb-1">Reply from the venue</p>
        <p class="text-sm text-warm-600 dark:text-warm-300 whitespace-pre-line">{{ state.review.store_reply }}</p>
      </div>
    </div>

    <!-- New review form -->
    <form v-else @submit.prevent="submit" class="p-5 space-y-4">
      <div>
        <label class="form-label">Overall rating <span class="text-coral">*</span></label>
        <StarRating v-model="form.rating" size="lg" />
        <p v-if="errors.rating" class="text-xs text-coral mt-1">{{ errors.rating[0] }}</p>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div v-for="sub in subRatings" :key="sub.key">
          <label class="form-label !text-xs">{{ sub.label }}</label>
          <StarRating v-model="form[sub.key]" size="sm" />
        </div>
      </div>
      <div>
        <label class="form-label">Title</label>
        <input v-model="form.title" maxlength="255" class="form-input" placeholder="Sum up your event in a few words" />
      </div>
      <div>
        <label class="form-label">Comment</label>
        <textarea v-model="form.comment" rows="3" maxlength="5000" class="form-input w-full" placeholder="What went well? What could be better?"></textarea>
      </div>
      <p v-if="errorMsg" class="text-sm text-coral">{{ errorMsg }}</p>
      <button type="submit" :disabled="!form.rating || submitting" class="btn-primary inline-flex items-center gap-2">
        <AppIcon v-if="submitting" icon="loader" class="w-4 h-4 animate-spin" />
        {{ submitting ? 'Submitting...' : 'Submit Review' }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import api from '@/lib/axios'
import AppIcon from '@/components/ui/AppIcon.vue'
import StarRating from '@/components/reviews/StarRating.vue'

const props = defineProps<{ bookingId: number | string }>()
const emit = defineEmits<{ submitted: [review: any] }>()

type SubKey = 'cleanliness_rating' | 'value_rating' | 'service_rating' | 'location_rating'
const subRatings: { key: SubKey; label: string }[] = [
  { key: 'cleanliness_rating', label: 'Cleanliness' },
  { key: 'value_rating', label: 'Value' },
  { key: 'service_rating', label: 'Service' },
  { key: 'location_rating', label: 'Location' },
]

const loading = ref(true)
const submitting = ref(false)
const errorMsg = ref('')
const errors = ref<Record<string, string[]>>({})
const state = reactive<{ eligible: boolean; review: any | null }>({ eligible: false, review: null })
const form = reactive<Record<SubKey, number | null> & { rating: number; title: string; comment: string }>({
  rating: 0, title: '', comment: '',
  cleanliness_rating: null, value_rating: null, service_rating: null, location_rating: null,
})

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
  }
}

async function submit() {
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
