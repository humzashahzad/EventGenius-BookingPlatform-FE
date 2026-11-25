<template>
  <div v-bind="split.wrapper" :class="ctl.boxClass.value" data-control>
    <span v-if="prefixIcon || prefix || $slots.prefix" class="control-affix">
      <slot name="prefix"><AppIcon v-if="prefixIcon" :icon="prefixIcon" :class="ctl.iconClass.value" /><template v-else>{{ prefix }}</template></slot>
    </span>
    <input
      ref="inputEl"
      v-bind="split.input"
      :id="ctl.id.value"
      :value="model ?? ''"
      :type="type"
      class="control-input"
      :placeholder="placeholder"
      :disabled="ctl.disabled.value"
      :readonly="readonly"
      :required="ctl.required.value"
      :maxlength="maxlength"
      :autocomplete="autocomplete"
      :inputmode="inputmode"
      :aria-invalid="ctl.invalid.value || undefined"
      :aria-describedby="ctl.describedBy.value"
      :aria-busy="loading || undefined"
      @input="onInput"
    />
    <span v-if="loading" class="control-affix is-end"><AppIcon icon="loader" :class="[ctl.iconClass.value, 'animate-spin']" /></span>
    <button
      v-if="clearable && model && !ctl.disabled.value && !readonly"
      type="button"
      class="control-btn"
      :aria-label="clearLabel"
      @click="clear"
    ><AppIcon icon="x" :class="ctl.iconClass.value" /></button>
    <span v-if="suffix || suffixIcon || $slots.suffix" class="control-affix is-end">
      <slot name="suffix"><AppIcon v-if="suffixIcon" :icon="suffixIcon" :class="ctl.iconClass.value" /><template v-else>{{ suffix }}</template></slot>
    </span>
    <slot name="actions" />
  </div>
</template>

<script setup lang="ts">
/** Single-line text field (text, email, url, search, tel) with optional clear button and add-ons. */
import { computed, ref, useAttrs } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { splitAttrs, useControl, type ControlSize } from './useControl'

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<{
  type?: 'text' | 'email' | 'url' | 'search' | 'tel'
  placeholder?: string
  id?: string
  size?: ControlSize
  invalid?: boolean
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  loading?: boolean
  clearable?: boolean
  clearLabel?: string
  prefixIcon?: string
  suffixIcon?: string
  /** Short text shown before / after the value, e.g. "https://" or "sq ft". */
  prefix?: string
  suffix?: string
  maxlength?: number
  autocomplete?: string
  inputmode?: 'text' | 'email' | 'url' | 'search' | 'tel' | 'numeric' | 'decimal' | 'none'
  describedby?: string
  /** Trim surrounding spaces on change (input event keeps raw text). */
  trim?: boolean
}>(), { type: 'text', placeholder: '', clearLabel: 'Clear', prefixIcon: '', suffixIcon: '', prefix: '', suffix: '', autocomplete: undefined, inputmode: undefined })

const model = defineModel<string | null>({ default: '' })
const emit = defineEmits<{ clear: [] }>()
const ctl = useControl(props)
const attrs = useAttrs()
const split = computed(() => splitAttrs(attrs))
const inputEl = ref<HTMLInputElement | null>(null)

function onInput(e: Event) {
  model.value = (e.target as HTMLInputElement).value
}
function clear() {
  model.value = ''
  emit('clear')
  inputEl.value?.focus()
}
defineExpose({ focus: () => inputEl.value?.focus(), el: inputEl })
</script>
