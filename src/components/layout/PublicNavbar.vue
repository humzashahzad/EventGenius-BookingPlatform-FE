<template>
  <nav
    class="sticky top-0 z-[1000] bg-surface border-b transition-shadow duration-200"
    :class="scrolled ? 'border-line shadow-sm' : 'border-line/70'"
    aria-label="Main"
  >
    <div class="content-container flex items-center justify-between h-16">
      <RouterLink to="/" class="flex items-center gap-2.5 shrink-0 rounded-md" @click="mobileOpen = false">
        <AppLogo class="w-8 h-8" />
        <span class="font-display font-bold text-[1.0625rem] text-ink tracking-tight">EventGenius</span>
      </RouterLink>

      <button
        type="button"
        class="lg:hidden btn-icon border-line"
        :aria-expanded="mobileOpen"
        aria-controls="public-nav-menu"
        aria-label="Toggle navigation"
        @click="mobileOpen = !mobileOpen"
      >
        <AppIcon :icon="mobileOpen ? 'x' : 'menu-2'" class="w-5 h-5" />
      </button>

      <div
        id="public-nav-menu"
        class="flex-1 flex items-center justify-between ml-10 max-lg:ml-0 max-lg:absolute max-lg:left-0 max-lg:right-0 max-lg:top-full max-lg:bg-surface max-lg:border-b max-lg:border-line max-lg:shadow-lg max-lg:flex-col max-lg:items-stretch max-lg:px-4 max-lg:pt-2 max-lg:pb-4 max-lg:gap-3 max-lg:max-h-[calc(100vh-4rem)] max-lg:overflow-y-auto"
        :class="mobileOpen ? 'max-lg:flex' : 'max-lg:hidden'"
      >
        <div class="flex items-center gap-1 max-lg:flex-col max-lg:items-stretch">
          <RouterLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="relative inline-flex items-center px-3 h-10 max-lg:h-11 text-sm font-medium rounded-md transition-colors"
            :class="isActive(link.to)
              ? 'text-ink lg:after:absolute lg:after:left-3 lg:after:right-3 lg:after:-bottom-[13px] lg:after:h-0.5 lg:after:bg-brand-strong max-lg:bg-brand-soft max-lg:text-brand-text'
              : 'text-ink-secondary hover:text-ink hover:bg-surface-hover'"
            :aria-current="isActive(link.to) ? 'page' : undefined"
            @click="mobileOpen = false"
          >
            {{ link.label }}
          </RouterLink>
        </div>
        <div class="flex items-center gap-2 max-lg:flex-col max-lg:items-stretch max-lg:pt-3 max-lg:border-t max-lg:border-line">
          <template v-if="authStore.isLoggedIn">
            <RouterLink :to="authStore.defaultRoute" class="btn-primary" @click="mobileOpen = false">
              <AppIcon icon="layout-dashboard" class="w-4 h-4" />
              Dashboard
            </RouterLink>
          </template>
          <template v-else>
            <RouterLink to="/customer/sign-in" class="btn-ghost" @click="mobileOpen = false">
              Sign in
            </RouterLink>
            <RouterLink to="/customer/sign-up" class="btn-primary" @click="mobileOpen = false">
              Get started
            </RouterLink>
          </template>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import AppLogo from '@/components/brand/AppLogo.vue'
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
