<template>
  <div class="space-y-5">
    <header class="page-header !mb-0">
      <div>
        <h1 class="page-title">Bookings</h1>
        <p class="page-subtitle">All bookings across every store and venue.</p>
      </div>
    </header>

    <section class="card overflow-hidden">
      <nav class="tabs px-2 sm:px-4" role="tablist" aria-label="Booking status">
        <button v-for="s in statusTabs" :key="s.value" role="tab" class="tab" :aria-selected="statusFilter === s.value" @click="setStatus(s.value)">{{ s.label }}</button>
      </nav>
      <DataToolbar v-model:search="search" placeholder="Booking # or event name" :count="loading ? undefined : meta.total" noun="bookings" @update:search="resetAndLoad">
        <label class="sr-only" for="ab-from">Event from</label>
        <input id="ab-from" v-model="dateFrom" type="date" class="form-input sm:!w-40" title="Event date from" @change="resetAndLoad" />
        <span class="text-ink-muted text-sm hidden sm:inline">to</span>
        <label class="sr-only" for="ab-to">Event to</label>
        <input id="ab-to" v-model="dateTo" type="date" class="form-input sm:!w-40" title="Event date to" @change="resetAndLoad" />
        <button v-if="dateFrom || dateTo" class="btn-ghost btn-sm" @click="dateFrom = ''; dateTo = ''; resetAndLoad()"><AppIcon icon="x" class="w-4 h-4" />Dates</button>
      </DataToolbar>

      <div v-if="loading" class="p-4 space-y-3" aria-busy="true"><div v-for="i in 8" :key="i" class="skeleton h-10 w-full" /></div>

      <div v-else-if="loadError" class="empty-state">
        <div class="empty-state-icon"><AppIcon icon="alert-circle" class="w-5 h-5" /></div>
        <p class="empty-state-title">Couldn't load bookings</p>
        <p class="empty-state-desc">{{ loadError }}</p>
        <div class="empty-state-actions"><button class="btn-primary" @click="load">Try again</button></div>
      </div>

      <div v-else-if="bookings.length === 0" class="empty-state">
        <div class="empty-state-icon"><AppIcon icon="calendar-event" class="w-5 h-5" /></div>
        <p class="empty-state-title">No bookings found</p>
        <p class="empty-state-desc">Try a different status, date range or search.</p>
        <div class="empty-state-actions"><button class="btn-secondary" @click="clearFilters">Clear filters</button></div>
      </div>

      <template v-else>
        <!-- Phone -->
        <ul class="md:hidden divide-y divide-line">
          <li v-for="b in bookings" :key="b.id" class="p-4">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="ref text-ink-secondary">{{ b.booking_number }}</p>
                <p class="text-sm font-medium text-ink truncate">{{ b.client?.name }}</p>
                <p class="text-xs text-ink-muted truncate">{{ b.venue?.name }} · {{ b.store?.name }}</p>
              </div>
              <p class="text-sm font-semibold text-ink num shrink-0">{{ formatPKR(b.total_amount) }}</p>
            </div>
            <div class="mt-2 flex flex-wrap items-center gap-1.5">
              <span :class="statusBadgeClass(b.status)">{{ statusLabel(b.status) }}</span>
              <span v-if="b.payment_status === 'paid'" class="badge-paid">Paid</span>
              <span v-else-if="b.payment_status === 'refunded'" class="badge-refunded">Refunded</span>
              <span class="text-xs text-ink-muted ml-auto">{{ formatDate(b.event_date) }}</span>
            </div>
            <button v-if="b.status === 'confirmed' && b.payment_status === 'unpaid'" class="btn-secondary btn-sm mt-3" :disabled="markingId === b.id" @click="askMarkPaid(b)">
              <AppIcon icon="banknote" class="w-4 h-4" />Mark paid (demo)
            </button>
          </li>
        </ul>

        <!-- Desktop -->
        <div class="hidden md:block table-wrapper max-h-[calc(100vh-300px)] min-h-[320px] scrollbar-thin">
          <table class="data-table">
            <thead>
              <tr>
                <th>Booking</th><th>Client</th><th>Venue &amp; store</th><th>Event date</th><th class="cell-num">Amount</th><th>Status</th>
                <th class="cell-actions"><span class="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="b in bookings" :key="b.id">
                <td>
                  <p class="ref text-ink-secondary whitespace-nowrap">{{ b.booking_number }}</p>
                  <p class="text-xs text-ink-muted truncate max-w-[180px]">{{ b.event_name || humanize(b.event_type) }}</p>
                </td>
                <td>
                  <p class="cell-primary truncate max-w-[180px]">{{ b.client?.name }}</p>
                  <p class="text-xs text-ink-muted truncate max-w-[200px]">{{ b.client?.email }}</p>
                </td>
                <td>
                  <p class="text-ink truncate max-w-[200px]">{{ b.venue?.name }}</p>
                  <p class="text-xs text-ink-muted truncate max-w-[200px]">{{ b.store?.name }}<span v-if="b.venue?.city"> · {{ b.venue.city }}</span></p>
                </td>
                <td class="whitespace-nowrap">{{ formatDate(b.event_date) }}</td>
                <td class="cell-num font-semibold text-ink">{{ formatPKR(b.total_amount) }}</td>
                <td>
                  <div class="flex flex-wrap items-center gap-1.5">
                    <span :class="statusBadgeClass(b.status)">{{ statusLabel(b.status) }}</span>
                    <span v-if="b.payment_status === 'paid'" class="badge-paid">Paid</span>
                    <span v-else-if="b.payment_status === 'refunded'" class="badge-refunded">Refunded</span>
                    <span v-else-if="b.status === 'confirmed'" class="badge-unpaid">Unpaid</span>
                  </div>
                </td>
                <td class="cell-actions">
                  <button v-if="b.status === 'confirmed' && b.payment_status === 'unpaid'" class="btn-ghost btn-sm" :disabled="markingId === b.id" title="Demo only — no PayFast charge" @click="askMarkPaid(b)">
                    <AppIcon :icon="markingId === b.id ? 'loader' : 'banknote'" :class="markingId === b.id ? 'w-4 h-4 animate-spin' : 'w-4 h-4'" />Mark paid
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <TablePager :page="meta.current_page" :per-page="perPage" :total="meta.total" @update:page="changePage" />
      </template>
    </section>

    <ConfirmDialog v-model:visible="showMarkPaid" title="Mark booking as paid" confirm-label="Mark as paid" tone="warning" icon="banknote" :loading="markingId !== null" :error="markError" @confirm="markPaid">
      Mark booking <span class="ref text-ink">{{ markTarget?.booking_number }}</span> as paid manually?
      <span class="block mt-1">Demo only — no PayFast charge is made.</span>
    </ConfirmDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import api from '@/lib/axios'
import { formatPKR, formatDate } from '@/lib/format'
import { statusBadgeClass, statusLabel } from '@/lib/status'
import AppIcon from '@/components/ui/AppIcon.vue'
import DataToolbar from '@/components/admin/DataToolbar.vue'
import ConfirmDialog from '@/components/admin/ConfirmDialog.vue'
import TablePager from '@/components/dashboard/TablePager.vue'
import { humanize } from '@/components/dashboard/metrics'

const route = useRoute()
const router = useRouter()
const bookings = ref<any[]>([])
const loading = ref(false)
const loadError = ref('')
const search = ref('')
const statusFilter = ref(typeof route.query.status === 'string' ? route.query.status : '')
const dateFrom = ref('')
const dateTo = ref('')
const perPage = 15
const meta = ref({ current_page: 1, last_page: 1, total: 0 })
let page = 1

const statusTabs = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'rejected', label: 'Rejected' },
]

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const params: any = { per_page: perPage, page }
    if (search.value) params.search = search.value
    if (statusFilter.value) params.status = statusFilter.value
    if (dateFrom.value) params.date_from = dateFrom.value
    if (dateTo.value) params.date_to = dateTo.value
    const { data } = await api.get('/admin/bookings', { params })
    bookings.value = data.data.data
    meta.value = { current_page: data.data.current_page, last_page: data.data.last_page, total: data.data.total }
  } catch (e: any) {
    loadError.value = e.response?.data?.message || 'Please check your connection and try again.'
  } finally { loading.value = false }
}

const markingId = ref<number | null>(null)
const markTarget = ref<any>(null)
const showMarkPaid = ref(false)
const markError = ref('')

function askMarkPaid(b: any) {
  markTarget.value = b
  markError.value = ''
  showMarkPaid.value = true
}

async function markPaid() {
  const b = markTarget.value
  if (!b) return
  markingId.value = b.id
  markError.value = ''
  try {
    await api.post(`/admin/bookings/${b.id}/mark-paid`)
    showMarkPaid.value = false
    toast.success(`Booking ${b.booking_number} marked as paid.`)
    await load()
  } catch (err: any) {
    markError.value = err.response?.data?.message || 'Could not mark booking as paid.'
  } finally { markingId.value = null }
}

function resetAndLoad() { page = 1; load() }
function changePage(p: number) { page = p; load() }
function setStatus(v: string) {
  statusFilter.value = v
  router.replace({ query: { ...route.query, status: v || undefined } })
  resetAndLoad()
}
function clearFilters() { search.value = ''; dateFrom.value = ''; dateTo.value = ''; setStatus('') }

onMounted(load)
</script>
