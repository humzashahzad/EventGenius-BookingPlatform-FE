<template>
  <div>
    <div class="flex items-center justify-between gap-2 mb-1.5">
      <label :for="id" class="form-label !mb-0">{{ label }}<span v-if="markRequired" class="req !ml-1.5" aria-hidden="true">*</span></label>
      <slot name="label-extra" />
    </div>
    <div class="relative">
      <input
        :id="id"
        :value="modelValue"
        :type="visible ? 'text' : 'password'"
        class="form-input !pr-11"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :required="required"
        :minlength="minlength"
        :aria-invalid="!!error"
        :aria-describedby="describedBy"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        @blur="emit('blur')"
      />
      <button
        type="button"
        class="absolute right-1 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-muted hover:text-ink hover:bg-surface-hover"
        :aria-label="visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`"
        :aria-pressed="visible"
        :aria-controls="id"
        @click="visible = !visible"
      >
        <AppIcon :icon="visible ? 'eye-off' : 'eye'" class="w-[18px] h-[18px]" />
      </button>
    </div>
    <p v-if="error" :id="`${id}-error`" class="form-error">{{ error }}</p>
    <p v-else-if="hint" :id="`${id}-hint`" class="form-hint">{{ hint }}</p>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'

const props = withDefaults(defineProps<{
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

const visible = ref(false)
const describedBy = computed(() => (props.error ? `${props.id}-error` : props.hint ? `${props.id}-hint` : undefined))
</script>
