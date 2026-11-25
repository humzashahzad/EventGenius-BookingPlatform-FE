<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-lg font-semibold text-warm-900 dark:text-warm-50">Search analytics</h2>
        <p class="text-sm text-warm-500 dark:text-warm-400 mt-0.5">What customers search for, what they click, and where we have nothing to show.</p>
      </div>
      <div class="flex items-center gap-2">
        <div class="inline-flex rounded-xl border border-warm-200 dark:border-warm-600 p-0.5 bg-white dark:bg-warm-800" role="group" aria-label="Date range">
          <button v-for="d in [7, 30, 90]" :key="d" type="button"
            class="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors"
            :class="days === d ? 'bg-primary-500 text-white' : 'text-warm-600 hover:bg-warm-50 dark:text-warm-300 dark:hover:bg-warm-700'"
            :aria-pressed="days === d"
            @click="days = d; load()">{{ d }} days</button>
        </div>
        <button class="btn-ghost !px-2.5 !py-2" title="Refresh" :disabled="loading" @click="load"><AppIcon icon="refresh" :class="loading ? 'w-4 h-4 animate-spin' : 'w-4 h-4'" /></button>
      </div>
    </div>

    <div v-if="error" class="card empty-state">
      <div class="empty-state-icon"><AppIcon icon="alert-circle" class="w-6 h-6 text-red-500" /></div>
      <p class="empty-state-title">Couldn’t load analytics</p>
      <p class="empty-state-desc">{{ error }}</p>
      <button class="btn-outline btn-sm mt-3" @click="load">Retry</button>
    </div>

    <template v-else>
      <!-- KPI tiles -->
      <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <template v-if="loading && !data">
          <div v-for="i in 5" :key="i" class="skeleton h-24 rounded-2xl"></div>
        </template>
        <template v-else-if="data">
          <div v-for="k in kpis" :key="k.label" class="stat-card !p-4 !gap-3">
            <div class="stat-icon !w-10 !h-10" :class="k.bg"><AppIcon :icon="k.icon" class="w-5 h-5" :class="k.fg" /></div>
            <div class="min-w-0">
              <p class="stat-value !text-xl tabular-nums">{{ k.value }}</p>
              <p class="stat-label !text-xs" :title="k.hint">{{ k.label }}</p>
            </div>
          </div>
        </template>
      </div>

      <div v-if="data" class="grid grid-cols-1 xl:grid-cols-3 gap-6" :class="{ 'opacity-60': loading }">
        <!-- Trend -->
        <div class="card p-5 xl:col-span-2 min-w-0">
          <h3 class="text-sm font-semibold text-warm-900 dark:text-warm-50 mb-3">Searches &amp; clicks per day</h3>
          <TrendChart v-if="data.totals.searches || data.totals.clicks" :points="data.per_day" />
          <div v-else class="empty-state !py-10">
            <div class="empty-state-icon"><AppIcon icon="search" class="w-6 h-6" /></div>
            <p class="empty-state-title">No searches in this period</p>
            <p class="empty-state-desc">Searches from the venues page will appear here.</p>
          </div>
        </div>

        <!-- Understood breakdown -->
        <div class="card p-5">
          <h3 class="text-sm font-semibold text-warm-900 dark:text-warm-50">How often we understood…</h3>
          <p class="text-xs text-warm-500 dark:text-warm-400 mb-4">Share of searches where the query or filters gave us this detail.</p>
          <div class="space-y-4">
            <div v-for="b in understoodBars" :key="b.key">
              <div class="flex justify-between text-sm mb-1">
                <span class="text-warm-700 dark:text-warm-300">{{ b.label }}</span>
                <span class="font-semibold tabular-nums text-warm-900 dark:text-warm-50">{{ pct(b.value, 0) }}</span>
              </div>
              <div class="h-2 rounded-full bg-warm-100 dark:bg-warm-700 overflow-hidden">
                <div class="h-full rounded-full bg-[var(--chart-1)] transition-all" :style="{ width: `${Math.min(100, b.value || 0)}%` }"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Top queries -->
        <div class="card overflow-hidden xl:col-span-2 min-w-0">
          <div class="px-5 py-3 border-b border-warm-100 dark:border-warm-700"><h3 class="text-sm font-semibold text-warm-900 dark:text-warm-50">Top queries</h3></div>
          <div v-if="!data.top_queries.length" class="empty-state !py-8"><p class="empty-state-desc">No typed queries yet.</p></div>
          <div v-else class="table-wrapper">
            <table class="w-full text-sm">
              <thead><tr class="table-header"><th class="px-5 py-2.5">Query</th><th class="px-3 py-2.5 text-right">Searches</th><th class="px-3 py-2.5 text-right">Avg results</th><th class="px-5 py-2.5 text-right">CTR</th></tr></thead>
              <tbody class="divide-y divide-warm-100 dark:divide-warm-700">
                <tr v-for="q in data.top_queries" :key="q.query">
                  <td class="px-5 py-2.5 text-warm-800 dark:text-warm-200 max-w-[16rem] truncate" :title="q.query">{{ q.query }}</td>
                  <td class="px-3 py-2.5 text-right tabular-nums text-warm-700 dark:text-warm-300">{{ num(q.count) }}</td>
                  <td class="px-3 py-2.5 text-right tabular-nums text-warm-700 dark:text-warm-300">{{ Number(q.avg_results).toFixed(1) }}</td>
                  <td class="px-5 py-2.5 text-right tabular-nums text-warm-700 dark:text-warm-300">{{ pct(q.ctr, 0) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Zero results -->
        <div class="card overflow-hidden min-w-0">
          <div class="px-5 py-3 border-b border-warm-100 dark:border-warm-700">
            <h3 class="text-sm font-semibold text-warm-900 dark:text-warm-50 flex items-center gap-1.5">
              <AppIcon icon="alert-triangle" class="w-4 h-4 text-amber-500" /> Zero-result searches
            </h3>
            <p class="text-xs text-warm-500 dark:text-warm-400">Demand we can’t meet yet — good leads for new venues.</p>
          </div>
          <div v-if="!data.zero_result_queries.length" class="empty-state !py-8">
            <div class="empty-state-icon !w-10 !h-10"><AppIcon icon="circle-check" class="w-5 h-5 text-primary-500" /></div>
            <p class="empty-state-desc">Every search returned venues.</p>
          </div>
          <ul v-else class="divide-y divide-warm-100 dark:divide-warm-700">
            <li v-for="z in data.zero_result_queries" :key="z.query" class="px-5 py-2.5 flex items-center justify-between gap-3 text-sm">
              <span class="min-w-0">
                <span class="block truncate text-warm-800 dark:text-warm-200" :title="z.query">{{ z.query }}</span>
                <span class="block text-[11px] text-warm-400">last {{ fmtAgo(z.last_at) }}</span>
              </span>
              <span class="badge-warning tabular-nums">{{ z.count }}×</span>
            </li>
          </ul>
        </div>

        <!-- Top clicked venues -->
        <div class="card overflow-hidden xl:col-span-3 min-w-0">
          <div class="px-5 py-3 border-b border-warm-100 dark:border-warm-700"><h3 class="text-sm font-semibold text-warm-900 dark:text-warm-50">Most clicked venues</h3></div>
          <div v-if="!data.top_clicked_venues.length" class="empty-state !py-8"><p class="empty-state-desc">No clicks from search results in this period.</p></div>
          <div v-else class="table-wrapper">
            <table class="w-full text-sm">
              <thead><tr class="table-header"><th class="px-5 py-2.5">Venue</th><th class="px-3 py-2.5 text-right">Clicks</th><th class="px-3 py-2.5 text-right">Impressions*</th><th class="px-5 py-2.5 text-right">CTR*</th></tr></thead>
              <tbody class="divide-y divide-warm-100 dark:divide-warm-700">
                <tr v-for="v in data.top_clicked_venues" :key="v.venue_id">
                  <td class="px-5 py-2.5 text-warm-800 dark:text-warm-200">{{ v.name }}</td>
                  <td class="px-3 py-2.5 text-right tabular-nums text-warm-700 dark:text-warm-300">{{ num(v.clicks) }}</td>
                  <td class="px-3 py-2.5 text-right tabular-nums text-warm-700 dark:text-warm-300">{{ num(v.impressions) }}</td>
                  <td class="px-5 py-2.5 text-right tabular-nums text-warm-700 dark:text-warm-300">{{ v.impressions ? pct(v.ctr) : '—' }}</td>
                </tr>
              </tbody>
            </table>
            <p class="px-5 py-2 text-[11px] text-warm-400">Clicks are for the selected period. *Impressions and CTR (clicks ÷ impressions) are all-time.</p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import api from '@/lib/axios'
import AppIcon from '@/components/ui/AppIcon.vue'
import TrendChart from './TrendChart.vue'
import { apiError, num, pct } from './signals'

interface Analytics {
  totals: { searches: number; unique_queries: number; clicks: number; ctr: number; zero_result_rate: number }
  per_day: { date: string; searches: number; clicks: number }[]
  top_queries: { query: string; count: number; avg_results: number; ctr: number }[]
  zero_result_queries: { query: string; count: number; last_at: string }[]
  top_clicked_venues: { venue_id: number; name: string; clicks: number; impressions: number; ctr: number }[]
  understood_breakdown: { city: number; event_type: number; guests: number; budget: number }
}

const days = ref(30)
const data = ref<Analytics | null>(null)
const loading = ref(false)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await api.get('/admin/search/analytics', { params: { days: days.value } })
    data.value = res.data.data
  } catch (e) {
    error.value = apiError(e, 'Could not load analytics.')
  } finally {
    loading.value = false
  }
}

const kpis = computed(() => {
  const t = data.value?.totals
  if (!t) return []
  return [
    { label: 'Searches', value: num(t.searches), icon: 'search', bg: 'bg-primary-50 dark:bg-primary-900/30', fg: 'text-primary-600 dark:text-primary-400', hint: 'Searches run (first page only; paging is not counted again).' },
    { label: 'Unique queries', value: num(t.unique_queries), icon: 'hash', bg: 'bg-sky-50 dark:bg-sky-900/30', fg: 'text-sky-600 dark:text-sky-400', hint: 'Distinct typed queries (case-insensitive).' },
    { label: 'Result clicks', value: num(t.clicks), icon: 'eye', bg: 'bg-violet-50 dark:bg-violet-900/30', fg: 'text-violet-600 dark:text-violet-400', hint: 'Clicks on venues from search results.' },
    { label: 'Search CTR', value: pct(t.ctr), icon: 'bolt', bg: 'bg-amber-50 dark:bg-amber-900/30', fg: 'text-amber-600 dark:text-amber-400', hint: 'Share of searches with at least one click.' },
    { label: 'Zero-result rate', value: pct(t.zero_result_rate), icon: 'map-pin-off', bg: 'bg-red-50 dark:bg-red-900/30', fg: 'text-red-600 dark:text-red-400', hint: 'Share of searches that returned no venues.' },
  ]
})

const understoodBars = computed(() => {
  const b = data.value?.understood_breakdown
  return [
    { key: 'city', label: 'City', value: b?.city ?? 0 },
    { key: 'event_type', label: 'Event type', value: b?.event_type ?? 0 },
    { key: 'guests', label: 'Guest count', value: b?.guests ?? 0 },
    { key: 'budget', label: 'Budget', value: b?.budget ?? 0 },
  ]
})

function fmtAgo(d: string) {
  if (!d) return '—'
  const diff = Date.now() - new Date(d.replace(' ', 'T')).getTime()
  const h = Math.round(diff / 3600000)
  if (h < 1) return 'just now'
  if (h < 24) return `${h}h ago`
  const dd = Math.round(h / 24)
  return `${dd}d ago`
}

defineExpose({ load })
onMounted(load)
</script>
