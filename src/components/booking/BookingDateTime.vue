<template>
  <div class="dt-wrap">
    <!-- Days of a multi-day booking -->
    <div v-if="days.length > 1" class="mb-4">
      <p :id="`${uid}-days`" class="text-sm font-medium text-ink">Your days</p>
      <div class="mt-2 flex flex-wrap gap-2" role="group" :aria-labelledby="`${uid}-days`">
        <div v-for="(d, i) in days" :key="i" class="day-tab" :class="{ 'is-active': i === active, 'is-invalid': showErrors && dayProblem(i) }">
          <button type="button" class="day-tab-main" :aria-pressed="i === active" @click="setActive(i)">
            <span class="font-semibold">Day {{ i + 1 }}</span>
            <span class="text-ink-secondary">{{ d.date ? formatDay(d.date) : 'No date yet' }}</span>
            <span v-if="d.start_time && d.end_time" class="num text-ink-muted">{{ timeRange(d.start_time, d.end_time) }}</span>
          </button>
          <button type="button" class="day-tab-remove" :aria-label="`Remove day ${i + 1}`" @click="removeDay(i)">
            <AppIcon icon="x" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <div class="dt-grid">
      <!-- Calendar -->
      <div ref="calWrap" class="min-w-0">
        <div class="flex items-end justify-between gap-3 mb-3">
          <p :id="`${uid}-cal`" class="text-sm font-medium text-ink">
            {{ days.length > 1 ? `Date for day ${active + 1}` : 'Event date' }}<span class="req" aria-hidden="true">*</span>
          </p>
          <SelectInput
            :model-value="shownMonth"
            :options="monthOptions"
            size="sm"
            aria-label="Jump to month"
            class="w-[9.5rem] shrink-0"
            @update:model-value="jumpTo"
          />
        </div>
        <div class="cal-box" :class="showErrors && !activeDay.date && 'is-invalid'">
          <DatePicker
            inline
            :model-value="activeDay.date"
            :min="firstBookable"
            :day-meta="dayMeta"
            :aria-label="days.length > 1 ? `Date for day ${active + 1}` : 'Event date'"
            :describedby="`${uid}-cal-help`"
            @update:model-value="onPickDate"
            @month-change="onMonthChange"
          />
        </div>
        <p v-if="showErrors && !activeDay.date" :id="`${uid}-cal-help`" class="form-error mt-2 flex items-start gap-1.5" role="alert">
          <AppIcon icon="alert-circle" class="w-3.5 h-3.5 mt-0.5 shrink-0" />Choose a date for your event.
        </p>
        <ul v-else :id="`${uid}-cal-help`" class="cal-legend" aria-label="Calendar key">
          <li><span class="lg-dot bg-warning-text" aria-hidden="true" />Some times booked</li>
          <li v-if="days.length > 1"><span class="lg-dot bg-info-text" aria-hidden="true" />Your other days</li>
          <li><span class="lg-strike" aria-hidden="true">12</span>Not available</li>
          <li><span class="lg-today" aria-hidden="true">12</span>Today</li>
        </ul>
        <p class="form-hint mt-2">Book at least one day ahead. Today can't be booked.</p>
        <p v-if="monthError" class="form-hint mt-1 !text-warning-text">Couldn't load booked days for this month. You can still pick a date; we'll check the times.</p>
      </div>

      <!-- Times for the chosen day -->
      <div class="min-w-0">
        <div class="time-panel">
          <template v-if="!activeDay.date">
            <div class="flex items-start gap-3 text-sm text-ink-secondary">
              <AppIcon icon="calendar" class="w-5 h-5 shrink-0 text-ink-muted" />
              <p>Pick a date on the calendar to see the free times. Opening hours: <span class="font-medium text-ink num">{{ timeRange(toTime(win.start), toTime(win.end)) }}</span>.</p>
            </div>
          </template>
          <template v-else>
            <h3 class="text-base font-semibold text-ink">{{ formatDay(activeDay.date, true) }}</h3>

            <p v-if="dayState === 'loading'" class="mt-1 flex items-center gap-2 text-sm text-ink-muted" role="status">
              <span class="spinner-border spinner-border-sm" aria-hidden="true" />Checking free times…
            </p>
            <p v-else-if="dayState === 'error'" class="mt-1 text-sm text-warning-text" role="status">
              Couldn't check this day's bookings.
              <button type="button" class="link" @click="loadDay(activeDay.date, true)">Try again</button>
            </p>
            <template v-else>
              <p v-if="!activeBooked.length" class="mt-1 flex items-center gap-1.5 text-sm text-success-text" role="status">
                <AppIcon icon="circle-check" class="w-4 h-4 shrink-0" />No other events this day.
              </p>
              <div v-else class="mt-1 text-sm text-ink-secondary" role="status">
                <p>Already booked:
                  <span v-for="(b, i) in activeBooked" :key="i" class="font-medium text-ink num">{{ i ? ', ' : '' }}{{ timeRange(hhmm(b.start_time), hhmm(b.end_time)) }}</span>
                </p>
                <p class="mt-0.5 text-xs text-ink-muted">The venue keeps 1 hour free before and after each event for setup and cleanup.</p>
              </div>
            </template>

            <!-- Quick picks -->
            <div v-if="quick.length" class="mt-4">
              <p :id="`${uid}-quick`" class="text-xs font-medium text-ink-muted">Quick picks</p>
              <div class="mt-1.5 grid grid-cols-2 gap-2" role="group" :aria-labelledby="`${uid}-quick`">
                <button
                  v-for="q in quick"
                  :key="q.key"
                  type="button"
                  class="quick-chip"
                  :class="isQuick(q) && 'is-on'"
                  :aria-pressed="isQuick(q)"
                  :disabled="!q.available || dayState === 'loading'"
                  @click="applyQuick(q)"
                >
                  <span class="font-medium">{{ q.label }}</span>
                  <span class="text-xs num" :class="isQuick(q) ? 'text-brand-text' : 'text-ink-muted'">{{ q.available ? timeRange(q.start, q.end) : 'Taken' }}</span>
                </button>
              </div>
            </div>

            <div class="mt-4 grid grid-cols-2 gap-3">
              <FormField label="Start time" required :error="showErrors || touched.start || conflict ? startError : ''" :id="`${uid}-start`">
                <TimePicker
                  :model-value="activeDay.start_time"
                  :options="starts"
                  :disabled="!starts.length"
                  placeholder="Start"
                  @update:model-value="onStart"
                  @blur="touched.start = true"
                />
              </FormField>
              <FormField label="End time" required :error="showErrors || touched.end ? endError : ''" :id="`${uid}-end`">
                <TimePicker
                  :model-value="activeDay.end_time"
                  :options="ends"
                  :disabled="!activeDay.start_time || !ends.length"
                  placeholder="End"
                  @update:model-value="onEnd"
                  @blur="touched.end = true"
                />
              </FormField>
            </div>

            <p v-if="dayState === 'ready' && !starts.length" class="mt-3 text-sm text-warning-text" role="alert">
              No free times left on this day. Please choose another date.
            </p>

            <!-- Conflict -->
            <div v-if="conflict" class="alert-danger mt-3" role="alert">
              <AppIcon icon="alert-triangle" class="w-5 h-5 shrink-0" />
              <div class="text-sm">
                <p class="alert-title">This time clashes with another event</p>
                <p>Another booking runs {{ timeRange(hhmm(conflict.start_time), hhmm(conflict.end_time)) }}, and the venue needs 1 hour before and after it. Choose a different time or date.</p>
              </div>
            </div>

            <!-- Duration + day timeline -->
            <div class="mt-4">
              <p v-if="duration" class="flex flex-wrap items-baseline gap-x-2 text-sm" aria-live="polite">
                <span class="font-semibold text-ink">{{ duration }}</span>
                <span class="text-ink-secondary num">{{ timeRange(activeDay.start_time, activeDay.end_time) }}</span>
              </p>
              <p v-else class="text-sm text-ink-muted">Choose a start and end time (at least 1 hour).</p>
              <div class="timeline mt-2" aria-hidden="true">
                <span v-for="(r, i) in changeoverBlocks" :key="'c' + i" class="tl-block tl-change" :style="blockStyle(r)" />
                <span v-for="(r, i) in bookedBlocks" :key="'b' + i" class="tl-block tl-booked" :style="blockStyle(r)" />
                <span v-if="selRange" class="tl-block tl-sel" :class="conflict && 'is-bad'" :style="blockStyle(selRange)" />
              </div>
              <div class="mt-1 flex justify-between text-[0.6875rem] text-ink-muted num" aria-hidden="true">
                <span>{{ formatTime(toTime(win.start)) }}</span><span>{{ formatTime(toTime(win.end)) }}</span>
              </div>
              <ul class="tl-legend" aria-hidden="true">
                <li><span class="lg-sw tl-sel" />Your time</li>
                <li v-if="bookedBlocks.length"><span class="lg-sw tl-booked" />Booked</li>
                <li v-if="bookedBlocks.length"><span class="lg-sw tl-change" />Setup and cleanup</li>
              </ul>
            </div>
          </template>
        </div>

        <div class="mt-3">
          <button v-if="canAddDay" type="button" class="btn-ghost btn-sm" @click="addDay">
            <AppIcon icon="plus" class="w-4 h-4" />Add another day
          </button>
          <p v-if="canAddDay && days.length === 1" class="form-hint mt-1">For events over several days, like mehndi and baraat.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Step 1 of the booking flow: a month calendar showing days that already have
 * bookings, then start/end times for the chosen day limited to opening hours
 * and to times that are still free. Supports several days (multi-day events).
 * v-model:days = DaySlot[]. Call `validate()` before moving on.
 */
import { computed, nextTick, reactive, ref, useId, watch } from 'vue'
import api from '@/lib/axios'
import { useLiveRefresh } from '@/composables/useLiveRefresh'
import { isAboutVenue } from '@/lib/liveData'
import AppIcon from '@/components/ui/AppIcon.vue'
import { DatePicker, FormField, SelectInput, TimePicker, MONTHS_LONG, type DayMeta } from '@/components/forms'
import { formatTime } from '@/lib/format'
import {
  type BookedSlot, type DaySlot, type QuickSlot, type Range,
  CHANGEOVER_MIN, blockedRanges, durationLabel, endOptions, findConflict, firstBookableISO,
  formatDay, operatingWindow, quickSlots, startOptions, timeRange, toMin, toTime,
} from './bookingTime'

const props = defineProps<{ venueId: number | string; operatingStart?: string | null; operatingEnd?: string | null }>()
const days = defineModel<DaySlot[]>('days', { required: true })
const active = defineModel<number>('active', { default: 0 })

const uid = `bk-${useId()}`
const firstBookable = firstBookableISO()
const win = computed(() => operatingWindow(props.operatingStart, props.operatingEnd))
const showErrors = ref(false)
const touched = reactive({ start: false, end: false })
const calWrap = ref<HTMLElement | null>(null)

const hhmm = (t: string) => String(t || '').slice(0, 5)

// ── Days ───────────────────────────────────────────────────────────────
if (!days.value.length) days.value = [{ date: '', start_time: '', end_time: '' }]
if (active.value >= Math.max(1, days.value.length)) active.value = 0
const activeDay = computed(() => days.value[active.value] ?? days.value[0])

function patchActive(p: Partial<DaySlot>) {
  days.value = days.value.map((d, i) => (i === active.value ? { ...d, ...p } : d))
}
function setActive(i: number) {
  active.value = i
  touched.start = touched.end = false
  if (days.value[i]?.date) loadDay(days.value[i].date)
}
function addDay() {
  // Note: with v-model the new array only arrives back as a prop on the next render,
  // so work from local copies instead of re-reading days.value.
  const last = days.value[days.value.length - 1]
  const next = [...days.value, { date: '', start_time: last?.start_time || '', end_time: last?.end_time || '' }]
  days.value = next
  active.value = next.length - 1
  touched.start = touched.end = false
  showErrors.value = false
  focusCalendar()
}
function removeDay(i: number) {
  const next = days.value.filter((_, j) => j !== i)
  days.value = next
  if (active.value >= next.length) active.value = next.length - 1
  else if (i < active.value) active.value = active.value - 1
}
// The booking API stores one date per request (extra `slots` days are not saved yet),
// so adding more days stays off until the backend books every day.
const MULTI_DAY_ENABLED = false
const canAddDay = computed(() => MULTI_DAY_ENABLED && days.value.length < 7 && days.value.every(d => d.date && d.start_time && d.end_time))

function onPickDate(iso: string | null) {
  if (!iso) return
  const other = days.value.findIndex((d, i) => i !== active.value && d.date === iso)
  if (other >= 0) { setActive(other); return }
  patchActive({ date: iso })
  loadDay(iso)
}

// ── Month availability ─────────────────────────────────────────────────
const shownMonth = ref('')
const bookedByMonth = reactive<Record<string, Set<string>>>({})
const monthError = ref(false)

async function onMonthChange(ym: string) {
  shownMonth.value = ym
  const [year, month] = ym.split('-').map(Number)
  monthError.value = false
  try {
    const { data } = await api.get(`/venues/${props.venueId}/availability/month`, { params: { year, month } })
    bookedByMonth[ym] = new Set((data?.data?.booked_dates || []).map((d: string) => String(d).slice(0, 10)))
  } catch {
    if (shownMonth.value === ym) monthError.value = true
  }
}
const isBookedDay = (iso: string) => !!bookedByMonth[iso.slice(0, 7)]?.has(iso) || !!dayBooked[iso]?.length

function dayMeta(iso: string): DayMeta | null {
  const idx = days.value.findIndex((d, i) => i !== active.value && d.date === iso)
  if (idx >= 0) return { tone: 'info', label: `Day ${idx + 1} of your booking` }
  if (iso >= firstBookable && isBookedDay(iso)) return { tone: 'warning', label: 'Some times already booked' }
  return null
}

const monthOptions = computed(() => {
  const now = new Date()
  const out = []
  for (let i = 0; i < 18; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    out.push({ value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: `${MONTHS_LONG[d.getMonth()].slice(0, 3)} ${d.getFullYear()}` })
  }
  return out
})

/** Move the inline calendar to another month using its own month buttons. */
function jumpTo(ym: string) {
  if (!ym || !shownMonth.value || ym === shownMonth.value) return
  const [y1, m1] = shownMonth.value.split('-').map(Number)
  const [y2, m2] = ym.split('-').map(Number)
  const diff = (y2 - y1) * 12 + (m2 - m1)
  const btn = calWrap.value?.querySelector<HTMLButtonElement>(`button[aria-label="${diff > 0 ? 'Next' : 'Previous'} month"]`)
  for (let i = 0; i < Math.abs(diff); i++) btn?.click()
}

// ── Day availability ───────────────────────────────────────────────────
const dayBooked = reactive<Record<string, BookedSlot[]>>({})
const dayStatus = reactive<Record<string, 'loading' | 'ready' | 'error'>>({})

async function loadDay(iso: string, force = false, quiet = false) {
  if (!iso || iso < firstBookable) return
  if (!force && dayStatus[iso] === 'ready') return
  // A quiet re-check keeps the current times on screen while it runs.
  const keep = quiet && dayStatus[iso] === 'ready'
  if (!keep) dayStatus[iso] = 'loading'
  try {
    const { data } = await api.get(`/venues/${props.venueId}/availability`, { params: { date: iso } })
    dayBooked[iso] = (data?.data?.booked_slots || []).map((b: BookedSlot) => ({ ...b, start_time: hhmm(b.start_time), end_time: hhmm(b.end_time) }))
    dayStatus[iso] = 'ready'
  } catch {
    if (!keep) dayStatus[iso] = 'error'
  }
}

// Someone else booked (or freed) a time at this venue: re-check the month and the chosen days.
// If the chosen time is now taken, the usual clash message appears under the start time.
useLiveRefresh(['booking', 'venue'], () => {
  if (shownMonth.value) void onMonthChange(shownMonth.value)
  const checked = new Set<string>()
  for (const d of days.value) {
    if (d.date && !checked.has(d.date)) { checked.add(d.date); void loadDay(d.date, true, true) }
  }
  // Other days looked at earlier are re-checked when opened again.
  for (const iso of Object.keys(dayStatus)) if (!checked.has(iso) && dayStatus[iso] === 'ready') delete dayStatus[iso]
}, { debounceMs: 350, match: (_t, d) => isAboutVenue(d, props.venueId) })
// Restored drafts: check every chosen day.
for (const d of days.value) if (d.date) loadDay(d.date)

const dayState = computed(() => dayStatus[activeDay.value.date] ?? 'loading')
const activeBooked = computed(() => dayBooked[activeDay.value.date] || [])
const blocked = computed(() => blockedRanges(activeBooked.value))

// ── Times ──────────────────────────────────────────────────────────────
const starts = computed(() => startOptions(win.value, blocked.value))
const ends = computed(() => endOptions(activeDay.value.start_time, win.value, blocked.value))
const quick = computed(() => quickSlots(win.value, blocked.value))
const conflict = computed(() => findConflict(activeDay.value.start_time, activeDay.value.end_time, activeBooked.value))
const duration = computed(() => durationLabel(activeDay.value.start_time, activeDay.value.end_time))

const isQuick = (q: QuickSlot) => activeDay.value.start_time === q.start && activeDay.value.end_time === q.end
function applyQuick(q: QuickSlot) {
  patchActive({ start_time: q.start, end_time: q.end })
  touched.start = touched.end = true
}
function onStart(t: string | null) {
  const start = t || ''
  touched.start = true
  const cur = activeDay.value.end_time
  const options = endOptions(start, win.value, blocked.value)
  let end = cur && options.includes(cur) ? cur : ''
  if (start && !end && options.length) {
    // Suggest a 4-hour event (or as long as fits); the customer can change it.
    const target = toMin(start) + 240
    end = [...options].reverse().find(o => toMin(o) <= target) ?? options[0]
  }
  patchActive({ start_time: start, end_time: end })
}
function onEnd(t: string | null) {
  touched.end = true
  patchActive({ end_time: t || '' })
}

function timeErrors(d: DaySlot) {
  const out = { date: '', start: '', end: '' }
  if (!d.date) out.date = 'Choose a date for your event.'
  if (!d.start_time) out.start = 'Choose a start time.'
  else if (toMin(d.start_time) < win.value.start || toMin(d.start_time) >= win.value.end) out.start = `The venue opens ${timeRange(toTime(win.value.start), toTime(win.value.end))}.`
  if (!d.end_time) out.end = d.start_time ? 'Choose an end time.' : ''
  else if (d.start_time && toMin(d.end_time) - toMin(d.start_time) < 60) out.end = 'End at least 1 hour after the start.'
  else if (toMin(d.end_time) > win.value.end) out.end = `The venue closes at ${formatTime(toTime(win.value.end))}.`
  return out
}
const startError = computed(() => timeErrors(activeDay.value).start || (conflict.value ? 'This time clashes with another booking.' : ''))
const endError = computed(() => timeErrors(activeDay.value).end)

function dayProblem(i: number) {
  const d = days.value[i]
  const e = timeErrors(d)
  return !!(e.date || e.start || e.end || findConflict(d.start_time, d.end_time, dayBooked[d.date] || []))
}

// ── Timeline ───────────────────────────────────────────────────────────
const span = computed(() => Math.max(1, win.value.end - win.value.start))
function blockStyle(r: Range) {
  const s = Math.max(r.start, win.value.start)
  const e = Math.min(r.end, win.value.end)
  return { left: `${((s - win.value.start) / span.value) * 100}%`, width: `${(Math.max(0, e - s) / span.value) * 100}%` }
}
const bookedBlocks = computed(() => activeBooked.value.map(b => ({ start: toMin(b.start_time), end: toMin(b.end_time) })))
const changeoverBlocks = computed(() => bookedBlocks.value.flatMap(r => [
  { start: r.start - CHANGEOVER_MIN, end: r.start }, { start: r.end, end: r.end + CHANGEOVER_MIN },
]))
const selRange = computed(() => (activeDay.value.start_time && activeDay.value.end_time ? { start: toMin(activeDay.value.start_time), end: toMin(activeDay.value.end_time) } : null))

// ── Validation ─────────────────────────────────────────────────────────
function focusCalendar() {
  nextTick(() => {
    const el = calWrap.value?.querySelector<HTMLElement>('.day[tabindex="0"]')
    el?.focus()
  })
}
/** Shows every problem and focuses the first one. Returns true when all days are ready. */
async function validate(): Promise<boolean> {
  showErrors.value = true
  const bad = days.value.findIndex((_, i) => dayProblem(i))
  if (bad < 0) {
    // Make sure each day's bookings were checked before moving on.
    const pending = days.value.filter(d => dayStatus[d.date] !== 'ready')
    if (!pending.length) return true
    await Promise.all(pending.map(d => loadDay(d.date, true)))
    const again = days.value.findIndex((_, i) => dayProblem(i))
    if (again < 0) return true
    return focusProblem(again)
  }
  return focusProblem(bad)
}
async function focusProblem(bad: number): Promise<boolean> {
  if (bad !== active.value) setActive(bad)
  await nextTick()
  const e = timeErrors(days.value[bad])
  if (e.date) { focusCalendar(); return false }
  const id = e.start || conflict.value ? `${uid}-start` : `${uid}-end`
  document.getElementById(id)?.focus()
  return false
}
watch(() => activeDay.value.date, () => { touched.start = touched.end = false })

defineExpose({ validate })
</script>

<style scoped>
.dt-wrap { container-type: inline-size; }
.dt-grid { display: grid; gap: 1.5rem; }
@container (min-width: 640px) {
  .dt-grid { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); align-items: start; }
}

.cal-box { border: 1px solid var(--line); border-radius: var(--radius-lg); padding: 0.75rem; background: var(--surface); }
.cal-box.is-invalid { border-color: var(--danger-text); }
/* Bigger day cells: 44px touch targets that fill the width. */
.cal-box :deep(.day) { width: 100%; max-width: 3rem; height: 2.75rem; margin: 1px auto; display: flex; }
.cal-box :deep(.day.is-today) { box-shadow: inset 0 0 0 2px var(--brand-text); }
.cal-box :deep(.day.is-today.is-selected) { box-shadow: none; }
.cal-box :deep(.btn-icon-sm) { width: 2.75rem; height: 2.75rem; }
.cal-box :deep(.day-dot) { width: 5px; height: 5px; margin-left: -2.5px; bottom: 4px; }

.cal-legend { display: flex; flex-wrap: wrap; gap: 0.375rem 1rem; margin-top: 0.625rem; font-size: 0.75rem; color: var(--ink-muted); }
.cal-legend li { display: inline-flex; align-items: center; gap: 0.375rem; }
.lg-dot { width: 6px; height: 6px; border-radius: 9999px; }
.lg-strike { font-size: 0.6875rem; text-decoration: line-through; opacity: .6; }
.lg-today { display: inline-flex; align-items: center; justify-content: center; width: 1.25rem; height: 1.25rem; border-radius: var(--radius-xs); box-shadow: inset 0 0 0 2px var(--brand-text); font-size: 0.625rem; font-weight: 700; color: var(--ink); }

.time-panel { border: 1px solid var(--line); border-radius: var(--radius-lg); padding: 1rem; background: var(--surface); }

.quick-chip {
  display: flex; flex-direction: column; align-items: flex-start; justify-content: center; gap: 0.125rem;
  min-height: 44px; padding: 0.375rem 0.75rem; border-radius: var(--radius-md); text-align: left;
  border: 1px solid var(--line-strong); background: var(--surface); font-size: 0.875rem; color: var(--ink);
  transition: border-color .15s ease, background-color .15s ease;
}
.quick-chip:hover:not(:disabled) { background: var(--surface-hover); }
.quick-chip.is-on { border-color: var(--brand-text); background: var(--brand-soft); }
.quick-chip:disabled { opacity: .55; cursor: not-allowed; }
.quick-chip:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }

.timeline { position: relative; height: 1.5rem; border-radius: var(--radius-sm); background: var(--surface-sunken); border: 1px solid var(--line); overflow: hidden; }
.tl-block { position: absolute; top: 2px; bottom: 2px; border-radius: 3px; }
.tl-booked { background: var(--danger-soft); border: 1px solid rgb(var(--c-danger-line)); }
.tl-change { background: var(--warning-soft); border: 1px dashed rgb(var(--c-warning-line)); }
.tl-sel { background: var(--brand-soft); border: 2px solid var(--brand-text); }
.tl-sel.is-bad { border-color: var(--danger-text); }
.tl-legend { display: flex; flex-wrap: wrap; gap: 0.25rem 1rem; margin-top: 0.5rem; font-size: 0.75rem; color: var(--ink-muted); }
.tl-legend li { display: inline-flex; align-items: center; gap: 0.375rem; }
.lg-sw { position: static; display: inline-block; width: 0.875rem; height: 0.625rem; border-radius: 2px; }

.day-tab { display: inline-flex; align-items: stretch; max-width: 100%; border: 1px solid var(--line-strong); border-radius: var(--radius-md); background: var(--surface); }
.day-tab.is-active { border-color: var(--brand-text); background: var(--brand-soft); }
.day-tab.is-invalid { border-color: var(--danger-text); }
.day-tab-main { display: flex; flex-wrap: wrap; align-items: center; gap: 0.125rem 0.5rem; min-height: 44px; padding: 0.375rem 0.25rem 0.375rem 0.75rem; font-size: 0.8125rem; text-align: left; min-width: 0; }
.day-tab-remove { display: inline-flex; align-items: center; justify-content: center; width: 44px; color: var(--ink-muted); border-radius: 0 var(--radius-md) var(--radius-md) 0; }
.day-tab-remove:hover { color: var(--danger-text); background: var(--surface-hover); }
.day-tab-main:focus-visible, .day-tab-remove:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
</style>
