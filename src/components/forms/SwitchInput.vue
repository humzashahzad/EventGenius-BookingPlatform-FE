<template>
  <div class="switch-row" :class="[$attrs.class, ctl.disabled.value && 'is-disabled', labelPosition === 'start' && 'flex-row-reverse justify-between']">
    <button
      :id="ctl.id.value"
      type="button"
      role="switch"
      class="switch"
      :class="[size === 'sm' && 'switch-sm', model && 'is-on']"
      :aria-checked="!!model"
      :aria-labelledby="label ? `${ctl.id.value}-lbl` : ctl.labelledBy.value"
      :aria-describedby="[ctl.describedBy.value, description ? `${ctl.id.value}-desc` : ''].filter(Boolean).join(' ') || undefined"
      :disabled="ctl.disabled.value"
      @click="model = !model"
    ><span class="switch-thumb" aria-hidden="true" /></button>
    <span v-if="label || description" class="min-w-0" @click="!ctl.disabled.value && (model = !model)">
      <span :id="`${ctl.id.value}-lbl`" class="block text-sm text-ink cursor-pointer" :class="description && 'font-medium'">{{ label }}</span>
      <span v-if="description" :id="`${ctl.id.value}-desc`" class="block text-xs text-ink-muted mt-0.5">{{ description }}</span>
    </span>
  </div>
</template>

<script setup lang="ts">
/** On/off toggle (role="switch"). Use for settings that apply immediately. */
import { useControl } from './useControl'

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<{
  label?: string
  description?: string
  size?: 'sm' | 'md'
  labelPosition?: 'end' | 'start'
  id?: string
  disabled?: boolean
  describedby?: string
}>(), { label: '', description: '', size: 'md', labelPosition: 'end' })
const model = defineModel<boolean>({ default: false })
const ctl = useControl(props)
</script>

<style scoped>
.switch-row { display: flex; align-items: flex-start; gap: 0.75rem; min-height: var(--control-h-sm); padding: 0.375rem 0; }
.switch-row.is-disabled { opacity: .55; }
.switch {
  --w: 36px; --h: 20px;
  position: relative; flex-shrink: 0; width: var(--w); height: var(--h); margin-top: 0;
  border-radius: 9999px; background: var(--line-strong); transition: background-color .15s ease;
}
.switch-sm { --w: 28px; --h: 16px; }
.switch.is-on { background: var(--brand-strong); }
.switch:disabled { cursor: not-allowed; }
/* 32px hit area around the 20px track */
.switch::before { content: ''; position: absolute; inset: -6px -2px; }
.switch-thumb {
  position: absolute; top: 2px; left: 2px; width: calc(var(--h) - 4px); height: calc(var(--h) - 4px);
  border-radius: 9999px; background: #fff; box-shadow: var(--shadow-xs); transition: transform .15s ease;
}
.switch.is-on .switch-thumb { transform: translateX(calc(var(--w) - var(--h))); }
</style>
