<template>
  <nav aria-label="Booking steps">
    <ol class="bk-stepper">
      <li
        v-for="(s, i) in steps"
        :key="s"
        class="bk-step"
        :class="{ 'is-active': current === i, 'is-done': i < current }"
      >
        <button
          type="button"
          class="bk-step-btn"
          :aria-current="current === i ? 'step' : undefined"
          :disabled="i > maxReachable || i === current"
          @click="emit('go', i)"
        >
          <span class="bk-step-num" aria-hidden="true">
            <AppIcon v-if="i < current" icon="check" class="w-3.5 h-3.5" />
            <template v-else>{{ i + 1 }}</template>
          </span>
          <span class="bk-step-label">
            <span class="sr-only">Step {{ i + 1 }}: </span><span class="hidden sm:inline">{{ s }}</span><span class="sm:hidden">{{ shortSteps?.[i] || s }}</span><span v-if="i < current" class="sr-only"> (done)</span>
          </span>
        </button>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
/** Compact 3-step progress bar. Steps up to `maxReachable` can be revisited. */
import AppIcon from '@/components/ui/AppIcon.vue'

defineProps<{ steps: string[]; shortSteps?: string[]; current: number; maxReachable: number }>()
const emit = defineEmits<{ go: [index: number] }>()
</script>

<style scoped>
.bk-stepper { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.5rem; }
.bk-step { min-width: 0; }
.bk-step-btn {
  display: flex; align-items: center; gap: 0.5rem; width: 100%; min-height: 44px;
  padding: 0.5rem 0 0.25rem; border-top: 3px solid var(--line); text-align: left;
  border-radius: 0; cursor: pointer;
}
.bk-step-btn:disabled { cursor: default; opacity: 1; }
.bk-step.is-active .bk-step-btn, .bk-step.is-done .bk-step-btn { border-top-color: var(--brand-strong); }
.bk-step-btn:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
.bk-step-num {
  display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
  width: 1.5rem; height: 1.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600;
  border: 1px solid var(--line-strong); background: var(--surface); color: var(--ink-muted);
}
.bk-step.is-active .bk-step-num { background: var(--brand-strong); border-color: var(--brand-strong); color: var(--on-brand); }
.bk-step.is-done .bk-step-num { background: var(--brand-soft); border-color: var(--brand-text); color: var(--brand-text); }
.bk-step-label { min-width: 0; font-size: 0.8125rem; font-weight: 500; color: var(--ink-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.bk-step.is-active .bk-step-label { color: var(--ink); font-weight: 600; }
.bk-step.is-done .bk-step-label { color: var(--ink-secondary); }
.bk-step.is-done .bk-step-btn:not(:disabled):hover .bk-step-label { color: var(--brand-text); text-decoration: underline; }
</style>
