<template>
  <Teleport to="body">
    <Transition name="offcanvas">
      <div v-if="open" class="theme-customizer-overlay" @click.self="close">
        <div class="theme-customizer">
          <div class="theme-customizer-header">
            <h2 class="theme-customizer-title">Theme</h2>
            <button type="button" class="theme-customizer-close" aria-label="Close" @click="close">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div class="theme-customizer-body">
            <p class="theme-customizer-desc">Choose how the app looks. System follows your device setting.</p>
            <div class="theme-options">
              <button
                v-for="opt in options"
                :key="opt.mode"
                type="button"
                class="theme-option"
                :class="{ active: themeStore.themeMode === opt.mode }"
                @click="select(opt.mode)"
              >
                <span class="theme-option-icon" :aria-hidden="true">{{ opt.icon }}</span>
                <span class="theme-option-label">{{ opt.label }}</span>
                <span v-if="opt.mode === 'auto'" class="theme-option-hint">
                  {{ themeStore.resolvedTheme === 'dark' ? 'Dark' : 'Light' }}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useThemeStore, type ThemeMode } from '@/stores/theme'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ 'update:open': [value: boolean] }>()

const themeStore = useThemeStore()

const options: { mode: ThemeMode; label: string; icon: string }[] = [
  { mode: 'light', label: 'Light', icon: '☀️' },
  { mode: 'dark', label: 'Dark', icon: '🌙' },
  { mode: 'auto', label: 'System', icon: '💻' },
]

function close() {
  emit('update:open', false)
}

function select(mode: ThemeMode) {
  themeStore.setThemeMode(mode)
}
</script>

<style scoped>
.theme-customizer-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  justify-content: flex-end;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(4px);
}

.theme-customizer {
  width: 100%;
  max-width: 320px;
  height: 100%;
  background: var(--color-surface, #fff);
  border-left: 1px solid var(--color-border, #e2e8f0);
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
}

.theme-customizer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--color-border, #e2e8f0);
}

.theme-customizer-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-text, #0f172a);
}

.theme-customizer-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 0.5rem;
  background: transparent;
  color: var(--color-text-secondary, #64748b);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.theme-customizer-close:hover {
  background: var(--color-bg, #f1f5f9);
  color: var(--color-text, #0f172a);
}

.theme-customizer-body {
  padding: 1.25rem;
  flex: 1;
}

.theme-customizer-desc {
  font-size: 0.875rem;
  color: var(--color-text-secondary, #64748b);
  margin-bottom: 1.25rem;
}

.theme-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.theme-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 0.75rem;
  background: var(--color-bg, #f8fafc);
  color: var(--color-text, #0f172a);
  font-size: 0.9375rem;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
}

.theme-option:hover {
  border-color: var(--color-primary, #2563eb);
  background: var(--color-surface, #fff);
}

.theme-option.active {
  border-color: var(--color-primary, #2563eb);
  background: rgba(37, 99, 235, 0.08);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
}

.theme-option-icon {
  font-size: 1.25rem;
}

.theme-option-label {
  flex: 1;
}

.theme-option-hint {
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--color-text-muted, #94a3b8);
}

/* Dark mode overrides */
:global(html.dark) .theme-customizer {
  background: var(--card-bg);
  border-left-color: var(--border-color);
}

:global(html.dark) .theme-customizer-title {
  color: var(--text-primary);
}

:global(html.dark) .theme-customizer-close:hover {
  background: var(--color-bg-hover);
  color: var(--text-primary);
}

:global(html.dark) .theme-option {
  background: var(--input-bg);
  border-color: var(--border-color);
  color: var(--text-primary);
}

:global(html.dark) .theme-option:hover,
:global(html.dark) .theme-option.active {
  border-color: var(--input-focus-border);
  background: var(--color-bg-hover);
}

.offcanvas-enter-active,
.offcanvas-leave-active {
  transition: opacity 0.2s ease;
}

.offcanvas-enter-from,
.offcanvas-leave-to {
  opacity: 0;
}

.offcanvas-enter-active .theme-customizer,
.offcanvas-leave-active .theme-customizer {
  transition: transform 0.25s ease;
}

.offcanvas-enter-from .theme-customizer,
.offcanvas-leave-to .theme-customizer {
  transform: translateX(100%);
}
</style>
