import { defineStore } from 'pinia'
import { ref, computed, watch, onMounted } from 'vue'

export type ThemeMode = 'light' | 'dark' | 'auto'
export type ResolvedTheme = 'light' | 'dark'

export const useThemeStore = defineStore('theme', () => {
  const themeMode = ref<ThemeMode>((localStorage.getItem('themeMode') as ThemeMode) || 'dark')
  const systemPreference = ref<ResolvedTheme>('light')

  // Computed resolved theme (actual theme to apply)
  const resolvedTheme = computed<ResolvedTheme>(() => {
    if (themeMode.value === 'auto') {
      return systemPreference.value
    }
    return themeMode.value
  })

  // Detect system theme preference
  function detectSystemTheme(): ResolvedTheme {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
    return 'light'
  }

  // Listen for system theme changes
  function setupSystemThemeListener() {
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

      // Set initial value
      systemPreference.value = detectSystemTheme()

      // Listen for changes
      const handler = (e: MediaQueryListEvent) => {
        systemPreference.value = e.matches ? 'dark' : 'light'
      }

      mediaQuery.addEventListener('change', handler)

      // Return cleanup function
      return () => mediaQuery.removeEventListener('change', handler)
    }
    return () => {}
  }

  // Apply theme via class for Tailwind dark mode
  function applyTheme(theme: ResolvedTheme) {
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(theme)
  }

  // Cycle through themes: light -> dark -> auto -> light
  function toggle() {
    if (themeMode.value === 'light') {
      themeMode.value = 'dark'
    } else if (themeMode.value === 'dark') {
      themeMode.value = 'auto'
    } else {
      themeMode.value = 'light'
    }
  }

  // Set theme mode
  function setThemeMode(mode: ThemeMode) {
    themeMode.value = mode
  }

  // Watch theme mode changes
  watch(themeMode, (newMode) => {
    localStorage.setItem('themeMode', newMode)
  }, { immediate: true })

  // Watch resolved theme and apply it
  watch(resolvedTheme, (newTheme) => {
    applyTheme(newTheme)
  }, { immediate: true })

  // Initialize system theme detection
  setupSystemThemeListener()

  return {
    themeMode,
    resolvedTheme,
    toggle,
    setThemeMode
  }
})
