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

      <!-- Line path -->
      <path
        :d="linePath"
        fill="none"
        :stroke="color"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="chart-line"
      />

      <!-- Area fill -->
      <path
        v-if="showArea"
        :d="areaPath"
        :fill="color"
        fill-opacity="0.1"
      />

      <!-- Data points -->
      <g v-if="showPoints">
        <circle
          v-for="(point, index) in points"
          :key="`point-${index}`"
          :cx="point.x"
          :cy="point.y"
          r="4"
          :fill="color"
          class="chart-point"
          @mouseenter="showTooltip(index, $event)"
          @mouseleave="hideTooltip"
        />
      </g>

      <!-- X-axis labels -->
      <g class="x-axis">
        <text
          v-for="(label, index) in data"
          :key="`label-${index}`"
          :x="padding + (chartWidth / (data.length - 1)) * index"
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
}

const props = withDefaults(
  defineProps<{
    data: ChartData[]
    color?: string
    showArea?: boolean
    showPoints?: boolean
    width?: number
    height?: number
  }>(),
  {
    color: '#f59e0b',
    showArea: true,
    showPoints: true,
    width: 600,
    height: 300,
  }
)

const padding = 40
const chartWidth = computed(() => props.width - padding * 2)
const chartHeight = computed(() => props.height - padding * 2)

const maxValue = computed(() => Math.max(...props.data.map(d => d.value), 1))

const points = computed(() => {
  return props.data.map((item, index) => ({
    x: padding + (chartWidth.value / (props.data.length - 1)) * index,
    y: padding + chartHeight.value - (item.value / maxValue.value) * chartHeight.value,
    value: item.value,
    label: item.label,
  }))
})

const linePath = computed(() => {
  if (points.value.length === 0) return ''
  return points.value.reduce((path, point, index) => {
    return index === 0 ? `M ${point.x} ${point.y}` : `${path} L ${point.x} ${point.y}`
  }, '')
})

const areaPath = computed(() => {
  if (points.value.length === 0) return ''
  const path = linePath.value
  const lastPoint = points.value[points.value.length - 1]
  const firstPoint = points.value[0]
  return `${path} L ${lastPoint.x} ${padding + chartHeight.value} L ${firstPoint.x} ${padding + chartHeight.value} Z`
})

const tooltip = ref({
  show: false,
  x: 0,
  y: 0,
  label: '',
  value: '',
})

function showTooltip(index: number, event: MouseEvent) {
  const point = points.value[index]
  const rect = (event.target as SVGElement).getBoundingClientRect()
  tooltip.value = {
    show: true,
    x: rect.left + rect.width / 2,
    y: rect.top - 10,
    label: point.label,
    value: String(point.value),
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

.chart-line {
  transition: stroke-dashoffset 1s ease;
  animation: drawLine 1s ease forwards;
}

.chart-point {
  cursor: pointer;
  transition: r 0.2s ease;
}

.chart-point:hover {
  r: 6;
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

@keyframes drawLine {
  from {
    stroke-dasharray: 1000;
    stroke-dashoffset: 1000;
  }
  to {
    stroke-dasharray: 1000;
    stroke-dashoffset: 0;
  }
}
</style>
