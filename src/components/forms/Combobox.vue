<template>
  <div ref="anchor" v-bind="split.wrapper" :class="[ctl.boxClass.value, open && 'is-focused']" data-control>
    <span v-if="prefixIcon" class="control-affix"><AppIcon :icon="prefixIcon" :class="ctl.iconClass.value" /></span>
    <input
      ref="inputEl"
      v-bind="split.input"
      :id="ctl.id.value"
      :value="query"
      type="text"
      role="combobox"
      class="control-input"
      :placeholder="selectedLabel || placeholder"
      :disabled="ctl.disabled.value"
      :readonly="readonly"
      :required="ctl.required.value && model == null"
      :aria-expanded="open"
      :aria-controls="listId"
      :aria-activedescendant="open && active >= 0 ? `${listId}-${active}` : undefined"
      aria-autocomplete="list"
      :aria-invalid="ctl.invalid.value || undefined"
      :aria-describedby="ctl.describedBy.value"
      autocomplete="off"
      @input="onInput"
      @focus="onFocus"
      @blur="onBlur"
      @keydown="onKeydown"
      @click="openList"
    />
    <span v-if="loading || busy" class="control-affix is-end"><AppIcon icon="loader" :class="[ctl.iconClass.value, 'animate-spin']" /></span>
    <button v-if="clearable && model != null && model !== '' && !ctl.disabled.value" type="button" class="control-btn" tabindex="-1" aria-label="Clear selection" @click="clear">
      <AppIcon icon="x" :class="ctl.iconClass.value" />
    </button>
    <button type="button" class="control-btn" tabindex="-1" :aria-label="open ? 'Close list' : 'Open list'" :disabled="ctl.disabled.value || readonly" @click="toggle">
      <AppIcon icon="chevron-down" :class="[ctl.iconClass.value, 'transition-transform', open && 'rotate-180']" />
    </button>
  </div>
  <Teleport to="body">
    <ul
      v-if="open"
      :id="listId"
      ref="panel"
      role="listbox"
      class="popover listbox !mt-0 z-[55]"
      :style="pop.style.value"
      :aria-label="ariaLabel || placeholder || 'Options'"
    >
      <li
        v-for="(o, i) in filtered"
        :id="`${listId}-${i}`"
        :key="i"
        role="option"
        class="listbox-option"
        :class="i === active && 'is-active'"
        :aria-selected="isSelected(o)"
        :aria-disabled="o.disabled || undefined"
        @mousedown.prevent
        @mousemove="active = i"
        @click="choose(o)"
      >
        <span class="min-w-0 flex-1">
          <span class="block truncate">{{ o.label }}</span>
          <span v-if="o.description" class="block text-xs text-ink-muted font-normal truncate">{{ o.description }}</span>
        </span>
        <AppIcon v-if="isSelected(o)" icon="check" class="w-4 h-4 shrink-0" />
      </li>
      <li v-if="!filtered.length" class="listbox-empty" role="presentation">{{ busy ? 'Searching…' : query.length < minChars ? `Type at least ${minChars} characters` : emptyText }}</li>
    </ul>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * Searchable select (ARIA 1.2 combobox + listbox). Type to filter, ↑/↓ to
 * move, Enter to choose, Esc to close. Pass `options` for local data or a
 * `search(query)` function returning a Promise of options for async data.
 * `allowCustom` lets the typed text become the value.
 */
import { computed, ref, useAttrs, useId, watch } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { splitAttrs, useControl, type ControlSize } from './useControl'
import { usePopover } from './usePopover'

export interface ComboOption { value: unknown; label: string; description?: string; disabled?: boolean }

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<{
  options?: (ComboOption | string)[]
  search?: (q: string) => Promise<(ComboOption | string)[]>
  minChars?: number
  debounce?: number
  placeholder?: string
  emptyText?: string
  clearable?: boolean
  allowCustom?: boolean
  loading?: boolean
  prefixIcon?: string
  ariaLabel?: string
  id?: string
  size?: ControlSize
  invalid?: boolean
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  describedby?: string
}>(), { options: () => [], search: undefined, minChars: 0, debounce: 250, placeholder: 'Select…', emptyText: 'No matches', prefixIcon: '', ariaLabel: '' })

const model = defineModel<any>()
const emit = defineEmits<{ select: [option: ComboOption | null] }>()
const ctl = useControl(props)
const attrs = useAttrs()
const split = computed(() => splitAttrs(attrs))
const listId = `eg-lb-${useId()}`

const anchor = ref<HTMLElement | null>(null)
const panel = ref<HTMLElement | null>(null)
const inputEl = ref<HTMLInputElement | null>(null)
const open = ref(false)
const active = ref(-1)
const query = ref('')
const typing = ref(false)
const busy = ref(false)
const remote = ref<ComboOption[]>([])
const pop = usePopover(anchor, panel, open, { matchWidth: true, onOutside: () => close() })

const norm = (o: ComboOption | string): ComboOption => (typeof o === 'string' ? { value: o, label: o } : o)
const all = computed(() => (props.search ? remote.value : props.options.map(norm)))
const selected = ref<ComboOption | null>(null)
const selectedLabel = computed(() => {
  const hit = all.value.find(o => o.value === model.value) ?? (selected.value?.value === model.value ? selected.value : null)
  if (hit) return hit.label
  return model.value != null && model.value !== '' ? String(model.value) : ''
})
const filtered = computed(() => {
  if (props.search || !typing.value) return all.value
  const q = query.value.trim().toLowerCase()
  return q ? all.value.filter(o => o.label.toLowerCase().includes(q) || o.description?.toLowerCase().includes(q)) : all.value
})
const isSelected = (o: ComboOption) => o.value === model.value

// Show the chosen label in the input while not typing.
watch([selectedLabel, open], () => { if (!typing.value) query.value = selectedLabel.value }, { immediate: true })

let timer: ReturnType<typeof setTimeout> | undefined
let seq = 0
function runSearch() {
  if (!props.search) return
  clearTimeout(timer)
  if (query.value.length < props.minChars) { remote.value = []; return }
  timer = setTimeout(async () => {
    const mine = ++seq
    busy.value = true
    try {
      const res = await props.search!(typing.value ? query.value : '')
      if (mine === seq) remote.value = res.map(norm)
    } catch { if (mine === seq) remote.value = [] } finally { if (mine === seq) busy.value = false }
  }, props.debounce)
}

function openList() {
  if (ctl.disabled.value || props.readonly || open.value) return
  open.value = true
  active.value = Math.max(0, filtered.value.findIndex(isSelected))
  if (props.search && !remote.value.length) runSearch()
}
function close(commit = true) {
  if (!open.value && !typing.value) return
  open.value = false
  if (commit && typing.value && props.allowCustom && query.value.trim() && query.value !== selectedLabel.value) {
    model.value = query.value.trim()
    emit('select', { value: model.value, label: model.value })
  }
  typing.value = false
  query.value = selectedLabel.value
}
function toggle() { open.value ? close() : (openList(), inputEl.value?.focus()) }
function onFocus() { /* opening on focus is noisy for keyboard users; open on type/arrow/click */ }
function onBlur(e: FocusEvent) {
  if (panel.value?.contains(e.relatedTarget as Node)) return
  close()
}
function onInput(e: Event) {
  query.value = (e.target as HTMLInputElement).value
  typing.value = true
  if (!open.value) open.value = true
  active.value = 0
  runSearch()
}
function choose(o: ComboOption) {
  if (o.disabled) return
  selected.value = o
  model.value = o.value
  emit('select', o)
  typing.value = false
  open.value = false
  query.value = o.label
}
function clear() {
  model.value = props.allowCustom ? '' : null
  selected.value = null
  emit('select', null)
  query.value = ''
  inputEl.value?.focus()
}
function move(d: number) {
  const n = filtered.value.length
  if (!n) return
  let i = active.value
  for (let k = 0; k < n; k++) {
    i = (i + d + n) % n
    if (!filtered.value[i].disabled) break
  }
  active.value = i
  panel.value?.querySelector(`#${CSS.escape(`${listId}-${i}`)}`)?.scrollIntoView({ block: 'nearest' })
}
function onKeydown(e: KeyboardEvent) {
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      if (!open.value) { openList(); if (e.altKey) return } else move(1)
      break
    case 'ArrowUp':
      e.preventDefault()
      if (!open.value) openList(); else move(-1)
      break
    case 'Enter':
      if (open.value && filtered.value[active.value]) { e.preventDefault(); choose(filtered.value[active.value]) } else if (open.value) { e.preventDefault(); close() }
      break
    case 'Escape':
      if (open.value) { e.preventDefault(); e.stopPropagation(); close(false) } else if (props.clearable && query.value) { query.value = ''; }
      break
    case 'Tab':
      close()
      break
  }
}
defineExpose({ focus: () => inputEl.value?.focus() })
</script>
