<template>
  <div class="space-y-1.5">
    <div class="flex items-center gap-2">
      <input
        type="range"
        min="-100"
        max="100"
        step="5"
        :value="venue.search_boost"
        class="boost-range flex-1 min-w-0"
        :style="{ '--pos': `${(venue.search_boost + 100) / 2}%`, '--bfill': venue.search_boost < 0 ? '#EF4444' : '#10B981' }"
        :aria-label="`Search boost for ${venue.name}`"
        :disabled="state?.status === 'saving'"
        data-testid="boost-slider"
        @input="e => emit('preview', Number((e.target as HTMLInputElement).value))"
        @change="e => emit('set', Number((e.target as HTMLInputElement).value))"
      />
      <span
        class="w-12 text-right text-sm font-semibold tabular-nums"
        :class="venue.search_boost > 0 ? 'text-brand-text' : venue.search_boost < 0 ? 'text-danger-text' : 'text-ink-muted'"
        data-testid="boost-value"
      >{{ venue.search_boost > 0 ? '+' : '' }}{{ venue.search_boost }}</span>
    </div>
    <div class="flex items-center gap-1.5">
      <button v-for="q in quick" :key="q.label" type="button"
        class="px-2 py-0.5 text-[11px] font-semibold rounded-md border transition-colors"
        :class="venue.search_boost === q.value ? q.active : 'border-warm-200 text-ink-muted hover:bg-warm-50 dark:border-warm-600 dark:text-warm-400 dark:hover:bg-warm-700'"
        :disabled="state?.status === 'saving'"
        @click="emit('set', q.value)"
      >{{ q.label }}</button>
      <span class="ml-auto text-[11px]" aria-live="polite">
        <span v-if="state?.status === 'saving'" class="text-ink-muted">Saving…</span>
        <span v-else-if="state?.status === 'saved'" class="text-brand-text">Saved</span>
        <span v-else-if="state?.status === 'error'" class="text-danger-text" :title="state.message">Failed</span>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface BoostState { status: 'idle' | 'saving' | 'saved' | 'error'; saved: number; message?: string }

defineProps<{ venue: { name: string; search_boost: number }; state?: BoostState }>()
const emit = defineEmits<{ set: [value: number]; preview: [value: number] }>()

const quick = [
  { label: 'Bury', value: -50, active: 'border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300' },
  { label: 'Neutral', value: 0, active: 'border-warm-400 bg-warm-100 text-warm-700 dark:border-warm-500 dark:bg-warm-700 dark:text-warm-200' },
  { label: 'Boost', value: 50, active: 'border-primary-300 bg-primary-50 text-primary-700 dark:border-primary-700 dark:bg-primary-900/30 dark:text-primary-300' },
]
</script>

<style>
.boost-range {
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  border-radius: 9999px;
  cursor: pointer;
  background:
    linear-gradient(to right,
      rgb(var(--btrack, 231 229 228)) 0%,
      rgb(var(--btrack, 231 229 228)) min(50%, var(--pos)),
      var(--bfill, #10B981) min(50%, var(--pos)),
      var(--bfill, #10B981) max(50%, var(--pos)),
      rgb(var(--btrack, 231 229 228)) max(50%, var(--pos)));
}
.dark .boost-range { --btrack: 68 64 60; }
.boost-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 9999px;
  background: #fff;
  border: 2px solid #78716C;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}
.boost-range::-moz-range-thumb { width: 14px; height: 14px; border-radius: 9999px; background: #fff; border: 2px solid #78716C; }
.boost-range:disabled { opacity: 0.5; cursor: wait; }
</style>
