<template>
  <div v-if="actionsStore.visible" class="flex items-center gap-2">
    <TextInput
      :model-value="actionsStore.searchValue"
      size="sm"
      prefix-icon="search"
      class="!w-44 xl:!w-60"
      :placeholder="actionsStore.searchPlaceholder"
      aria-label="Search"
      @update:model-value="v => actionsStore.triggerSearch(v ?? '')"
    />
    <template v-for="f in actionsStore.filterOptions" :key="f.key">
      <SelectInput
        :model-value="actionsStore.filterValues[f.key] ?? ''"
        size="sm"
        class="!w-auto min-w-[120px]"
        :aria-label="f.label"
        :options="[{ value: '', label: f.label }, ...f.options.map(o => ({ value: o.value, label: o.label }))]"
        @update:model-value="v => onFilterChange(f.key, String(v ?? ''))"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { useTopBarActionsStore } from '@/stores/topBarActions'
import { SelectInput, TextInput } from '@/components/forms'

const actionsStore = useTopBarActionsStore()

function onFilterChange(key: string, value: string) {
  actionsStore.triggerFilter(key, value)
}
</script>
