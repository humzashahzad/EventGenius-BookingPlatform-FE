<template>
  <div v-bind="split.wrapper" :class="ctl.boxClass.value" data-control>
    <span v-if="prefixIcon || prefix" class="control-affix">
      <AppIcon v-if="prefixIcon" :icon="prefixIcon" :class="ctl.iconClass.value" /><template v-else>{{ prefix }}</template>
    </span>
    <input
      ref="inputEl"
      v-bind="split.input"
      :id="ctl.id.value"
      :value="text"
      type="text"
      role="spinbutton"
      :inputmode="allowDecimal ? 'decimal' : 'numeric'"
      class="control-input num"
      :placeholder="placeholder"
      :disabled="ctl.disabled.value"
      :readonly="readonly"
      :required="ctl.required.value"
      :aria-valuenow="model ?? undefined"
      :aria-valuemin="min"
      :aria-valuemax="max"
      :aria-invalid="ctl.invalid.value || undefined"
      :aria-describedby="ctl.describedBy.value"
      autocomplete="off"
      @input="onInput"
      @blur="onBlur"
      @keydown="onKeydown"
    />
    <span v-if="suffix" class="control-affix is-end">{{ suffix }}</span>
    <template v-if="stepper && !readonly">
      <button type="button" class="control-btn" tabindex="-1" :aria-label="`Decrease by ${step}`" :disabled="ctl.disabled.value || atMin" @click="stepBy(-1)">
        <AppIcon icon="minus" :class="ctl.iconClass.value" />
      </button>
      <button type="button" class="control-btn" tabindex="-1" :aria-label="`Increase by ${step}`" :disabled="ctl.disabled.value || atMax" @click="stepBy(1)">
        <AppIcon icon="plus" :class="ctl.iconClass.value" />
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * Number field with − / + steppers. v-model is a number (or null when empty).
 * Keyboard: ↑/↓ step, PageUp/PageDown ×10, Home/End jump to min/max.
 * Typed values are not clamped unless `clamp` is set (validation stays with the form).
 */
import { computed, ref, useAttrs, watch } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { splitAttrs, useControl, type ControlSize } from './useControl'

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<{
  min?: number
  max?: number
  step?: number
  /** Decimal places allowed when typing (default: from `step`). */
  decimals?: number
  clamp?: boolean
  stepper?: boolean
  placeholder?: string
  prefix?: string
  prefixIcon?: string
  suffix?: string
  id?: string
  size?: ControlSize
  invalid?: boolean
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  describedby?: string
}>(), { min: undefined, max: undefined, step: 1, decimals: undefined, stepper: true, placeholder: '', prefix: '', prefixIcon: '', suffix: '' })

const model = defineModel<number | null>({ default: null })
const ctl = useControl(props)
const attrs = useAttrs()
const split = computed(() => splitAttrs(attrs))
const inputEl = ref<HTMLInputElement | null>(null)

const places = computed(() => props.decimals ?? (String(props.step).split('.')[1]?.length ?? 0))
const allowDecimal = computed(() => places.value > 0)
const text = ref(model.value === null || model.value === undefined ? '' : String(model.value))
watch(model, v => {
  if (v === null || v === undefined || (v as unknown) === '') { if (text.value !== '' && text.value !== '-') text.value = ''; return }
  if (Number(text.value) !== Number(v)) text.value = String(v)
})

const atMin = computed(() => props.min !== undefined && model.value !== null && Number(model.value) <= props.min)
const atMax = computed(() => props.max !== undefined && model.value !== null && Number(model.value) >= props.max)

function parse(s: string): number | null {
  const cleaned = s.replace(/,/g, '').trim()
  if (cleaned === '' || cleaned === '-' || cleaned === '.') return null
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}
function limit(n: number) {
  if (props.min !== undefined && n < props.min) n = props.min
  if (props.max !== undefined && n > props.max) n = props.max
  return Number(n.toFixed(places.value))
}
function onInput(e: Event) {
  const el = e.target as HTMLInputElement
  const re = allowDecimal.value ? /[^\d.,-]/g : /[^\d,-]/g
  const clean = el.value.replace(re, '')
  if (clean !== el.value) el.value = clean
  text.value = clean
  model.value = parse(clean)
}
function onBlur() {
  let n = parse(text.value)
  if (n !== null && props.clamp) n = limit(n)
  model.value = n
  text.value = n === null ? '' : String(n)
}
function stepBy(dir: number, mult = 1) {
  const cur = model.value
  const next = cur === null || cur === undefined ? (props.min ?? 0) : limit(Number(cur) + dir * props.step * mult)
  model.value = next
  text.value = String(next)
}
function onKeydown(e: KeyboardEvent) {
  if (props.readonly || ctl.disabled.value) return
  const map: Record<string, () => void> = {
    ArrowUp: () => stepBy(1),
    ArrowDown: () => stepBy(-1),
    PageUp: () => stepBy(1, 10),
    PageDown: () => stepBy(-1, 10),
    Home: () => { if (props.min !== undefined) { model.value = props.min; text.value = String(props.min) } },
    End: () => { if (props.max !== undefined) { model.value = props.max; text.value = String(props.max) } },
  }
  const fn = map[e.key]
  if (fn && !(e.key === 'Home' && props.min === undefined) && !(e.key === 'End' && props.max === undefined)) {
    e.preventDefault(); fn()
  }
}
defineExpose({ focus: () => inputEl.value?.focus() })
</script>
