<template>
  <div class="space-y-5">
    <header class="page-header !mb-0">
      <div>
        <h1 class="page-title">My bookings</h1>
        <p class="page-subtitle">
          <template v-if="!loading && bookings.length">{{ bookings.length }} booking{{ bookings.length === 1 ? '' : 's' }} · {{ counts.upcoming }} upcoming</template>
          <template v-else>Track and manage your venue reservations.</template>
        </p>
      </div>
      <div class="page-header-actions">
        <RouterLink to="/venues" class="btn-primary">
          <AppIcon icon="plus" class="w-4 h-4" />
          Book a venue
        </RouterLink>
      </div>
    </header>

    <!-- Toolbar: tabs + search + sort -->
    <div class="card">
      <nav class="tabs px-2 sm:px-3" role="tablist" aria-label="Filter bookings by status">
        <button
          v-for="t in visibleTabs"
          :key="t.key"
          type="button"
          role="tab"
          class="tab whitespace-nowrap"
          :aria-selected="tab === t.key"
          @click="setTab(t.key)"
        >
          {{ t.label }}
          <span class="tab-count">{{ counts[t.key] }}</span>
        </button>
      </nav>
      <div class="flex flex-col sm:flex-row gap-3 p-3 sm:p-4">
        <div class="flex-1 min-w-0">
          <label for="booking-search" class="sr-only">Search bookings</label>
          <TextInput id="booking-search" v-model="search" type="search" prefix-icon="search" clearable clear-label="Clear search" placeholder="Search by event, venue, city or booking number" autocomplete="off" />
        </div>
        <div class="flex items-center gap-2 sm:w-64">
          <label for="booking-sort" class="text-sm text-ink-muted whitespace-nowrap">Sort</label>
          <SelectInput
            id="booking-sort"
            v-model="sort"
            :options="[{ value: 'date_asc', label: 'Event date: soonest first' }, { value: 'date_desc', label: 'Event date: latest first' }, { value: 'created_desc', label: 'Recently booked' }, { value: 'amount_desc', label: 'Total: high to low' }, { value: 'amount_asc', label: 'Total: low to high' }]"
          />
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-3" aria-busy="true" aria-label="Loading bookings">
      <div v-for="i in 4" :key="i" class="card overflow-hidden flex">
        <div class="skeleton !rounded-none w-24 sm:w-40 h-28 sm:h-36 shrink-0"></div>
        <div class="p-4 flex-1 space-y-2.5"><div class="skeleton h-4 w-24"></div><div class="skeleton h-5 w-2/3"></div><div class="skeleton h-4 w-1/2"></div></div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="loadError" class="card">
      <div class="empty-state">
        <div class="empty-state-icon"><AppIcon icon="alert-triangle" class="w-5 h-5" /></div>
        <p class="empty-state-title">We couldn't load your bookings</p>
        <p class="empty-state-desc">{{ loadError }}</p>
        <div class="empty-state-actions"><button type="button" class="btn-primary" @click="res.retry()"><AppIcon icon="refresh" class="w-4 h-4" />Try again</button></div>
      </div>
    </div>

    <!-- Empty -->
    <div v-else-if="filtered.length === 0" class="card">
      <div class="empty-state">
        <div class="empty-state-icon"><AppIcon :icon="search ? 'search' : 'calendar-event'" class="w-5 h-5" /></div>
        <p class="empty-state-title">{{ emptyTitle }}</p>
        <p class="empty-state-desc">{{ emptyDesc }}</p>
        <div class="empty-state-actions">
          <button v-if="search || tab !== 'all'" type="button" class="btn-secondary" @click="search = ''; setTab('all')">Clear filters</button>
          <RouterLink to="/venues" class="btn-primary">Browse venues</RouterLink>
        </div>
      </div>
    </div>

    <!-- List -->
    <template v-else>
      <p class="sr-only" role="status">{{ filtered.length }} bookings shown</p>
      <ul class="space-y-3">
        <li v-for="b in paged" :key="b.id">
          <article class="card card-hover overflow-hidden">
            <div class="flex">
              <RouterLink :to="`/customer/bookings/${b.id}`" class="relative block w-24 sm:w-44 shrink-0 bg-surface-sunken" tabindex="-1" aria-hidden="true">
                <img :src="venueImage(b)" alt="" class="absolute inset-0 w-full h-full object-cover" loading="lazy" @error="onImageError" />
              </RouterLink>
              <div class="flex-1 min-w-0 p-4 sm:p-5">
                <div class="flex flex-wrap items-center gap-1.5">
                  <span :class="statusBadgeClass(b.status)">{{ statusLabel(b.status) }}</span>
                  <span v-if="paymentBadge(b)" :class="paymentBadge(b)!.cls">{{ paymentBadge(b)!.label }}</span>
                  <span v-if="isUpcomingBooking(b)" class="text-xs font-medium text-ink-muted">· {{ countdownLabel(b.event_date) }}</span>
                </div>
                <h2 class="mt-1.5 text-base font-semibold text-ink break-words">
                  <RouterLink :to="`/customer/bookings/${b.id}`" class="hover:underline underline-offset-2">{{ b.event_name }}</RouterLink>
                </h2>
                <p class="text-sm text-ink-secondary break-words">
                  {{ b.venue?.name }}<template v-if="b.venue?.city"> · {{ b.venue.city }}</template>
                </p>
                <ul class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-muted">
                  <li class="inline-flex items-center gap-1.5"><AppIcon icon="calendar-event" class="w-3.5 h-3.5" />{{ formatEventDate(b.event_date) }}</li>
                  <li v-if="b.start_time" class="inline-flex items-center gap-1.5"><AppIcon icon="clock" class="w-3.5 h-3.5" />{{ formatTimeRange(b.start_time, b.end_time) }}</li>
                  <li v-if="guestsOf(b)" class="inline-flex items-center gap-1.5"><AppIcon icon="users" class="w-3.5 h-3.5" />{{ guestsOf(b) }} guests</li>
                </ul>
              </div>
            </div>
            <div class="flex flex-wrap items-center gap-3 border-t border-line bg-surface-sunken/60 px-4 sm:px-5 py-3">
              <div class="min-w-0 mr-auto">
                <p class="text-xs text-ink-muted">Total · <span class="ref">{{ b.booking_number }}</span></p>
                <p class="text-base font-semibold text-ink num">{{ formatPKR(b.total_amount) }}</p>
              </div>
              <p v-if="b.status === 'pending'" class="w-full sm:w-auto order-last sm:order-none text-xs text-warning-text inline-flex items-center gap-1.5">
                <AppIcon icon="clock" class="w-3.5 h-3.5" /> Waiting for the venue to confirm
              </p>
              <div class="flex gap-2">
                <RouterLink v-if="needsPayment(b)" :to="`/customer/bookings/${b.id}/pay`" class="btn-primary btn-sm">
                  <AppIcon icon="credit-card" class="w-4 h-4" /> Pay now
                </RouterLink>
                <RouterLink :to="`/customer/bookings/${b.id}`" class="btn-secondary btn-sm">
                  Details<span class="sr-only"> for {{ b.event_name }}</span>
                  <AppIcon icon="chevron-right" class="w-4 h-4" />
                </RouterLink>
              </div>
            </div>
          </article>
        </li>
      </ul>

      <!-- Pagination -->
      <nav v-if="lastPage > 1" class="flex flex-wrap items-center justify-between gap-3" aria-label="Pagination">
        <p class="text-sm text-ink-muted num">Showing {{ (page - 1) * PER_PAGE + 1 }}–{{ Math.min(page * PER_PAGE, filtered.length) }} of {{ filtered.length }}</p>
        <div class="flex items-center gap-1">
          <button type="button" class="btn-secondary btn-icon btn-icon-sm" :disabled="page === 1" aria-label="Previous page" @click="page--">
            <AppIcon icon="chevron-left" class="w-4 h-4" />
          </button>
          <button
            v-for="p in lastPage"
            :key="p"
            type="button"
            class="btn-sm min-w-control-sm !px-2"
            :class="p === page ? 'btn-primary' : 'btn-ghost'"
            :aria-current="p === page ? 'page' : undefined"
            @click="page = p"
          >{{ p }}</button>
          <button type="button" class="btn-secondary btn-icon btn-icon-sm" :disabled="page === lastPage" aria-label="Next page" @click="page++">
            <AppIcon icon="chevron-right" class="w-4 h-4" />
          </button>
        </div>
      </nav>
    </template>
  </div>
</template>

<script setup lang="ts">
import { TextInput, SelectInput } from '@/components/forms'
import { ref, computed, watch, onMounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import api from '@/lib/axios'
import { useCachedResource } from '@/composables/usePageCache'
import { useLiveRefresh } from '@/composables/useLiveRefresh'
import AppIcon from '@/components/ui/AppIcon.vue'
import { formatTimeRange, formatPKR } from '@/lib/format'
import { statusBadgeClass, statusLabel } from '@/lib/status'
import {
  venueImage, onImageError, formatEventDate, countdownLabel, eventDateTime,
  isUpcomingBooking, needsPayment, paymentBadge, guestsOf,
} from '@/components/client/bookingUtils'

type TabKey = 'all' | 'upcoming' | 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected'
const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'rejected', label: 'Rejected' },
]
const PER_PAGE = 10

const route = useRoute()
const router = useRouter()

// Loaded once with a skeleton; coming back to this page (or a status change made by the
// venue) updates the list quietly in place.
const res = useCachedResource<any[]>(() => 'client:bookings', async () => {
  const { data } = await api.get('/client/bookings', { params: { per_page: 1000 } })
  return data.data?.data || []
})
const bookings = computed(() => res.data.value ?? [])
const loading = res.loading
const loadError = computed(() => (res.data.value ? '' : res.error.value))
useLiveRefresh(['booking', 'payment', 'review'], () => { void res.refresh() })
const search = ref('')
const sort = ref<'date_asc' | 'date_desc' | 'created_desc' | 'amount_desc' | 'amount_asc'>('date_desc')
const tab = ref<TabKey>(TABS.some(t => t.key === route.query.status) ? (route.query.status as TabKey) : 'all')
const page = ref(1)

function matchesTab(b: any, key: TabKey) {
  if (key === 'all') return true
  if (key === 'upcoming') return isUpcomingBooking(b)
  return b.status === key
}

const counts = computed(() => {
  const c = {} as Record<TabKey, number>
  for (const t of TABS) c[t.key] = bookings.value.filter(b => matchesTab(b, t.key)).length
  return c
})

// Hide the rejected tab unless there is something in it.
const visibleTabs = computed(() => TABS.filter(t => t.key !== 'rejected' || counts.value.rejected > 0 || tab.value === 'rejected'))

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  const list = bookings.value.filter(b => {
    if (!matchesTab(b, tab.value)) return false
    if (!q) return true
    return [b.event_name, b.venue?.name, b.venue?.city, b.booking_number, b.store?.name]
      .some(v => String(v || '').toLowerCase().includes(q))
  })
  const time = (b: any) => eventDateTime(b.event_date, b.start_time)?.getTime() ?? 0
  const sorters: Record<string, (a: any, b: any) => number> = {
    date_asc: (a, b) => time(a) - time(b),
    date_desc: (a, b) => time(b) - time(a),
    created_desc: (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    amount_desc: (a, b) => Number(b.total_amount) - Number(a.total_amount),
    amount_asc: (a, b) => Number(a.total_amount) - Number(b.total_amount),
  }
  return [...list].sort(sorters[sort.value])
})

const lastPage = computed(() => Math.max(1, Math.ceil(filtered.value.length / PER_PAGE)))
const paged = computed(() => filtered.value.slice((page.value - 1) * PER_PAGE, page.value * PER_PAGE))

const tabLabel = computed(() => TABS.find(t => t.key === tab.value)?.label.toLowerCase() ?? '')
const emptyTitle = computed(() => {
  if (search.value) return 'No bookings match your search'
  if (tab.value !== 'all') return `No ${tabLabel.value} bookings`
  return 'No bookings yet'
})
const emptyDesc = computed(() => {
  if (search.value) return `Nothing matches "${search.value}". Try another name or clear the filters.`
  if (tab.value !== 'all') return 'Bookings with this status will show up here.'
  return 'Find a venue for your next event and send a booking request. It will show up here.'
})

function setTab(key: TabKey) {
  tab.value = key
  // Upcoming reads best soonest-first; history reads best latest-first.
  sort.value = key === 'upcoming' || key === 'pending' || key === 'confirmed' ? 'date_asc' : 'date_desc'
  router.replace({ query: { ...route.query, status: key === 'all' ? undefined : key } })
}

watch([search, tab, sort], () => { page.value = 1 })
watch(lastPage, (lp) => { if (page.value > lp) page.value = lp })

onMounted(() => {
  if (tab.value === 'upcoming' || tab.value === 'pending' || tab.value === 'confirmed') sort.value = 'date_asc'
  void res.load()
})
</script>
