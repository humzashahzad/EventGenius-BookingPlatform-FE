<template>
  <apexchart
    type="bar"
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
    colors: () => ['#10B981', '#059669', '#F59E0B', '#F97066', '#34D399'],
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
    type: 'bar' as const,
    toolbar: { show: false },
    parentHeightOffset: 0,
  },
  plotOptions: {
    bar: {
      borderRadius: 6,
      columnWidth: '45%',
      distributed: true,
    },
  },
  colors: props.data.map((d, i) => d.color || props.colors[i % props.colors.length]),
  legend: { show: false },
  dataLabels: { enabled: false },
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
