<template>
  <div class="relative" ref="wrap">
    <div class="flex flex-wrap items-center gap-4 mb-3">
      <span v-for="s in series" :key="s.key" class="inline-flex items-center gap-1.5 text-xs text-warm-600 dark:text-warm-300">
        <span class="w-3 h-0.5 rounded-full" :style="{ background: s.color }"></span>{{ s.label }}
      </span>
    </div>
    <svg
      :viewBox="`0 0 ${W} ${H}`"
      class="w-full h-56 overflow-visible select-none"
      preserveAspectRatio="none"
      role="img"
      :aria-label="`Searches and clicks per day over ${points.length} days`"
      @mousemove="onMove"
      @mouseleave="hover = -1"
      @touchstart.passive="onTouch"
      @touchmove.passive="onTouch"
    >
      <!-- grid -->
      <g>
        <line v-for="t in ticks" :key="t" :x1="PL" :x2="W - PR" :y1="y(t)" :y2="y(t)" class="stroke-warm-200 dark:stroke-warm-700" stroke-width="1" vector-effect="non-scaling-stroke" />
      </g>
      <!-- lines -->
      <path v-for="s in series" :key="s.key" :d="path(s.key)" fill="none" :stroke="s.color" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke" />
      <!-- crosshair -->
      <g v-if="hover >= 0">
        <line :x1="x(hover)" :x2="x(hover)" :y1="PT" :y2="H - PB" class="stroke-warm-400 dark:stroke-warm-500" stroke-width="1" stroke-dasharray="3 3" vector-effect="non-scaling-stroke" />
      </g>
    </svg>
    <!-- dots + axis labels rendered in HTML so they don't stretch -->
    <div class="pointer-events-none absolute inset-x-0" :style="{ top: `${legendH}px`, height: '14rem' }">
      <template v-if="hover >= 0">
        <span v-for="s in series" :key="s.key" class="absolute w-2.5 h-2.5 -ml-[5px] -mt-[5px] rounded-full ring-2 ring-white dark:ring-warm-800"
          :style="{ left: `${(x(hover) / W) * 100}%`, top: `${(y(points[hover][s.key]) / H) * 100}%`, background: s.color }"></span>
      </template>
      <span v-for="t in ticks" :key="'t' + t" class="absolute left-0 -translate-y-1/2 text-[10px] tabular-nums text-warm-400" :style="{ top: `${(y(t) / H) * 100}%` }">{{ t }}</span>
    </div>
    <div class="flex justify-between text-[10px] text-warm-400 mt-1" :style="{ paddingLeft: `${(PL / W) * 100}%`, paddingRight: `${(PR / W) * 100}%` }">
      <span v-for="l in xLabels" :key="l">{{ l }}</span>
    </div>
    <div
      v-if="hover >= 0"
      class="pointer-events-none absolute z-10 rounded-xl border border-warm-200 bg-white px-3 py-2 text-xs shadow-elevated dark:border-warm-600 dark:bg-warm-900"
      :style="tooltipStyle"
    >
      <p class="font-semibold text-warm-900 dark:text-warm-50 mb-1">{{ fmtDate(points[hover].date, true) }}</p>
      <p v-for="s in series" :key="s.key" class="flex items-center gap-1.5 text-warm-600 dark:text-warm-300">
        <span class="w-2 h-2 rounded-full" :style="{ background: s.color }"></span>{{ s.label }}
        <span class="ml-auto pl-3 font-semibold tabular-nums text-warm-900 dark:text-warm-50">{{ points[hover][s.key] }}</span>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

interface Point { date: string; searches: number; clicks: number }
type Key = 'searches' | 'clicks'
const props = defineProps<{ points: Point[] }>()

const W = 600, H = 224, PL = 28, PR = 8, PT = 8, PB = 8
const legendH = 28
const wrap = ref<HTMLElement | null>(null)
const hover = ref(-1)

const series: { key: Key; label: string; color: string }[] = [
  { key: 'searches', label: 'Searches', color: 'var(--chart-1)' },
  { key: 'clicks', label: 'Clicks', color: 'var(--chart-2)' },
]

const maxV = computed(() => {
  const m = Math.max(1, ...props.points.flatMap(p => [p.searches, p.clicks]))
  const step = niceStep(m / 3)
  return Math.ceil(m / step) * step
})
const ticks = computed(() => {
  const step = niceStep(maxV.value / 3)
  const out: number[] = []
  for (let v = 0; v <= maxV.value + 1e-9; v += step) out.push(Math.round(v))
  return out
})
function niceStep(raw: number) {
  if (raw <= 1) return 1
  const p = Math.pow(10, Math.floor(Math.log10(raw)))
  const n = raw / p
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p
}

function x(i: number) {
  const n = props.points.length
  return n <= 1 ? (PL + W - PR) / 2 : PL + (i / (n - 1)) * (W - PL - PR)
}
function y(v: number) { return PT + (1 - v / maxV.value) * (H - PT - PB) }
function path(k: Key) {
  return props.points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p[k]).toFixed(1)}`).join(' ')
}

const xLabels = computed(() => {
  const n = props.points.length
  if (!n) return []
  const idx = n <= 4 ? [...Array(n).keys()] : [0, Math.round((n - 1) / 3), Math.round((2 * (n - 1)) / 3), n - 1]
  return idx.map(i => fmtDate(props.points[i].date))
})

function fmtDate(d: string, long = false) {
  const dt = new Date(d + 'T00:00:00')
  return dt.toLocaleDateString('en-PK', long ? { weekday: 'short', day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short' })
}

function pick(clientX: number, target: Element) {
  const rect = target.getBoundingClientRect()
  const vx = ((clientX - rect.left) / rect.width) * W
  const n = props.points.length
  if (!n) return
  const i = n <= 1 ? 0 : Math.round(((vx - PL) / (W - PL - PR)) * (n - 1))
  hover.value = Math.max(0, Math.min(n - 1, i))
}
function onMove(e: MouseEvent) { pick(e.clientX, e.currentTarget as Element) }
function onTouch(e: TouchEvent) { if (e.touches[0]) pick(e.touches[0].clientX, e.currentTarget as Element) }

const tooltipStyle = computed(() => {
  const frac = x(hover.value) / W
  const left = `${frac * 100}%`
  return frac > 0.6
    ? { left, top: `${legendH}px`, transform: 'translateX(calc(-100% - 12px))' }
    : { left, top: `${legendH}px`, transform: 'translateX(12px)' }
})
</script>
