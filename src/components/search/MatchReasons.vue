<template>
  <ul v-if="shown.length" class="flex flex-wrap gap-1.5 min-w-0 mb-2" aria-label="Why this venue matches">
    <li
      v-for="r in shown"
      :key="r"
      class="inline-flex items-center gap-1 max-w-full min-w-0 rounded-full bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 px-2 py-0.5 text-[0.6875rem] font-semibold leading-4"
      :title="r"
    >
      <AppIcon icon="check" class="w-3 h-3 shrink-0" />
      <span class="truncate">{{ r }}</span>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'

const props = withDefaults(defineProps<{ reasons?: unknown; max?: number }>(), { max: 2 })
const shown = computed(() =>
  (Array.isArray(props.reasons) ? props.reasons : [])
    .filter((r): r is string => typeof r === 'string' && r.trim() !== '')
    .slice(0, props.max),
)
</script>
