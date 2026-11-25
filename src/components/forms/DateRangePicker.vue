<template>
  <div ref="anchor" v-bind="split.wrapper" :class="[ctl.boxClass.value, open && 'is-focused']" data-control>
    <button
      ref="trigger"
      :id="ctl.id.value"
      type="button"
      class="control-trigger"
      aria-haspopup="dialog"
      :aria-expanded="open"
      :aria-invalid="ctl.invalid.value || undefined"
      :aria-describedby="ctl.describedBy.value"
      :aria-labelledby="ctl.labelledBy.value ? `${ctl.labelledBy.value} ${ctl.id.value}` : undefined"
      :aria-label="ctl.labelledBy.value ? undefined : ariaLabel"
      :disabled="ctl.disabled.value"
      @click="toggle"
      @keydown.down.prevent="show"
    >
      <AppIcon icon="calendar-range" :class="[ctl.iconClass.value, 'text-ink-muted shrink-0']" />
      <span class="truncate num" :class="!start && !end && 'control-placeholder'">{{ display }}</span>
    </button>
    <button v-if="clearable && (start || end) && !ctl.disabled.value" type="button" class="control-btn" aria-label="Clear dates" @click="apply('', '')">
      <AppIcon icon="x" :class="ctl.iconClass.value" />
    </button>
  </div>
  <Teleport to="body">
    <div
      v-if="open"
      ref="panel"
      role="dialog"
      :aria-label="ariaLabel"
      class="popover !mt-0 p-3 z-[55] max-w-[calc(100vw-16px)] flex flex-col sm:flex-row gap-3"
      :style="pop.style.value"
      @keydown.esc.prevent.stop="close(true)"
    >
      <div v-if="presets.length" class="flex sm:flex-col flex-wrap gap-1 sm:w-36 sm:border-r sm:border-line sm:pr-3">
        <button v-for="p in presetList" :key="p.label" type="button" class="btn-ghost btn-sm !justify-start" @click="apply(p.start, p.end, true)">{{ p.label }}</button>
      </div>
      <div class="w-[18rem] max-w-full">
        <p class="text-xs text-ink-muted mb-2" aria-live="polite">{{ pending ? 'Now pick the end date' : 'Pick the start date' }}</p>
        <CalendarGrid
          ref="grid"
          :range-start="pending ?? startDate"
          :range-end="pending ? (hover ?? pending) : endDate"
          :min="minDate"
          :max="maxDate"
          :day-meta="dayMeta"
          @pick="pick"
          @hover="d => (hover = d)"
        />
        <div class="flex items-center justify-between gap-2 pt-2 mt-1 border-t border-line">
          <button type="button" class="btn-ghost btn-sm" @click="apply('', '')">Clear</button>
          <button type="button" class="btn-ghost btn-sm" @click="close(true)">Close</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * Start/end date range in one popover. Bind with v-model:start and v-model:end
 * ("YYYY-MM-DD" strings, '' when empty). Pick the start, then the end (the
 * order is fixed automatically). Optional presets (Today, This month, …).
 */
import { computed, nextTick, ref, useAttrs } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import CalendarGrid from './CalendarGrid.vue'
import { splitAttrs, useControl, type ControlSize } from './useControl'
import { usePopover } from './usePopover'
import { addDays, formatDisplayDate, parseISODate, toISODate, type DayMeta } from './utils'

type Preset = 'today' | 'last7' | 'last30' | 'thisMonth' | 'next7' | 'next30' | 'nextMonth'
defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<{
  min?: string
  max?: string
  presets?: Preset[]
  dayMeta?: (iso: string, d: Date) => DayMeta | null | undefined
  placeholder?: string
  clearable?: boolean
  ariaLabel?: string
  id?: string
  size?: ControlSize
  invalid?: boolean
  disabled?: boolean
  describedby?: string
}>(), { min: undefined, max: undefined, presets: () => [], dayMeta: undefined, placeholder: 'Any dates', clearable: true, ariaLabel: 'Choose date range' })

const start = defineModel<string | null>('start', { default: '' })
const end = defineModel<string | null>('end', { default: '' })
const emit = defineEmits<{ change: [range: { start: string; end: string }] }>()
const ctl = useControl(props)
const attrs = useAttrs()
const split = computed(() => splitAttrs(attrs))
const anchor = ref<HTMLElement | null>(null)
const panel = ref<HTMLElement | null>(null)
const trigger = ref<HTMLButtonElement | null>(null)
const grid = ref<InstanceType<typeof CalendarGrid> | null>(null)
const open = ref(false)
const pending = ref<Date | null>(null)
const hover = ref<Date | null>(null)
const pop = usePopover(anchor, panel, open, { onOutside: () => close(false) })

const startDate = computed(() => parseISODate(start.value))
const endDate = computed(() => parseISODate(end.value))
const minDate = computed(() => parseISODate(props.min))
const maxDate = computed(() => parseISODate(props.max))
const display = computed(() => {
  if (!start.value && !end.value) return props.placeholder
  if (start.value && !end.value) return `From ${formatDisplayDate(start.value)}`
  if (!start.value && end.value) return `Until ${formatDisplayDate(end.value)}`
  if (start.value === end.value) return formatDisplayDate(start.value)
  return `${formatDisplayDate(start.value)} – ${formatDisplayDate(end.value)}`
})

const today = new Date(); today.setHours(0, 0, 0, 0)
const presetList = computed(() => {
  const iso = toISODate
  const first = new Date(today.getFullYear(), today.getMonth(), 1)
  const last = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  const all: Record<Preset, { label: string; start: string; end: string }> = {
    today: { label: 'Today', start: iso(today), end: iso(today) },
    last7: { label: 'Last 7 days', start: iso(addDays(today, -6)), end: iso(today) },
    last30: { label: 'Last 30 days', start: iso(addDays(today, -29)), end: iso(today) },
    thisMonth: { label: 'This month', start: iso(first), end: iso(last) },
    next7: { label: 'Next 7 days', start: iso(today), end: iso(addDays(today, 6)) },
    next30: { label: 'Next 30 days', start: iso(today), end: iso(addDays(today, 29)) },
    nextMonth: { label: 'Next month', start: iso(new Date(today.getFullYear(), today.getMonth() + 1, 1)), end: iso(new Date(today.getFullYear(), today.getMonth() + 2, 0)) },
  }
  return props.presets.map(p => all[p])
})

async function show() {
  if (ctl.disabled.value) return
  pending.value = null
  open.value = true
  await nextTick()
  grid.value?.focusDay()
}
function close(refocus: boolean) {
  open.value = false
  pending.value = null
  if (refocus) trigger.value?.focus()
}
function toggle() { open.value ? close(false) : show() }
function pick(d: Date) {
  if (!pending.value) { pending.value = d; hover.value = d; return }
  const [a, b] = pending.value <= d ? [pending.value, d] : [d, pending.value]
  apply(toISODate(a), toISODate(b), true)
}
function apply(s: string, e: string, closeAfter = false) {
  start.value = s
  end.value = e
  pending.value = null
  emit('change', { start: s, end: e })
  if (closeAfter) close(true)
}
defineExpose({ focus: () => trigger.value?.focus() })
</script>
