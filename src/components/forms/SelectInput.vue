<template>
  <select
    ref="el"
    :id="ctl.id.value"
    class="form-select"
    :class="[ctl.size.value !== 'md' && `control-${ctl.size.value}`, ctl.invalid.value && 'is-invalid']"
    :value="selectedKey"
    :disabled="ctl.disabled.value"
    :required="ctl.required.value"
    :aria-invalid="ctl.invalid.value || undefined"
    :aria-describedby="ctl.describedBy.value"
    data-control
    @change="onChange"
  >
    <option v-if="placeholder" :value="EMPTY" :disabled="placeholderDisabled">{{ placeholder }}</option>
    <template v-if="normalized.length">
      <template v-for="g in grouped" :key="g.label">
        <optgroup v-if="g.label" :label="g.label">
          <option v-for="o in g.options" :key="o.key" :value="o.key" :disabled="o.disabled">{{ o.label }}</option>
        </optgroup>
        <template v-else>
          <option v-for="o in g.options" :key="o.key" :value="o.key" :disabled="o.disabled">{{ o.label }}</option>
        </template>
      </template>
    </template>
    <slot v-else />
  </select>
</template>

<script setup lang="ts">
/**
 * Native select on the shared size scale. Pass `options` (strings or
 * { value, label, disabled, group }) — values keep their type (numbers stay
 * numbers, null stays null). Without `options`, put <option>s in the slot
 * and v-model receives the option's string value.
 */
import { computed, ref } from 'vue'
import { useControl, type ControlSize } from './useControl'

export interface SelectOption { value: unknown; label: string; disabled?: boolean; group?: string }

const props = withDefaults(defineProps<{
  options?: (SelectOption | string | number)[]
  placeholder?: string
  /** Make the placeholder option unselectable once a value is chosen. */
  placeholderDisabled?: boolean
  /** Value emitted when the placeholder is chosen. */
  emptyValue?: unknown
  id?: string
  size?: ControlSize
  invalid?: boolean
  disabled?: boolean
  required?: boolean
  describedby?: string
}>(), { options: () => [], placeholder: '', emptyValue: () => '' })

const model = defineModel<any>()
const ctl = useControl(props)
const el = ref<HTMLSelectElement | null>(null)
const EMPTY = '__eg_empty__'

const normalized = computed(() => props.options.map((o, i) => {
  const opt: SelectOption = typeof o === 'object' ? o : { value: o, label: String(o) }
  return { ...opt, key: `o${i}` }
}))
const grouped = computed(() => {
  const groups: { label: string; options: typeof normalized.value }[] = []
  for (const o of normalized.value) {
    const label = o.group ?? ''
    let g = groups.find(x => x.label === label)
    if (!g) groups.push((g = { label, options: [] }))
    g.options.push(o)
  }
  return groups
})
const selectedKey = computed(() => {
  if (!normalized.value.length) return model.value ?? (props.placeholder ? EMPTY : '')
  const hit = normalized.value.find(o => o.value === model.value || (o.value !== null && model.value !== null && String(o.value) === String(model.value) && typeof model.value !== 'object'))
  return hit ? hit.key : EMPTY
})
function onChange(e: Event) {
  const key = (e.target as HTMLSelectElement).value
  if (key === EMPTY) { model.value = props.emptyValue; return }
  if (!normalized.value.length) { model.value = key; return }
  model.value = normalized.value.find(o => o.key === key)?.value
}
defineExpose({ focus: () => el.value?.focus() })
</script>
