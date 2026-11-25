<template>
  <div :class="['slider', $attrs.class]">
    <div v-if="showValue" class="flex items-baseline justify-between gap-2 mb-1 text-sm font-semibold text-ink num" aria-hidden="true">
      <span>{{ fmt(lo) }}</span><span>{{ fmt(hi) }}</span>
    </div>
    <div class="slider-box is-dual" :class="ctl.disabled.value && 'is-disabled'" :role="'group'" :aria-labelledby="ctl.labelledBy.value" :aria-label="ctl.labelledBy.value ? undefined : ariaLabel">
      <div class="slider-track" aria-hidden="true"><div class="slider-fill" :style="{ left: `${pLo}%`, width: `${pHi - pLo}%` }" /></div>
      <input
        :id="ctl.id.value"
        type="range"
        class="slider-input"
        :min="min" :max="max" :step="step" :value="lo"
        :disabled="ctl.disabled.value"
        :aria-label="minLabel"
        :aria-valuetext="fmt(lo)"
        :aria-describedby="ctl.describedBy.value"
        :style="{ zIndex: lo > max - step * 2 ? 4 : 3 }"
        @input="setLo(($event.target as HTMLInputElement))"
        @change="emit('change', [lo, hi])"
      />
      <input
        type="range"
        class="slider-input"
        :min="min" :max="max" :step="step" :value="hi"
        :disabled="ctl.disabled.value"
        :aria-label="maxLabel"
        :aria-valuetext="fmt(hi)"
        :aria-describedby="ctl.describedBy.value"
        @input="setHi(($event.target as HTMLInputElement))"
        @change="emit('change', [lo, hi])"
      />
    </div>
    <div v-if="showLimits" class="flex justify-between text-xs text-ink-muted num mt-0.5" aria-hidden="true"><span>{{ fmt(min) }}</span><span>{{ fmt(max) }}</span></div>
  </div>
</template>

<script setup lang="ts">
/** Two-handle range slider (e.g. budget or guests). v-model is [low, high]. Each handle is a native range input. */
import { computed } from 'vue'
import { useControl } from './useControl'

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<{
  min?: number
  max?: number
  step?: number
  /** Smallest allowed gap between the handles. */
  minGap?: number
  showValue?: boolean
  showLimits?: boolean
  format?: (v: number) => string
  minLabel?: string
  maxLabel?: string
  ariaLabel?: string
  id?: string
  disabled?: boolean
  describedby?: string
}>(), { min: 0, max: 100, step: 1, minGap: 0, format: undefined, minLabel: 'Minimum', maxLabel: 'Maximum', ariaLabel: undefined })
const model = defineModel<[number, number]>({ default: () => [0, 100] })
const emit = defineEmits<{ change: [value: [number, number]] }>()
const ctl = useControl(props)
const fmt = (v: number) => (props.format ? props.format(v) : Number(v).toLocaleString('en-PK'))
const lo = computed(() => Number(model.value?.[0] ?? props.min))
const hi = computed(() => Number(model.value?.[1] ?? props.max))
const p = (v: number) => ((v - props.min) / (props.max - props.min || 1)) * 100
const pLo = computed(() => p(lo.value))
const pHi = computed(() => p(hi.value))
function setLo(el: HTMLInputElement) {
  const v = Math.min(Number(el.value), hi.value - props.minGap)
  el.value = String(v)
  model.value = [v, hi.value]
}
function setHi(el: HTMLInputElement) {
  const v = Math.max(Number(el.value), lo.value + props.minGap)
  el.value = String(v)
  model.value = [lo.value, v]
}
</script>
