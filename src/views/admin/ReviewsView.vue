<template>
  <div class="space-y-5">
    <header class="page-header !mb-0">
      <div>
        <h1 class="page-title">Reviews</h1>
        <p class="page-subtitle">Moderate customer reviews. Hidden reviews are excluded from venue ratings.</p>
      </div>
    </header>

    <AdminReviewInsights
      ref="insightsRef"
      :busy-id="busyId"
      :flag-filter="flag"
      @toggle="toggleById"
      @remove="askRemoveById"
      @filter-flag="setFlag"
    />

    <section class="card overflow-hidden">
      <nav class="tabs px-2 sm:px-4" role="tablist" aria-label="Visibility">
        <button role="tab" class="tab" :aria-selected="approved === ''" @click="approved = ''; load(1)">All</button>
        <button role="tab" class="tab" :aria-selected="approved === '1'" @click="approved = '1'; load(1)">Visible</button>
        <button role="tab" class="tab" :aria-selected="approved === '0'" @click="approved = '0'; load(1)">Hidden</button>
      </nav>
      <DataToolbar v-model:search="search" placeholder="Search venue, customer or text" :count="loading ? undefined : total" noun="reviews" @update:search="load(1)">
        <select v-model="rating" class="form-select" aria-label="Rating" @change="load(1)">
          <option value="">Any rating</option>
          <option v-for="n in [5, 4, 3, 2, 1]" :key="n" :value="String(n)">{{ n }} star{{ n === 1 ? '' : 's' }}</option>
        </select>
        <template v-if="insightsAvailable">
          <select v-model="sentiment" class="form-select" aria-label="Sentiment" @change="load(1)">
            <option value="">Any sentiment</option>
            <option value="positive">Positive</option>
            <option value="neutral">Neutral</option>
            <option value="negative">Negative</option>
          </select>
          <button v-if="flag" type="button" class="btn-secondary btn-sm" @click="setFlag('')">{{ humanFlag(flag) }} <AppIcon icon="x" class="w-3.5 h-3.5" /></button>
        </template>
      </DataToolbar>

      <div v-if="loading" class="p-4 space-y-3" aria-busy="true"><div v-for="i in 6" :key="i" class="skeleton h-14 w-full" /></div>

      <div v-else-if="loadError" class="empty-state">
        <div class="empty-state-icon"><AppIcon icon="alert-circle" class="w-5 h-5" /></div>
        <p class="empty-state-title">Couldn't load reviews</p>
        <p class="empty-state-desc">{{ loadError }}</p>
        <div class="empty-state-actions"><button class="btn-primary" @click="load(page)">Try again</button></div>
      </div>

      <div v-else-if="!reviews.length" class="empty-state">
        <div class="empty-state-icon"><AppIcon icon="message-star" class="w-5 h-5" /></div>
        <p class="empty-state-title">No reviews found</p>
        <p class="empty-state-desc">Try a different search or filter.</p>
        <div class="empty-state-actions"><button class="btn-secondary" @click="clearFilters">Clear filters</button></div>
      </div>

      <template v-else>
        <!-- Phone -->
        <ul class="md:hidden divide-y divide-line">
          <li v-for="r in reviews" :key="r.id" class="p-4">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <p class="text-sm font-medium text-ink truncate">{{ r.venue?.name || '—' }}</p>
                <p class="text-xs text-ink-muted truncate">{{ r.client?.name }} · {{ formatDate(r.created_at) }}</p>
              </div>
              <span :class="r.is_approved ? 'badge-confirmed' : 'badge-cancelled'" class="shrink-0">{{ r.is_approved ? 'Visible' : 'Hidden' }}</span>
            </div>
            <div class="flex items-center gap-2 mt-2"><StarRating :model-value="r.rating" readonly size="sm" /><span class="sr-only">{{ r.rating }} out of 5</span>
              <span v-if="r.insight?.label" :class="SENT_BADGE[r.insight.label] || 'badge-neutral'">{{ humanize(r.insight.label) }}</span>
            </div>
            <p v-if="r.title" class="text-sm font-medium text-ink mt-1">{{ r.title }}</p>
            <p class="text-sm text-ink-secondary line-clamp-3">{{ r.comment || '—' }}</p>
            <div v-if="r.insight?.flags?.length" class="flex flex-wrap gap-1 mt-1.5"><span v-for="f in r.insight.flags" :key="f" class="badge-warning">{{ humanFlag(f) }}</span></div>
            <div class="flex gap-2 mt-3">
              <button class="btn-secondary btn-sm" :disabled="busyId === r.id" @click="toggle(r)"><AppIcon :icon="r.is_approved ? 'eye-off' : 'eye'" class="w-4 h-4" />{{ r.is_approved ? 'Hide' : 'Approve' }}</button>
              <button class="btn-danger-ghost btn-sm" :disabled="busyId === r.id" @click="askRemove(r)"><AppIcon icon="trash" class="w-4 h-4" />Delete</button>
            </div>
          </li>
        </ul>

        <!-- Desktop -->
        <div class="hidden md:block table-wrapper max-h-[calc(100vh-280px)] min-h-[320px] scrollbar-thin">
          <table class="data-table">
            <thead>
              <tr><th>Venue &amp; store</th><th>Customer</th><th>Rating</th><th class="w-[40%]">Review</th><th>Status</th><th class="cell-actions"><span class="sr-only">Actions</span></th></tr>
            </thead>
            <tbody>
              <tr v-for="r in reviews" :key="r.id" class="align-top">
                <td>
                  <p class="cell-primary truncate max-w-[200px]">{{ r.venue?.name || '—' }}</p>
                  <p class="text-xs text-ink-muted truncate max-w-[200px]">{{ r.venue?.store?.name }}</p>
                </td>
                <td>
                  <p class="text-ink truncate max-w-[180px]">{{ r.client?.name }}</p>
                  <p class="text-xs text-ink-muted truncate max-w-[200px]">{{ r.client?.email }}</p>
                </td>
                <td class="whitespace-nowrap"><StarRating :model-value="r.rating" readonly size="sm" /><span class="sr-only">{{ r.rating }} out of 5</span></td>
                <td class="min-w-[280px]">
                  <p v-if="r.title" class="font-medium text-ink">{{ r.title }}</p>
                  <p class="text-ink-secondary line-clamp-3">{{ r.comment || '—' }}</p>
                  <p v-if="r.store_reply" class="text-xs text-brand-text mt-1 line-clamp-2">Reply: {{ r.store_reply }}</p>
                  <div class="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <span class="text-xs text-ink-muted">{{ formatDate(r.created_at) }}</span>
                    <span v-if="r.insight?.label" :class="SENT_BADGE[r.insight.label] || 'badge-neutral'">{{ humanize(r.insight.label) }}<template v-if="r.insight.sentiment != null"> · {{ toScore(r.insight.sentiment) }}</template></span>
                    <span v-for="f in r.insight?.flags || []" :key="f" class="badge-warning">{{ humanFlag(f) }}</span>
                  </div>
                </td>
                <td><span :class="r.is_approved ? 'badge-confirmed' : 'badge-cancelled'">{{ r.is_approved ? 'Visible' : 'Hidden' }}</span></td>
                <td class="cell-actions">
                  <div class="inline-flex items-center gap-1">
                    <button class="btn-ghost btn-sm" :disabled="busyId === r.id" @click="toggle(r)"><AppIcon :icon="r.is_approved ? 'eye-off' : 'eye'" class="w-4 h-4" />{{ r.is_approved ? 'Hide' : 'Approve' }}</button>
                    <button class="btn-icon btn-icon-sm hover:!text-danger-text" :disabled="busyId === r.id" aria-label="Delete review" title="Delete" @click="askRemove(r)"><AppIcon icon="trash" class="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <TablePager :page="page" :per-page="perPage" :total="total" @update:page="load" />
      </template>
    </section>

    <ConfirmDialog v-model:visible="showRemove" title="Delete review" confirm-label="Delete review" tone="danger" :loading="busyId !== null" @confirm="doRemove">
      Delete this review permanently from public view?
      <span v-if="removeTarget?.title" class="block mt-1 text-ink">“{{ removeTarget.title }}”</span>
    </ConfirmDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { toast } from 'vue-sonner'
import api from '@/lib/axios'
import { formatDate } from '@/lib/format'
import AppIcon from '@/components/ui/AppIcon.vue'
import StarRating from '@/components/reviews/StarRating.vue'
import DataToolbar from '@/components/admin/DataToolbar.vue'
import ConfirmDialog from '@/components/admin/ConfirmDialog.vue'
import AdminReviewInsights from '@/components/admin/AdminReviewInsights.vue'
import TablePager from '@/components/dashboard/TablePager.vue'
import { humanFlag } from '@/components/dashboard/SentimentBits'
import { humanize } from '@/components/dashboard/metrics'

const reviews = ref<any[]>([])
const loading = ref(true)
const loadError = ref('')
const page = ref(1)
const perPage = ref(15)
const total = ref(0)
const search = ref('')
const approved = ref('')
const rating = ref('')
const sentiment = ref('')
const flag = ref('')
const busyId = ref<number | null>(null)
const insightsRef = ref<InstanceType<typeof AdminReviewInsights> | null>(null)
const insightsAvailable = computed(() => !!insightsRef.value?.available)

const SENT_BADGE: Record<string, string> = { positive: 'badge-success', neutral: 'badge-neutral', negative: 'badge-danger' }
/** Insight sentiment is −1..1 on each review; show it on the same 0..100 scale as the summaries. */
function toScore(s: number) {
  const n = Number(s)
  return Math.round(n <= 1 && n >= -1 ? 50 * (n + 1) : n)
}

async function load(p = 1) {
  loading.value = true
  loadError.value = ''
  try {
    const { data } = await api.get('/admin/reviews', {
      params: {
        page: p,
        search: search.value || undefined,
        approved: approved.value || undefined,
        rating: rating.value || undefined,
        sentiment: sentiment.value || undefined,
        flag: flag.value || undefined,
      },
    })
    reviews.value = data.data.data
    page.value = data.data.current_page
    perPage.value = data.data.per_page || 15
    total.value = data.data.total ?? reviews.value.length
  } catch (e: any) {
    reviews.value = []
    loadError.value = e.response?.data?.message || 'Please check your connection and try again.'
  } finally {
    loading.value = false
  }
}

function setFlag(f: string) {
  flag.value = f
  load(1)
}

function clearFilters() {
  search.value = ''; approved.value = ''; rating.value = ''; sentiment.value = ''; flag.value = ''
  load(1)
}

async function toggle(r: any) {
  busyId.value = r.id
  try {
    const { data } = await api.patch(`/admin/reviews/${r.id}/toggle-approval`)
    r.is_approved = data.data.is_approved
    insightsRef.value?.patchFlagged(r.id, { is_approved: r.is_approved })
    toast.success(r.is_approved ? 'Review is visible again.' : 'Review hidden.')
  } catch (e: any) {
    toast.error(e.response?.data?.message || 'Could not update this review.')
  } finally {
    busyId.value = null
  }
}

/** From the insights "flagged" list (same endpoint as the table row action). */
async function toggleById(item: any) {
  const row = reviews.value.find(x => x.id === item.review_id)
  if (row) return toggle(row)
  busyId.value = item.review_id
  try {
    const { data } = await api.patch(`/admin/reviews/${item.review_id}/toggle-approval`)
    insightsRef.value?.patchFlagged(item.review_id, { is_approved: data.data.is_approved })
    toast.success(data.data.is_approved ? 'Review is visible again.' : 'Review hidden.')
  } catch (e: any) {
    toast.error(e.response?.data?.message || 'Could not update this review.')
  } finally {
    busyId.value = null
  }
}

const showRemove = ref(false)
const removeTarget = ref<any>(null)
function askRemove(r: any) { removeTarget.value = { id: r.id, title: r.title }; showRemove.value = true }
function askRemoveById(item: any) { removeTarget.value = { id: item.review_id, title: item.title }; showRemove.value = true }

async function doRemove() {
  const id = removeTarget.value?.id
  if (!id) return
  busyId.value = id
  try {
    await api.delete(`/admin/reviews/${id}`)
    reviews.value = reviews.value.filter(x => x.id !== id)
    total.value = Math.max(0, total.value - 1)
    insightsRef.value?.patchFlagged(id, null)
    showRemove.value = false
    toast.success('Review deleted.')
  } catch (e: any) {
    toast.error(e.response?.data?.message || 'Could not delete this review.')
  } finally {
    busyId.value = null
  }
}

onMounted(() => load(1))
</script>
