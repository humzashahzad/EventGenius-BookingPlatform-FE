<template>
  <div class="min-h-screen bg-canvas" :class="standalone && 'px-4 py-6 sm:px-8'">
    <div class="max-w-6xl mx-auto space-y-6">
      <header class="page-header !mb-0">
        <div>
          <p class="page-eyebrow">Internal · not linked</p>
          <h1 class="page-title">Form components</h1>
          <p class="page-subtitle">Every control in src/components/forms in every state. One size scale: sm 32 · md 40 · lg 48.</p>
        </div>
        <div class="page-header-actions">
          <SegmentedControl v-model="theme" :options="[{ value: 'light', label: 'Light', icon: 'sun' }, { value: 'dark', label: 'Dark', icon: 'moon' }]" aria-label="Theme" />
          <SwitchInput v-model="allDisabled" label="Disable all" />
        </div>
      </header>

      <!-- Size system -->
      <section class="card" id="sizes">
        <div class="card-header"><div><h2 class="card-title">Control sizes</h2><p class="card-subtitle">Inputs, selects, buttons, icon buttons and segmented controls share heights per row.</p></div></div>
        <div class="card-body space-y-4">
          <div v-for="s in sizes" :key="s" class="flex flex-wrap items-center gap-2" :data-row="s">
            <span class="w-8 text-xs font-mono text-ink-muted">{{ s }}</span>
            <TextInput v-model="demo.text" :size="s" placeholder="Text" class="!w-40" clearable />
            <SelectInput v-model="demo.city" :size="s" :options="cities.slice(0, 5)" class="!w-36" />
            <DatePicker v-model="demo.date" :size="s" class="!w-44" />
            <SegmentedControl v-model="demo.view" :size="s" :options="[{ value: 'grid', label: 'Grid', icon: 'layout-grid' }, { value: 'list', label: 'List', icon: 'menu' }]" aria-label="View" />
            <button type="button" class="btn-primary" :class="btnSize(s)">Primary</button>
            <button type="button" class="btn-secondary" :class="btnSize(s)">Secondary</button>
            <button type="button" class="btn-secondary btn-icon" :class="s === 'sm' ? 'btn-icon-sm' : s === 'lg' ? 'btn-icon-lg' : ''" aria-label="Filter"><AppIcon icon="filter" class="w-4 h-4" /></button>
            <button type="button" class="btn-icon" :class="s === 'sm' ? 'btn-icon-sm' : s === 'lg' ? 'btn-icon-lg' : ''" aria-label="More"><AppIcon icon="more-vertical" class="w-4 h-4" /></button>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <span class="w-8 text-xs font-mono text-ink-muted">badge</span>
            <span class="badge-pending">Pending</span><span class="badge-confirmed">Confirmed</span><span class="badge-neutral">Neutral</span><span class="badge-info">Info</span>
            <span class="badge-pending badge-sm">Pending sm</span><span class="badge-success badge-sm">Success sm</span><span class="count-badge">12</span>
          </div>
        </div>
      </section>

      <div class="grid gap-6 lg:grid-cols-2">
        <!-- Text -->
        <section class="card">
          <div class="card-header"><h2 class="card-title">Text, email, search, password</h2></div>
          <div class="card-body space-y-4">
            <FormField label="Full name" required hint="As on your CNIC.">
              <TextInput v-model="demo.text" placeholder="e.g. Ayesha Khan" :disabled="allDisabled" />
            </FormField>
            <FormField label="Email" :error="emailError" :count="demo.email.length" :maxlength="60">
              <TextInput v-model="demo.email" type="email" prefix-icon="mail" clearable :maxlength="60" :disabled="allDisabled" @blur="v.touch('email')" />
            </FormField>
            <FormField label="Search" label-hidden>
              <TextInput v-model="demo.search" type="search" prefix-icon="search" placeholder="Search venues" clearable :loading="demo.search.length > 2" :disabled="allDisabled" />
            </FormField>
            <FormField label="Website" optional>
              <TextInput v-model="demo.url" type="url" prefix="https://" placeholder="example.pk" :disabled="allDisabled" />
            </FormField>
            <FormField label="Read-only">
              <TextInput model-value="support@eventgenius.pk" readonly />
            </FormField>
            <FormField label="Disabled" hint="Contact support to change it.">
              <TextInput model-value="Can't touch this" disabled />
            </FormField>
            <FormField label="Password" required>
              <PasswordInput v-model="demo.password" autocomplete="new-password" strength :disabled="allDisabled" />
            </FormField>
            <FormField label="Password with error" error="Use at least 8 characters.">
              <PasswordInput model-value="abc" />
            </FormField>
          </div>
        </section>

        <!-- Numbers -->
        <section class="card">
          <div class="card-header"><h2 class="card-title">Numbers, money, phone, CNIC</h2></div>
          <div class="card-body space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <FormField label="Guests" hint="50 – 1,000">
                <NumberInput v-model="demo.guests" :min="50" :max="1000" :step="10" :disabled="allDisabled" />
              </FormField>
              <FormField label="Area" optional>
                <NumberInput v-model="demo.area" :min="0" suffix="sq ft" :stepper="false" :disabled="allDisabled" />
              </FormField>
            </div>
            <FormField label="Price per head" required :hint="demo.price ? `Stored as ${demo.price} (number)` : 'Stored as a number'">
              <CurrencyInput v-model="demo.price" suffix="/ head" :disabled="allDisabled" />
            </FormField>
            <FormField label="Mobile number" :error="phoneError" hint="03XX-XXXXXXX">
              <PhoneInput v-model="demo.phone" :disabled="allDisabled" @blur="v.touch('phone')" />
            </FormField>
            <FormField label="CNIC" :error="cnicError" optional>
              <CnicInput v-model="demo.cnic" :disabled="allDisabled" @blur="v.touch('cnic')" />
            </FormField>
            <FormField label="Number with error" error="Must be at least 1.">
              <NumberInput :model-value="0" :min="1" />
            </FormField>
            <div class="grid grid-cols-3 gap-2">
              <NumberInput v-model="demo.guests" size="sm" aria-label="Small" />
              <NumberInput v-model="demo.guests" aria-label="Medium" />
              <NumberInput v-model="demo.guests" size="lg" aria-label="Large" />
            </div>
          </div>
        </section>

        <!-- Choice -->
        <section class="card">
          <div class="card-header"><h2 class="card-title">Select, combobox, multi-select, tags</h2></div>
          <div class="card-body space-y-4">
            <FormField label="City (native select)" required>
              <SelectInput v-model="demo.city" :options="cities" placeholder="Select city" placeholder-disabled :disabled="allDisabled" />
            </FormField>
            <FormField label="City (searchable)" hint="Type to filter · ↑ ↓ Enter · Esc">
              <Combobox v-model="demo.combo" :options="cities" placeholder="Search a city" clearable :disabled="allDisabled" />
            </FormField>
            <FormField label="Venue (async search)" hint="Simulated 400 ms request">
              <Combobox v-model="demo.asyncCombo" :search="fakeSearch" placeholder="Type a venue name" prefix-icon="building" clearable :disabled="allDisabled" />
            </FormField>
            <FormField label="Event types" :count="demo.multi.length">
              <MultiSelect v-model="demo.multi" :options="eventTypes" placeholder="Choose event types" :disabled="allDisabled" />
            </FormField>
            <FormField label="Tags" hint="Enter or comma adds; Backspace removes.">
              <TagsInput v-model="demo.tags" :suggestions="['parking', 'catering', 'valet', 'generator']" :disabled="allDisabled" />
            </FormField>
            <FormField label="Combobox with error" error="Choose a city from the list.">
              <Combobox :options="cities" />
            </FormField>
          </div>
        </section>

        <!-- Toggles -->
        <section class="card">
          <div class="card-header"><h2 class="card-title">Checkbox, radio, switch, segmented</h2></div>
          <div class="card-body space-y-4">
            <CheckboxInput v-model="demo.agree" label="I accept the booking terms" :disabled="allDisabled" />
            <CheckboxInput v-model="demo.agree2" label="Send me offers" description="At most one email a month." indeterminate :disabled="allDisabled" />
            <FormField label="Amenities" group>
              <CheckboxGroup v-model="demo.amenities" :options="['Parking', 'Catering', 'Generator', 'Bridal room']" :columns="2" :disabled="allDisabled" />
            </FormField>
            <FormField label="Paid amenities (cards with price)" group>
              <CheckboxGroup v-model="demo.paid" variant="cards" :options="[{ value: 1, label: 'Valet parking', meta: '+ PKR 15,000' }, { value: 2, label: 'Stage lighting', description: 'LED wash + spots', meta: '+ PKR 40,000' }, { value: 3, label: 'Generator backup', meta: 'Included', disabled: true }]" :disabled="allDisabled" />
            </FormField>
            <FormField label="Event types (cards)" group>
              <CheckboxGroup v-model="demo.multi" :options="eventTypes" variant="cards" :columns="3" :disabled="allDisabled" />
            </FormField>
            <FormField label="Payment" group>
              <RadioGroup v-model="demo.pay" :options="[{ value: 'card', label: 'Card' }, { value: 'cash', label: 'Cash at venue' }, { value: 'bank', label: 'Bank transfer', disabled: true }]" inline :disabled="allDisabled" />
            </FormField>
            <FormField label="Visibility" group>
              <RadioCards v-model="demo.status" :options="[{ value: 'active', label: 'Active', description: 'Visible to clients', icon: 'eye' }, { value: 'inactive', label: 'Inactive', description: 'Hidden from listings', icon: 'eye-off' }]" :disabled="allDisabled" />
            </FormField>
            <SwitchInput v-model="demo.switch" label="Instant booking" description="Confirm requests automatically." :disabled="allDisabled" />
            <SwitchInput v-model="demo.switch" label="Small switch" size="sm" :disabled="allDisabled" />
            <FormField label="Period" group>
              <SegmentedControl v-model="demo.period" :options="[{ value: 'day', label: 'Day' }, { value: 'week', label: 'Week' }, { value: 'month', label: 'Month', count: 4 }]" :disabled="allDisabled" />
            </FormField>
          </div>
        </section>

        <!-- Dates -->
        <section class="card">
          <div class="card-header"><h2 class="card-title">Date, range, time</h2></div>
          <div class="card-body space-y-4">
            <FormField label="Event date" required hint="Fridays are unavailable · from today">
              <DatePicker v-model="demo.date" :min="todayIso" :disabled-dates="(_iso, d) => d.getDay() === 5" clearable :disabled="allDisabled" />
            </FormField>
            <FormField label="Availability (inline, marked days)" group hint="Green: free · amber: few slots left · red: fully booked (disabled)">
              <DatePicker v-model="demo.date" inline :min="todayIso" :day-meta="availability" @month-change="ym => (demo.month = ym)" />
            </FormField>
            <p class="text-xs text-ink-muted -mt-2">month-change: {{ demo.month }}</p>
            <FormField label="Booking dates">
              <DateRangePicker v-model:start="demo.from" v-model:end="demo.to" :presets="['today', 'last7', 'thisMonth', 'next30']" :disabled="allDisabled" />
            </FormField>
            <div class="grid grid-cols-2 gap-4">
              <FormField label="Opens"><TimePicker v-model="demo.open" :disabled="allDisabled" /></FormField>
              <FormField label="Closes" error="Must be after opening time."><TimePicker v-model="demo.close" :min="demo.open || '00:00'" /></FormField>
            </div>
            <FormField label="Hourly + 23:59 (custom list)">
              <TimePicker v-model="demo.hourly" :options="hourly" :disabled="allDisabled" />
            </FormField>
          </div>
        </section>

        <!-- Sliders, rating, otp -->
        <section class="card">
          <div class="card-header"><h2 class="card-title">Slider, rating, OTP</h2></div>
          <div class="card-body space-y-5">
            <FormField label="Ranking weight">
              <SliderInput v-model="demo.weight" :min="0" :max="100" show-value show-limits :format="n => `${n}%`" :disabled="allDisabled" />
            </FormField>
            <FormField label="Budget per head">
              <RangeSlider v-model="demo.budget" :min="500" :max="10000" :step="250" :min-gap="500" show-value show-limits :format="n => `PKR ${n.toLocaleString('en-PK')}`" :disabled="allDisabled" />
            </FormField>
            <FormField label="Overall rating" required group :error="demo.rating ? '' : 'Choose a star rating.'">
              <RatingInput v-model="demo.rating" show-text :disabled="allDisabled" />
            </FormField>
            <FormField label="Half stars" group>
              <RatingInput v-model="demo.half" allow-half show-text :disabled="allDisabled" />
            </FormField>
            <div class="flex items-center gap-4"><span class="text-sm text-ink-muted">Read-only</span><RatingInput :model-value="4.5" readonly size="sm" show-value /></div>
            <FormField label="Verification code" group hint="Paste 123456 to try it.">
              <OtpInput v-model="demo.otp" :disabled="allDisabled" @complete="c => (otpDone = c)" />
            </FormField>
            <p v-if="otpDone" class="text-sm text-success-text">Complete: {{ otpDone }}</p>
          </div>
        </section>

        <!-- Files & textarea -->
        <section class="card">
          <div class="card-header"><h2 class="card-title">Files and long text</h2></div>
          <div class="card-body space-y-4">
            <FormField label="Venue photos" hint="Shown as a grid with previews.">
              <ImageUpload v-model="demo.images" :max-files="6" :max-size="5" :disabled="allDisabled" />
            </FormField>
            <FormField label="Documents">
              <FileUpload v-model="demo.files" accept=".pdf,.docx" multiple compact :max-size="2" :progress="demo.files.map((_, i) => (i + 1) * 30)" :disabled="allDisabled" />
            </FormField>
            <FormField label="Description" :count="demo.desc.length" :maxlength="500">
              <TextareaInput v-model="demo.desc" auto-grow :rows="3" :maxlength="500" placeholder="Auto-grows as you type…" :disabled="allDisabled" />
            </FormField>
            <FormField label="Notes" error="Please add a short note.">
              <TextareaInput model-value="" counter :maxlength="200" :rows="2" />
            </FormField>
          </div>
        </section>

        <!-- Location + actions -->
        <section class="card">
          <div class="card-header"><h2 class="card-title">Location and form actions</h2></div>
          <div class="card-body space-y-4">
            <LocationInput v-model="demo.location" :cities="cities" :disabled="allDisabled" />
            <FormActions cancel-label="Cancel" :dirty="true" idle-text="All changes saved" @save="() => {}" @cancel="() => {}" />
          </div>
        </section>
      </div>

      <section class="card">
        <div class="card-header"><h2 class="card-title">Live values (what the form would send)</h2></div>
        <pre class="card-body text-xs font-mono text-ink-secondary overflow-x-auto whitespace-pre-wrap break-all">{{ JSON.stringify(serializable, null, 2) }}</pre>
      </section>

      <FormActions sticky cancel-label="Discard" dirty save-label="Save (demo)" @save="() => {}" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'
import {
  FormField, TextInput, PasswordInput, NumberInput, CurrencyInput, PhoneInput, CnicInput, TextareaInput,
  SelectInput, Combobox, MultiSelect, TagsInput, CheckboxInput, CheckboxGroup, RadioGroup, RadioCards,
  SwitchInput, SegmentedControl, DatePicker, DateRangePicker, TimePicker, SliderInput, RangeSlider,
  RatingInput, OtpInput, FileUpload, ImageUpload, LocationInput, FormActions, rules, useValidation, toISODate,
  type ControlSize, type DayMeta,
} from '@/components/forms'

const route = useRoute()
const standalone = computed(() => route.meta.layout === 'auth')
const sizes: ControlSize[] = ['sm', 'md', 'lg']
const btnSize = (s: ControlSize) => (s === 'sm' ? 'btn-sm' : s === 'lg' ? 'btn-lg' : '')
const cities = ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala']
const eventTypes = [
  { value: 'wedding', label: 'Wedding', icon: '💍' }, { value: 'mehndi', label: 'Mehndi', icon: '🌿' },
  { value: 'walima', label: 'Walima', icon: '🍽️' }, { value: 'birthday', label: 'Birthday', icon: '🎂' },
  { value: 'corporate', label: 'Corporate', icon: '💼' }, { value: 'conference', label: 'Conference', icon: '🎤' },
]
const hourly = [...Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, '0')}:00`), '23:59']
const todayIso = toISODate(new Date())

const demo = reactive({
  text: '', email: 'ayesha@', search: '', url: '', password: '',
  guests: 150 as number | null, area: null as number | null, price: 2500 as number | null, phone: '03001234567', cnic: '',
  city: 'Lahore', combo: null as unknown, asyncCombo: null as unknown, multi: ['wedding'] as unknown[], tags: ['parking'] as string[],
  agree: true, agree2: false, amenities: ['Parking'] as unknown[], pay: 'card', status: 'active', switch: true, period: 'week', view: 'grid',
  date: '', from: '', to: '', open: '10:00', close: '09:00', hourly: '23:59',
  weight: 40, budget: [1500, 4000] as [number, number], rating: null as number | null, half: 3.5, otp: '',
  month: '', paid: [1] as unknown[],
  images: [] as File[], files: [] as File[], desc: '',
  location: { address: '', city: 'Lahore', latitude: 31.5204, longitude: 74.3587 } as { address: string; city?: string; latitude: number | null; longitude: number | null },
})
const v = useValidation(demo, { email: [rules.email()], phone: [rules.pkMobile()], cnic: [rules.cnic()] })
const emailError = computed(() => (demo.email ? rules.email()(demo.email) === true ? '' : 'Enter a valid email address.' : ''))
const phoneError = computed(() => v.error('phone') || (demo.phone && rules.pkMobile()(demo.phone) !== true ? 'Enter a mobile number like 0300-1234567.' : ''))
const cnicError = computed(() => (demo.cnic && rules.cnic()(demo.cnic) !== true ? 'Enter 13 digits: 35202-1234567-1.' : ''))
const otpDone = ref('')
function availability(_iso: string, d: Date): DayMeta | null {
  const n = d.getDate()
  if (n % 9 === 0) return { tone: 'danger', label: 'Fully booked', disabled: true }
  if (n % 5 === 0) return { tone: 'warning', label: 'Few slots left' }
  if (n % 3 === 0) return { tone: 'success', label: 'Available' }
  return null
}
const allDisabled = ref(false)

const venues = ['Mughal Garden Marquee', 'Shalimar Banquets', 'Clifton Rooftop', 'Royal Palm Hall', 'Lake View Lawn', 'Margalla Hills Marquee', 'Grand Pearl Hall']
function fakeSearch(q: string) {
  return new Promise<{ value: string; label: string; description: string }[]>(resolve => setTimeout(() => {
    resolve(venues.filter(n => n.toLowerCase().includes(q.toLowerCase())).map((n, i) => ({ value: `v${i}`, label: n, description: cities[i % cities.length] })))
  }, 400))
}

const serializable = computed(() => ({ ...demo, images: demo.images.map(f => f.name), files: demo.files.map(f => f.name) }))

// Theme toggle for the showcase (restores the previous class when leaving).
const html = document.documentElement
const hadDark = html.classList.contains('dark')
const theme = ref<'light' | 'dark'>(route.query.theme === 'dark' || hadDark ? 'dark' : 'light')
watch(theme, t => html.classList.toggle('dark', t === 'dark'), { immediate: true })
onBeforeUnmount(() => html.classList.toggle('dark', hadDark))
</script>
