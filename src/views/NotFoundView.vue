<template>
  <div class="min-h-screen bg-surface-50 flex items-center justify-center px-4">
    <div class="text-center max-w-md">
      <div class="text-8xl font-bold text-primary-200 leading-none">404</div>
      <h1 class="text-2xl font-bold text-surface-900 mt-6">Page not found</h1>
      <p class="text-surface-500 mt-2 mb-8">The page you're looking for doesn't exist or has been moved.</p>
      <div class="flex flex-col sm:flex-row gap-3 justify-center">
        <RouterLink to="/" class="btn-primary">Go to Home</RouterLink>
        <button @click="router.back()" class="btn-ghost">Go Back</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router'
const router = useRouter()
</script>
