<template>
  <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
    <!-- Weights -->
    <div class="card p-5 sm:p-6 xl:col-span-2">
      <div class="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h2 class="text-lg font-semibold text-warm-900 dark:text-warm-50">Ranking weights</h2>
          <p class="text-sm text-warm-500 dark:text-warm-400 mt-0.5">
            How much each signal counts when ordering “Best match” results. 0 turns a signal off; 10 makes it count the most.
          </p>
        </div>
        <span v-if="dirty" class="badge-warning" data-testid="unsaved-badge">
          <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Unsaved changes
        </span>
        <span v-else class="badge-primary"><AppIcon icon="check" class="w-3 h-3" /> Saved</span>
      </div>

      <!-- Presets -->
      <div class="mb-6">
        <p class="form-label">Start from a preset</p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="key in presetKeys"
            :key="key"
            type="button"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors"
            :class="activePreset === key
              ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 dark:border-primary-600'
              : 'border-warm-200 text-warm-600 hover:bg-warm-50 dark:border-warm-600 dark:text-warm-300 dark:hover:bg-warm-700'"
            @click="emit('preset', key)"
          >
            <AppIcon :icon="PRESET_LABELS[key]?.icon || 'sliders'" class="w-4 h-4" />
            {{ PRESET_LABELS[key]?.label || key }}
          </button>
        </div>
      </div>

      <div class="space-y-5">
        <div v-for="s in SIGNALS" :key="s.key" class="group">
          <div class="flex items-center justify-between gap-3">
            <label :for="`w-${s.key}`" class="flex items-center gap-2 text-sm font-medium text-warm-800 dark:text-warm-100">
              <span class="w-2.5 h-2.5 rounded-sm shrink-0" :style="{ background: s.color }"></span>
              {{ s.label }}
              <span v-if="isOff(s.key)" class="badge-warm !text-[10px] !py-0">{{ offReason(s.key) }}</span>
            </label>
            <div class="flex items-center gap-2">
              <span
                v-if="defaults && model.weights[s.key] !== defaults.weights[s.key]"
                class="text-[11px] text-warm-400"
                :title="`Default is ${defaults.weights[s.key]}`"
              >default {{ defaults.weights[s.key] }}</span>
              <span class="w-8 text-right text-sm font-semibold tabular-nums text-warm-900 dark:text-warm-50">{{ model.weights[s.key] }}</span>
            </div>
          </div>
          <input
            :id="`w-${s.key}`"
            v-model.number="model.weights[s.key]"
            type="range"
            min="0"
            max="10"
            step="1"
            class="eg-range w-full mt-1.5"
            :style="{ '--fill': `${model.weights[s.key] * 10}%`, '--c': s.color }"
            :data-signal="s.key"
          />
          <p class="text-xs text-warm-500 dark:text-warm-400 mt-1">{{ s.help }}</p>
        </div>
      </div>
    </div>

    <!-- Switches + actions -->
    <div class="space-y-6">
      <div class="card p-5 sm:p-6">
        <h3 class="text-base font-semibold text-warm-900 dark:text-warm-50 mb-4">Smart features</h3>
        <div class="space-y-4">
          <label v-for="t in toggles" :key="t.key" class="flex items-start justify-between gap-4 cursor-pointer">
            <span>
              <span class="block text-sm font-medium text-warm-800 dark:text-warm-100">{{ t.label }}</span>
              <span class="block text-xs text-warm-500 dark:text-warm-400 mt-0.5">{{ t.help }}</span>
            </span>
            <button
              type="button"
              role="switch"
              :aria-checked="!!model[t.key]"
              :aria-label="t.label"
              class="relative shrink-0 w-11 h-6 rounded-full transition-colors"
              :class="model[t.key] ? 'bg-primary-500' : 'bg-warm-300 dark:bg-warm-600'"
              @click.prevent="model[t.key] = !model[t.key]"
            >
              <span class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform" :class="model[t.key] ? 'translate-x-5' : ''"></span>
            </button>
          </label>
        </div>

        <div class="mt-6 pt-5 border-t border-warm-100 dark:border-warm-700">
          <div class="flex items-center justify-between">
            <label for="featured-boost" class="text-sm font-medium text-warm-800 dark:text-warm-100">Featured boost</label>
            <span class="text-sm font-semibold tabular-nums text-warm-900 dark:text-warm-50">+{{ model.featured_boost }} pts</span>
          </div>
          <input id="featured-boost" v-model.number="model.featured_boost" type="range" min="0" max="20" step="1"
            class="eg-range w-full mt-1.5" :style="{ '--fill': `${(model.featured_boost / 20) * 100}%`, '--c': 'var(--sig-featured)' }" />
          <p class="text-xs text-warm-500 dark:text-warm-400 mt-1">Score points (out of 100) added to venues marked as featured.</p>
        </div>
      </div>

      <div class="card p-5 sm:p-6">
        <h3 class="text-base font-semibold text-warm-900 dark:text-warm-50 mb-1">Apply changes</h3>
        <p class="text-xs text-warm-500 dark:text-warm-400 mb-4">
          Changes affect every customer’s “Best match” results once saved. Try them first in <strong>Try a search</strong>.
        </p>
        <p v-if="error" class="mb-3 text-sm text-red-600 dark:text-red-400">{{ error }}</p>
        <div class="flex flex-col gap-2">
          <button type="button" class="btn-primary w-full" :disabled="!dirty || saving" :class="{ 'opacity-60 cursor-not-allowed hover:translate-y-0': !dirty || saving }" @click="emit('save')">
            <AppIcon :icon="saving ? 'loader' : 'check'" :class="saving ? 'w-4 h-4 animate-spin' : 'w-4 h-4'" />
            {{ saving ? 'Saving…' : 'Save weights' }}
          </button>
          <div class="grid grid-cols-2 gap-2">
            <button type="button" class="btn-secondary !px-3 text-sm" :disabled="!dirty || saving" :class="{ 'opacity-60': !dirty }" @click="emit('discard')">Discard</button>
            <button type="button" class="btn-ghost !px-3 text-sm border border-warm-200 dark:border-warm-600" :disabled="saving" @click="emit('reset')">
              <AppIcon icon="refresh" class="w-4 h-4" /> Defaults
            </button>
          </div>
          <button type="button" class="btn-ghost text-sm" @click="emit('try')">
            <AppIcon icon="search" class="w-4 h-4" /> Try these weights
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { SIGNALS, PRESET_LABELS, type RankingSettings, type SignalKey } from './signals'

const model = defineModel<RankingSettings>({ required: true })
const props = defineProps<{
  defaults: RankingSettings | null
  presets: Record<string, unknown>
  dirty: boolean
  saving: boolean
  error?: string
  activePreset?: string | null
}>()
const emit = defineEmits<{ save: []; reset: []; discard: []; preset: [key: string]; try: [] }>()

const presetKeys = computed(() => {
  const keys = Object.keys(props.presets || {})
  return keys.length ? keys : Object.keys(PRESET_LABELS)
})

type ToggleKey = 'personalization' | 'learning' | 'exploration'
const toggles: { key: ToggleKey; label: string; help: string }[] = [
  { key: 'personalization', label: 'Personalisation', help: 'Tailor results to what a signed-in customer booked before.' },
  { key: 'learning', label: 'Learn from clicks', help: 'Use search click-through to promote venues people actually open.' },
  { key: 'exploration', label: 'Explore new venues', help: 'Give newly listed venues a freshness boost so they get discovered.' },
]

function isOff(k: SignalKey) {
  return (k === 'personal' && !model.value.personalization)
    || (k === 'engagement' && !model.value.learning)
    || (k === 'freshness' && !model.value.exploration)
}
function offReason(k: SignalKey) {
  return k === 'personal' ? 'personalisation off' : k === 'engagement' ? 'learning off' : 'exploration off'
}
</script>

<style>
.dark .eg-range { --track: 68 64 60; }
</style>

<style scoped>
.eg-range {
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  border-radius: 9999px;
  background: linear-gradient(to right, var(--c) 0%, var(--c) var(--fill), rgb(var(--track, 231 229 228)) var(--fill), rgb(var(--track, 231 229 228)) 100%);
  cursor: pointer;
}
.eg-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 9999px;
  background: #fff;
  border: 2px solid var(--c);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}
.eg-range::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 9999px;
  background: #fff;
  border: 2px solid var(--c);
}
</style>
