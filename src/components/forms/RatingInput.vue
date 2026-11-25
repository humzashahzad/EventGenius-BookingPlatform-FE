<template>
  <!-- Read-only display: one image with a text alternative, no buttons. -->
  <span v-if="readonly" role="img" :aria-label="`${display} out of ${max} stars`" class="inline-flex items-center gap-0.5 align-middle" :class="$attrs.class">
    <span v-for="i in max" :key="i" class="relative inline-flex" :class="iconSize">
      <AppIcon icon="star" :class="`${iconSize} text-line-strong`" />
      <span v-if="fill(i) > 0" class="absolute inset-0 overflow-hidden" :style="{ width: `${fill(i) * 100}%` }">
        <AppIcon icon="star" :class="`${iconSize} star-on`" />
      </span>
    </span>
    <span v-if="showValue" class="ml-1 text-sm font-semibold text-ink num">{{ display }}</span>
  </span>

  <!-- Whole stars: a native radio group (←/→ change, Tab leaves). -->
  <div
    v-else-if="!allowHalf"
    role="radiogroup"
    class="inline-flex items-center gap-0.5"
    :class="$attrs.class"
    :aria-labelledby="labelledby || ctl.labelledBy.value"
    :aria-label="labelledby || ctl.labelledBy.value ? undefined : ariaLabel"
    :aria-describedby="ctl.describedBy.value"
    :aria-invalid="ctl.invalid.value || undefined"
    @mouseleave="hover = 0"
  >
    <label v-for="i in max" :key="i" class="star-opt" :class="boxSize" @mouseenter="hover = i">
      <input
        type="radio"
        class="sr-only"
        :id="i === 1 ? ctl.id.value : undefined"
        :name="groupName"
        :value="i"
        :checked="model === i"
        :required="ctl.required.value && i === 1"
        :disabled="ctl.disabled.value"
        @change="set(i)"
      />
      <AppIcon icon="star" :class="`${iconSize} ${i <= shown ? 'star-on' : 'text-ink-muted/60'}`" />
      <span class="sr-only">{{ i }} star{{ i > 1 ? 's' : '' }}<template v-if="labels[i - 1]">, {{ labels[i - 1] }}</template></span>
    </label>
    <span v-if="showText" class="ml-2 text-sm font-medium text-ink-secondary min-w-[5rem]" aria-hidden="true">{{ shown ? labels[Math.ceil(shown) - 1] : '' }}</span>
  </div>

  <!-- Half stars: a slider (←/→ ±0.5, Home/End). -->
  <div
    v-else
    :id="ctl.id.value"
    role="slider"
    tabindex="0"
    class="star-slider inline-flex items-center gap-0.5"
    :class="$attrs.class"
    :aria-valuemin="0"
    :aria-valuemax="max"
    :aria-valuenow="model ?? 0"
    :aria-valuetext="`${model ?? 0} out of ${max} stars`"
    :aria-labelledby="labelledby || ctl.labelledBy.value"
    :aria-label="labelledby || ctl.labelledBy.value ? undefined : ariaLabel"
    :aria-describedby="ctl.describedBy.value"
    :aria-disabled="ctl.disabled.value || undefined"
    @keydown="onKey"
    @mouseleave="hover = 0"
  >
    <span v-for="i in max" :key="i" class="relative inline-flex star-opt" :class="boxSize" @mousemove="onMove($event, i)" @click="set(hover || i)">
      <AppIcon icon="star" :class="`${iconSize} text-ink-muted/60`" />
      <span v-if="fillShown(i) > 0" class="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
        <span class="inline-flex overflow-hidden" :style="{ width: `calc(${iconPx}px * ${fillShown(i)})` }"><span class="inline-flex" :style="{ width: `${iconPx}px` }"><AppIcon icon="star" :class="`${iconSize} star-on shrink-0`" /></span></span>
      </span>
    </span>
    <span v-if="showText" class="ml-2 text-sm font-medium text-ink-secondary num" aria-hidden="true">{{ (hover || model || 0).toFixed(1) }}</span>
  </div>
</template>

<script setup lang="ts">
/**
 * Star rating. Interactive by default (radio group, or a slider with
 * `allowHalf`); `readonly` renders a non-interactive image with a label
 * (use it for review lists instead of disabled buttons).
 */
import { computed, ref, useId } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { useControl } from './useControl'

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<{
  max?: number
  allowHalf?: boolean
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  showValue?: boolean
  labels?: string[]
  name?: string
  labelledby?: string
  ariaLabel?: string
  id?: string
  invalid?: boolean
  disabled?: boolean
  required?: boolean
  describedby?: string
}>(), { max: 5, size: 'md', labels: () => ['Poor', 'Fair', 'Good', 'Very good', 'Excellent'], name: '', labelledby: undefined, ariaLabel: 'Rating' })
const model = defineModel<number | null>({ default: null })
const ctl = useControl({ ...props, size: undefined })
const uid = useId()
const groupName = computed(() => props.name || `eg-rate-${uid}`)
const hover = ref(0)
const shown = computed(() => hover.value || model.value || 0)
const display = computed(() => Math.round((Number(model.value) || 0) * 10) / 10)
const iconSize = computed(() => ({ sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' })[props.size])
const iconPx = computed(() => ({ sm: 16, md: 24, lg: 32 })[props.size])
// Hit areas: 32px (sm), 40px (md), 48px (lg) — the control scale.
const boxSize = computed(() => ({ sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-12 h-12' })[props.size])
const fill = (i: number) => Math.max(0, Math.min(1, (Number(model.value) || 0) - (i - 1)))
const fillShown = (i: number) => Math.max(0, Math.min(1, shown.value - (i - 1)))

function set(v: number) {
  if (ctl.disabled.value) return
  model.value = v
}
function onMove(e: MouseEvent, i: number) {
  const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
  hover.value = e.clientX - r.left < r.width / 2 ? i - 0.5 : i
}
function onKey(e: KeyboardEvent) {
  if (ctl.disabled.value) return
  const v = Number(model.value) || 0
  const step = 0.5
  const next: Record<string, number> = {
    ArrowRight: v + step, ArrowUp: v + step, ArrowLeft: v - step, ArrowDown: v - step, Home: 0.5, End: props.max,
  }
  if (e.key in next) {
    e.preventDefault()
    model.value = Math.min(props.max, Math.max(0.5, next[e.key]))
  }
}
</script>

<style scoped>
.star-on { color: #D97706; fill: currentColor; }
.star-opt { display: inline-flex; align-items: center; justify-content: center; border-radius: var(--radius-sm); cursor: pointer; transition: background-color .12s ease; }
.star-opt:hover { background-color: var(--surface-hover); }
.star-opt:has(input:focus-visible) { outline: 2px solid var(--focus-ring); outline-offset: 1px; }
.star-slider { border-radius: var(--radius-sm); }
</style>
