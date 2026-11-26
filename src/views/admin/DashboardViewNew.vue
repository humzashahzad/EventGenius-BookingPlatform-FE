<template>
  <div class="space-y-6">
    <header class="page-header !mb-0">
      <div>
        <p class="page-eyebrow">{{ today }}</p>
        <h1 class="page-title">Welcome back, {{ authStore.user?.name?.split(' ')[0] || 'admin' }}</h1>
        <p class="page-subtitle">
          <template v-if="loading">Loading platform overview…</template>
          <template v-else-if="pendingTotal">{{ pendingTotal }} item{{ pendingTotal === 1 ? '' : 's' }} need your attention.</template>
          <template v-else>Everything is under control.</template>
        </p>
      </div>
      <div class="page-header-actions">
        <RouterLink to="/support/bookings" class="btn-secondary"><AppIcon icon="calendar-event" class="w-4 h-4" />Bookings</RouterLink>
        <RouterLink to="/support/stores" class="btn-primary"><AppIcon icon="building-store" class="w-4 h-4" />Review stores</RouterLink>
      </div>
    </header>

    <div v-if="loadError && !loading" class="card">
      <div class="empty-state">
        <div class="empty-state-icon"><AppIcon icon="alert-circle" class="w-5 h-5" /></div>
        <p class="empty-state-title">Couldn't load the dashboard</p>
        <p class="empty-state-desc">{{ loadError }}</p>
        <div class="empty-state-actions"><button class="btn-primary" @click="load()">Try again</button></div>
      </div>
    </div>

    <template v-else>
      <!-- KPIs -->
      <section aria-label="Platform figures" class="grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-6 gap-3 sm:gap-4">
        <KpiTile label="Clients" icon="users" tone="info" :loading="loading" to="/support/users"
          :value="stats.total_clients.toLocaleString('en-PK')" helper="registered customers" />
        <KpiTile label="Stores" icon="building-store" tone="neutral" :loading="loading" to="/support/stores"
          :value="stats.total_stores" :helper="`${stats.pending_stores} awaiting approval`" />
        <KpiTile label="Pending approvals" icon="clock" :tone="stats.pending_stores ? 'warning' : 'success'" :loading="loading" to="/support/stores?status=pending"
          :value="stats.pending_stores" :helper="stats.pending_stores ? 'Stores waiting to go live' : 'Nothing waiting'" />
        <KpiTile label="Venues" icon="building" tone="brand" :loading="loading" to="/support/venues"
          :value="stats.total_venues" :helper="stats.total_stores ? `${(stats.total_venues / stats.total_stores).toFixed(1)} per store` : ''" />
        <KpiTile label="Bookings" icon="calendar-event" tone="info" :loading="loading || bookingsLoading" to="/support/bookings"
          :value="stats.total_bookings.toLocaleString('en-PK')" :delta="kpi.bookings.delta" :helper="`${kpi.bookings.cur} in last 30 days`" />
        <KpiTile label="Revenue" icon="wallet" tone="success" :loading="loading || bookingsLoading"
          unit="PKR" :value="compactNumber(stats.total_revenue)" :title="formatPKR(stats.total_revenue)"
          :delta="kpi.revenue.delta" :helper="`${compactPKR(kpi.revenue.cur)} in 30 days`" />
      </section>
      <p class="-mt-3 text-xs text-ink-muted">Changes compare the last 30 days with the 30 days before. Revenue is completed payments.</p>

      <div class="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <!-- Trend -->
        <section class="card xl:col-span-3 min-w-0">
          <div class="card-header flex-wrap gap-3">
            <div class="min-w-0">
              <h2 class="card-title">{{ metric === 'revenue' ? 'Platform revenue' : 'New bookings' }}</h2>
              <p class="card-subtitle">{{ metric === 'revenue' ? 'Paid booking value' : 'Booking requests' }} by {{ range === '12m' ? 'month' : 'day' }}</p>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <div class="segmented" role="group" aria-label="Metric">
                <button type="button" :aria-pressed="metric === 'revenue'" @click="metric = 'revenue'">Revenue</button>
                <button type="button" :aria-pressed="metric === 'bookings'" @click="metric = 'bookings'">Bookings</button>
              </div>
              <div class="segmented" role="group" aria-label="Range">
                <button type="button" :aria-pressed="range === '30d'" @click="range = '30d'">30 days</button>
                <button type="button" :aria-pressed="range === '12m'" @click="range = '12m'">12 months</button>
              </div>
            </div>
          </div>
          <div class="card-body">
            <div v-if="loading || bookingsLoading" class="skeleton h-[300px] w-full" />
            <template v-else-if="bookings.length">
              <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-4">
                <p class="text-2xl font-display font-bold text-ink num">{{ metric === 'revenue' ? compactPKR(chartTotal) : chartTotal.toLocaleString('en-PK') }}</p>
                <span v-if="chartDelta !== null" :class="chartDelta >= 0 ? 'stat-delta-up' : 'stat-delta-down'" class="text-xs">
                  <AppIcon :icon="chartDelta >= 0 ? 'trending-up' : 'trending-down'" class="w-3 h-3" />{{ Math.abs(chartDelta).toFixed(0) }}%
                </span>
                <span class="text-xs text-ink-muted">{{ range === '12m' ? 'last 12 months vs the 12 before' : 'last 30 days vs the 30 before' }}</span>
              </div>
              <TrendBars :data="chartData" :height="260" :color="metric === 'revenue' ? 'var(--chart-1)' : 'var(--chart-2)'"
                :format="metric === 'revenue' ? (v: number) => formatPKR(v) : (v: number) => `${v} booking${v === 1 ? '' : 's'}`"
                :aria-label="metric === 'revenue' ? 'Platform revenue' : 'New bookings'" />
            </template>
            <!-- Fallback: 7-day series from the dashboard endpoint -->
            <template v-else>
              <p class="text-xs text-ink-muted mb-3">Showing the last 7 days.</p>
              <TrendBars :data="fallbackData" :height="260" :color="metric === 'revenue' ? 'var(--chart-1)' : 'var(--chart-2)'"
                :format="metric === 'revenue' ? (v: number) => formatPKR(v) : (v: number) => String(v)" aria-label="Last 7 days" />
            </template>
          </div>
        </section>

        <!-- Pending actions -->
        <section class="card xl:col-span-2 min-w-0 flex flex-col">
          <div class="card-header"><div><h2 class="card-title">Pending actions</h2><p class="card-subtitle">Work waiting for the support team</p></div></div>
          <ul class="divide-y divide-line flex-1">
            <li v-for="a in actions" :key="a.label">
              <RouterLink :to="a.to" class="flex items-center gap-3 px-5 py-3.5 hover:bg-surface-hover">
                <span class="icon-chip icon-chip-sm" :class="a.count ? a.tone : 'tone-neutral'"><AppIcon :icon="a.icon" class="w-4 h-4" /></span>
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium text-ink">{{ a.label }}</p>
                  <p class="text-xs text-ink-muted truncate">{{ a.hint }}</p>
                </div>
                <span v-if="a.loading" class="skeleton h-5 w-8" />
                <span v-else class="text-lg font-display font-bold num" :class="a.count ? 'text-ink' : 'text-ink-muted'">{{ a.count }}</span>
                <AppIcon icon="chevron-right" class="w-4 h-4 text-ink-muted" />
              </RouterLink>
            </li>
          </ul>
          <div v-if="pendingStoresList.length" class="border-t border-line px-5 py-3">
            <p class="eyebrow mb-2">Stores waiting</p>
            <ul class="space-y-2">
              <li v-for="s in pendingStoresList" :key="s.id" class="flex items-center justify-between gap-3 text-sm">
                <span class="truncate text-ink">{{ s.name }}</span>
                <span class="text-xs text-ink-muted shrink-0">{{ timeAgo(s.created_at) }}</span>
              </li>
            </ul>
          </div>
        </section>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <!-- Status distribution -->
        <section class="card min-w-0">
          <div class="card-header"><div><h2 class="card-title">Bookings by status</h2><p class="card-subtitle">All time · {{ statusTotal.toLocaleString('en-PK') }} bookings</p></div></div>
          <div class="card-body">
            <div v-if="loading" class="space-y-3"><div v-for="i in 5" :key="i" class="skeleton h-6 w-full" /></div>
            <template v-else-if="statusRows.length">
              <div class="flex h-3 rounded-full overflow-hidden gap-[2px] mb-5" role="img" :aria-label="statusRows.map(r => `${r.label} ${r.pct}%`).join(', ')">
                <div v-for="r in statusRows" :key="r.key" :style="{ width: r.pct + '%', backgroundColor: r.color }" />
              </div>
              <ul class="space-y-2.5">
                <li v-for="r in statusRows" :key="r.key" class="flex items-center justify-between gap-3 text-sm">
                  <span class="inline-flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-sm" :style="{ backgroundColor: r.color }" aria-hidden="true" />{{ r.label }}</span>
                  <span class="num text-ink font-medium">{{ r.value.toLocaleString('en-PK') }} <span class="text-ink-muted font-normal text-xs w-10 inline-block text-right">{{ r.pct }}%</span></span>
                </li>
              </ul>
            </template>
            <p v-else class="text-sm text-ink-muted">No bookings yet.</p>
          </div>
        </section>

        <!-- Activity -->
        <section class="card xl:col-span-2 min-w-0">
          <div class="card-header"><div><h2 class="card-title">Recent activity</h2><p class="card-subtitle">Latest bookings, payments and sign-ups</p></div></div>
          <div v-if="loading" class="p-5 space-y-3"><div v-for="i in 6" :key="i" class="skeleton h-8 w-full" /></div>
          <div v-else-if="!activityFeed.length" class="empty-state !py-10">
            <div class="empty-state-icon"><AppIcon icon="inbox" class="w-5 h-5" /></div>
            <p class="empty-state-title">No activity yet</p>
            <p class="empty-state-desc">Bookings, payments and new stores appear here.</p>
            <div class="empty-state-actions"><RouterLink to="/support/bookings" class="btn-secondary btn-sm">All bookings</RouterLink></div>
          </div>
          <ol v-else class="divide-y divide-line">
            <li v-for="(a, i) in activityFeed.slice(0, 8)" :key="i">
              <RouterLink :to="a.link || '/support/dashboard'" class="flex items-center gap-3 px-5 py-3 hover:bg-surface-hover">
                <span class="icon-chip icon-chip-sm" :class="ACT[a.type]?.tone || 'tone-neutral'"><AppIcon :icon="ACT[a.type]?.icon || 'bell'" class="w-4 h-4" /></span>
                <p class="text-sm text-ink-secondary flex-1 min-w-0 truncate">{{ a.text }}</p>
                <time class="text-xs text-ink-muted shrink-0" :datetime="a.time">{{ timeAgo(a.time) }}</time>
              </RouterLink>
            </li>
          </ol>
        </section>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <!-- Recent bookings -->
        <section class="card xl:col-span-2 min-w-0 overflow-hidden">
          <div class="card-header">
            <div><h2 class="card-title">Recent bookings</h2><p class="card-subtitle">Latest 10 across all stores</p></div>
            <RouterLink to="/support/bookings" class="btn-ghost btn-sm">View all <AppIcon icon="chevron-right" class="w-4 h-4" /></RouterLink>
          </div>
          <div v-if="loading" class="p-4 space-y-3"><div v-for="i in 5" :key="i" class="skeleton h-9 w-full" /></div>
          <div v-else-if="!recentBookings.length" class="empty-state !py-10">
            <div class="empty-state-icon"><AppIcon icon="calendar-event" class="w-5 h-5" /></div>
            <p class="empty-state-title">No bookings yet</p>
            <p class="empty-state-desc">New bookings across the platform show up here.</p>
            <div class="empty-state-actions"><RouterLink to="/support/venues" class="btn-secondary btn-sm">Venues</RouterLink></div>
          </div>
          <template v-else>
            <ul class="md:hidden divide-y divide-line">
              <li v-for="b in recentBookings" :key="b.id" class="flex items-center justify-between gap-3 px-4 py-3">
                <div class="min-w-0">
                  <p class="text-sm font-medium text-ink truncate">{{ b.client?.name }}</p>
                  <p class="text-xs text-ink-muted truncate">{{ b.venue?.name }} · {{ b.store?.name }}</p>
                </div>
                <div class="text-right shrink-0 space-y-1">
                  <p class="text-sm font-medium text-ink num">{{ compactPKR(b.total_amount) }}</p>
                  <span :class="statusBadgeClass(b.status)">{{ statusLabel(b.status) }}</span>
                </div>
              </li>
            </ul>
            <div class="hidden md:block table-wrapper">
              <table class="data-table is-compact">
                <thead><tr><th>Client &amp; venue</th><th>Status</th><th class="cell-num">Amount</th></tr></thead>
                <tbody>
                  <tr v-for="b in recentBookings" :key="b.id">
                    <td>
                      <p class="cell-primary truncate max-w-[320px]">{{ b.client?.name }} <span class="ref text-xs font-normal text-ink-muted">{{ b.booking_number }}</span></p>
                      <p class="text-xs text-ink-muted truncate max-w-[320px]">{{ b.venue?.name }} · {{ b.store?.name }} · {{ timeAgo(b.created_at) }}</p>
                    </td>
                    <td><span :class="statusBadgeClass(b.status)">{{ statusLabel(b.status) }}</span></td>
                    <td class="cell-num text-ink font-medium">{{ formatPKR(b.total_amount) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
        </section>

        <!-- Recent stores -->
        <section class="card min-w-0">
          <div class="card-header">
            <div><h2 class="card-title">New stores</h2><p class="card-subtitle">Latest sign-ups</p></div>
            <RouterLink to="/support/stores" class="btn-ghost btn-sm">View all <AppIcon icon="chevron-right" class="w-4 h-4" /></RouterLink>
          </div>
          <div v-if="loading" class="p-4 space-y-3"><div v-for="i in 4" :key="i" class="skeleton h-10 w-full" /></div>
          <div v-else-if="!recentStores.length" class="empty-state !py-10">
            <div class="empty-state-icon"><AppIcon icon="building-store" class="w-5 h-5" /></div>
            <p class="empty-state-title">No stores yet</p>
            <p class="empty-state-desc">Store owners who sign up appear here.</p>
            <div class="empty-state-actions"><RouterLink to="/support/stores" class="btn-secondary btn-sm">Stores</RouterLink></div>
          </div>
          <ul v-else class="divide-y divide-line">
            <li v-for="s in recentStores" :key="s.id" class="flex items-center gap-3 px-5 py-3">
              <span class="avatar w-9 h-9 text-xs shrink-0">{{ initials(s.name) }}</span>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-ink truncate">{{ s.name }}</p>
                <p class="text-xs text-ink-muted truncate">{{ s.owner?.email }}</p>
              </div>
              <span :class="statusBadgeClass(s.status)">{{ statusLabel(s.status) }}</span>
            </li>
          </ul>
        </section>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount, computed } from 'vue'
import { RouterLink } from 'vue-router'
import api from '@/lib/axios'
import { formatPKR } from '@/lib/format'
import { useAuthStore } from '@/stores/auth'
import { statusBadgeClass, statusLabel } from '@/lib/status'
import AppIcon from '@/components/ui/AppIcon.vue'
import KpiTile from '@/components/dashboard/KpiTile.vue'
import TrendBars from '@/components/dashboard/TrendBars.vue'
import { useLiveRefresh } from '@/composables/useLiveRefresh'
import { compactNumber, compactPKR, pctDelta, dayBuckets, monthBuckets, fillBuckets, sumBetween, timeAgo, initials } from '@/components/dashboard/metrics'

const authStore = useAuthStore()
const loading = ref(true)
const loadError = ref('')
const stats = reactive({ total_clients: 0, total_stores: 0, pending_stores: 0, total_venues: 0, total_bookings: 0, total_revenue: 0 })
const recentBookings = ref<any[]>([])
const recentStores = ref<any[]>([])
const charts = ref<any>({})
const statusCounts = ref<Record<string, number>>({})
const activityFeed = ref<any[]>([])
const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

const bookings = ref<any[]>([])
const bookingsLoading = ref(true)
const pendingStoresList = ref<any[]>([])
const reviewHealth = ref<{ loading: boolean; flagged: number | null; hidden: number | null }>({ loading: true, flagged: null, hidden: null })

const metric = ref<'revenue' | 'bookings'>('revenue')
const range = ref<'30d' | '12m'>('12m')

const ACT: Record<string, { icon: string; tone: string }> = {
  booking: { icon: 'calendar-event', tone: 'tone-info' },
  payment: { icon: 'wallet', tone: 'tone-success' },
  store: { icon: 'building-store', tone: 'tone-warning' },
  user: { icon: 'user-plus', tone: 'tone-brand' },
  review: { icon: 'star', tone: 'tone-warning' },
}

// Booking status colours follow the status badges (one colour per status).
const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b', confirmed: '#10b981', completed: '#3b82f6', cancelled: '#a8a29e', rejected: '#ef4444',
}
const statusTotal = computed(() => Object.values(statusCounts.value).reduce((s, v) => s + Number(v), 0))
const statusRows = computed(() => ['pending', 'confirmed', 'completed', 'cancelled', 'rejected', ...Object.keys(statusCounts.value)]
  .filter((k, i, a) => a.indexOf(k) === i && Number(statusCounts.value[k]) > 0)
  .map(k => ({ key: k, label: statusLabel(k), value: Number(statusCounts.value[k]), color: STATUS_COLORS[k] ?? '#78716c', pct: Math.round((Number(statusCounts.value[k]) / (statusTotal.value || 1)) * 100) })))

const paidValue = (b: any) => (b.payment_status === 'paid' ? Number(b.total_amount) || 0 : 0)
const kpi = computed(() => {
  const DAY = 86_400_000
  const end = new Date(Date.now() + 1)
  const mid = new Date(end.getTime() - 30 * DAY)
  const start = new Date(mid.getTime() - 30 * DAY)
  const pair = (date: (r: any) => string | null, val?: (r: any) => number) => {
    const cur = sumBetween(bookings.value, date, mid, end, val)
    const prev = sumBetween(bookings.value, date, start, mid, val)
    return { cur, delta: bookingsLoading.value || !bookings.value.length ? null : pctDelta(cur, prev) }
  }
  return { bookings: pair(r => r.created_at), revenue: pair(r => r.paid_at, paidValue) }
})

const chartBuckets = computed(() => {
  const date = (r: any) => (metric.value === 'revenue' ? r.paid_at : r.created_at)
  const val = metric.value === 'revenue' ? paidValue : () => 1
  if (range.value === '12m') {
    const all = fillBuckets(monthBuckets(24), bookings.value, date, val)
    return { cur: all.slice(12), prev: all.slice(0, 12) }
  }
  const all = fillBuckets(dayBuckets(60), bookings.value, date, val)
  return { cur: all.slice(30), prev: all.slice(0, 30) }
})
const chartData = computed(() => chartBuckets.value.cur.map(b => ({ label: b.label, title: b.title, value: b.value })))
const chartTotal = computed(() => chartBuckets.value.cur.reduce((s, b) => s + b.value, 0))
const chartDelta = computed(() => pctDelta(chartTotal.value, chartBuckets.value.prev.reduce((s, b) => s + b.value, 0)))
const fallbackData = computed(() => ((metric.value === 'revenue' ? charts.value.revenue_trend : charts.value.bookings_trend) ?? [])
  .map((d: any) => ({ label: d.label, value: Number(d.value) || 0 })))

const stalePending = computed(() => {
  const cutoff = Date.now() - 3 * 86_400_000
  return bookings.value.filter(b => b.status === 'pending' && new Date(b.created_at).getTime() < cutoff).length
})
const unpaidConfirmed = computed(() => bookings.value.filter(b => b.status === 'confirmed' && b.payment_status !== 'paid' && b.payment_status !== 'refunded').length)

const actions = computed(() => [
  { label: 'Store approvals', hint: 'New stores waiting to go live', icon: 'building-store', tone: 'tone-warning', count: stats.pending_stores, to: '/support/stores?status=pending', loading: loading.value },
  reviewHealth.value.flagged !== null
    ? { label: 'Flagged reviews', hint: 'Spam, duplicates or rating/text mismatch', icon: 'alert-triangle', tone: 'tone-danger', count: reviewHealth.value.flagged, to: '/support/reviews', loading: false }
    : { label: 'Hidden reviews', hint: 'Reviews currently hidden from venues', icon: 'eye-off', tone: 'tone-danger', count: reviewHealth.value.hidden ?? 0, to: '/support/reviews', loading: reviewHealth.value.loading },
  { label: 'Slow booking replies', hint: 'Pending for more than 3 days', icon: 'calendar-clock', tone: 'tone-info', count: stalePending.value, to: '/support/bookings?status=pending', loading: bookingsLoading.value },
  { label: 'Confirmed but unpaid', hint: 'Customers who still need to pay', icon: 'wallet', tone: 'tone-warning', count: unpaidConfirmed.value, to: '/support/bookings?status=confirmed', loading: bookingsLoading.value },
])
const pendingTotal = computed(() => stats.pending_stores + (reviewHealth.value.flagged ?? 0))

// First load shows skeletons; every later update (realtime event, tab shown again) is
// quiet: numbers and lists change in place and a failed refresh keeps what is shown.
const loadedOnce = ref(false)
let seq = 0
let lastRun = 0

async function load(quiet = false) {
  const id = ++seq
  if (!quiet || !loadedOnce.value) {
    loading.value = !loadedOnce.value
    loadError.value = ''
  }
  lastRun = Date.now()
  try {
    const { data } = await api.get('/admin/dashboard')
    if (id !== seq) return
    Object.assign(stats, data.data.stats)
    recentBookings.value = data.data.recent_bookings ?? []
    recentStores.value = data.data.recent_stores ?? []
    charts.value = data.data.charts ?? {}
    statusCounts.value = data.data.bookings_by_status ?? {}
    activityFeed.value = data.data.recent_activity ?? []
    loadedOnce.value = true
  } catch (e: any) {
    if (id !== seq) return
    if (!loadedOnce.value) loadError.value = e.response?.data?.message || 'Please check your connection and try again.'
    return
  } finally { if (id === seq) loading.value = false }
  loadExtras()
}

function loadExtras() {
  // All bookings once, for 30-day deltas and the 12-month trend.
  const first = bookingsLoading.value
  api.get('/admin/bookings', { params: { per_page: 5000 } })
    .then(({ data }) => { bookings.value = data.data?.data ?? [] })
    .catch(() => { if (first) bookings.value = [] })
    .finally(() => { bookingsLoading.value = false })
  if (stats.pending_stores) {
    api.get('/admin/stores', { params: { status: 'pending', per_page: 5 } })
      .then(({ data }) => { pendingStoresList.value = data.data?.data ?? [] }).catch(() => {})
  } else {
    pendingStoresList.value = []
  }
  // Review health: AI insights when available, otherwise the hidden-review count.
  api.get('/admin/reviews/insights', { params: { limit: 1 } })
    .then(({ data }) => {
      const fc = data.data?.flag_counts
      if (!fc) throw new Error('no insights')
      const flagged = Object.entries(fc).filter(([k]) => k !== 'very_short').reduce((s, [, v]) => s + Number(v || 0), 0)
      reviewHealth.value = { loading: false, flagged, hidden: null }
    })
    .catch(() => api.get('/admin/reviews', { params: { approved: 0, per_page: 1 } })
      .then(({ data }) => { reviewHealth.value = { loading: false, flagged: null, hidden: data.data?.total ?? 0 } })
      .catch(() => { if (reviewHealth.value.loading) reviewHealth.value = { loading: false, flagged: null, hidden: 0 } }))
}

function refreshQuietly() { if (loadedOnce.value) load(true) }

// New bookings, payments, store sign-ups and reviews update the overview in place.
useLiveRefresh(['booking', 'payment', 'store', 'review'], refreshQuietly, 800)

function onVisible() {
  if (document.visibilityState === 'visible' && Date.now() - lastRun > 60_000) refreshQuietly()
}
onMounted(() => {
  load()
  document.addEventListener('visibilitychange', onVisible)
})
onBeforeUnmount(() => document.removeEventListener('visibilitychange', onVisible))
</script>
