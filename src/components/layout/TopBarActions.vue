<template>
  <div v-if="actionsStore.visible" class="flex items-center gap-2">
    <div class="relative">
      <span class="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none">
        <AppIcon icon="search" class="w-4 h-4" />
      </span>
      <input
        :value="actionsStore.searchValue"
        @input="onSearchInput"
        type="text"
        class="form-input !min-h-[36px] !py-1.5 !text-sm w-44 xl:w-60 !pl-9"
        :placeholder="actionsStore.searchPlaceholder"
        aria-label="Search"
      />
    </div>
    <template v-for="f in actionsStore.filterOptions" :key="f.key">
      <select
        :value="actionsStore.filterValues[f.key] ?? ''"
        @change="onFilterChange(f.key, ($event.target as HTMLSelectElement).value)"
        class="form-select !min-h-[36px] !py-1.5 !text-sm !w-auto min-w-[120px]"
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
