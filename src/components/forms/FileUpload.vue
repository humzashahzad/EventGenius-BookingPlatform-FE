<template>
  <div :class="$attrs.class">
    <button
      :id="ctl.id.value"
      type="button"
      class="dropzone"
      :class="[over && 'is-over', compact && 'is-compact', ctl.invalid.value && 'is-invalid']"
      :disabled="ctl.disabled.value || full"
      :aria-describedby="[ctl.describedBy.value, `${uid}-rules`].filter(Boolean).join(' ')"
      @click="input?.click()"
      @dragenter.prevent="over = true"
      @dragover.prevent="over = true"
      @dragleave.prevent="over = false"
      @drop.prevent="onDrop"
    >
      <span class="icon-chip tone-brand" :class="compact && 'icon-chip-sm'"><AppIcon :icon="icon" :class="compact ? 'w-4 h-4' : 'w-5 h-5'" /></span>
      <span class="min-w-0" :class="compact ? 'text-left' : 'text-center'">
        <span class="block text-sm font-medium text-ink">
          <slot name="title">{{ full ? 'Limit reached' : title }} <span v-if="!full" class="text-brand-text underline underline-offset-2">browse</span></slot>
        </span>
        <span :id="`${uid}-rules`" class="block text-xs text-ink-muted mt-0.5">{{ rulesText }}</span>
      </span>
    </button>
    <input ref="input" type="file" class="sr-only" tabindex="-1" aria-hidden="true" :accept="accept" :multiple="multiple" @change="onPick" />

    <ul v-if="problems.length" class="mt-2 space-y-0.5" role="alert">
      <li v-for="p in problems" :key="p" class="form-error !mt-0 flex items-start gap-1.5"><AppIcon icon="alert-circle" class="w-3.5 h-3.5 mt-0.5 shrink-0" />{{ p }}</li>
    </ul>

    <ul v-if="!instant && model.length" class="mt-3" :class="grid ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3' : 'space-y-2'">
      <li v-for="(f, i) in model" :key="f.name + f.size + i" :class="grid ? 'relative rounded-lg border border-line overflow-hidden bg-surface' : 'flex items-center gap-3 rounded-lg border border-line bg-surface p-2 pr-1'">
        <template v-if="grid">
          <img v-if="previews[i]" :src="previews[i]" :alt="f.name" class="w-full aspect-[4/3] object-cover bg-surface-sunken" />
          <div v-else class="w-full aspect-[4/3] bg-surface-sunken flex items-center justify-center"><AppIcon icon="file" class="w-6 h-6 text-ink-muted" /></div>
          <div class="flex items-center gap-1 pl-2 pr-1 py-1 border-t border-line">
            <span class="text-xs text-ink-secondary truncate flex-1">{{ f.name }}</span>
            <button type="button" class="btn-icon btn-icon-sm" :aria-label="`Remove ${f.name}`" @click="remove(i)"><AppIcon icon="x" class="w-4 h-4" /></button>
          </div>
          <div v-if="progress?.[i] !== undefined" class="absolute inset-x-0 top-0 h-1 bg-surface-sunken"><div class="h-full bg-brand-strong" :style="{ width: `${progress[i]}%` }" /></div>
        </template>
        <template v-else>
          <img v-if="previews[i]" :src="previews[i]" alt="" class="w-10 h-10 rounded object-cover shrink-0" />
          <span v-else class="icon-chip icon-chip-sm tone-neutral"><AppIcon icon="file" class="w-4 h-4" /></span>
          <span class="min-w-0 flex-1">
            <span class="block text-sm text-ink truncate">{{ f.name }}</span>
            <span class="block text-xs text-ink-muted num">{{ formatBytes(f.size) }}</span>
            <slot name="progress" :file="f" :index="i">
              <span v-if="progress?.[i] !== undefined" class="block h-1 mt-1 rounded-full bg-surface-sunken overflow-hidden" role="progressbar" :aria-valuenow="progress[i]" aria-valuemin="0" aria-valuemax="100" :aria-label="`Uploading ${f.name}`">
                <span class="block h-full bg-brand-strong" :style="{ width: `${progress[i]}%` }" />
              </span>
            </slot>
          </span>
          <button type="button" class="btn-icon btn-icon-sm" :aria-label="`Remove ${f.name}`" @click="remove(i)"><AppIcon icon="x" class="w-4 h-4" /></button>
        </template>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
/**
 * Drag-and-drop / click-to-browse file picker with type & size validation.
 * - Default: keeps the chosen files in v-model (File[]) and lists them with previews.
 * - `instant`: does not keep files; just emits `select(files)` so the page can upload straight away.
 * `progress` (array of 0–100 per file) draws progress bars; or use the `progress` slot.
 */
import { computed, onBeforeUnmount, ref, useId, watch } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { useControl } from './useControl'
import { formatBytes } from './utils'

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<{
  accept?: string
  multiple?: boolean
  /** Max size per file in MB. */
  maxSize?: number
  maxFiles?: number
  instant?: boolean
  grid?: boolean
  compact?: boolean
  title?: string
  hint?: string
  icon?: string
  progress?: number[]
  id?: string
  invalid?: boolean
  disabled?: boolean
  describedby?: string
}>(), { accept: '', maxSize: undefined, maxFiles: undefined, title: 'Drag files here or', hint: '', icon: 'cloud-upload', progress: undefined })
const model = defineModel<File[]>({ default: () => [] })
const emit = defineEmits<{ select: [files: File[]]; error: [messages: string[]] }>()
const ctl = useControl(props)
const uid = `eg-fu-${useId()}`
const input = ref<HTMLInputElement | null>(null)
const over = ref(false)
const problems = ref<string[]>([])
const full = computed(() => !props.instant && props.maxFiles !== undefined && model.value.length >= props.maxFiles)

const rulesText = computed(() => {
  if (props.hint) return props.hint
  const parts: string[] = []
  if (props.accept) parts.push(props.accept.split(',').map(a => a.trim().replace('image/*', 'Images').replace('video/*', 'Videos').replace(/^\./, '').toUpperCase()).join(', '))
  if (props.maxSize) parts.push(`up to ${props.maxSize} MB each`)
  if (props.maxFiles) parts.push(`max ${props.maxFiles} file${props.maxFiles > 1 ? 's' : ''}`)
  return parts.join(' · ') || (props.multiple ? 'You can choose several files.' : 'One file.')
})

function accepts(f: File) {
  if (!props.accept) return true
  return props.accept.split(',').map(a => a.trim().toLowerCase()).some(a =>
    a.endsWith('/*') ? f.type.toLowerCase().startsWith(a.slice(0, -1)) : a.startsWith('.') ? f.name.toLowerCase().endsWith(a) : f.type.toLowerCase() === a)
}
function take(list: File[]) {
  const errs: string[] = []
  let ok = list.filter(f => {
    if (!accepts(f)) { errs.push(`${f.name}: this file type isn't allowed.`); return false }
    if (props.maxSize && f.size > props.maxSize * 1024 * 1024) { errs.push(`${f.name} is ${formatBytes(f.size)}; the limit is ${props.maxSize} MB.`); return false }
    return true
  })
  if (!props.multiple) ok = ok.slice(0, 1)
  if (!props.instant && props.maxFiles !== undefined) {
    const room = props.maxFiles - (props.multiple ? model.value.length : 0)
    if (ok.length > room) { errs.push(`Only ${props.maxFiles} file${props.maxFiles > 1 ? 's' : ''} allowed.`); ok = ok.slice(0, Math.max(0, room)) }
  }
  problems.value = errs
  if (errs.length) emit('error', errs)
  if (!ok.length) return
  if (!props.instant) model.value = props.multiple ? [...model.value, ...ok] : ok
  emit('select', ok)
}
function onPick(e: Event) {
  const el = e.target as HTMLInputElement
  take(Array.from(el.files ?? []))
  el.value = ''
}
function onDrop(e: DragEvent) {
  over.value = false
  if (ctl.disabled.value) return
  take(Array.from(e.dataTransfer?.files ?? []))
}
function remove(i: number) {
  model.value = model.value.filter((_, k) => k !== i)
}

// Object-URL previews for images (revoked when files change).
const previews = ref<(string | null)[]>([])
watch(model, files => {
  previews.value.forEach(u => u && URL.revokeObjectURL(u))
  previews.value = files.map(f => (f.type.startsWith('image/') ? URL.createObjectURL(f) : null))
}, { immediate: true })
onBeforeUnmount(() => previews.value.forEach(u => u && URL.revokeObjectURL(u)))
defineExpose({ open: () => input.value?.click() })
</script>

<style scoped>
.dropzone {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem;
  width: 100%; padding: 1.5rem 1rem; border-radius: var(--radius-lg);
  border: 2px dashed rgb(var(--c-line-strong) / 0.55); background: var(--surface);
  color: var(--ink-secondary); transition: border-color .15s ease, background-color .15s ease;
}
.dropzone.is-compact { flex-direction: row; justify-content: flex-start; gap: 0.75rem; padding: 0.75rem 1rem; }
.dropzone:hover:not(:disabled), .dropzone.is-over { border-color: var(--brand-text); background: var(--brand-soft); }
.dropzone.is-invalid { border-color: var(--danger); }
.dropzone:disabled { opacity: .55; cursor: not-allowed; }
</style>
