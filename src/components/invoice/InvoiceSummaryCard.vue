<template>
  <!-- Compact invoice summary with View / Download actions (payment success page). -->
  <div class="rounded-lg border border-line bg-surface p-4" aria-live="polite">
    <div v-if="loading" class="space-y-2" aria-busy="true" aria-label="Loading invoice">
      <div class="skeleton h-4 w-40"></div>
      <div class="skeleton h-4 w-56"></div>
    </div>
    <template v-else-if="invoice">
      <div class="flex items-start gap-3">
        <span class="icon-chip tone-brand shrink-0"><AppIcon icon="receipt" class="w-5 h-5" /></span>
        <div class="min-w-0 flex-1 text-left">
          <p class="text-sm font-semibold text-ink">Invoice <span class="ref">{{ invoice.invoice_number }}</span></p>
          <p class="text-xs text-ink-muted">Issued {{ invoice.issued_on }} · {{ invoice.status_label }}</p>
          <dl class="mt-2 text-sm">
            <div v-for="item in invoice.line_items" :key="item.key" class="flex justify-between gap-3 py-0.5">
              <dt class="text-ink-secondary min-w-0 truncate">{{ item.key === 'venue_hire' ? 'Venue hire' : item.description }}</dt>
              <dd class="num whitespace-nowrap">{{ money(item.amount) }}</dd>
            </div>
            <div class="flex justify-between gap-3 py-0.5"><dt class="text-ink-secondary">{{ invoice.totals.tax_label }}</dt><dd class="num whitespace-nowrap">{{ money(invoice.totals.tax) }}</dd></div>
            <div class="flex justify-between gap-3 pt-1.5 mt-1 border-t border-line font-semibold text-ink"><dt>Total paid</dt><dd class="num whitespace-nowrap">{{ money(invoice.totals.amount_paid) }}</dd></div>
          </dl>
        </div>
      </div>
      <div class="mt-4 flex flex-wrap gap-2">
        <InvoiceDownloadButton
          :booking-id="bookingId"
          :invoice-number="invoice.invoice_number"
          :booking-number="invoice.booking.booking_number"
          variant="btn-secondary btn-sm flex-1"
        />
        <RouterLink :to="`/customer/bookings/${bookingId}/invoice`" class="btn-ghost btn-sm flex-1">
          <AppIcon icon="file-text" class="w-4 h-4" />View invoice
        </RouterLink>
      </div>
    </template>
    <div v-else class="flex flex-wrap items-center justify-between gap-2 text-sm">
      <p class="text-ink-muted">Your invoice is being prepared.</p>
      <button type="button" class="btn-ghost btn-sm" @click="load"><AppIcon icon="refresh" class="w-4 h-4" />Retry</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { RouterLink } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'
import InvoiceDownloadButton from '@/components/invoice/InvoiceDownloadButton.vue'
import { fetchInvoice, invoiceMoney, type Invoice } from '@/lib/invoice'

const props = defineProps<{ bookingId: number | string }>()

const invoice = ref<Invoice | null>(null)
const loading = ref(true)

function money(n: number) {
  return `${invoice.value?.currency || 'PKR'} ${invoiceMoney(n)}`
}

async function load() {
  loading.value = true
  try {
    invoice.value = await fetchInvoice(props.bookingId)
  } catch {
    invoice.value = null
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => props.bookingId, load)
</script>
