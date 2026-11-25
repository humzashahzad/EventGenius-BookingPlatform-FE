<template>
  <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
    <!-- Weights -->
    <div class="card p-5 sm:p-6 xl:col-span-2">
      <div class="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h2 class="text-lg font-semibold text-ink">Ranking weights</h2>
          <p class="text-sm text-ink-muted mt-0.5">
            How much each signal counts when ordering “Best match” results. 0 turns a signal off; 10 makes it count the most.
          </p>
        </div>
        <span v-if="dirty" class="badge-warning" data-testid="unsaved-badge">
          Unsaved changes
        </span>
        <span v-else class="badge-success"><AppIcon icon="check" class="w-3 h-3" /> Saved</span>
      </div>

      <!-- Presets -->
      <div class="mb-6">
        <p class="form-label">Start from a preset</p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="key in presetKeys"
            :key="key"
            type="button"
            class="btn-secondary btn-sm"
            :class="activePreset === key && '!border-brand-text !bg-brand-soft !text-brand-text'"
            :aria-pressed="activePreset === key"
            @click="emit('preset', key)"
          >
            <AppIcon :icon="PRESET_LABELS[key]?.icon || 'sliders'" class="w-4 h-4" />
            {{ PRESET_LABELS[key]?.label || key }}
          </button>
        </div>
      </div>

      <div class="space-y-5">
        <div v-for="s in visibleSignals" :key="s.key" class="group">
          <div class="flex items-center justify-between gap-3">
            <label :for="`w-${s.key}`" class="flex items-center gap-2 text-sm font-medium text-ink">
              <span class="w-2.5 h-2.5 rounded-sm shrink-0" :style="{ background: s.color }"></span>
              {{ s.label }}
              <span v-if="isOff(s.key)" class="badge-warm badge-sm">{{ offReason(s.key) }}</span>
            </label>
            <div class="flex items-center gap-2">
              <span
                v-if="defaults && defaults.weights[s.key] !== undefined && model.weights[s.key] !== defaults.weights[s.key]"
                class="text-[11px] text-ink-muted"
                :title="`Default is ${defaults.weights[s.key]}`"
              >default {{ defaults.weights[s.key] }}</span>
              <span class="w-8 text-right text-sm font-semibold tabular-nums text-ink">{{ model.weights[s.key] }}</span>
            </div>
          </div>
          <SliderInput
            :id="`w-${s.key}`"
            v-model="model.weights[s.key]"
            :min="0"
            :max="10"
            :step="1"
            :color="s.color"
            :data-signal="s.key"
          />
          <p class="text-xs text-ink-muted mt-1">{{ s.help }}</p>
        </div>
      </div>
    </div>

    <!-- Switches + actions -->
    <div class="space-y-6">
      <div class="card p-5 sm:p-6">
        <h3 class="text-base font-semibold text-ink mb-4">Smart features</h3>
        <div class="space-y-4">
          <SwitchInput v-for="t in toggles" :key="t.key" v-model="model[t.key]" :label="t.label" :description="t.help" label-position="start" />
        </div>

        <div class="mt-6 pt-5 border-t border-line">
          <div class="flex items-center justify-between">
            <label for="featured-boost" class="text-sm font-medium text-ink">Featured boost</label>
            <span class="text-sm font-semibold tabular-nums text-ink">+{{ model.featured_boost }} pts</span>
          </div>
          <SliderInput id="featured-boost" v-model="model.featured_boost" :min="0" :max="20" :step="1" color="var(--sig-featured)" />
          <p class="text-xs text-ink-muted mt-1">Score points (out of 100) added to venues marked as featured.</p>
        </div>
      </div>

      <div class="card p-5 sm:p-6">
        <h3 class="text-base font-semibold text-ink mb-1">Apply changes</h3>
        <p class="text-xs text-ink-muted mb-4">
          Changes affect every customer’s “Best match” results once saved. Try them first in <strong>Try a search</strong>.
        </p>
        <p v-if="error" class="mb-3 text-sm text-danger-text">{{ error }}</p>
        <div class="flex flex-col gap-2">
          <button type="button" class="btn-primary w-full" :disabled="!dirty || saving" @click="emit('save')">
            <AppIcon :icon="saving ? 'loader' : 'check'" :class="saving ? 'w-4 h-4 animate-spin' : 'w-4 h-4'" />
            {{ saving ? 'Saving…' : 'Save weights' }}
          </button>
          <div class="grid grid-cols-2 gap-2">
            <button type="button" class="btn-secondary !px-3" :disabled="!dirty || saving" :class="{ 'opacity-60': !dirty }" @click="emit('discard')">Discard</button>
            <button type="button" class="btn-secondary !px-3" :disabled="saving" @click="emit('reset')">
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
import { SliderInput, SwitchInput } from '@/components/forms'
import { signalsFor, PRESET_LABELS, type RankingSettings, type SignalKey } from './signals'

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

const visibleSignals = computed(() => signalsFor(model.value?.weights))

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
