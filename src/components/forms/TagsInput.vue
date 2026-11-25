<template>
  <MultiSelect v-model="model" creatable :options="suggestions" :placeholder="placeholder" :max="max" :normalize="normalize" empty-text="Type and press Enter" v-bind="$attrs" />
</template>

<script setup lang="ts">
/** Free-text tags (Enter or comma adds, Backspace removes). Optional `suggestions`. */
import MultiSelect from './MultiSelect.vue'

defineOptions({ inheritAttrs: false })
withDefaults(defineProps<{ suggestions?: string[]; placeholder?: string; max?: number; normalize?: (v: string) => string }>(), {
  suggestions: () => [], placeholder: 'Add a tag…', max: undefined, normalize: (v: string) => v.trim(),
})
const model = defineModel<string[]>({ default: () => [] })
</script>
