<template>
  <div class="page-container">
    <!-- Page header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Users</h1>
        <p class="page-subtitle">Manage all registered users across the platform.</p>
      </div>
    </div>

    <!-- Results count -->
    <div class="flex items-center gap-2 text-sm text-surface-500 mb-3">
      <span v-if="!loading">{{ meta.total ?? '—' }} users</span>
    </div>

    <!-- Table -->
    <div class="table-wrapper">
      <!-- Skeleton rows -->
      <div v-if="loading" class="bg-[var(--color-bg-card)]">
        <div v-for="i in 8" :key="i" class="flex gap-4 px-4 py-3.5 border-b border-surface-100">
          <div class="skeleton h-4 w-32 rounded"></div>
          <div class="skeleton h-4 w-48 rounded"></div>
          <div class="skeleton h-4 w-20 rounded"></div>
          <div class="skeleton h-4 w-16 rounded"></div>
          <div class="skeleton h-4 w-24 rounded ml-auto"></div>
        </div>
      </div>

      <div v-else-if="users.length === 0" class="empty-state bg-[var(--color-bg-card)] rounded-xl">
        <div class="empty-state-icon">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
        </div>
        <p class="empty-state-title">No users found</p>
        <p class="empty-state-desc">Try adjusting your search or filters.</p>
      </div>

      <table v-else class="table">
        <thead>
          <tr>
            <th>#</th>
            <th>User</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Joined</th>
            <th class="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(u, idx) in users" :key="u.id">
            <td class="text-surface-400 text-xs w-10">{{ (meta.current_page - 1) * perPage + idx + 1 }}</td>
            <td>
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <span class="text-xs font-semibold text-primary-700">{{ initials(u.name) }}</span>
                </div>
                <span class="font-medium text-surface-800">{{ u.name }}</span>
              </div>
            </td>
            <td class="text-surface-500">{{ u.email }}</td>
            <td><span class="badge-info capitalize">{{ { admin: 'Support', store_owner: 'Shop Owner', client: 'Customer' }[u.role] || u.role?.replace('_', ' ') }}</span></td>
            <td><span :class="u.is_active ? 'badge-success' : 'badge-danger'">{{ u.is_active ? 'Active' : 'Inactive' }}</span></td>
            <td class="text-surface-400 text-xs whitespace-nowrap">{{ formatDate(u.created_at) }}</td>
            <td class="text-right">
              <div class="flex items-center justify-end gap-1">
                <button @click="confirmToggle(u)" :class="u.is_active ? 'text-warning-600 hover:bg-warning-50' : 'text-success-600 hover:bg-success-50'"
                  class="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors" :title="u.is_active ? 'Deactivate' : 'Activate'">
                  {{ u.is_active ? 'Deactivate' : 'Activate' }}
                </button>
                <button @click="confirmDelete(u)" class="px-2.5 py-1.5 rounded-lg text-xs font-medium text-danger-600 hover:bg-danger-50 transition-colors" title="Delete user">
                  Delete
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="meta.last_page > 1" class="pagination">
      <p class="pagination-info">Showing {{ (meta.current_page - 1) * perPage + 1 }}–{{ Math.min(meta.current_page * perPage, meta.total) }} of {{ meta.total }} users</p>
      <div class="pagination-controls">
        <button @click="changePage(1)" :disabled="meta.current_page === 1" class="pagination-btn" title="First">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/></svg>
        </button>
        <button @click="changePage(meta.current_page - 1)" :disabled="meta.current_page === 1" class="pagination-btn" title="Previous">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <template v-for="p in pageRange" :key="p">
          <span v-if="p === '...'" class="w-8 h-8 flex items-center justify-center text-surface-400 text-sm">…</span>
          <button v-else @click="changePage(Number(p))" :class="['pagination-btn', meta.current_page === p ? 'active' : '']">{{ p }}</button>
        </template>
        <button @click="changePage(meta.current_page + 1)" :disabled="meta.current_page === meta.last_page" class="pagination-btn" title="Next">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        </button>
        <button @click="changePage(meta.last_page)" :disabled="meta.current_page === meta.last_page" class="pagination-btn" title="Last">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"/></svg>
        </button>
      </div>
    </div>

    <!-- Delete Confirm Dialog -->
    <Dialog v-model:visible="showDeleteDialog" modal header="Delete User" :style="{ width: '28rem' }" :pt="dialogPt">
      <div class="flex items-start gap-4">
        <div class="w-10 h-10 rounded-full bg-danger-100 flex items-center justify-center flex-shrink-0">
          <svg class="w-5 h-5 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
        </div>
        <div>
          <p class="text-sm font-medium text-surface-800">Are you sure you want to delete <strong>{{ deleteTarget?.name }}</strong>?</p>
          <p class="text-sm text-surface-500 mt-1">This action cannot be undone. All their data will be permanently removed.</p>
        </div>
      </div>
      <template #footer>
        <Button label="Cancel" severity="secondary" text @click="showDeleteDialog = false" />
        <Button label="Delete User" severity="danger" :loading="acting" @click="doDelete" />
      </template>
    </Dialog>

    <!-- Toggle Status Confirm Dialog -->
    <Dialog v-model:visible="showToggleDialog" modal :header="(toggleTarget?.is_active ? 'Deactivate' : 'Activate') + ' User'" :style="{ width: '28rem' }" :pt="dialogPt">
      <p class="text-sm text-surface-600">
        Are you sure you want to <strong>{{ toggleTarget?.is_active ? 'deactivate' : 'activate' }}</strong> user <strong>{{ toggleTarget?.name }}</strong>?
        <span v-if="toggleTarget?.is_active"> They will be unable to log in until re-activated.</span>
      </p>
      <template #footer>
        <Button label="Cancel" severity="secondary" text @click="showToggleDialog = false" />
        <Button
          :label="toggleTarget?.is_active ? 'Deactivate' : 'Activate'"
          :severity="toggleTarget?.is_active ? 'danger' : 'success'"
          :loading="acting"
          @click="doToggle"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import api from '@/lib/axios'
import { useTopBarActionsStore } from '@/stores/topBarActions'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'

const users      = ref<any[]>([])
const loading    = ref(false)
const acting     = ref(false)
const search     = ref('')
const roleFilter = ref('')
const statusFilter = ref('')
const deleteTarget = ref<any>(null)
const toggleTarget = ref<any>(null)
const showDeleteDialog = ref(false)
const showToggleDialog = ref(false)
const perPage    = 15
const meta       = ref({ current_page: 1, last_page: 1, total: 0 })
let page = 1
let searchTimeout: ReturnType<typeof setTimeout>
const topBarActions = useTopBarActionsStore()

// PrimeVue Dialog pass-through for dark theme
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
    if (roleFilter.value)   params.role   = roleFilter.value
    if (statusFilter.value) params.status = statusFilter.value
    const { data } = await api.get('/admin/users', { params })
    users.value = data.data.data
    meta.value  = { current_page: data.data.current_page, last_page: data.data.last_page, total: data.data.total }
  } finally { loading.value = false }
}

function resetAndLoad() { page = 1; load() }

function changePage(p: number) { page = p; load() }

function confirmDelete(u: any) {
  deleteTarget.value = u
  showDeleteDialog.value = true
}

function confirmToggle(u: any) {
  toggleTarget.value = u
  showToggleDialog.value = true
}

async function doDelete() {
  if (!deleteTarget.value) return
  acting.value = true
  try {
    await api.delete(`/admin/users/${deleteTarget.value.id}`)
    users.value = users.value.filter(u => u.id !== deleteTarget.value.id)
    showDeleteDialog.value = false
    deleteTarget.value = null
  } finally { acting.value = false }
}

async function doToggle() {
  if (!toggleTarget.value) return
  acting.value = true
  try {
    await api.patch(`/admin/users/${toggleTarget.value.id}/toggle-status`)
    toggleTarget.value.is_active = !toggleTarget.value.is_active
    showToggleDialog.value = false
    toggleTarget.value = null
  } finally { acting.value = false }
}

function initials(name: string) {
  return name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '?'
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })
}

const pageRange = computed(() => {
  const total = meta.value.last_page
  const cur   = meta.value.current_page
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
    searchPlaceholder: 'Search name or email…',
    searchValue: search.value,
    filterOptions: [
      { key: 'role', label: 'All Roles', options: [
        { value: 'client', label: 'Customer' },
        { value: 'store_owner', label: 'Shop Owner' },
        { value: 'admin', label: 'Support' },
      ]},
      { key: 'status', label: 'All Status', options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
      ]},
    ],
    initialFilterValues: { role: roleFilter.value, status: statusFilter.value },
    onSearch(q: string) {
      search.value = q
      resetAndLoad()
    },
    onFilter(key: string, value: string) {
      if (key === 'role') roleFilter.value = value
      else if (key === 'status') statusFilter.value = value
      resetAndLoad()
    },
  })
})

onUnmounted(() => {
  topBarActions.clear()
})
</script>
