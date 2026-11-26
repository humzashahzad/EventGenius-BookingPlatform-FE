<template>
  <!--
    Wraps a list's content. While `busy` (a filter, search or page change is loading),
    the rows stay on screen, dim slightly and a thin bar runs over the top edge.
    Nothing is swapped for a skeleton, and nothing moves.
  -->
  <div class="list-body" :class="{ 'is-busy': busy }" :aria-busy="busy ? 'true' : undefined">
    <div class="list-body-bar" aria-hidden="true"><span /></div>
    <div class="list-body-content"><slot /></div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ busy?: boolean }>()
</script>

<style scoped>
.list-body { position: relative; }
.list-body-content { transition: opacity 150ms ease; }
.list-body.is-busy .list-body-content { opacity: 0.6; transition-delay: 150ms; }
.list-body-bar {
  position: absolute; left: 0; right: 0; top: 0; height: 2px; overflow: hidden; z-index: 3;
  pointer-events: none; opacity: 0; transition: opacity 150ms ease;
}
.list-body.is-busy .list-body-bar { opacity: 1; transition-delay: 150ms; }
.list-body-bar span {
  position: absolute; top: 0; bottom: 0; width: 35%; border-radius: 9999px;
  background: var(--brand);
  animation: list-body-slide 1.1s ease-in-out infinite;
}
.list-body:not(.is-busy) .list-body-bar span { animation-play-state: paused; }
@keyframes list-body-slide {
  from { left: -35%; }
  to { left: 100%; }
}
@media (prefers-reduced-motion: reduce) {
  .list-body-bar span { animation: none; left: 0; width: 100%; opacity: 0.6; }
}
</style>
