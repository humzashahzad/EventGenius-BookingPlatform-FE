<template>
  <div v-bind="split.wrapper">
    <textarea
      ref="el"
      v-bind="split.input"
      :id="ctl.id.value"
      :value="model ?? ''"
      class="form-textarea"
      :class="[autoGrow && 'resize-none overflow-hidden', ctl.invalid.value && 'is-invalid']"
      :rows="rows"
      :placeholder="placeholder"
      :maxlength="maxlength"
      :disabled="ctl.disabled.value"
      :readonly="readonly"
      :required="ctl.required.value"
      :aria-invalid="ctl.invalid.value || undefined"
      :aria-describedby="ctl.describedBy.value"
      @input="onInput"
    ></textarea>
    <p v-if="counter" class="form-hint num text-right !mt-1" :class="maxlength && (model?.length ?? 0) >= maxlength && '!text-warning-text'" aria-live="polite">
      {{ (model?.length ?? 0).toLocaleString('en-PK') }}<template v-if="maxlength"> / {{ maxlength.toLocaleString('en-PK') }}</template>
    </p>
  </div>
</template>

<script setup lang="ts">
/** Multi-line text. `autoGrow` expands it with the content (up to `maxRows`); `counter` shows length / maxlength. */
import { computed, nextTick, onMounted, ref, useAttrs, watch } from 'vue'
import { splitAttrs, useControl } from './useControl'

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<{
  rows?: number
  maxRows?: number
  autoGrow?: boolean
  counter?: boolean
  maxlength?: number
  placeholder?: string
  id?: string
  invalid?: boolean
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  describedby?: string
}>(), { rows: 4, maxRows: 14, placeholder: '', maxlength: undefined })

const model = defineModel<string | null>({ default: '' })
const ctl = useControl(props)
const attrs = useAttrs()
const split = computed(() => splitAttrs(attrs))
const el = ref<HTMLTextAreaElement | null>(null)

function resize() {
  const t = el.value
  if (!props.autoGrow || !t) return
  t.style.height = 'auto'
  const lh = parseFloat(getComputedStyle(t).lineHeight) || 22
  const max = lh * props.maxRows + 18
  t.style.height = `${Math.min(t.scrollHeight + 2, max)}px`
  t.style.overflowY = t.scrollHeight + 2 > max ? 'auto' : 'hidden'
}
function onInput(e: Event) {
  model.value = (e.target as HTMLTextAreaElement).value
  resize()
}
watch(model, () => nextTick(resize))
onMounted(resize)
defineExpose({ focus: () => el.value?.focus() })
</script>
