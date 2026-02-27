<template>
  <nav class="border-b sticky top-0 z-50 shadow-sm" style="background: var(--color-bg-elevated); border-color: var(--color-border)">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <RouterLink to="/" class="flex items-center gap-2">
          <div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center shadow-glow-sm">
            <span class="text-white font-bold text-sm">EG</span>
          </div>
          <span class="text-xl font-bold text-surface-900">EventGenius</span>
        </RouterLink>

        <!-- Desktop nav -->
        <div class="hidden md:flex items-center gap-6">
          <RouterLink to="/" class="text-surface-600 hover:text-primary-600 font-medium transition-colors">Home</RouterLink>
          <RouterLink to="/venues" class="text-surface-600 hover:text-primary-600 font-medium transition-colors">Venues</RouterLink>
          <RouterLink to="/shop/sign-up" class="text-surface-600 hover:text-primary-600 font-medium transition-colors">For Shop Owners</RouterLink>
        </div>

        <div class="flex items-center gap-3">
          <template v-if="authStore.isLoggedIn">
            <RouterLink :to="authStore.defaultRoute" class="hidden sm:inline-flex btn-primary text-sm">Dashboard</RouterLink>
          </template>
          <template v-else>
            <RouterLink to="/customer/sign-in" class="hidden sm:inline-flex btn-ghost text-sm">Sign In</RouterLink>
            <RouterLink to="/customer/sign-up" class="hidden sm:inline-flex btn-primary text-sm">Get Started</RouterLink>
          </template>

          <!-- Mobile hamburger -->
          <button
            class="md:hidden flex items-center justify-center w-10 h-10 rounded-lg transition-colors"
            style="color: var(--color-text-secondary)"
            @click="mobileOpen = !mobileOpen"
            aria-label="Toggle menu"
          >
            <svg v-if="!mobileOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
            <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile menu -->
    <div
      v-if="mobileOpen"
      class="md:hidden border-t"
      style="background: var(--color-bg-elevated); border-color: var(--color-border)"
    >
      <div class="px-4 py-3 space-y-1">
        <RouterLink to="/" class="mobile-nav-link" @click="mobileOpen = false">Home</RouterLink>
        <RouterLink to="/venues" class="mobile-nav-link" @click="mobileOpen = false">Venues</RouterLink>
        <RouterLink to="/shop/sign-up" class="mobile-nav-link" @click="mobileOpen = false">For Shop Owners</RouterLink>

        <div class="border-t my-2" style="border-color: var(--color-border)"></div>

        <template v-if="authStore.isLoggedIn">
          <RouterLink :to="authStore.defaultRoute" class="mobile-nav-link font-semibold" style="color: var(--color-primary)" @click="mobileOpen = false">
            Dashboard
          </RouterLink>
        </template>
        <template v-else>
          <RouterLink to="/customer/sign-in" class="mobile-nav-link" @click="mobileOpen = false">Sign In</RouterLink>
          <RouterLink to="/customer/sign-up" class="mobile-nav-link font-semibold" style="color: var(--color-primary)" @click="mobileOpen = false">
            Get Started
          </RouterLink>
        </template>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const mobileOpen = ref(false)
</script>

<style scoped>
.mobile-nav-link {
  display: block;
  padding: 0.625rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-text);
  text-decoration: none;
  transition: background 0.15s;
}

.mobile-nav-link:hover {
  background: var(--color-bg-hover);
}
</style>
