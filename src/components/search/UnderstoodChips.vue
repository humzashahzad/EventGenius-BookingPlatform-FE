<template>
  <div v-if="chips.length" class="flex flex-wrap items-center gap-1.5 min-w-0" role="group" aria-label="What we understood from your search">
    <span class="text-xs font-semibold text-warm-500 dark:text-warm-400 mr-0.5 inline-flex items-center gap-1">
      <AppIcon icon="list-filter" class="w-3.5 h-3.5 text-primary-500" />
      We understood
    </span>
    <span
      v-for="(chip, i) in chips"
      :key="`${chip.type}-${chip.value}-${i}`"
      class="inline-flex items-center max-w-full min-w-0 rounded-full border pl-2.5 pr-1 py-0.5 text-xs font-semibold"
      :class="chipClass(chip)"
    >
      <AppIcon v-if="chip.type === 'near_me'" icon="map-pin" class="w-3 h-3 mr-1 shrink-0" />
      <span class="truncate" :title="chip.label">{{ chip.label }}</span>
      <button
        type="button"
        class="ml-1 shrink-0 w-5 h-5 inline-flex items-center justify-center rounded-full hover:bg-black/10 dark:hover:bg-white/10"
        :aria-label="`Remove ${chip.label}`"
        @click="emit('remove', chip)"
      >
        <AppIcon icon="x" class="w-3 h-3" />
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
  if (chip.type === 'near_me') return 'bg-sky-50 border-sky-200 text-sky-700 dark:bg-sky-900/30 dark:border-sky-800 dark:text-sky-300'
  if (chip.type === 'term' || chip.type === 'amenity') return 'bg-warm-50 border-warm-200 text-warm-700 dark:bg-warm-800 dark:border-warm-600 dark:text-warm-200'
  return 'bg-primary-50 border-primary-200 text-primary-700 dark:bg-primary-900/30 dark:border-primary-800 dark:text-primary-300'
}
</script>
