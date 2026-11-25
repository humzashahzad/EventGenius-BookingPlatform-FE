<template>
  <div v-if="chips.length" class="flex flex-wrap items-center gap-1.5 min-w-0" role="group" aria-label="What we understood from your search">
    <span class="text-xs font-medium text-ink-muted mr-0.5 inline-flex items-center gap-1">
      <AppIcon icon="list-filter" class="w-3.5 h-3.5" />
      We understood
    </span>
    <span
      v-for="(chip, i) in chips"
      :key="`${chip.type}-${chip.value}-${i}`"
      class="inline-flex items-center max-w-full min-w-0 rounded-md border pl-2.5 pr-0 h-control-sm text-[0.8125rem] font-medium"
      :class="chipClass(chip)"
    >
      <AppIcon v-if="chip.type === 'near_me'" icon="map-pin" class="w-3 h-3 mr-1 shrink-0" />
      <span class="truncate" :title="chip.label">{{ chip.label }}</span>
      <button
        type="button"
        class="chip-x ml-0.5 -my-px -mr-px shrink-0 w-control-sm h-control-sm inline-flex items-center justify-center rounded-r-md"
        :aria-label="`Remove ${chip.label}`"
        @click="emit('remove', chip)"
      >
        <AppIcon icon="x" class="w-3.5 h-3.5" />
      </button>
    </span>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue'
import type { SearchChip } from './types'

defineProps<{ chips: SearchChip[] }>()
const emit = defineEmits<{ (e: 'remove', chip: SearchChip): void }>()

function chipClass(chip: SearchChip) {
  if (chip.type === 'near_me') return 'bg-info-soft border-info-line text-info-text'
  if (chip.type === 'term' || chip.type === 'amenity') return 'bg-surface border-line-strong/40 text-ink-secondary'
  return 'bg-brand-soft border-brand-muted text-brand-text'
}
</script>

<style scoped>
.chip-x:hover { background: rgb(var(--c-ink) / 0.08); }
</style>
