<template>
  <div class="content-container">
    <div class="flex flex-wrap items-center justify-between gap-4 mb-8">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-warm-900 dark:text-warm-50">Reviews</h1>
        <p class="text-warm-500 dark:text-warm-400 mt-1">What customers say about your venues. Replies are shown publicly.</p>
      </div>
      <select v-model="replied" class="form-select w-auto" @change="load(1)">
        <option value="">All reviews</option>
        <option value="no">Awaiting reply</option>
        <option value="yes">Replied</option>
      </select>
    </div>

    <div v-if="loading" class="card p-12 text-center">
      <div class="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
    </div>

    <div v-else-if="!reviews.length" class="card p-12 text-center">
      <div class="w-14 h-14 rounded-2xl bg-warm-100 dark:bg-warm-800 flex items-center justify-center mx-auto mb-4">
        <AppIcon icon="message-star" class="w-7 h-7 text-warm-400" />
      </div>
      <p class="font-medium text-warm-700 dark:text-warm-300">No reviews yet</p>
      <p class="text-sm text-warm-500 dark:text-warm-400 mt-1">Customers can review a venue after their event.</p>
    </div>

    <div v-else class="space-y-4">
      <div v-for="r in reviews" :key="r.id" class="card p-5">
        <div class="flex flex-wrap items-start justify-between gap-3 mb-2">
          <div>
            <p class="text-sm font-semibold text-warm-900 dark:text-warm-50">{{ r.client?.name || 'Customer' }}
              <span class="font-normal text-warm-400">on</span>
              <RouterLink :to="`/venues/${r.venue_id}`" class="text-primary-600 dark:text-primary-400 hover:underline">{{ r.venue?.name }}</RouterLink>
            </p>
            <p class="text-xs text-warm-400">{{ formatDate(r.created_at) }}<span v-if="r.booking?.booking_number"> &middot; {{ r.booking.booking_number }}</span></p>
          </div>
          <div class="flex items-center gap-2">
            <span v-if="!r.is_approved" class="badge-warm">Hidden by admin</span>
            <StarRating :model-value="r.rating" readonly size="sm" />
          </div>
        </div>
        <p v-if="r.title" class="font-semibold text-sm text-warm-800 dark:text-warm-100">{{ r.title }}</p>
        <p v-if="r.comment" class="text-sm text-warm-600 dark:text-warm-300 whitespace-pre-line">{{ r.comment }}</p>
        <div v-if="subRatings(r).length" class="flex flex-wrap gap-3 mt-2 text-xs text-warm-500">
          <span v-for="s in subRatings(r)" :key="s.label">{{ s.label }}: {{ s.value }}/5</span>
        </div>

        <!-- Reply -->
        <div class="mt-4">
          <div v-if="r.store_reply && replyingId !== r.id" class="pl-4 border-l-2 border-primary-300 dark:border-primary-700">
            <p class="text-xs font-semibold text-primary-600 dark:text-primary-400 mb-1">Your reply &middot; {{ formatDate(r.store_replied_at) }}</p>
            <p class="text-sm text-warm-600 dark:text-warm-300 whitespace-pre-line">{{ r.store_reply }}</p>
            <button type="button" class="btn-ghost text-xs mt-1 !px-0" @click="startReply(r)">Edit reply</button>
          </div>
          <button v-else-if="replyingId !== r.id" type="button" class="btn-outline text-sm inline-flex items-center gap-1.5" @click="startReply(r)">
            <AppIcon icon="reply" class="w-4 h-4" /> Reply
          </button>
          <form v-else @submit.prevent="sendReply(r)" class="space-y-2">
            <textarea v-model="replyText" rows="3" maxlength="2000" required class="form-input w-full" placeholder="Thank the customer or respond to their feedback"></textarea>
            <p v-if="errorMsg" class="text-sm text-coral">{{ errorMsg }}</p>
            <div class="flex gap-2">
              <button type="submit" :disabled="sending || !replyText.trim()" class="btn-primary text-sm">{{ sending ? 'Saving...' : 'Post reply' }}</button>
              <button type="button" class="btn-ghost text-sm" @click="replyingId = null">Cancel</button>
            </div>
          </form>
        </div>
      </div>

      <div v-if="lastPage > 1" class="flex items-center justify-center gap-3 pt-2">
        <button class="btn-outline text-sm" :disabled="page <= 1" @click="load(page - 1)">Previous</button>
        <span class="text-sm text-warm-500">Page {{ page }} of {{ lastPage }}</span>
        <button class="btn-outline text-sm" :disabled="page >= lastPage" @click="load(page + 1)">Next</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import api from '@/lib/axios'
import AppIcon from '@/components/ui/AppIcon.vue'
import StarRating from '@/components/reviews/StarRating.vue'

const reviews = ref<any[]>([])
const loading = ref(true)
const page = ref(1)
const lastPage = ref(1)
const replied = ref('')
const replyingId = ref<number | null>(null)
const replyText = ref('')
const sending = ref(false)
const errorMsg = ref('')

async function load(p = 1) {
  loading.value = true
  try {
    const { data } = await api.get('/store/reviews', { params: { page: p, replied: replied.value || undefined } })
    reviews.value = data.data.data
    page.value = data.data.current_page
    lastPage.value = data.data.last_page
  } catch {
    reviews.value = []
  } finally {
    loading.value = false
  }
}

function startReply(r: any) {
  replyingId.value = r.id
  replyText.value = r.store_reply || ''
  errorMsg.value = ''
}

async function sendReply(r: any) {
  sending.value = true
  errorMsg.value = ''
  try {
    const { data } = await api.post(`/store/reviews/${r.id}/reply`, { reply: replyText.value.trim() })
    Object.assign(r, { store_reply: data.data.store_reply, store_replied_at: data.data.store_replied_at })
    replyingId.value = null
  } catch (e: any) {
    errorMsg.value = e.response?.data?.message || 'Could not save reply.'
  } finally {
    sending.value = false
  }
}

function subRatings(r: any) {
  return [
    ['Cleanliness', r.cleanliness_rating], ['Value', r.value_rating],
    ['Service', r.service_rating], ['Location', r.location_rating],
  ].filter(([, v]) => v).map(([label, value]) => ({ label, value }))
}

function formatDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
}

onMounted(() => load(1))
</script>
