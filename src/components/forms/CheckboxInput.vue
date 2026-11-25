<template>
  <label class="check-row" :class="[ctl.disabled.value && 'is-disabled', $attrs.class]">
    <input
      ref="el"
      :id="ctl.id.value"
      type="checkbox"
      class="form-check check-box"
      :checked="checked"
      :value="value"
      :name="name"
      :disabled="ctl.disabled.value"
      :required="ctl.required.value"
      :aria-invalid="ctl.invalid.value || undefined"
      :aria-describedby="ctl.describedBy.value"
      @change="onChange"
    />
    <span v-if="label || description || $slots.default" class="min-w-0">
      <span class="block text-sm text-ink" :class="description && 'font-medium'"><slot>{{ label }}</slot></span>
      <span v-if="description" class="block text-xs text-ink-muted mt-0.5">{{ description }}</span>
    </span>
  </label>
</template>

<script setup lang="ts">
/**
 * Checkbox with label and optional description. v-model can be a boolean, or
 * an array when `value` is set (the value is added/removed).
 */
import { computed, onMounted, ref, watch } from 'vue'
import { useControl } from './useControl'

defineOptions({ inheritAttrs: false })
const props = defineProps<{
  label?: string
  description?: string
  value?: any
  name?: string
  indeterminate?: boolean
  id?: string
  invalid?: boolean
  disabled?: boolean
  required?: boolean
  describedby?: string
}>()
const model = defineModel<boolean | any[] | null>({ default: false })
const ctl = useControl(props)
const el = ref<HTMLInputElement | null>(null)

const checked = computed(() => (Array.isArray(model.value) ? model.value.includes(props.value) : !!model.value))
function onChange(e: Event) {
  const on = (e.target as HTMLInputElement).checked
  if (Array.isArray(model.value)) model.value = on ? [...model.value, props.value] : model.value.filter(v => v !== props.value)
  else model.value = on
}
const syncIndeterminate = () => { if (el.value) el.value.indeterminate = !!props.indeterminate }
watch(() => props.indeterminate, syncIndeterminate)
onMounted(syncIndeterminate)
</script>

<style scoped>
.check-row { display: flex; align-items: flex-start; gap: 0.625rem; min-height: var(--control-h-sm); padding: 0.375rem 0; cursor: pointer; }
.check-row.is-disabled { opacity: .55; cursor: not-allowed; }
.check-box { margin-top: 2px; flex-shrink: 0; width: 1.125rem; height: 1.125rem; }
</style>
