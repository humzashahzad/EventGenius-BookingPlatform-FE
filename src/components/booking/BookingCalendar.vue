<template>
  <div class="booking-calendar">
    <!-- Calendar Header -->
    <div class="calendar-header">
      <button @click="previousMonth" class="calendar-nav-btn">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
      </button>
      <h3 class="calendar-title">{{ currentMonthYear }}</h3>
      <button @click="nextMonth" class="calendar-nav-btn">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </button>
    </div>

    <!-- Calendar Grid -->
    <div class="calendar-grid">
      <!-- Day headers -->
      <div v-for="day in daysOfWeek" :key="day" class="calendar-day-header">
        {{ day }}
      </div>

      <!-- Calendar days -->
      <button
        v-for="(day, index) in calendarDays"
        :key="index"
        @click="selectDate(day)"
        :disabled="!day.isCurrentMonth || day.isPast || day.isFullyBooked"
        :class="{
          'calendar-day-disabled': !day.isCurrentMonth,
          'calendar-day-past': day.isPast,
          'calendar-day-today': day.isToday,
          'calendar-day-selected': day.isSelected,
          'calendar-day-has-bookings': day.hasBookings,
          'calendar-day-fully-booked': day.isFullyBooked,
        }"
        class="calendar-day"
      >
        <span class="calendar-day-number">{{ day.date.getDate() }}</span>
        <span v-if="day.bookingCount > 0" class="calendar-day-badge">
          {{ day.bookingCount }}
        </span>
      </button>
    </div>

    <!-- Color Legend -->
    <div class="calendar-legend">
      <div class="legend-item">
        <span class="legend-dot legend-dot-today"></span>
        <span>Today</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot legend-dot-has-bookings"></span>
        <span>Has Bookings</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot legend-dot-fully-booked"></span>
        <span>Fully Booked</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot legend-dot-selected"></span>
        <span>Selected</span>
      </div>
    </div>

    <!-- Selected Date Info -->
    <div v-if="selectedDate" class="selected-date-info">
      <h4 class="selected-date-title">
        {{ formatSelectedDate(selectedDate) }}
      </h4>

      <!-- Loading -->
      <div v-if="loadingSlots" class="flex items-center justify-center py-8">
        <div class="spinner"></div>
      </div>

      <!-- Time Slots -->
      <div v-else-if="availableSlots.length > 0" class="time-slots">
        <p class="text-sm font-medium text-surface-700 mb-3">Select a time slot:</p>
        <div class="time-slots-grid">
          <button
            v-for="slot in availableSlots"
            :key="slot.time"
            @click="selectSlot(slot)"
            :disabled="slot.isBooked"
            :class="{
              'time-slot-booked': slot.isBooked,
              'time-slot-selected': selectedSlot === slot.time,
            }"
            class="time-slot"
          >
            {{ slot.time }}
            <span v-if="slot.isBooked" class="time-slot-status">&#10005; Booked</span>
          </button>
        </div>
      </div>

      <!-- Booked Slots Info -->
      <div v-if="bookedSlots.length > 0" class="booked-slots-info">
        <p class="text-sm font-semibold text-surface-700 mb-2">Booked slots on this day:</p>
        <div class="booked-slots-list">
          <div v-for="booking in bookedSlots" :key="booking.start_time" class="booked-slot-item">
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span class="text-sm font-medium text-surface-700">
                {{ booking.start_time }} - {{ booking.end_time }}
              </span>
            </div>
            <p class="text-xs text-surface-500 ml-6">{{ booking.event_name }}</p>
          </div>
        </div>
      </div>

      <!-- No slots available -->
      <div v-if="!loadingSlots && availableSlots.length === 0 && bookedSlots.length === 0" class="empty-state">
        <svg class="w-12 h-12 text-surface-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
        <p class="text-sm text-surface-500">No bookings on this day</p>
      </div>
    </div>

    <!-- Proceed button -->
    <div v-if="selectedSlot" class="calendar-footer">
      <button @click="proceedToBooking" class="btn btn-primary btn-lg w-full">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
        Proceed with {{ formatSelectedDate(selectedDate!) }} at {{ selectedSlot }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import api from '@/lib/axios'

interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isPast: boolean
  isToday: boolean
  isSelected: boolean
  hasBookings: boolean
  isFullyBooked: boolean
  bookingCount: number
}

interface TimeSlot {
  time: string
  isBooked: boolean
}

interface BookedSlot {
  start_time: string
  end_time: string
  event_name: string
  status: string
}

const props = defineProps<{
  venueId: string | number
}>()

const emit = defineEmits<{
  'select': [date: Date, time: string]
}>()

const currentDate = ref(new Date())
const selectedDate = ref<Date | null>(null)
const selectedSlot = ref<string | null>(null)
const monthBookings = ref<any[]>([])
const bookedSlots = ref<BookedSlot[]>([])
const loadingMonth = ref(false)
const loadingSlots = ref(false)

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Generate time slots from 9 AM to 9 PM
const timeSlots = [
  '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00',
  '17:00', '18:00', '19:00', '20:00', '21:00'
]

const currentMonthYear = computed(() => {
  return currentDate.value.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
})

const calendarDays = computed<CalendarDay[]>(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const days: CalendarDay[] = []

  // Previous month days
  const firstDayOfWeek = firstDay.getDay()
  const prevMonthLastDay = new Date(year, month, 0).getDate()
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, prevMonthLastDay - i)
    days.push({
      date,
      isCurrentMonth: false,
      isPast: date < today,
      isToday: false,
      isSelected: false,
      hasBookings: false,
      isFullyBooked: false,
      bookingCount: 0,
    })
  }

  // Current month days
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const date = new Date(year, month, i)
    const dateStr = date.toISOString().split('T')[0]
    const bookingsOnDay = monthBookings.value.filter(b => b.date === dateStr)

    days.push({
      date,
      isCurrentMonth: true,
      isPast: date < today,
      isToday: date.toDateString() === today.toDateString(),
      isSelected: selectedDate.value?.toDateString() === date.toDateString(),
      hasBookings: bookingsOnDay.length > 0,
      isFullyBooked: bookingsOnDay.length >= 3, // Assume max 3 bookings per day
      bookingCount: bookingsOnDay.length,
    })
  }

  // Next month days
  const remainingDays = 42 - days.length // 6 rows * 7 days
  for (let i = 1; i <= remainingDays; i++) {
    const date = new Date(year, month + 1, i)
    days.push({
      date,
      isCurrentMonth: false,
      isPast: date < today,
      isToday: false,
      isSelected: false,
      hasBookings: false,
      isFullyBooked: false,
      bookingCount: 0,
    })
  }

  return days
})

const availableSlots = computed<TimeSlot[]>(() => {
  if (!selectedDate.value) return []

  return timeSlots.map(time => {
    const isBooked = bookedSlots.value.some(booking => {
      const bookingStart = booking.start_time.substring(0, 5)
      const bookingEnd = booking.end_time.substring(0, 5)
      return time >= bookingStart && time < bookingEnd
    })

    return {
      time,
      isBooked,
    }
  })
})

function previousMonth() {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
}

function nextMonth() {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
}

async function selectDate(day: CalendarDay) {
  if (!day.isCurrentMonth || day.isPast || day.isFullyBooked) return

  selectedDate.value = day.date
  selectedSlot.value = null
  await fetchDayBookings(day.date)
}

function selectSlot(slot: TimeSlot) {
  if (slot.isBooked) return
  selectedSlot.value = slot.time
}

function proceedToBooking() {
  if (selectedDate.value && selectedSlot.value) {
    emit('select', selectedDate.value, selectedSlot.value)
  }
}

function formatSelectedDate(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

async function fetchMonthAvailability() {
  try {
    loadingMonth.value = true
    const year = currentDate.value.getFullYear()
    const month = currentDate.value.getMonth() + 1

    const response = await api.get(`/venues/${props.venueId}/availability/month`, {
      params: { year, month }
    })

    if (response.data.success) {
      monthBookings.value = response.data.data.booked_dates || []
    }
  } catch (error) {
    console.error('Failed to fetch month availability:', error)
  } finally {
    loadingMonth.value = false
  }
}

async function fetchDayBookings(date: Date) {
  try {
    loadingSlots.value = true
    const dateStr = date.toISOString().split('T')[0]

    const response = await api.get(`/venues/${props.venueId}/availability`, {
      params: { date: dateStr }
    })

    if (response.data.success) {
      bookedSlots.value = response.data.data.booked_slots || []
    }
  } catch (error) {
    console.error('Failed to fetch day bookings:', error)
    bookedSlots.value = []
  } finally {
    loadingSlots.value = false
  }
}

watch(currentDate, () => {
  fetchMonthAvailability()
})

onMounted(() => {
  fetchMonthAvailability()
})
</script>

<style scoped>
.booking-calendar {
  background: var(--color-bg-card, white);
  border-radius: 12px;
  padding: 24px;
  border: 1px solid var(--color-border, #e5e7eb);
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.calendar-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary, #1f2937);
}

.calendar-nav-btn {
  padding: 8px;
  border-radius: 8px;
  background: transparent;
  color: var(--color-text-secondary, #6b7280);
  border: 1px solid var(--color-border, #e5e7eb);
  cursor: pointer;
  transition: all 0.15s ease;
}

.calendar-nav-btn:hover {
  background: var(--color-bg-elevated, #f9fafb);
  color: var(--color-text-primary, #1f2937);
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}

.calendar-day-header {
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary, #6b7280);
  padding: 8px;
  text-transform: uppercase;
}

.calendar-day {
  position: relative;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid var(--color-border, #e5e7eb);
  background: var(--color-bg, white);
  cursor: pointer;
  transition: all 0.15s ease;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary, #1f2937);
}

.calendar-day:hover:not(:disabled) {
  background: var(--color-bg-elevated, #f9fafb);
  border-color: var(--color-primary-300);
}

.calendar-day-disabled {
  color: var(--color-text-tertiary, #9ca3af);
  background: transparent;
  border-color: transparent;
}

.calendar-day-past {
  opacity: 0.5;
  cursor: not-allowed;
}

.calendar-day-today {
  border-color: var(--color-primary-500);
  background: var(--color-primary-50, #eff6ff);
}

.calendar-day-selected {
  background: var(--color-primary-600);
  color: white;
  border-color: var(--color-primary-600);
}

.calendar-day-has-bookings {
  background: #fef3c7;
  border-color: #fbbf24;
}

.calendar-day-fully-booked {
  background: #fee2e2;
  border-color: #ef4444;
  cursor: not-allowed;
  opacity: 0.7;
}

.calendar-day-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--color-primary-600);
  color: white;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.selected-date-info {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--color-border, #e5e7eb);
}

.selected-date-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary, #1f2937);
  margin-bottom: 16px;
}

.time-slots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 8px;
}

.time-slot {
  padding: 10px 16px;
  border-radius: 8px;
  border: 1px solid var(--color-border, #e5e7eb);
  background: var(--color-bg, white);
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary, #1f2937);
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.time-slot:hover:not(:disabled) {
  background: #ecfdf5;
  border-color: #34d399;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.15);
}

.time-slot-selected {
  background: var(--color-primary-600);
  color: white;
  border-color: var(--color-primary-600);
  box-shadow: 0 2px 8px rgba(var(--color-primary-600), 0.3);
}

.time-slot-booked {
  background: #fef2f2;
  border-color: #fca5a5;
  color: #991b1b;
  cursor: not-allowed;
  text-decoration: line-through;
  opacity: 0.75;
}

.time-slot-booked:hover {
  transform: none;
  box-shadow: none;
  background: #fef2f2;
  border-color: #fca5a5;
}

.time-slot-status {
  font-size: 10px;
  text-transform: uppercase;
  font-weight: 700;
  color: #dc2626;
  text-decoration: none;
}

/* Calendar Legend */
.calendar-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 20px;
  margin-top: 16px;
  padding: 12px 16px;
  background: var(--color-bg-elevated, #f9fafb);
  border-radius: 8px;
  border: 1px solid var(--color-border, #e5e7eb);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--color-text-secondary, #6b7280);
  font-weight: 500;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 4px;
  flex-shrink: 0;
}

.legend-dot-today {
  border: 2px solid var(--color-primary-500);
  background: var(--color-primary-50, #eff6ff);
}

.legend-dot-has-bookings {
  background: #fef3c7;
  border: 2px solid #fbbf24;
}

.legend-dot-fully-booked {
  background: #fee2e2;
  border: 2px solid #ef4444;
}

.legend-dot-selected {
  background: var(--color-primary-600);
  border: 2px solid var(--color-primary-600);
}

.booked-slots-info {
  margin-top: 20px;
  padding: 16px;
  background: var(--color-bg-elevated, #f9fafb);
  border-radius: 8px;
}

.booked-slots-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.booked-slot-item {
  padding: 10px;
  background: white;
  border-radius: 6px;
  border: 1px solid var(--color-border, #e5e7eb);
}

.calendar-footer {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--color-border, #e5e7eb);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-border, #e5e7eb);
  border-top-color: var(--color-primary-600);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
