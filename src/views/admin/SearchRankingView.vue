<template>
  <div class="search-ranking space-y-5">
    <header class="page-header !mb-0">
      <div>
        <h1 class="page-title">Search &amp; ranking</h1>
        <p class="page-subtitle">Tune how “Best match” orders venues, test it live, and see what customers search for.</p>
      </div>
      <div v-if="dirty" class="page-header-actions">
        <span class="badge-pending">Unsaved weight changes</span>
        <button class="btn-secondary btn-sm" :disabled="saving" @click="discard">Discard</button>
        <button class="btn-primary btn-sm" :disabled="saving" @click="save">Save</button>
      </div>
    </header>

    <nav class="tabs" role="tablist" aria-label="Search and ranking sections">
      <button
        v-for="t in tabs"
        :key="t.key"
        role="tab"
        type="button"
        class="tab"
        :aria-selected="tab === t.key"
        :data-tab="t.key"
        @click="setTab(t.key)"
      >
        <AppIcon :icon="t.icon" class="w-4 h-4" />
        {{ t.label }}
        <span v-if="t.key === 'weights' && dirty" class="w-1.5 h-1.5 rounded-full bg-warning" aria-label="unsaved"></span>
      </button>
    </nav>

    <!-- Settings-dependent tabs -->
    <template v-if="tab === 'weights' || tab === 'console'">
      <div v-if="settingsLoading" class="grid grid-cols-1 xl:grid-cols-3 gap-6" aria-busy="true">
        <div class="card p-6 xl:col-span-2 space-y-5">
          <div class="skeleton h-6 w-48"></div>
          <div v-for="i in 6" :key="i" class="space-y-2"><div class="skeleton h-4 w-40"></div><div class="skeleton h-2 w-full"></div></div>
        </div>
        <div class="skeleton h-72"></div>
      </div>
      <div v-else-if="settingsError || !draft" class="card empty-state">
        <div class="empty-state-icon"><AppIcon icon="alert-circle" class="w-5 h-5" /></div>
        <p class="empty-state-title">Couldn’t load ranking settings</p>
        <p class="empty-state-desc">{{ settingsError || 'No settings returned.' }}</p>
        <div class="empty-state-actions"><button class="btn-primary btn-sm" @click="loadSettings">Try again</button></div>
      </div>
      <template v-else>
        <WeightsPanel
          v-show="tab === 'weights'"
          v-model="draft"
          :defaults="defaults"
          :presets="presets"
          :dirty="dirty"
          :saving="saving"
          :error="saveError"
          :active-preset="activePreset"
          @save="save"
          @discard="discard"
          @reset="resetDefaults"
          @preset="applyPreset"
          @try="setTab('console')"
        />
        <TestConsole
          v-show="tab === 'console'"
          :settings="draft"
          :dirty="dirty"
          :cities="cities"
          :categories="categoryStore.categories"
        />
      </template>
    </template>

    <VenueControls v-if="tab === 'venues'" :venues="venues" :loading="venuesLoading" :error="venuesError" @reload="loadVenues" />
    <AnalyticsPanel v-if="tab === 'analytics'" />

  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { toast as sonner } from 'vue-sonner'
import api from '@/lib/axios'
import AppIcon from '@/components/ui/AppIcon.vue'
import { useCategoriesStore } from '@/stores/categories'
import WeightsPanel from '@/components/admin/search/WeightsPanel.vue'
import TestConsole from '@/components/admin/search/TestConsole.vue'
import VenueControls, { type AdminSearchVenue } from '@/components/admin/search/VenueControls.vue'
import AnalyticsPanel from '@/components/admin/search/AnalyticsPanel.vue'
import { apiError, cloneSettings, type RankingSettings } from '@/components/admin/search/signals'

type TabKey = 'weights' | 'console' | 'venues' | 'analytics'
const tabs: { key: TabKey; label: string; icon: string }[] = [
  { key: 'weights', label: 'Ranking weights', icon: 'sliders' },
  { key: 'console', label: 'Try a search', icon: 'search' },
  { key: 'venues', label: 'Venue controls', icon: 'map-pin' },
  { key: 'analytics', label: 'Analytics', icon: 'layout-dashboard' },
]

const route = useRoute()
const router = useRouter()
const categoryStore = useCategoriesStore()

const initialTab = String(route.query.tab || '')
const tab = ref<TabKey>(tabs.some(t => t.key === initialTab) ? (initialTab as TabKey) : 'weights')
function setTab(k: TabKey) {
  tab.value = k
  router.replace({ query: { ...route.query, tab: k === 'weights' ? undefined : k } })
  if (k === 'venues' && !venues.value.length && !venuesLoading.value) loadVenues()
}

// ── Settings ────────────────────────────────────────────────────────────
const saved = ref<RankingSettings | null>(null)
const draft = ref<RankingSettings | null>(null)
const defaults = ref<RankingSettings | null>(null)
const presets = ref<Record<string, unknown>>({})
const settingsLoading = ref(true)
const settingsError = ref('')
const saving = ref(false)
const saveError = ref('')

const dirty = computed(() => !!draft.value && !!saved.value && JSON.stringify(draft.value) !== JSON.stringify(saved.value))

function presetPartial(key: string): Partial<RankingSettings> | null {
  const p = presets.value[key] as Record<string, unknown> | undefined
  if (!p) return null
  // Presets may be a bare weights map or a partial settings object.
  return ('weights' in p ? p : { weights: p }) as Partial<RankingSettings>
}

const activePreset = computed(() => {
  if (!draft.value) return null
  const w = JSON.stringify(draft.value.weights)
  for (const key of Object.keys(presets.value)) {
    const p = presetPartial(key)
    if (p?.weights && JSON.stringify({ ...draft.value.weights, ...p.weights }) === w) return key
  }
  return null
})

async function loadSettings() {
  settingsLoading.value = true
  settingsError.value = ''
  try {
    const { data } = await api.get('/admin/search/settings')
    saved.value = data.data.settings
    defaults.value = data.data.defaults
    presets.value = data.data.presets || {}
    draft.value = cloneSettings(data.data.settings)
  } catch (e) {
    settingsError.value = apiError(e, 'Could not load ranking settings.')
  } finally {
    settingsLoading.value = false
  }
}

async function save() {
  if (!draft.value) return
  saving.value = true
  saveError.value = ''
  try {
    const { data } = await api.put('/admin/search/settings', draft.value)
    saved.value = data.data.settings
    draft.value = cloneSettings(data.data.settings)
    showToast('Ranking weights saved — live for all customers.')
  } catch (e) {
    saveError.value = apiError(e, 'Could not save settings.')
  } finally {
    saving.value = false
  }
}

function discard() {
  if (saved.value) draft.value = cloneSettings(saved.value)
}
function resetDefaults() {
  if (defaults.value) draft.value = cloneSettings(defaults.value)
  showToast('Defaults loaded — press Save to apply.')
}
function applyPreset(key: string) {
  const p = presetPartial(key)
  if (!p || !draft.value) return
  draft.value = { ...draft.value, ...cloneSettings(p), weights: { ...draft.value.weights, ...(p.weights || {}) } } as RankingSettings
}

// ── Venues (shared: venue controls + city suggestions) ──────────────────
const venues = ref<AdminSearchVenue[]>([])
const venuesLoading = ref(false)
const venuesError = ref('')
const cities = computed(() => [...new Set(venues.value.map(v => v.city).filter((c): c is string => !!c))].sort())

async function loadVenues() {
  venuesLoading.value = true
  venuesError.value = ''
  try {
    const { data } = await api.get('/admin/search/venues')
    venues.value = data.data || []
  } catch (e) {
    venuesError.value = apiError(e, 'Could not load venues.')
  } finally {
    venuesLoading.value = false
  }
}

// ── Misc ────────────────────────────────────────────────────────────────
function showToast(msg: string) {
  sonner.success(msg)
}

function beforeUnload(e: BeforeUnloadEvent) {
  if (dirty.value) { e.preventDefault(); e.returnValue = '' }
}
onBeforeRouteLeave(() => {
  if (dirty.value) return window.confirm('You have unsaved ranking weight changes. Leave without saving?')
  return true
})

onMounted(() => {
  loadSettings()
  loadVenues()
  if (!categoryStore.categories.length) categoryStore.fetchCategories()
  window.addEventListener('beforeunload', beforeUnload)
})
onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', beforeUnload)
})
</script>

<style>
/* Signal colours: slots 1-8 follow a colour-blind-validated categorical order; the last
   two are neutrals. Dark mode uses its own steps, not an automatic flip. */
.search-ranking {
  --sig-relevance: #2a78d6;
  --sig-quality: #eb6834;
  --sig-popularity: #1baf7a;
  --sig-reliability: #eda100;
  --sig-price-fit: #e87ba4;
  --sig-capacity-fit: #008300;
  --sig-distance: #6250d6;
  --sig-engagement: #e34948;
  --sig-freshness: #a8a29e;
  --sig-personal: #57534e;
  --sig-sentiment: #00a0b0;
  --sig-featured: #eda100;
  --sig-boost: #78716c;
  --chart-1: #2a78d6;
  --chart-2: #1baf7a;
}
.dark .search-ranking {
  --sig-relevance: #3987e5;
  --sig-quality: #d95926;
  --sig-popularity: #199e70;
  --sig-reliability: #c98500;
  --sig-price-fit: #d55181;
  --sig-capacity-fit: #0ca30c;
  --sig-distance: #9085e9;
  --sig-engagement: #e66767;
  --sig-freshness: #a8a29e;
  --sig-personal: #78716c;
  --sig-sentiment: #14a6b5;
  --sig-featured: #c98500;
  --sig-boost: #a8a29e;
  --chart-1: #3987e5;
  --chart-2: #199e70;
}
</style>
