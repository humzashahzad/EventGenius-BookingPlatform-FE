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
      :is-pending="(id: number) => actions.isPending(id)"
      :flag-filter="flag"
      @toggle="toggleById"
      @remove="askRemoveById"
      @filter-flag="setFlag"
    />

    <section class="card overflow-hidden">
      <nav class="tabs px-2 sm:px-4" role="tablist" aria-label="Visibility">
        <button role="tab" class="tab" :aria-selected="approved === ''" @click="setApproved('')">All</button>
        <button role="tab" class="tab" :aria-selected="approved === '1'" @click="setApproved('1')">Visible</button>
        <button role="tab" class="tab" :aria-selected="approved === '0'" @click="setApproved('0')">Hidden</button>
      </nav>
      <DataToolbar v-model:search="search" placeholder="Search venue, customer or text" :count="loading ? undefined : table.total.value" noun="reviews" @update:search="table.reset()">
        <SelectInput v-model="rating" :options="[{ value: '', label: 'Any rating' }, ...[5, 4, 3, 2, 1].map(n => ({ value: String(n), label: `${n} star${n === 1 ? '' : 's'}` }))]" aria-label="Rating" @change="table.reset()" />
        <template v-if="insightsAvailable">
          <SelectInput v-model="sentiment" :options="[{ value: '', label: 'Any sentiment' }, { value: 'positive', label: 'Positive' }, { value: 'neutral', label: 'Neutral' }, { value: 'negative', label: 'Negative' }]" aria-label="Sentiment" @change="table.reset()" />
          <button v-if="flag" type="button" class="btn-secondary" @click="setFlag('')">{{ humanFlag(flag) }} <AppIcon icon="x" class="w-3.5 h-3.5" /></button>
        </template>
      </DataToolbar>

      <div v-if="loading" class="p-4 space-y-3" aria-busy="true"><div v-for="i in 6" :key="i" class="skeleton h-14 w-full" /></div>

      <div v-else-if="loadError" class="empty-state">
        <div class="empty-state-icon"><AppIcon icon="alert-circle" class="w-5 h-5" /></div>
        <p class="empty-state-title">Couldn't load reviews</p>
        <p class="empty-state-desc">{{ loadError }}</p>
        <div class="empty-state-actions"><button class="btn-primary" @click="table.load()">Try again</button></div>
      </div>

      <div v-else-if="!table.rows.value.length" class="empty-state">
        <div class="empty-state-icon"><AppIcon icon="message-star" class="w-5 h-5" /></div>
        <p class="empty-state-title">No reviews found</p>
        <p class="empty-state-desc">Try a different search or filter.</p>
        <div class="empty-state-actions"><button class="btn-secondary" @click="clearFilters">Clear filters</button></div>
      </div>

      <ListBody v-else :busy="table.fetching.value">
        <!-- Phone -->
        <ul class="md:hidden divide-y divide-line">
          <li v-for="r in table.rows.value" :key="r.id" class="p-4">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <p class="text-sm font-medium text-ink truncate">{{ r.venue?.name || '—' }}</p>
                <p class="text-xs text-ink-muted truncate">{{ r.client?.name }} · {{ formatDate(r.created_at) }}</p>
              </div>
              <span :class="r.is_approved ? 'badge-confirmed' : 'badge-cancelled'" class="shrink-0">{{ r.is_approved ? 'Visible' : 'Hidden' }}</span>
            </div>
            <div class="flex items-center gap-2 mt-2"><StarRating :model-value="r.rating" readonly size="sm" />
              <span v-if="r.insight?.label" :class="SENT_BADGE[r.insight.label] || 'badge-neutral'">{{ humanize(r.insight.label) }}</span>
            </div>
            <p v-if="r.title" class="text-sm font-medium text-ink mt-1">{{ r.title }}</p>
            <p class="text-sm text-ink-secondary line-clamp-3">{{ r.comment || '—' }}</p>
            <div v-if="r.insight?.flags?.length" class="flex flex-wrap gap-1 mt-1.5"><span v-for="f in r.insight.flags" :key="f" class="badge-warning">{{ humanFlag(f) }}</span></div>
            <div class="flex gap-2 mt-3">
              <button class="btn-secondary btn-sm" :disabled="actions.isPending(r.id)" :aria-busy="actions.isPending(r.id, 'toggle')" @click="toggle(r)"><AppIcon :icon="r.is_approved ? 'eye-off' : 'eye'" class="w-4 h-4" />{{ r.is_approved ? 'Hide' : 'Approve' }}</button>
              <button class="btn-danger-ghost btn-sm" :disabled="actions.isPending(r.id)" @click="askRemove(r)"><AppIcon icon="trash" class="w-4 h-4" />Delete</button>
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
              <tr v-for="r in table.rows.value" :key="r.id" class="align-top">
                <td>
                  <p class="cell-primary truncate max-w-[200px]">{{ r.venue?.name || '—' }}</p>
                  <p class="text-xs text-ink-muted truncate max-w-[200px]">{{ r.venue?.store?.name }}</p>
                </td>
                <td>
                  <p class="text-ink truncate max-w-[180px]">{{ r.client?.name }}</p>
                  <p class="text-xs text-ink-muted truncate max-w-[200px]">{{ r.client?.email }}</p>
                </td>
                <td class="whitespace-nowrap"><StarRating :model-value="r.rating" readonly size="sm" /></td>
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
                    <button class="btn-ghost btn-sm" :disabled="actions.isPending(r.id)" :aria-busy="actions.isPending(r.id, 'toggle')" @click="toggle(r)"><AppIcon :icon="r.is_approved ? 'eye-off' : 'eye'" class="w-4 h-4" />{{ r.is_approved ? 'Hide' : 'Approve' }}</button>
                    <button class="btn-icon btn-icon-sm hover:!text-danger-text" :disabled="actions.isPending(r.id)" aria-label="Delete review" title="Delete" @click="askRemove(r)"><AppIcon icon="trash" class="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <TablePager :page="table.page.value" :per-page="table.perPage.value || 15" :total="table.total.value" @update:page="table.goTo" />
      </ListBody>
    </section>

    <ConfirmDialog v-model:visible="showRemove" title="Delete review" confirm-label="Delete review" tone="danger" @confirm="doRemove">
      Delete this review permanently from public view?
      <span v-if="removeTarget?.title" class="block mt-1 text-ink">“{{ removeTarget.title }}”</span>
    </ConfirmDialog>
  </div>
</template>

<script setup lang="ts">
import { SelectInput } from '@/components/forms'
import { ref, computed } from 'vue'
import api from '@/lib/axios'
import { formatDate } from '@/lib/format'
import AppIcon from '@/components/ui/AppIcon.vue'
import StarRating from '@/components/reviews/StarRating.vue'
import DataToolbar from '@/components/admin/DataToolbar.vue'
import ConfirmDialog from '@/components/admin/ConfirmDialog.vue'
import ListBody from '@/components/admin/ListBody.vue'
import AdminReviewInsights from '@/components/admin/AdminReviewInsights.vue'
import TablePager from '@/components/dashboard/TablePager.vue'
import { humanFlag } from '@/components/dashboard/SentimentBits'
import { humanize } from '@/components/dashboard/metrics'
import { useRowActions } from '@/composables/useRowActions'
import { useServerTable, type ServerPage } from '@/composables/useServerTable'
import { useLiveRefresh } from '@/composables/useLiveRefresh'

const search = ref('')
const approved = ref('')
const rating = ref('')
const sentiment = ref('')
const flag = ref('')
const insightsRef = ref<InstanceType<typeof AdminReviewInsights> | null>(null)
const insightsAvailable = computed(() => !!insightsRef.value?.available)

const SENT_BADGE: Record<string, string> = { positive: 'badge-success', neutral: 'badge-neutral', negative: 'badge-danger' }
/** Insight sentiment is −1..1 on each review; show it on the same 0..100 scale as the summaries. */
function toScore(s: number) {
  const n = Number(s)
  return Math.round(n <= 1 && n >= -1 ? 50 * (n + 1) : n)
}

const actions = useRowActions()
const table = useServerTable<any>(async (): Promise<ServerPage<any>> => {
  const { data } = await api.get('/admin/reviews', {
    params: {
      page: table.page.value,
      search: search.value || undefined,
      approved: approved.value || undefined,
      rating: rating.value || undefined,
      sentiment: sentiment.value || undefined,
      flag: flag.value || undefined,
    },
  })
  const rows = data.data.data
  return { rows, total: data.data.total ?? rows.length, page: data.data.current_page, perPage: data.data.per_page || 15 }
}, { lock: r => actions.isPending(r.id) })
const loading = table.loading
const loadError = table.error

function setApproved(v: string) {
  approved.value = v
  table.reset()
}

function setFlag(f: string) {
  flag.value = f
  table.reset()
}

function clearFilters() {
  search.value = ''; approved.value = ''; rating.value = ''; sentiment.value = ''; flag.value = ''
  table.reset()
}

/** Hide / show a review, from the table or the insights "flagged" list (same endpoint). */
function toggleReview(id: number, wasApproved: boolean) {
  const row = () => table.find(id)
  const set = (v: boolean) => {
    const r = row()
    if (r) r.is_approved = v
    insightsRef.value?.patchFlagged(id, { is_approved: v })
  }
  actions.run(id, {
    apply: () => set(!wasApproved),
    request: () => api.patch(`/admin/reviews/${id}/toggle-approval`),
    onSuccess: ({ data }: any) => { if (typeof data?.data?.is_approved === 'boolean') set(data.data.is_approved) },
    rollback: () => set(wasApproved),
    success: () => (wasApproved ? 'Review hidden' : 'Review is visible again'),
    error: 'Could not update this review.',
  }, 'toggle')
}

function toggle(r: any) { toggleReview(r.id, !!r.is_approved) }
function toggleById(item: any) {
  const row = table.find(item.review_id)
  toggleReview(item.review_id, row ? !!row.is_approved : !!item.is_approved)
}

const showRemove = ref(false)
const removeTarget = ref<any>(null)
function askRemove(r: any) { removeTarget.value = { id: r.id, title: r.title }; showRemove.value = true }
function askRemoveById(item: any) { removeTarget.value = { id: item.review_id, title: item.title }; showRemove.value = true }

function doRemove() {
  const id = removeTarget.value?.id
  if (!id) return
  showRemove.value = false
  let restoreRow = () => {}
  let restoreFlagged = () => {}
  actions.run(id, {
    apply: () => {
      restoreRow = table.remove(id)
      restoreFlagged = insightsRef.value?.removeFlagged(id) ?? (() => {})
    },
    request: () => api.delete(`/admin/reviews/${id}`),
    rollback: () => { restoreRow(); restoreFlagged() },
    success: 'Review deleted',
    error: 'Could not delete this review.',
    after: () => { table.refresh(); insightsRef.value?.reload() },
  }, 'delete')
}

// New reviews and replies arrive quietly in the table and the insights.
useLiveRefresh(['review'], () => { table.refresh(); insightsRef.value?.reload() })

table.load()
</script>
