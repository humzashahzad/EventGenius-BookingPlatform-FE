<template>
  <div class="content-container">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-warm-900 dark:text-warm-50">Sessions Management</h1>
        <p class="text-warm-500 dark:text-warm-400 mt-1">Monitor and revoke active user sessions across all devices</p>
      </div>
      <button @click="loadSessions" class="btn-outline inline-flex items-center gap-1.5 text-sm">
        <AppIcon icon="refresh" class="w-4 h-4" />
        Refresh
      </button>
    </div>

    <!-- Stats Row -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
      <div class="stat-card">
        <div class="stat-icon bg-primary-50 dark:bg-primary-900/30">
          <AppIcon icon="users" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h4 class="stat-value">{{ stats.total }}</h4>
          <span class="stat-label">Total Sessions</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon bg-emerald-50 dark:bg-emerald-900/30">
          <AppIcon icon="circle-check" class="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h4 class="stat-value">{{ stats.active }}</h4>
          <span class="stat-label">Active</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon bg-coral/10 dark:bg-coral/20">
          <AppIcon icon="x" class="w-5 h-5 text-coral" />
        </div>
        <div>
          <h4 class="stat-value">{{ stats.revoked }}</h4>
          <span class="stat-label">Revoked</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon bg-warm-100 dark:bg-warm-800">
          <AppIcon icon="clock" class="w-5 h-5 text-warm-500 dark:text-warm-400" />
        </div>
        <div>
          <h4 class="stat-value">{{ stats.expired }}</h4>
          <span class="stat-label">Expired</span>
        </div>
      </div>
    </div>


    <!-- Sessions Table -->
    <div class="card">
      <!-- Loading -->
      <div v-if="loading" class="p-5 text-center py-12">
        <div class="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
        <p class="text-warm-500 dark:text-warm-400 text-sm mt-3">Loading sessions...</p>
      </div>

      <!-- Table -->
      <div v-else-if="sessions.length" class="table-wrapper overflow-x-auto">
        <table class="w-full min-w-[700px]">
          <thead>
            <tr class="table-header">
              <th class="text-left px-5 py-3 text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">User</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">Role</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">Status</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">IP Address</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">Device</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">Last Used</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">Expires</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="session in sessions" :key="session.id" class="table-row">
              <td class="px-5 py-3">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                    <span class="text-xs font-bold text-primary-700 dark:text-primary-300">{{ (session.user?.name || 'U').charAt(0).toUpperCase() }}</span>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-warm-800 dark:text-warm-200 mb-0">{{ session.user?.name }}</p>
                    <span class="text-xs text-warm-400 dark:text-warm-500">{{ session.user?.email }}</span>
                  </div>
                </div>
              </td>
              <td class="px-5 py-3"><span :class="getRoleBadge(session.user?.role)">{{ formatRole(session.user?.role) }}</span></td>
              <td class="px-5 py-3"><span :class="getStatusBadge(session)">{{ getStatusLabel(session) }}</span></td>
              <td class="px-5 py-3 text-sm text-warm-500 dark:text-warm-400 font-mono">{{ session.ip_address || '---' }}</td>
              <td class="px-5 py-3">
                <span class="text-sm text-warm-500 dark:text-warm-400 truncate inline-block max-w-[150px]" :title="session.user_agent ?? undefined">{{ parseDevice(session.user_agent) }}</span>
              </td>
              <td class="px-5 py-3 text-sm text-warm-500 dark:text-warm-400 whitespace-nowrap">{{ formatDate(session.last_used_at) }}</td>
              <td class="px-5 py-3 text-sm text-warm-500 dark:text-warm-400 whitespace-nowrap">{{ formatDate(session.expires_at) }}</td>
              <td class="px-5 py-3">
                <button
                  v-if="!session.is_revoked && !isExpired(session)"
                  @click="revokeSession(session)"
                  :disabled="revokingId === session.id"
                  class="btn-danger text-sm px-3 py-1.5 inline-flex items-center gap-1"
                  title="Revoke this session"
                >
                  <AppIcon icon="x" class="w-3.5 h-3.5" />
                  {{ revokingId === session.id ? 'Revoking...' : 'Revoke' }}
                </button>
                <span v-else class="text-sm text-warm-400 dark:text-warm-500">---</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty -->
      <div v-else class="p-5 text-center py-12">
        <div class="w-14 h-14 rounded-2xl bg-warm-100 dark:bg-warm-800 flex items-center justify-center mx-auto mb-4">
          <AppIcon icon="shield" class="w-7 h-7 text-warm-400" />
        </div>
        <p class="font-medium text-warm-700 dark:text-warm-300 mb-1">No sessions found</p>
        <p class="text-warm-500 dark:text-warm-400 text-sm">Try adjusting your search or filters</p>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="pagination" class="flex flex-wrap items-center justify-between mt-6">
      <p class="text-sm text-warm-500 dark:text-warm-400">Showing {{ pagination.from }}--{{ pagination.to }} of {{ pagination.total }} sessions</p>
      <nav class="flex items-center gap-1">
        <button class="w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-all" :class="pagination.current_page === 1 ? 'text-warm-300 dark:text-warm-600 cursor-not-allowed' : 'text-warm-600 dark:text-warm-400 hover:bg-warm-100 dark:hover:bg-warm-800'" :disabled="pagination.current_page === 1" @click="goToPage(pagination.current_page - 1)">
          <AppIcon icon="chevron-left" class="w-4 h-4" />
        </button>
        <button v-for="pg in visiblePages" :key="pg" class="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-medium transition-all" :class="pg === pagination.current_page ? 'bg-primary-600 text-white shadow-soft' : 'text-warm-600 dark:text-warm-400 hover:bg-warm-100 dark:hover:bg-warm-800'" @click="goToPage(pg)">{{ pg }}</button>
        <button class="w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-all" :class="pagination.current_page === pagination.last_page ? 'text-warm-300 dark:text-warm-600 cursor-not-allowed' : 'text-warm-600 dark:text-warm-400 hover:bg-warm-100 dark:hover:bg-warm-800'" :disabled="pagination.current_page === pagination.last_page" @click="goToPage(pagination.current_page + 1)">
          <AppIcon icon="chevron-right" class="w-4 h-4" />
        </button>
      </nav>
    </div>

    <!-- Confirm Revoke Modal -->
    <VuexyModal v-model:visible="showRevokeModal" title="Revoke Session" width="28rem">
      <div class="rounded-2xl bg-coral/5 dark:bg-coral/10 border border-coral/20 p-4 mb-4">
        <div class="flex items-start gap-2.5">
          <AppIcon icon="alert-triangle" class="w-5 h-5 text-coral flex-shrink-0 mt-0.5" />
          <div>
            <p class="text-sm font-medium text-coral mb-1">This will immediately log out the user</p>
            <p class="text-sm text-warm-600 dark:text-warm-400">
              <strong class="text-warm-800 dark:text-warm-200">{{ confirmSession?.user?.name }}</strong> will be signed out and their JWT token will no longer be valid. They will need to log in again.
            </p>
          </div>
        </div>
      </div>
      <div class="space-y-2 text-sm text-warm-500 dark:text-warm-400">
        <div class="flex justify-between">
          <span>User:</span>
          <span class="font-medium text-warm-800 dark:text-warm-200">{{ confirmSession?.user?.name }}</span>
        </div>
        <div class="flex justify-between">
          <span>IP:</span>
          <span class="font-mono text-sm">{{ confirmSession?.ip_address || 'Unknown' }}</span>
        </div>
        <div class="flex justify-between">
          <span>Device:</span>
          <span class="text-sm">{{ parseDevice(confirmSession?.user_agent ?? null) }}</span>
        </div>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="showRevokeModal = false">Cancel</button>
        <button class="btn-danger inline-flex items-center" :disabled="revoking" @click="confirmRevoke">
          <AppIcon v-if="revoking" icon="loader" class="w-4 h-4 animate-spin mr-1.5" />
          {{ revoking ? 'Revoking...' : 'Revoke Session' }}
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

interface SessionUser {
  id: number
  name: string
  email: string
  role: string
  avatar?: string
}

interface Session {
  id: number
  user_id: number
  jti: string
  ip_address: string | null
  user_agent: string | null
  is_revoked: boolean
  expires_at: string
  last_used_at: string | null
  created_at: string
  user?: SessionUser
}

interface Pagination {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number
  to: number
}

const sessions    = ref<Session[]>([])
const pagination  = ref<Pagination | null>(null)
const loading     = ref(false)
const revoking    = ref(false)
const revokingId  = ref<number | null>(null)
const confirmSession = ref<Session | null>(null)
const showRevokeModal = ref(false)

const filters = ref({
  search:   '',
  status:   '',
  role:     '',
  per_page: '20',
  page:     1,
})

const stats = ref({ total: 0, active: 0, revoked: 0, expired: 0 })
const topBarActions = useTopBarActionsStore()

const visiblePages = computed(() => {
  if (!pagination.value) return []
  const { current_page, last_page } = pagination.value
  const pages: number[] = []
  for (let i = Math.max(1, current_page - 2); i <= Math.min(last_page, current_page + 2); i++) {
    pages.push(i)
  }
  return pages
})

async function loadSessions() {
  loading.value = true
  try {
    const params: Record<string, any> = {
      per_page: filters.value.per_page,
      page:     filters.value.page,
    }
    if (filters.value.search)  params.search  = filters.value.search
    if (filters.value.status)  params.status  = filters.value.status
    if (filters.value.role)    params.role    = filters.value.role

    const { data } = await api.get('/admin/sessions', { params })
    const result = data.data

    sessions.value   = result.data
    pagination.value = {
      current_page: result.current_page,
      last_page:    result.last_page,
      per_page:     result.per_page,
      total:        result.total,
      from:         result.from || 0,
      to:           result.to   || 0,
    }

    stats.value.total   = result.total
    stats.value.active  = sessions.value.filter(s => !s.is_revoked && !isExpired(s)).length
    stats.value.revoked = sessions.value.filter(s => s.is_revoked).length
    stats.value.expired = sessions.value.filter(s => !s.is_revoked && isExpired(s)).length
  } catch (e) {
    console.error('Failed to load sessions', e)
  } finally {
    loading.value = false
  }
}

function revokeSession(session: Session) {
  confirmSession.value = session
  showRevokeModal.value = true
}

async function confirmRevoke() {
  if (!confirmSession.value) return
  revoking.value  = true
  revokingId.value = confirmSession.value.id
  try {
    await api.delete(`/admin/sessions/${confirmSession.value.id}`)
    confirmSession.value = null
    showRevokeModal.value = false
    await loadSessions()
  } catch (e) {
    console.error('Failed to revoke session', e)
  } finally {
    revoking.value   = false
    revokingId.value = null
  }
}

function goToPage(page: number) {
  filters.value.page = page
  loadSessions()
}

let debounceTimer: ReturnType<typeof setTimeout>
function debouncedLoad() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    filters.value.page = 1
    loadSessions()
  }, 350)
}

function isExpired(session: Session): boolean {
  return new Date(session.expires_at) < new Date()
}

function getStatusLabel(session: Session): string {
  if (session.is_revoked) return 'Revoked'
  if (isExpired(session)) return 'Expired'
  return 'Active'
}

function getStatusBadge(session: Session): string {
  if (session.is_revoked) return 'badge-coral'
  if (isExpired(session)) return 'badge-warm'
  return 'badge-primary'
}

function getRoleBadge(role?: string): string {
  const map: Record<string, string> = {
    admin: 'badge-coral',
    store_owner: 'badge-accent',
    client: 'badge-primary',
  }
  return map[role || ''] || 'badge-warm'
}

function formatRole(role?: string): string {
  const map: Record<string, string> = {
    admin: 'Support',
    store_owner: 'Shop Owner',
    client: 'Customer',
  }
  return map[role || ''] || role || '---'
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '---'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(dateStr))
}

function parseDevice(ua: string | null): string {
  if (!ua) return 'Unknown'
  if (ua.includes('Mobile') || ua.includes('Android')) return 'Mobile'
  if (ua.includes('iPad')) return 'Tablet'
  if (ua.includes('Chrome')) return 'Chrome'
  if (ua.includes('Firefox')) return 'Firefox'
  if (ua.includes('Safari')) return 'Safari'
  if (ua.includes('Edge')) return 'Edge'
  return ua.substring(0, 40)
}

function resetAndLoad() {
  filters.value.page = 1
  loadSessions()
}

onMounted(() => {
  loadSessions()
  topBarActions.set({
    searchPlaceholder: 'Search by user name or email...',
    searchValue: filters.value.search,
    filterOptions: [
      { key: 'status', label: 'All Status', options: [
        { value: 'active', label: 'Active' },
        { value: 'revoked', label: 'Revoked' },
        { value: 'expired', label: 'Expired' },
      ]},
      { key: 'role', label: 'All Roles', options: [
        { value: 'admin', label: 'Support' },
        { value: 'store_owner', label: 'Shop Owner' },
        { value: 'client', label: 'Customer' },
      ]},
    ],
    initialFilterValues: { status: filters.value.status, role: filters.value.role },
    onSearch(q: string) {
      filters.value.search = q
      resetAndLoad()
    },
    onFilter(key: string, value: string) {
      if (key === 'status') filters.value.status = value
      else if (key === 'role') filters.value.role = value
      resetAndLoad()
    },
  })
})

onUnmounted(() => {
  topBarActions.clear()
})
</script>
