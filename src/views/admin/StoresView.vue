<template>
  <div class="space-y-5">
    <header class="page-header !mb-0">
      <div>
        <h1 class="page-title">Stores</h1>
        <p class="page-subtitle">Approve new shop owners, suspend problem stores and see how many venues each one lists.</p>
      </div>
    </header>

    <section class="card overflow-hidden">
      <nav class="tabs px-2 sm:px-4" role="tablist" aria-label="Store status">
        <button v-for="s in statusTabs" :key="s.value" role="tab" class="tab" :aria-selected="statusFilter === s.value" @click="setStatus(s.value)">{{ s.label }}</button>
      </nav>
      <DataToolbar v-model:search="search" placeholder="Search store name or city" :count="loading ? undefined : table.total.value" noun="stores" @update:search="resetAndLoad" />

      <div v-if="loading" class="p-4 space-y-3" aria-busy="true"><div v-for="i in 8" :key="i" class="skeleton h-10 w-full" /></div>

      <div v-else-if="loadError" class="empty-state">
        <div class="empty-state-icon"><AppIcon icon="alert-circle" class="w-5 h-5" /></div>
        <p class="empty-state-title">Couldn't load stores</p>
        <p class="empty-state-desc">{{ loadError }}</p>
        <div class="empty-state-actions"><button class="btn-primary" @click="table.load()">Try again</button></div>
      </div>

      <div v-else-if="table.rows.value.length === 0" class="empty-state">
        <div class="empty-state-icon"><AppIcon icon="building-store" class="w-5 h-5" /></div>
        <p class="empty-state-title">{{ statusFilter === 'pending' ? 'No stores waiting for approval' : 'No stores found' }}</p>
        <p class="empty-state-desc">{{ statusFilter === 'pending' ? 'New store sign-ups will appear here.' : 'Try a different search or status.' }}</p>
        <div class="empty-state-actions"><button class="btn-secondary" @click="search = ''; setStatus('')">Show all stores</button></div>
      </div>

      <ListBody v-else :busy="table.fetching.value">
        <!-- Phone -->
        <ul class="md:hidden divide-y divide-line">
          <li v-for="s in table.rows.value" :key="s.id" class="p-4">
            <div class="flex items-start gap-3">
              <span class="avatar w-9 h-9 text-xs shrink-0">{{ initials(s.name) }}</span>
              <div class="min-w-0 flex-1">
                <div class="flex items-start justify-between gap-2">
                  <p class="text-sm font-medium text-ink truncate">{{ s.name }}</p>
                  <span :class="statusBadgeClass(s.status)" class="shrink-0">{{ statusLabel(s.status) }}</span>
                </div>
                <p class="text-xs text-ink-muted truncate">{{ s.owner?.name }} · {{ s.owner?.email }}</p>
                <p class="text-xs text-ink-muted mt-1 num">{{ s.city || 'No city' }} · {{ s.venues_count ?? 0 }} venues · {{ s.bookings_count ?? 0 }} bookings</p>
              </div>
            </div>
            <div class="mt-3 flex flex-wrap gap-2">
              <button v-if="s.status === 'pending'" class="btn-primary btn-sm" :disabled="actions.isPending(s.id)" @click="openAction(s, 'approve')"><AppIcon v-if="actions.isPending(s.id, 'approve')" icon="loader" class="w-4 h-4 animate-spin" />Approve</button>
              <button v-if="s.status === 'approved'" class="btn-secondary btn-sm" :disabled="actions.isPending(s.id)" @click="openAction(s, 'suspend')"><AppIcon v-if="actions.isPending(s.id, 'suspend')" icon="loader" class="w-4 h-4 animate-spin" />Suspend</button>
              <button v-if="s.status === 'suspended'" class="btn-secondary btn-sm" :disabled="actions.isPending(s.id)" @click="openAction(s, 'approve')"><AppIcon v-if="actions.isPending(s.id, 'approve')" icon="loader" class="w-4 h-4 animate-spin" />Re-approve</button>
              <button class="btn-danger-ghost btn-sm ml-auto" :disabled="actions.isPending(s.id)" @click="openAction(s, 'delete')">Delete</button>
            </div>
          </li>
        </ul>

        <!-- Desktop -->
        <div class="hidden md:block table-wrapper max-h-[calc(100vh-300px)] min-h-[320px] scrollbar-thin">
          <table class="data-table">
            <thead>
              <tr>
                <th>Store</th><th>Owner</th><th>City</th><th class="cell-num">Venues</th><th class="cell-num">Bookings</th><th>Status</th><th>Joined</th>
                <th class="cell-actions"><span class="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in table.rows.value" :key="s.id">
                <td>
                  <div class="flex items-center gap-2.5 min-w-0">
                    <span class="avatar w-8 h-8 text-[11px] shrink-0">{{ initials(s.name) }}</span>
                    <span class="cell-primary truncate max-w-[200px]">{{ s.name }}</span>
                  </div>
                </td>
                <td>
                  <p class="text-ink truncate max-w-[200px]">{{ s.owner?.name }}</p>
                  <p class="text-xs text-ink-muted truncate max-w-[220px]">{{ s.owner?.email }}</p>
                </td>
                <td>{{ s.city || '—' }}</td>
                <td class="cell-num">{{ s.venues_count ?? 0 }}</td>
                <td class="cell-num">{{ s.bookings_count ?? 0 }}</td>
                <td><span :class="statusBadgeClass(s.status)">{{ statusLabel(s.status) }}</span></td>
                <td class="whitespace-nowrap">{{ formatDate(s.created_at) }}</td>
                <td class="cell-actions">
                  <div class="inline-flex items-center gap-1">
                    <button v-if="s.status === 'pending'" class="btn-primary btn-sm" :disabled="actions.isPending(s.id)" @click="openAction(s, 'approve')"><AppIcon v-if="actions.isPending(s.id, 'approve')" icon="loader" class="w-4 h-4 animate-spin" />Approve</button>
                    <button v-if="s.status === 'approved'" class="btn-ghost btn-sm" :disabled="actions.isPending(s.id)" @click="openAction(s, 'suspend')"><AppIcon v-if="actions.isPending(s.id, 'suspend')" icon="loader" class="w-4 h-4 animate-spin" />Suspend</button>
                    <button v-if="s.status === 'suspended'" class="btn-ghost btn-sm" :disabled="actions.isPending(s.id)" @click="openAction(s, 'approve')"><AppIcon v-if="actions.isPending(s.id, 'approve')" icon="loader" class="w-4 h-4 animate-spin" />Re-approve</button>
                    <a v-if="s.status === 'approved'" :href="`/stores/${s.id}`" target="_blank" rel="noopener" class="btn-icon btn-icon-sm" :aria-label="`Open ${s.name} public page`" title="Public page"><AppIcon icon="external-link" class="w-4 h-4" /></a>
                    <button class="btn-icon btn-icon-sm hover:!text-danger-text" :aria-label="`Delete ${s.name}`" title="Delete store" :disabled="actions.isPending(s.id)" @click="openAction(s, 'delete')"><AppIcon icon="trash" class="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <TablePager :page="table.page.value" :per-page="perPage" :total="table.total.value" @update:page="table.goTo" />
      </ListBody>
    </section>

    <ConfirmDialog v-model:visible="showActionDialog" :title="actionDialogTitle"
      :confirm-label="actionType === 'delete' ? 'Delete store' : actionType === 'approve' ? 'Approve store' : 'Suspend store'"
      :tone="actionType === 'approve' ? 'primary' : 'danger'" @confirm="doAction">
      <template v-if="actionType === 'delete'">Permanently delete store <strong class="text-ink">{{ actionTarget?.name }}</strong>? This can't be undone.</template>
      <template v-else-if="actionType === 'approve'">Approve store <strong class="text-ink">{{ actionTarget?.name }}</strong>? The owner will be able to add and manage venues.</template>
      <template v-else>Suspend store <strong class="text-ink">{{ actionTarget?.name }}</strong>? Their venues will be hidden from public listings.</template>
    </ConfirmDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/lib/axios'
import { formatDate } from '@/lib/format'
import { statusBadgeClass, statusLabel } from '@/lib/status'
import AppIcon from '@/components/ui/AppIcon.vue'
import DataToolbar from '@/components/admin/DataToolbar.vue'
import ConfirmDialog from '@/components/admin/ConfirmDialog.vue'
import ListBody from '@/components/admin/ListBody.vue'
import TablePager from '@/components/dashboard/TablePager.vue'
import { initials } from '@/components/dashboard/metrics'
import { useRowActions } from '@/composables/useRowActions'
import { useServerTable } from '@/composables/useServerTable'
import { useLiveRefresh } from '@/composables/useLiveRefresh'

const route = useRoute()
const router = useRouter()
const search = ref('')
const statusFilter = ref(typeof route.query.status === 'string' ? route.query.status : '')
const actionTarget = ref<any>(null)
const actionType = ref<'approve' | 'suspend' | 'delete'>('approve')
const showActionDialog = ref(false)
const perPage = 15

const statusTabs = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'rejected', label: 'Rejected' },
]

const actionDialogTitle = computed(() => {
  if (actionType.value === 'delete') return 'Delete store'
  if (actionType.value === 'approve') return 'Approve store'
  return 'Suspend store'
})

const actions = useRowActions()
const table = useServerTable<any>(async () => {
  const params: any = { per_page: perPage, page: table.page.value }
  if (search.value) params.search = search.value
  if (statusFilter.value) params.status = statusFilter.value
  const { data } = await api.get('/admin/stores', { params })
  return { rows: data.data.data, total: data.data.total, page: data.data.current_page }
}, { lock: s => actions.isPending(s.id) })
const loading = table.loading
const loadError = table.error

function resetAndLoad() { table.reset() }
function setStatus(v: string) {
  statusFilter.value = v
  router.replace({ query: { ...route.query, status: v || undefined } })
  resetAndLoad()
}

function openAction(store: any, type: 'approve' | 'suspend' | 'delete') {
  actionTarget.value = store
  actionType.value = type
  showActionDialog.value = true
}

function doAction() {
  const s = actionTarget.value
  if (!s) return
  const type = actionType.value
  showActionDialog.value = false
  if (type === 'delete') {
    let restore = () => {}
    actions.run(s.id, {
      apply: () => { restore = table.remove(s.id) },
      request: () => api.delete(`/admin/stores/${s.id}`),
      rollback: () => restore(),
      success: `${s.name} deleted`,
      error: 'Could not delete this store.',
      after: () => table.refresh(),
    }, 'delete')
    return
  }
  const prev = s.status
  const next = type === 'approve' ? 'approved' : 'suspended'
  actions.run(s.id, {
    apply: () => { s.status = next },
    request: () => api.patch(`/admin/stores/${s.id}/${type}`),
    rollback: () => { s.status = prev },
    success: type === 'approve' ? `${s.name} approved` : `${s.name} suspended`,
    error: 'Could not update this store.',
  }, type)
}

// New store sign-ups and status changes made elsewhere show up quietly.
useLiveRefresh(['store'], () => table.refresh())

table.load()
</script>
