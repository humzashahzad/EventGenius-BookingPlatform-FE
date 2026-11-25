<template>
  <div ref="anchor" v-bind="split.wrapper" :class="[ctl.boxClass.value, open && 'is-focused']" data-control>
    <button
      ref="trigger"
      :id="ctl.id.value"
      type="button"
      class="control-trigger"
      aria-haspopup="listbox"
      :aria-expanded="open"
      :aria-controls="open ? listId : undefined"
      :aria-invalid="ctl.invalid.value || undefined"
      :aria-describedby="ctl.describedBy.value"
      :aria-labelledby="ctl.labelledBy.value ? `${ctl.labelledBy.value} ${ctl.id.value}` : undefined"
      :aria-label="ctl.labelledBy.value ? undefined : ariaLabel"
      :disabled="ctl.disabled.value || readonly"
      @click="toggle"
      @keydown="onTriggerKey"
    >
      <AppIcon icon="clock" :class="[ctl.iconClass.value, 'text-ink-muted shrink-0']" />
      <span class="truncate num" :class="!current && 'control-placeholder'">{{ current ? to12h(current) : placeholder }}</span>
    </button>
    <button v-if="clearable && current && !ctl.disabled.value && !readonly" type="button" class="control-btn" aria-label="Clear time" @click="choose('')">
      <AppIcon icon="x" :class="ctl.iconClass.value" />
    </button>
  </div>
  <Teleport to="body">
    <ul
      v-if="open"
      :id="listId"
      ref="panel"
      role="listbox"
      tabindex="-1"
      class="popover listbox !mt-0 z-[55] w-44 outline-none"
      :style="pop.style.value"
      :aria-label="ariaLabel"
      :aria-activedescendant="`${listId}-${active}`"
      @keydown="onListKey"
    >
      <li
        v-for="(t, i) in slots"
        :id="`${listId}-${i}`"
        :key="t"
        role="option"
        class="listbox-option num"
        :class="i === active && 'is-active'"
        :aria-selected="t === current"
        @mousemove="active = i"
        @click="choose(t)"
      >
        <span class="flex-1">{{ to12h(t) }}</span>
        <AppIcon v-if="t === current" icon="check" class="w-4 h-4" />
      </li>
    </ul>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * Time picker: a list of times (default every 15 minutes) shown in 12-hour
 * format. v-model is "HH:mm" (24-hour), the format the API uses.
 * Pass `options` for a custom list (e.g. hourly + "23:59").
 * Keyboard: ↑/↓ on the closed field steps the time; when open ↑/↓/Home/End move, Enter picks, Esc closes.
 */
import { computed, nextTick, ref, useAttrs, useId } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { splitAttrs, useControl, type ControlSize } from './useControl'
import { usePopover } from './usePopover'
import { minutesToTime, normalizeTime, timeToMinutes, to12h } from './utils'

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<{
  step?: number
  min?: string
  max?: string
  options?: string[]
  placeholder?: string
  clearable?: boolean
  ariaLabel?: string
  id?: string
  size?: ControlSize
  invalid?: boolean
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  describedby?: string
}>(), { step: 15, min: '00:00', max: '23:59', options: undefined, placeholder: 'Select time', ariaLabel: 'Choose time' })

const model = defineModel<string | null>({ default: '' })
const emit = defineEmits<{ change: [value: string] }>()
const ctl = useControl(props)
const attrs = useAttrs()
const split = computed(() => splitAttrs(attrs))
const listId = `eg-tp-${useId()}`
const anchor = ref<HTMLElement | null>(null)
const panel = ref<HTMLElement | null>(null)
const trigger = ref<HTMLButtonElement | null>(null)
const open = ref(false)
const active = ref(0)
const pop = usePopover(anchor, panel, open, { onOutside: () => (open.value = false) })

const current = computed(() => normalizeTime(model.value))
const slots = computed(() => {
  if (props.options?.length) return props.options.map(normalizeTime)
  const out: string[] = []
  for (let m = timeToMinutes(props.min); m <= timeToMinutes(props.max); m += props.step) out.push(minutesToTime(m))
  return out
})

async function show() {
  if (ctl.disabled.value || props.readonly) return
  const idx = slots.value.indexOf(current.value)
  active.value = idx >= 0 ? idx : nearest()
  open.value = true
  await nextTick()
  panel.value?.focus()
  scrollActive()
}
function nearest() {
  if (!current.value) return 0
  const t = timeToMinutes(current.value)
  const i = slots.value.findIndex(s => timeToMinutes(s) >= t)
  return i < 0 ? slots.value.length - 1 : i
}
function close() { open.value = false; trigger.value?.focus() }
function toggle() { open.value ? close() : show() }
function choose(t: string) {
  model.value = t
  emit('change', t)
  if (open.value) close()
}
function scrollActive() {
  nextTick(() => panel.value?.querySelector(`#${CSS.escape(`${listId}-${active.value}`)}`)?.scrollIntoView({ block: 'nearest' }))
}
function onTriggerKey(e: KeyboardEvent) {
  if (e.key === 'ArrowDown' && e.altKey) { e.preventDefault(); show(); return }
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    e.preventDefault()
    const i = slots.value.indexOf(current.value)
    const next = i < 0 ? nearest() : Math.min(slots.value.length - 1, Math.max(0, i + (e.key === 'ArrowDown' ? 1 : -1)))
    choose(slots.value[next])
  }
}
function onListKey(e: KeyboardEvent) {
  const n = slots.value.length
  const k = e.key
  if (k === 'ArrowDown') active.value = Math.min(n - 1, active.value + 1)
  else if (k === 'ArrowUp') active.value = Math.max(0, active.value - 1)
  else if (k === 'Home') active.value = 0
  else if (k === 'End') active.value = n - 1
  else if (k === 'PageDown') active.value = Math.min(n - 1, active.value + 4)
  else if (k === 'PageUp') active.value = Math.max(0, active.value - 4)
  else if (k === 'Enter' || k === ' ') { e.preventDefault(); choose(slots.value[active.value]); return }
  else if (k === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); return }
  else if (k === 'Tab') { open.value = false; return }
  else return
  e.preventDefault()
  scrollActive()
}
defineExpose({ focus: () => trigger.value?.focus() })
</script>
