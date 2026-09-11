<template>
  <div class="content-container flex-1 py-6">
    <div v-if="title || $slots.actions" class="flex flex-wrap justify-between items-center gap-4 mb-6">
      <div>
        <h1 class="text-xl font-bold text-warm-800 dark:text-white mb-1">{{ title }}</h1>
        <p v-if="subtitle" class="text-sm text-warm-500 dark:text-warm-400">{{ subtitle }}</p>
      </div>
      <div v-if="$slots.actions" class="flex items-center gap-2 shrink-0">
        <slot name="actions" />
      </div>
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title?: string
  subtitle?: string
}>()
</script>
