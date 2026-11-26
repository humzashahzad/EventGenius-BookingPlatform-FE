<template>
  <div class="space-y-6">
    <header class="page-header !mb-0">
      <div class="min-w-0">
        <p class="page-eyebrow">Overview</p>
        <h1 class="page-title">{{ data?.store?.name || 'Dashboard' }}</h1>
        <p class="page-subtitle">
          <template v-if="data?.has_store">
            <span v-if="pendingCount">{{ pendingCount }} booking request{{ pendingCount === 1 ? '' : 's' }} waiting for your answer.</span>
            <span v-else>You're all caught up on booking requests.</span>
          </template>
          <template v-else>Welcome to your store panel.</template>
        </p>
      </div>
      <div v-if="data?.has_store && data?.store?.status === 'approved'" class="page-header-actions">
        <RouterLink to="/shop/bookings" class="btn-secondary"><AppIcon icon="calendar-event" class="w-4 h-4" />Bookings</RouterLink>
        <RouterLink to="/shop/venues/create" class="btn-primary"><AppIcon icon="plus" class="w-4 h-4" />Add venue</RouterLink>
      </div>
    </header>

    <!-- Error -->
    <div v-if="loadError && !loading" class="card">
      <div class="empty-state">
        <div class="empty-state-icon"><AppIcon icon="alert-circle" class="w-5 h-5" /></div>
        <p class="empty-state-title">Couldn't load your dashboard</p>
        <p class="empty-state-desc">{{ loadError }}</p>
        <div class="empty-state-actions"><button class="btn-primary" @click="retry">Try again</button></div>
      </div>
    </div>

    <!-- Setup prompt -->
    <div v-else-if="!loading && !data?.has_store" class="card">
      <div class="empty-state">
        <div class="empty-state-icon"><AppIcon icon="building" class="w-5 h-5" /></div>
        <p class="empty-state-title">Set up your store</p>
        <p class="empty-state-desc">Complete your store profile to start listing venues and accepting bookings.</p>
        <div class="empty-state-actions"><RouterLink to="/shop/profile" class="btn-primary">Set up store</RouterLink></div>
      </div>
    </div>

    <template v-else>
      <!-- Store status -->
      <div v-if="data && data.store?.status !== 'approved'" :class="data.store?.status === 'pending' ? 'alert-warning' : 'alert-danger'" role="status">
        <AppIcon icon="alert-triangle" class="w-5 h-5 shrink-0" />
        <div>
          <p class="alert-title">Your store is {{ data.store?.status }}</p>
          <p v-if="data.store?.status === 'pending'">An admin needs to approve it before you can add venues.</p>
          <p v-else-if="data.store?.status === 'suspended'">Contact support if you believe this is a mistake.</p>
        </div>
      </div>

      <!-- KPIs -->
      <section aria-label="Key figures" class="grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-6 gap-3 sm:gap-4">
        <KpiTile label="Venues" icon="building" tone="neutral" :loading="loading" to="/shop/venues"
          :value="stats.total_venues ?? 0"
          :helper="`${stats.active_venues ?? 0} active`" />
        <KpiTile label="Bookings" icon="calendar-event" tone="info" :loading="loading || bookingsLoading" to="/shop/bookings"
          :value="(stats.total_bookings ?? 0).toLocaleString('en-PK')"
          :delta="kpi.bookings.delta"
          :helper="`${kpi.bookings.cur} in last 30 days`" />
        <KpiTile label="Pending requests" icon="clock" tone="warning" :loading="loading || bookingsLoading" to="/shop/bookings?status=pending"
          :value="pendingCount"
          :helper="oldestPendingText" />
        <KpiTile label="Confirmed" icon="calendar-check" tone="success" :loading="loading || bookingsLoading" to="/shop/bookings?status=confirmed"
          :value="stats.confirmed_bookings ?? 0"
          :delta="kpi.confirmed.delta"
          :helper="`${kpi.confirmed.cur} confirmed in 30 days`" />
        <KpiTile label="Revenue" icon="wallet" tone="brand" :loading="loading || bookingsLoading"
          unit="PKR" :value="compactNumber(stats.total_revenue)"
          :title="formatPKR(stats.total_revenue)"
          :delta="kpi.revenue.delta"
          :helper="`${compactPKR(kpi.revenue.cur)} in 30 days`" />
        <KpiTile label="Avg rating" icon="star" tone="warning" :loading="loading" to="/shop/reviews"
          :value="avgRating ? avgRating.toFixed(1) : '—'"
          :helper="totalReviews ? `from ${totalReviews.toLocaleString('en-PK')} reviews` : 'No reviews yet'" />
      </section>
      <p class="-mt-3 text-xs text-ink-muted">Changes compare the last 30 days with the 30 days before.</p>

      <div class="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <!-- Trend chart -->
        <section class="card xl:col-span-3 min-w-0">
          <div class="card-header flex-wrap gap-3">
            <div class="min-w-0">
              <h2 class="card-title">{{ metric === 'revenue' ? 'Revenue' : 'New bookings' }}</h2>
              <p class="card-subtitle">
                <template v-if="metric === 'revenue'">Value of bookings paid, by {{ range === '12m' ? 'month' : 'day' }}</template>
                <template v-else>Booking requests received, by {{ range === '12m' ? 'month' : 'day' }}</template>
              </p>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <div class="segmented control-sm" role="group" aria-label="Metric">
                <button type="button" :aria-pressed="metric === 'revenue'" @click="metric = 'revenue'">Revenue</button>
                <button type="button" :aria-pressed="metric === 'bookings'" @click="metric = 'bookings'">Bookings</button>
              </div>
              <div class="segmented control-sm" role="group" aria-label="Range">
                <button type="button" :aria-pressed="range === '30d'" @click="range = '30d'">30 days</button>
                <button type="button" :aria-pressed="range === '12m'" @click="range = '12m'">12 months</button>
              </div>
            </div>
          </div>
          <div class="card-body">
            <div v-if="loading || bookingsLoading" class="skeleton h-[340px] w-full" />
            <template v-else>
              <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-4">
                <p class="text-2xl font-display font-bold text-ink num">{{ metric === 'revenue' ? compactPKR(chartTotal) : chartTotal.toLocaleString('en-PK') }}</p>
                <span v-if="chartDelta !== null" :class="chartDelta >= 0 ? 'stat-delta-up' : 'stat-delta-down'" class="text-xs">
                  <AppIcon :icon="chartDelta >= 0 ? 'trending-up' : 'trending-down'" class="w-3 h-3" />{{ Math.abs(chartDelta).toFixed(0) }}%
                </span>
                <span class="text-xs text-ink-muted">{{ range === '12m' ? 'last 12 months vs the 12 before' : 'last 30 days vs the 30 before' }}</span>
              </div>
              <TrendBars
                v-if="chartHasData"
                :data="chartData"
                :height="300"
                :color="metric === 'revenue' ? 'var(--chart-1)' : 'var(--chart-2)'"
                :format="metric === 'revenue' ? (v: number) => formatPKR(v) : (v: number) => `${v} booking${v === 1 ? '' : 's'}`"
                :aria-label="`${metric === 'revenue' ? 'Revenue' : 'New bookings'} ${range === '12m' ? 'per month, last 12 months' : 'per day, last 30 days'}`"
              />
              <div v-else class="empty-state h-[300px]">
                <div class="empty-state-icon"><AppIcon icon="chart-bar" class="w-5 h-5" /></div>
                <p class="empty-state-title">Nothing in this period</p>
                <p class="empty-state-desc">{{ metric === 'revenue' ? 'Revenue appears once customers pay for confirmed bookings.' : 'New booking requests will show here.' }}</p>
                <div class="empty-state-actions"><button class="btn-secondary btn-sm" @click="range = '12m'">Show 12 months</button></div>
              </div>
            </template>
          </div>
        </section>

        <!-- Needs action -->
        <section class="card xl:col-span-2 min-w-0 flex flex-col">
          <div class="card-header">
            <div>
              <h2 class="card-title">Needs action</h2>
              <p class="card-subtitle">Things waiting on you</p>
            </div>
          </div>
          <nav class="tabs px-3" role="tablist" aria-label="Needs action">
            <button role="tab" class="tab" :aria-selected="actionTab === 'requests'" @click="actionTab = 'requests'">Requests <span class="tab-count">{{ pendingCount }}</span></button>
            <button role="tab" class="tab" :aria-selected="actionTab === 'unpaid'" @click="actionTab = 'unpaid'">Unpaid <span class="tab-count">{{ unpaid.length }}</span></button>
            <button role="tab" class="tab" :aria-selected="actionTab === 'reviews'" @click="actionTab = 'reviews'">Reviews <span class="tab-count">{{ unanswered.total }}</span></button>
          </nav>
          <div class="flex-1 min-h-[220px]" role="tabpanel">
            <div v-if="loading || bookingsLoading" class="p-4 space-y-3"><div v-for="i in 4" :key="i" class="skeleton h-12 w-full" /></div>

            <!-- Pending requests -->
            <template v-else-if="actionTab === 'requests'">
              <ul v-if="pendingList.length" class="divide-y divide-line">
                <li v-for="b in pendingList.slice(0, 5)" :key="b.id" class="px-4 py-3 flex flex-wrap sm:flex-nowrap items-center gap-x-3 gap-y-2">
                  <RouterLink :to="`/shop/bookings/${b.id}`" class="min-w-0 flex-1 basis-full sm:basis-auto group">
                    <p class="text-sm font-medium text-ink truncate group-hover:underline">{{ b.event_name || b.client?.name }}</p>
                    <p class="text-xs text-ink-muted truncate">{{ b.venue?.name }} · {{ formatDate(b.event_date) }} · <span class="num">{{ compactPKR(b.total_amount) }}</span></p>
                  </RouterLink>
                  <!-- Fixed-height action slot so the row never jumps when it is answered. -->
                  <div class="flex gap-2 shrink-0 min-h-[2rem] items-center justify-end sm:min-w-[11rem]">
                    <template v-if="b.status === 'pending'">
                      <button class="btn-primary btn-sm" :disabled="actions.isPending(b.id)" :aria-busy="actions.isPending(b.id, 'confirm')" @click="doConfirm(b)">
                        <AppIcon :icon="actions.isPending(b.id, 'confirm') ? 'loader' : 'check'" :class="actions.isPending(b.id, 'confirm') ? 'w-4 h-4 animate-spin' : 'w-4 h-4'" />Accept
                      </button>
                      <button class="btn-secondary btn-sm" :disabled="actions.isPending(b.id)" @click="openReject(b)">Reject</button>
                    </template>
                    <template v-else>
                      <span :class="statusBadgeClass(b.status)">
                        <AppIcon v-if="actions.isPending(b.id)" icon="loader" class="w-3 h-3 animate-spin" />{{ statusLabel(b.status) }}
                      </span>
                      <RouterLink :to="`/shop/bookings/${b.id}`" class="btn-ghost btn-sm">View</RouterLink>
                    </template>
                  </div>
                </li>
              </ul>
              <div v-else class="empty-state">
                <div class="empty-state-icon"><AppIcon icon="checks" class="w-5 h-5" /></div>
                <p class="empty-state-title">No pending requests</p>
                <p class="empty-state-desc">New booking requests appear here first.</p>
                <div class="empty-state-actions"><RouterLink to="/shop/bookings" class="btn-secondary btn-sm">All bookings</RouterLink></div>
              </div>
            </template>

            <!-- Unpaid confirmed -->
            <template v-else-if="actionTab === 'unpaid'">
              <ul v-if="unpaid.length" class="divide-y divide-line">
                <li v-for="b in unpaid.slice(0, 6)" :key="b.id">
                  <RouterLink :to="`/shop/bookings/${b.id}`" class="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface-hover">
                    <div class="min-w-0">
                      <p class="text-sm font-medium text-ink truncate">{{ b.client?.name }}</p>
                      <p class="text-xs text-ink-muted truncate">{{ b.venue?.name }} · event {{ formatDate(b.event_date) }}</p>
                    </div>
                    <div class="text-right shrink-0">
                      <p class="text-sm font-medium text-ink num">{{ compactPKR(b.total_amount) }}</p>
                      <span class="badge-unpaid">Unpaid</span>
                    </div>
                  </RouterLink>
                </li>
              </ul>
              <div v-else class="empty-state">
                <div class="empty-state-icon"><AppIcon icon="wallet" class="w-5 h-5" /></div>
                <p class="empty-state-title">Every confirmed booking is paid</p>
                <p class="empty-state-desc">Confirmed bookings still waiting for payment show here.</p>
                <div class="empty-state-actions"><RouterLink to="/shop/bookings?status=confirmed" class="btn-secondary btn-sm">Confirmed bookings</RouterLink></div>
              </div>
            </template>

            <!-- Unanswered reviews -->
            <template v-else>
              <ul v-if="unanswered.items.length" class="divide-y divide-line">
                <li v-for="r in unanswered.items" :key="r.id">
                  <RouterLink to="/shop/reviews" class="block px-4 py-3 hover:bg-surface-hover">
                    <div class="flex items-center justify-between gap-3">
                      <p class="text-sm font-medium text-ink truncate">{{ r.title || r.client?.name }}</p>
                      <span class="inline-flex items-center gap-0.5 text-xs font-medium text-ink shrink-0"><AppIcon icon="star-filled" class="w-3.5 h-3.5 text-amber-500 fill-current" />{{ r.rating }}</span>
                    </div>
                    <p class="text-xs text-ink-muted line-clamp-2 mt-0.5">{{ r.comment }}</p>
                  </RouterLink>
                </li>
              </ul>
              <div v-else class="empty-state">
                <div class="empty-state-icon"><AppIcon icon="message" class="w-5 h-5" /></div>
                <p class="empty-state-title">All reviews answered</p>
                <p class="empty-state-desc">Reviews you haven't replied to yet show here.</p>
                <div class="empty-state-actions"><RouterLink to="/shop/reviews" class="btn-secondary btn-sm">Reviews</RouterLink></div>
              </div>
            </template>
          </div>
          <div class="card-footer !py-2.5 flex justify-end">
            <RouterLink :to="actionTab === 'reviews' ? '/shop/reviews' : actionTab === 'unpaid' ? '/shop/bookings?status=confirmed' : '/shop/bookings?status=pending'" class="btn-ghost btn-sm">
              View all <AppIcon icon="chevron-right" class="w-4 h-4" />
            </RouterLink>
          </div>
        </section>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <!-- Bookings by venue -->
        <section class="card min-w-0">
          <div class="card-header">
            <div><h2 class="card-title">Bookings by venue</h2><p class="card-subtitle">All time</p></div>
          </div>
          <div class="card-body">
            <div v-if="loading" class="space-y-4"><div v-for="i in 3" :key="i" class="skeleton h-8 w-full" /></div>
            <RankBars v-else-if="venueBookings.length" :data="venueBookings" aria-label="Bookings by venue" />
            <div v-else class="empty-state !py-8">
              <div class="empty-state-icon"><AppIcon icon="building" class="w-5 h-5" /></div>
              <p class="empty-state-title">No bookings yet</p>
              <p class="empty-state-desc">Bookings per venue will show here.</p>
              <div class="empty-state-actions"><RouterLink to="/shop/venues" class="btn-secondary btn-sm">Your venues</RouterLink></div>
            </div>
            <div v-if="venues.length" class="mt-5 pt-4 border-t border-line">
              <p class="eyebrow mb-1">Ratings</p>
              <dl>
                <div v-for="v in venues" :key="v.id" class="dl-row">
                  <dt class="truncate min-w-0">{{ v.name }}</dt>
                  <dd class="inline-flex items-center gap-1 shrink-0">
                    <AppIcon icon="star-filled" class="w-3.5 h-3.5 text-amber-500 fill-current" />
                    {{ Number(v.avg_rating || 0).toFixed(1) }}
                    <span class="text-ink-muted font-normal">({{ v.total_reviews || 0 }})</span>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        <!-- Recent bookings -->
        <section class="card xl:col-span-2 min-w-0 overflow-hidden">
          <div class="card-header">
            <div><h2 class="card-title">Recent bookings</h2><p class="card-subtitle">Latest 10 requests</p></div>
            <RouterLink to="/shop/bookings" class="btn-ghost btn-sm">View all <AppIcon icon="chevron-right" class="w-4 h-4" /></RouterLink>
          </div>
          <div v-if="loading" class="p-4 space-y-3"><div v-for="i in 5" :key="i" class="skeleton h-9 w-full" /></div>
          <div v-else-if="!data?.recent_bookings?.length" class="empty-state">
            <div class="empty-state-icon"><AppIcon icon="calendar-event" class="w-5 h-5" /></div>
            <p class="empty-state-title">No bookings yet</p>
            <p class="empty-state-desc">Bookings will appear here once clients start booking your venues.</p>
            <div class="empty-state-actions"><RouterLink to="/shop/venues" class="btn-secondary btn-sm">Check your venues</RouterLink></div>
          </div>
          <template v-else>
            <!-- phone: list -->
            <ul class="md:hidden divide-y divide-line">
              <li v-for="b in data.recent_bookings" :key="b.id">
                <RouterLink :to="`/shop/bookings/${b.id}`" class="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface-hover">
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-ink truncate">{{ b.client?.name }}</p>
                    <p class="text-xs text-ink-muted truncate">{{ b.venue?.name }} · {{ formatDate(b.event_date) }}</p>
                  </div>
                  <div class="text-right shrink-0 space-y-1">
                    <p class="text-sm font-medium text-ink num">{{ compactPKR(b.total_amount) }}</p>
                    <span :class="statusBadgeClass(b.status)">{{ statusLabel(b.status) }}</span>
                  </div>
                </RouterLink>
              </li>
            </ul>
            <div class="hidden md:block table-wrapper">
              <table class="data-table is-compact">
                <thead>
                  <tr><th>Client &amp; venue</th><th>Event date</th><th>Status</th><th class="cell-num">Amount</th></tr>
                </thead>
                <tbody>
                  <tr v-for="b in data.recent_bookings" :key="b.id" class="cursor-pointer" @click="router.push(`/shop/bookings/${b.id}`)">
                    <td>
                      <RouterLink :to="`/shop/bookings/${b.id}`" class="flex items-center gap-2.5 min-w-0" @click.stop>
                        <span class="avatar w-8 h-8 text-[11px] shrink-0">{{ initials(b.client?.name) }}</span>
                        <span class="min-w-0">
                          <span class="block cell-primary truncate max-w-[240px]">{{ b.client?.name }}</span>
                          <span class="block text-xs text-ink-muted truncate max-w-[240px]">{{ b.venue?.name }}</span>
                        </span>
                      </RouterLink>
                    </td>
                    <td class="whitespace-nowrap">{{ formatDate(b.event_date) }}</td>
                    <td><span :class="statusBadgeClass(b.status)">{{ statusLabel(b.status) }}</span></td>
                    <td class="cell-num text-ink font-medium">{{ formatPKR(b.total_amount) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
        </section>
      </div>
    </template>

    <!-- Reject dialog (same call as the bookings page) -->
    <VuexyModal v-model:visible="showReject" title="Reject booking" width="28rem">
      <div class="panel-sunken p-3 mb-4 text-sm">
        <p class="font-medium text-ink">{{ rejectTarget?.event_name }}</p>
        <p class="text-ink-muted text-xs mt-0.5">{{ rejectTarget?.client?.name }} · {{ formatDate(rejectTarget?.event_date) }}</p>
      </div>
      <FormField id="dash-reject" label="Reason" required :error="rejectError">
        <TextareaInput v-model="rejectReason" :rows="3" auto-grow placeholder="Let the customer know why…" />
      </FormField>
      <template #footer>
        <div class="flex justify-end gap-2">
          <button class="btn-secondary" @click="showReject = false">Cancel</button>
          <button class="btn-danger" @click="submitReject">Reject booking</button>
        </div>
      </template>
    </VuexyModal>
  </div>
</template>

<script setup lang="ts">
import { FormField, TextareaInput } from '@/components/forms'
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import api from '@/lib/axios'
import { formatPKR, formatDate } from '@/lib/format'
import { statusBadgeClass, statusLabel } from '@/lib/status'
import { useSilentList, useSilentResource } from '@/composables/useSilentList'
import { useRowActions } from '@/composables/useRowActions'
import { useLiveRefresh } from '@/composables/useLiveRefresh'
import AppIcon from '@/components/ui/AppIcon.vue'
import VuexyModal from '@/components/ui/VuexyModal.vue'
import KpiTile from '@/components/dashboard/KpiTile.vue'
import TrendBars from '@/components/dashboard/TrendBars.vue'
import RankBars from '@/components/dashboard/RankBars.vue'
import { compactNumber, compactPKR, pctDelta, dayBuckets, monthBuckets, fillBuckets, sumBetween, initials } from '@/components/dashboard/metrics'

const router = useRouter()

// Each block loads once with a skeleton, then refreshes quietly in place.
const dash = useSilentResource<any>(async () => (await api.get('/store/dashboard')).data.data)
const data = dash.data
const loading = dash.loading
const loadError = dash.error
const bookingsList = useSilentList<any>(async () => {
  const { data: res } = await api.get('/store/bookings', { params: { per_page: 1000 } })
  return res.data?.data ?? []
})
const bookings = bookingsList.items
const bookingsLoading = bookingsList.loading
const venuesList = useSilentList<any>(async () => {
  const { data: res } = await api.get('/store/venues')
  const v = res.data
  return Array.isArray(v) ? v : (v?.data ?? [])
})
const venues = venuesList.items
const unansweredRes = useSilentResource<{ total: number; items: any[] }>(async () => {
  const { data: res } = await api.get('/store/reviews', { params: { replied: 'no', per_page: 5 } })
  return { total: res.data?.total ?? 0, items: res.data?.data ?? [] }
})
const unanswered = computed(() => unansweredRes.data.value ?? { total: 0, items: [] })

const metric = ref<'revenue' | 'bookings'>('revenue')
const range = ref<'30d' | '12m'>('12m')
const actionTab = ref<'requests' | 'unpaid' | 'reviews'>('requests')

// Requests answered from this screen stay in place (showing their new status) so the
// next row doesn't jump under the pointer while people work down the list.
const answered = ref(new Set<number>())

const stats = computed(() => data.value?.stats ?? {})
const pendingList = computed(() => bookings.value
  .filter(b => b.status === 'pending' || answered.value.has(b.id))
  .sort((a, b) => String(a.event_date).localeCompare(String(b.event_date))))
const pendingCount = computed(() => bookingsLoading.value
  ? (stats.value.pending_bookings ?? 0)
  : bookings.value.filter(b => b.status === 'pending').length)
const unpaid = computed(() => bookings.value
  .filter(b => b.status === 'confirmed' && b.payment_status !== 'paid' && b.payment_status !== 'refunded')
  .sort((a, b) => String(a.event_date).localeCompare(String(b.event_date))))

const oldestPendingText = computed(() => {
  const list = bookings.value.filter(b => b.status === 'pending')
  if (!list.length) return 'Nothing waiting'
  const oldest = list.reduce((m, b) => (b.created_at < m.created_at ? b : m))
  const days = Math.floor((Date.now() - new Date(oldest.created_at).getTime()) / 86_400_000)
  return days < 1 ? 'Oldest from today' : `Oldest waiting ${days} day${days === 1 ? '' : 's'}`
})

const DAY = 86_400_000
const paidValue = (b: any) => (b.payment_status === 'paid' ? Number(b.total_amount) || 0 : 0)
function windowPair(days: number) {
  const end = new Date(Date.now() + 1)
  const mid = new Date(end.getTime() - days * DAY)
  const start = new Date(mid.getTime() - days * DAY)
  return { start, mid, end }
}
const kpi = computed(() => {
  const { start, mid, end } = windowPair(30)
  const rows = bookings.value
  const pair = (date: (r: any) => string | null, val?: (r: any) => number) => {
    const cur = sumBetween(rows, date, mid, end, val)
    const prev = sumBetween(rows, date, start, mid, val)
    return { cur, prev, delta: bookingsLoading.value ? null : pctDelta(cur, prev) }
  }
  return {
    bookings: pair(r => r.created_at),
    confirmed: pair(r => r.confirmed_at),
    revenue: pair(r => r.paid_at, paidValue),
  }
})

const totalReviews = computed(() => venues.value.reduce((s, v) => s + (Number(v.total_reviews) || 0), 0))
const avgRating = computed(() => {
  if (!totalReviews.value) return 0
  return venues.value.reduce((s, v) => s + (Number(v.avg_rating) || 0) * (Number(v.total_reviews) || 0), 0) / totalReviews.value
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
const chartHasData = computed(() => chartData.value.some(d => d.value > 0))

const venueBookings = computed(() => (data.value?.charts?.bookings_by_venue ?? []).map((d: any) => ({ label: d.label, value: Number(d.value) || 0 })))

function refreshAll() {
  dash.refresh()
  bookingsList.refresh()
  venuesList.refresh()
  unansweredRes.refresh()
}

async function load() {
  await dash.load()
  if (!data.value?.has_store) return
  bookingsList.load()
  venuesList.load()
  unansweredRes.load()
}

function retry() {
  load()
}

// New requests, payments and reviews from customers appear without a reload.
useLiveRefresh(['booking', 'payment', 'review', 'venue', 'store'], (type) => {
  if (data.value?.has_store) refreshAll()
  // The shop was just approved: load the parts that only exist with a store.
  else if (type.startsWith('store') || type === '*') void load()
})

// ── Accept / reject (same calls as the bookings page) ────────────────────
// Per-row pending state: owners can accept one request after another without waiting.
const actions = useRowActions()
const showReject = ref(false)
const rejectTarget = ref<any>(null)
const rejectReason = ref('')
const rejectError = ref('')

function quietSync() {
  bookingsList.refresh()
  dash.refresh()
}

function doConfirm(b: any) {
  const prev = { status: b.status, confirmed_at: b.confirmed_at }
  answered.value.add(b.id)
  actions.run(b.id, {
    apply: () => { b.status = 'confirmed'; b.confirmed_at = new Date().toISOString() },
    request: () => api.patch(`/store/bookings/${b.id}/confirm`),
    rollback: () => { Object.assign(b, prev); answered.value.delete(b.id) },
    success: `${b.event_name || 'Booking'} confirmed — the customer can now pay.`,
    error: 'Could not confirm this booking.',
    after: quietSync,
  }, 'confirm')
}

function openReject(b: any) {
  rejectTarget.value = b
  rejectReason.value = ''
  rejectError.value = ''
  showReject.value = true
}

function submitReject() {
  if (!rejectReason.value.trim()) { rejectError.value = 'Please give a reason.'; return }
  const b = rejectTarget.value
  const reason = rejectReason.value.trim()
  const prev = { status: b.status, rejection_reason: b.rejection_reason }
  // Close straight away; the row updates instantly and rolls back if the server refuses.
  showReject.value = false
  rejectTarget.value = null
  answered.value.add(b.id)
  actions.run(b.id, {
    apply: () => { b.status = 'rejected'; b.rejection_reason = reason },
    request: () => api.patch(`/store/bookings/${b.id}/reject`, { reason }),
    rollback: () => { Object.assign(b, prev); answered.value.delete(b.id) },
    success: 'Booking rejected.',
    error: 'Could not reject this booking.',
    after: quietSync,
  }, 'reject')
}

onMounted(load)
</script>
