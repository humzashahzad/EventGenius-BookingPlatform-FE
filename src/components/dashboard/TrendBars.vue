<template>
  <div ref="root" class="relative w-full" :style="{ height: `${height}px` }">
    <svg
      v-if="width > 0"
      :width="width"
      :height="height"
      role="img"
      :aria-label="ariaLabel"
      class="block overflow-visible"
      @mouseleave="hover = -1"
    >
      <!-- grid + y axis -->
      <g>
        <template v-for="t in ticks" :key="t">
          <line :x1="padL" :x2="width - padR" :y1="y(t)" :y2="y(t)" stroke="var(--chart-grid)" stroke-width="1" :stroke-dasharray="t === 0 ? undefined : '3 3'" />
          <text :x="padL - 8" :y="y(t)" dy="0.32em" text-anchor="end" class="axis-text">{{ formatAxis(t) }}</text>
        </template>
      </g>
      <!-- bars -->
      <g>
        <g v-for="(d, i) in data" :key="d.label + i">
          <rect
            v-if="d.value > 0"
            :x="bx(i) + gap / 2"
            :y="y(d.value)"
            :width="Math.max(1, bw - gap)"
            :height="Math.max(0, y(0) - y(d.value))"
            :rx="Math.min(4, (bw - gap) / 2)"
            :fill="color"
            :opacity="hover === -1 || hover === i ? 1 : 0.45"
          />
          <!-- flat bottom corners -->
          <rect
            v-if="d.value > 0 && y(0) - y(d.value) > 4"
            :x="bx(i) + gap / 2"
            :y="y(0) - 4"
            :width="Math.max(1, bw - gap)"
            height="4"
            :fill="color"
            :opacity="hover === -1 || hover === i ? 1 : 0.45"
          />
          <!-- hit target (full column) -->
          <rect
            :x="bx(i)"
            :y="padT"
            :width="bw"
            :height="plotH"
            fill="transparent"
            @mouseenter="hover = i"
            @focus="hover = i"
            @blur="hover = -1"
            tabindex="0"
            :aria-label="`${d.title || d.label}: ${format(d.value)}`"
            class="outline-none"
          />
          <text
            v-if="showLabel(i)"
            :x="bx(i) + bw / 2"
            :y="height - 6"
            text-anchor="middle"
            class="axis-text"
          >{{ d.label }}</text>
        </g>
      </g>
    </svg>

    <div
      v-if="hover >= 0 && data[hover]"
      class="chart-tip"
      :style="tipStyle"
      role="status"
    >
      <p class="text-ink-muted">{{ data[hover].title || data[hover].label }}</p>
      <p class="font-semibold text-ink num">{{ format(data[hover].value) }}</p>
      <p v-if="data[hover].extra" class="text-ink-muted">{{ data[hover].extra }}</p>
    </div>

    <table class="sr-only">
      <caption>{{ ariaLabel }}</caption>
      <thead><tr><th>Period</th><th>Value</th></tr></thead>
      <tbody><tr v-for="(d, i) in data" :key="i"><td>{{ d.title || d.label }}</td><td>{{ format(d.value) }}</td></tr></tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

export interface BarDatum { label: string; title?: string; value: number; extra?: string }

const props = withDefaults(defineProps<{
  data: BarDatum[]
  height?: number
  color?: string
  ariaLabel?: string
  format?: (v: number) => string
  formatAxis?: (v: number) => string
}>(), {
  height: 240,
  color: 'var(--chart-1)',
  ariaLabel: 'Bar chart',
  format: (v: number) => v.toLocaleString('en-PK'),
  formatAxis: (v: number) => {
    const a = Math.abs(v)
    if (a >= 1e9) return `${+(v / 1e9).toFixed(1)}B`
    if (a >= 1e6) return `${+(v / 1e6).toFixed(1)}M`
    if (a >= 1e3) return `${+(v / 1e3).toFixed(1)}K`
    return String(Math.round(v))
  },
})

const root = ref<HTMLElement | null>(null)
const width = ref(0)
const hover = ref(-1)
let ro: ResizeObserver | null = null

onMounted(() => {
  if (!root.value) return
  width.value = root.value.clientWidth
  ro = new ResizeObserver(entries => { width.value = Math.floor(entries[0].contentRect.width) })
  ro.observe(root.value)
})
onBeforeUnmount(() => ro?.disconnect())

const padT = 8
const padB = 24
const padR = 4
const padL = computed(() => Math.max(28, ...ticks.value.map(t => props.formatAxis(t).length * 6.5 + 10)))
const plotH = computed(() => props.height - padT - padB)
const plotW = computed(() => Math.max(10, width.value - padL.value - padR))
const bw = computed(() => plotW.value / Math.max(1, props.data.length))
const gap = computed(() => Math.min(Math.max(2, bw.value * 0.28), 16))

const maxV = computed(() => Math.max(0, ...props.data.map(d => d.value)))
const ticks = computed(() => {
  const m = maxV.value
  if (m <= 0) return [0, 1]
  const raw = m / 4
  const p = Math.pow(10, Math.floor(Math.log10(raw)))
  const step = [1, 2, 2.5, 5, 10].map(s => s * p).find(s => s >= raw) ?? 10 * p
  const out: number[] = []
  for (let v = 0; v <= m + step * 0.001; v += step) out.push(v)
  if (out[out.length - 1] < m) out.push(out[out.length - 1] + step)
  return out
})
const top = computed(() => ticks.value[ticks.value.length - 1] || 1)
const y = (v: number) => padT + plotH.value - (v / top.value) * plotH.value
const bx = (i: number) => padL.value + i * bw.value

const labelStep = computed(() => {
  const per = 44 // px a label needs
  return Math.max(1, Math.ceil(per / Math.max(1, bw.value)))
})
function showLabel(i: number) {
  const n = props.data.length
  if (labelStep.value === 1) return true
  // keep the last label (most recent) and step back from it
  return (n - 1 - i) % labelStep.value === 0
}

const tipStyle = computed(() => {
  const i = hover.value
  const cx = bx(i) + bw.value / 2
  const left = Math.min(Math.max(cx, 70), width.value - 70)
  const d = props.data[i]
  const top = Math.max(0, y(d?.value ?? 0) - 8)
  return { left: `${left}px`, top: `${top}px` }
})
</script>

<style scoped>
.axis-text { font-size: 11px; fill: var(--chart-axis); font-variant-numeric: tabular-nums; }
.chart-tip {
  position: absolute;
  transform: translate(-50%, -100%);
  pointer-events: none;
  white-space: nowrap;
  padding: 0.375rem 0.625rem;
  font-size: 0.75rem;
  line-height: 1.1rem;
  background: var(--surface-raised);
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-lg);
  z-index: 2;
}
</style>
