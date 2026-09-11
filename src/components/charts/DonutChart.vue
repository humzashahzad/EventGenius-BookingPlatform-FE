<template>
  <apexchart
    type="donut"
    :height="size"
    :options="chartOptions"
    :series="seriesData"
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
    size?: number
  }>(),
  {
    colors: () => ['#10B981', '#34D399', '#F59E0B', '#F97066', '#6EE7B7', '#059669'],
    size: 300,
  }
)

const seriesData = computed(() => props.data.map(d => d.value))

const total = computed(() => props.data.reduce((sum, item) => sum + item.value, 0))

const chartOptions = computed(() => ({
  chart: {
    type: 'donut' as const,
  },
  labels: props.data.map(d => d.label),
  colors: props.data.map((d, i) => d.color || props.colors[i % props.colors.length]),
  stroke: { width: 0 },
  legend: {
    position: 'right' as const,
    fontSize: '14px',
    fontFamily: 'Public Sans',
    markers: { width: 12, height: 12, radius: 12 },
    itemMargin: { horizontal: 0, vertical: 6 },
    formatter: (seriesName: string, opts: any) => {
      const val = opts.w.globals.series[opts.seriesIndex]
      const pct = ((val / total.value) * 100).toFixed(1)
      return `${seriesName} - ${val} (${pct}%)`
    },
  },
  plotOptions: {
    pie: {
      donut: {
        size: '60%',
        labels: {
          show: true,
          name: { show: true, fontSize: '12px', color: '#A8A29E' },
          value: { show: true, fontSize: '24px', fontWeight: 600 },
          total: {
            show: true,
            label: 'Total',
            fontSize: '12px',
            formatter: () => String(total.value),
          },
        },
      },
    },
  },
  dataLabels: { enabled: false },
  tooltip: {
    theme: 'light',
  },
  responsive: [{
    breakpoint: 768,
    options: {
      legend: { position: 'bottom' },
    },
  }],
}))
</script>
