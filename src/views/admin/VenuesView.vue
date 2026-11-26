<template>
  <div class="space-y-5">
    <header class="page-header !mb-0">
      <div>
        <h1 class="page-title">Venues</h1>
        <p class="page-subtitle">Every venue listed on the platform. Deactivate a venue to hide it from search.</p>
      </div>
      <div class="page-header-actions">
        <RouterLink to="/support/search" class="btn-secondary"><AppIcon icon="sliders" class="w-4 h-4" />Search &amp; ranking</RouterLink>
      </div>
    </header>

    <section class="card overflow-hidden">
      <nav class="tabs px-2 sm:px-4" role="tablist" aria-label="Venue status">
        <button v-for="s in statusTabs" :key="s.value" role="tab" class="tab" :aria-selected="statusFilter === s.value" @click="setStatus(s.value)">{{ s.label }}</button>
      </nav>
      <DataToolbar v-model:search="search" placeholder="Search venue or city" :count="loading ? undefined : table.total.value" noun="venues" @update:search="resetAndLoad" />

      <div v-if="loading" class="p-4 space-y-3" aria-busy="true"><div v-for="i in 8" :key="i" class="skeleton h-12 w-full" /></div>

      <div v-else-if="loadError" class="empty-state">
        <div class="empty-state-icon"><AppIcon icon="alert-circle" class="w-5 h-5" /></div>
        <p class="empty-state-title">Couldn't load venues</p>
        <p class="empty-state-desc">{{ loadError }}</p>
        <div class="empty-state-actions"><button class="btn-primary" @click="table.load()">Try again</button></div>
      </div>

      <div v-else-if="table.rows.value.length === 0" class="empty-state">
        <div class="empty-state-icon"><AppIcon icon="building" class="w-5 h-5" /></div>
        <p class="empty-state-title">No venues found</p>
        <p class="empty-state-desc">Try a different search or status.</p>
        <div class="empty-state-actions"><button class="btn-secondary" @click="search = ''; setStatus('')">Clear filters</button></div>
      </div>

      <ListBody v-else :busy="table.fetching.value">
        <!-- Phone -->
        <ul class="md:hidden divide-y divide-line">
          <li v-for="v in table.rows.value" :key="v.id" class="p-4 flex gap-3">
            <img v-if="v.thumbnail" :src="getStorageUrl(v.thumbnail)" :alt="v.name" class="w-16 h-12 rounded-md object-cover shrink-0 bg-surface-sunken" loading="lazy" />
            <div class="min-w-0 flex-1">
              <div class="flex items-start justify-between gap-2">
                <p class="text-sm font-medium text-ink truncate">{{ v.name }}</p>
                <span :class="statusBadgeClass(v.status)" class="shrink-0">{{ statusLabel(v.status) }}</span>
              </div>
              <p class="text-xs text-ink-muted truncate">{{ v.store?.name }} · {{ v.city }}</p>
              <div class="flex items-center justify-between gap-2 mt-2">
                <p class="text-xs text-ink-muted num">{{ v.capacity_min }}–{{ v.capacity_max }} guests · <AppIcon icon="star-filled" class="inline w-3 h-3 text-amber-500 fill-current -mt-0.5" /> {{ v.avg_rating ? Number(v.avg_rating).toFixed(1) : '—' }}</p>
                <button class="btn-secondary btn-sm" :disabled="actions.isPending(v.id)" :aria-busy="actions.isPending(v.id)" @click="openToggle(v)"><AppIcon v-if="actions.isPending(v.id)" icon="loader" class="w-4 h-4 animate-spin" />{{ v.status === 'active' ? 'Deactivate' : 'Activate' }}</button>
              </div>
            </div>
          </li>
        </ul>

        <!-- Desktop -->
        <div class="hidden md:block table-wrapper max-h-[calc(100vh-300px)] min-h-[320px] scrollbar-thin">
          <table class="data-table">
            <thead>
              <tr>
                <th>Venue</th><th>Store</th><th class="cell-num">Capacity</th><th class="cell-num">Price / head</th><th class="cell-num">Rating</th><th class="cell-num">Bookings</th><th>Status</th>
                <th class="cell-actions"><span class="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="v in table.rows.value" :key="v.id">
                <td>
                  <div class="flex items-center gap-3 min-w-0">
                    <img v-if="v.thumbnail" :src="getStorageUrl(v.thumbnail)" alt="" class="w-12 h-9 rounded-md object-cover shrink-0 bg-surface-sunken" loading="lazy" />
                    <span v-else class="w-12 h-9 rounded-md bg-surface-sunken shrink-0 flex items-center justify-center text-ink-muted"><AppIcon icon="image" class="w-4 h-4" /></span>
                    <div class="min-w-0">
                      <p class="cell-primary truncate max-w-[240px]">{{ v.name }}<span v-if="v.is_featured" class="badge-info ml-2 align-middle">Featured</span></p>
                      <p class="text-xs text-ink-muted truncate max-w-[240px]">{{ v.city }}</p>
                    </div>
                  </div>
                </td>
                <td class="max-w-[180px]"><span class="block truncate">{{ v.store?.name }}</span></td>
                <td class="cell-num">{{ v.capacity_min }}–{{ v.capacity_max }}</td>
                <td class="cell-num">{{ v.price_per_head ? formatPKR(v.price_per_head) : '—' }}</td>
                <td class="cell-num">
                  <span v-if="v.avg_rating" class="inline-flex items-center gap-1 text-ink"><AppIcon icon="star-filled" class="w-3.5 h-3.5 text-amber-500 fill-current" />{{ Number(v.avg_rating).toFixed(1) }}<span class="text-ink-muted text-xs">({{ v.total_reviews ?? 0 }})</span></span>
                  <span v-else class="text-ink-muted">—</span>
                </td>
                <td class="cell-num">{{ v.total_bookings ?? 0 }}</td>
                <td><span :class="statusBadgeClass(v.status)">{{ statusLabel(v.status) }}</span></td>
                <td class="cell-actions">
                  <div class="inline-flex items-center gap-1">
                    <button class="btn-ghost btn-sm" :disabled="actions.isPending(v.id)" :aria-busy="actions.isPending(v.id)" @click="openToggle(v)"><AppIcon v-if="actions.isPending(v.id)" icon="loader" class="w-4 h-4 animate-spin" />{{ v.status === 'active' ? 'Deactivate' : 'Activate' }}</button>
                    <a :href="`/venues/${v.id}`" target="_blank" rel="noopener" class="btn-icon btn-icon-sm" :aria-label="`Open ${v.name}`" title="Public page"><AppIcon icon="external-link" class="w-4 h-4" /></a>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <TablePager :page="table.page.value" :per-page="perPage" :total="table.total.value" @update:page="table.goTo" />
      </ListBody>
    </section>

    <ConfirmDialog v-model:visible="showToggleDialog" :title="(toggleWasActive ? 'Deactivate' : 'Activate') + ' venue'"
      :confirm-label="toggleWasActive ? 'Deactivate' : 'Activate'" :tone="toggleWasActive ? 'danger' : 'primary'" @confirm="doToggle">
      {{ toggleWasActive ? 'Deactivate' : 'Activate' }} venue <strong class="text-ink">{{ toggleTarget?.name }}</strong>?
      <span v-if="toggleWasActive"> It will no longer appear in public listings.</span>
    </ConfirmDialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import api from '@/lib/axios'
import { formatPKR } from '@/lib/format'
import { getStorageUrl } from '@/lib/storageUrl'
import { statusBadgeClass, statusLabel } from '@/lib/status'
import AppIcon from '@/components/ui/AppIcon.vue'
import DataToolbar from '@/components/admin/DataToolbar.vue'
import ConfirmDialog from '@/components/admin/ConfirmDialog.vue'
import ListBody from '@/components/admin/ListBody.vue'
import TablePager from '@/components/dashboard/TablePager.vue'
import { useRowActions } from '@/composables/useRowActions'
import { useServerTable } from '@/composables/useServerTable'
import { useLiveRefresh } from '@/composables/useLiveRefresh'

const search = ref('')
const statusFilter = ref('')
const toggleTarget = ref<any>(null)
const toggleWasActive = ref(false)
const showToggleDialog = ref(false)
const perPage = 15

const statusTabs = [
  { value: '', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'under_maintenance', label: 'Maintenance' },
]

const actions = useRowActions()
const table = useServerTable<any>(async () => {
  const params: any = { per_page: perPage, page: table.page.value }
  if (search.value) params.search = search.value
  if (statusFilter.value) params.status = statusFilter.value
  const { data } = await api.get('/admin/venues', { params })
  return { rows: data.data.data, total: data.data.total, page: data.data.current_page }
}, { lock: v => actions.isPending(v.id) })
const loading = table.loading
const loadError = table.error

function resetAndLoad() { table.reset() }
function setStatus(v: string) { statusFilter.value = v; resetAndLoad() }

function openToggle(v: any) {
  toggleTarget.value = v
  toggleWasActive.value = v.status === 'active'
  showToggleDialog.value = true
}

function doToggle() {
  const v = toggleTarget.value
  if (!v) return
  showToggleDialog.value = false
  const prev = v.status
  actions.run(v.id, {
    apply: () => { v.status = prev === 'active' ? 'inactive' : 'active' },
    request: () => api.patch(`/admin/venues/${v.id}/toggle-status`),
    // The server decides the final status; use what it sends back.
    onSuccess: ({ data }: any) => { if (data?.data?.status) v.status = data.data.status },
    rollback: () => { v.status = prev },
    success: () => `${v.name} ${v.status === 'active' ? 'activated' : 'deactivated'}`,
    error: 'Could not update this venue.',
  })
}

// Venues added or changed by shop owners show up quietly.
useLiveRefresh(['venue'], () => table.refresh())

table.load()
</script>
