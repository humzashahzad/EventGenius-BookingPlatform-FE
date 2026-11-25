<template>
  <div
    ref="anchor"
    v-bind="split.wrapper"
    :class="[ctl.boxClass.value, 'is-auto cursor-text', open && 'is-focused']"
    data-control
    @click="inputEl?.focus()"
  >
    <span v-for="(v, i) in model" :key="String(v)" class="chip">
      <span class="truncate">{{ labelOf(v) }}</span>
      <button v-if="!ctl.disabled.value && !readonly" type="button" class="chip-x" :aria-label="`Remove ${labelOf(v)}`" @click.stop="remove(i)">
        <AppIcon icon="x" class="w-3.5 h-3.5" />
      </button>
    </span>
    <input
      ref="inputEl"
      v-bind="split.input"
      :id="ctl.id.value"
      v-model="query"
      type="text"
      class="control-input multi-input"
      :role="hasList ? 'combobox' : undefined"
      :aria-expanded="hasList ? open : undefined"
      :aria-controls="hasList ? listId : undefined"
      :aria-activedescendant="open && active >= 0 ? `${listId}-${active}` : undefined"
      :aria-autocomplete="hasList ? 'list' : undefined"
      :aria-invalid="ctl.invalid.value || undefined"
      :aria-describedby="[ctl.describedBy.value, hintId].filter(Boolean).join(' ') || undefined"
      :placeholder="model.length ? '' : placeholder"
      :disabled="ctl.disabled.value || atMax"
      :readonly="readonly"
      autocomplete="off"
      @keydown="onKeydown"
      @input="onInput"
      @focus="hasList && openList()"
      @blur="onBlur"
    />
    <span :id="hintId" class="sr-only">{{ model.length }} selected. {{ creatable ? 'Press Enter or comma to add.' : '' }} Backspace removes the last one.</span>
  </div>
  <Teleport to="body">
    <ul v-if="open && hasList" :id="listId" ref="panel" role="listbox" aria-multiselectable="true" class="popover listbox !mt-0 z-[55]" :style="pop.style.value">
      <li
        v-for="(o, i) in filtered"
        :id="`${listId}-${i}`"
        :key="i"
        role="option"
        class="listbox-option"
        :class="i === active && 'is-active'"
        :aria-selected="isSelected(o.value)"
        :aria-disabled="o.disabled || undefined"
        @mousedown.prevent
        @mousemove="active = i"
        @click="toggleOption(o)"
      >
        <span class="w-4 h-4 shrink-0 rounded border inline-flex items-center justify-center" :class="isSelected(o.value) ? 'bg-brand-strong border-brand-strong text-white' : 'border-line-strong'">
          <AppIcon v-if="isSelected(o.value)" icon="check" class="w-3 h-3" />
        </span>
        <span class="truncate">{{ o.label }}</span>
      </li>
      <li v-if="creatable && query.trim() && !exact" :id="`${listId}-${filtered.length}`" role="option" class="listbox-option" :class="active === filtered.length && 'is-active'" aria-selected="false" @mousedown.prevent @click="addCustom">
        <AppIcon icon="plus" class="w-4 h-4" />Add “{{ query.trim() }}”
      </li>
      <li v-if="!filtered.length && !(creatable && query.trim())" class="listbox-empty" role="presentation">{{ emptyText }}</li>
    </ul>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * Multi-value picker shown as removable chips. With `options` it opens a
 * checkable list (type to filter); with `creatable` users can add their own
 * values (Enter / comma). Backspace in the empty input removes the last chip.
 */
import { computed, ref, useAttrs, useId } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { splitAttrs, useControl, type ControlSize } from './useControl'
import { usePopover } from './usePopover'

export interface MultiOption { value: unknown; label: string; disabled?: boolean }

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<{
  options?: (MultiOption | string)[]
  creatable?: boolean
  max?: number
  placeholder?: string
  emptyText?: string
  /** Lowercase / trim custom values before adding. */
  normalize?: (v: string) => string
  id?: string
  size?: ControlSize
  invalid?: boolean
  disabled?: boolean
  readonly?: boolean
  describedby?: string
}>(), { options: () => [], max: undefined, placeholder: 'Select…', emptyText: 'Nothing left to choose', normalize: (v: string) => v.trim() })

const model = defineModel<any[]>({ default: () => [] })
const ctl = useControl(props)
const attrs = useAttrs()
const split = computed(() => splitAttrs(attrs))
const uid = useId()
const listId = `eg-ms-${uid}`
const hintId = `eg-ms-${uid}-hint`
const anchor = ref<HTMLElement | null>(null)
const panel = ref<HTMLElement | null>(null)
const inputEl = ref<HTMLInputElement | null>(null)
const open = ref(false)
const active = ref(0)
const query = ref('')
const pop = usePopover(anchor, panel, open, { matchWidth: true, onOutside: () => (open.value = false) })

const opts = computed<MultiOption[]>(() => props.options.map(o => (typeof o === 'string' ? { value: o, label: o } : o)))
const hasList = computed(() => opts.value.length > 0 || props.creatable)
const atMax = computed(() => props.max !== undefined && model.value.length >= props.max)
const isSelected = (v: unknown) => model.value.includes(v)
const labelOf = (v: unknown) => opts.value.find(o => o.value === v)?.label ?? String(v)
const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return q ? opts.value.filter(o => o.label.toLowerCase().includes(q)) : opts.value
})
const exact = computed(() => {
  const q = props.normalize(query.value).toLowerCase()
  return opts.value.some(o => o.label.toLowerCase() === q) || model.value.some(v => String(v).toLowerCase() === q)
})

function openList() { if (!ctl.disabled.value && !props.readonly) { open.value = true; active.value = 0 } }
function onBlur(e: FocusEvent) {
  if (panel.value?.contains(e.relatedTarget as Node)) return
  if (props.creatable && query.value.trim() && !opts.value.length) addCustom()
  open.value = false
}
function onInput() {
  if (props.creatable && /[,\n]/.test(query.value)) {
    const parts = query.value.split(/[,\n]/)
    query.value = parts.pop() ?? ''
    for (const p of parts) addValue(props.normalize(p))
  }
  if (hasList.value) { open.value = true; active.value = 0 }
}
function addValue(v: string) {
  if (!v || atMax.value || model.value.some(x => String(x).toLowerCase() === v.toLowerCase())) return
  model.value = [...model.value, v]
}
function addCustom() {
  addValue(props.normalize(query.value))
  query.value = ''
}
function toggleOption(o: MultiOption) {
  if (o.disabled) return
  if (isSelected(o.value)) model.value = model.value.filter(v => v !== o.value)
  else if (!atMax.value) model.value = [...model.value, o.value]
  query.value = ''
  inputEl.value?.focus()
}
function remove(i: number) {
  model.value = model.value.filter((_, k) => k !== i)
  inputEl.value?.focus()
}
function onKeydown(e: KeyboardEvent) {
  const count = filtered.value.length + (props.creatable && query.value.trim() && !exact.value ? 1 : 0)
  if (e.key === 'ArrowDown') { e.preventDefault(); if (!open.value) openList(); else if (count) active.value = (active.value + 1) % count }
  else if (e.key === 'ArrowUp') { e.preventDefault(); if (count) active.value = (active.value - 1 + count) % count }
  else if (e.key === 'Enter') {
    if (open.value && filtered.value[active.value]) { e.preventDefault(); toggleOption(filtered.value[active.value]) }
    else if (props.creatable && query.value.trim()) { e.preventDefault(); addCustom() }
  }
  else if (e.key === 'Backspace' && !query.value && model.value.length) remove(model.value.length - 1)
  else if (e.key === 'Escape' && open.value) { e.preventDefault(); e.stopPropagation(); open.value = false }
}
defineExpose({ focus: () => inputEl.value?.focus() })
</script>

<style scoped>
.chip {
  display: inline-flex; align-items: center; gap: 2px; max-width: 100%;
  height: var(--badge-h-md); padding: 0 2px 0 0.5rem; margin-left: 2px;
  border-radius: var(--radius-sm); border: 1px solid var(--line);
  background: var(--surface-sunken); color: var(--ink); font-size: 0.8125rem; font-weight: 500;
}
.chip-x {
  display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px;
  border-radius: var(--radius-xs); color: var(--ink-muted);
}
.chip-x:hover { background: var(--surface-hover); color: var(--ink); }
.multi-input { flex: 1 0 6rem; height: calc(var(--control-h) - 8px); padding: 0 0.5rem; }
</style>
