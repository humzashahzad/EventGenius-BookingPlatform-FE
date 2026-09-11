<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="$emit('update:visible', false)"
      >
        <div
          class="relative w-full bg-white dark:bg-warm-800 rounded-2xl shadow-float border border-warm-200 dark:border-warm-700 overflow-hidden"
          :class="sizeClass"
          :style="width ? { maxWidth: width } : {}"
        >
          <div class="flex items-center justify-between px-5 py-4 border-b border-warm-200 dark:border-warm-700">
            <h5 class="text-lg font-semibold text-warm-800 dark:text-white">{{ title }}</h5>
            <button
              type="button"
              class="p-1.5 rounded-xl hover:bg-warm-100 dark:hover:bg-warm-700 text-warm-400 hover:text-warm-600 dark:hover:text-warm-300 transition-colors"
              @click="$emit('update:visible', false)"
              aria-label="Close"
            >
              <AppIcon icon="x" class="w-5 h-5" />
            </button>
          </div>
          <div class="px-5 py-4">
            <slot />
          </div>
          <div v-if="$slots.footer" class="px-5 py-4 border-t border-warm-200 dark:border-warm-700 bg-warm-50 dark:bg-warm-800/50">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
    <Transition name="backdrop">
      <div
        v-if="visible"
        class="fixed inset-0 z-40 bg-warm-900/50 backdrop-blur-sm"
      />
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'

const props = defineProps<{
  visible: boolean
  title: string
  width?: string
  size?: 'sm' | 'lg' | 'xl'
}>()

defineEmits<{
  'update:visible': [value: boolean]
}>()

const sizeClass = computed(() => {
  if (props.size === 'sm') return 'max-w-md'
  if (props.size === 'lg') return 'max-w-2xl'
  if (props.size === 'xl') return 'max-w-4xl'
  return 'max-w-lg'
})
</script>

<style scoped>
.modal-enter-active, .modal-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.modal-enter-from, .modal-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
.backdrop-enter-active, .backdrop-leave-active {
  transition: opacity 0.15s ease;
}
.backdrop-enter-from, .backdrop-leave-to {
  opacity: 0;
}
</style>
