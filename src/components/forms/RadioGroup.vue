<template>
  <div role="radiogroup" :aria-labelledby="ctl.labelledBy.value" :aria-describedby="ctl.describedBy.value" :aria-required="ctl.required.value || undefined" :class="inline ? 'flex flex-wrap gap-x-5 gap-y-1' : 'grid gap-1'">
    <label v-for="o in opts" :key="String(o.value)" class="radio-row" :class="(o.disabled || ctl.disabled.value) && 'is-disabled'">
      <input
        type="radio"
        class="form-check radio-dot"
        :name="groupName"
        :checked="model === o.value"
        :disabled="o.disabled || ctl.disabled.value"
        :aria-invalid="ctl.invalid.value || undefined"
        @change="model = o.value"
      />
      <span class="min-w-0">
        <span class="block text-sm text-ink" :class="o.description && 'font-medium'">{{ o.label }}</span>
        <span v-if="o.description" class="block text-xs text-ink-muted mt-0.5">{{ o.description }}</span>
      </span>
    </label>
  </div>
</template>

<script setup lang="ts">
/** Native radio buttons (arrow keys move between them). */
import { computed, useId } from 'vue'
import { useControl } from './useControl'

export interface RadioOption { value: unknown; label: string; description?: string; disabled?: boolean }
const props = withDefaults(defineProps<{
  options: (RadioOption | string)[]
  inline?: boolean
  name?: string
  id?: string
  invalid?: boolean
  disabled?: boolean
  required?: boolean
  describedby?: string
}>(), { name: '' })
const model = defineModel<any>()
const ctl = useControl(props)
const uid = useId()
const groupName = computed(() => props.name || `eg-r-${uid}`)
const opts = computed<RadioOption[]>(() => props.options.map(o => (typeof o === 'string' ? { value: o, label: o } : o)))
</script>

<style scoped>
.radio-row { display: flex; align-items: flex-start; gap: 0.625rem; min-height: var(--control-h-sm); padding: 0.375rem 0; cursor: pointer; }
.radio-row.is-disabled { opacity: .55; cursor: not-allowed; }
.radio-dot { margin-top: 2px; flex-shrink: 0; width: 1.125rem; height: 1.125rem; }
</style>
