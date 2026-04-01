<template>
  <div class="weekly-calendar">
    <!-- Week Navigation -->
    <div class="week-nav">
      <button @click="prevWeek" class="week-nav-btn" :disabled="isPrevDisabled">
        <AppIcon icon="chevron-left" class="w-4 h-4" />
      </button>
      <div class="week-nav-label">
        <span class="week-nav-range">{{ weekRangeLabel }}</span>
        <button @click="goToThisWeek" class="week-nav-today" v-if="!isCurrentWeek">Today</button>
      </div>
      <button @click="nextWeek" class="week-nav-btn">
        <AppIcon icon="chevron-right" class="w-4 h-4" />
      </button>
    </div>

    <!-- Week Days Row -->
    <div class="week-days">
      <button
        v-for="day in weekDays"
        :key="day.dateStr"
        @click="toggleDay(day)"
        :disabled="day.isPast"
        class="week-day"
        :class="{
          'week-day--today': day.isToday,
          'week-day--selected': isSelected(day.dateStr),
          'week-day--past': day.isPast,
          'week-day--has-bookings': day.bookingCount > 0 && !isSelected(day.dateStr),
        }"
      >
        <span class="week-day-name">{{ day.dayName }}</span>
        <span class="week-day-date">{{ day.dayNum }}</span>
        <span class="week-day-month">{{ day.monthName }}</span>
        <span v-if="day.bookingCount > 0" class="week-day-badge">{{ day.bookingCount }}</span>
      </button>
    </div>

    <!-- Selection hint -->
    <p v-if="selectedDates.length === 0" class="calendar-hint">
      Click on days to select them. You can select multiple days for multi-day events.
    </p>

    <!-- Loading -->
    <div v-if="loadingSlots" class="calendar-loading">
      <div class="spinner"></div>
      <span>Loading availability...</span>
    </div>

    <!-- Selected Days with Timeline -->
    <div v-if="selectedDates.length > 0 && !loadingSlots" class="selected-days">
      <div v-for="dateStr in sortedSelectedDates" :key="dateStr" class="day-slot-panel">
        <div class="day-slot-header">
          <div>
            <h4 class="day-slot-title">{{ formatDayTitle(dateStr) }}</h4>
            <p class="day-slot-subtitle" v-if="dayBookings[dateStr]?.length">
              {{ dayBookings[dateStr].length }} existing booking{{ dayBookings[dateStr].length !== 1 ? 's' : '' }}
            </p>
          </div>
          <button @click="removeDay(dateStr)" class="day-slot-remove" title="Remove day">
            <AppIcon icon="x" class="w-4 h-4" />
          </button>
        </div>

        <!-- Timeline -->
        <div class="timeline">
          <div class="timeline-hours">
            <div v-for="hour in 24" :key="hour - 1" class="timeline-hour-label">
              {{ String(hour - 1).padStart(2, '0') }}:00
            </div>
          </div>
          <div class="timeline-track">
            <!-- Existing bookings -->
            <div
              v-for="(bk, i) in dayBookings[dateStr] || []"
              :key="'bk-' + i"
              class="timeline-block timeline-block--booked"
              :style="blockStyle(bk.start_time, bk.end_time)"
              :title="`${bk.event_name}: ${bk.start_time} - ${bk.end_time}`"
            >
              <span class="timeline-block-label">{{ bk.event_name }}</span>
            </div>
            <!-- Buffer zones -->
            <div
              v-for="(buf, i) in dayBuffers[dateStr] || []"
              :key="'buf-' + i"
              class="timeline-block timeline-block--buffer"
              :style="blockStyle(buf.start, buf.end)"
              title="Buffer zone (1hr)"
            ></div>
            <!-- User selection -->
            <div
              v-if="daySelections[dateStr]?.start_time && daySelections[dateStr]?.end_time"
              class="timeline-block timeline-block--selected"
              :style="blockStyle(daySelections[dateStr].start_time, daySelections[dateStr].end_time)"
            >
              <span class="timeline-block-label">Your booking</span>
            </div>
          </div>
        </div>

        <!-- Time Pickers -->
        <div class="time-pickers">
          <div class="time-picker-field">
            <label class="form-label">Start Time</label>
            <select
              :value="daySelections[dateStr]?.start_time || ''"
              @change="setStartTime(dateStr, ($event.target as HTMLSelectElement).value)"
              class="form-select"
            >
              <option value="">Select start</option>
              <option
                v-for="slot in getAvailableStartTimes(dateStr)"
                :key="slot"
                :value="slot"
                :disabled="isTimeBlocked(dateStr, slot)"
              >
                {{ slot }}{{ isTimeBlocked(dateStr, slot) ? ' (unavailable)' : '' }}
              </option>
            </select>
          </div>
          <div class="time-picker-field">
            <label class="form-label">End Time</label>
            <select
              :value="daySelections[dateStr]?.end_time || ''"
              @change="setEndTime(dateStr, ($event.target as HTMLSelectElement).value)"
              class="form-select"
              :disabled="!daySelections[dateStr]?.start_time"
            >
              <option value="">Select end</option>
              <option
                v-for="slot in getAvailableEndTimes(dateStr)"
                :key="slot"
                :value="slot"
              >
                {{ slot }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Legend -->
    <div class="calendar-legend">
      <div class="legend-item">
        <span class="legend-swatch legend-swatch--booked"></span>
        <span>Booked</span>
      </div>
      <div class="legend-item">
        <span class="legend-swatch legend-swatch--buffer"></span>
        <span>Buffer (1hr)</span>
      </div>
      <div class="legend-item">
        <span class="legend-swatch legend-swatch--selected"></span>
        <span>Your Selection</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import api from '@/lib/axios'
import AppIcon from '@/components/ui/AppIcon.vue'

export interface SelectedDaySlot {
  date: string        // YYYY-MM-DD
  start_time: string  // HH:MM
  end_time: string    // HH:MM
}

interface BookedSlot {
  start_time: string
  end_time: string
  event_name: string
  status: string
}

interface WeekDay {
  date: Date
  dateStr: string
  dayName: string
  dayNum: number
  monthName: string
  isToday: boolean
  isPast: boolean
  bookingCount: number
}

const props = defineProps<{
  venueId: string | number
}>()

const emit = defineEmits<{
  'update:selection': [slots: SelectedDaySlot[]]
}>()

const weekStart = ref(getMonday(new Date()))
const selectedDates = ref<string[]>([])
const dayBookings = ref<Record<string, BookedSlot[]>>({})
const daySelections = ref<Record<string, { start_time: string; end_time: string }>>({})
const monthBookings = ref<any[]>([])
const loadingSlots = ref(false)

// Generate all 24 hourly time slots
const allTimeSlots: string[] = []
for (let h = 0; h < 24; h++) {
  allTimeSlots.push(`${String(h).padStart(2, '0')}:00`)
}

function getMonday(d: Date): Date {
  const dt = new Date(d)
  dt.setHours(0, 0, 0, 0)
  const day = dt.getDay()
  const diff = dt.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(dt.setDate(diff))
}

const today = new Date()
today.setHours(0, 0, 0, 0)

const isCurrentWeek = computed(() => {
  const thisMonday = getMonday(new Date())
  return weekStart.value.getTime() === thisMonday.getTime()
})

const isPrevDisabled = computed(() => {
  const thisMonday = getMonday(new Date())
  return weekStart.value.getTime() <= thisMonday.getTime()
})

const weekDays = computed<WeekDay[]>(() => {
  const days: WeekDay[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart.value)
    d.setDate(d.getDate() + i)
    const dateStr = formatDate(d)
    const bookingsOnDay = monthBookings.value.filter(b => b.date === dateStr)
    days.push({
      date: d,
      dateStr,
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum: d.getDate(),
      monthName: d.toLocaleDateString('en-US', { month: 'short' }),
      isToday: d.toDateString() === today.toDateString(),
      isPast: d < today,
      bookingCount: bookingsOnDay.length,
    })
  }
  return days
})

const weekRangeLabel = computed(() => {
  const end = new Date(weekStart.value)
  end.setDate(end.getDate() + 6)
  const startStr = weekStart.value.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return `${startStr} — ${endStr}`
})

const sortedSelectedDates = computed(() => [...selectedDates.value].sort())

// Buffer zones for each day (1hr before/after each booking)
const dayBuffers = computed<Record<string, { start: string; end: string }[]>>(() => {
  const result: Record<string, { start: string; end: string }[]> = {}
  for (const dateStr of selectedDates.value) {
    const bookings = dayBookings.value[dateStr] || []
    const buffers: { start: string; end: string }[] = []
    for (const bk of bookings) {
      const beforeStart = subtractHour(bk.start_time)
      if (beforeStart >= '00:00') {
        buffers.push({ start: beforeStart, end: bk.start_time })
      }
      const afterEnd = addHour(bk.end_time)
      if (afterEnd <= '24:00') {
        buffers.push({ start: bk.end_time, end: afterEnd })
      }
    }
    result[dateStr] = buffers
  }
  return result
})

function formatDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addHour(time: string): string {
  const [h, m] = time.split(':').map(Number)
  return `${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function subtractHour(time: string): string {
  const [h, m] = time.split(':').map(Number)
  return `${String(h - 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function prevWeek() {
  const d = new Date(weekStart.value)
  d.setDate(d.getDate() - 7)
  weekStart.value = d
}

function nextWeek() {
  const d = new Date(weekStart.value)
  d.setDate(d.getDate() + 7)
  weekStart.value = d
}

function goToThisWeek() {
  weekStart.value = getMonday(new Date())
}

function isSelected(dateStr: string): boolean {
  return selectedDates.value.includes(dateStr)
}

function toggleDay(day: WeekDay) {
  if (day.isPast) return
  const idx = selectedDates.value.indexOf(day.dateStr)
  if (idx >= 0) {
    selectedDates.value.splice(idx, 1)
    delete dayBookings.value[day.dateStr]
    delete daySelections.value[day.dateStr]
  } else {
    selectedDates.value.push(day.dateStr)
    daySelections.value[day.dateStr] = { start_time: '', end_time: '' }
    fetchDayBookings(day.dateStr)
  }
  emitSelection()
}

function removeDay(dateStr: string) {
  const idx = selectedDates.value.indexOf(dateStr)
  if (idx >= 0) {
    selectedDates.value.splice(idx, 1)
    delete dayBookings.value[dateStr]
    delete daySelections.value[dateStr]
    emitSelection()
  }
}

function isTimeBlocked(dateStr: string, time: string): boolean {
  const bookings = dayBookings.value[dateStr] || []
  const buffers = dayBuffers.value[dateStr] || []
  for (const bk of bookings) {
    if (time >= bk.start_time.substring(0, 5) && time < bk.end_time.substring(0, 5)) return true
  }
  for (const buf of buffers) {
    if (time >= buf.start && time < buf.end) return true
  }
  return false
}

function getAvailableStartTimes(dateStr: string): string[] {
  return allTimeSlots.filter(t => t < '23:00')
}

function getAvailableEndTimes(dateStr: string): string[] {
  const startTime = daySelections.value[dateStr]?.start_time
  if (!startTime) return []
  return allTimeSlots
    .filter(t => t > startTime)
    .concat(['24:00'])
    .filter(t => {
      const bookings = dayBookings.value[dateStr] || []
      const buffers = dayBuffers.value[dateStr] || []
      for (const bk of bookings) {
        const bkStart = bk.start_time.substring(0, 5)
        const bkEnd = bk.end_time.substring(0, 5)
        if (startTime < bkEnd && t > bkStart) return false
      }
      for (const buf of buffers) {
        if (startTime < buf.end && t > buf.start) return false
      }
      return true
    })
}

function setStartTime(dateStr: string, value: string) {
  if (!daySelections.value[dateStr]) {
    daySelections.value[dateStr] = { start_time: '', end_time: '' }
  }
  daySelections.value[dateStr].start_time = value
  daySelections.value[dateStr].end_time = ''
  emitSelection()
}

function setEndTime(dateStr: string, value: string) {
  if (!daySelections.value[dateStr]) return
  daySelections.value[dateStr].end_time = value
  emitSelection()
}

function blockStyle(start: string, end: string): Record<string, string> {
  const startMinutes = timeToMinutes(start)
  const endMinutes = timeToMinutes(end)
  const leftPercent = (startMinutes / 1440) * 100
  const widthPercent = ((endMinutes - startMinutes) / 1440) * 100
  return {
    left: `${leftPercent}%`,
    width: `${Math.max(widthPercent, 0.5)}%`,
  }
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + (m || 0)
}

function formatDayTitle(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

function emitSelection() {
  const slots: SelectedDaySlot[] = []
  for (const dateStr of sortedSelectedDates.value) {
    const sel = daySelections.value[dateStr]
    if (sel?.start_time && sel?.end_time) {
      slots.push({ date: dateStr, start_time: sel.start_time, end_time: sel.end_time })
    }
  }
  emit('update:selection', slots)
}

async function fetchMonthAvailability() {
  try {
    const year = weekStart.value.getFullYear()
    const month = weekStart.value.getMonth() + 1
    const response = await api.get(`/venues/${props.venueId}/availability/month`, {
      params: { year, month },
    })
    if (response.data.success) {
      monthBookings.value = response.data.data.booked_dates || []
    }
  } catch {
    // Silently fail
  }
}

async function fetchDayBookings(dateStr: string) {
  try {
    loadingSlots.value = true
    const response = await api.get(`/venues/${props.venueId}/availability`, {
      params: { date: dateStr },
    })
    if (response.data.success) {
      dayBookings.value[dateStr] = response.data.data.booked_slots || []
    }
  } catch {
    dayBookings.value[dateStr] = []
  } finally {
    loadingSlots.value = false
  }
}

watch(weekStart, () => {
  fetchMonthAvailability()
})

onMounted(() => {
  fetchMonthAvailability()
})
</script>

<style scoped>
.weekly-calendar {
  background: var(--color-bg-card);
  border-radius: 1rem;
  padding: 1.25rem;
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-card);
}

/* Week navigation */
.week-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.week-nav-btn {
  width: 36px;
  height: 36px;
  border-radius: 0.75rem;
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.week-nav-btn:hover:not(:disabled) {
  background: var(--color-bg-hover);
  color: var(--color-text);
  border-color: var(--color-primary);
}

.week-nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.week-nav-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.week-nav-range {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text);
}

.week-nav-today {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-primary);
  background: rgba(16, 185, 129, 0.12);
  border: none;
  padding: 0.25rem 0.625rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background 0.15s;
}

.week-nav-today:hover {
  background: rgba(16, 185, 129, 0.24);
}

/* Week days row */
.week-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.375rem;
  margin-bottom: 1rem;
}

.week-day {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.125rem;
  padding: 0.625rem 0.25rem;
  border-radius: 0.75rem;
  border: 2px solid var(--color-border);
  background: var(--color-bg);
  cursor: pointer;
  transition: all 0.15s;
}

.week-day:hover:not(:disabled) {
  border-color: var(--color-primary);
  background: rgba(16, 185, 129, 0.06);
}

.week-day--past {
  opacity: 0.35;
  cursor: not-allowed;
}

.week-day--today {
  border-color: var(--color-primary);
}

.week-day--selected {
  background: rgba(16, 185, 129, 0.12);
  border-color: var(--color-primary);
  box-shadow: 0 0 0 1px var(--color-primary);
}

.week-day--has-bookings {
  background: rgba(16, 185, 129, 0.08);
}

.week-day-name {
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--color-text-muted);
}

.week-day-date {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1;
}

.week-day--selected .week-day-date {
  color: var(--color-primary);
}

.week-day-month {
  font-size: 0.625rem;
  color: var(--color-text-muted);
}

.week-day-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background: var(--color-primary);
  color: #fff;
  font-size: 0.5625rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Hint */
.calendar-hint {
  text-align: center;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  padding: 1.5rem 0;
}

/* Loading */
.calendar-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem;
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Selected days panel */
.selected-days {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.day-slot-panel {
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  padding: 1rem;
  background: var(--color-bg);
  box-shadow: var(--shadow-soft);
}

.day-slot-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.day-slot-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
}

.day-slot-subtitle {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-top: 0.125rem;
}

.day-slot-remove {
  width: 28px;
  height: 28px;
  border-radius: 0.5rem;
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.day-slot-remove:hover {
  background: rgba(249, 112, 102, 0.1);
  color: #F97066;
}

/* Timeline */
.timeline {
  margin-bottom: 0.75rem;
  overflow-x: auto;
}

.timeline-hours {
  display: flex;
  position: relative;
  height: 16px;
  margin-bottom: 2px;
}

.timeline-hour-label {
  flex: 1;
  font-size: 0.5rem;
  color: var(--color-text-muted);
  text-align: left;
  min-width: 0;
  overflow: hidden;
}

.timeline-track {
  position: relative;
  height: 32px;
  background: var(--color-bg-elevated);
  border-radius: 6px;
  border: 1px solid var(--color-border);
  overflow: hidden;
}

.timeline-block {
  position: absolute;
  top: 2px;
  bottom: 2px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  padding: 0 4px;
  overflow: hidden;
  z-index: 1;
}

.timeline-block--booked {
  background: rgba(249, 112, 102, 0.2);
  border: 1px solid rgba(249, 112, 102, 0.4);
  z-index: 2;
}

.timeline-block--buffer {
  background: repeating-linear-gradient(
    45deg,
    rgba(245, 158, 11, 0.14),
    rgba(245, 158, 11, 0.14) 4px,
    rgba(245, 158, 11, 0.26) 4px,
    rgba(245, 158, 11, 0.26) 8px
  );
  border: 1px dashed rgba(245, 158, 11, 0.42);
  z-index: 1;
}

.timeline-block--selected {
  background: rgba(16, 185, 129, 0.25);
  border: 2px solid var(--color-primary);
  z-index: 3;
}

.timeline-block-label {
  font-size: 0.5625rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--color-text);
}

/* Time pickers */
.time-pickers {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.time-picker-field label {
  font-size: 0.75rem;
}

/* Legend */
.calendar-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.legend-swatch {
  width: 14px;
  height: 10px;
  border-radius: 3px;
  flex-shrink: 0;
}

.legend-swatch--booked {
  background: rgba(249, 112, 102, 0.2);
  border: 1px solid rgba(249, 112, 102, 0.4);
}

.legend-swatch--buffer {
  background: repeating-linear-gradient(
    45deg,
    rgba(245, 158, 11, 0.14),
    rgba(245, 158, 11, 0.14) 3px,
    rgba(245, 158, 11, 0.26) 3px,
    rgba(245, 158, 11, 0.26) 6px
  );
  border: 1px dashed rgba(245, 158, 11, 0.42);
}

.legend-swatch--selected {
  background: rgba(16, 185, 129, 0.25);
  border: 2px solid var(--color-primary);
}

@media (max-width: 640px) {
  .week-days {
    gap: 0.25rem;
  }
  .week-day {
    padding: 0.5rem 0.125rem;
  }
  .week-day-date {
    font-size: 1rem;
  }
  .timeline-hour-label {
    font-size: 0;
  }
  .timeline-hour-label:nth-child(4n+1) {
    font-size: 0.5rem;
  }
}
</style>
