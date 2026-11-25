<template>
  <div ref="anchor" v-bind="split.wrapper" :class="[ctl.boxClass.value, open && 'is-focused']" data-control>
    <button
      ref="trigger"
      :id="ctl.id.value"
      type="button"
      class="control-trigger"
      aria-haspopup="dialog"
      :aria-expanded="open"
      :aria-controls="open ? dialogId : undefined"
      :aria-invalid="ctl.invalid.value || undefined"
      :aria-describedby="ctl.describedBy.value"
      :aria-labelledby="ctl.labelledBy.value ? `${ctl.labelledBy.value} ${ctl.id.value}` : undefined"
      :aria-label="ctl.labelledBy.value ? undefined : ariaLabel"
      :disabled="ctl.disabled.value || readonly"
      @click="toggle"
      @keydown.down.prevent="show"
    >
      <AppIcon icon="calendar" :class="[ctl.iconClass.value, 'text-ink-muted shrink-0']" />
      <span class="truncate num" :class="!model && 'control-placeholder'">{{ model ? formatDisplayDate(model) : placeholder }}</span>
    </button>
    <button v-if="clearable && model && !ctl.disabled.value && !readonly" type="button" class="control-btn" aria-label="Clear date" @click="setValue('')">
      <AppIcon icon="x" :class="ctl.iconClass.value" />
    </button>
    <input v-if="name" type="hidden" :name="name" :value="model ?? ''" />
  </div>
  <Teleport to="body">
    <div
      v-if="open"
      :id="dialogId"
      ref="panel"
      role="dialog"
      aria-modal="false"
      :aria-label="ariaLabel || 'Choose date'"
      class="popover !mt-0 p-3 z-[55] w-[19rem] max-w-[calc(100vw-16px)]"
      :style="pop.style.value"
      @keydown.esc.prevent.stop="close(true)"
    >
      <CalendarGrid ref="grid" :selected="selectedDate" :min="minDate" :max="maxDate" :is-disabled="isDisabled" @pick="d => setValue(toISODate(d), true)" />
      <div class="flex items-center justify-between gap-2 pt-2 mt-1 border-t border-line">
        <button type="button" class="btn-ghost btn-sm" :disabled="todayDisabled" @click="setValue(toISODate(today), true)">Today</button>
        <button type="button" class="btn-ghost btn-sm" @click="close(true)">Close</button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * Date picker with a calendar popover. v-model is "YYYY-MM-DD" ('' when empty);
 * the field shows Pakistani day-first format ("28 Nov 2026").
 * `min`/`max` are ISO dates; `disabledDates` is a list of ISO dates or a function.
 */
import { computed, nextTick, ref, useAttrs, useId } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import CalendarGrid from './CalendarGrid.vue'
import { splitAttrs, useControl, type ControlSize } from './useControl'
import { usePopover } from './usePopover'
import { formatDisplayDate, parseISODate, toISODate } from './utils'

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<{
  min?: string
  max?: string
  disabledDates?: string[] | ((iso: string, d: Date) => boolean)
  placeholder?: string
  clearable?: boolean
  /** Renders a hidden input so native form posts include the value. */
  name?: string
  ariaLabel?: string
  id?: string
  size?: ControlSize
  invalid?: boolean
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  describedby?: string
}>(), { min: undefined, max: undefined, disabledDates: undefined, placeholder: 'Select date', name: undefined, ariaLabel: 'Choose date' })

const model = defineModel<string | null>({ default: '' })
const emit = defineEmits<{ change: [value: string] }>()
const ctl = useControl(props)
const attrs = useAttrs()
const split = computed(() => splitAttrs(attrs))
const dialogId = `eg-dp-${useId()}`
const anchor = ref<HTMLElement | null>(null)
const panel = ref<HTMLElement | null>(null)
const trigger = ref<HTMLButtonElement | null>(null)
const grid = ref<InstanceType<typeof CalendarGrid> | null>(null)
const open = ref(false)
const pop = usePopover(anchor, panel, open, { onOutside: () => close(false) })

const today = new Date(); today.setHours(0, 0, 0, 0)
const selectedDate = computed(() => parseISODate(model.value))
const minDate = computed(() => parseISODate(props.min))
const maxDate = computed(() => parseISODate(props.max))
const isDisabled = (iso: string, d: Date) => (Array.isArray(props.disabledDates) ? props.disabledDates.includes(iso) : !!props.disabledDates?.(iso, d))
const todayDisabled = computed(() => (!!minDate.value && today < minDate.value) || (!!maxDate.value && today > maxDate.value) || isDisabled(toISODate(today), today))

async function show() {
  if (ctl.disabled.value || props.readonly) return
  open.value = true
  await nextTick()
  grid.value?.focusDay()
}
function close(refocus: boolean) {
  open.value = false
  if (refocus) trigger.value?.focus()
}
function toggle() { open.value ? close(false) : show() }
function setValue(v: string, closeAfter = false) {
  model.value = v
  emit('change', v)
  if (closeAfter) close(true)
}
defineExpose({ focus: () => trigger.value?.focus(), open: show })
</script>
