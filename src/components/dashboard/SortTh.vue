<template>
  <th :aria-sort="active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'">
    <button type="button" class="sort-btn" :class="align === 'right' ? 'flex-row-reverse' : ''" @click="$emit('sort', field)">
      <slot />
      <AppIcon :icon="active ? (dir === 'asc' ? 'chevron-up' : 'chevron-down') : 'chevron-down'" class="w-3 h-3" :class="active ? 'text-ink' : 'opacity-0 group-hover:opacity-60'" />
    </button>
  </th>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'

const props = withDefaults(defineProps<{ field: string; sortKey: string; dir: "asc" | "desc"; align?: "left" | "right" }>(), { align: "left" })
defineEmits<{ sort: [field: string] }>()
const active = computed(() => props.sortKey === props.field)
</script>

<style scoped>
.sort-btn {
  display: inline-flex; align-items: center; gap: 0.25rem;
  font: inherit; text-transform: inherit; letter-spacing: inherit; color: inherit;
  border-radius: var(--radius-xs);
}
.sort-btn:hover { color: var(--ink); }
.sort-btn:hover :deep(svg) { opacity: 0.6; }
</style>
