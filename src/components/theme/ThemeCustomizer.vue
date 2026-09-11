<template>
  <Teleport to="body">
    <Transition name="backdrop">
      <div
        v-if="open"
        class="fixed inset-0 z-50 bg-warm-900/50 backdrop-blur-sm"
        aria-hidden="true"
        @click="close"
      />
    </Transition>
    <Transition name="panel">
      <aside
        v-if="open"
        class="fixed top-0 right-0 z-50 w-full max-w-sm h-full bg-white dark:bg-warm-800 shadow-float border-l border-warm-200 dark:border-warm-700 flex flex-col"
      >
        <div class="flex items-center justify-between h-14 px-4 border-b border-warm-200 dark:border-warm-700">
          <h2 class="font-semibold text-warm-800 dark:text-white">Theme</h2>
          <button
            type="button"
            class="p-2 rounded-xl hover:bg-warm-100 dark:hover:bg-warm-700 text-warm-500 dark:text-warm-400"
            aria-label="Close"
            @click="close"
          >
            <AppIcon icon="x" class="w-5 h-5" />
          </button>
        </div>
        <div class="p-4 flex-1 overflow-auto">
          <p class="text-sm text-warm-500 dark:text-warm-400 mb-4">
            Choose how the app looks. System follows your device setting.
          </p>
          <div class="flex flex-col gap-2">
            <button
              v-for="opt in options"
              :key="opt.mode"
              type="button"
              class="flex items-center gap-3 p-3 rounded-2xl border text-left transition-colors"
              :class="themeStore.themeMode === opt.mode
                ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                : 'border-warm-200 dark:border-warm-700 hover:bg-warm-50 dark:hover:bg-warm-700/50'"
              @click="select(opt.mode)"
            >
              <span class="w-8 h-8 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                <AppIcon :icon="opt.icon" class="w-4 h-4" />
              </span>
              <span class="flex-1 font-medium text-warm-800 dark:text-white">{{ opt.label }}</span>
              <span v-if="opt.mode === 'auto'" class="text-sm text-warm-500 dark:text-warm-400">
                {{ themeStore.resolvedTheme === 'dark' ? 'Dark' : 'Light' }}
              </span>
            </button>
          </div>
        </div>
      </aside>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useThemeStore, type ThemeMode } from '@/stores/theme'
import AppIcon from '@/components/ui/AppIcon.vue'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ 'update:open': [value: boolean] }>()

const themeStore = useThemeStore()

const options: { mode: ThemeMode; label: string; icon: string }[] = [
  { mode: 'light', label: 'Light', icon: 'sun' },
  { mode: 'dark', label: 'Dark', icon: 'moon' },
  { mode: 'auto', label: 'System', icon: 'device-desktop' },
]

function close() {
  emit('update:open', false)
}

function select(mode: ThemeMode) {
  themeStore.setThemeMode(mode)
}
</script>

<style scoped>
.backdrop-enter-active,
.backdrop-leave-active {
  transition: opacity 0.15s ease;
}
.backdrop-enter-from,
.backdrop-leave-to {
  opacity: 0;
}
.panel-enter-active,
.panel-leave-active {
  transition: transform 0.25s ease;
}
.panel-enter-from,
.panel-leave-to {
  transform: translateX(100%);
}
</style>
