<template>
  <div v-bind="split.wrapper" :class="ctl.boxClass.value" data-control>
    <span class="control-affix font-medium">{{ currency }}</span>
    <input
      ref="inputEl"
      v-bind="split.input"
      :id="ctl.id.value"
      :value="focused ? text : display"
      type="text"
      :inputmode="decimals > 0 ? 'decimal' : 'numeric'"
      class="control-input num"
      :placeholder="placeholder"
      :disabled="ctl.disabled.value"
      :readonly="readonly"
      :required="ctl.required.value"
      :aria-invalid="ctl.invalid.value || undefined"
      :aria-describedby="ctl.describedBy.value"
      autocomplete="off"
      @focus="onFocus"
      @blur="onBlur"
      @input="onInput"
    />
    <span v-if="suffix" class="control-affix is-end">{{ suffix }}</span>
  </div>
</template>

<script setup lang="ts">
/**
 * Money field for Pakistani Rupees. Shows "PKR 1,250,000" while idle and the
 * plain number while editing. v-model is always a number (or null).
 */
import { computed, ref, useAttrs } from 'vue'
import { splitAttrs, useControl, type ControlSize } from './useControl'
import { groupNumber } from './utils'

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<{
  currency?: string
  decimals?: number
  /** e.g. "/ head" */
  suffix?: string
  placeholder?: string
  min?: number
  id?: string
  size?: ControlSize
  invalid?: boolean
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  describedby?: string
}>(), { currency: 'PKR', decimals: 0, suffix: '', placeholder: '0', min: undefined })

const model = defineModel<number | null>({ default: null })
const ctl = useControl(props)
const attrs = useAttrs()
const split = computed(() => splitAttrs(attrs))
const inputEl = ref<HTMLInputElement | null>(null)
const focused = ref(false)
const text = ref('')

const display = computed(() => (model.value === null || model.value === undefined || (model.value as unknown) === '' ? '' : groupNumber(Number(model.value), props.decimals)))

function parse(s: string): number | null {
  const c = s.replace(/[^\d.]/g, '')
  if (!c || c === '.') return null
  const n = Number(c)
  return Number.isFinite(n) ? Number(n.toFixed(props.decimals)) : null
}
function onFocus() {
  focused.value = true
  text.value = model.value === null || model.value === undefined ? '' : String(model.value)
}
function onInput(e: Event) {
  const el = e.target as HTMLInputElement
  const re = props.decimals > 0 ? /[^\d.,]/g : /[^\d,]/g
  const clean = el.value.replace(re, '')
  if (clean !== el.value) el.value = clean
  text.value = clean
  model.value = parse(clean)
}
function onBlur() {
  focused.value = false
  model.value = parse(text.value)
}
defineExpose({ focus: () => inputEl.value?.focus() })
</script>
