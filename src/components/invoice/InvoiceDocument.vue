<template>
  <article class="card overflow-hidden" :aria-label="`Invoice ${invoice.invoice_number}`">
    <!-- Header -->
    <header class="p-5 sm:p-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b-2 border-brand-strong">
      <div class="flex items-center gap-3 min-w-0">
        <AppLogo class="w-10 h-10" />
        <div class="min-w-0">
          <p class="font-display text-lg font-bold text-ink leading-tight">{{ invoice.issuer.name }}</p>
          <p class="text-xs text-ink-muted break-words">{{ invoice.issuer.tagline }} · {{ invoice.issuer.website }}</p>
        </div>
      </div>
      <div class="sm:text-right">
        <p class="font-display text-2xl font-bold tracking-[0.12em] text-brand-text">INVOICE</p>
        <span class="mt-1 inline-flex" :class="invoice.status === 'refunded' ? 'badge-refunded' : 'badge-paid'">{{ invoice.status_label }}</span>
      </div>
    </header>

    <div class="p-5 sm:p-8 space-y-6">
      <!-- Parties + meta -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div class="min-w-0">
          <p class="eyebrow mb-1.5">Billed to</p>
          <p class="text-sm font-semibold text-ink break-words">{{ invoice.customer.name }}</p>
          <p v-if="invoice.customer.email" class="text-sm text-ink-secondary break-all">{{ invoice.customer.email }}</p>
          <p v-if="invoice.customer.phone" class="text-sm text-ink-secondary">{{ invoice.customer.phone }}</p>
        </div>
        <div class="min-w-0">
          <p class="eyebrow mb-1.5">Venue host</p>
          <p class="text-sm font-semibold text-ink break-words">{{ invoice.store.name }}</p>
          <p v-if="invoice.store.address" class="text-sm text-ink-secondary break-words">{{ invoice.store.address }}</p>
          <p v-if="invoice.store.phone" class="text-sm text-ink-secondary">{{ invoice.store.phone }}</p>
          <p v-if="invoice.store.email" class="text-sm text-ink-secondary break-all">{{ invoice.store.email }}</p>
        </div>
        <dl class="text-sm min-w-0">
          <div class="dl-row"><dt>Invoice no.</dt><dd class="ref font-semibold">{{ invoice.invoice_number }}</dd></div>
          <div class="dl-row"><dt>Issue date</dt><dd>{{ invoice.issued_on }}</dd></div>
          <div class="dl-row"><dt>Booking</dt><dd class="ref">{{ invoice.booking.booking_number }}</dd></div>
          <div class="dl-row"><dt>Amount</dt><dd class="font-semibold num">{{ money(invoice.totals.total) }}</dd></div>
        </dl>
      </div>

      <!-- Booking details -->
      <section aria-labelledby="inv-booking">
        <h3 id="inv-booking" class="eyebrow mb-1.5">Booking details</h3>
        <div class="rounded-lg border border-line px-4 py-1 grid grid-cols-1 md:grid-cols-2 md:gap-x-8 text-sm">
          <dl>
            <div class="dl-row"><dt>Venue</dt><dd class="min-w-0 break-words">{{ invoice.booking.venue.name }}</dd></div>
            <div v-if="invoice.booking.venue.address" class="dl-row"><dt>Address</dt><dd class="min-w-0 break-words">{{ invoice.booking.venue.address }}</dd></div>
            <div class="dl-row"><dt>Guests</dt><dd class="num">{{ invoice.booking.guests.toLocaleString('en-US') }}</dd></div>
          </dl>
          <dl>
            <div class="dl-row"><dt>Event</dt><dd class="min-w-0 break-words">{{ invoice.booking.event_name }}</dd></div>
            <div v-if="invoice.booking.event_type_label" class="dl-row"><dt>Type</dt><dd>{{ invoice.booking.event_type_label }}</dd></div>
            <div class="dl-row"><dt>Date</dt><dd>{{ invoice.booking.event_date_label }}</dd></div>
            <div v-if="invoice.booking.time_label" class="dl-row">
              <dt>Time</dt>
              <dd>{{ invoice.booking.time_label }}<span v-if="invoice.booking.duration_hours" class="text-ink-muted"> ({{ invoice.booking.duration_hours }} hours)</span></dd>
            </div>
          </dl>
        </div>
      </section>

      <!-- Line items -->
      <section aria-labelledby="inv-items">
        <h3 id="inv-items" class="sr-only">Charges</h3>
        <!-- Phone: stacked -->
        <ul class="sm:hidden divide-y divide-line border-y border-line">
          <li v-for="item in invoice.line_items" :key="item.key" class="py-3 flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-sm font-semibold text-ink break-words">{{ item.description }}</p>
              <p v-if="item.detail" class="text-xs text-ink-muted">{{ item.detail }}</p>
            </div>
            <p class="text-sm font-medium text-ink num whitespace-nowrap">{{ invoiceMoney(item.amount) }}</p>
          </li>
        </ul>
        <!-- Wider: table -->
        <div class="hidden sm:block table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Description</th>
                <th class="cell-num">Qty</th>
                <th class="cell-num">Unit price ({{ invoice.currency }})</th>
                <th class="cell-num">Amount ({{ invoice.currency }})</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in invoice.line_items" :key="item.key">
                <td>
                  <p class="cell-primary">{{ item.description }}</p>
                  <p v-if="item.detail" class="text-xs text-ink-muted">{{ item.detail }}</p>
                </td>
                <td class="cell-num">{{ item.quantity.toLocaleString('en-US') }}</td>
                <td class="cell-num">{{ invoiceMoney(item.unit_price) }}</td>
                <td class="cell-num">{{ invoiceMoney(item.amount) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Totals -->
        <dl class="mt-3 sm:ml-auto sm:max-w-sm text-sm">
          <div class="flex justify-between gap-4 py-1.5"><dt class="text-ink-secondary">Subtotal</dt><dd class="num">{{ money(invoice.totals.subtotal) }}</dd></div>
          <div v-if="invoice.totals.discount > 0" class="flex justify-between gap-4 py-1.5"><dt class="text-ink-secondary">Discount</dt><dd class="num">− {{ money(invoice.totals.discount) }}</dd></div>
          <div class="flex justify-between gap-4 py-1.5"><dt class="text-ink-secondary">{{ invoice.totals.tax_label }}</dt><dd class="num">{{ money(invoice.totals.tax) }}</dd></div>
          <div class="flex justify-between gap-4 py-2 border-t border-ink text-base font-bold text-ink"><dt>Total</dt><dd class="num">{{ money(invoice.totals.total) }}</dd></div>
          <div class="flex justify-between gap-4 py-1.5 text-success-text"><dt>Amount paid</dt><dd class="num">{{ money(invoice.totals.amount_paid) }}</dd></div>
          <div v-if="invoice.status === 'refunded'" class="flex justify-between gap-4 py-1.5 text-ink-secondary"><dt>Refunded</dt><dd class="num">− {{ money(invoice.totals.refunded) }}</dd></div>
          <div class="flex justify-between gap-4 py-2 px-3 -mx-3 rounded-lg bg-surface-sunken font-semibold text-ink"><dt>Balance due</dt><dd class="num">{{ money(invoice.totals.balance_due) }}</dd></div>
        </dl>
      </section>

      <!-- Payment details -->
      <section aria-labelledby="inv-payment">
        <h3 id="inv-payment" class="eyebrow mb-1.5">Payment details</h3>
        <div class="rounded-lg border border-line px-4 py-1 grid grid-cols-1 md:grid-cols-2 md:gap-x-8 text-sm">
          <dl>
            <div class="dl-row"><dt>Method</dt><dd>{{ invoice.payment.method_label }}</dd></div>
            <div v-if="invoice.payment.transaction_id" class="dl-row"><dt>Transaction ID</dt><dd class="ref min-w-0 break-all">{{ invoice.payment.transaction_id }}</dd></div>
            <div v-if="invoice.payment.reference" class="dl-row"><dt>Reference</dt><dd class="ref min-w-0 break-all">{{ invoice.payment.reference }}</dd></div>
          </dl>
          <dl>
            <div v-if="invoice.payment.paid_at_label" class="dl-row"><dt>Paid at</dt><dd>{{ invoice.payment.paid_at_label }}</dd></div>
            <template v-if="invoice.payment.gateway_amount">
              <div class="dl-row"><dt>Charged</dt><dd class="num">{{ invoice.payment.gateway_currency }} {{ invoiceMoney(invoice.payment.gateway_amount) }}</dd></div>
              <div v-if="invoice.payment.exchange_rate" class="dl-row"><dt>Exchange rate</dt><dd>1 {{ invoice.currency }} = {{ invoice.payment.exchange_rate }} {{ invoice.payment.gateway_currency }}</dd></div>
            </template>
            <div v-if="invoice.payment.refunded_at_label" class="dl-row"><dt>Refunded at</dt><dd>{{ invoice.payment.refunded_at_label }}</dd></div>
          </dl>
        </div>
      </section>

      <p class="rounded-lg border-l-[3px] border-brand-strong bg-surface-sunken px-4 py-3 text-sm text-ink-secondary">
        <template v-if="invoice.status === 'refunded'">This payment was refunded in full. Keep this invoice for your records.</template>
        <template v-else>Thank you for booking with {{ invoice.issuer.name }}. Your payment has been received and your date is secured.</template>
        For questions about this invoice, contact
        <a :href="`mailto:${invoice.issuer.support_email}?subject=${encodeURIComponent('Invoice ' + invoice.invoice_number)}`" class="link break-all">{{ invoice.issuer.support_email }}</a>
        and quote {{ invoice.invoice_number }}.
      </p>
    </div>
  </article>
</template>

<script setup lang="ts">
import AppLogo from '@/components/brand/AppLogo.vue'
import { invoiceMoney, type Invoice } from '@/lib/invoice'

const props = defineProps<{ invoice: Invoice }>()

function money(n: number) {
  return `${props.invoice.currency} ${invoiceMoney(n)}`
}
</script>
