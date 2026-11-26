<template>
  <button
    type="button"
    :class="variant"
    :disabled="busy"
    :aria-busy="busy"
    :aria-label="iconOnly ? label : undefined"
    :title="iconOnly ? label : undefined"
    @click="download"
  >
    <AppIcon :icon="busy ? 'loader' : 'download'" :class="busy ? 'w-4 h-4 animate-spin' : 'w-4 h-4'" />
    <template v-if="!iconOnly">{{ busy ? busyLabel : label }}</template>
  </button>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import AppIcon from '@/components/ui/AppIcon.vue'
import { downloadInvoicePdf, type InvoiceAudience } from '@/lib/invoice'

const props = withDefaults(defineProps<{
  bookingId: number | string
  audience?: InvoiceAudience
  bookingNumber?: string | null
  invoiceNumber?: string | null
  label?: string
  busyLabel?: string
  /** Button classes, e.g. "btn-secondary" or "btn-ghost btn-sm". */
  variant?: string
  iconOnly?: boolean
}>(), {
  audience: 'client',
  bookingNumber: null,
  invoiceNumber: null,
  label: 'Download PDF',
  busyLabel: 'Preparing PDF…',
  variant: 'btn-secondary',
  iconOnly: false,
})

const busy = ref(false)

async function download() {
  if (busy.value) return
  busy.value = true
  try {
    const name = await downloadInvoicePdf(props.audience, props.bookingId, {
      invoiceNumber: props.invoiceNumber,
      bookingNumber: props.bookingNumber,
    })
    toast.success('Invoice downloaded', { description: name })
  } catch (e: any) {
    toast.error(e?.message || 'Could not download the invoice. Please try again.')
  } finally {
    busy.value = false
  }
}
</script>
