<template>
  <div ref="rootEl" class="smart-search relative w-full min-w-0" :class="variant === 'hero' ? 'smart-search--hero' : ''">
    <form role="search" class="flex items-center gap-2 w-full min-w-0" :class="variant === 'hero' ? 'smart-hero-field' : 'smart-bar-field'" @submit.prevent="submit()">
      <AppIcon icon="search" class="shrink-0 w-[18px] h-[18px]" :class="variant === 'hero' ? 'text-primary-600' : 'text-primary-500 dark:text-primary-400'" />
      <input
        :id="inputId"
        ref="inputEl"
        :value="modelValue"
        type="search"
        enterkeyhint="search"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        role="combobox"
        aria-autocomplete="list"
        :aria-expanded="isOpen ? 'true' : 'false'"
        :aria-controls="listId"
        :aria-activedescendant="activeIndex >= 0 ? optionId(activeIndex) : undefined"
        :aria-label="ariaLabel"
        :placeholder="placeholder"
        class="flex-1 min-w-0 bg-transparent border-0 outline-none focus:ring-0 text-[0.9375rem] text-warm-800 dark:text-warm-100 placeholder:text-warm-400 dark:placeholder:text-warm-500 truncate"
        @input="onInput"
        @focus="onFocus"
        @keydown="onKeydown"
      />
      <button
        v-if="modelValue"
        type="button"
        class="shrink-0 p-1 rounded-full text-warm-400 hover:text-warm-600 hover:bg-warm-100 dark:hover:bg-warm-700 dark:hover:text-warm-200"
        aria-label="Clear search"
        @click="clear"
      >
        <AppIcon icon="x" class="w-4 h-4" />
      </button>
      <button
        type="submit"
        class="shrink-0 inline-flex items-center gap-1.5 rounded-xl font-semibold text-sm text-white bg-primary-600 hover:bg-primary-700 transition-colors"
        :class="variant === 'hero' ? 'px-4 py-2.5' : 'px-3 py-2'"
        aria-label="Search"
      >
        <AppIcon icon="search" class="w-4 h-4" />
        <span class="hidden sm:inline">Search</span>
      </button>
    </form>

    <Teleport to="body">
      <div
        v-show="isOpen"
        ref="panelEl"
        class="fixed z-[900] rounded-xl border border-warm-200 dark:border-warm-700 bg-white dark:bg-warm-800 shadow-elevated overflow-hidden text-left"
        :style="panelStyle"
      >
        <p v-if="!modelValue.trim()" class="px-3 pt-2.5 pb-1 text-[0.6875rem] font-bold uppercase tracking-wide text-warm-400 dark:text-warm-500">
          Try searching for
        </p>
        <ul :id="listId" role="listbox" :aria-label="`${ariaLabel} suggestions`" class="max-h-[min(60vh,22rem)] overflow-y-auto overscroll-contain py-1">
          <li
            v-for="(s, i) in items"
            :id="optionId(i)"
            :key="`${s.type}-${s.value}-${i}`"
            role="option"
            :aria-selected="i === activeIndex ? 'true' : 'false'"
            class="flex items-center gap-3 px-3 py-2.5 cursor-pointer select-none min-w-0"
            :class="i === activeIndex ? 'bg-primary-50 dark:bg-primary-900/30' : 'hover:bg-warm-50 dark:hover:bg-warm-700/60'"
            @mousedown.prevent
            @mousemove="activeIndex = i"
            @click="pick(s)"
          >
            <span class="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center" :class="iconBg(s.type)">
              <AppIcon :icon="iconFor(s.type)" class="w-4 h-4" />
            </span>
            <span class="flex-1 min-w-0">
              <span class="block truncate text-sm font-medium text-warm-800 dark:text-warm-100">{{ s.label }}</span>
              <span v-if="s.type === 'venue' && s.city" class="block truncate text-xs text-warm-500 dark:text-warm-400">{{ s.city }}</span>
            </span>
            <span class="shrink-0 text-[0.6875rem] font-semibold text-warm-400 dark:text-warm-500">{{ typeLabel(s.type) }}</span>
          </li>
        </ul>
      </div>
    </Teleport>
    <span class="sr-only" aria-live="polite">{{ liveText }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/lib/axios'
import AppIcon from '@/components/ui/AppIcon.vue'
import { EXAMPLE_QUERIES, type Suggestion, type SuggestionType } from './types'

const props = withDefaults(defineProps<{
  modelValue: string
  placeholder?: string
  ariaLabel?: string
  variant?: 'bar' | 'hero'
}>(), {
  placeholder: 'Try: wedding hall in Lahore for 300 guests under 3000',
  ariaLabel: 'Search venues',
  variant: 'bar',
})

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void
  /** Enter / Search button with the current text. */
  (e: 'submit', q: string): void
  /** A city, category or example query was chosen. Venue suggestions navigate by themselves. */
  (e: 'select', s: Suggestion): void
  /** The clear (x) button was pressed. */
  (e: 'clear'): void
}>()

const router = useRouter()
const uid = Math.random().toString(36).slice(2, 8)
const inputId = `smart-search-${uid}`
const listId = `smart-search-list-${uid}`
const optionId = (i: number) => `smart-search-opt-${uid}-${i}`

const rootEl = ref<HTMLElement | null>(null)
const inputEl = ref<HTMLInputElement | null>(null)
const panelEl = ref<HTMLElement | null>(null)
const open = ref(false)
const activeIndex = ref(-1)
const suggestions = ref<Suggestion[]>([])
const panelStyle = ref<Record<string, string>>({})

const fallbackExamples: Suggestion[] = EXAMPLE_QUERIES.map(q => ({ type: 'query', label: q, value: q }))
const items = computed<Suggestion[]>(() => suggestions.value.length ? suggestions.value : (props.modelValue.trim().length < 2 ? fallbackExamples : []))
const isOpen = computed(() => open.value && items.value.length > 0)
const liveText = computed(() => isOpen.value ? `${items.value.length} suggestions available` : '')

let timer: ReturnType<typeof setTimeout> | undefined
let reqId = 0

async function fetchSuggestions(q: string) {
  const id = ++reqId
  try {
    const { data } = await api.get('/search/suggest', { params: { q } })
    if (id !== reqId) return
    const list: any[] = data?.data?.suggestions ?? []
    suggestions.value = list
      .filter(s => s && typeof s.label === 'string' && ['venue', 'city', 'category', 'query'].includes(s.type))
      .slice(0, 8)
      .map(s => ({ type: s.type, label: s.label, value: String(s.value ?? s.label), venue_id: s.venue_id, city: s.city }))
    activeIndex.value = -1
  } catch {
    if (id !== reqId) return
    suggestions.value = []
  }
}

function schedule(q: string) {
  clearTimeout(timer)
  timer = setTimeout(() => fetchSuggestions(q.trim()), 250)
}

function onInput(e: Event) {
  const v = (e.target as HTMLInputElement).value
  emit('update:modelValue', v)
  // Old suggestions no longer match what is typed.
  if (v.trim().length < 2) suggestions.value = []
  openPanel()
  schedule(v)
}

function onFocus() {
  openPanel()
  if (!suggestions.value.length) schedule(props.modelValue)
}

function openPanel() {
  open.value = true
  activeIndex.value = -1
  nextTick(position)
}

function close() {
  open.value = false
  activeIndex.value = -1
}

function position() {
  const el = rootEl.value
  if (!el || !open.value) return
  const r = el.getBoundingClientRect()
  const gutter = 8
  const width = Math.min(r.width, window.innerWidth - gutter * 2)
  const left = Math.max(gutter, Math.min(r.left, window.innerWidth - width - gutter))
  panelStyle.value = { top: `${r.bottom + 6}px`, left: `${left}px`, width: `${width}px` }
}

function onKeydown(e: KeyboardEvent) {
  const n = items.value.length
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (!isOpen.value) { openPanel(); return }
    activeIndex.value = n ? (activeIndex.value + 1) % n : -1
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (!isOpen.value) { openPanel(); return }
    activeIndex.value = n ? (activeIndex.value <= 0 ? n - 1 : activeIndex.value - 1) : -1
  } else if (e.key === 'Enter') {
    if (isOpen.value && activeIndex.value >= 0 && items.value[activeIndex.value]) {
      e.preventDefault()
      pick(items.value[activeIndex.value])
    }
    // Otherwise the form submits.
  } else if (e.key === 'Escape') {
    if (isOpen.value) { e.preventDefault(); close() }
  } else if (e.key === 'Tab') {
    close()
  }
}

function pick(s: Suggestion) {
  close()
  clearTimeout(timer)
  reqId++
  if (s.type === 'venue' && s.venue_id) {
    router.push(`/venues/${s.venue_id}`)
    return
  }
  if (s.type === 'query') emit('update:modelValue', s.value)
  emit('select', s)
  suggestions.value = []
}

function submit() {
  close()
  clearTimeout(timer)
  reqId++
  inputEl.value?.blur()
  emit('submit', props.modelValue.trim())
}

function clear() {
  emit('update:modelValue', '')
  suggestions.value = []
  inputEl.value?.focus()
  emit('clear')
}

function onDocPointerDown(e: PointerEvent) {
  if (!open.value) return
  const t = e.target as Node
  if (rootEl.value?.contains(t) || panelEl.value?.contains(t)) return
  close()
}

function onViewportChange() {
  if (open.value) position()
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocPointerDown, true)
  window.addEventListener('resize', onViewportChange, { passive: true })
  window.addEventListener('scroll', onViewportChange, { passive: true, capture: true })
})

onBeforeUnmount(() => {
  clearTimeout(timer)
  reqId++
  document.removeEventListener('pointerdown', onDocPointerDown, true)
  window.removeEventListener('resize', onViewportChange)
  window.removeEventListener('scroll', onViewportChange, true)
})

const ICONS: Record<SuggestionType, string> = { venue: 'building', city: 'map-pin', category: 'tags', query: 'search' }
const LABELS: Record<SuggestionType, string> = { venue: 'Venue', city: 'City', category: 'Event type', query: 'Search' }
const iconFor = (t: SuggestionType) => ICONS[t]
const typeLabel = (t: SuggestionType) => LABELS[t]
function iconBg(t: SuggestionType) {
  switch (t) {
    case 'venue': return 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
    case 'city': return 'bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400'
    case 'category': return 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
    default: return 'bg-warm-100 text-warm-500 dark:bg-warm-700 dark:text-warm-300'
  }
}

defineExpose({ focus: () => inputEl.value?.focus() })
</script>

<style scoped>
.smart-bar-field {
  padding: 0.375rem 0.375rem 0.375rem 0.875rem;
  border-radius: 0.75rem;
  transition: box-shadow 0.15s;
}

/* The focus ring goes around the whole field, not the bare input inside it. */
.smart-search input:focus-visible {
  outline: none;
}

.smart-bar-field:focus-within {
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.45);
}

.smart-hero-field:focus-within {
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25), 0 0 0 3px rgba(110, 231, 183, 0.7);
}

.smart-hero-field {
  background: #fff;
  border-radius: 1rem;
  padding: 0.4375rem 0.4375rem 0.4375rem 1rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25);
}

:root.dark .smart-hero-field {
  background: #292524;
}

/* Hide the browser's own clear button; we draw our own. */
input[type='search']::-webkit-search-cancel-button {
  -webkit-appearance: none;
  appearance: none;
}
</style>
