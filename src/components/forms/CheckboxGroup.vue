<template>
  <div role="group" :aria-labelledby="ctl.labelledBy.value" :aria-describedby="ctl.describedBy.value" :class="['grid gap-2', colClass]">
    <template v-for="o in opts" :key="String(o.value)">
      <label v-if="variant === 'cards'" class="choice-card" :class="[isOn(o.value) && 'is-checked', (o.disabled || ctl.disabled.value) && 'is-disabled']">
        <input type="checkbox" class="form-check mt-0.5 shrink-0" :checked="isOn(o.value)" :disabled="o.disabled || ctl.disabled.value" :aria-invalid="ctl.invalid.value || undefined" @change="toggle(o.value)" />
        <span v-if="o.icon" class="text-sm shrink-0" aria-hidden="true">{{ o.icon }}</span>
        <span class="min-w-0 flex-1">
          <span class="block text-sm text-ink" :class="o.description && 'font-medium'">{{ o.label }}</span>
          <span v-if="o.description" class="block text-xs text-ink-muted mt-0.5">{{ o.description }}</span>
        </span>
        <span v-if="o.meta" class="ml-auto pl-2 text-sm font-semibold text-ink num shrink-0">{{ o.meta }}</span>
      </label>
      <CheckboxInput v-else :model-value="isOn(o.value)" :label="o.label" :description="o.description" :disabled="o.disabled || ctl.disabled.value" @update:model-value="toggle(o.value)" />
    </template>
  </div>
</template>

<script setup lang="ts">
/** Several checkboxes bound to one array. `variant="cards"` shows bordered cards (e.g. event types). */
import { computed } from 'vue'
import CheckboxInput from './CheckboxInput.vue'
import { useControl } from './useControl'

/** `meta` is right-aligned text such as a price (“+ PKR 15,000” or “Included”). */
export interface CheckOption { value: unknown; label: string; description?: string; icon?: string; meta?: string; disabled?: boolean }

const props = withDefaults(defineProps<{
  options: (CheckOption | string)[]
  variant?: 'list' | 'cards'
  /** Columns from the `sm` breakpoint up (1 on small phones). */
  columns?: 1 | 2 | 3 | 4
  id?: string
  invalid?: boolean
  disabled?: boolean
  describedby?: string
}>(), { variant: 'list', columns: 1 })
const model = defineModel<any[]>({ default: () => [] })
const ctl = useControl(props)

const opts = computed<CheckOption[]>(() => props.options.map(o => (typeof o === 'string' ? { value: o, label: o } : o)))
const colClass = computed(() => ({ 1: 'grid-cols-1', 2: 'grid-cols-1 min-[420px]:grid-cols-2', 3: 'grid-cols-1 min-[420px]:grid-cols-2 xl:grid-cols-3', 4: 'grid-cols-2 lg:grid-cols-4' })[props.columns])
const isOn = (v: unknown) => model.value.includes(v)
function toggle(v: unknown) {
  // Keep the original order of options in the array the form sends.
  model.value = isOn(v) ? model.value.filter(x => x !== v) : [...model.value, v]
}
</script>
