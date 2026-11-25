<template>
  <div role="group" :aria-labelledby="ctl.labelledBy.value" :aria-label="ctl.labelledBy.value ? undefined : ariaLabel" :aria-describedby="ctl.describedBy.value" class="flex gap-2" :class="$attrs.class">
    <input
      v-for="i in length"
      :key="i"
      :ref="el => (boxes[i - 1] = el as HTMLInputElement)"
      :id="i === 1 ? ctl.id.value : undefined"
      type="text"
      :inputmode="numeric ? 'numeric' : 'text'"
      :autocomplete="i === 1 ? 'one-time-code' : 'off'"
      maxlength="1"
      class="otp-box form-input num"
      :class="[size !== 'md' && `control-${size}`, ctl.invalid.value && 'is-invalid']"
      :value="chars[i - 1] ?? ''"
      :disabled="ctl.disabled.value"
      :aria-label="`Digit ${i} of ${length}`"
      :aria-invalid="ctl.invalid.value || undefined"
      @input="onInput($event, i - 1)"
      @keydown="onKey($event, i - 1)"
      @paste.prevent="onPaste($event, i - 1)"
      @focus="($event.target as HTMLInputElement).select()"
    />
  </div>
</template>

<script setup lang="ts">
/** One-time code in separate boxes (default 6). Paste fills all boxes; Backspace moves back. Emits `complete`. */
import { computed, ref } from 'vue'
import { useControl, type ControlSize } from './useControl'

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<{
  length?: number
  numeric?: boolean
  size?: ControlSize
  ariaLabel?: string
  id?: string
  invalid?: boolean
  disabled?: boolean
  describedby?: string
}>(), { length: 6, numeric: true, size: 'lg', ariaLabel: 'Verification code' })
const model = defineModel<string>({ default: '' })
const emit = defineEmits<{ complete: [code: string] }>()
const ctl = useControl(props)
const boxes = ref<HTMLInputElement[]>([])
const chars = computed(() => (model.value ?? '').split('').slice(0, props.length))
const valid = (c: string) => (props.numeric ? /\d/.test(c) : /\S/.test(c))

function write(arr: string[]) {
  const v = arr.join('').slice(0, props.length)
  model.value = v
  if (v.length === props.length && arr.every(Boolean)) emit('complete', v)
}
function onInput(e: Event, i: number) {
  const el = e.target as HTMLInputElement
  const c = el.value.slice(-1)
  if (!valid(c)) { el.value = chars.value[i] ?? ''; return }
  const arr = Array.from({ length: props.length }, (_, k) => chars.value[k] ?? '')
  arr[i] = c
  write(arr)
  if (i < props.length - 1) boxes.value[i + 1]?.focus()
}
function onKey(e: KeyboardEvent, i: number) {
  const arr = Array.from({ length: props.length }, (_, k) => chars.value[k] ?? '')
  if (e.key === 'Backspace') {
    e.preventDefault()
    if (arr[i]) { arr[i] = ''; write(arr) } else if (i > 0) { arr[i - 1] = ''; write(arr); boxes.value[i - 1]?.focus() }
  } else if (e.key === 'ArrowLeft' && i > 0) { e.preventDefault(); boxes.value[i - 1]?.focus() }
  else if (e.key === 'ArrowRight' && i < props.length - 1) { e.preventDefault(); boxes.value[i + 1]?.focus() }
}
function onPaste(e: ClipboardEvent, i: number) {
  const text = (e.clipboardData?.getData('text') ?? '').replace(/\s/g, '').split('').filter(valid)
  if (!text.length) return
  const arr = Array.from({ length: props.length }, (_, k) => chars.value[k] ?? '')
  text.forEach((c, k) => { if (i + k < props.length) arr[i + k] = c })
  write(arr)
  boxes.value[Math.min(props.length - 1, i + text.length)]?.focus()
}
</script>

<style scoped>
.otp-box { width: var(--control-h); padding: 0; text-align: center; font-size: 1.125rem; font-weight: 600; }
@media (max-width: 380px) { .otp-box { width: 2.625rem; } }
</style>
