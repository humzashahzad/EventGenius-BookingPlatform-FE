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
      <DataToolbar v-model:search="search" placeholder="Booking # or event name" :count="loading ? undefined : table.total.value" noun="bookings" @update:search="resetAndLoad">
        <DateRangePicker
          id="ab-dates"
          v-model:start="dateFrom"
          v-model:end="dateTo"
          class="sm:!w-72"
          placeholder="Any event date"
          aria-label="Event date range"
          :presets="['today', 'next7', 'next30', 'thisMonth', 'last30']"
          @change="resetAndLoad"
        />
      </DataToolbar>

      <div v-if="loading" class="p-4 space-y-3" aria-busy="true"><div v-for="i in 8" :key="i" class="skeleton h-10 w-full" /></div>

      <div v-else-if="loadError" class="empty-state">
        <div class="empty-state-icon"><AppIcon icon="alert-circle" class="w-5 h-5" /></div>
        <p class="empty-state-title">Couldn't load bookings</p>
        <p class="empty-state-desc">{{ loadError }}</p>
        <div class="empty-state-actions"><button class="btn-primary" @click="table.load()">Try again</button></div>
      </div>

      <div v-else-if="table.rows.value.length === 0" class="empty-state">
        <div class="empty-state-icon"><AppIcon icon="calendar-event" class="w-5 h-5" /></div>
        <p class="empty-state-title">No bookings found</p>
        <p class="empty-state-desc">Try a different status, date range or search.</p>
        <div class="empty-state-actions"><button class="btn-secondary" @click="clearFilters">Clear filters</button></div>
      </div>

      <ListBody v-else :busy="table.fetching.value">
        <!-- Phone -->
        <ul class="md:hidden divide-y divide-line">
          <li v-for="b in table.rows.value" :key="b.id" class="p-4">
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
            <button v-if="b.status === 'confirmed' && (b.payment_status === 'unpaid' || actions.isPending(b.id))" class="btn-secondary btn-sm mt-3" :disabled="actions.isPending(b.id)" :aria-busy="actions.isPending(b.id)" @click="askMarkPaid(b)">
              <AppIcon :icon="actions.isPending(b.id) ? 'loader' : 'banknote'" :class="actions.isPending(b.id) ? 'w-4 h-4 animate-spin' : 'w-4 h-4'" />Mark paid (demo)
            </button>
            <InvoiceDownloadButton v-if="hasInvoice(b)" audience="admin" :booking-id="b.id" :booking-number="b.booking_number" label="Download invoice" variant="btn-secondary btn-sm mt-3" />
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
              <tr v-for="b in table.rows.value" :key="b.id">
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
                  <button v-if="b.status === 'confirmed' && (b.payment_status === 'unpaid' || actions.isPending(b.id))" class="btn-ghost btn-sm" :disabled="actions.isPending(b.id)" :aria-busy="actions.isPending(b.id)" title="Demo only — no PayFast charge" @click="askMarkPaid(b)">
                    <AppIcon :icon="actions.isPending(b.id) ? 'loader' : 'banknote'" :class="actions.isPending(b.id) ? 'w-4 h-4 animate-spin' : 'w-4 h-4'" />Mark paid
                  </button>
                  <InvoiceDownloadButton v-if="hasInvoice(b)" audience="admin" :booking-id="b.id" :booking-number="b.booking_number" label="Invoice" busy-label="Invoice" variant="btn-ghost btn-sm" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <TablePager :page="table.page.value" :per-page="perPage" :total="table.total.value" @update:page="table.goTo" />
      </ListBody>
    </section>

    <ConfirmDialog v-model:visible="showMarkPaid" title="Mark booking as paid" confirm-label="Mark as paid" tone="warning" icon="banknote" @confirm="markPaid">
      Mark booking <span class="ref text-ink">{{ markTarget?.booking_number }}</span> as paid manually?
      <span class="block mt-1">Demo only — no PayFast charge is made.</span>
    </ConfirmDialog>
  </div>
</template>

<script setup lang="ts">
import { DateRangePicker } from '@/components/forms'
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/lib/axios'
import { formatPKR, formatDate } from '@/lib/format'
import { statusBadgeClass, statusLabel } from '@/lib/status'
import AppIcon from '@/components/ui/AppIcon.vue'
import DataToolbar from '@/components/admin/DataToolbar.vue'
import ConfirmDialog from '@/components/admin/ConfirmDialog.vue'
import ListBody from '@/components/admin/ListBody.vue'
import InvoiceDownloadButton from '@/components/invoice/InvoiceDownloadButton.vue'
import { hasInvoice } from '@/lib/invoice'
import TablePager from '@/components/dashboard/TablePager.vue'
import { humanize } from '@/components/dashboard/metrics'
import { useRowActions } from '@/composables/useRowActions'
import { useServerTable } from '@/composables/useServerTable'
import { useLiveRefresh } from '@/composables/useLiveRefresh'

const route = useRoute()
const router = useRouter()
const search = ref('')
const statusFilter = ref(typeof route.query.status === 'string' ? route.query.status : '')
const dateFrom = ref('')
const dateTo = ref('')
const perPage = 15

const statusTabs = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'rejected', label: 'Rejected' },
]

const actions = useRowActions()
const table = useServerTable<any>(async () => {
  const params: any = { per_page: perPage, page: table.page.value }
  if (search.value) params.search = search.value
  if (statusFilter.value) params.status = statusFilter.value
  if (dateFrom.value) params.date_from = dateFrom.value
  if (dateTo.value) params.date_to = dateTo.value
  const { data } = await api.get('/admin/bookings', { params })
  return { rows: data.data.data, total: data.data.total, page: data.data.current_page }
}, { lock: b => actions.isPending(b.id) })
const loading = table.loading
const loadError = table.error

const markTarget = ref<any>(null)
const showMarkPaid = ref(false)

function askMarkPaid(b: any) {
  markTarget.value = b
  showMarkPaid.value = true
}

function markPaid() {
  const b = markTarget.value
  if (!b) return
  showMarkPaid.value = false
  const prev = b.payment_status
  actions.run(b.id, {
    apply: () => { b.payment_status = 'paid' },
    request: () => api.post(`/admin/bookings/${b.id}/mark-paid`),
    rollback: () => { b.payment_status = prev },
    success: `Booking ${b.booking_number} marked as paid`,
    error: 'Could not mark booking as paid.',
    after: () => table.refresh(),
  })
}

function resetAndLoad() { table.reset() }
function setStatus(v: string) {
  statusFilter.value = v
  router.replace({ query: { ...route.query, status: v || undefined } })
  resetAndLoad()
}
function clearFilters() { search.value = ''; dateFrom.value = ''; dateTo.value = ''; setStatus('') }

// New bookings, confirmations and payments from other users show up quietly.
useLiveRefresh(['booking', 'payment'], () => table.refresh())

table.load()
</script>
