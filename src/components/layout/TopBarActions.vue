<template>
  <div v-if="actionsStore.visible" class="flex items-center gap-2">
    <div class="relative">
      <span class="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400 dark:text-warm-500 pointer-events-none">
        <AppIcon icon="search" class="w-4 h-4" />
      </span>
      <input
        :value="actionsStore.searchValue"
        @input="onSearchInput"
        type="text"
        class="w-44 xl:w-56 pl-9 pr-3 py-1.5 text-sm border border-warm-300 dark:border-warm-600 rounded-lg bg-white dark:bg-warm-800 text-warm-800 dark:text-warm-200 placeholder-warm-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        :placeholder="actionsStore.searchPlaceholder"
        aria-label="Search"
      />
    </div>
    <template v-for="f in actionsStore.filterOptions" :key="f.key">
      <select
        :value="actionsStore.filterValues[f.key] ?? ''"
        @change="onFilterChange(f.key, ($event.target as HTMLSelectElement).value)"
        class="py-1.5 pl-3 pr-8 text-sm border border-warm-300 dark:border-warm-600 rounded-lg bg-white dark:bg-warm-800 text-warm-800 dark:text-warm-200 min-w-[110px] focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        :aria-label="f.label"
      >
        <option value="">{{ f.label }}</option>
        <option v-for="opt in f.options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useTopBarActionsStore } from '@/stores/topBarActions'
import AppIcon from '@/components/ui/AppIcon.vue'

const actionsStore = useTopBarActionsStore()

function onSearchInput(e: Event) {
  const q = (e.target as HTMLInputElement).value
  actionsStore.triggerSearch(q)
}

function onFilterChange(key: string, value: string) {
  actionsStore.triggerFilter(key, value)
}
</script>
