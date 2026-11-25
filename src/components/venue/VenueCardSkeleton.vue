<template>
  <div
    class="flex overflow-hidden rounded-xl border border-line bg-surface shadow-xs"
    :class="layout === 'list' ? 'flex-col sm:flex-row' : 'flex-col'"
    aria-hidden="true"
  >
    <div class="skeleton !rounded-none" :class="layout === 'list' ? 'aspect-[4/3] sm:aspect-auto sm:w-64 sm:min-h-[12rem]' : 'aspect-[4/3]'"></div>
    <div class="flex-1 p-4 space-y-3">
      <div class="skeleton h-4 w-3/4"></div>
      <div class="skeleton h-3 w-1/2"></div>
      <div class="flex gap-1.5 pt-1"><div class="skeleton h-5 w-16"></div><div class="skeleton h-5 w-20"></div></div>
      <div class="flex justify-between pt-3 border-t border-line"><div class="skeleton h-4 w-20"></div><div class="skeleton h-4 w-24"></div></div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ layout?: 'grid' | 'list' }>(), { layout: 'grid' })
</script>
