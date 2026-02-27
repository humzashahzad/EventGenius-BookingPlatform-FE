<template>
  <div class="chart-container">
    <svg :viewBox="`0 0 ${width} ${height}`" class="chart-svg">
      <!-- Grid lines -->
      <g class="grid">
        <line
          v-for="i in 5"
          :key="`grid-${i}`"
          :x1="padding"
          :y1="padding + (chartHeight / 4) * (i - 1)"
          :x2="width - padding"
          :y2="padding + (chartHeight / 4) * (i - 1)"
          stroke="currentColor"
          stroke-opacity="0.1"
          stroke-width="1"
        />
      </g>

      <!-- Bars -->
      <g class="bars">
        <rect
          v-for="(bar, index) in bars"
          :key="`bar-${index}`"
          :x="bar.x"
          :y="bar.y"
          :width="bar.width"
          :height="bar.height"
          :fill="bar.color"
          rx="4"
          class="chart-bar"
          @mouseenter="showTooltip(index, $event)"
          @mouseleave="hideTooltip"
        />
      </g>

      <!-- X-axis labels -->
      <g class="x-axis">
        <text
          v-for="(label, index) in data"
          :key="`label-${index}`"
          :x="padding + barWidth / 2 + (barWidth + barGap) * index"
          :y="height - padding + 20"
          text-anchor="middle"
          font-size="12"
          fill="currentColor"
          opacity="0.6"
        >
          {{ label.label }}
        </text>
      </g>

      <!-- Y-axis labels -->
      <g class="y-axis">
        <text
          v-for="i in 5"
          :key="`y-label-${i}`"
          :x="padding - 10"
          :y="padding + (chartHeight / 4) * (i - 1) + 5"
          text-anchor="end"
          font-size="12"
          fill="currentColor"
          opacity="0.6"
        >
          {{ formatYLabel((maxValue / 4) * (5 - i)) }}
        </text>
      </g>
    </svg>

    <!-- Tooltip -->
    <div
      v-if="tooltip.show"
      :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
      class="chart-tooltip"
    >
      <p class="tooltip-label">{{ tooltip.label }}</p>
      <p class="tooltip-value">{{ tooltip.value }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

interface ChartData {
  label: string
  value: number
  color?: string
}

const props = withDefaults(
  defineProps<{
    data: ChartData[]
    colors?: string[]
    width?: number
    height?: number
  }>(),
  {
    colors: () => ['#f59e0b', '#06b6d4', '#10b981', '#ec4899', '#3b82f6'],
    width: 600,
    height: 300,
  }
)

const padding = 40
const barGap = 10
const chartWidth = computed(() => props.width - padding * 2)
const chartHeight = computed(() => props.height - padding * 2)
const barWidth = computed(() => (chartWidth.value - (props.data.length - 1) * barGap) / props.data.length)

const maxValue = computed(() => Math.max(...props.data.map(d => d.value), 1))

const bars = computed(() => {
  return props.data.map((item, index) => {
    const barHeight = (item.value / maxValue.value) * chartHeight.value
    return {
      x: padding + (barWidth.value + barGap) * index,
      y: padding + chartHeight.value - barHeight,
      width: barWidth.value,
      height: barHeight,
      color: item.color || props.colors[index % props.colors.length],
      value: item.value,
      label: item.label,
    }
  })
})

const tooltip = ref({
  show: false,
  x: 0,
  y: 0,
  label: '',
  value: '',
})

function showTooltip(index: number, event: MouseEvent) {
  const bar = bars.value[index]
  const rect = (event.target as SVGElement).getBoundingClientRect()
  tooltip.value = {
    show: true,
    x: rect.left + rect.width / 2,
    y: rect.top - 10,
    label: bar.label,
    value: String(bar.value),
  }
}

function hideTooltip() {
  tooltip.value.show = false
}

function formatYLabel(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
  return Math.round(value).toString()
}
</script>

<style scoped>
.chart-container {
  position: relative;
  width: 100%;
}

.chart-svg {
  width: 100%;
  height: auto;
}

.chart-bar {
  cursor: pointer;
  transition: opacity 0.2s ease;
  animation: growBar 0.6s ease forwards;
  transform-origin: bottom;
}

.chart-bar:hover {
  opacity: 0.8;
}

.chart-tooltip {
  position: fixed;
  transform: translate(-50%, -100%);
  background: var(--color-bg-card, white);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 8px;
  padding: 8px 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  pointer-events: none;
  z-index: 1000;
  white-space: nowrap;
}

.tooltip-label {
  font-size: 11px;
  color: var(--color-text-secondary, #6b7280);
  margin-bottom: 2px;
}

.tooltip-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary, #1f2937);
}

@keyframes growBar {
  from {
    transform: scaleY(0);
  }
  to {
    transform: scaleY(1);
  }
}
</style>
