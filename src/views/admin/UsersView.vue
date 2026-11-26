<template>
  <div class="space-y-5">
    <header class="page-header !mb-0">
      <div>
        <h1 class="page-title">Users</h1>
        <p class="page-subtitle">Everyone registered on the platform — customers, shop owners and support staff.</p>
      </div>
    </header>

    <section class="card overflow-hidden">
      <nav class="tabs px-2 sm:px-4" role="tablist" aria-label="Role">
        <button v-for="r in roleTabs" :key="r.value" role="tab" class="tab" :aria-selected="roleFilter === r.value" @click="setRole(r.value)">{{ r.label }}</button>
      </nav>
      <DataToolbar v-model:search="search" placeholder="Search name or email" :count="loading ? undefined : table.total.value" noun="users" @update:search="resetAndLoad">
        <SelectInput v-model="statusFilter" :options="[{ value: '', label: 'Any status' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]" aria-label="Status" @change="resetAndLoad" />
      </DataToolbar>

      <div v-if="loading" class="p-4 space-y-3" aria-busy="true"><div v-for="i in 8" :key="i" class="skeleton h-10 w-full" /></div>

      <div v-else-if="loadError" class="empty-state">
        <div class="empty-state-icon"><AppIcon icon="alert-circle" class="w-5 h-5" /></div>
        <p class="empty-state-title">Couldn't load users</p>
        <p class="empty-state-desc">{{ loadError }}</p>
        <div class="empty-state-actions"><button class="btn-primary" @click="table.load()">Try again</button></div>
      </div>

      <div v-else-if="table.rows.value.length === 0" class="empty-state">
        <div class="empty-state-icon"><AppIcon icon="users" class="w-5 h-5" /></div>
        <p class="empty-state-title">No users found</p>
        <p class="empty-state-desc">Try a different search, role or status.</p>
        <div class="empty-state-actions"><button class="btn-secondary" @click="clearFilters">Clear filters</button></div>
      </div>

      <ListBody v-else :busy="table.fetching.value">
        <!-- Phone -->
        <ul class="md:hidden divide-y divide-line">
          <li v-for="u in table.rows.value" :key="u.id" class="p-4 flex items-start gap-3">
            <span class="avatar w-9 h-9 text-xs shrink-0">{{ initials(u.name) }}</span>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-ink truncate">{{ u.name }}</p>
              <p class="text-xs text-ink-muted truncate">{{ u.email }}</p>
              <div class="flex flex-wrap items-center gap-1.5 mt-2">
                <span :class="roleBadge(u.role)">{{ roleLabel(u.role) }}</span>
                <span :class="u.is_active ? 'badge-confirmed' : 'badge-cancelled'">{{ u.is_active ? 'Active' : 'Inactive' }}</span>
                <span class="text-xs text-ink-muted">Joined {{ formatDate(u.created_at) }}</span>
              </div>
            </div>
            <div v-if="u.id !== authStore.user?.id" class="flex flex-col gap-1 shrink-0">
              <button class="btn-secondary btn-sm" :disabled="actions.isPending(u.id)" :aria-busy="actions.isPending(u.id, 'toggle')" @click="confirmToggle(u)"><AppIcon v-if="actions.isPending(u.id, 'toggle')" icon="loader" class="w-4 h-4 animate-spin" />{{ u.is_active ? 'Deactivate' : 'Activate' }}</button>
              <button class="btn-danger-ghost btn-sm" :disabled="actions.isPending(u.id)" @click="confirmDelete(u)">Delete</button>
            </div>
            <span v-else class="badge-neutral shrink-0">You</span>
          </li>
        </ul>

        <!-- Desktop -->
        <div class="hidden md:block table-wrapper max-h-[calc(100vh-300px)] min-h-[320px] scrollbar-thin">
          <table class="data-table">
            <thead>
              <tr>
                <th>User</th><th>Role</th><th>Status</th><th>Phone</th><th>Last seen</th><th>Joined</th>
                <th class="cell-actions"><span class="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in table.rows.value" :key="u.id">
                <td>
                  <div class="flex items-center gap-2.5 min-w-0">
                    <span class="avatar w-8 h-8 text-[11px] shrink-0">{{ initials(u.name) }}</span>
                    <div class="min-w-0">
                      <p class="cell-primary truncate max-w-[220px]">{{ u.name }}</p>
                      <p class="text-xs text-ink-muted truncate max-w-[260px]">{{ u.email }}</p>
                    </div>
                  </div>
                </td>
                <td><span :class="roleBadge(u.role)">{{ roleLabel(u.role) }}</span></td>
                <td><span :class="u.is_active ? 'badge-confirmed' : 'badge-cancelled'">{{ u.is_active ? 'Active' : 'Inactive' }}</span></td>
                <td class="whitespace-nowrap num">{{ u.phone || '—' }}</td>
                <td class="whitespace-nowrap text-ink-muted">{{ u.last_seen_at ? timeAgo(u.last_seen_at) : 'Never' }}</td>
                <td class="whitespace-nowrap">{{ formatDate(u.created_at) }}</td>
                <td class="cell-actions">
                  <span v-if="u.id === authStore.user?.id" class="badge-neutral">You</span>
                  <div v-else class="inline-flex items-center gap-1">
                    <button class="btn-ghost btn-sm" :disabled="actions.isPending(u.id)" :aria-busy="actions.isPending(u.id, 'toggle')" @click="confirmToggle(u)"><AppIcon v-if="actions.isPending(u.id, 'toggle')" icon="loader" class="w-4 h-4 animate-spin" />{{ u.is_active ? 'Deactivate' : 'Activate' }}</button>
                    <button class="btn-icon btn-icon-sm hover:!text-danger-text" :disabled="actions.isPending(u.id)" :aria-label="`Delete ${u.name}`" title="Delete user" @click="confirmDelete(u)">
                      <AppIcon icon="trash" class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <TablePager :page="table.page.value" :per-page="perPage" :total="table.total.value" @update:page="table.goTo" />
      </ListBody>
    </section>

    <ConfirmDialog v-model:visible="showDeleteDialog" title="Delete user" confirm-label="Delete user" tone="danger" @confirm="doDelete">
      <p class="font-medium text-ink">Delete <strong>{{ deleteTarget?.name }}</strong>?</p>
      <p class="mt-1">This can't be undone. All their data will be permanently removed.</p>
    </ConfirmDialog>

    <ConfirmDialog v-model:visible="showToggleDialog" :title="(toggleWasActive ? 'Deactivate' : 'Activate') + ' user'"
      :confirm-label="toggleWasActive ? 'Deactivate' : 'Activate'" :tone="toggleWasActive ? 'danger' : 'primary'" @confirm="doToggle">
      <p>{{ toggleWasActive ? 'Deactivate' : 'Activate' }} <strong class="text-ink">{{ toggleTarget?.name }}</strong>?</p>
      <p v-if="toggleWasActive" class="mt-1">They won't be able to sign in until re-activated.</p>
    </ConfirmDialog>
  </div>
</template>

<script setup lang="ts">
import { SelectInput } from '@/components/forms'
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/lib/axios'
import { useAuthStore } from '@/stores/auth'
import { formatDate } from '@/lib/format'
import AppIcon from '@/components/ui/AppIcon.vue'
import DataToolbar from '@/components/admin/DataToolbar.vue'
import ConfirmDialog from '@/components/admin/ConfirmDialog.vue'
import ListBody from '@/components/admin/ListBody.vue'
import TablePager from '@/components/dashboard/TablePager.vue'
import { initials, timeAgo } from '@/components/dashboard/metrics'
import { useRowActions } from '@/composables/useRowActions'
import { useServerTable } from '@/composables/useServerTable'
import { useLiveRefresh } from '@/composables/useLiveRefresh'

const route = useRoute()
const roleLabels: Record<string, string> = { admin: 'Support', store_owner: 'Shop owner', client: 'Customer' }
const roleTabs = [
  { value: '', label: 'All' },
  { value: 'client', label: 'Customers' },
  { value: 'store_owner', label: 'Shop owners' },
  { value: 'admin', label: 'Support' },
]
const search = ref('')
const roleFilter = ref(typeof route.query.role === 'string' ? route.query.role : '')
const statusFilter = ref('')
const deleteTarget = ref<any>(null)
const toggleTarget = ref<any>(null)
const toggleWasActive = ref(false)
const showDeleteDialog = ref(false)
const showToggleDialog = ref(false)
const perPage = 15
const authStore = useAuthStore()

const actions = useRowActions()
const table = useServerTable<any>(async () => {
  const params: any = { per_page: perPage, page: table.page.value }
  if (search.value) params.search = search.value
  if (roleFilter.value) params.role = roleFilter.value
  if (statusFilter.value) params.status = statusFilter.value
  const { data } = await api.get('/admin/users', { params })
  return { rows: data.data.data, total: data.data.total, page: data.data.current_page }
}, { lock: u => actions.isPending(u.id) })
const loading = table.loading
const loadError = table.error

function roleLabel(r: string) { return roleLabels[r] || r?.replace('_', ' ') }
function roleBadge(r: string) { return r === 'admin' ? 'badge-info' : r === 'store_owner' ? 'badge-warning' : 'badge-neutral' }

function resetAndLoad() { table.reset() }
function setRole(v: string) { roleFilter.value = v; resetAndLoad() }
function clearFilters() { search.value = ''; roleFilter.value = ''; statusFilter.value = ''; resetAndLoad() }

function confirmDelete(u: any) { deleteTarget.value = u; showDeleteDialog.value = true }
function confirmToggle(u: any) { toggleTarget.value = u; toggleWasActive.value = !!u.is_active; showToggleDialog.value = true }

function doDelete() {
  const u = deleteTarget.value
  if (!u) return
  showDeleteDialog.value = false
  let restore = () => {}
  actions.run(u.id, {
    apply: () => { restore = table.remove(u.id) },
    request: () => api.delete(`/admin/users/${u.id}`),
    rollback: () => restore(),
    success: `${u.name} deleted`,
    error: 'Could not delete this user.',
    after: () => table.refresh(),
  }, 'delete')
}

function doToggle() {
  const u = toggleTarget.value
  if (!u) return
  showToggleDialog.value = false
  const was = !!u.is_active
  actions.run(u.id, {
    apply: () => { u.is_active = !was },
    request: () => api.patch(`/admin/users/${u.id}/toggle-status`),
    rollback: () => { u.is_active = was },
    success: was ? `${u.name} deactivated` : `${u.name} activated`,
    error: 'Could not update this user.',
  }, 'toggle')
}

// New sign-ups arrive as store / booking notifications; refresh quietly.
useLiveRefresh(['store_', 'new_store', 'store.', 'user'], () => table.refresh())

table.load()
</script>
