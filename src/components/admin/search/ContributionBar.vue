<template>
  <div>
    <div
      class="flex h-2.5 w-full overflow-hidden rounded-full bg-warm-100 dark:bg-warm-700"
      role="img"
      :aria-label="ariaLabel"
    >
      <span
        v-for="seg in segments"
        :key="seg.key"
        class="h-full first:rounded-l-full last:rounded-r-full border-r-2 border-white dark:border-warm-800 last:border-r-0"
        :style="{ width: `${seg.width}%`, background: seg.color }"
        :title="`${seg.label}: ${seg.points.toFixed(1)} pts`"
      ></span>
    </div>
    <div v-if="showLegend && segments.length" class="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
      <span v-for="seg in segments" :key="seg.key" class="inline-flex items-center gap-1 text-[11px] text-warm-500 dark:text-warm-400">
        <span class="w-2 h-2 rounded-sm" :style="{ background: seg.color }"></span>
        {{ seg.label }} <span class="tabular-nums text-warm-700 dark:text-warm-300">{{ seg.points.toFixed(1) }}</span>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { SIGNAL_MAP, SIGNALS } from './signals'

const props = withDefaults(defineProps<{
  contributions: Record<string, number> | null | undefined
  /** Bar width is scaled against this total (100 = full score scale). */
  scale?: number
  showLegend?: boolean
}>(), { scale: 100, showLegend: false })

const segments = computed(() => {
  const entries = Object.entries(props.contributions || {})
    .map(([key, points]) => ({ key, points: Number(points) || 0 }))
    .filter(e => e.points > 0.05)
    // Fixed signal order (never by size) so colours sit in their validated adjacency.
    .sort((a, b) => order(a.key) - order(b.key))
  return entries.map(e => ({
    ...e,
    label: SIGNAL_MAP[e.key]?.label || labelFor(e.key),
    color: SIGNAL_MAP[e.key]?.color || colorFor(e.key),
    width: Math.max(0, Math.min(100, (e.points / (props.scale || 100)) * 100)),
  }))
})

const ariaLabel = computed(() =>
  segments.value.length
    ? 'Score breakdown: ' + segments.value.map(s => `${s.label} ${s.points.toFixed(1)}`).join(', ')
    : 'No score breakdown',
)

function order(k: string) {
  const i = SIGNALS.findIndex(s => s.key === k)
  return i < 0 ? 99 : i
}
function labelFor(k: string) {
  if (k === 'featured' || k === 'featured_boost') return 'Featured'
  if (k === 'search_boost' || k === 'boost') return 'Admin boost'
  return k.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())
}
function colorFor(k: string) {
  if (k.startsWith('featured')) return 'var(--sig-featured)'
  if (k.includes('boost')) return 'var(--sig-boost)'
  return '#A8A29E'
}
</script>
