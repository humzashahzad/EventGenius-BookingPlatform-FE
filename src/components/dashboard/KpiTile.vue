<template>
  <component
    :is="to ? RouterLink : 'div'"
    :to="to"
    class="kpi-tile"
    :class="to ? 'card-hover' : ''"
  >
    <div class="flex items-start justify-between gap-3">
      <p class="stat-label">{{ label }}</p>
      <span class="icon-chip icon-chip-sm" :class="TONE[tone]" aria-hidden="true">
        <AppIcon :icon="icon" class="w-4 h-4" />
      </span>
    </div>
    <template v-if="loading">
      <div class="skeleton h-7 w-24 mt-1" />
      <div class="skeleton h-3 w-32 mt-3" />
    </template>
    <template v-else>
      <p class="kpi-value" :title="title || `${unit ? unit + ' ' : ''}${value}`"><span v-if="unit" class="kpi-unit">{{ unit }}</span>{{ value }}</p>
      <p class="stat-meta">
        <span v-if="delta !== undefined && delta !== null" :class="deltaClass">
          <AppIcon :icon="deltaIcon" class="w-3 h-3" />
          <span class="sr-only">{{ delta > 0 ? 'Up' : delta < 0 ? 'Down' : 'No change' }}</span>
          {{ Math.abs(delta) >= 100 ? Math.round(Math.abs(delta)) : Math.abs(delta).toFixed(1).replace(/\.0$/, '') }}%
        </span>
        <span v-if="helper" class="min-w-0">{{ helper }}</span>
      </p>
    </template>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'

const props = withDefaults(defineProps<{
  label: string
  value: string | number
  /** Small prefix such as "PKR", kept off the big number so it never wraps. */
  unit?: string
  icon: string
  tone?: 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  /** Percent change vs. the previous period (null/undefined hides the chip). */
  delta?: number | null
  /** When true, a rise is bad (e.g. pending backlog) — colours flip. */
  invert?: boolean
  helper?: string
  title?: string
  to?: string
  loading?: boolean
}>(), { tone: 'brand', invert: false })

const TONE: Record<string, string> = { brand: 'tone-brand', success: 'tone-success', warning: 'tone-warning', danger: 'tone-danger', info: 'tone-info', neutral: 'tone-neutral' }

const deltaIcon = computed(() => (props.delta ?? 0) > 0.05 ? 'trending-up' : (props.delta ?? 0) < -0.05 ? 'trending-down' : 'minus')
const deltaClass = computed(() => {
  const d = props.delta ?? 0
  if (Math.abs(d) < 0.05) return 'stat-delta-flat'
  const good = props.invert ? d < 0 : d > 0
  return good ? 'stat-delta-up' : 'stat-delta-down'
})
</script>

<style scoped>
.kpi-tile {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 1rem 1.125rem;
  background-color: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xs);
}
.kpi-unit { margin-right: 0.25rem; font-family: var(--font-sans); font-size: 0.75rem; font-weight: 600; letter-spacing: 0.02em; color: var(--ink-muted); }
.kpi-value {
  margin-top: 0.25rem;
  font-family: var(--font-display);
  font-size: clamp(1.25rem, 1.05rem + 0.6vw, 1.5rem);
  line-height: 1.2;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
  min-width: 0;
  overflow-wrap: anywhere;
}
</style>
