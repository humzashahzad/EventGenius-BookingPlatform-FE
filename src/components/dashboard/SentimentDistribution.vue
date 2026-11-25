<template>
  <div>
    <div class="flex h-2.5 w-full overflow-hidden rounded-full bg-surface-sunken gap-[2px]" role="img" :aria-label="aria">
      <div v-if="pos" class="h-full bg-success" :style="{ width: pct(pos) + '%' }" />
      <div v-if="neu" class="h-full bg-neutral" :style="{ width: pct(neu) + '%' }" />
      <div v-if="neg" class="h-full bg-danger" :style="{ width: pct(neg) + '%' }" />
    </div>
    <ul class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-secondary">
      <li class="inline-flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-success" aria-hidden="true" />Positive <span class="num font-medium text-ink">{{ pct(pos) }}%</span><span v-if="showCounts" class="num text-ink-muted">({{ pos.toLocaleString('en-PK') }})</span></li>
      <li class="inline-flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-neutral" aria-hidden="true" />Neutral <span class="num font-medium text-ink">{{ pct(neu) }}%</span><span v-if="showCounts" class="num text-ink-muted">({{ neu.toLocaleString('en-PK') }})</span></li>
      <li class="inline-flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-danger" aria-hidden="true" />Negative <span class="num font-medium text-ink">{{ pct(neg) }}%</span><span v-if="showCounts" class="num text-ink-muted">({{ neg.toLocaleString('en-PK') }})</span></li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Distribution } from './SentimentBits'

const props = withDefaults(defineProps<{ dist?: Distribution | null; showCounts?: boolean }>(), { showCounts: false })
const pos = computed(() => Number(props.dist?.positive) || 0)
const neu = computed(() => Number(props.dist?.neutral) || 0)
const neg = computed(() => Number(props.dist?.negative) || 0)
const total = computed(() => pos.value + neu.value + neg.value || 1)
const pct = (v: number) => Math.round((v / total.value) * 100)
const aria = computed(() => `Sentiment: ${pct(pos.value)}% positive, ${pct(neu.value)}% neutral, ${pct(neg.value)}% negative`)
</script>
