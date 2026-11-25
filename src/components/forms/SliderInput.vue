<template>
  <div :class="['slider', $attrs.class]">
    <div v-if="showValue || $slots.value" class="flex items-baseline justify-between gap-2 mb-1">
      <slot name="value" :value="model"><span /><output :for="ctl.id.value" class="text-sm font-semibold text-ink num">{{ fmt(model) }}</output></slot>
    </div>
    <div class="slider-box" :class="ctl.disabled.value && 'is-disabled'">
      <div class="slider-track" aria-hidden="true"><div class="slider-fill" :style="{ width: `${pct}%` }" /></div>
      <input
        :id="ctl.id.value"
        type="range"
        class="slider-input"
        :min="min"
        :max="max"
        :step="step"
        :value="model"
        :disabled="ctl.disabled.value"
        :aria-valuetext="fmt(model)"
        :aria-describedby="ctl.describedBy.value"
        :aria-labelledby="ctl.labelledBy.value"
        :aria-label="ctl.labelledBy.value ? undefined : ariaLabel"
        @input="model = Number(($event.target as HTMLInputElement).value)"
        @change="emit('change', model)"
      />
    </div>
    <div v-if="showLimits" class="flex justify-between text-xs text-ink-muted num mt-0.5" aria-hidden="true"><span>{{ fmt(min) }}</span><span>{{ fmt(max) }}</span></div>
  </div>
</template>

<script setup lang="ts">
/** Single-value slider on a native range input (keyboard + screen readers built in). */
import { computed } from 'vue'
import { useControl } from './useControl'

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<{
  min?: number
  max?: number
  step?: number
  showValue?: boolean
  showLimits?: boolean
  format?: (v: number) => string
  ariaLabel?: string
  id?: string
  disabled?: boolean
  describedby?: string
}>(), { min: 0, max: 100, step: 1, format: undefined, ariaLabel: undefined })
const model = defineModel<number>({ default: 0 })
const emit = defineEmits<{ change: [value: number] }>()
const ctl = useControl(props)
const fmt = (v: number) => (props.format ? props.format(v) : Number(v).toLocaleString('en-PK'))
const pct = computed(() => ((Math.min(props.max, Math.max(props.min, Number(model.value))) - props.min) / (props.max - props.min || 1)) * 100)
</script>
