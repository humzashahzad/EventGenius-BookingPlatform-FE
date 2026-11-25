<template>
  <div class="inline-flex items-center gap-0.5" :role="readonly ? 'img' : 'radiogroup'" :aria-label="`${modelValue || 0} out of 5 stars`">
    <button
      v-for="i in 5"
      :key="i"
      type="button"
      :disabled="readonly"
      :aria-label="`${i} star${i > 1 ? 's' : ''}`"
      class="leading-none"
      :class="readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110 transition-transform'"
      @click="!readonly && emit('update:modelValue', i)"
      @mouseenter="!readonly && (hover = i)"
      @mouseleave="hover = 0"
    >
      <AppIcon
        :icon="i <= (hover || modelValue || 0) ? 'star-filled' : 'star'"
        :class="`${sizeClass} ${i <= (hover || modelValue || 0) ? 'fill-current text-[#D97706]' : 'text-line-strong'}`"
      />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'

const props = withDefaults(defineProps<{ modelValue?: number | null; readonly?: boolean; size?: 'sm' | 'md' | 'lg' }>(), {
  modelValue: 0,
  readonly: false,
  size: 'md',
})
const emit = defineEmits<{ 'update:modelValue': [value: number] }>()
const hover = ref(0)
const sizeClass = computed(() => ({ sm: 'w-3.5 h-3.5', md: 'w-5 h-5', lg: 'w-7 h-7' })[props.size])
</script>
