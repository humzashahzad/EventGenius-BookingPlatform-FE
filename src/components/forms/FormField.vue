<template>
  <div :class="['form-field', disabled && 'opacity-90']">
    <div v-if="label || $slots.label || $slots['label-extra']" class="form-label-row" :class="labelHidden && 'sr-only'">
      <component :is="group ? 'span' : 'label'" :id="labelId" :for="group ? undefined : fieldId" class="form-label">
        <slot name="label">{{ label }}</slot><span v-if="required" class="req" aria-hidden="true">*</span><span v-else-if="optional" class="form-optional"> (optional)</span>
      </component>
      <slot name="label-extra" />
    </div>
    <slot :id="fieldId" :described-by="describedBy" :invalid="invalid" />
    <div v-if="errorText || hint || $slots.hint || showCount" class="flex items-start justify-between gap-3">
      <p v-if="errorText" :id="`${fieldId}-error`" class="form-error flex items-start gap-1.5">
        <AppIcon icon="alert-circle" class="w-3.5 h-3.5 mt-0.5 shrink-0" />{{ errorText }}
      </p>
      <p v-else-if="hint || $slots.hint" :id="`${fieldId}-hint`" class="form-hint"><slot name="hint">{{ hint }}</slot></p>
      <p v-if="showCount" :id="`${fieldId}-count`" class="form-hint num ml-auto shrink-0" :class="overLimit && '!text-danger-text font-medium'" aria-live="polite">
        {{ (count ?? 0).toLocaleString('en-PK') }}<template v-if="maxlength"> / {{ maxlength.toLocaleString('en-PK') }}</template>
      </p>
    </div>
    <slot name="after" />
  </div>
</template>

<script setup lang="ts">
/**
 * Label + control + hint/error wrapper. Every control placed inside picks up
 * the id, aria-describedby, aria-invalid, required, disabled and size.
 */
import { computed, useId } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { provideField, type ControlSize } from './useControl'

const props = withDefaults(defineProps<{
  label?: string
  /** id of the inner control (auto-generated when omitted) */
  id?: string
  hint?: string
  /** Error message; arrays (Laravel `errors.field`) show the first entry. */
  error?: string | string[] | null
  required?: boolean
  /** Adds "(optional)" after the label. */
  optional?: boolean
  disabled?: boolean
  size?: ControlSize
  /** Visually hide the label (still read by screen readers). */
  labelHidden?: boolean
  /** Set for radio/checkbox groups: label becomes the group's aria-labelledby. */
  group?: boolean
  /** Character counter: current length (and optional max). */
  count?: number
  maxlength?: number
}>(), {
  label: '', id: undefined, hint: '', error: null, size: undefined, count: undefined, maxlength: undefined,
})

const autoId = `eg-f-${useId()}`
const fieldId = computed(() => props.id || autoId)
const labelId = computed(() => `${fieldId.value}-label`)
const errorText = computed(() => (Array.isArray(props.error) ? props.error[0] : props.error) || '')
const invalid = computed(() => !!errorText.value)
const showCount = computed(() => props.count !== undefined)
const overLimit = computed(() => !!props.maxlength && (props.count ?? 0) > props.maxlength)
const describedBy = computed(() => {
  const ids: string[] = []
  if (errorText.value) ids.push(`${fieldId.value}-error`)
  else if (props.hint) ids.push(`${fieldId.value}-hint`)
  if (showCount.value) ids.push(`${fieldId.value}-count`)
  return ids.join(' ') || undefined
})

provideField({
  id: fieldId,
  labelId,
  describedBy,
  invalid,
  required: computed(() => props.required),
  disabled: computed(() => props.disabled),
  size: computed(() => props.size),
})
</script>
