<template>
  <!-- Accessible star rating input: a native radio group, so arrow keys,
       Tab and screen readers work out of the box. -->
  <div
    class="star-input inline-flex items-center gap-1"
    role="radiogroup"
    :aria-labelledby="labelledby"
    :aria-describedby="describedby"
    @mouseleave="hover = 0"
  >
    <label
      v-for="i in 5"
      :key="i"
      class="star-option"
      :class="sizeBox"
      @mouseenter="hover = i"
    >
      <input
        type="radio"
        class="sr-only"
        :name="name"
        :value="i"
        :checked="modelValue === i"
        :required="required && i === 1"
        @change="emit('update:modelValue', i)"
      />
      <AppIcon
        icon="star"
        :class="`${sizeIcon} ${i <= shown ? 'text-[#F59E0B] fill-current' : 'text-ink-muted/60'}`"
      />
      <span class="sr-only">{{ i }} star{{ i > 1 ? 's' : '' }}<template v-if="labels[i - 1]">, {{ labels[i - 1] }}</template></span>
    </label>
    <span v-if="showText" class="ml-2 text-sm font-medium text-ink-secondary min-w-[5rem]" aria-hidden="true">
      {{ shown ? labels[shown - 1] : '' }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'

const props = withDefaults(defineProps<{
  modelValue?: number | null
  name: string
  labelledby?: string
  describedby?: string
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  required?: boolean
}>(), {
  modelValue: null,
  labelledby: undefined,
  describedby: undefined,
  size: 'md',
  showText: false,
  required: false,
})
const emit = defineEmits<{ 'update:modelValue': [value: number] }>()

const labels = ['Poor', 'Fair', 'Good', 'Very good', 'Excellent']
const hover = ref(0)
const shown = computed(() => hover.value || props.modelValue || 0)
const sizeIcon = computed(() => ({ sm: 'w-5 h-5', md: 'w-6 h-6', lg: 'w-8 h-8' })[props.size])
const sizeBox = computed(() => ({ sm: 'w-8 h-8', md: 'w-9 h-9', lg: 'w-11 h-11' })[props.size])
</script>

<style scoped>
.star-option {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background-color .12s ease;
}
.star-option:hover { background-color: var(--surface-hover); }
.star-option:has(input:focus-visible) {
  outline: 2px solid var(--focus-ring);
  outline-offset: 1px;
}
</style>
