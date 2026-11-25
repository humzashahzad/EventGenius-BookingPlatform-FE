<template>
  <div
    role="radiogroup"
    class="segmented"
    :class="[size !== 'md' && `control-${size}`, block && 'flex w-full [&>*]:flex-1']"
    :aria-labelledby="ctl.labelledBy.value"
    :aria-label="ctl.labelledBy.value ? undefined : ariaLabel"
    data-control
    @keydown="onKeydown"
  >
    <button
      v-for="(o, i) in opts"
      :key="String(o.value)"
      ref="btns"
      type="button"
      role="radio"
      :aria-checked="model === o.value"
      :tabindex="(model === o.value || (!hasSelection && i === 0)) ? 0 : -1"
      :disabled="o.disabled || ctl.disabled.value"
      :aria-label="o.iconOnly ? o.label : undefined"
      @click="select(o.value)"
    >
      <AppIcon v-if="o.icon" :icon="o.icon" class="w-4 h-4" />
      <span v-if="!o.iconOnly">{{ o.label }}</span>
      <span v-if="o.count !== undefined" class="tab-count">{{ o.count }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
/** Segmented control (single choice). Same outer height as inputs/buttons of the same size. ←/→ move. */
import { computed, ref } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { useControl, type ControlSize } from './useControl'

export interface SegmentOption { value: unknown; label: string; icon?: string; iconOnly?: boolean; count?: number; disabled?: boolean }
const props = withDefaults(defineProps<{
  options: (SegmentOption | string)[]
  size?: ControlSize
  block?: boolean
  ariaLabel?: string
  id?: string
  disabled?: boolean
}>(), { size: 'md', ariaLabel: undefined })
const model = defineModel<any>()
const ctl = useControl(props)
const btns = ref<HTMLButtonElement[]>([])
const opts = computed<SegmentOption[]>(() => props.options.map(o => (typeof o === 'string' ? { value: o, label: o } : o)))
const hasSelection = computed(() => opts.value.some(o => o.value === model.value))
const emit = defineEmits<{ change: [value: unknown] }>()

function select(v: unknown) {
  if (model.value !== v) { model.value = v; emit('change', v) }
}
function onKeydown(e: KeyboardEvent) {
  const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End']
  if (!keys.includes(e.key)) return
  e.preventDefault()
  const enabled = opts.value.map((o, i) => ({ o, i })).filter(x => !x.o.disabled)
  if (!enabled.length) return
  let pos = enabled.findIndex(x => x.o.value === model.value)
  if (e.key === 'Home') pos = 0
  else if (e.key === 'End') pos = enabled.length - 1
  else pos = (pos + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1) + enabled.length) % enabled.length
  const target = enabled[pos]
  select(target.o.value)
  btns.value[target.i]?.focus()
}
</script>
