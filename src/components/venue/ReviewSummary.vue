<template>
  <section v-if="summary" class="card" aria-labelledby="guest-summary-title">
    <div class="card-header">
      <div>
        <h2 id="guest-summary-title" class="card-title">What guests say</h2>
        <p class="card-subtitle">Summarised from {{ summary.analysed_count }} reviews</p>
      </div>
      <div class="text-right shrink-0">
        <p class="text-lg font-semibold text-ink num leading-6">{{ summary.sentiment }}<span class="text-sm text-ink-muted">/100</span></p>
        <span :class="toneBadge(summary.sentiment)">{{ summary.label || sentimentLabel(summary.sentiment) }}</span>
      </div>
    </div>

    <div class="card-body space-y-6">
      <ul v-if="summary.aspects.length" class="grid gap-x-8 gap-y-4 sm:grid-cols-2" aria-label="Guest opinion by topic">
        <li v-for="a in summary.aspects" :key="a.name" class="min-w-0">
          <div class="flex items-baseline justify-between gap-3 text-sm">
            <span class="font-medium text-ink truncate">{{ a.name }}</span>
            <span class="shrink-0 text-ink-muted num">
              <span class="font-semibold text-ink">{{ a.positive_pct }}%</span> positive
            </span>
          </div>
          <div
            class="mt-1.5 h-2 rounded-full bg-surface-sunken overflow-hidden"
            role="progressbar"
            :aria-valuenow="a.positive_pct"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-label="`${a.name}: ${a.positive_pct}% positive`"
          >
            <div class="h-full rounded-full" :class="barClass(a.positive_pct)" :style="{ width: `${a.positive_pct}%` }"></div>
          </div>
          <p class="mt-1 text-xs text-ink-muted">
            {{ a.label ? `${a.label} · ` : '' }}{{ a.mentions }} mention{{ a.mentions === 1 ? '' : 's' }}
          </p>
        </li>
      </ul>

      <div v-if="summary.highlights.length || summary.concerns.length" class="grid gap-4 sm:grid-cols-2">
        <div v-if="summary.highlights.length" class="rounded-lg border border-success-line bg-success-soft p-4">
          <h3 class="flex items-center gap-1.5 text-sm font-semibold text-success-text">
            <AppIcon icon="circle-check" class="w-4 h-4" /> Guests liked
          </h3>
          <ul class="mt-2 space-y-1.5 text-sm text-ink-secondary">
            <li v-for="h in summary.highlights" :key="h" class="flex gap-2"><span class="mt-2 h-1 w-1 shrink-0 rounded-full bg-success"></span>{{ h }}</li>
          </ul>
        </div>
        <div v-if="summary.concerns.length" class="rounded-lg border border-warning-line bg-warning-soft p-4">
          <h3 class="flex items-center gap-1.5 text-sm font-semibold text-warning-text">
            <AppIcon icon="alert-circle" class="w-4 h-4" /> Worth knowing
          </h3>
          <ul class="mt-2 space-y-1.5 text-sm text-ink-secondary">
            <li v-for="c in summary.concerns" :key="c" class="flex gap-2"><span class="mt-2 h-1 w-1 shrink-0 rounded-full bg-warning"></span>{{ c }}</li>
          </ul>
        </div>
      </div>

      <p class="text-xs text-ink-muted">Generated automatically from verified guest reviews. Read the full reviews below.</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'

interface Aspect { name: string; label: string; positive_pct: number; mentions: number }
interface Summary {
  analysed_count: number
  sentiment: number
  label: string
  aspects: Aspect[]
  highlights: string[]
  concerns: string[]
}

const props = defineProps<{ data?: unknown; minReviews?: number }>()

const clampPct = (v: unknown) => {
  const n = Number(v)
  return Number.isFinite(n) ? Math.round(Math.max(0, Math.min(100, n))) : 0
}
const strings = (v: unknown, max: number) =>
  (Array.isArray(v) ? v : []).filter((s): s is string => typeof s === 'string' && s.trim() !== '').map(s => s.trim()).slice(0, max)

/** Parsed summary, or null when it is missing, malformed or based on too few reviews. */
const summary = computed<Summary | null>(() => {
  const raw = props.data as any
  if (!raw || typeof raw !== 'object') return null
  const count = Number(raw.analysed_count)
  if (!Number.isFinite(count) || count < (props.minReviews ?? 3)) return null
  const aspects: Aspect[] = (Array.isArray(raw.aspects) ? raw.aspects : [])
    .filter((a: any) => a && typeof a.name === 'string' && a.name.trim())
    .map((a: any) => ({
      name: a.name.trim(),
      label: typeof a.label === 'string' ? a.label : '',
      positive_pct: clampPct(a.positive_pct),
      mentions: Math.max(0, Math.round(Number(a.mentions) || 0)),
    }))
    .slice(0, 8)
  const highlights = strings(raw.highlights, 5)
  const concerns = strings(raw.concerns, 5)
  if (!aspects.length && !highlights.length && !concerns.length) return null
  return {
    analysed_count: Math.round(count),
    sentiment: clampPct(raw.sentiment),
    label: typeof raw.label === 'string' ? raw.label : '',
    aspects,
    highlights,
    concerns,
  }
})

function sentimentLabel(s: number) {
  if (s >= 80) return 'Very positive'
  if (s >= 60) return 'Mostly positive'
  if (s >= 40) return 'Mixed'
  return 'Mostly negative'
}
function toneBadge(s: number) {
  if (s >= 60) return 'badge-success'
  if (s >= 40) return 'badge-warning'
  return 'badge-danger'
}
function barClass(p: number) {
  if (p >= 70) return 'bg-brand-strong'
  if (p >= 45) return 'bg-warning'
  return 'bg-danger'
}
</script>
