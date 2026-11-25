<template>
  <div v-bind="split.wrapper" :class="ctl.boxClass.value" data-control>
    <span class="control-affix"><AppIcon icon="phone" :class="ctl.iconClass.value" /></span>
    <input
      ref="inputEl"
      v-bind="split.input"
      :id="ctl.id.value"
      :value="text"
      type="tel"
      inputmode="tel"
      class="control-input num"
      :placeholder="placeholder"
      :disabled="ctl.disabled.value"
      :readonly="readonly"
      :required="ctl.required.value"
      :aria-invalid="ctl.invalid.value || undefined"
      :aria-describedby="ctl.describedBy.value"
      autocomplete="tel"
      maxlength="20"
      @input="onInput"
    />
    <span v-if="showValid && valid" class="control-affix is-end text-success-text"><AppIcon icon="check" :class="ctl.iconClass.value" /><span class="sr-only">Valid number</span></span>
  </div>
</template>

<script setup lang="ts">
/**
 * Pakistani mobile number. Formats as you type to 03XX-XXXXXXX and accepts
 * +92 / 92 / 0 prefixes. `modelFormat` controls what v-model stores:
 *  - "formatted" (default) "0300-1234567"
 *  - "digits"   "03001234567"
 *  - "intl"     "+92 300 1234567"
 *  - "raw"      exactly what was typed (no formatting; for forms whose API accepts any format)
 * Validate with `rules.pkMobile()` from useValidation.
 */
import { computed, ref, useAttrs, watch } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { splitAttrs, useControl, type ControlSize } from './useControl'
import { digits, formatPkMobile, isPkMobile, toIntlPkMobile } from './utils'

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<{
  modelFormat?: 'formatted' | 'digits' | 'intl' | 'raw'
  placeholder?: string
  /** Show a green tick when the number is complete and valid. */
  showValid?: boolean
  id?: string
  size?: ControlSize
  invalid?: boolean
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  describedby?: string
}>(), { modelFormat: 'formatted', placeholder: '03XX-XXXXXXX', showValid: true })

const model = defineModel<string | null>({ default: '' })
const ctl = useControl(props)
const attrs = useAttrs()
const split = computed(() => splitAttrs(attrs))
const inputEl = ref<HTMLInputElement | null>(null)

const looksPk = (s: string) => /^(\+?92|0?3)/.test(s.replace(/[\s-]/g, ''))
const initial = (v: string | null | undefined) => (v && looksPk(v) && props.modelFormat !== 'raw' ? formatPkMobile(v) : v ?? '')
const text = ref(initial(model.value))
watch(model, v => { if (out(text.value) !== v) text.value = initial(v) })
const valid = computed(() => isPkMobile(text.value))

function out(display: string): string {
  if (props.modelFormat === 'raw') return display
  if (!display) return ''
  if (props.modelFormat === 'digits') return digits(formatPkMobile(display))
  if (props.modelFormat === 'intl') return isPkMobile(display) ? toIntlPkMobile(display) : display
  return display
}
function onInput(e: Event) {
  const el = e.target as HTMLInputElement
  const raw = el.value
  if (props.modelFormat === 'raw') { text.value = raw; model.value = raw; return }
  // Format progressively, keeping the caret after the same number of digits.
  const caret = el.selectionStart ?? raw.length
  const digitsBefore = digits(raw.slice(0, caret)).length
  const formatted = looksPk(raw) || raw === '' || /^\d/.test(raw) ? formatPkMobile(raw) : raw
  text.value = formatted
  el.value = formatted
  let pos = 0, seen = 0
  while (pos < formatted.length && seen < digitsBefore) { if (/\d/.test(formatted[pos])) seen++; pos++ }
  el.setSelectionRange(pos, pos)
  model.value = out(formatted)
}
defineExpose({ focus: () => inputEl.value?.focus() })
</script>
