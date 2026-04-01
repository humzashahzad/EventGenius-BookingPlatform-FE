<template>
  <div class="content-container">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-warm-900 dark:text-warm-50">Venues</h1>
        <p class="text-warm-500 dark:text-warm-400 mt-1">Browse and manage all venues across the platform.</p>
      </div>
    </div>

    <div v-if="!loading" class="flex justify-end mb-6">
      <span class="text-sm text-warm-400 dark:text-warm-500">{{ meta.total }} venues</span>
    </div>

    <!-- Table Card -->
    <div class="card">
      <!-- Loading -->
      <div v-if="loading" class="p-5">
        <div v-for="i in 8" :key="i" class="flex gap-3 py-3 border-b border-warm-100 dark:border-warm-800 last:border-0 animate-pulse">
          <div class="h-4 w-1/4 rounded-lg bg-warm-200 dark:bg-warm-700"></div>
          <div class="h-4 w-1/6 rounded-lg bg-warm-200 dark:bg-warm-700"></div>
          <div class="h-4 w-1/12 rounded-lg bg-warm-200 dark:bg-warm-700"></div>
          <div class="h-4 w-1/12 rounded-lg bg-warm-200 dark:bg-warm-700"></div>
          <div class="h-4 w-1/12 rounded-lg bg-warm-200 dark:bg-warm-700 ml-auto"></div>
        </div>
      </div>

      <!-- Empty -->
      <div v-else-if="venues.length === 0" class="p-5 text-center py-12">
        <div class="w-14 h-14 rounded-2xl bg-warm-100 dark:bg-warm-800 flex items-center justify-center mx-auto mb-4">
          <AppIcon icon="map-pin" class="w-7 h-7 text-warm-400" />
        </div>
        <p class="font-medium text-warm-700 dark:text-warm-300 mb-1">No venues found</p>
        <p class="text-warm-500 dark:text-warm-400 text-sm">Try adjusting your filters.</p>
      </div>

      <!-- Table -->
      <div v-else class="table-wrapper overflow-x-auto">
        <table class="w-full min-w-[700px]">
          <thead>
            <tr class="table-header">
              <th class="text-left px-5 py-3 text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">#</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">Venue</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">Store</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">City</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">Capacity</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">Status</th>
              <th class="text-center px-5 py-3 text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">Rating</th>
              <th class="text-right px-5 py-3 text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(v, idx) in venues" :key="v.id" class="table-row">
              <td class="px-5 py-3 text-sm text-warm-400 dark:text-warm-500">{{ (meta.current_page - 1) * perPage + idx + 1 }}</td>
              <td class="px-5 py-3 text-sm font-semibold text-warm-800 dark:text-warm-200">{{ v.name }}</td>
              <td class="px-5 py-3">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                    <span class="text-[9px] font-bold text-primary-700 dark:text-primary-300">{{ v.store?.name?.[0]?.toUpperCase() }}</span>
                  </div>
                  <span class="text-sm text-warm-700 dark:text-warm-300">{{ v.store?.name }}</span>
                </div>
              </td>
              <td class="px-5 py-3 text-sm text-warm-500 dark:text-warm-400">{{ v.city }}</td>
              <td class="px-5 py-3 text-sm text-warm-500 dark:text-warm-400 whitespace-nowrap">{{ v.capacity_min }}--{{ v.capacity_max }}</td>
              <td class="px-5 py-3">
                <span :class="venueStatusClass(v.status)" class="capitalize">
                  {{ v.status?.replace('_', ' ') }}
                </span>
              </td>
              <td class="px-5 py-3 text-center">
                <div v-if="v.avg_rating" class="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium text-sm">
                  <AppIcon icon="star" class="w-3.5 h-3.5" />
                  {{ v.avg_rating.toFixed(1) }}
                </div>
                <span v-else class="text-warm-400 dark:text-warm-500">---</span>
              </td>
              <td class="px-5 py-3 text-right">
                <button @click="openToggle(v)" class="text-sm font-medium px-3 py-1.5 rounded-xl transition-all" :class="v.status === 'active' ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50'">
                  {{ v.status === 'active' ? 'Deactivate' : 'Activate' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="meta.last_page > 1" class="flex flex-wrap items-center justify-between mt-6">
      <p class="text-sm text-warm-500 dark:text-warm-400">Showing {{ (meta.current_page - 1) * perPage + 1 }}--{{ Math.min(meta.current_page * perPage, meta.total) }} of {{ meta.total }} venues</p>
      <nav class="flex items-center gap-1">
        <button class="w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-all" :class="meta.current_page === 1 ? 'text-warm-300 dark:text-warm-600 cursor-not-allowed' : 'text-warm-600 dark:text-warm-400 hover:bg-warm-100 dark:hover:bg-warm-800'" :disabled="meta.current_page === 1" @click="changePage(meta.current_page - 1)">
          <AppIcon icon="chevron-left" class="w-4 h-4" />
        </button>
        <template v-for="p in pageRange" :key="p">
          <span v-if="p === '...'" class="w-8 h-8 flex items-center justify-center text-sm text-warm-400 dark:text-warm-500">...</span>
          <button v-else class="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-medium transition-all" :class="meta.current_page === p ? 'bg-primary-600 text-white shadow-soft' : 'text-warm-600 dark:text-warm-400 hover:bg-warm-100 dark:hover:bg-warm-800'" @click="changePage(Number(p))">{{ p }}</button>
        </template>
        <button class="w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-all" :class="meta.current_page === meta.last_page ? 'text-warm-300 dark:text-warm-600 cursor-not-allowed' : 'text-warm-600 dark:text-warm-400 hover:bg-warm-100 dark:hover:bg-warm-800'" :disabled="meta.current_page === meta.last_page" @click="changePage(meta.current_page + 1)">
          <AppIcon icon="chevron-right" class="w-4 h-4" />
        </button>
      </nav>
    </div>

    <!-- Toggle Status Dialog -->
    <VuexyModal v-model:visible="showToggleDialog" :title="(toggleTarget?.status === 'active' ? 'Deactivate' : 'Activate') + ' Venue'" width="28rem">
      <p class="text-warm-500 dark:text-warm-400">
        Are you sure you want to <strong class="text-warm-800 dark:text-warm-200">{{ toggleTarget?.status === 'active' ? 'deactivate' : 'activate' }}</strong> venue
        <strong class="text-warm-800 dark:text-warm-200">{{ toggleTarget?.name }}</strong>?
        <span v-if="toggleTarget?.status === 'active'"> It will no longer appear in public listings.</span>
      </p>
      <template #footer>
        <button class="btn-secondary" @click="showToggleDialog = false">Cancel</button>
        <button :class="toggleTarget?.status === 'active' ? 'btn-danger' : 'btn-primary'" :disabled="acting" @click="doToggle">
          <AppIcon v-if="acting" icon="loader" class="w-4 h-4 animate-spin mr-1.5" />
          {{ toggleTarget?.status === 'active' ? 'Deactivate' : 'Activate' }}
        </button>
      </template>
    </VuexyModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import api from '@/lib/axios'
import { useTopBarActionsStore } from '@/stores/topBarActions'
import AppIcon from '@/components/ui/AppIcon.vue'
import VuexyModal from '@/components/ui/VuexyModal.vue'

const venues       = ref<any[]>([])
const loading      = ref(false)
const acting       = ref(false)
const search       = ref('')
const statusFilter = ref('')
const toggleTarget = ref<any>(null)
const showToggleDialog = ref(false)
const perPage      = 15
const meta         = ref({ current_page: 1, last_page: 1, total: 0 })
let page = 1
const topBarActions = useTopBarActionsStore()

async function load() {
  loading.value = true
  try {
    const params: any = { per_page: perPage, page }
    if (search.value)       params.search = search.value
    if (statusFilter.value) params.status = statusFilter.value
    const { data } = await api.get('/admin/venues', { params })
    venues.value = data.data.data
    meta.value   = { current_page: data.data.current_page, last_page: data.data.last_page, total: data.data.total }
  } finally { loading.value = false }
}

function resetAndLoad() { page = 1; load() }
function changePage(p: number) { page = p; load() }

function openToggle(v: any) {
  toggleTarget.value = v
  showToggleDialog.value = true
}

async function doToggle() {
  if (!toggleTarget.value) return
  acting.value = true
  try {
    const { data } = await api.patch(`/admin/venues/${toggleTarget.value.id}/toggle-status`)
    toggleTarget.value.status = data.data.status
    showToggleDialog.value = false
    toggleTarget.value = null
  } finally { acting.value = false }
}

function venueStatusClass(s: string) {
  const m: Record<string, string> = { active: 'badge-primary', inactive: 'badge-accent', under_maintenance: 'badge-coral' }
  return m[s] || 'badge-warm'
}

const pageRange = computed(() => {
  const total = meta.value.last_page, cur = meta.value.current_page
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | string)[] = [1]
  if (cur > 3) pages.push('...')
  for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i)
  if (cur < total - 2) pages.push('...')
  pages.push(total)
  return pages
})

onMounted(() => {
  load()
  topBarActions.set({
    searchPlaceholder: 'Search venue or city...',
    searchValue: search.value,
    filterOptions: [
      { key: 'status', label: 'All Status', options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'under_maintenance', label: 'Maintenance' },
      ]},
    ],
    initialFilterValues: { status: statusFilter.value },
    onSearch(q: string) {
      search.value = q
      resetAndLoad()
    },
    onFilter(key: string, value: string) {
      if (key === 'status') statusFilter.value = value
      resetAndLoad()
    },
  })
})

onUnmounted(() => {
  topBarActions.clear()
})
</script>
