<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <RouterLink :to="`/customer/bookings/${bookingId}`" class="btn-ghost btn-sm -ml-2">
      <AppIcon icon="chevron-left" class="w-4 h-4" />Back to booking
    </RouterLink>

    <div v-if="loading" class="card p-6 space-y-4" aria-busy="true" aria-label="Loading invoice">
      <div class="skeleton h-10 w-1/2"></div>
      <div class="skeleton h-24 w-full"></div>
      <div class="skeleton h-40 w-full"></div>
    </div>

    <div v-else-if="!invoice" class="card">
      <div class="empty-state">
        <div class="empty-state-icon"><AppIcon icon="receipt" class="w-5 h-5" /></div>
        <p class="empty-state-title">{{ notFound ? 'No invoice yet' : "We couldn't load this invoice" }}</p>
        <p class="empty-state-desc">{{ notFound ? 'An invoice is available once this booking has been paid.' : errorMessage }}</p>
        <div class="empty-state-actions">
          <button v-if="!notFound" type="button" class="btn-secondary" @click="load"><AppIcon icon="refresh" class="w-4 h-4" />Try again</button>
          <RouterLink :to="`/customer/bookings/${bookingId}`" class="btn-primary">View booking</RouterLink>
        </div>
      </div>
    </div>

    <template v-else>
      <header class="page-header !mb-0">
        <div class="min-w-0">
          <p class="page-eyebrow">Invoice</p>
          <h1 class="page-title ref break-all">{{ invoice.invoice_number }}</h1>
          <p class="page-subtitle break-words">{{ invoice.booking.event_name }} · {{ invoice.booking.venue.name }}</p>
        </div>
        <div class="page-header-actions">
          <InvoiceDownloadButton
            :booking-id="bookingId"
            :invoice-number="invoice.invoice_number"
            :booking-number="invoice.booking.booking_number"
            variant="btn-primary"
          />
        </div>
      </header>

      <InvoiceDocument :invoice="invoice" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { setPageTitle } from '@/lib/pageTitle'
import { ref, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'
import InvoiceDocument from '@/components/invoice/InvoiceDocument.vue'
import InvoiceDownloadButton from '@/components/invoice/InvoiceDownloadButton.vue'
import { fetchInvoice, type Invoice } from '@/lib/invoice'

const route = useRoute()
const bookingId = String(route.params.id || '')

const invoice = ref<Invoice | null>(null)
const loading = ref(true)
const notFound = ref(false)
const errorMessage = ref('')

async function load() {
  loading.value = true
  notFound.value = false
  try {
    invoice.value = await fetchInvoice(bookingId)
    setPageTitle(`Invoice ${invoice.value.invoice_number}`)
  } catch (e: any) {
    invoice.value = null
    notFound.value = e?.response?.status === 404
    errorMessage.value = e?.response?.data?.message || 'Please try again in a moment.'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>
