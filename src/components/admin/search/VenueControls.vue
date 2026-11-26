<template>
  <div class="card overflow-hidden">
    <div class="p-5 sm:p-6 border-b border-line">
      <div class="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h2 class="text-lg font-semibold text-ink">Venue controls</h2>
          <p class="text-sm text-ink-muted mt-0.5">
            Manually lift or bury a venue in “Best match”. Each 10 boost points adds or removes 2 score points (max ±20).
          </p>
        </div>
        <div class="flex flex-col sm:flex-row gap-2">
          <TextInput v-model="filter" prefix-icon="search" clearable class="sm:!w-64" placeholder="Filter by name, city or store" aria-label="Filter venues" />
          <SelectInput
            v-model="sortKey"
            class="sm:!w-48"
            aria-label="Sort venues"
            :options="[{ value: 'name', label: 'Sort: Name' }, { value: 'impressions', label: 'Sort: Impressions' }, { value: 'clicks', label: 'Sort: Clicks' }, { value: 'ctr', label: 'Sort: CTR' }, { value: 'avg_rating', label: 'Sort: Rating' }, { value: 'search_boost', label: 'Sort: Boost' }]"
          />
          <CheckboxInput v-model="onlyBoosted" label="Only adjusted" class="whitespace-nowrap px-1 items-center" />
        </div>
      </div>
    </div>

    <div v-if="loading" class="p-5 space-y-3">
      <div v-for="i in 6" :key="i" class="skeleton h-12 w-full"></div>
    </div>
    <div v-else-if="error" class="empty-state">
      <div class="empty-state-icon"><AppIcon icon="alert-circle" class="w-6 h-6 text-red-500" /></div>
      <p class="empty-state-title">Couldn’t load venues</p>
      <p class="empty-state-desc">{{ error }}</p>
      <button class="btn-outline btn-sm mt-3" @click="emit('reload')">Retry</button>
    </div>
    <div v-else-if="!rows.length" class="empty-state">
      <div class="empty-state-icon"><AppIcon icon="map-pin-off" class="w-6 h-6" /></div>
      <p class="empty-state-title">{{ venues.length ? 'No venues match this filter' : 'No venues yet' }}</p>
    </div>
    <template v-else>
      <!-- Desktop table -->
      <div class="hidden md:block table-wrapper">
        <table class="w-full" data-testid="venue-table">
          <thead>
            <tr class="table-header">
              <th class="px-5 py-3">Venue</th>
              <th class="px-3 py-3 text-right">Impr.</th>
              <th class="px-3 py-3 text-right">Clicks</th>
              <th class="px-3 py-3 text-right">CTR</th>
              <th class="px-3 py-3 text-right">Rating</th>
              <th class="px-5 py-3 w-[22rem]">Search boost</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-line">
            <tr v-for="v in rows" :key="v.id" class="align-middle hover:bg-surface-hover" :data-venue-id="v.id">
              <td class="px-5 py-3">
                <p class="text-sm font-medium text-ink flex items-center gap-1.5">
                  {{ v.name }}
                  <AppIcon v-if="v.is_featured" icon="star-filled" class="w-3.5 h-3.5 text-amber-500" title="Featured" />
                  <span v-if="v.status !== 'active'" class="badge-warm badge-sm">{{ v.status }}</span>
                </p>
                <p class="text-xs text-ink-muted">{{ v.city || '—' }} · {{ v.store_name || '—' }}</p>
              </td>
              <td class="px-3 py-3 text-right text-sm tabular-nums text-ink-secondary">{{ num(v.impressions) }}</td>
              <td class="px-3 py-3 text-right text-sm tabular-nums text-ink-secondary">{{ num(v.clicks) }}</td>
              <td class="px-3 py-3 text-right text-sm tabular-nums text-ink-secondary">{{ v.impressions ? pct(v.ctr) : '—' }}</td>
              <td class="px-3 py-3 text-right text-sm tabular-nums text-ink-secondary">
                <template v-if="v.total_reviews">★ {{ Number(v.avg_rating).toFixed(1) }} <span class="text-ink-muted">({{ v.total_reviews }})</span></template>
                <span v-else class="text-ink-muted">—</span>
              </td>
              <td class="px-5 py-3"><BoostControl :venue="v" :state="state[v.id]" @set="b => setBoost(v, b)" @preview="b => (v.search_boost = b)" /></td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- Mobile cards -->
      <ul class="md:hidden divide-y divide-line">
        <li v-for="v in rows" :key="v.id" class="p-4" :data-venue-id="v.id">
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <p class="text-sm font-medium text-ink flex items-center gap-1.5">
                <span class="truncate">{{ v.name }}</span>
                <AppIcon v-if="v.is_featured" icon="star-filled" class="w-3.5 h-3.5 text-amber-500 shrink-0" />
              </p>
              <p class="text-xs text-ink-muted truncate">{{ v.city || '—' }} · {{ v.store_name || '—' }}</p>
            </div>
            <span v-if="v.total_reviews" class="text-xs text-ink-secondary whitespace-nowrap">★ {{ Number(v.avg_rating).toFixed(1) }}</span>
          </div>
          <div class="grid grid-cols-3 gap-2 my-3 text-center">
            <div class="rounded-lg bg-surface-sunken py-1.5"><p class="text-sm font-semibold tabular-nums text-ink">{{ num(v.impressions) }}</p><p class="text-[10px] uppercase text-ink-muted">Impr.</p></div>
            <div class="rounded-lg bg-surface-sunken py-1.5"><p class="text-sm font-semibold tabular-nums text-ink">{{ num(v.clicks) }}</p><p class="text-[10px] uppercase text-ink-muted">Clicks</p></div>
            <div class="rounded-lg bg-surface-sunken py-1.5"><p class="text-sm font-semibold tabular-nums text-ink">{{ v.impressions ? pct(v.ctr) : '—' }}</p><p class="text-[10px] uppercase text-ink-muted">CTR</p></div>
          </div>
          <BoostControl :venue="v" :state="state[v.id]" @set="b => setBoost(v, b)" @preview="b => (v.search_boost = b)" />
        </li>
      </ul>
      <p class="px-5 py-3 text-xs text-ink-muted border-t border-line">
        {{ rows.length }} of {{ venues.length }} venues · CTR = clicks ÷ impressions (all time).
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { TextInput, SelectInput, CheckboxInput } from '@/components/forms'
import { computed, reactive, ref } from 'vue'
import { toast } from 'vue-sonner'
import api from '@/lib/axios'
import AppIcon from '@/components/ui/AppIcon.vue'
import BoostControl, { type BoostState } from './BoostControl.vue'
import { apiError, num, pct } from './signals'

export interface AdminSearchVenue {
  id: number; name: string; city: string | null; store_name: string | null; status: string
  is_featured: boolean; search_boost: number; avg_rating: number | null; total_reviews: number
  impressions: number; clicks: number; ctr: number
}

const props = defineProps<{ venues: AdminSearchVenue[]; loading: boolean; error: string }>()
const emit = defineEmits<{ reload: [] }>()

const filter = ref('')
const sortKey = ref<'name' | 'impressions' | 'clicks' | 'ctr' | 'avg_rating' | 'search_boost'>('name')
const onlyBoosted = ref(false)
const state = reactive<Record<number, BoostState>>({})

const rows = computed(() => {
  const f = filter.value.trim().toLowerCase()
  let list = props.venues.filter(v =>
    (!f || [v.name, v.city, v.store_name].some(x => (x || '').toLowerCase().includes(f)))
    && (!onlyBoosted.value || v.search_boost !== 0),
  )
  const k = sortKey.value
  list = [...list].sort((a, b) =>
    k === 'name' ? a.name.localeCompare(b.name) : (Number(b[k]) || 0) - (Number(a[k]) || 0),
  )
  return list
})

async function setBoost(v: AdminSearchVenue, boost: number) {
  const value = Math.max(-100, Math.min(100, Math.round(boost)))
  const prev = state[v.id]?.saved ?? v.search_boost
  v.search_boost = value
  state[v.id] = { status: 'saving', saved: prev }
  try {
    const { data } = await api.patch(`/admin/search/venues/${v.id}/boost`, { search_boost: value })
    Object.assign(v, data.data || {})
    state[v.id] = { status: 'saved', saved: v.search_boost }
    setTimeout(() => { if (state[v.id]?.status === 'saved') state[v.id] = { status: 'idle', saved: v.search_boost } }, 1800)
  } catch (e) {
    v.search_boost = prev
    const message = apiError(e, 'Could not save boost.')
    state[v.id] = { status: 'error', saved: prev, message }
    toast.error(`${v.name}: ${message}`)
  }
}
</script>
