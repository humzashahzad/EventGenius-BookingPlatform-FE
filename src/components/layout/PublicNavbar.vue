<template>
  <nav
    class="sticky top-0 z-[1000] px-4 py-3 bg-white/80 dark:bg-warm-900/80 backdrop-blur-xl border-b border-transparent transition-all duration-300"
    :class="{ 'bg-white/95 dark:bg-warm-900/95 border-warm-200 dark:border-warm-700 shadow-soft': scrolled }"
  >
    <div class="content-container flex items-center justify-between">
      <RouterLink to="/" class="flex items-center gap-2.5 shrink-0">
        <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-primary-400 flex items-center justify-center shadow-lg shadow-primary-500/20">
          <span class="text-white font-extrabold text-sm">EG</span>
        </div>
        <span class="font-extrabold text-base sm:text-lg text-warm-800 dark:text-white tracking-tight">EventGenius</span>
      </RouterLink>

      <button
        type="button"
        class="lg:hidden p-2.5 rounded-xl border border-warm-200 dark:border-warm-700 bg-white dark:bg-warm-800 text-warm-600 dark:text-warm-300 hover:bg-warm-50 dark:hover:bg-warm-700"
        aria-label="Toggle navigation"
        @click="mobileOpen = !mobileOpen"
      >
        <AppIcon :icon="mobileOpen ? 'x' : 'menu-2'" class="w-5 h-5" />
      </button>

      <div
        class="flex-1 flex items-center justify-between ml-6 max-lg:ml-0 max-lg:absolute max-lg:left-0 max-lg:right-0 max-lg:top-full max-lg:bg-white max-lg:dark:bg-warm-900 max-lg:border-b max-lg:border-warm-200 max-lg:dark:border-warm-700 max-lg:shadow-elevated max-lg:flex-col max-lg:p-4 max-lg:gap-4 max-lg:flex-1 max-lg:max-h-[80vh] max-lg:overflow-y-auto"
        :class="mobileOpen ? 'max-lg:flex' : 'max-lg:hidden'"
      >
        <div class="flex items-center gap-1 max-lg:flex-col max-lg:w-full">
          <RouterLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="px-4 py-2 text-sm font-medium rounded-xl transition-colors"
            :class="isActive(link.to)
              ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
              : 'text-warm-600 dark:text-warm-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50/50 dark:hover:bg-primary-900/10'"
            @click="mobileOpen = false"
          >
            {{ link.label }}
          </RouterLink>
        </div>
        <div class="flex items-center gap-2 max-lg:w-full max-lg:flex-col">
          <template v-if="authStore.isLoggedIn">
            <RouterLink
              :to="authStore.defaultRoute"
              class="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 text-sm font-semibold text-white bg-gradient-to-r from-primary-500 to-primary-400 rounded-xl shadow-md shadow-primary-500/20 hover:shadow-lg transition-all"
              @click="mobileOpen = false"
            >
              <AppIcon icon="layout-dashboard" class="w-4 h-4" />
              Dashboard
            </RouterLink>
          </template>
          <template v-else>
            <RouterLink
              to="/customer/sign-in"
              class="px-3 py-1.5 sm:px-4 sm:py-2 text-sm font-semibold text-warm-600 dark:text-warm-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-xl transition-colors"
              @click="mobileOpen = false"
            >
              Sign In
            </RouterLink>
            <RouterLink
              to="/customer/sign-up"
              class="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 text-sm font-semibold text-white bg-gradient-to-r from-primary-500 to-primary-400 rounded-xl shadow-md shadow-primary-500/20 hover:shadow-lg transition-all"
              @click="mobileOpen = false"
            >
              Get Started
            </RouterLink>
          </template>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppIcon from '@/components/ui/AppIcon.vue'

const authStore = useAuthStore()
const route = useRoute()
const mobileOpen = ref(false)
const scrolled = ref(false)

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/venues', label: 'Venues' },
  { to: '/shop/sign-up', label: 'For Shop Owners' },
]

function isActive(to: string) {
  if (to === '/') return route.path === '/'
  return route.path.startsWith(to)
}

function handleScroll() {
  scrolled.value = window.scrollY > 20
}

onMounted(() => window.addEventListener('scroll', handleScroll, { passive: true }))
onBeforeUnmount(() => window.removeEventListener('scroll', handleScroll))
</script>
