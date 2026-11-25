<template>
  <div class="flex flex-col lg:flex-row lg:items-center gap-3 p-3 sm:p-4 border-b border-line">
    <div v-if="searchable" class="flex-1 min-w-0 lg:max-w-md">
      <TextInput
        :model-value="local"
        type="search"
        prefix-icon="search"
        clearable
        clear-label="Clear search"
        :placeholder="placeholder"
        :aria-label="placeholder"
        @update:model-value="v => onInput(v ?? '')"
        @clear="flush"
        @keydown.enter="flush"
      />
    </div>
    <div class="flex flex-wrap items-center gap-2 [&>select]:flex-1 sm:[&>select]:flex-none sm:[&>select]:w-44">
      <slot />
    </div>
    <div class="lg:ml-auto flex items-center gap-2">
      <span v-if="count !== undefined" class="text-sm text-ink-muted num whitespace-nowrap" aria-live="polite">{{ count.toLocaleString('en-PK') }} {{ noun }}</span>
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue'
import { TextInput } from '@/components/forms'

const props = withDefaults(defineProps<{
  search?: string
  placeholder?: string
  searchable?: boolean
  count?: number
  noun?: string
  debounce?: number
}>(), { search: '', placeholder: 'Search…', searchable: true, noun: 'results', debounce: 350 })

const emit = defineEmits<{ 'update:search': [q: string] }>()

const local = ref(props.search)
watch(() => props.search, v => { if (v !== local.value) local.value = v })
let t: ReturnType<typeof setTimeout> | undefined

function onInput(v: string) {
  local.value = v
  clearTimeout(t)
  t = setTimeout(() => emit('update:search', v.trim()), props.debounce)
}
function flush() {
  clearTimeout(t)
  emit('update:search', local.value.trim())
}
onBeforeUnmount(() => clearTimeout(t))
</script>
