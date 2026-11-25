/**
 * Shared plumbing for the form components in this folder.
 *
 * - FormField provides a context (ids, error state, size) that every control
 *   inside it picks up automatically, so labels/hints/errors are linked with
 *   `for`, `aria-describedby` and `aria-invalid` without extra wiring.
 * - Controls can also be used on their own: pass `id`, `invalid`, `size`, …
 *   as props and they behave the same.
 */
import { computed, inject, provide, useId, type ComputedRef, type InjectionKey } from 'vue'

export type ControlSize = 'sm' | 'md' | 'lg'

export interface FieldContext {
  id: ComputedRef<string>
  labelId: ComputedRef<string>
  describedBy: ComputedRef<string | undefined>
  invalid: ComputedRef<boolean>
  required: ComputedRef<boolean>
  disabled: ComputedRef<boolean>
  size: ComputedRef<ControlSize | undefined>
}

export const FIELD_KEY: InjectionKey<FieldContext> = Symbol('eg-form-field')

export function provideField(ctx: FieldContext) {
  provide(FIELD_KEY, ctx)
}

export interface ControlProps {
  id?: string
  size?: ControlSize
  invalid?: boolean
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  describedby?: string
}

/** Resolve id / size / state for a control from its props and the surrounding FormField. */
export function useControl(props: ControlProps) {
  const field = inject(FIELD_KEY, null)
  const fallbackId = `eg-${useId()}`
  const id = computed(() => props.id || field?.id.value || fallbackId)
  const size = computed<ControlSize>(() => props.size || field?.size.value || 'md')
  const invalid = computed(() => !!props.invalid || !!field?.invalid.value)
  const disabled = computed(() => !!props.disabled || !!field?.disabled.value)
  const required = computed(() => !!props.required || !!field?.required.value)
  const describedBy = computed(() => [props.describedby, field?.describedBy.value].filter(Boolean).join(' ') || undefined)
  const labelledBy = computed(() => field?.labelId.value)
  /** Classes for the bordered `.control` box. */
  const boxClass = computed(() => [
    'control',
    size.value !== 'md' && `control-${size.value}`,
    invalid.value && 'is-invalid',
    disabled.value && 'is-disabled',
    props.readonly && 'is-readonly',
  ])
  /** Icon size that matches the control size. */
  const iconClass = computed(() => (size.value === 'lg' ? 'w-5 h-5' : 'w-4 h-4'))
  return { field, id, size, invalid, disabled, required, describedBy, labelledBy, boxClass, iconClass }
}

/** Split `$attrs` so class/style land on the wrapper and everything else on the inner input. */
export function splitAttrs(attrs: Record<string, unknown>): { wrapper: Record<string, any>; input: Record<string, any> } {
  const { class: cls, style, ...rest } = attrs
  return { wrapper: { class: cls, style }, input: rest }
}
