<template>
  <dl class="pb">
    <div class="pb-row">
      <dt>{{ perHead ? `PKR ${fmt(perHead)} × ${guests} guest${guests === 1 ? '' : 's'}` : 'Venue' }}</dt>
      <dd>PKR {{ fmt(pricing.base) }}</dd>
    </div>
    <div v-for="a in addOns" :key="a.id" class="pb-row">
      <dt class="truncate">{{ a.name }}</dt>
      <dd>PKR {{ fmt(Number(a.price || 0)) }}</dd>
    </div>
    <div class="pb-row"><dt>Tax (5%)</dt><dd>PKR {{ fmt(pricing.tax) }}</dd></div>
    <div class="pb-row pb-total"><dt>Estimated total</dt><dd>PKR {{ fmt(pricing.total) }}</dd></div>
  </dl>
</template>

<script setup lang="ts">
import { fmt, type Pricing } from './bookingPricing'

defineProps<{ pricing: Pricing; perHead: number; guests: number; addOns: { id: number; name: string; price?: number | string | null }[] }>()
</script>

<style scoped>
.pb-row { display: flex; justify-content: space-between; gap: 1rem; padding: 0.3rem 0; font-size: 0.8125rem; color: var(--ink-secondary); }
.pb-row dt { min-width: 0; }
.pb-row dd { flex-shrink: 0; font-variant-numeric: tabular-nums; color: var(--ink); }
.pb-total { margin-top: 0.375rem; padding-top: 0.625rem; border-top: 1px solid var(--line); font-size: 0.9375rem; font-weight: 600; color: var(--ink); }
</style>
