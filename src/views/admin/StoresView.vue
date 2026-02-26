<template>
  <div class="page-container">
    <div class="page-header">
      <div><h1 class="page-title">Stores</h1><p class="page-subtitle">Review, approve and manage store registrations.</p></div>
    </div>

    <div v-if="!loading" class="text-sm text-surface-500 mb-3">{{ meta.total }} stores</div>

    <!-- Table -->
    <div class="table-wrapper">
      <div v-if="loading" class="bg-white">
        <div v-for="i in 8" :key="i" class="flex gap-4 px-4 py-4 border-b border-surface-100">
          <div class="skeleton h-4 w-36 rounded"></div>
          <div class="skeleton h-4 w-40 rounded"></div>
          <div class="skeleton h-4 w-20 rounded"></div>
          <div class="skeleton h-4 w-10 rounded"></div>
          <div class="skeleton h-4 w-16 rounded ml-auto"></div>
        </div>
      </div>
      <div v-else-if="stores.length === 0" class="empty-state bg-white rounded-xl">
        <div class="empty-state-icon"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg></div>
        <p class="empty-state-title">No stores found</p>
        <p class="empty-state-desc">Try adjusting your filters.</p>
      </div>
      <table v-else class="table">
        <thead><tr>
          <th>#</th><th>Store</th><th>Owner</th><th>City</th>
          <th class="text-center">Venues</th><th>Status</th><th class="text-right">Actions</th>
        </tr></thead>
        <tbody>
          <tr v-for="(s, idx) in stores" :key="s.id">
            <td class="text-surface-400 text-xs w-10">{{ (meta.current_page - 1) * perPage + idx + 1 }}</td>
            <td>
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0 shadow-glow-sm">
                  <span class="text-xs font-bold text-white">{{ s.name?.[0]?.toUpperCase() }}</span>
                </div>
                <span class="font-semibold text-surface-800">{{ s.name }}</span>
              </div>
            </td>
            <td>
              <p class="text-sm text-surface-700">{{ s.owner?.name }}</p>
              <p class="text-xs text-surface-400">{{ s.owner?.email }}</p>
            </td>
            <td class="text-surface-500">{{ s.city || '—' }}</td>
            <td class="text-center">
              <span class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-surface-100 text-xs font-semibold text-surface-700">{{ s.venues_count }}</span>
            </td>
            <td><span :class="statusClass(s.status)" class="capitalize">{{ s.status }}</span></td>
            <td class="text-right">
              <div class="flex items-center justify-end gap-1">
                <button v-if="s.status === 'pending'"    @click="openAction(s, 'approve')" class="px-2.5 py-1.5 rounded-lg text-xs font-medium text-success-700 hover:bg-success-50 transition-colors">Approve</button>
                <button v-if="s.status === 'approved'"   @click="openAction(s, 'suspend')" class="px-2.5 py-1.5 rounded-lg text-xs font-medium text-warning-700 hover:bg-warning-50 transition-colors">Suspend</button>
                <button v-if="s.status === 'suspended'"  @click="openAction(s, 'approve')" class="px-2.5 py-1.5 rounded-lg text-xs font-medium text-success-700 hover:bg-success-50 transition-colors">Re-approve</button>
                <button @click="openAction(s, 'delete')" class="px-2.5 py-1.5 rounded-lg text-xs font-medium text-danger-600 hover:bg-danger-50 transition-colors">Delete</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="meta.last_page > 1" class="pagination">
      <p class="pagination-info">Showing {{ (meta.current_page - 1) * perPage + 1 }}–{{ Math.min(meta.current_page * perPage, meta.total) }} of {{ meta.total }} stores</p>
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

    <!-- Action Confirm Modal -->
    <Teleport to="body">
      <div v-if="actionTarget" class="modal-overlay" @click.self="actionTarget = null">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title">{{ actionType === 'delete' ? 'Delete Store' : actionType === 'approve' ? 'Approve Store' : 'Suspend Store' }}</h3>
            <button @click="actionTarget = null" class="btn-icon btn-ghost"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
          </div>
          <div class="modal-body">
            <div class="flex items-start gap-4">
              <div :class="actionType === 'approve' ? 'bg-success-100' : 'bg-danger-100'" class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
                <svg v-if="actionType === 'approve'" class="w-5 h-5 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                <svg v-else class="w-5 h-5 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              </div>
              <p class="text-sm text-surface-700 leading-relaxed">
                <template v-if="actionType === 'delete'">Permanently delete store <strong class="text-surface-900">{{ actionTarget.name }}</strong>? This cannot be undone.</template>
                <template v-else-if="actionType === 'approve'">Approve store <strong class="text-surface-900">{{ actionTarget.name }}</strong>? The owner will be able to add and manage venues.</template>
                <template v-else>Suspend store <strong class="text-surface-900">{{ actionTarget.name }}</strong>? Their venues will be hidden from public listings.</template>
              </p>
            </div>
          </div>
          <div class="modal-footer">
            <button @click="actionTarget = null" class="btn-ghost">Cancel</button>
            <button @click="doAction" :disabled="acting" :class="actionType === 'approve' ? 'btn-primary' : 'btn-danger'">
              <svg v-if="acting" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              {{ actionType === 'delete' ? 'Delete' : actionType === 'approve' ? 'Approve' : 'Suspend' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import api from '@/lib/axios'
import { useTopBarActionsStore } from '@/stores/topBarActions'

const stores       = ref<any[]>([])
const loading      = ref(false)
const acting       = ref(false)
const search       = ref('')
const statusFilter = ref('')
const actionTarget = ref<any>(null)
const actionType   = ref<'approve' | 'suspend' | 'delete'>('approve')
const perPage      = 15
const meta         = ref({ current_page: 1, last_page: 1, total: 0 })
let page = 1
let searchTimeout: ReturnType<typeof setTimeout>
const topBarActions = useTopBarActionsStore()

async function load() {
  loading.value = true
  try {
    const params: any = { per_page: perPage, page }
    if (search.value)       params.search = search.value
    if (statusFilter.value) params.status = statusFilter.value
    const { data } = await api.get('/admin/stores', { params })
    stores.value = data.data.data
    meta.value   = { current_page: data.data.current_page, last_page: data.data.last_page, total: data.data.total }
  } finally { loading.value = false }
}

function resetAndLoad() { page = 1; load() }
function changePage(p: number) { page = p; load() }

function openAction(store: any, type: 'approve' | 'suspend' | 'delete') {
  actionTarget.value = store; actionType.value = type
}

async function doAction() {
  if (!actionTarget.value) return
  acting.value = true
  try {
    if (actionType.value === 'delete') {
      await api.delete(`/admin/stores/${actionTarget.value.id}`)
      stores.value = stores.value.filter(s => s.id !== actionTarget.value.id)
    } else if (actionType.value === 'approve') {
      await api.patch(`/admin/stores/${actionTarget.value.id}/approve`)
      actionTarget.value.status = 'approved'
    } else {
      await api.patch(`/admin/stores/${actionTarget.value.id}/suspend`)
      actionTarget.value.status = 'suspended'
    }
    actionTarget.value = null
  } finally { acting.value = false }
}

function statusClass(s: string) {
  const m: Record<string, string> = { approved: 'badge-success', pending: 'badge-warning', suspended: 'badge-danger', rejected: 'badge-danger' }
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

onMounted(() => {
  load()
  topBarActions.set({
    searchPlaceholder: 'Search store name or city…',
    searchValue: search.value,
    filterOptions: [
      { key: 'status', label: 'Status', options: [
        { value: '', label: 'All Status' },
        { value: 'pending', label: 'Pending' },
        { value: 'approved', label: 'Approved' },
        { value: 'suspended', label: 'Suspended' },
        { value: 'rejected', label: 'Rejected' },
      ]},
    ],
    initialFilterValues: { status: statusFilter.value },
    onSearch(q: string) { search.value = q; clearTimeout(searchTimeout); searchTimeout = setTimeout(() => resetAndLoad(), 400) },
    onFilter(key: string, value: string) { statusFilter.value = value; resetAndLoad() },
  })
})

onUnmounted(() => { clearTimeout(searchTimeout); topBarActions.clear() })
</script>
