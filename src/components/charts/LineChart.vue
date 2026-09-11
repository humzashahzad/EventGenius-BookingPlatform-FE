<template>
  <apexchart
    type="line"
    :height="height"
    :options="chartOptions"
    :series="series"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'

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
    color: '#10B981',
    showArea: true,
    showPoints: true,
    width: 600,
    height: 300,
  }
)

const series = computed(() => [{
  name: 'Value',
  data: props.data.map(d => d.value),
}])

const chartOptions = computed(() => ({
  chart: {
    type: 'line' as const,
    toolbar: { show: false },
    sparkline: { enabled: false },
    parentHeightOffset: 0,
  },
  colors: [props.color],
  stroke: {
    width: 3,
    curve: 'smooth' as const,
  },
  fill: {
    type: props.showArea ? 'gradient' : 'solid',
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.3,
      opacityTo: 0.05,
      stops: [0, 95, 100],
    },
  },
  markers: {
    size: props.showPoints ? 4 : 0,
    colors: [props.color],
    strokeColors: '#fff',
    strokeWidth: 2,
    hover: { sizeOffset: 2 },
  },
  xaxis: {
    categories: props.data.map(d => d.label),
    labels: { style: { fontSize: '12px', colors: '#A8A29E' } },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: {
    labels: {
      style: { fontSize: '12px', colors: '#A8A29E' },
      formatter: (val: number) => {
        if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`
        if (val >= 1000) return `${(val / 1000).toFixed(1)}K`
        return Math.round(val).toString()
      },
    },
  },
  grid: {
    borderColor: '#E7E5E4',
    strokeDashArray: 5,
    padding: { top: -10, bottom: -10 },
  },
  tooltip: {
    theme: 'light',
  },
}))
</script>
