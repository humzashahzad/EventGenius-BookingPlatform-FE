<template>
  <p v-for="(line, i) in lines" :key="i" class="min-w-0 break-words" :class="i > 0 && 'mt-1.5'">
    <template v-for="(part, j) in line" :key="j">
      <strong v-if="part.bold" class="font-semibold">{{ part.text }}</strong>
      <template v-else>{{ part.text }}</template>
    </template>
  </p>
</template>

<script setup lang="ts">
/** Assistant text: plain text with **bold** and line breaks only (never HTML). */
import { computed } from 'vue'

const props = defineProps<{ text: string }>()

const lines = computed(() =>
  String(props.text || '')
    .split('\n')
    .filter(l => l.trim() !== '')
    .map(line => line.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map(part =>
      part.startsWith('**') && part.endsWith('**') && part.length > 4
        ? { text: part.slice(2, -2), bold: true }
        : { text: part, bold: false },
    )),
)
</script>
