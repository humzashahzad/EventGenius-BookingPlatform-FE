<template>
  <div class="space-y-5">
    <header class="page-header !mb-0">
      <div>
        <h1 class="page-title">Bookings</h1>
        <p class="page-subtitle">
          <template v-if="loading">Loading bookings…</template>
          <template v-else-if="counts.pending">{{ counts.pending }} request{{ counts.pending === 1 ? '' : 's' }} waiting for your review</template>
          <template v-else>Review and manage booking requests for your venues.</template>
        </p>
      </div>
      <div class="page-header-actions">
        <button class="btn-secondary" :disabled="!filtered.length" @click="exportCsv">
          <AppIcon icon="download" class="w-4 h-4" />Export CSV
        </button>
      </div>
    </header>

    <section class="card overflow-hidden">
      <!-- Status tabs -->
      <nav class="tabs px-2 sm:px-4" role="tablist" aria-label="Booking status">
        <button
          v-for="s in statuses"
          :key="s.value"
          role="tab"
          class="tab"
          :aria-selected="filterStatus === s.value"
          @click="setStatus(s.value)"
        >
          {{ s.label }} <span class="tab-count">{{ s.value ? (counts[s.value] ?? 0) : bookings.length }}</span>
        </button>
      </nav>

      <!-- Toolbar -->
      <div class="flex flex-col lg:flex-row lg:items-center gap-3 p-3 sm:p-4 border-b border-line">
        <div class="relative flex-1 min-w-0">
          <AppIcon icon="search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
          <input
            v-model="search"
            type="search"
            class="form-input !pl-9"
            placeholder="Search booking #, event, client or venue"
            aria-label="Search bookings"
          />
        </div>
        <div class="grid grid-cols-2 sm:flex gap-2 sm:items-center">
          <select v-model="venueFilter" class="form-select sm:w-48" aria-label="Venue">
            <option value="">All venues</option>
            <option v-for="v in venueOptions" :key="v.id" :value="String(v.id)">{{ v.name }}</option>
          </select>
          <select v-model="datePreset" class="form-select sm:w-44" aria-label="Event date">
            <option value="">Any event date</option>
            <option value="upcoming">Upcoming</option>
            <option value="7">Next 7 days</option>
            <option value="30">Next 30 days</option>
            <option value="past">Past events</option>
            <option value="custom">Custom range…</option>
          </select>
        </div>
        <div v-if="datePreset === 'custom'" class="grid grid-cols-2 gap-2">
          <label class="sr-only" for="bk-from">From</label>
          <input id="bk-from" v-model="dateFrom" type="date" class="form-input" aria-label="From date" />
          <label class="sr-only" for="bk-to">To</label>
          <input id="bk-to" v-model="dateTo" type="date" class="form-input" aria-label="To date" />
        </div>
        <button v-if="hasFilters" class="btn-ghost btn-sm self-start lg:self-auto" @click="clearFilters">
          <AppIcon icon="x" class="w-4 h-4" />Clear
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="p-4 space-y-3" aria-busy="true">
        <div v-for="i in 8" :key="i" class="skeleton h-10 w-full" />
      </div>

      <!-- Error -->
      <div v-else-if="loadError" class="empty-state">
        <div class="empty-state-icon"><AppIcon icon="alert-circle" class="w-5 h-5" /></div>
        <p class="empty-state-title">Couldn't load bookings</p>
        <p class="empty-state-desc">{{ loadError }}</p>
        <div class="empty-state-actions"><button class="btn-primary" @click="loadBookings">Try again</button></div>
      </div>

      <!-- Empty -->
      <div v-else-if="!filtered.length" class="empty-state">
        <div class="empty-state-icon"><AppIcon icon="calendar-event" class="w-5 h-5" /></div>
        <p class="empty-state-title">{{ bookings.length ? 'No bookings match these filters' : 'No bookings yet' }}</p>
        <p class="empty-state-desc">{{ bookings.length ? 'Try another status, date range or search.' : 'Requests appear here as soon as customers book one of your venues.' }}</p>
        <div class="empty-state-actions">
          <button v-if="bookings.length" class="btn-secondary" @click="clearFilters">Clear filters</button>
          <RouterLink v-else to="/shop/venues" class="btn-secondary">Check your venues</RouterLink>
        </div>
      </div>

      <template v-else>
        <!-- Phone: cards -->
        <ul class="md:hidden divide-y divide-line">
          <li v-for="b in paged" :key="b.id" class="p-4">
            <div class="flex items-start justify-between gap-3">
              <RouterLink :to="`/shop/bookings/${b.id}`" class="min-w-0">
                <p class="ref text-brand-text">{{ b.booking_number }}</p>
                <p class="text-sm font-medium text-ink mt-0.5 truncate">{{ b.event_name }}</p>
                <p class="text-xs text-ink-muted truncate">{{ b.client?.name }} · {{ b.venue?.name }}</p>
              </RouterLink>
              <p class="text-sm font-semibold text-ink num shrink-0">{{ formatPKR(b.total_amount) }}</p>
            </div>
            <div class="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-ink-muted">
              <span :class="statusBadgeClass(b.status)">{{ statusLabel(b.status) }}</span>
              <span v-if="paymentBadge(b)" :class="paymentBadge(b)!.cls">{{ paymentBadge(b)!.label }}</span>
              <span class="ml-auto whitespace-nowrap">{{ formatDate(b.event_date) }} · {{ b.expected_guests }} guests</span>
            </div>
            <div v-if="b.status === 'pending'" class="mt-3 grid grid-cols-2 gap-2">
              <button class="btn-primary btn-sm" :disabled="acting" @click="doConfirm(b.id)"><AppIcon icon="check" class="w-4 h-4" />Confirm</button>
              <button class="btn-secondary btn-sm" :disabled="acting" @click="openReject(b)">Reject</button>
            </div>
          </li>
        </ul>

        <!-- Tablet/desktop: table -->
        <div class="hidden md:block table-wrapper max-h-[calc(100vh-260px)] min-h-[320px] scrollbar-thin">
          <table class="data-table bookings-table">
            <thead>
              <tr>
                <th class="sticky-col">Booking</th>
                <th>Event &amp; client</th>
                <th class="hidden 2xl:table-cell">Venue</th>
                <SortTh field="event_date" :sort-key="sortKey" :dir="sortDir" @sort="toggleSort">Event date</SortTh>
                <th class="cell-num">Guests</th>
                <SortTh field="total_amount" :sort-key="sortKey" :dir="sortDir" align="right" class="cell-num" @sort="toggleSort">Amount</SortTh>
                <th>Status</th>
                <th class="cell-actions"><span class="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="b in paged" :key="b.id">
                <td class="sticky-col">
                  <RouterLink :to="`/shop/bookings/${b.id}`" class="ref text-brand-text font-medium hover:underline whitespace-nowrap">{{ b.booking_number }}</RouterLink>
                  <p class="text-xs text-ink-muted mt-0.5 whitespace-nowrap">Requested {{ formatDate(b.created_at, { day: 'numeric', month: 'short' }) }}</p>
                </td>
                <td class="min-w-[180px]">
                  <p class="cell-primary truncate max-w-[260px]">{{ b.event_name }}</p>
                  <p class="text-xs text-ink-muted truncate max-w-[260px]">{{ b.client?.name }}<span class="2xl:hidden"> · {{ b.venue?.name }}</span><span class="hidden 2xl:inline"> · {{ humanize(b.event_type) }}</span></p>
                </td>
                <td class="hidden 2xl:table-cell max-w-[200px]"><span class="block truncate">{{ b.venue?.name }}</span></td>
                <td class="whitespace-nowrap">
                  <p class="text-ink">{{ formatDate(b.event_date) }}</p>
                  <p class="text-xs text-ink-muted">{{ formatTimeRange(b.start_time, b.end_time) }}</p>
                </td>
                <td class="cell-num">{{ Number(b.expected_guests || 0).toLocaleString('en-PK') }}</td>
                <td class="cell-num font-semibold text-ink">{{ formatPKR(b.total_amount) }}</td>
                <td>
                  <div class="flex flex-wrap items-center gap-1.5">
                    <span :class="statusBadgeClass(b.status)">{{ statusLabel(b.status) }}</span>
                    <span v-if="paymentBadge(b)" :class="paymentBadge(b)!.cls">{{ paymentBadge(b)!.label }}</span>
                  </div>
                </td>
                <td class="cell-actions">
                  <div class="inline-flex items-center gap-1.5">
                    <template v-if="b.status === 'pending'">
                      <button class="btn-primary btn-sm" :disabled="acting" @click="doConfirm(b.id)">Confirm</button>
                      <button class="btn-secondary btn-sm" :disabled="acting" @click="openReject(b)">Reject</button>
                    </template>
                    <RouterLink v-else :to="`/shop/bookings/${b.id}`" class="btn-ghost btn-sm">View</RouterLink>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <TablePager v-model:page="page" v-model:per-page="perPage" :total="filtered.length" :per-page-options="[20, 50, 100]" />
      </template>
    </section>

    <!-- Reject Dialog -->
    <VuexyModal v-model:visible="showRejectDialog" title="Reject booking" width="28rem">
      <div class="panel-sunken p-3 mb-4">
        <p class="text-xs text-ink-muted">Booking <span class="ref">{{ rejectTarget?.booking_number }}</span></p>
        <p class="font-medium text-ink text-sm mt-0.5">{{ rejectTarget?.event_name }}</p>
        <p class="text-xs text-ink-muted mt-0.5">{{ rejectTarget?.client?.name }} · {{ formatDate(rejectTarget?.event_date) }}</p>
      </div>
      <label for="reject-reason" class="form-label">Rejection reason <span class="req">*</span></label>
      <textarea id="reject-reason" v-model="rejectReason" class="form-textarea" rows="3" placeholder="Explain why this booking is being rejected…" :aria-invalid="!!rejectError" />
      <p v-if="rejectError" class="form-error">{{ rejectError }}</p>
      <p v-else class="form-hint">The customer will see this reason.</p>
      <template #footer>
        <div class="flex justify-end gap-2">
          <button class="btn-secondary" @click="showRejectDialog = false">Cancel</button>
          <button class="btn-danger" :disabled="acting" @click="submitReject">
            <AppIcon v-if="acting" icon="loader" class="w-4 h-4 animate-spin" />
            Confirm rejection
          </button>
        </div>
      </template>
    </VuexyModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import api from '@/lib/axios'
import { formatTimeRange, formatPKR, formatDate } from '@/lib/format'
import { statusBadgeClass, statusLabel } from '@/lib/status'
import VuexyModal from '@/components/ui/VuexyModal.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import SortTh from '@/components/dashboard/SortTh.vue'
import TablePager from '@/components/dashboard/TablePager.vue'
import { humanize } from '@/components/dashboard/metrics'

const route = useRoute()
const router = useRouter()

const bookings = ref<any[]>([])
const loading = ref(false)
const loadError = ref('')
const acting = ref(false)
const rejectTarget = ref<any>(null)
const rejectReason = ref('')
const rejectError = ref('')
const showRejectDialog = ref(false)

const statuses = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'rejected', label: 'Rejected' },
]

// ── Filters (kept in the URL query for status so links from the dashboard work) ──
const filterStatus = ref(typeof route.query.status === 'string' ? route.query.status : '')
const search = ref('')
const venueFilter = ref('')
const datePreset = ref('')
const dateFrom = ref('')
const dateTo = ref('')
const sortKey = ref('created_at')
const sortDir = ref<'asc' | 'desc'>('desc')
const page = ref(1)
const perPage = ref(20)

function setStatus(v: string) {
  filterStatus.value = v
  router.replace({ query: { ...route.query, status: v || undefined } })
}
watch(() => route.query.status, v => { filterStatus.value = typeof v === 'string' ? v : '' })

const hasFilters = computed(() => !!(search.value || venueFilter.value || datePreset.value))
function clearFilters() {
  search.value = ''
  venueFilter.value = ''
  datePreset.value = ''
  dateFrom.value = ''
  dateTo.value = ''
  setStatus('')
}

const counts = computed(() => {
  const c: Record<string, number> = {}
  for (const b of bookings.value) c[b.status] = (c[b.status] ?? 0) + 1
  return c
})

const venueOptions = computed(() => {
  const m = new Map<number, string>()
  for (const b of bookings.value) if (b.venue?.id) m.set(b.venue.id, b.venue.name)
  return [...m].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
})

function dayKey(d: string | null | undefined) { return String(d || '').slice(0, 10) }
function addDays(n: number) {
  const d = new Date(); d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  const today = addDays(0)
  let rows = bookings.value.filter(b => {
    if (filterStatus.value && b.status !== filterStatus.value) return false
    if (venueFilter.value && String(b.venue?.id ?? b.venue_id) !== venueFilter.value) return false
    const ev = dayKey(b.event_date)
    if (datePreset.value === 'upcoming' && ev < today) return false
    if (datePreset.value === 'past' && ev >= today) return false
    if ((datePreset.value === '7' || datePreset.value === '30') && (ev < today || ev > addDays(Number(datePreset.value)))) return false
    if (datePreset.value === 'custom') {
      if (dateFrom.value && ev < dateFrom.value) return false
      if (dateTo.value && ev > dateTo.value) return false
    }
    if (q) {
      const hay = `${b.booking_number} ${b.event_name} ${b.client?.name} ${b.client?.email} ${b.venue?.name}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
  const dir = sortDir.value === 'asc' ? 1 : -1
  const key = sortKey.value
  rows = [...rows].sort((a, b) => {
    const av = key === 'total_amount' ? Number(a[key]) : String(a[key] ?? '')
    const bv = key === 'total_amount' ? Number(b[key]) : String(b[key] ?? '')
    return av < bv ? -dir : av > bv ? dir : 0
  })
  return rows
})

const paged = computed(() => filtered.value.slice((page.value - 1) * perPage.value, page.value * perPage.value))
watch([filterStatus, search, venueFilter, datePreset, dateFrom, dateTo, perPage], () => { page.value = 1 })

function toggleSort(field: string) {
  if (sortKey.value === field) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortKey.value = field; sortDir.value = field === 'event_date' ? 'asc' : 'desc' }
}

function paymentBadge(b: any): { cls: string; label: string } | null {
  if (b.payment_status === 'paid') return { cls: 'badge-paid', label: 'Paid' }
  if (b.payment_status === 'refunded') return { cls: 'badge-refunded', label: 'Refunded' }
  if (b.status === 'confirmed') return { cls: 'badge-unpaid', label: 'Unpaid' }
  return null
}

// ── Data + actions (same API calls as before) ──────────────────────────────
async function loadBookings() {
  loading.value = true
  loadError.value = ''
  try {
    // One request for the whole list so tabs show counts and filters are instant.
    const { data } = await api.get('/store/bookings', { params: { per_page: 1000 } })
    bookings.value = data.data.data
  } catch (e: any) {
    loadError.value = e.response?.data?.message || 'Please check your connection and try again.'
  } finally { loading.value = false }
}

async function doConfirm(id: number) {
  acting.value = true
  try {
    await api.patch(`/store/bookings/${id}/confirm`)
    toast.success('Booking confirmed — the customer can now pay.')
    await loadBookings()
  } catch (e: any) {
    toast.error(e.response?.data?.message || 'Could not confirm this booking.')
  } finally { acting.value = false }
}

function openReject(b: any) {
  rejectTarget.value = b
  rejectReason.value = ''
  rejectError.value = ''
  showRejectDialog.value = true
}

async function submitReject() {
  if (!rejectReason.value.trim()) { rejectError.value = 'Reason is required.'; return }
  acting.value = true
  try {
    await api.patch(`/store/bookings/${rejectTarget.value.id}/reject`, { reason: rejectReason.value })
    showRejectDialog.value = false
    rejectTarget.value = null
    toast.success('Booking rejected.')
    await loadBookings()
  } catch (e: any) {
    rejectError.value = e.response?.data?.message || 'Could not reject this booking.'
  } finally { acting.value = false }
}

function exportCsv() {
  const head = ['Booking', 'Event', 'Client', 'Venue', 'Event date', 'Guests', 'Amount (PKR)', 'Status', 'Payment']
  const rows = filtered.value.map(b => [b.booking_number, b.event_name, b.client?.name, b.venue?.name, dayKey(b.event_date), b.expected_guests, b.total_amount, b.status, b.payment_status])
  const csv = [head, ...rows].map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `bookings-${addDays(0)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

onMounted(loadBookings)
</script>

<style scoped>
/* First column stays visible while the table scrolls sideways. */
.bookings-table .sticky-col {
  position: sticky;
  left: 0;
  background-color: var(--surface);
  box-shadow: inset -1px 0 0 var(--line);
}
.bookings-table thead .sticky-col { z-index: 3; background-color: var(--surface-sunken); }
.bookings-table tbody td.sticky-col { z-index: 1; }
.bookings-table tbody tr:hover td.sticky-col { background-color: var(--surface-hover); }
</style>
