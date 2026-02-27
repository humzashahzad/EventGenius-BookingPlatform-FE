<template>
  <div class="page-container">
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Sessions Management</h1>
        <p class="page-subtitle">Monitor and revoke active user sessions across all devices</p>
      </div>
      <button @click="loadSessions" class="btn btn-white btn-sm gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Refresh
      </button>
    </div>

    <!-- Stats Row -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div class="stat-card">
        <div class="stat-icon bg-primary-100">
          <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
          </svg>
        </div>
        <div>
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-label">Total Sessions</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon bg-success-100">
          <svg class="w-5 h-5 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <div>
          <div class="stat-value">{{ stats.active }}</div>
          <div class="stat-label">Active</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon bg-danger-100">
          <svg class="w-5 h-5 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
          </svg>
        </div>
        <div>
          <div class="stat-value">{{ stats.revoked }}</div>
          <div class="stat-label">Revoked</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon bg-surface-100">
          <svg class="w-5 h-5 text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <div>
          <div class="stat-value">{{ stats.expired }}</div>
          <div class="stat-label">Expired</div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="card card-body">
      <div class="flex flex-col sm:flex-row gap-3">
        <div class="search-bar flex-1">
          <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            v-model="filters.search"
            type="text"
            placeholder="Search by user name or email..."
            @input="debouncedLoad"
          />
        </div>
        <select v-model="filters.status" class="form-select w-40" @change="loadSessions">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="revoked">Revoked</option>
          <option value="expired">Expired</option>
        </select>
        <select v-model="filters.role" class="form-select w-40" @change="loadSessions">
          <option value="">All Roles</option>
          <option value="admin">Support</option>
          <option value="store_owner">Shop Owner</option>
          <option value="client">Customer</option>
        </select>
        <select v-model="filters.per_page" class="form-select w-24" @change="loadSessions">
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
        </select>
      </div>
    </div>

    <!-- Sessions Table -->
    <div class="table-wrapper">
      <!-- Loading -->
      <div v-if="loading" class="p-8 text-center">
        <div class="inline-flex items-center gap-2 text-surface-500 text-sm">
          <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          Loading sessions...
        </div>
      </div>

      <!-- Table -->
      <table v-else-if="sessions.length" class="table">
        <thead>
          <tr>
            <th>User</th>
            <th>Role</th>
            <th>Status</th>
            <th>IP Address</th>
            <th>Device</th>
            <th>Last Used</th>
            <th>Expires</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="session in sessions" :key="session.id">
            <!-- User -->
            <td>
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center
                            text-primary-700 font-semibold text-xs flex-shrink-0">
                  {{ (session.user?.name || 'U').charAt(0).toUpperCase() }}
                </div>
                <div>
                  <div class="font-medium text-surface-900 text-xs">{{ session.user?.name }}</div>
                  <div class="text-2xs text-surface-400">{{ session.user?.email }}</div>
                </div>
              </div>
            </td>
            <!-- Role -->
            <td>
              <span :class="getRoleBadge(session.user?.role)">
                {{ formatRole(session.user?.role) }}
              </span>
            </td>
            <!-- Status -->
            <td>
              <span :class="getStatusBadge(session)">
                {{ getStatusLabel(session) }}
              </span>
            </td>
            <!-- IP -->
            <td class="font-mono text-xs text-surface-500">{{ session.ip_address || '—' }}</td>
            <!-- Device (user agent) -->
            <td>
              <span class="text-xs text-surface-500 line-clamp-1 max-w-xs" :title="session.user_agent ?? undefined">
                {{ parseDevice(session.user_agent) }}
              </span>
            </td>
            <!-- Last Used -->
            <td class="text-xs text-surface-500 whitespace-nowrap">
              {{ formatDate(session.last_used_at) }}
            </td>
            <!-- Expires -->
            <td class="text-xs text-surface-500 whitespace-nowrap">
              {{ formatDate(session.expires_at) }}
            </td>
            <!-- Actions -->
            <td>
              <button
                v-if="!session.is_revoked && !isExpired(session)"
                @click="revokeSession(session)"
                :disabled="revokingId === session.id"
                class="btn-danger btn-sm gap-1"
                title="Revoke this session"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636"/>
                </svg>
                {{ revokingId === session.id ? 'Revoking...' : 'Revoke' }}
              </button>
              <span v-else class="text-xs text-surface-400">—</span>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Empty state -->
      <div v-else class="empty-state">
        <div class="empty-state-icon">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
          </svg>
        </div>
        <p class="empty-state-title">No sessions found</p>
        <p class="empty-state-desc">Try adjusting your search or filters</p>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="pagination" class="pagination">
      <div class="pagination-info">
        Showing {{ pagination.from }}–{{ pagination.to }} of {{ pagination.total }} sessions
      </div>
      <div class="pagination-controls">
        <button
          class="pagination-btn"
          :disabled="pagination.current_page === 1"
          @click="goToPage(pagination.current_page - 1)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <button
          v-for="page in visiblePages"
          :key="page"
          class="pagination-btn"
          :class="{ active: page === pagination.current_page }"
          @click="goToPage(page)"
        >{{ page }}</button>
        <button
          class="pagination-btn"
          :disabled="pagination.current_page === pagination.last_page"
          @click="goToPage(pagination.current_page + 1)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Confirm Revoke Modal -->
    <div v-if="confirmSession" class="modal-overlay" @click.self="confirmSession = null">
      <div class="modal max-w-md">
        <div class="modal-header">
          <h3 class="modal-title">Revoke Session</h3>
          <button @click="confirmSession = null" class="btn-ghost btn-icon">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="modal-body space-y-4">
          <div class="flex items-start gap-3 p-4 bg-danger-50 rounded-xl border border-danger-100">
            <svg class="w-5 h-5 text-danger-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <div>
              <p class="text-sm font-medium text-danger-800">This will immediately log out the user</p>
              <p class="text-xs text-danger-600 mt-1">
                <strong>{{ confirmSession.user?.name }}</strong> will be signed out and their JWT token will no longer be valid.
                They will need to log in again.
              </p>
            </div>
          </div>
          <div class="text-sm text-surface-600 space-y-1">
            <div class="flex justify-between">
              <span class="text-surface-400">User:</span>
              <span class="font-medium">{{ confirmSession.user?.name }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-surface-400">IP:</span>
              <span class="font-mono text-xs">{{ confirmSession.ip_address || 'Unknown' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-surface-400">Device:</span>
              <span class="text-xs">{{ parseDevice(confirmSession.user_agent) }}</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="confirmSession = null" class="btn-ghost">Cancel</button>
          <button @click="confirmRevoke" :disabled="revoking" class="btn-danger gap-2">
            <svg v-if="revoking" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            {{ revoking ? 'Revoking...' : 'Revoke Session' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api from '@/lib/axios'

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

const filters = ref({
  search:   '',
  status:   '',
  role:     '',
  per_page: '20',
  page:     1,
})

const stats = ref({ total: 0, active: 0, revoked: 0, expired: 0 })

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

    // Compute stats
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
}

async function confirmRevoke() {
  if (!confirmSession.value) return
  revoking.value  = true
  revokingId.value = confirmSession.value.id
  try {
    await api.delete(`/admin/sessions/${confirmSession.value.id}`)
    confirmSession.value = null
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

// Debounce search input
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
  if (session.is_revoked) return 'session-revoked'
  if (isExpired(session)) return 'session-expired'
  return 'session-active'
}

function getRoleBadge(role?: string): string {
  const map: Record<string, string> = {
    admin: 'badge badge-danger',
    store_owner: 'badge badge-warning',
    client: 'badge badge-info',
  }
  return map[role || ''] || 'badge badge-gray'
}

function formatRole(role?: string): string {
  const map: Record<string, string> = {
    admin: 'Support',
    store_owner: 'Shop Owner',
    client: 'Customer',
  }
  return map[role || ''] || role || '—'
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
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

onMounted(loadSessions)
</script>
