<template>
  <div>
    <div v-if="loading && !reviews.length" class="divide-y divide-line" aria-busy="true" aria-label="Loading reviews">
      <div v-for="i in 3" :key="i" class="py-4 space-y-2">
        <div class="flex items-center gap-2"><div class="skeleton h-9 w-9 !rounded-full"></div><div class="skeleton h-3.5 w-32"></div></div>
        <div class="skeleton h-3 w-full"></div><div class="skeleton h-3 w-2/3"></div>
      </div>
    </div>

    <div v-else-if="!reviews.length">
      <slot name="empty">
        <p class="text-sm text-ink-muted py-4 text-center">No reviews yet.</p>
      </slot>
    </div>

    <div v-else class="flex flex-col">
      <div v-for="review in reviews" :key="review.id" class="py-4 border-b border-line last:border-b-0">
        <div class="flex items-center justify-between gap-3 mb-2">
          <div class="flex items-center gap-2 min-w-0">
            <img v-if="review.client?.avatar" :src="getStorageUrl(review.client.avatar)" :alt="review.client?.name" class="w-9 h-9 rounded-full object-cover" />
            <div v-else class="avatar" aria-hidden="true">
              {{ review.client?.name?.charAt(0) || '?' }}
            </div>
            <div class="min-w-0">
              <p class="text-sm font-semibold text-ink truncate">{{ review.client?.name || 'Guest' }}</p>
              <p class="text-xs text-ink-muted">{{ formatDate(review.created_at) }}</p>
            </div>
          </div>
          <StarRating :model-value="review.rating" readonly size="sm" />
        </div>
        <p v-if="review.title" class="text-sm font-semibold text-ink mb-1">{{ review.title }}</p>
        <p v-if="review.comment" class="text-sm leading-relaxed text-ink-secondary whitespace-pre-line">{{ review.comment }}</p>
        <div v-if="review.store_reply" class="mt-3 rounded-lg bg-surface-sunken border border-line px-4 py-3">
          <p class="text-xs font-semibold text-ink mb-1">Response from the venue</p>
          <p class="text-sm text-ink-secondary whitespace-pre-line">{{ review.store_reply }}</p>
        </div>
      </div>

      <button v-if="page < lastPage" type="button" :disabled="loading" @click="loadMore" class="btn-secondary btn-sm mt-3 mb-2 self-center">
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
