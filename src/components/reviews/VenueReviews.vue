<template>
  <div>
    <div v-if="loading && !reviews.length" class="py-6 text-center">
      <div class="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
    </div>

    <div v-else-if="!reviews.length">
      <slot name="empty">
        <p class="text-sm text-warm-500 dark:text-warm-400 py-4 text-center">No reviews yet.</p>
      </slot>
    </div>

    <div v-else class="flex flex-col">
      <div v-for="review in reviews" :key="review.id" class="py-4 border-b border-warm-100 dark:border-warm-800 last:border-b-0">
        <div class="flex items-center justify-between gap-3 mb-2">
          <div class="flex items-center gap-2 min-w-0">
            <img v-if="review.client?.avatar" :src="getStorageUrl(review.client.avatar)" :alt="review.client?.name" class="w-8 h-8 rounded-full object-cover" />
            <div v-else class="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 flex items-center justify-center text-sm font-semibold">
              {{ review.client?.name?.charAt(0) || '?' }}
            </div>
            <div class="min-w-0">
              <p class="text-sm font-semibold text-warm-800 dark:text-warm-100 truncate">{{ review.client?.name || 'Guest' }}</p>
              <p class="text-xs text-warm-400">{{ formatDate(review.created_at) }}</p>
            </div>
          </div>
          <StarRating :model-value="review.rating" readonly size="sm" />
        </div>
        <p v-if="review.title" class="text-sm font-semibold text-warm-800 dark:text-warm-100 mb-1">{{ review.title }}</p>
        <p v-if="review.comment" class="text-sm text-warm-600 dark:text-warm-300 whitespace-pre-line">{{ review.comment }}</p>
        <div v-if="review.store_reply" class="mt-3 pl-4 border-l-2 border-primary-300 dark:border-primary-700">
          <p class="text-xs font-semibold text-primary-600 dark:text-primary-400 mb-1">Response from the venue</p>
          <p class="text-sm text-warm-600 dark:text-warm-300 whitespace-pre-line">{{ review.store_reply }}</p>
        </div>
      </div>

      <button v-if="page < lastPage" type="button" :disabled="loading" @click="loadMore" class="btn-outline mt-4 self-center text-sm">
        {{ loading ? 'Loading...' : 'Show more reviews' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import api from '@/lib/axios'
import { getStorageUrl } from '@/lib/storageUrl'
import StarRating from '@/components/reviews/StarRating.vue'

const props = defineProps<{ venueId: number | string }>()

const reviews = ref<any[]>([])
const page = ref(1)
const lastPage = ref(1)
const loading = ref(false)

async function fetchPage(p: number) {
  loading.value = true
  try {
    const { data } = await api.get(`/venues/${props.venueId}/reviews`, { params: { page: p, per_page: 5 } })
    const pg = data.data
    reviews.value = p === 1 ? pg.data : [...reviews.value, ...pg.data]
    page.value = pg.current_page
    lastPage.value = pg.last_page
  } catch {
    if (p === 1) reviews.value = []
  } finally {
    loading.value = false
  }
}

function loadMore() { fetchPage(page.value + 1) }

function formatDate(d: string) {
  return d ? new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
}

watch(() => props.venueId, () => fetchPage(1))
onMounted(() => fetchPage(1))
</script>
