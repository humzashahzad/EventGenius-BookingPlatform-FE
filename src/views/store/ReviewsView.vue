<template>
  <div class="space-y-6">
    <header class="page-header !mb-0">
      <div>
        <h1 class="page-title">Reviews</h1>
        <p class="page-subtitle">What customers say about your venues. Your replies are shown publicly.</p>
      </div>
    </header>

    <!-- Summary -->
    <section aria-label="Review summary" class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <KpiTile label="Average rating" icon="star" tone="warning" :loading="venuesLoading"
        :value="avgRating ? avgRating.toFixed(2) : '—'" :helper="`across ${venues.length} venue${venues.length === 1 ? '' : 's'}`" />
      <KpiTile label="Total reviews" icon="message" tone="info" :loading="venuesLoading"
        :value="totalReviews.toLocaleString('en-PK')" helper="approved and visible" />
      <KpiTile label="Awaiting reply" icon="reply" tone="danger" :loading="awaiting === null"
        :value="awaiting ?? 0" :helper="awaiting ? 'Replying builds trust' : 'All caught up'" />
      <KpiTile label="Reply rate" icon="checks" tone="success" :loading="awaiting === null || venuesLoading"
        :value="replyRate" helper="of all reviews answered" />
    </section>

    <!-- AI insights (hidden when the endpoint isn't available) -->
    <StoreReviewInsights ref="insightsRef" @reply="openReplyDialog" />

    <!-- List -->
    <section class="card overflow-hidden">
      <nav class="tabs px-2 sm:px-4" role="tablist" aria-label="Filter reviews">
        <button role="tab" class="tab" :aria-selected="replied === ''" @click="setReplied('')">All</button>
        <button role="tab" class="tab" :aria-selected="replied === 'no'" @click="setReplied('no')">Awaiting reply <span v-if="awaiting" class="tab-count">{{ awaiting }}</span></button>
        <button role="tab" class="tab" :aria-selected="replied === 'yes'" @click="setReplied('yes')">Replied</button>
      </nav>
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 border-b border-line">
        <p class="text-sm text-ink-muted num" aria-live="polite">{{ loading ? 'Loading…' : `${total.toLocaleString('en-PK')} review${total === 1 ? '' : 's'}` }}</p>
        <select v-model="venueId" class="form-select sm:!w-56" aria-label="Venue" @change="load(1)">
          <option value="">All venues</option>
          <option v-for="v in venues" :key="v.id" :value="String(v.id)">{{ v.name }}</option>
        </select>
      </div>

      <div v-if="loading" class="divide-y divide-line" aria-busy="true">
        <div v-for="i in 4" :key="i" class="p-5 space-y-2"><div class="skeleton h-4 w-48" /><div class="skeleton h-3 w-full" /><div class="skeleton h-3 w-2/3" /></div>
      </div>

      <div v-else-if="loadError" class="empty-state">
        <div class="empty-state-icon"><AppIcon icon="alert-circle" class="w-5 h-5" /></div>
        <p class="empty-state-title">Couldn't load reviews</p>
        <p class="empty-state-desc">{{ loadError }}</p>
        <div class="empty-state-actions"><button class="btn-primary" @click="load(page)">Try again</button></div>
      </div>

      <div v-else-if="!reviews.length" class="empty-state">
        <div class="empty-state-icon"><AppIcon icon="message-star" class="w-5 h-5" /></div>
        <p class="empty-state-title">{{ replied === 'no' ? 'No reviews waiting for a reply' : 'No reviews yet' }}</p>
        <p class="empty-state-desc">{{ replied === 'no' ? 'Nice — you have answered every review.' : 'Customers can review a venue after their event.' }}</p>
        <div class="empty-state-actions">
          <button v-if="replied || venueId" class="btn-secondary" @click="venueId = ''; setReplied('')">Show all reviews</button>
          <RouterLink v-else to="/shop/bookings?status=completed" class="btn-secondary">Completed bookings</RouterLink>
        </div>
      </div>

      <ul v-else class="divide-y divide-line">
        <li v-for="r in reviews" :key="r.id" class="p-4 sm:p-5">
          <div class="flex items-start gap-3">
            <img v-if="r.client?.avatar" :src="getStorageUrl(r.client.avatar)" alt="" class="w-9 h-9 rounded-full object-cover shrink-0" loading="lazy" />
            <span v-else class="avatar w-9 h-9 text-xs shrink-0">{{ initials(r.client?.name) }}</span>
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                <div class="min-w-0">
                  <p class="text-sm font-medium text-ink">{{ r.client?.name || 'Customer' }}
                    <span class="font-normal text-ink-muted"> on </span>
                    <RouterLink :to="`/venues/${r.venue_id}`" class="link">{{ r.venue?.name }}</RouterLink>
                  </p>
                  <p class="text-xs text-ink-muted">{{ formatDate(r.created_at) }}<span v-if="r.booking?.booking_number"> · <span class="ref">{{ r.booking.booking_number }}</span></span></p>
                </div>
                <div class="flex items-center gap-2">
                  <span v-if="!r.is_approved" class="badge-neutral">Hidden by admin</span>
                  <StarRating :model-value="r.rating" readonly size="sm" />
                </div>
              </div>
              <p v-if="r.title" class="font-medium text-sm text-ink mt-2">{{ r.title }}</p>
              <p v-if="r.comment" class="text-sm text-ink-secondary whitespace-pre-line mt-0.5">{{ r.comment }}</p>
              <div v-if="subRatings(r).length" class="flex flex-wrap gap-1.5 mt-2">
                <span v-for="s in subRatings(r)" :key="s.label" class="badge-neutral num">{{ s.label }} {{ s.value }}/5</span>
              </div>

              <!-- Reply -->
              <div class="mt-3">
                <div v-if="r.store_reply && replyingId !== r.id" class="reply-block">
                  <div class="flex items-center justify-between gap-2">
                    <p class="text-xs font-semibold text-brand-text">Your reply · {{ formatDate(r.store_replied_at) }}</p>
                    <button type="button" class="btn-ghost btn-sm" @click="startReply(r)"><AppIcon icon="edit" class="w-3.5 h-3.5" />Edit</button>
                  </div>
                  <p class="text-sm text-ink-secondary whitespace-pre-line">{{ r.store_reply }}</p>
                </div>
                <button v-else-if="replyingId !== r.id" type="button" class="btn-secondary btn-sm" @click="startReply(r)">
                  <AppIcon icon="reply" class="w-4 h-4" />Reply
                </button>
                <form v-else @submit.prevent="sendReply(r)" class="space-y-2">
                  <label :for="`reply-${r.id}`" class="sr-only">Your reply</label>
                  <textarea :id="`reply-${r.id}`" v-model="replyText" rows="3" maxlength="2000" required class="form-textarea" placeholder="Thank the customer or respond to their feedback" />
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <p v-if="errorMsg" class="form-error !mt-0">{{ errorMsg }}</p>
                    <p v-else class="form-hint !mt-0 num">{{ replyText.length }} / 2000</p>
                    <div class="flex gap-2">
                      <button type="button" class="btn-secondary btn-sm" @click="replyingId = null">Cancel</button>
                      <button type="submit" :disabled="sending || !replyText.trim()" class="btn-primary btn-sm">{{ sending ? 'Saving…' : 'Post reply' }}</button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </li>
      </ul>

      <TablePager v-if="!loading && reviews.length" :page="page" :per-page="perPage" :total="total" @update:page="load" />
    </section>

    <!-- Reply dialog for reviews flagged in Insights (same reply endpoint) -->
    <VuexyModal v-model:visible="dialog.open" title="Reply to review" width="32rem">
      <div v-if="dialog.item" class="panel-sunken p-3 mb-4">
        <div class="flex items-center gap-2">
          <p class="text-sm font-medium text-ink">{{ dialog.item.title || 'Review' }}</p>
          <span class="inline-flex items-center gap-0.5 text-xs text-ink"><AppIcon icon="star-filled" class="w-3.5 h-3.5 text-amber-500 fill-current" />{{ dialog.item.rating }}</span>
        </div>
        <p class="text-sm text-ink-secondary mt-1">{{ dialog.item.comment }}</p>
        <p class="text-xs text-ink-muted mt-1">{{ dialog.item.client_name }} · {{ dialog.item.venue_name }}</p>
      </div>
      <label for="dialog-reply" class="form-label">Your public reply <span class="req">*</span></label>
      <textarea id="dialog-reply" v-model="dialog.text" rows="4" maxlength="2000" class="form-textarea" placeholder="Thank them, acknowledge the issue and say what you've changed." :aria-invalid="!!dialog.error" />
      <p v-if="dialog.error" class="form-error">{{ dialog.error }}</p>
      <p v-else class="form-hint num">{{ dialog.text.length }} / 2000</p>
      <template #footer>
        <div class="flex justify-end gap-2">
          <button class="btn-secondary" @click="dialog.open = false">Cancel</button>
          <button class="btn-primary" :disabled="dialog.sending || !dialog.text.trim()" @click="sendDialogReply">{{ dialog.sending ? 'Saving…' : 'Post reply' }}</button>
        </div>
      </template>
    </VuexyModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { toast } from 'vue-sonner'
import api from '@/lib/axios'
import { formatDate } from '@/lib/format'
import { getStorageUrl } from '@/lib/storageUrl'
import AppIcon from '@/components/ui/AppIcon.vue'
import VuexyModal from '@/components/ui/VuexyModal.vue'
import StarRating from '@/components/reviews/StarRating.vue'
import KpiTile from '@/components/dashboard/KpiTile.vue'
import TablePager from '@/components/dashboard/TablePager.vue'
import StoreReviewInsights, { type NeedsReplyItem } from '@/components/store/StoreReviewInsights.vue'
import { initials } from '@/components/dashboard/metrics'

const reviews = ref<any[]>([])
const loading = ref(true)
const loadError = ref('')
const page = ref(1)
const perPage = ref(10)
const total = ref(0)
const replied = ref('')
const venueId = ref('')
const replyingId = ref<number | null>(null)
const replyText = ref('')
const sending = ref(false)
const errorMsg = ref('')
const insightsRef = ref<InstanceType<typeof StoreReviewInsights> | null>(null)

const venues = ref<any[]>([])
const venuesLoading = ref(true)
const awaiting = ref<number | null>(null)

const totalReviews = computed(() => venues.value.reduce((s, v) => s + (Number(v.total_reviews) || 0), 0))
const avgRating = computed(() => totalReviews.value
  ? venues.value.reduce((s, v) => s + (Number(v.avg_rating) || 0) * (Number(v.total_reviews) || 0), 0) / totalReviews.value
  : 0)
const replyRate = computed(() => {
  if (!totalReviews.value || awaiting.value === null) return '—'
  return `${Math.max(0, Math.round(((totalReviews.value - awaiting.value) / totalReviews.value) * 100))}%`
})

async function load(p = 1) {
  loading.value = true
  loadError.value = ''
  try {
    const { data } = await api.get('/store/reviews', { params: { page: p, replied: replied.value || undefined, venue_id: venueId.value || undefined } })
    reviews.value = data.data.data
    page.value = data.data.current_page
    perPage.value = data.data.per_page || 10
    total.value = data.data.total ?? reviews.value.length
  } catch (e: any) {
    reviews.value = []
    loadError.value = e.response?.data?.message || 'Please check your connection and try again.'
  } finally {
    loading.value = false
  }
}

function setReplied(v: string) {
  replied.value = v
  load(1)
}

async function loadSummary() {
  api.get('/store/venues').then(({ data }) => {
    const v = data.data
    venues.value = Array.isArray(v) ? v : (v?.data ?? [])
  }).catch(() => {}).finally(() => { venuesLoading.value = false })
  api.get('/store/reviews', { params: { replied: 'no', per_page: 1 } })
    .then(({ data }) => { awaiting.value = data.data?.total ?? 0 })
    .catch(() => { awaiting.value = 0 })
}

function startReply(r: any) {
  replyingId.value = r.id
  replyText.value = r.store_reply || ''
  errorMsg.value = ''
}

async function sendReply(r: any) {
  sending.value = true
  errorMsg.value = ''
  const hadReply = !!r.store_reply
  try {
    const { data } = await api.post(`/store/reviews/${r.id}/reply`, { reply: replyText.value.trim() })
    Object.assign(r, { store_reply: data.data.store_reply, store_replied_at: data.data.store_replied_at })
    replyingId.value = null
    if (!hadReply && awaiting.value) awaiting.value--
    toast.success('Reply posted.')
  } catch (e: any) {
    errorMsg.value = e.response?.data?.message || 'Could not save reply.'
  } finally {
    sending.value = false
  }
}

const dialog = reactive({ open: false, item: null as NeedsReplyItem | null, text: '', sending: false, error: '' })

function openReplyDialog(item: NeedsReplyItem) {
  Object.assign(dialog, { open: true, item, text: '', sending: false, error: '' })
}

async function sendDialogReply() {
  if (!dialog.item || !dialog.text.trim()) return
  dialog.sending = true
  dialog.error = ''
  try {
    await api.post(`/store/reviews/${dialog.item.review_id}/reply`, { reply: dialog.text.trim() })
    dialog.open = false
    toast.success('Reply posted.')
    if (awaiting.value) awaiting.value--
    insightsRef.value?.reload()
    load(page.value)
  } catch (e: any) {
    dialog.error = e.response?.data?.message || 'Could not save reply.'
  } finally {
    dialog.sending = false
  }
}

function subRatings(r: any) {
  return [
    ['Cleanliness', r.cleanliness_rating], ['Value', r.value_rating],
    ['Service', r.service_rating], ['Location', r.location_rating],
  ].filter(([, v]) => v).map(([label, value]) => ({ label, value }))
}

onMounted(() => {
  load(1)
  loadSummary()
})
</script>

<style scoped>
.reply-block {
  padding: 0.625rem 0.875rem;
  background-color: var(--surface-sunken);
  border-left: 3px solid var(--brand-text);
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
}
</style>
