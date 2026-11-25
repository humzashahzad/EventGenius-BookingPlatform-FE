<template>
  <FormField :id="id" :label="label" :required="markRequired" :error="error" :hint="hint">
    <template #label-extra><slot name="label-extra" /></template>
    <PasswordInput
      :model-value="modelValue"
      :placeholder="placeholder"
      :autocomplete="autocomplete as 'current-password' | 'new-password'"
      :required="required"
      :minlength="minlength"
      :toggle-name="label.toLowerCase()"
      @update:model-value="v => emit('update:modelValue', v ?? '')"
      @blur="emit('blur')"
    />
    <template #after><slot /></template>
  </FormField>
</template>

<script setup lang="ts">
/** Password field used by the auth and profile forms (FormField + PasswordInput). */
import { FormField, PasswordInput } from '@/components/forms'

withDefaults(defineProps<{
  id: string
  label: string
  modelValue: string
  placeholder?: string
  autocomplete?: string
  required?: boolean
  /** Show the red asterisk next to the label (forms that mark required fields). */
  markRequired?: boolean
  minlength?: number
  error?: string
  hint?: string
}>(), {
  placeholder: '',
  autocomplete: 'current-password',
  required: false,
  markRequired: false,
  minlength: undefined,
  error: '',
  hint: '',
})
const emit = defineEmits<{ 'update:modelValue': [value: string]; blur: [] }>()
</script>
