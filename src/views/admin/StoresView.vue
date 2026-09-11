<template>
  <div class="content-container">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-warm-900 dark:text-warm-50">Stores</h1>
        <p class="text-warm-500 dark:text-warm-400 mt-1">Review, approve and manage store registrations.</p>
      </div>
      <span v-if="!loading" class="text-sm text-warm-400 dark:text-warm-500">{{ meta.total }} stores</span>
    </div>

    <!-- Table Card -->
    <div class="card">
      <!-- Loading -->
      <div v-if="loading" class="p-5">
        <div v-for="i in 8" :key="i" class="flex gap-3 py-3 border-b border-warm-100 dark:border-warm-800 last:border-0 animate-pulse">
          <div class="h-4 w-1/6 rounded-lg bg-warm-200 dark:bg-warm-700"></div>
          <div class="h-4 w-1/4 rounded-lg bg-warm-200 dark:bg-warm-700"></div>
          <div class="h-4 w-1/12 rounded-lg bg-warm-200 dark:bg-warm-700"></div>
          <div class="h-4 w-1/12 rounded-lg bg-warm-200 dark:bg-warm-700"></div>
          <div class="h-4 w-1/6 rounded-lg bg-warm-200 dark:bg-warm-700 ml-auto"></div>
        </div>
      </div>

      <!-- Empty -->
      <div v-else-if="stores.length === 0" class="p-5 text-center py-12">
        <div class="w-14 h-14 rounded-2xl bg-warm-100 dark:bg-warm-800 flex items-center justify-center mx-auto mb-4">
          <AppIcon icon="building" class="w-7 h-7 text-warm-400" />
        </div>
        <p class="font-medium text-warm-700 dark:text-warm-300 mb-1">No stores found</p>
        <p class="text-warm-500 dark:text-warm-400 text-sm">Try adjusting your filters.</p>
      </div>

      <!-- Table -->
      <div v-else class="table-wrapper overflow-x-auto">
        <table class="w-full min-w-[700px]">
          <thead>
            <tr class="table-header">
              <th class="text-left px-5 py-3 text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">#</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">Store</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">Owner</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">City</th>
              <th class="text-center px-5 py-3 text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">Venues</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">Status</th>
              <th class="text-right px-5 py-3 text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(s, idx) in stores" :key="s.id" class="table-row">
              <td class="px-5 py-3 text-sm text-warm-400 dark:text-warm-500">{{ (meta.current_page - 1) * perPage + idx + 1 }}</td>
              <td class="px-5 py-3">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-xl bg-accent/10 dark:bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <span class="text-xs font-bold text-accent dark:text-amber-400">{{ s.name?.[0]?.toUpperCase() }}</span>
                  </div>
                  <span class="text-sm font-semibold text-warm-800 dark:text-warm-200">{{ s.name }}</span>
                </div>
              </td>
              <td class="px-5 py-3">
                <p class="text-sm text-warm-800 dark:text-warm-200 mb-0">{{ s.owner?.name }}</p>
                <span class="text-xs text-warm-400 dark:text-warm-500">{{ s.owner?.email }}</span>
              </td>
              <td class="px-5 py-3 text-sm text-warm-500 dark:text-warm-400">{{ s.city || '---' }}</td>
              <td class="px-5 py-3 text-center">
                <span class="badge-warm">{{ s.venues_count }}</span>
              </td>
              <td class="px-5 py-3"><span :class="statusClass(s.status)" class="capitalize">{{ s.status }}</span></td>
              <td class="px-5 py-3 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button v-if="s.status === 'pending'" @click="openAction(s, 'approve')" class="text-sm font-medium px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 transition-all">Approve</button>
                  <button v-if="s.status === 'approved'" @click="openAction(s, 'suspend')" class="text-sm font-medium px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50 transition-all">Suspend</button>
                  <button v-if="s.status === 'suspended'" @click="openAction(s, 'approve')" class="text-sm font-medium px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 transition-all">Re-approve</button>
                  <button @click="openAction(s, 'delete')" class="btn-danger text-sm px-3 py-1.5">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="meta.last_page > 1" class="flex flex-wrap items-center justify-between mt-6">
      <p class="text-sm text-warm-500 dark:text-warm-400">Showing {{ (meta.current_page - 1) * perPage + 1 }}--{{ Math.min(meta.current_page * perPage, meta.total) }} of {{ meta.total }} stores</p>
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

    <!-- Action Confirm Dialog -->
    <VuexyModal v-model:visible="showActionDialog" :title="actionDialogTitle" width="28rem">
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" :class="actionType === 'approve' ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'bg-coral/10 dark:bg-coral/20'">
          <AppIcon v-if="actionType === 'approve'" icon="check" class="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <AppIcon v-else icon="alert-triangle" class="w-5 h-5 text-coral" />
        </div>
        <p class="text-warm-500 dark:text-warm-400 text-sm">
          <template v-if="actionType === 'delete'">Permanently delete store <strong class="text-warm-800 dark:text-warm-200">{{ actionTarget?.name }}</strong>? This cannot be undone.</template>
          <template v-else-if="actionType === 'approve'">Approve store <strong class="text-warm-800 dark:text-warm-200">{{ actionTarget?.name }}</strong>? The owner will be able to add and manage venues.</template>
          <template v-else>Suspend store <strong class="text-warm-800 dark:text-warm-200">{{ actionTarget?.name }}</strong>? Their venues will be hidden from public listings.</template>
        </p>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="showActionDialog = false">Cancel</button>
        <button :class="actionType === 'approve' ? 'btn-primary' : 'btn-danger'" :disabled="acting" @click="doAction">
          <AppIcon v-if="acting" icon="loader" class="w-4 h-4 animate-spin mr-1.5" />
          {{ actionType === 'delete' ? 'Delete' : actionType === 'approve' ? 'Approve' : 'Suspend' }}
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

const stores       = ref<any[]>([])
const loading      = ref(false)
const acting       = ref(false)
const search       = ref('')
const statusFilter = ref('')
const actionTarget = ref<any>(null)
const actionType   = ref<'approve' | 'suspend' | 'delete'>('approve')
const showActionDialog = ref(false)
const perPage      = 15
const meta         = ref({ current_page: 1, last_page: 1, total: 0 })
let page = 1
let searchTimeout: ReturnType<typeof setTimeout>
const topBarActions = useTopBarActionsStore()

const actionDialogTitle = computed(() => {
  if (actionType.value === 'delete') return 'Delete Store'
  if (actionType.value === 'approve') return 'Approve Store'
  return 'Suspend Store'
})

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
  actionTarget.value = store
  actionType.value = type
  showActionDialog.value = true
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
    showActionDialog.value = false
    actionTarget.value = null
  } finally { acting.value = false }
}

function statusClass(s: string) {
  const m: Record<string, string> = { approved: 'badge-primary', pending: 'badge-accent', suspended: 'badge-coral', rejected: 'badge-coral' }
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
    searchPlaceholder: 'Search store name or city...',
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
