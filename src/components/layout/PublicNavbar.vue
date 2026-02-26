<template>
  <nav class="bg-white border-b border-surface-200 sticky top-0 z-50 shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <RouterLink to="/" class="flex items-center gap-2">
          <div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center shadow-glow-sm">
            <span class="text-white font-bold text-sm">EG</span>
          </div>
          <span class="text-xl font-bold text-surface-900">EventGenius</span>
        </RouterLink>

        <div class="hidden md:flex items-center gap-6">
          <RouterLink to="/" class="text-surface-600 hover:text-primary-600 font-medium transition-colors">Home</RouterLink>
          <RouterLink to="/venues" class="text-surface-600 hover:text-primary-600 font-medium transition-colors">Venues</RouterLink>
          <RouterLink to="/store/sign-up" class="text-surface-600 hover:text-primary-600 font-medium transition-colors">For Store Owners</RouterLink>
        </div>

        <div class="flex items-center gap-3">
          <template v-if="authStore.isLoggedIn">
            <RouterLink :to="authStore.defaultRoute" class="btn-primary text-sm">Dashboard</RouterLink>
          </template>
          <template v-else>
            <RouterLink to="/client/sign-in" class="btn-ghost text-sm">Sign In</RouterLink>
            <RouterLink to="/client/sign-up" class="btn-primary text-sm">Get Started</RouterLink>
          </template>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
const authStore = useAuthStore()
</script>
