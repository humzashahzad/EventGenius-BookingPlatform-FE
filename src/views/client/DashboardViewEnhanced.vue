<template>
  <div class="space-y-6">
    <!-- Header -->
    <header class="page-header !mb-0">
      <div class="min-w-0">
        <p class="page-eyebrow">{{ today }}</p>
        <h1 class="page-title">{{ greeting }}, {{ firstName }}</h1>
        <p class="page-subtitle">{{ headerSummary }}</p>
      </div>
      <div class="page-header-actions">
        <RouterLink to="/customer/bookings" class="btn-secondary">
          <AppIcon icon="calendar-event" class="w-4 h-4" />
          My bookings
        </RouterLink>
        <RouterLink to="/venues" class="btn-primary">
          <AppIcon icon="search" class="w-4 h-4" />
          Browse venues
        </RouterLink>
      </div>
    </header>

    <!-- Loading -->
    <div v-if="loading" class="space-y-6" aria-busy="true" aria-label="Loading your dashboard">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="card lg:col-span-2 overflow-hidden flex flex-col sm:flex-row">
          <div class="skeleton !rounded-none aspect-[16/9] sm:aspect-auto sm:w-2/5 sm:min-h-[260px]"></div>
          <div class="p-5 flex-1 space-y-3">
            <div class="skeleton h-5 w-24"></div>
            <div class="skeleton h-7 w-3/4"></div>
            <div class="skeleton h-4 w-1/2"></div>
            <div class="grid grid-cols-3 gap-3 pt-2"><div v-for="i in 3" :key="i" class="skeleton h-12"></div></div>
          </div>
        </div>
        <div class="card p-5 space-y-3">
          <div class="skeleton h-5 w-40"></div>
          <div v-for="i in 3" :key="i" class="skeleton h-14"></div>
        </div>
      </div>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div v-for="i in 4" :key="i" class="card p-5 space-y-2"><div class="skeleton h-4 w-20"></div><div class="skeleton h-7 w-16"></div><div class="skeleton h-3 w-24"></div></div>
      </div>
      <div class="card p-5 space-y-3"><div v-for="i in 4" :key="i" class="skeleton h-12"></div></div>
    </div>

    <!-- Error -->
    <div v-else-if="loadError" class="card">
      <div class="empty-state">
        <div class="empty-state-icon"><AppIcon icon="alert-triangle" class="w-5 h-5" /></div>
        <p class="empty-state-title">We couldn't load your dashboard</p>
        <p class="empty-state-desc">{{ loadError }}</p>
        <div class="empty-state-actions">
          <button type="button" class="btn-primary" @click="res.retry()"><AppIcon icon="refresh" class="w-4 h-4" /> Try again</button>
        </div>
      </div>
    </div>

    <template v-else>
      <!-- Next event + attention -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Next upcoming event -->
        <section class="card overflow-hidden lg:col-span-2" aria-labelledby="next-event-title">
          <div v-if="nextEvent" class="flex flex-col sm:flex-row h-full">
            <div class="relative sm:w-2/5 shrink-0 bg-surface-sunken">
              <img
                :src="venueImage(nextEvent)"
                :alt="nextEvent.venue?.name || 'Venue photo'"
                class="w-full h-full object-cover aspect-[16/9] sm:aspect-auto sm:absolute sm:inset-0"
                @error="onImageError"
              />
              <span class="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-md bg-warm-900/80 px-2.5 py-1 text-xs font-semibold text-white">
                <AppIcon icon="calendar-clock" class="w-3.5 h-3.5" />
                {{ countdownLabel(nextEvent.event_date) }}
              </span>
            </div>
            <div class="flex-1 min-w-0 p-5 flex flex-col">
              <div class="flex flex-wrap items-center gap-2">
                <p class="eyebrow">Next event</p>
                <span :class="statusBadgeClass(nextEvent.status)">{{ statusLabel(nextEvent.status) }}</span>
                <span v-if="paymentBadge(nextEvent)" :class="paymentBadge(nextEvent)!.cls">{{ paymentBadge(nextEvent)!.label }}</span>
              </div>
              <h2 id="next-event-title" class="mt-2 font-display text-xl sm:text-2xl font-bold tracking-tight text-ink break-words">
                {{ nextEvent.event_name }}
              </h2>
              <p class="mt-1 text-sm text-ink-secondary flex items-start gap-1.5">
                <AppIcon icon="map-pin" class="w-4 h-4 mt-0.5 shrink-0 text-ink-muted" />
                <span>{{ nextEvent.venue?.name }}<template v-if="nextEvent.venue?.city"> · {{ nextEvent.venue.city }}</template></span>
              </p>

              <dl class="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div class="panel-sunken px-3 py-2.5 col-span-2 sm:col-span-1">
                  <dt class="text-xs text-ink-muted">Date</dt>
                  <dd class="text-sm font-semibold text-ink">{{ formatEventDate(nextEvent.event_date) }}</dd>
                </div>
                <div class="panel-sunken px-3 py-2.5">
                  <dt class="text-xs text-ink-muted">Time</dt>
                  <dd class="text-sm font-semibold text-ink">{{ formatTime(nextEvent.start_time) || '—' }}</dd>
                </div>
                <div class="panel-sunken px-3 py-2.5">
                  <dt class="text-xs text-ink-muted">Guests</dt>
                  <dd class="text-sm font-semibold text-ink num">{{ guestsOf(nextEvent) ?? '—' }}</dd>
                </div>
              </dl>

              <div v-if="needsPayment(nextEvent)" class="alert-warning mt-4" role="status">
                <AppIcon icon="alert-triangle" class="w-5 h-5 shrink-0" />
                <div><p class="alert-title">Payment due</p><p class="text-sm">Pay {{ formatPKR(nextEvent.total_amount) }} to secure this date.</p></div>
              </div>

              <div class="mt-auto pt-4 flex flex-wrap items-center gap-2">
                <RouterLink v-if="needsPayment(nextEvent)" :to="`/customer/bookings/${nextEvent.id}/pay`" class="btn-primary">
                  <AppIcon icon="credit-card" class="w-4 h-4" /> Pay now
                </RouterLink>
                <RouterLink :to="`/customer/bookings/${nextEvent.id}`" :class="needsPayment(nextEvent) ? 'btn-secondary' : 'btn-primary'">
                  View booking <AppIcon icon="arrow-right" class="w-4 h-4" />
                </RouterLink>
                <span class="ml-auto text-sm text-ink-muted">Total <strong class="text-ink num">{{ formatPKR(nextEvent.total_amount) }}</strong></span>
              </div>
            </div>
          </div>
          <div v-else class="empty-state h-full">
            <div class="empty-state-icon"><AppIcon icon="calendar-event" class="w-5 h-5" /></div>
            <p id="next-event-title" class="empty-state-title">No upcoming events</p>
            <p class="empty-state-desc">Find a venue for your next wedding, mehndi, birthday or corporate dinner and send a booking request.</p>
            <div class="empty-state-actions"><RouterLink to="/venues" class="btn-primary">Browse venues</RouterLink></div>
          </div>
        </section>

        <!-- Needs your attention -->
        <section class="card flex flex-col" aria-labelledby="attention-title">
          <div class="card-header">
            <div>
              <h2 id="attention-title" class="card-title">Needs your attention</h2>
              <p class="card-subtitle">{{ attention.length ? `${attention.length} thing${attention.length > 1 ? 's' : ''} to do` : 'Payments and reviews' }}</p>
            </div>
            <span v-if="attention.length" class="badge-pending">{{ attention.length }} open</span>
          </div>
          <ul v-if="attention.length" class="divide-y divide-line">
            <li v-for="item in attention" :key="item.key" class="flex items-start gap-3 px-5 py-3.5">
              <span class="icon-chip icon-chip-sm" :class="item.tone"><AppIcon :icon="item.icon" class="w-4 h-4" /></span>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-ink break-words">{{ item.title }}</p>
                <p class="text-xs text-ink-muted">{{ item.meta }}</p>
              </div>
              <RouterLink :to="item.to" class="btn-outline btn-sm shrink-0">{{ item.action }}</RouterLink>
            </li>
          </ul>
          <div v-else class="flex-1 flex flex-col items-center justify-center text-center px-5 py-8">
            <span class="icon-chip tone-success"><AppIcon icon="circle-check" class="w-5 h-5" /></span>
            <p class="mt-3 text-sm font-semibold text-ink">You're all caught up</p>
            <p class="mt-1 text-sm text-ink-muted max-w-[17rem]">Unpaid bookings and events waiting for your review will show up here.</p>
          </div>
        </section>
      </div>

      <!-- KPI tiles -->
      <section aria-label="Booking summary" class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div v-for="k in kpis" :key="k.label" class="stat-card !items-start !p-4 sm:!p-5">
          <span class="icon-chip hidden sm:inline-flex" :class="k.tone"><AppIcon :icon="k.icon" class="w-5 h-5" /></span>
          <div class="min-w-0">
            <p class="stat-label">{{ k.label }}</p>
            <p class="stat-value" :class="{ '!text-xl sm:!text-2xl': k.small }">{{ k.value }}</p>
            <p class="stat-meta">{{ k.helper }}</p>
          </div>
        </div>
      </section>

      <!-- Recent bookings -->
      <section class="card overflow-hidden" aria-labelledby="recent-title">
        <div class="card-header">
          <div>
            <h2 id="recent-title" class="card-title">Recent bookings</h2>
            <p class="card-subtitle">Your latest requests and events</p>
          </div>
          <RouterLink to="/customer/bookings" class="btn-ghost btn-sm">View all <AppIcon icon="chevron-right" class="w-4 h-4" /></RouterLink>
        </div>

        <div v-if="recentBookings.length === 0" class="empty-state">
          <div class="empty-state-icon"><AppIcon icon="calendar-event" class="w-5 h-5" /></div>
          <p class="empty-state-title">No bookings yet</p>
          <p class="empty-state-desc">When you book a venue it will show up here.</p>
          <div class="empty-state-actions"><RouterLink to="/venues" class="btn-primary">Browse venues</RouterLink></div>
        </div>

        <template v-else>
          <!-- Phones: stacked cards -->
          <ul class="md:hidden divide-y divide-line">
            <li v-for="b in recentBookings" :key="b.id">
              <RouterLink :to="`/customer/bookings/${b.id}`" class="flex gap-3 px-4 py-3.5 hover:bg-surface-hover transition-colors">
                <img :src="venueImage(b)" alt="" class="w-16 h-16 rounded-lg object-cover shrink-0 bg-surface-sunken" loading="lazy" @error="onImageError" />
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-semibold text-ink break-words">{{ b.event_name }}</p>
                  <p class="text-xs text-ink-muted break-words">{{ b.venue?.name }} · {{ formatEventDate(b.event_date, { day: 'numeric', month: 'short', year: 'numeric' }) }}</p>
                  <div class="mt-2 flex flex-wrap items-center gap-1.5">
                    <span :class="statusBadgeClass(b.status)">{{ statusLabel(b.status) }}</span>
                    <span v-if="paymentBadge(b)" :class="paymentBadge(b)!.cls">{{ paymentBadge(b)!.label }}</span>
                    <span class="ml-auto text-sm font-semibold text-ink num">{{ formatPKR(b.total_amount) }}</span>
                  </div>
                </div>
              </RouterLink>
            </li>
          </ul>

          <!-- Tablet/desktop: table -->
          <div class="hidden md:block table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th class="cell-num">Total</th>
                  <th class="cell-actions"><span class="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="b in recentBookings" :key="b.id" class="cursor-pointer" @click="router.push(`/customer/bookings/${b.id}`)">
                  <td>
                    <div class="flex items-center gap-3 min-w-[220px]">
                      <img :src="venueImage(b)" alt="" class="w-10 h-10 rounded-lg object-cover shrink-0 bg-surface-sunken" loading="lazy" @error="onImageError" />
                      <div class="min-w-0">
                        <p class="cell-primary">{{ b.event_name }}</p>
                        <p class="text-xs text-ink-muted">{{ b.venue?.name }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="whitespace-nowrap">
                    {{ formatEventDate(b.event_date, { day: 'numeric', month: 'short', year: 'numeric' }) }}
                    <p class="text-xs text-ink-muted">{{ formatTime(b.start_time) }}</p>
                  </td>
                  <td><span :class="statusBadgeClass(b.status)">{{ statusLabel(b.status) }}</span></td>
                  <td>
                    <span v-if="paymentBadge(b)" :class="paymentBadge(b)!.cls">{{ paymentBadge(b)!.label }}</span>
                    <span v-else class="text-ink-muted">—</span>
                  </td>
                  <td class="cell-num cell-primary">{{ formatPKR(b.total_amount) }}</td>
                  <td class="cell-actions">
                    <RouterLink :to="`/customer/bookings/${b.id}`" class="btn-ghost btn-sm" @click.stop>
                      View<span class="sr-only"> {{ b.event_name }}</span>
                    </RouterLink>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </section>

      <!-- Quick actions -->
      <section aria-label="Quick actions" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <RouterLink v-for="q in quickActions" :key="q.to" :to="q.to" class="card card-hover flex items-center gap-3 p-4">
          <span class="icon-chip" :class="q.tone"><AppIcon :icon="q.icon" class="w-5 h-5" /></span>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold text-ink">{{ q.label }}</p>
            <p class="text-xs text-ink-muted">{{ q.desc }}</p>
          </div>
          <AppIcon icon="chevron-right" class="w-4 h-4 text-ink-muted shrink-0" />
        </RouterLink>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import api from '@/lib/axios'
import { useCachedResource, cacheGet, cacheSet } from '@/composables/usePageCache'
import { useLiveRefresh } from '@/composables/useLiveRefresh'
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '@/stores/chat'
import AppIcon from '@/components/ui/AppIcon.vue'
import { formatTime, formatPKR, formatPKRCompact } from '@/lib/format'
import { statusBadgeClass, statusLabel } from '@/lib/status'
import {
  venueImage, onImageError, formatEventDate, countdownLabel, daysUntil,
  isUpcomingBooking, needsPayment, paymentBadge, guestsOf,
} from '@/components/client/bookingUtils'

const authStore = useAuthStore()
const chatStore = useChatStore()
const router = useRouter()
interface DashboardData {
  stats: { total_bookings: number; upcoming_bookings: number; completed_bookings: number; cancelled_bookings: number }
  recent: any[]
  all: any[]
}
const EMPTY_STATS = { total_bookings: 0, upcoming_bookings: 0, completed_bookings: 0, cancelled_bookings: 0 }

// First visit shows the skeleton; coming back shows the last data and refreshes it quietly.
const res = useCachedResource<DashboardData>(() => 'client:dashboard', async () => {
  const [dash, list] = await Promise.allSettled([
    api.get('/client/dashboard'),
    api.get('/client/bookings', { params: { per_page: 100 } }),
  ])
  if (dash.status === 'rejected') throw dash.reason
  return {
    stats: { ...EMPTY_STATS, ...dash.value.data.data.stats },
    recent: (dash.value.data.data.recent_bookings || []).slice(0, 5),
    all: list.status === 'fulfilled' ? (list.value.data.data?.data || []) : [],
  }
})
const loading = res.loading
const loadError = computed(() => (res.data.value ? '' : res.error.value))
const stats = computed(() => res.data.value?.stats ?? EMPTY_STATS)
const recentBookings = computed(() => res.data.value?.recent ?? [])
const allBookings = computed(() => res.data.value?.all ?? [])
/** booking id → true when a completed booking can still be reviewed */
const reviewable = ref<Record<number, boolean>>(cacheGet<Record<number, boolean>>('client:dashboard:reviewable') ?? {})

const firstName = computed(() => authStore.user?.name?.split(' ')[0] || 'there')
const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
const greeting = (() => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
})()

// The full list (if it loaded) is the source of truth; otherwise fall back to the dashboard's recent list.
const source = computed(() => (allBookings.value.length ? allBookings.value : recentBookings.value))

const upcoming = computed(() =>
  source.value
    .filter(isUpcomingBooking)
    .sort((a, b) => (daysUntil(a.event_date) ?? 0) - (daysUntil(b.event_date) ?? 0) || String(a.start_time).localeCompare(String(b.start_time))),
)
const nextEvent = computed(() => upcoming.value[0] ?? null)

const paidBookings = computed(() => source.value.filter(b => b.payment_status === 'paid'))
const totalSpent = computed(() => paidBookings.value.reduce((sum, b) => sum + Number(b.total_amount || 0), 0))
const pendingCount = computed(() => source.value.filter(b => b.status === 'pending').length)

const headerSummary = computed(() => {
  if (!nextEvent.value) return 'Here is an overview of your bookings.'
  const n = upcoming.value.length
  return `You have ${n} upcoming event${n > 1 ? 's' : ''}. Next up: ${nextEvent.value.event_name}, ${countdownLabel(nextEvent.value.event_date).toLowerCase()}.`
})

const kpis = computed(() => [
  { label: 'Total bookings', value: stats.value.total_bookings, icon: 'calendar-event', tone: 'tone-brand', helper: `${stats.value.cancelled_bookings} cancelled`, small: false },
  {
    label: 'Upcoming', value: stats.value.upcoming_bookings, icon: 'calendar-clock', tone: 'tone-warning', small: false,
    helper: pendingCount.value ? `${pendingCount.value} awaiting venue reply` : nextEvent.value ? `Next ${countdownLabel(nextEvent.value.event_date).toLowerCase()}` : 'Nothing planned yet',
  },
  { label: 'Completed', value: stats.value.completed_bookings, icon: 'circle-check', tone: 'tone-info', helper: 'Events you have hosted', small: false },
  { label: 'Total spent', value: formatPKRCompact(totalSpent.value), icon: 'wallet', tone: 'tone-success', helper: `Across ${paidBookings.value.length} paid booking${paidBookings.value.length === 1 ? '' : 's'}`, small: true },
])

const attention = computed(() => {
  const items: { key: string; icon: string; tone: string; title: string; meta: string; to: string; action: string }[] = []
  for (const b of source.value) {
    if (needsPayment(b) && (daysUntil(b.event_date) ?? -1) >= 0) {
      items.push({
        key: `pay-${b.id}`, icon: 'credit-card', tone: 'tone-warning',
        title: `Pay for ${b.event_name}`,
        meta: `${formatPKR(b.total_amount)} · ${formatEventDate(b.event_date, { day: 'numeric', month: 'short' })}`,
        to: `/customer/bookings/${b.id}/pay`, action: 'Pay now',
      })
    }
  }
  for (const b of source.value) {
    if (b.status === 'completed' && reviewable.value[b.id]) {
      items.push({
        key: `review-${b.id}`, icon: 'star', tone: 'tone-info',
        title: `How was ${b.event_name}?`,
        meta: `Rate ${b.venue?.name || 'the venue'}`,
        to: `/customer/bookings/${b.id}#review`, action: 'Leave review',
      })
    }
  }
  return items
})

const quickActions = computed(() => [
  { to: '/venues', label: 'Browse venues', desc: 'Halls, marquees and lawns', icon: 'search', tone: 'tone-brand' },
  { to: '/customer/bookings', label: 'My bookings', desc: `${stats.value.total_bookings} in total`, icon: 'calendar-event', tone: 'tone-neutral' },
  { to: '/customer/messages', label: 'Messages', desc: chatStore.totalUnreadCount ? `${chatStore.totalUnreadCount} unread` : 'Talk to venues and support', icon: 'message', tone: 'tone-neutral' },
  { to: '/customer/profile', label: 'Profile', desc: 'Details, photo and password', icon: 'user', tone: 'tone-neutral' },
])

async function checkReviews() {
  // Only recently completed events can still be reviewed; keep this to a few calls.
  const completed = source.value
    .filter(b => b.status === 'completed')
    .sort((a, b) => (daysUntil(b.event_date) ?? 0) - (daysUntil(a.event_date) ?? 0))
    .slice(0, 5)
  const results = await Promise.allSettled(completed.map(b => api.get(`/client/bookings/${b.id}/review`)))
  const map: Record<number, boolean> = {}
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') map[completed[i].id] = !!r.value.data?.data?.eligible
  })
  reviewable.value = map
  cacheSet('client:dashboard:reviewable', map)
}

async function load() {
  await res.load()
  if (res.data.value) void checkReviews()
}

async function quietRefresh() {
  await res.refresh()
  if (res.data.value) void checkReviews()
}

// The venue confirms/rejects, a payment lands or a review is answered: update quietly.
useLiveRefresh(['booking', 'payment', 'review'], () => { void quietRefresh() })

onMounted(load)
</script>
