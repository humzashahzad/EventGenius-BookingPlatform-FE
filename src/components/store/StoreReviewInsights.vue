<template>
  <!-- Renders only when GET /store/reviews/insights answers with data; hides on 404 / errors / empty. -->
  <section v-if="state === 'ready' && insights" class="card" aria-labelledby="ri-title">
    <div class="card-header flex-wrap gap-3">
      <div class="min-w-0">
        <h2 id="ri-title" class="card-title flex items-center gap-2">
          Review insights
          <span class="badge-neutral">Automatic analysis</span>
        </h2>
        <p class="card-subtitle">What guests talk about in their written reviews · {{ current.summary?.analysed_count ?? 0 }} reviews analysed<span v-if="updatedAt"> · updated {{ updatedAt }}</span></p>
      </div>
      <div class="flex items-center gap-2">
        <label for="ri-venue" class="sr-only">Venue</label>
        <select id="ri-venue" v-model="venueKey" class="form-select !w-auto max-w-[220px]">
          <option value="all">All venues</option>
          <option v-for="v in insights.venues" :key="v.venue_id" :value="String(v.venue_id)">{{ v.name }}</option>
        </select>
        <button type="button" class="btn-icon btn-icon-sm" :aria-expanded="open" :aria-label="open ? 'Collapse insights' : 'Expand insights'" @click="open = !open">
          <AppIcon :icon="open ? 'chevron-up' : 'chevron-down'" class="w-4 h-4" />
        </button>
      </div>
    </div>

    <div v-show="open" class="card-body space-y-6">
      <!-- Score + distribution -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="panel-sunken p-4">
          <p class="stat-label">Guest sentiment</p>
          <div class="flex items-baseline gap-2 mt-1">
            <p class="text-3xl font-display font-bold text-ink num">{{ current.summary?.sentiment ?? '—' }}</p>
            <p class="text-sm text-ink-muted">/ 100</p>
          </div>
          <span class="mt-2 inline-flex" :class="TONE_BADGE[tone]">{{ sentimentLabel(current.summary?.label, current.summary?.sentiment) }}</span>
        </div>
        <div class="panel-sunken p-4 md:col-span-2">
          <p class="stat-label mb-3">How reviews read</p>
          <SentimentDistribution :dist="current.summary?.distribution" show-counts />
          <p v-if="current.rating" class="text-xs text-ink-muted mt-3 num">Average star rating {{ Number(current.rating).toFixed(2) }} from {{ current.reviews }} reviews</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Aspects -->
        <div>
          <h3 class="section-title mb-3">Topics guests mention</h3>
          <AspectList v-if="current.summary?.aspects?.length" :aspects="current.summary.aspects" />
          <p v-else class="text-sm text-ink-muted">Not enough reviews mention specific topics yet.</p>
        </div>

        <!-- Highlights / concerns -->
        <div class="space-y-5">
          <div v-if="current.summary?.highlights?.length">
            <h3 class="section-title mb-2 flex items-center gap-2"><AppIcon icon="trending-up" class="w-4 h-4 text-success-text" />Guests praise</h3>
            <ul class="space-y-2">
              <li v-for="(h, i) in current.summary.highlights" :key="i" class="quote quote-good">“{{ h }}”</li>
            </ul>
          </div>
          <div v-if="current.summary?.concerns?.length">
            <h3 class="section-title mb-2 flex items-center gap-2"><AppIcon icon="trending-down" class="w-4 h-4 text-danger-text" />Things to improve</h3>
            <ul class="space-y-2">
              <li v-for="(c, i) in current.summary.concerns" :key="i" class="quote quote-bad">“{{ c }}”</li>
            </ul>
          </div>
          <p v-if="!current.summary?.highlights?.length && !current.summary?.concerns?.length" class="text-sm text-ink-muted">Highlights and concerns appear once a few written reviews come in.</p>
        </div>
      </div>

      <!-- Trend -->
      <div v-if="trendData.length">
        <div class="flex flex-wrap items-baseline justify-between gap-2 mb-3">
          <h3 class="section-title">Sentiment by month</h3>
          <p class="text-xs text-ink-muted">{{ venueKey === 'all' ? 'Weighted across your venues' : current.name }} · 0–100, higher is better</p>
        </div>
        <TrendBars :data="trendData" :height="180" color="var(--chart-2)" :format="(v: number) => `${v} / 100`" :format-axis="(v: number) => String(v)" aria-label="Guest sentiment per month" />
      </div>

      <!-- Needs reply -->
      <div v-if="needsReply.length">
        <h3 class="section-title mb-1">Negative reviews without a reply</h3>
        <p class="text-xs text-ink-muted mb-3">From the last 90 days, most negative first. A short, polite reply helps future guests.</p>
        <ul class="divide-y divide-line border border-line rounded-lg">
          <li v-for="r in needsReply" :key="r.review_id" class="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-start gap-3">
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-sm font-medium text-ink">{{ r.title || 'Review' }}</span>
                <span class="inline-flex items-center gap-0.5 text-xs text-ink"><AppIcon icon="star-filled" class="w-3.5 h-3.5 text-amber-500 fill-current" />{{ r.rating }}</span>
                <span class="badge-danger">Sentiment {{ r.sentiment }}</span>
              </div>
              <p class="text-sm text-ink-secondary mt-1 line-clamp-3">{{ r.comment }}</p>
              <p class="text-xs text-ink-muted mt-1">{{ r.client_name }} · {{ r.venue_name }} · {{ formatDate(r.created_at) }}<span v-if="r.negative_aspects?.length"> · about {{ r.negative_aspects.map(humanize).join(', ').toLowerCase() }}</span></p>
            </div>
            <button type="button" class="btn-secondary btn-sm shrink-0" @click="$emit('reply', r)"><AppIcon icon="reply" class="w-4 h-4" />Reply</button>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import api from '@/lib/axios'
import { formatDate } from '@/lib/format'
import AppIcon from '@/components/ui/AppIcon.vue'
import TrendBars from '@/components/dashboard/TrendBars.vue'
import AspectList from '@/components/dashboard/AspectList.vue'
import SentimentDistribution from '@/components/dashboard/SentimentDistribution.vue'
import { sentimentLabel, sentimentTone } from '@/components/dashboard/SentimentBits'
import { humanize, timeAgo } from '@/components/dashboard/metrics'

export interface NeedsReplyItem {
  review_id: number
  rating: number
  title?: string
  comment?: string
  client_name?: string
  sentiment?: number
  label?: string
  negative_aspects?: string[]
  created_at?: string
  venue_name?: string
}

defineEmits<{ reply: [item: NeedsReplyItem] }>()

const state = ref<'loading' | 'ready' | 'hidden'>('loading')
const insights = ref<any>(null)
const venueKey = ref('all')
const open = ref(true)

const TONE_BADGE: Record<string, string> = { success: 'badge-success', warning: 'badge-warning', danger: 'badge-danger', neutral: 'badge-neutral' }

const current = computed(() => {
  const d = insights.value
  if (!d) return {} as any
  if (venueKey.value === 'all') {
    const venues = d.venues || []
    const reviews = venues.reduce((s: number, v: any) => s + (Number(v.total_reviews) || 0), 0)
    const rating = reviews ? venues.reduce((s: number, v: any) => s + (Number(v.avg_rating) || 0) * (Number(v.total_reviews) || 0), 0) / reviews : 0
    const pick = (k: 'highlights' | 'concerns') => d.overall?.[k]?.length
      ? d.overall[k]
      : venues.flatMap((v: any) => (v.summary?.[k] || []).slice(0, 2)).slice(0, 5)
    return { name: 'All venues', summary: { ...d.overall, highlights: pick('highlights'), concerns: pick('concerns') }, rating, reviews }
  }
  const v = (d.venues || []).find((x: any) => String(x.venue_id) === venueKey.value)
  return v ? { name: v.name, summary: v.summary, rating: v.avg_rating, reviews: v.total_reviews, trend: v.trend } : ({} as any)
})

const tone = computed(() => sentimentTone(current.value.summary?.label, current.value.summary?.sentiment))
const updatedAt = computed(() => timeAgo(current.value.summary?.updated_at || insights.value?.overall?.updated_at))

const trendData = computed(() => {
  const d = insights.value
  if (!d) return []
  let rows: { month: string; reviews: number; sentiment: number | null }[] = []
  if (venueKey.value !== 'all') {
    rows = current.value.trend || []
  } else {
    // Review-weighted mean per month across venues
    const m = new Map<string, { w: number; s: number; n: number }>()
    for (const v of d.venues || []) {
      for (const t of v.trend || []) {
        const e = m.get(t.month) || { w: 0, s: 0, n: 0 }
        if (t.sentiment != null && t.reviews) { e.w += t.reviews; e.s += t.sentiment * t.reviews }
        e.n += t.reviews || 0
        m.set(t.month, e)
      }
    }
    rows = [...m.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, e]) => ({ month, reviews: e.n, sentiment: e.w ? Math.round(e.s / e.w) : null }))
  }
  return rows.map(r => {
    const dt = new Date(`${r.month}-01T00:00:00`)
    return {
      label: dt.toLocaleDateString('en-GB', { month: 'short' }),
      title: dt.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
      value: Number(r.sentiment) || 0,
      extra: `${r.reviews} review${r.reviews === 1 ? '' : 's'}`,
    }
  })
})

const needsReply = computed<NeedsReplyItem[]>(() => {
  const d = insights.value
  if (!d) return []
  const venues = (d.venues || []).filter((v: any) => venueKey.value === 'all' || String(v.venue_id) === venueKey.value)
  return venues
    .flatMap((v: any) => (v.needs_reply || []).map((r: any) => ({ ...r, venue_name: v.name })))
    .sort((a: any, b: any) => (a.sentiment ?? 50) - (b.sentiment ?? 50))
    .slice(0, 8)
})

async function load() {
  try {
    const { data } = await api.get('/store/reviews/insights')
    const d = data?.data
    const hasData = d && Array.isArray(d.venues) && d.venues.length &&
      ((d.overall?.analysed_count ?? 0) > 0 || d.venues.some((v: any) => (v.summary?.analysed_count ?? 0) > 0 || v.needs_reply?.length))
    insights.value = hasData ? d : null
    state.value = hasData ? 'ready' : 'hidden'
  } catch {
    insights.value = null
    state.value = 'hidden'
  }
}

defineExpose({ reload: load })
onMounted(load)
</script>

<style scoped>
.quote {
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem; line-height: 1.375rem;
  color: var(--ink-secondary);
  background-color: var(--surface-sunken);
  border-left: 3px solid var(--line-strong);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}
.quote-good { border-left-color: var(--success); }
.quote-bad { border-left-color: var(--danger); }
</style>
