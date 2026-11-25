<template>
  <ul class="space-y-3" :aria-label="ariaLabel">
    <li v-for="(d, i) in rows" :key="d.label + i" class="min-w-0">
      <div class="flex items-baseline justify-between gap-3 text-sm">
        <span class="truncate text-ink" :title="d.label">{{ d.label }}</span>
        <span class="shrink-0 num font-medium text-ink">{{ format(d.value) }}<span v-if="showShare" class="ml-1.5 text-xs font-normal text-ink-muted">{{ share(d.value) }}%</span></span>
      </div>
      <div class="mt-1.5 h-2 rounded-full bg-surface-sunken overflow-hidden" aria-hidden="true">
        <div class="h-full rounded-full" :style="{ width: `${pct(d.value)}%`, backgroundColor: d.color || color }" />
      </div>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  data: { label: string; value: number; color?: string }[]
  color?: string
  ariaLabel?: string
  showShare?: boolean
  format?: (v: number) => string
}>(), { color: 'var(--chart-1)', ariaLabel: 'Ranking', showShare: true, format: (v: number) => v.toLocaleString('en-PK') })

const rows = computed(() => [...props.data].sort((a, b) => b.value - a.value))
const max = computed(() => Math.max(1, ...props.data.map(d => d.value)))
const total = computed(() => props.data.reduce((s, d) => s + d.value, 0) || 1)
const pct = (v: number) => Math.max(v > 0 ? 2 : 0, (v / max.value) * 100)
const share = (v: number) => Math.round((v / total.value) * 100)
</script>
