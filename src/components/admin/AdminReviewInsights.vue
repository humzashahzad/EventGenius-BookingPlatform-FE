<template>
  <!-- Renders only when GET /admin/reviews/insights answers with data; hides on 404/405/errors. -->
  <section v-if="state === 'ready' && d" class="card" aria-labelledby="ari-title">
    <div class="card-header flex-wrap gap-3">
      <div class="min-w-0">
        <h2 id="ari-title" class="card-title flex items-center gap-2">Review insights <span class="badge-neutral">Automatic analysis</span></h2>
        <p class="card-subtitle num">{{ d.totals?.analysed?.toLocaleString('en-PK') ?? 0 }} of {{ d.totals?.reviews?.toLocaleString('en-PK') ?? 0 }} reviews analysed · {{ d.totals?.counted?.toLocaleString('en-PK') ?? 0 }} count towards venue scores</p>
      </div>
      <button type="button" class="btn-icon btn-icon-sm" :aria-expanded="open" :aria-label="open ? 'Collapse insights' : 'Expand insights'" @click="open = !open">
        <AppIcon :icon="open ? 'chevron-up' : 'chevron-down'" class="w-4 h-4" />
      </button>
    </div>

    <div v-show="open" class="card-body space-y-6">
      <!-- Top row -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div class="panel-sunken p-4">
          <p class="stat-label">Average sentiment</p>
          <p class="text-3xl font-display font-bold text-ink num mt-1">{{ d.average_sentiment ?? '—' }}<span class="text-sm font-sans font-normal text-ink-muted"> / 100</span></p>
          <span class="mt-2 inline-flex" :class="TONE_BADGE[sentimentTone(null, d.average_sentiment)]">{{ sentimentLabel(null, d.average_sentiment) }}</span>
        </div>
        <div class="panel-sunken p-4 xl:col-span-2">
          <p class="stat-label mb-3">Sentiment distribution</p>
          <SentimentDistribution :dist="d.sentiment_distribution" show-counts />
          <p v-if="languages" class="text-xs text-ink-muted mt-3">Languages: {{ languages }}</p>
        </div>
        <div class="panel-sunken p-4">
          <p class="stat-label">Model status</p>
          <p class="mt-1 flex items-center gap-2 text-sm font-medium" :class="modelOk ? 'text-success-text' : 'text-danger-text'">
            <span class="w-2 h-2 rounded-full" :class="modelOk ? 'bg-success' : 'bg-danger'" aria-hidden="true" />
            {{ !d.model?.enabled ? 'Disabled' : modelOk ? 'Running' : 'Unavailable' }}
          </p>
          <p class="ref text-xs text-ink-muted mt-1 break-all">{{ d.model?.model_version || '—' }}</p>
          <p class="text-xs text-ink-muted mt-1 num">{{ d.pending_analysis ?? 0 }} waiting for analysis<span v-if="d.model?.checked_at"> · checked {{ timeAgo(d.model.checked_at) }}</span></p>
          <p v-if="d.model?.error" class="text-xs text-danger-text mt-1">{{ d.model.error }}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 class="section-title mb-3">Topics across all reviews</h3>
          <AspectList v-if="d.aspects?.length" :aspects="d.aspects" />
          <p v-else class="text-sm text-ink-muted">No topics detected yet.</p>
        </div>
        <div class="space-y-5">
          <div>
            <h3 class="section-title mb-2">Quality flags</h3>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="(n, f) in d.flag_counts"
                :key="f"
                type="button"
                class="flag-chip"
                :aria-pressed="flagFilter === String(f)"
                @click="$emit('filter-flag', flagFilter === String(f) ? '' : String(f))"
              >
                {{ humanFlag(String(f)) }} <span class="num font-semibold">{{ n }}</span>
              </button>
            </div>
            <p class="text-xs text-ink-muted mt-2">Select a flag to filter the moderation table.</p>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div v-if="d.venues_lowest_sentiment?.length">
              <h3 class="section-title mb-2 text-sm">Lowest sentiment</h3>
              <ul class="space-y-1.5 text-sm">
                <li v-for="v in d.venues_lowest_sentiment.slice(0, 5)" :key="v.venue_id" class="flex justify-between gap-2">
                  <span class="truncate text-ink-secondary">{{ v.name }}</span><span class="num font-medium text-ink shrink-0">{{ v.sentiment }}</span>
                </li>
              </ul>
            </div>
            <div v-if="d.venues_highest_sentiment?.length">
              <h3 class="section-title mb-2 text-sm">Highest sentiment</h3>
              <ul class="space-y-1.5 text-sm">
                <li v-for="v in d.venues_highest_sentiment.slice(0, 5)" :key="v.venue_id" class="flex justify-between gap-2">
                  <span class="truncate text-ink-secondary">{{ v.name }}</span><span class="num font-medium text-ink shrink-0">{{ v.sentiment }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Flagged -->
      <div v-if="d.flagged?.length">
        <h3 class="section-title mb-1">Flagged reviews</h3>
        <p class="text-xs text-ink-muted mb-3">Reviews the analysis thinks need a human look. Reviews flagged only as very short are left out.</p>
        <ul class="divide-y divide-line border border-line rounded-lg">
          <li v-for="r in d.flagged.slice(0, showAll ? 50 : 5)" :key="r.review_id" class="p-3 sm:p-4 flex flex-col sm:flex-row gap-3">
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-sm font-medium text-ink">{{ r.title || 'Review' }}</span>
                <span class="inline-flex items-center gap-0.5 text-xs text-ink"><AppIcon icon="star-filled" class="w-3.5 h-3.5 text-amber-500 fill-current" />{{ r.rating }}</span>
                <span v-for="f in r.flags" :key="f" class="badge-warning">{{ humanFlag(f) }}</span>
                <span v-if="!r.is_approved" class="badge-cancelled">Hidden</span>
              </div>
              <p class="text-sm text-ink-secondary mt-1 line-clamp-2">{{ r.comment }}</p>
              <p class="text-xs text-ink-muted mt-1">{{ r.client?.name }} · {{ r.venue?.name }} · {{ formatDate(r.created_at) }} · sentiment {{ r.sentiment }}</p>
              <ul v-if="r.reasons?.length" class="mt-1.5 text-xs text-warning-text">
                <li v-for="(why, i) in r.reasons" :key="i" class="flex items-start gap-1"><AppIcon icon="alert-triangle" class="w-3.5 h-3.5 shrink-0 mt-px" />{{ why }}</li>
              </ul>
            </div>
            <div class="flex sm:flex-col gap-2 shrink-0">
              <button type="button" class="btn-secondary btn-sm" :disabled="isBusy(r.review_id)" :aria-busy="isBusy(r.review_id)" @click="$emit('toggle', r)">
                <AppIcon :icon="r.is_approved ? 'eye-off' : 'eye'" class="w-4 h-4" />{{ r.is_approved ? 'Hide' : 'Show' }}
              </button>
              <button type="button" class="btn-danger-ghost btn-sm" :disabled="isBusy(r.review_id)" @click="$emit('remove', r)"><AppIcon icon="trash" class="w-4 h-4" />Delete</button>
            </div>
          </li>
        </ul>
        <button v-if="d.flagged.length > 5" type="button" class="btn-ghost btn-sm mt-2" @click="showAll = !showAll">
          {{ showAll ? 'Show fewer' : `Show all ${d.flagged.length}` }}
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import api from '@/lib/axios'
import { formatDate } from '@/lib/format'
import AppIcon from '@/components/ui/AppIcon.vue'
import AspectList from '@/components/dashboard/AspectList.vue'
import SentimentDistribution from '@/components/dashboard/SentimentDistribution.vue'
import { sentimentLabel, sentimentTone, humanFlag } from '@/components/dashboard/SentimentBits'
import { timeAgo } from '@/components/dashboard/metrics'

const props = defineProps<{ busyId?: number | null; flagFilter?: string; isPending?: (id: number) => boolean }>()
const isBusy = (id: number) => props.busyId === id || !!props.isPending?.(id)
defineEmits<{ toggle: [r: any]; remove: [r: any]; 'filter-flag': [flag: string] }>()

const state = ref<'loading' | 'ready' | 'hidden'>('loading')
const d = ref<any>(null)
const open = ref(true)
const showAll = ref(false)

const TONE_BADGE: Record<string, string> = { success: 'badge-success', warning: 'badge-warning', danger: 'badge-danger', neutral: 'badge-neutral' }
const modelOk = computed(() => !!(d.value?.model?.enabled && d.value?.model?.available))
const languages = computed(() => {
  const l = d.value?.languages
  if (!l) return ''
  const names: Record<string, string> = { en: 'English', ur: 'Urdu', 'ur-Latn': 'Roman Urdu' }
  return Object.entries(l).map(([k, v]) => `${names[k] || k} ${v}`).join(' · ')
})

let seq = 0
/** First load decides whether the panel shows at all; later reloads are quiet and keep the panel if they fail. */
async function load() {
  const id = ++seq
  const quiet = state.value === 'ready'
  try {
    const { data } = await api.get('/admin/reviews/insights')
    if (id !== seq) return
    const v = data?.data
    const ok = v && (v.totals || v.sentiment_distribution)
    if (!ok && quiet) return
    d.value = ok ? v : null
    state.value = ok ? 'ready' : 'hidden'
  } catch {
    if (id !== seq || quiet) return
    d.value = null
    state.value = 'hidden'
  }
}

/** Mark a flagged review hidden/visible or removed after the parent's API call succeeds. */
function patchFlagged(reviewId: number, patch: Record<string, any> | null) {
  if (!d.value?.flagged) return
  if (patch === null) d.value.flagged = d.value.flagged.filter((r: any) => r.review_id !== reviewId)
  else d.value.flagged = d.value.flagged.map((r: any) => (r.review_id === reviewId ? { ...r, ...patch } : r))
}

/** Take a flagged review off the list straight away; returns a function that puts it back. */
function removeFlagged(reviewId: number): () => void {
  const list: any[] = d.value?.flagged
  if (!list) return () => {}
  const idx = list.findIndex(r => r.review_id === reviewId)
  if (idx < 0) return () => {}
  const item = list[idx]
  d.value.flagged = list.filter((_, i) => i !== idx)
  return () => {
    if (!d.value?.flagged || d.value.flagged.some((r: any) => r.review_id === reviewId)) return
    const next = [...d.value.flagged]
    next.splice(Math.min(idx, next.length), 0, item)
    d.value.flagged = next
  }
}

defineExpose({ reload: load, patchFlagged, removeFlagged, available: computed(() => state.value === 'ready') })
onMounted(load)
</script>

<style scoped>
.flag-chip {
  display: inline-flex; align-items: center; gap: 0.375rem;
  height: var(--control-h-sm); padding: 0 0.75rem; border-radius: 9999px; font-size: 0.8125rem;
  color: var(--ink-secondary); border: 1px solid var(--line); background: var(--surface);
}
.flag-chip:hover { background: var(--surface-hover); }
.flag-chip[aria-pressed='true'] { color: var(--brand-text); border-color: var(--brand-text); background: var(--brand-soft); }
</style>
