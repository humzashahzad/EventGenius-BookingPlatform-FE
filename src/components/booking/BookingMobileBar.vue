<template>
  <!-- Phones and tablets: running total + the step's main button, fixed to the bottom. -->
  <div class="mbar lg:hidden" role="region" aria-label="Booking total and actions">
    <div v-if="open" :id="panelId" class="mbar-panel">
      <slot />
    </div>
    <div class="mbar-row">
      <button type="button" class="mbar-total" :aria-expanded="open" :aria-controls="panelId" @click="open = !open">
        <span class="text-xs text-ink-muted flex items-center gap-1">
          Estimated total
          <AppIcon :icon="open ? 'chevron-down' : 'chevron-up'" class="w-3.5 h-3.5" />
        </span>
        <span class="block truncate text-base font-semibold text-ink num">PKR {{ total }}</span>
      </button>
      <button v-if="showBack" type="button" class="btn-secondary mbar-back" aria-label="Back to previous step" :disabled="busy" @click="emit('back')">
        <AppIcon icon="arrow-left" class="w-4 h-4" />
      </button>
      <button type="button" class="btn-primary mbar-primary" :disabled="busy || disabled" :aria-busy="busy || undefined" @click="emit('primary')">
        <span v-if="busy" class="spinner-border spinner-border-sm" aria-hidden="true" />
        {{ label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, useId } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'

defineProps<{ total: string; label: string; showBack?: boolean; busy?: boolean; disabled?: boolean }>()
const emit = defineEmits<{ primary: []; back: [] }>()
const open = ref(false)
const panelId = `bk-mbar-${useId()}`
</script>

<style scoped>
.mbar {
  position: fixed; left: 0; right: 0; bottom: 0; z-index: 20;
  background: var(--surface); border-top: 1px solid var(--line);
  box-shadow: 0 -4px 12px rgb(0 0 0 / 0.06);
  padding: 0.625rem 1rem calc(0.625rem + env(safe-area-inset-bottom));
}
.mbar-panel { max-height: 50vh; overflow-y: auto; padding-bottom: 0.5rem; margin-bottom: 0.5rem; border-bottom: 1px solid var(--line); }
.mbar-row { display: flex; align-items: center; gap: 0.5rem; max-width: 40rem; margin: 0 auto; }
.mbar-total { flex: 1 1 auto; min-width: 0; min-height: 44px; text-align: left; border-radius: var(--radius-md); }
.mbar-total:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
.mbar-back { flex: 0 0 auto; width: 44px; min-height: 44px; padding: 0; justify-content: center; }
.mbar-primary { flex: 0 0 auto; min-height: 44px; white-space: nowrap; }
</style>
