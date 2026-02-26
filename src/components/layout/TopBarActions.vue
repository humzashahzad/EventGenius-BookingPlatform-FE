<template>
  <div v-if="actionsStore.visible" class="topbar-actions">
    <div class="topbar-search-wrap">
      <svg class="topbar-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
      </svg>
      <input
        :value="actionsStore.searchValue"
        @input="onSearchInput"
        type="text"
        class="topbar-search-input"
        :placeholder="actionsStore.searchPlaceholder"
        aria-label="Search"
      />
    </div>
    <template v-for="f in actionsStore.filterOptions" :key="f.key">
      <select
        :value="actionsStore.filterValues[f.key] ?? ''"
        @change="onFilterChange(f.key, ($event.target as HTMLSelectElement).value)"
        class="topbar-filter-select"
        :aria-label="f.label"
      >
        <option v-for="opt in f.options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useTopBarActionsStore } from '@/stores/topBarActions'

const actionsStore = useTopBarActionsStore()

function onSearchInput(e: Event) {
  const q = (e.target as HTMLInputElement).value
  actionsStore.triggerSearch(q)
}

function onFilterChange(key: string, value: string) {
  actionsStore.triggerFilter(key, value)
}
</script>

<style scoped>
.topbar-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.topbar-search-wrap {
  position: relative;
  width: 180px;
  min-width: 140px;
}

.topbar-search-icon {
  position: absolute;
  left: 0.625rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1rem;
  height: 1rem;
  color: var(--color-text-muted, #94a3b8);
  pointer-events: none;
}

.topbar-search-input {
  width: 100%;
  height: 36px;
  padding: 0 0.75rem 0 2rem;
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  background: var(--color-bg, #f8fafc);
  color: var(--color-text, #0f172a);
  transition: border-color 0.2s;
}

.topbar-search-input::placeholder {
  color: var(--color-text-muted, #94a3b8);
}

.topbar-search-input:focus {
  outline: none;
  border-color: var(--color-primary, #2563eb);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
}

.topbar-filter-select {
  height: 36px;
  padding: 0 2rem 0 0.75rem;
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  background: var(--color-bg, #f8fafc);
  color: var(--color-text, #0f172a);
  cursor: pointer;
  min-width: 0;
}

.topbar-filter-select:focus {
  outline: none;
  border-color: var(--color-primary, #2563eb);
}

:global(html.dark) .topbar-search-input,
:global(html.dark) .topbar-filter-select {
  background: var(--input-bg);
  border-color: var(--border-color);
  color: var(--input-text);
}

:global(html.dark) .topbar-search-input:focus,
:global(html.dark) .topbar-filter-select:focus {
  border-color: var(--input-focus-border);
}
</style>
