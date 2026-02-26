<template>
  <div class="chart-container">
    <svg :viewBox="`0 0 ${size} ${size}`" class="chart-svg">
      <!-- Donut segments -->
      <g class="segments">
        <path
          v-for="(segment, index) in segments"
          :key="`segment-${index}`"
          :d="segment.path"
          :fill="segment.color"
          class="chart-segment"
          @mouseenter="showTooltip(index, $event)"
          @mouseleave="hideTooltip"
        />
      </g>

      <!-- Center text -->
      <text
        :x="center"
        :y="center - 10"
        text-anchor="middle"
        font-size="24"
        font-weight="600"
        fill="currentColor"
      >
        {{ total }}
      </text>
      <text
        :x="center"
        :y="center + 15"
        text-anchor="middle"
        font-size="12"
        fill="currentColor"
        opacity="0.6"
      >
        Total
      </text>
    </svg>

    <!-- Legend -->
    <div class="chart-legend">
      <div
        v-for="(item, index) in data"
        :key="`legend-${index}`"
        class="legend-item"
      >
        <div class="legend-color" :style="{ backgroundColor: item.color || colors[index % colors.length] }"></div>
        <span class="legend-label">{{ item.label }}</span>
        <span class="legend-value">{{ item.value }}</span>
        <span class="legend-percent">({{ ((item.value / total) * 100).toFixed(1) }}%)</span>
      </div>
    </div>

    <!-- Tooltip -->
    <div
      v-if="tooltip.show"
      :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
      class="chart-tooltip"
    >
      <p class="tooltip-label">{{ tooltip.label }}</p>
      <p class="tooltip-value">{{ tooltip.value }} ({{ tooltip.percent }}%)</p>
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
    size?: number
  }>(),
  {
    colors: () => ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#6366f1'],
    size: 300,
  }
)

const center = computed(() => props.size / 2)
const radius = computed(() => props.size / 2 - 20)
const innerRadius = computed(() => radius.value * 0.6)

const total = computed(() => props.data.reduce((sum, item) => sum + item.value, 0))

const segments = computed(() => {
  let currentAngle = -90 // Start from top

  return props.data.map((item, index) => {
    const percentage = item.value / total.value
    const angle = percentage * 360
    const endAngle = currentAngle + angle

    const path = describeArc(
      center.value,
      center.value,
      radius.value,
      innerRadius.value,
      currentAngle,
      endAngle
    )

    currentAngle = endAngle

    return {
      path,
      color: item.color || props.colors[index % props.colors.length],
      value: item.value,
      label: item.label,
      percent: (percentage * 100).toFixed(1),
    }
  })
})

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  }
}

function describeArc(
  x: number,
  y: number,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarToCartesian(x, y, outerRadius, endAngle)
  const end = polarToCartesian(x, y, outerRadius, startAngle)
  const innerStart = polarToCartesian(x, y, innerRadius, endAngle)
  const innerEnd = polarToCartesian(x, y, innerRadius, startAngle)

  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'

  return [
    'M', start.x, start.y,
    'A', outerRadius, outerRadius, 0, largeArcFlag, 0, end.x, end.y,
    'L', innerEnd.x, innerEnd.y,
    'A', innerRadius, innerRadius, 0, largeArcFlag, 1, innerStart.x, innerStart.y,
    'Z',
  ].join(' ')
}

const tooltip = ref({
  show: false,
  x: 0,
  y: 0,
  label: '',
  value: '',
  percent: '',
})

function showTooltip(index: number, event: MouseEvent) {
  const segment = segments.value[index]
  const rect = (event.target as SVGElement).getBoundingClientRect()
  tooltip.value = {
    show: true,
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
    label: segment.label,
    value: String(segment.value),
    percent: segment.percent,
  }
}

function hideTooltip() {
  tooltip.value.show = false
}
</script>

<style scoped>
.chart-container {
  display: flex;
  align-items: center;
  gap: 32px;
}

.chart-svg {
  flex-shrink: 0;
}

.chart-segment {
  cursor: pointer;
  transition: opacity 0.2s ease, transform 0.2s ease;
  transform-origin: center;
}

.chart-segment:hover {
  opacity: 0.8;
}

.chart-legend {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-label {
  flex: 1;
  color: var(--color-text-primary, #1f2937);
}

.legend-value {
  font-weight: 600;
  color: var(--color-text-primary, #1f2937);
}

.legend-percent {
  color: var(--color-text-secondary, #6b7280);
  font-size: 12px;
}

.chart-tooltip {
  position: fixed;
  transform: translate(-50%, -50%);
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

@media (max-width: 768px) {
  .chart-container {
    flex-direction: column;
  }
}
</style>
