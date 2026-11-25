<template>
  <div v-if="password" class="mt-2" aria-live="polite">
    <div class="flex gap-1" aria-hidden="true">
      <span v-for="i in 4" :key="i" class="h-1 flex-1 rounded-full" :class="i <= strength.bars ? strength.bar : 'bg-surface-sunken border border-line'"></span>
    </div>
    <p class="mt-1 text-xs text-ink-muted">
      Strength: <span class="font-semibold" :class="strength.text">{{ strength.label }}</span>
      <template v-if="strength.tip"> · {{ strength.tip }}</template>
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ password: string }>()

const strength = computed(() => {
  const p = props.password || ''
  let score = 0
  if (p.length >= 8) score++
  if (p.length >= 12) score++
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++
  if (/[0-9]/.test(p)) score++
  if (/[^A-Za-z0-9]/.test(p)) score++
  const tip = p.length < 8 ? 'use at least 8 characters' : !/[0-9]/.test(p) ? 'add a number' : !/[^A-Za-z0-9]/.test(p) ? 'add a symbol' : ''
  if (p.length < 8 || score <= 1) return { label: 'Too weak', bars: 1, bar: 'bg-danger', text: 'text-danger-text', tip }
  if (score <= 2) return { label: 'Fair', bars: 2, bar: 'bg-warning', text: 'text-warning-text', tip }
  if (score <= 3) return { label: 'Good', bars: 3, bar: 'bg-brand', text: 'text-brand-text', tip }
  return { label: 'Strong', bars: 4, bar: 'bg-brand-strong', text: 'text-brand-text', tip: '' }
})
</script>
