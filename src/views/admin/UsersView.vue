<template>
  <div class="content-container">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-warm-900 dark:text-warm-50">Users</h1>
        <p class="text-warm-500 dark:text-warm-400 mt-1">Manage all registered users across the platform.</p>
      </div>
      <span v-if="!loading" class="text-sm text-warm-400 dark:text-warm-500">{{ meta.total ?? '---' }} users</span>
    </div>

    <!-- Table Card -->
    <div class="card">
      <!-- Loading skeleton -->
      <div v-if="loading" class="p-5">
        <div v-for="i in 8" :key="i" class="flex gap-3 py-3 border-b border-warm-100 dark:border-warm-800 last:border-0 animate-pulse">
          <div class="h-4 w-1/6 rounded-lg bg-warm-200 dark:bg-warm-700"></div>
          <div class="h-4 w-1/4 rounded-lg bg-warm-200 dark:bg-warm-700"></div>
          <div class="h-4 w-1/12 rounded-lg bg-warm-200 dark:bg-warm-700"></div>
          <div class="h-4 w-1/12 rounded-lg bg-warm-200 dark:bg-warm-700"></div>
          <div class="h-4 w-1/6 rounded-lg bg-warm-200 dark:bg-warm-700 ml-auto"></div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else-if="users.length === 0" class="p-5 text-center py-12">
        <div class="w-14 h-14 rounded-2xl bg-warm-100 dark:bg-warm-800 flex items-center justify-center mx-auto mb-4">
          <AppIcon icon="users" class="w-7 h-7 text-warm-400" />
        </div>
        <p class="font-medium text-warm-700 dark:text-warm-300 mb-1">No users found</p>
        <p class="text-warm-500 dark:text-warm-400 text-sm">Try adjusting your search or filters.</p>
      </div>

      <!-- Table -->
      <div v-else class="table-wrapper overflow-x-auto">
        <table class="w-full min-w-[700px]">
          <thead>
            <tr class="table-header">
              <th class="text-left px-5 py-3 text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">#</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">User</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">Email</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">Role</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">Status</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">Joined</th>
              <th class="text-right px-5 py-3 text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(u, idx) in users" :key="u.id" class="table-row">
              <td class="px-5 py-3 text-sm text-warm-400 dark:text-warm-500">{{ (meta.current_page - 1) * perPage + idx + 1 }}</td>
              <td class="px-5 py-3">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                    <span class="text-xs font-bold text-primary-700 dark:text-primary-300">{{ initials(u.name) }}</span>
                  </div>
                  <span class="text-sm font-medium text-warm-800 dark:text-warm-200">{{ u.name }}</span>
                </div>
              </td>
              <td class="px-5 py-3 text-sm text-warm-500 dark:text-warm-400">{{ u.email }}</td>
              <td class="px-5 py-3">
                <span class="badge-primary capitalize">{{ roleLabels[u.role as keyof typeof roleLabels] || u.role?.replace('_', ' ') }}</span>
              </td>
              <td class="px-5 py-3">
                <span :class="u.is_active ? 'badge-primary' : 'badge-coral'">{{ u.is_active ? 'Active' : 'Inactive' }}</span>
              </td>
              <td class="px-5 py-3 text-sm text-warm-500 dark:text-warm-400 whitespace-nowrap">{{ formatDate(u.created_at) }}</td>
              <td class="px-5 py-3 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button @click="confirmToggle(u)" class="text-sm font-medium px-3 py-1.5 rounded-xl transition-all" :class="u.is_active ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50'" :title="u.is_active ? 'Deactivate' : 'Activate'">
                    {{ u.is_active ? 'Deactivate' : 'Activate' }}
                  </button>
                  <button @click="confirmDelete(u)" class="btn-danger text-sm px-3 py-1.5" title="Delete user">
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="meta.last_page > 1" class="flex flex-wrap items-center justify-between mt-6">
      <p class="text-sm text-warm-500 dark:text-warm-400">Showing {{ (meta.current_page - 1) * perPage + 1 }}--{{ Math.min(meta.current_page * perPage, meta.total) }} of {{ meta.total }} users</p>
      <nav class="flex items-center gap-1">
        <button class="w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-all" :class="meta.current_page === 1 ? 'text-warm-300 dark:text-warm-600 cursor-not-allowed' : 'text-warm-600 dark:text-warm-400 hover:bg-warm-100 dark:hover:bg-warm-800'" :disabled="meta.current_page === 1" @click="changePage(1)">
          <AppIcon icon="chevron-left" class="w-4 h-4" />
        </button>
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
        <button class="w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-all" :class="meta.current_page === meta.last_page ? 'text-warm-300 dark:text-warm-600 cursor-not-allowed' : 'text-warm-600 dark:text-warm-400 hover:bg-warm-100 dark:hover:bg-warm-800'" :disabled="meta.current_page === meta.last_page" @click="changePage(meta.last_page)">
          <AppIcon icon="chevron-right" class="w-4 h-4" />
        </button>
      </nav>
    </div>

    <!-- Delete Confirm Dialog -->
    <VuexyModal v-model:visible="showDeleteDialog" title="Delete User" width="28rem">
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 rounded-2xl bg-coral/10 dark:bg-coral/20 flex items-center justify-center flex-shrink-0">
          <AppIcon icon="alert-triangle" class="w-5 h-5 text-coral" />
        </div>
        <div>
          <p class="font-medium text-warm-800 dark:text-warm-200 mb-1">Are you sure you want to delete <strong>{{ deleteTarget?.name }}</strong>?</p>
          <p class="text-warm-500 dark:text-warm-400 text-sm">This action cannot be undone. All their data will be permanently removed.</p>
        </div>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="showDeleteDialog = false">Cancel</button>
        <button class="btn-danger" :disabled="acting" @click="doDelete">
          <AppIcon v-if="acting" icon="loader" class="w-4 h-4 animate-spin mr-1.5" />
          Delete User
        </button>
      </template>
    </VuexyModal>

    <!-- Toggle Status Confirm Dialog -->
    <VuexyModal v-model:visible="showToggleDialog" :title="(toggleTarget?.is_active ? 'Deactivate' : 'Activate') + ' User'" width="28rem">
      <p class="text-warm-500 dark:text-warm-400">
        Are you sure you want to <strong class="text-warm-800 dark:text-warm-200">{{ toggleTarget?.is_active ? 'deactivate' : 'activate' }}</strong> user <strong class="text-warm-800 dark:text-warm-200">{{ toggleTarget?.name }}</strong>?
        <span v-if="toggleTarget?.is_active"> They will be unable to log in until re-activated.</span>
      </p>
      <template #footer>
        <button class="btn-secondary" @click="showToggleDialog = false">Cancel</button>
        <button :class="toggleTarget?.is_active ? 'btn-danger' : 'btn-primary'" :disabled="acting" @click="doToggle">
          <AppIcon v-if="acting" icon="loader" class="w-4 h-4 animate-spin mr-1.5" />
          {{ toggleTarget?.is_active ? 'Deactivate' : 'Activate' }}
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

const users      = ref<any[]>([])
const loading    = ref(false)
const acting     = ref(false)
const roleLabels = {
  admin: 'Support',
  store_owner: 'Shop Owner',
  client: 'Customer',
} as const
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
    searchPlaceholder: 'Search name or email...',
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
