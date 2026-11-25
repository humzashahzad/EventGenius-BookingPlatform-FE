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
        <button v-for="r in roleTabs" :key="r.value" role="tab" class="tab" :aria-selected="roleFilter === r.value" @click="roleFilter = r.value; resetAndLoad()">{{ r.label }}</button>
      </nav>
      <DataToolbar v-model:search="search" placeholder="Search name or email" :count="loading ? undefined : meta.total" noun="users" @update:search="resetAndLoad">
        <SelectInput v-model="statusFilter" :options="[{ value: '', label: 'Any status' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]" aria-label="Status" @change="resetAndLoad" />
      </DataToolbar>

      <div v-if="loading" class="p-4 space-y-3" aria-busy="true"><div v-for="i in 8" :key="i" class="skeleton h-10 w-full" /></div>

      <div v-else-if="loadError" class="empty-state">
        <div class="empty-state-icon"><AppIcon icon="alert-circle" class="w-5 h-5" /></div>
        <p class="empty-state-title">Couldn't load users</p>
        <p class="empty-state-desc">{{ loadError }}</p>
        <div class="empty-state-actions"><button class="btn-primary" @click="load">Try again</button></div>
      </div>

      <div v-else-if="users.length === 0" class="empty-state">
        <div class="empty-state-icon"><AppIcon icon="users" class="w-5 h-5" /></div>
        <p class="empty-state-title">No users found</p>
        <p class="empty-state-desc">Try a different search, role or status.</p>
        <div class="empty-state-actions"><button class="btn-secondary" @click="clearFilters">Clear filters</button></div>
      </div>

      <template v-else>
        <!-- Phone -->
        <ul class="md:hidden divide-y divide-line">
          <li v-for="u in users" :key="u.id" class="p-4 flex items-start gap-3">
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
              <button class="btn-secondary btn-sm" @click="confirmToggle(u)">{{ u.is_active ? 'Deactivate' : 'Activate' }}</button>
              <button class="btn-danger-ghost btn-sm" @click="confirmDelete(u)">Delete</button>
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
              <tr v-for="u in users" :key="u.id">
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
                    <button class="btn-ghost btn-sm" @click="confirmToggle(u)">{{ u.is_active ? 'Deactivate' : 'Activate' }}</button>
                    <button class="btn-icon btn-icon-sm hover:!text-danger-text" :aria-label="`Delete ${u.name}`" title="Delete user" @click="confirmDelete(u)">
                      <AppIcon icon="trash" class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <TablePager :page="meta.current_page" :per-page="perPage" :total="meta.total" @update:page="changePage" />
      </template>
    </section>

    <ConfirmDialog v-model:visible="showDeleteDialog" title="Delete user" confirm-label="Delete user" tone="danger" :loading="acting" @confirm="doDelete">
      <p class="font-medium text-ink">Delete <strong>{{ deleteTarget?.name }}</strong>?</p>
      <p class="mt-1">This can't be undone. All their data will be permanently removed.</p>
    </ConfirmDialog>

    <ConfirmDialog v-model:visible="showToggleDialog" :title="(toggleTarget?.is_active ? 'Deactivate' : 'Activate') + ' user'"
      :confirm-label="toggleTarget?.is_active ? 'Deactivate' : 'Activate'" :tone="toggleTarget?.is_active ? 'danger' : 'primary'" :loading="acting" @confirm="doToggle">
      <p>{{ toggleTarget?.is_active ? 'Deactivate' : 'Activate' }} <strong class="text-ink">{{ toggleTarget?.name }}</strong>?</p>
      <p v-if="toggleTarget?.is_active" class="mt-1">They won't be able to sign in until re-activated.</p>
    </ConfirmDialog>
  </div>
</template>

<script setup lang="ts">
import { SelectInput } from '@/components/forms'
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { toast } from 'vue-sonner'
import api from '@/lib/axios'
import { useAuthStore } from '@/stores/auth'
import { formatDate } from '@/lib/format'
import AppIcon from '@/components/ui/AppIcon.vue'
import DataToolbar from '@/components/admin/DataToolbar.vue'
import ConfirmDialog from '@/components/admin/ConfirmDialog.vue'
import TablePager from '@/components/dashboard/TablePager.vue'
import { initials, timeAgo } from '@/components/dashboard/metrics'

const route = useRoute()
const users = ref<any[]>([])
const loading = ref(false)
const loadError = ref('')
const acting = ref(false)
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
const showDeleteDialog = ref(false)
const showToggleDialog = ref(false)
const perPage = 15
const meta = ref({ current_page: 1, last_page: 1, total: 0 })
let page = 1
const authStore = useAuthStore()

function roleLabel(r: string) { return roleLabels[r] || r?.replace('_', ' ') }
function roleBadge(r: string) { return r === 'admin' ? 'badge-info' : r === 'store_owner' ? 'badge-warning' : 'badge-neutral' }

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const params: any = { per_page: perPage, page }
    if (search.value) params.search = search.value
    if (roleFilter.value) params.role = roleFilter.value
    if (statusFilter.value) params.status = statusFilter.value
    const { data } = await api.get('/admin/users', { params })
    users.value = data.data.data
    meta.value = { current_page: data.data.current_page, last_page: data.data.last_page, total: data.data.total }
  } catch (e: any) {
    loadError.value = e.response?.data?.message || 'Please check your connection and try again.'
  } finally { loading.value = false }
}

function resetAndLoad() { page = 1; load() }
function changePage(p: number) { page = p; load() }
function clearFilters() { search.value = ''; roleFilter.value = ''; statusFilter.value = ''; resetAndLoad() }

function confirmDelete(u: any) { deleteTarget.value = u; showDeleteDialog.value = true }
function confirmToggle(u: any) { toggleTarget.value = u; showToggleDialog.value = true }

async function doDelete() {
  if (!deleteTarget.value) return
  acting.value = true
  try {
    await api.delete(`/admin/users/${deleteTarget.value.id}`)
    users.value = users.value.filter(u => u.id !== deleteTarget.value.id)
    meta.value.total = Math.max(0, meta.value.total - 1)
    toast.success('User deleted.')
    showDeleteDialog.value = false
    deleteTarget.value = null
  } catch (e: any) {
    toast.error(e.response?.data?.message || 'Could not delete this user.')
  } finally { acting.value = false }
}

async function doToggle() {
  if (!toggleTarget.value) return
  acting.value = true
  try {
    await api.patch(`/admin/users/${toggleTarget.value.id}/toggle-status`)
    toggleTarget.value.is_active = !toggleTarget.value.is_active
    toast.success(toggleTarget.value.is_active ? 'User activated.' : 'User deactivated.')
    showToggleDialog.value = false
    toggleTarget.value = null
  } catch (e: any) {
    toast.error(e.response?.data?.message || 'Could not update this user.')
  } finally { acting.value = false }
}

onMounted(load)
</script>
