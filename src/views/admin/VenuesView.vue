<template>
  <div class="page-container">
    <div class="page-header">
      <div><h1 class="page-title">Venues</h1><p class="page-subtitle">Browse and manage all venues across the platform.</p></div>
    </div>

    <!-- Toolbar -->
    <div class="card">
      <div class="card-body py-3">
        <div class="flex flex-wrap items-center gap-3">
          <div class="search-bar flex-1 min-w-48">
            <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input v-model="search" @input="debouncedSearch" class="form-input pl-10" placeholder="Search venue or city…" />
          </div>
          <select v-model="statusFilter" @change="resetAndLoad" class="form-select w-44">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="under_maintenance">Maintenance</option>
          </select>
          <span v-if="!loading" class="ml-auto text-sm text-surface-500">{{ meta.total }} venues</span>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="table-wrapper">
      <div v-if="loading" class="bg-[var(--color-bg-card)]">
        <div v-for="i in 8" :key="i" class="flex gap-4 px-4 py-4 border-b border-surface-100">
          <div class="skeleton h-4 w-40 rounded"></div>
          <div class="skeleton h-4 w-28 rounded"></div>
          <div class="skeleton h-4 w-20 rounded"></div>
          <div class="skeleton h-4 w-16 rounded"></div>
          <div class="skeleton h-4 w-14 rounded ml-auto"></div>
        </div>
      </div>
      <div v-else-if="venues.length === 0" class="empty-state bg-[var(--color-bg-card)] rounded-xl">
        <div class="empty-state-icon"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/></svg></div>
        <p class="empty-state-title">No venues found</p>
        <p class="empty-state-desc">Try adjusting your filters.</p>
      </div>
      <table v-else class="table">
        <thead><tr>
          <th>#</th><th>Venue</th><th>Store</th><th>City</th>
          <th>Capacity</th><th>Status</th>
          <th class="text-center">Rating</th>
          <th class="text-right">Actions</th>
        </tr></thead>
        <tbody>
          <tr v-for="(v, idx) in venues" :key="v.id">
            <td class="text-surface-400 text-xs w-10">{{ (meta.current_page - 1) * perPage + idx + 1 }}</td>
            <td class="font-semibold text-surface-800">{{ v.name }}</td>
            <td>
              <span class="inline-flex items-center gap-1.5 text-sm text-surface-600">
                <span class="w-5 h-5 rounded bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <span class="text-2xs font-bold text-primary-700">{{ v.store?.name?.[0]?.toUpperCase() }}</span>
                </span>
                {{ v.store?.name }}
              </span>
            </td>
            <td class="text-surface-500">{{ v.city }}</td>
            <td class="text-surface-500 whitespace-nowrap">{{ v.capacity_min }}–{{ v.capacity_max }}</td>
            <td>
              <span :class="venueStatusClass(v.status)" class="capitalize">
                {{ v.status?.replace('_', ' ') }}
              </span>
            </td>
            <td class="text-center">
              <div v-if="v.avg_rating" class="inline-flex items-center gap-1 text-sm font-medium text-warning-600">
                <svg class="w-3.5 h-3.5 fill-warning-400" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                {{ v.avg_rating.toFixed(1) }}
              </div>
              <span v-else class="text-surface-300 text-sm">—</span>
            </td>
            <td class="text-right">
              <button @click="openToggle(v)" :class="v.status === 'active' ? 'text-warning-600 hover:bg-warning-50' : 'text-success-600 hover:bg-success-50'"
                class="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors">
                {{ v.status === 'active' ? 'Deactivate' : 'Activate' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="meta.last_page > 1" class="pagination">
      <p class="pagination-info">Showing {{ (meta.current_page - 1) * perPage + 1 }}–{{ Math.min(meta.current_page * perPage, meta.total) }} of {{ meta.total }} venues</p>
      <div class="pagination-controls">
        <button @click="changePage(meta.current_page - 1)" :disabled="meta.current_page === 1" class="pagination-btn">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <template v-for="p in pageRange" :key="p">
          <span v-if="p === '...'" class="w-8 h-8 flex items-center justify-center text-surface-400 text-sm">…</span>
          <button v-else @click="changePage(Number(p))" :class="['pagination-btn', meta.current_page === p ? 'active' : '']">{{ p }}</button>
        </template>
        <button @click="changePage(meta.current_page + 1)" :disabled="meta.current_page === meta.last_page" class="pagination-btn">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        </button>
      </div>
    </div>

    <!-- Toggle Status Dialog -->
    <Dialog v-model:visible="showToggleDialog" modal :header="(toggleTarget?.status === 'active' ? 'Deactivate' : 'Activate') + ' Venue'" :style="{ width: '28rem' }" :pt="dialogPt">
      <p class="text-sm text-surface-600">
        Are you sure you want to <strong>{{ toggleTarget?.status === 'active' ? 'deactivate' : 'activate' }}</strong> venue
        <strong class="text-surface-900">{{ toggleTarget?.name }}</strong>?
        <span v-if="toggleTarget?.status === 'active'"> It will no longer appear in public listings.</span>
      </p>
      <template #footer>
        <Button label="Cancel" severity="secondary" text @click="showToggleDialog = false" />
        <Button
          :label="toggleTarget?.status === 'active' ? 'Deactivate' : 'Activate'"
          :severity="toggleTarget?.status === 'active' ? 'danger' : 'success'"
          :loading="acting"
          @click="doToggle"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api from '@/lib/axios'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'

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
let searchTimeout: ReturnType<typeof setTimeout>

const dialogPt = {
  root: { class: '!bg-[var(--color-bg-card)] !border-[var(--color-border)] !text-[var(--color-text)]' },
  header: { class: '!bg-[var(--color-bg-card)] !text-[var(--color-text)] !border-b !border-[var(--color-border)]' },
  content: { class: '!bg-[var(--color-bg-card)] !text-[var(--color-text)]' },
  footer: { class: '!bg-[var(--color-bg-card)] !border-t !border-[var(--color-border)]' },
}

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
function debouncedSearch() { clearTimeout(searchTimeout); searchTimeout = setTimeout(() => resetAndLoad(), 400) }
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
  const m: Record<string, string> = { active: 'badge-success', inactive: 'badge-warning', under_maintenance: 'badge-danger' }
  return m[s] || 'badge-gray'
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

onMounted(load)
</script>
