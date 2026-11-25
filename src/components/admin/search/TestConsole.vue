<template>
  <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
    <!-- Query form -->
    <form class="card p-5 sm:p-6 xl:col-span-1 self-start" @submit.prevent="run">
      <h2 class="text-lg font-semibold text-warm-900 dark:text-warm-50">Try a search</h2>
      <p class="text-sm text-warm-500 dark:text-warm-400 mt-0.5 mb-4">
        See how customers’ results would rank. Nothing is logged.
      </p>

      <div
        class="mb-4 flex items-start gap-2 rounded-xl px-3 py-2 text-xs"
        :class="dirty
          ? 'bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200'
          : 'bg-warm-50 text-warm-600 dark:bg-warm-700/50 dark:text-warm-300'"
      >
        <AppIcon :icon="dirty ? 'alert-triangle' : 'info'" class="w-4 h-4 shrink-0 mt-px" />
        <span v-if="dirty">Using your <strong>unsaved</strong> weights. Customers still see the saved ones.</span>
        <span v-else>Using the saved weights.</span>
      </div>

      <label for="tc-q" class="form-label">What would a customer type?</label>
      <div class="relative">
        <AppIcon icon="search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-warm-400" />
        <input id="tc-q" v-model="form.q" class="form-input !pl-9" placeholder="e.g. shadi hall in lahore for 300 guests under 3000" />
      </div>
      <div class="flex flex-wrap gap-1.5 mt-2">
        <button v-for="ex in examples" :key="ex" type="button"
          class="text-[11px] px-2 py-0.5 rounded-full bg-warm-100 text-warm-600 hover:bg-primary-50 hover:text-primary-700 dark:bg-warm-700 dark:text-warm-300 dark:hover:bg-primary-900/30 dark:hover:text-primary-300"
          @click="form.q = ex; run()">{{ ex }}</button>
      </div>

      <button type="button" class="mt-4 text-sm font-medium text-primary-600 dark:text-primary-400 inline-flex items-center gap-1" @click="showMore = !showMore" :aria-expanded="showMore">
        <AppIcon :icon="showMore ? 'chevron-up' : 'chevron-down'" class="w-4 h-4" /> Filters &amp; customer
      </button>
      <div v-show="showMore" class="grid grid-cols-2 gap-3 mt-3">
        <div class="col-span-2 sm:col-span-1 xl:col-span-2">
          <label for="tc-city" class="form-label">City</label>
          <input id="tc-city" v-model="form.city" list="tc-cities" class="form-input" placeholder="Any" />
          <datalist id="tc-cities"><option v-for="c in cities" :key="c" :value="c" /></datalist>
        </div>
        <div class="col-span-2 sm:col-span-1 xl:col-span-2">
          <label for="tc-type" class="form-label">Event type</label>
          <select id="tc-type" v-model="form.event_type" class="form-select">
            <option value="">Any</option>
            <option v-for="c in categories" :key="c.slug" :value="c.slug">{{ c.name }}</option>
          </select>
        </div>
        <div>
          <label for="tc-guests" class="form-label">Guests</label>
          <input id="tc-guests" v-model="form.guests" type="number" min="1" class="form-input" placeholder="—" />
        </div>
        <div>
          <label for="tc-budget" class="form-label">Max / head (Rs)</label>
          <input id="tc-budget" v-model="form.max_price" type="number" min="0" class="form-input" placeholder="—" />
        </div>
        <div class="col-span-2">
          <label for="tc-user" class="form-label">View as customer (user ID)</label>
          <input id="tc-user" v-model="form.as_user_id" type="number" min="1" class="form-input" placeholder="Signed-out visitor" />
          <p class="text-[11px] text-warm-400 mt-1">Shows personalisation for that customer’s booking history.</p>
        </div>
      </div>

      <div class="flex gap-2 mt-5">
        <button type="submit" class="btn-primary flex-1" :disabled="loading" data-testid="run-preview">
          <AppIcon :icon="loading ? 'loader' : 'search'" :class="loading ? 'w-4 h-4 animate-spin' : 'w-4 h-4'" />
          {{ loading ? 'Ranking…' : 'Run preview' }}
        </button>
        <button type="button" class="btn-ghost !px-3" title="Clear" @click="clear"><AppIcon icon="x" class="w-4 h-4" /></button>
      </div>
    </form>

    <!-- Results -->
    <div class="xl:col-span-2 space-y-4 min-w-0">
      <div v-if="error" class="card p-5 flex items-start gap-3 border-red-200 dark:border-red-900">
        <AppIcon icon="alert-circle" class="w-5 h-5 text-red-500 shrink-0" />
        <div class="flex-1">
          <p class="text-sm font-medium text-warm-900 dark:text-warm-50">Preview failed</p>
          <p class="text-sm text-warm-500 dark:text-warm-400">{{ error }}</p>
        </div>
        <button class="btn-outline btn-sm" @click="run">Retry</button>
      </div>

      <div v-if="understood && !loading" class="card p-4">
        <p class="text-xs font-semibold uppercase tracking-wider text-warm-500 dark:text-warm-400 mb-2">Understood</p>
        <div v-if="chips.length" class="flex flex-wrap gap-1.5" data-testid="understood-chips">
          <span v-for="(c, i) in chips" :key="i" :class="chipClass(c.type)">
            <span class="opacity-70">{{ chipType(c.type) }}:</span> {{ c.label }}
          </span>
        </div>
        <p v-else class="text-sm text-warm-500 dark:text-warm-400">No specific city, event type, guests or budget detected — ranking by overall quality.</p>
      </div>

      <div class="card overflow-hidden">
        <div class="px-5 py-3 border-b border-warm-100 dark:border-warm-700 flex flex-wrap items-center justify-between gap-2">
          <h3 class="text-sm font-semibold text-warm-900 dark:text-warm-50">
            Ranked results <span v-if="results.length" class="text-warm-400 font-normal">· top {{ results.length }}</span>
          </h3>
          <div class="flex flex-wrap gap-x-3 gap-y-1">
            <span v-for="s in SIGNALS" :key="s.key" class="inline-flex items-center gap-1 text-[11px] text-warm-500 dark:text-warm-400">
              <span class="w-2 h-2 rounded-sm" :style="{ background: s.color }"></span>{{ s.label.replace(/ \(.*\)/, '') }}
            </span>
          </div>
        </div>

        <div v-if="loading" class="divide-y divide-warm-100 dark:divide-warm-700">
          <div v-for="i in 5" :key="i" class="flex items-center gap-4 p-4">
            <div class="skeleton w-6 h-6"></div>
            <div class="skeleton w-16 h-12 rounded-xl"></div>
            <div class="flex-1 space-y-2"><div class="skeleton h-4 w-1/2"></div><div class="skeleton h-2.5 w-full"></div></div>
          </div>
        </div>
        <div v-else-if="!ran" class="empty-state">
          <div class="empty-state-icon"><AppIcon icon="sparkles" class="w-6 h-6" /></div>
          <p class="empty-state-title">Run a search to see the ranking</p>
          <p class="empty-state-desc">Each result shows its score, why it ranked there, and how much each signal contributed.</p>
        </div>
        <div v-else-if="!results.length && !error" class="empty-state">
          <div class="empty-state-icon"><AppIcon icon="map-pin-off" class="w-6 h-6" /></div>
          <p class="empty-state-title">No venues match</p>
          <p class="empty-state-desc">Customers would see zero results for this search. Try removing a filter.</p>
        </div>
        <ol v-else class="divide-y divide-warm-100 dark:divide-warm-700" data-testid="preview-results">
          <li v-for="(r, i) in results" :key="r.venue.id" class="flex gap-3 sm:gap-4 p-4">
            <div class="w-7 shrink-0 text-center">
              <span class="text-lg font-bold tabular-nums" :class="i < 3 ? 'text-primary-600 dark:text-primary-400' : 'text-warm-400'">{{ i + 1 }}</span>
              <span v-if="moved(r.venue.id) !== 0" class="block text-[10px] font-semibold" :class="moved(r.venue.id) > 0 ? 'text-primary-600' : 'text-red-500'"
                :title="'Change vs previous run'">{{ moved(r.venue.id) > 0 ? '▲' : '▼' }}{{ Math.abs(moved(r.venue.id)) }}</span>
            </div>
            <div class="w-16 h-12 sm:w-20 sm:h-14 shrink-0 rounded-xl overflow-hidden bg-warm-100 dark:bg-warm-700">
              <img v-if="r.venue.thumbnail" :src="getStorageUrl(r.venue.thumbnail)" :alt="r.venue.name" class="w-full h-full object-cover" loading="lazy" />
              <div v-else class="w-full h-full flex items-center justify-center text-warm-400"><AppIcon icon="photo" class="w-5 h-5" /></div>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="font-medium text-warm-900 dark:text-warm-50 truncate">
                    {{ r.venue.name }}
                    <span v-if="r.venue.is_featured" class="badge-warning !text-[10px] !py-0 ml-1 align-middle">Featured</span>
                    <span v-if="r.venue.search_boost" class="!text-[10px] !py-0 ml-1 align-middle" :class="r.venue.search_boost > 0 ? 'badge-primary' : 'badge-danger'">
                      Boost {{ r.venue.search_boost > 0 ? '+' : '' }}{{ r.venue.search_boost }}
                    </span>
                  </p>
                  <p class="text-xs text-warm-500 dark:text-warm-400 truncate">
                    {{ r.venue.city || '—' }}
                    <template v-if="r.venue.price_per_head"> · Rs {{ num(r.venue.price_per_head) }}/head</template>
                    <template v-if="r.venue.avg_rating"> · ★ {{ Number(r.venue.avg_rating).toFixed(1) }} ({{ r.venue.total_reviews || 0 }})</template>
                  </p>
                </div>
                <div class="text-right shrink-0">
                  <span class="text-lg font-bold tabular-nums text-warm-900 dark:text-warm-50">{{ Number(r.score).toFixed(1) }}</span>
                  <span class="block text-[10px] uppercase tracking-wider text-warm-400">score</span>
                </div>
              </div>
              <ContributionBar class="mt-2" :contributions="r.contributions" />
              <div v-if="r.reasons?.length" class="flex flex-wrap gap-1 mt-2">
                <span v-for="reason in r.reasons" :key="reason" class="badge-warm !text-[11px]">{{ reason }}</span>
              </div>
              <details class="mt-1.5">
                <summary class="text-[11px] text-warm-400 cursor-pointer hover:text-warm-600 dark:hover:text-warm-300 select-none">Signal details</summary>
                <div class="grid grid-cols-2 sm:grid-cols-5 gap-x-4 gap-y-1 mt-2">
                  <div v-for="s in SIGNALS" :key="s.key" class="text-[11px]">
                    <span class="text-warm-500 dark:text-warm-400">{{ s.label.replace(/ \(.*\)/, '') }}</span>
                    <span class="block tabular-nums text-warm-800 dark:text-warm-200">
                      <template v-if="r.signals && r.signals[s.key] !== undefined && r.signals[s.key] !== null">
                        {{ (Number(r.signals[s.key]) * 100).toFixed(0) }}% · {{ Number(r.contributions?.[s.key] || 0).toFixed(1) }} pts
                      </template>
                      <template v-else>n/a</template>
                    </span>
                  </div>
                </div>
              </details>
            </div>
          </li>
        </ol>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import api from '@/lib/axios'
import AppIcon from '@/components/ui/AppIcon.vue'
import ContributionBar from './ContributionBar.vue'
import { getStorageUrl } from '@/lib/storageUrl'
import { SIGNALS, apiError, num, type RankingSettings } from './signals'

interface PreviewVenue {
  id: number; name: string; city: string | null; thumbnail: string | null
  price_per_head: number | null; avg_rating: number | null; total_reviews: number | null
  is_featured: boolean; search_boost: number
}
interface PreviewResult {
  venue: PreviewVenue; score: number
  signals: Record<string, number | null>; contributions: Record<string, number>; reasons: string[]
}
interface Chip { type: string; label: string; param?: string; value?: unknown }

const props = defineProps<{
  settings: RankingSettings
  dirty: boolean
  cities: string[]
  categories: { slug: string; name: string }[]
}>()

const form = reactive({ q: '', city: '', event_type: '', guests: '', max_price: '', as_user_id: '' })
const showMore = ref(true)
const loading = ref(false)
const error = ref('')
const ran = ref(false)
const results = ref<PreviewResult[]>([])
const understood = ref<{ chips?: Chip[] } | null>(null)
const previousOrder = ref<number[]>([])

const examples = [
  'shadi hall in lahore for 300 guests under 3000',
  'rooftop birthday karachi',
  'corporate seminar isb',
  'cheap mehndi lawn',
  'top rated banquet',
]

const chips = computed<Chip[]>(() => understood.value?.chips || [])

function moved(id: number): number {
  if (!previousOrder.value.length) return 0
  const before = previousOrder.value.indexOf(id)
  const now = results.value.findIndex(r => r.venue.id === id)
  if (before < 0 || now < 0) return 0
  return before - now
}

function toNum(v: string | number): number | undefined {
  if (v === '' || v === null || v === undefined) return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

async function run() {
  loading.value = true
  error.value = ''
  const lastOrder = results.value.map(r => r.venue.id)
  try {
    const body = {
      q: form.q.trim() || undefined,
      city: form.city.trim() || undefined,
      event_type: form.event_type || undefined,
      guests: toNum(form.guests),
      max_price: toNum(form.max_price),
      as_user_id: toNum(form.as_user_id),
      settings: props.settings,
    }
    const { data } = await api.post('/admin/search/preview', body)
    previousOrder.value = lastOrder
    results.value = data.data?.results || []
    understood.value = data.data?.understood || null
    ran.value = true
  } catch (e) {
    error.value = apiError(e, 'Could not run the preview.')
  } finally {
    loading.value = false
  }
}

function clear() {
  Object.assign(form, { q: '', city: '', event_type: '', guests: '', max_price: '', as_user_id: '' })
  results.value = []
  understood.value = null
  previousOrder.value = []
  ran.value = false
  error.value = ''
}

const chipTypes: Record<string, string> = {
  city: 'City', event_type: 'Event', guests: 'Guests', max_price: 'Budget', min_price: 'From',
  intent: 'Intent', term: 'Keyword', amenity: 'Amenity',
}
function chipType(t: string) { return chipTypes[t] || t }
function chipClass(t: string) {
  if (t === 'city') return 'badge-info'
  if (t === 'event_type') return 'badge-primary'
  if (t === 'guests' || t === 'max_price' || t === 'min_price') return 'badge-warning'
  return 'badge-warm'
}

defineExpose({ run })
</script>
