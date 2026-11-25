<template>
  <div class="cal" @keydown="onKeydown">
    <div class="flex items-center justify-between gap-2 mb-2">
      <button type="button" class="btn-icon btn-icon-sm" aria-label="Previous month" :disabled="!canPrev" @click="shiftMonth(-1)"><AppIcon icon="chevron-left" class="w-4 h-4" /></button>
      <p class="text-sm font-semibold text-ink" aria-live="polite">{{ MONTHS_LONG[view.getMonth()] }} {{ view.getFullYear() }}</p>
      <button type="button" class="btn-icon btn-icon-sm" aria-label="Next month" :disabled="!canNext" @click="shiftMonth(1)"><AppIcon icon="chevron-right" class="w-4 h-4" /></button>
    </div>
    <table class="w-full border-collapse" role="grid" :aria-label="`${MONTHS_LONG[view.getMonth()]} ${view.getFullYear()}`">
      <thead>
        <tr><th v-for="w in WEEKDAYS" :key="w" scope="col" class="h-8 text-xs font-medium text-ink-muted"><abbr :title="w" class="no-underline">{{ w }}</abbr></th></tr>
      </thead>
      <tbody>
        <tr v-for="(week, wi) in weeks" :key="wi">
          <td v-for="d in week" :key="d.iso" class="p-0 text-center" :class="rangeClass(d.date)">
            <button
              :ref="el => setRef(d.iso, el as HTMLButtonElement | null)"
              type="button"
              class="day"
              :class="[{
                'is-out': d.out,
                'is-today': d.today,
                'is-selected': isSel(d.date),
              }, d.meta?.tone && `tone-day-${d.meta.tone}`]"
              :tabindex="sameDay(d.date, focus) ? 0 : -1"
              :disabled="d.disabled"
              :aria-pressed="isSel(d.date)"
              :aria-current="d.today ? 'date' : undefined"
              :aria-label="label(d.date) + (d.meta?.label ? `, ${d.meta.label}` : '')"
              :title="d.meta?.label"
              @click="pick(d.date)"
              @mouseenter="emit('hover', d.date)"
              @focus="focus = d.date"
            >{{ d.date.getDate() }}<span v-if="d.meta?.tone" class="day-dot" aria-hidden="true" /></button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
/**
 * Month grid used by DatePicker and DateRangePicker (internal).
 * Keyboard: arrows move a day/week, PageUp/PageDown month, Shift+PageUp/Down
 * year, Home/End start/end of week, Enter/Space pick.
 */
import { computed, nextTick, ref, watch } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { MONTHS_LONG, WEEKDAYS, addDays, addMonths, sameDay, toISODate, type DayMeta } from './utils'

const props = defineProps<{
  selected?: Date | null
  rangeStart?: Date | null
  rangeEnd?: Date | null
  min?: Date | null
  max?: Date | null
  isDisabled?: (iso: string, d: Date) => boolean
  dayMeta?: (iso: string, d: Date) => DayMeta | null | undefined
  initial?: Date | null
}>()
const emit = defineEmits<{ pick: [d: Date]; hover: [d: Date]; month: [ym: string] }>()

const today = new Date(); today.setHours(0, 0, 0, 0)
const focus = ref<Date>(props.initial ?? props.selected ?? props.rangeStart ?? clamp(today))
const view = ref(new Date(focus.value.getFullYear(), focus.value.getMonth(), 1))
const refs = new Map<string, HTMLButtonElement>()
const setRef = (iso: string, el: HTMLButtonElement | null) => { if (el) refs.set(iso, el); else refs.delete(iso) }

function clamp(d: Date) {
  if (props.min && d < props.min) return new Date(props.min)
  if (props.max && d > props.max) return new Date(props.max)
  return d
}
const disabled = (d: Date) => (!!props.min && d < props.min) || (!!props.max && d > props.max) || !!props.isDisabled?.(toISODate(d), d)

const weeks = computed(() => {
  const first = new Date(view.value)
  const offset = (first.getDay() + 6) % 7 // Monday first
  const start = addDays(first, -offset)
  const rows: { date: Date; iso: string; out: boolean; today: boolean; disabled: boolean; meta: DayMeta | null }[][] = []
  for (let w = 0; w < 6; w++) {
    const row = []
    for (let i = 0; i < 7; i++) {
      const date = addDays(start, w * 7 + i)
      const iso = toISODate(date)
      const meta = props.dayMeta?.(iso, date) ?? null
      row.push({ date, iso, out: date.getMonth() !== view.value.getMonth(), today: sameDay(date, today), disabled: disabled(date) || !!meta?.disabled, meta })
    }
    rows.push(row)
  }
  return rows
})
const canPrev = computed(() => !props.min || new Date(view.value.getFullYear(), view.value.getMonth(), 0) >= props.min)
const canNext = computed(() => !props.max || new Date(view.value.getFullYear(), view.value.getMonth() + 1, 1) <= props.max)

const isSel = (d: Date) => sameDay(d, props.selected ?? null) || sameDay(d, props.rangeStart ?? null) || sameDay(d, props.rangeEnd ?? null)
function rangeClass(d: Date) {
  const s = props.rangeStart, e = props.rangeEnd
  if (!s || !e) return ''
  const [a, b] = s <= e ? [s, e] : [e, s]
  if (d > a && d < b) return 'in-range'
  if (sameDay(d, a) && !sameDay(a, b)) return 'range-start'
  if (sameDay(d, b) && !sameDay(a, b)) return 'range-end'
  return ''
}
const label = (d: Date) => d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

function shiftMonth(n: number) {
  view.value = addMonths(view.value, n)
  focus.value = clamp(addMonths(focus.value, n))
}
function pick(d: Date) { if (!disabled(d)) emit('pick', d) }

watch(view, v => emit('month', `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, '0')}`), { immediate: true })
watch(focus, f => {
  if (f.getMonth() !== view.value.getMonth() || f.getFullYear() !== view.value.getFullYear()) view.value = new Date(f.getFullYear(), f.getMonth(), 1)
})
async function focusDay() {
  await nextTick()
  refs.get(toISODate(focus.value))?.focus()
}
function onKeydown(e: KeyboardEvent) {
  if (!(e.target as HTMLElement).classList.contains('day')) return
  const f = focus.value
  const dow = (f.getDay() + 6) % 7
  const moves: Record<string, () => Date> = {
    ArrowLeft: () => addDays(f, -1), ArrowRight: () => addDays(f, 1),
    ArrowUp: () => addDays(f, -7), ArrowDown: () => addDays(f, 7),
    Home: () => addDays(f, -dow), End: () => addDays(f, 6 - dow),
    PageUp: () => addMonths(f, e.shiftKey ? -12 : -1), PageDown: () => addMonths(f, e.shiftKey ? 12 : 1),
  }
  if (moves[e.key]) {
    e.preventDefault()
    focus.value = clamp(moves[e.key]())
    focusDay()
  }
}
defineExpose({ focusDay })
</script>

<style scoped>
.day {
  display: inline-flex; align-items: center; justify-content: center;
  width: 2.25rem; height: 2.25rem; margin: 1px; border-radius: var(--radius-sm);
  font-size: 0.875rem; font-variant-numeric: tabular-nums; color: var(--ink);
}
.day:hover:not(:disabled):not(.is-selected) { background: var(--surface-hover); }
.day.is-out { color: var(--ink-muted); }
.day.is-today { font-weight: 700; box-shadow: inset 0 0 0 1px var(--line-strong); }
.day.is-selected { background: var(--brand-strong); color: var(--on-brand); font-weight: 600; }
.day:disabled { color: var(--ink-muted); opacity: .4; text-decoration: line-through; cursor: not-allowed; }
.day-dot { position: absolute; bottom: 3px; left: 50%; width: 4px; height: 4px; margin-left: -2px; border-radius: 9999px; background: currentColor; }
.tone-day-success:not(.is-selected) { color: var(--success-text); }
.tone-day-warning:not(.is-selected) { color: var(--warning-text); }
.tone-day-danger:not(.is-selected) { color: var(--danger-text); }
.tone-day-info:not(.is-selected) { color: var(--info-text); }
.tone-day-neutral:not(.is-selected) { color: var(--ink-muted); }
.day:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 1px; }
.in-range { background: var(--brand-soft); }
.in-range .day { color: var(--brand-text); }
.day { position: relative; z-index: 1; }
td { position: relative; }
/* Half-cell tint joins the range ends to the band (solid fill, no gradient). */
.range-start::before, .range-end::before { content: ''; position: absolute; top: 1px; bottom: 1px; width: 50%; background: var(--brand-soft); }
.range-start::before { right: 0; }
.range-end::before { left: 0; }
</style>
