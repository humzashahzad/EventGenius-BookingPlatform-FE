<template>
  <ul class="space-y-3">
    <li v-for="a in sorted" :key="a.name" class="min-w-0">
      <div class="flex items-baseline justify-between gap-3 text-sm">
        <span class="text-ink truncate">{{ a.label }}</span>
        <span class="shrink-0 text-xs text-ink-muted num">
          <span class="font-medium" :class="a.positive_pct >= 70 ? 'text-success-text' : a.positive_pct < 50 ? 'text-danger-text' : 'text-warning-text'">{{ a.positive_pct }}% positive</span>
          · {{ a.mentions }} mention{{ a.mentions === 1 ? '' : 's' }}
        </span>
      </div>
      <div class="mt-1.5 flex h-2 rounded-full overflow-hidden bg-surface-sunken gap-[2px]" role="img" :aria-label="`${a.label}: ${a.positive_pct}% positive, ${a.negative_pct ?? 0}% negative`">
        <div class="h-full bg-success" :style="{ width: a.positive_pct + '%' }" />
        <div v-if="a.negative_pct" class="h-full bg-danger ml-auto" :style="{ width: a.negative_pct + '%' }" />
      </div>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Aspect } from './SentimentBits'

const props = withDefaults(defineProps<{ aspects: Aspect[]; limit?: number }>(), { limit: 8 })
const sorted = computed(() => [...(props.aspects || [])].sort((a, b) => b.mentions - a.mentions).slice(0, props.limit))
</script>
