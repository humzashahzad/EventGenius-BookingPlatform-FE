<template>
  <!-- Read-only stars are one labelled image (no disabled buttons); editable ones use RatingInput. -->
  <RatingInput :model-value="modelValue ?? 0" :readonly="readonly" :size="size" aria-label="Rating" @update:model-value="v => emit('update:modelValue', v ?? 0)" />
</template>

<script setup lang="ts">
import { RatingInput } from '@/components/forms'

withDefaults(defineProps<{ modelValue?: number | null; readonly?: boolean; size?: 'sm' | 'md' | 'lg' }>(), {
  modelValue: 0,
  readonly: false,
  size: 'md',
})
const emit = defineEmits<{ 'update:modelValue': [value: number] }>()
</script>
