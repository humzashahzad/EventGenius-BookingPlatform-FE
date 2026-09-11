<template>
  <div class="min-h-screen bg-warm-50 dark:bg-warm-900 flex items-center justify-center px-4">
    <div class="text-center max-w-md">
      <div class="text-7xl sm:text-8xl font-bold text-primary-200 dark:text-primary-800 leading-none">404</div>
      <h1 class="text-xl sm:text-2xl font-bold text-warm-900 dark:text-warm-50 mt-4 sm:mt-6">Page not found</h1>
      <p class="text-sm sm:text-base text-warm-500 dark:text-warm-400 mt-2 mb-6 sm:mb-8">The page you're looking for doesn't exist or has been moved.</p>
      <div class="flex flex-col sm:flex-row gap-3 justify-center">
        <RouterLink to="/" class="btn-primary">Go to Home</RouterLink>
        <button @click="router.back()" class="btn-secondary">Go Back</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router'
const router = useRouter()
</script>
