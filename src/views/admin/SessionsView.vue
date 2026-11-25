<template>
  <div class="space-y-5">
    <header class="page-header !mb-0">
      <div>
        <h1 class="page-title">Sessions</h1>
        <p class="page-subtitle">Signed-in devices across the platform. Revoke a session to sign that device out.</p>
      </div>
      <div class="page-header-actions">
        <button @click="refreshAll" class="btn-secondary" :disabled="loading"><AppIcon icon="refresh" :class="loading ? 'w-4 h-4 animate-spin' : 'w-4 h-4'" />Refresh</button>
      </div>
    </header>

    <section aria-label="Session counts" class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <KpiTile label="All sessions" icon="shield-check" tone="neutral" :loading="countsLoading" :value="counts.total" helper="tokens issued" />
      <KpiTile label="Active" icon="circle-check" tone="success" :loading="countsLoading" :value="counts.active" helper="currently valid" />
      <KpiTile label="Revoked" icon="ban" tone="danger" :loading="countsLoading" :value="counts.revoked" helper="signed out by support or user" />
      <KpiTile label="Expired" icon="clock" tone="neutral" :loading="countsLoading" :value="counts.expired" helper="timed out" />
    </section>

    <section class="card overflow-hidden">
      <nav class="tabs px-2 sm:px-4" role="tablist" aria-label="Session status">
        <button v-for="t in statusTabs" :key="t.value" role="tab" class="tab" :aria-selected="filters.status === t.value" @click="filters.status = t.value; resetAndLoad()">{{ t.label }}</button>
      </nav>
      <DataToolbar v-model:search="filters.search" placeholder="Search by user name or email" :count="loading ? undefined : pagination?.total" noun="sessions" @update:search="resetAndLoad">
        <SelectInput v-model="filters.role" :options="[{ value: '', label: 'All roles' }, { value: 'admin', label: 'Support' }, { value: 'store_owner', label: 'Shop owner' }, { value: 'client', label: 'Customer' }]" aria-label="Role" @change="resetAndLoad" />
      </DataToolbar>

      <div v-if="loading" class="p-4 space-y-3" aria-busy="true"><div v-for="i in 8" :key="i" class="skeleton h-10 w-full" /></div>

      <div v-else-if="loadError" class="empty-state">
        <div class="empty-state-icon"><AppIcon icon="alert-circle" class="w-5 h-5" /></div>
        <p class="empty-state-title">Couldn't load sessions</p>
        <p class="empty-state-desc">{{ loadError }}</p>
        <div class="empty-state-actions"><button class="btn-primary" @click="loadSessions">Try again</button></div>
      </div>

      <div v-else-if="!sessions.length" class="empty-state">
        <div class="empty-state-icon"><AppIcon icon="shield" class="w-5 h-5" /></div>
        <p class="empty-state-title">No sessions found</p>
        <p class="empty-state-desc">Try a different search, status or role.</p>
        <div class="empty-state-actions"><button class="btn-secondary" @click="filters.search = ''; filters.status = ''; filters.role = ''; resetAndLoad()">Clear filters</button></div>
      </div>

      <template v-else>
        <!-- Phone -->
        <ul class="md:hidden divide-y divide-line">
          <li v-for="session in sessions" :key="session.id" class="p-4">
            <div class="flex items-start gap-3">
              <span class="avatar w-9 h-9 text-xs shrink-0">{{ initials(session.user?.name) }}</span>
              <div class="min-w-0 flex-1">
                <div class="flex items-start justify-between gap-2">
                  <p class="text-sm font-medium text-ink truncate">{{ session.user?.name }}</p>
                  <span :class="getStatusBadge(session)" class="shrink-0">{{ getStatusLabel(session) }}</span>
                </div>
                <p class="text-xs text-ink-muted truncate">{{ session.user?.email }}</p>
                <p class="text-xs text-ink-muted mt-1"><span class="ref">{{ session.ip_address || 'Unknown IP' }}</span> · {{ parseDevice(session.user_agent) }} · used {{ formatDate(session.last_used_at) }}</p>
              </div>
            </div>
            <button v-if="!session.is_revoked && !isExpired(session)" class="btn-danger-ghost btn-sm mt-2" :disabled="revokingId === session.id" @click="revokeSession(session)">
              <AppIcon icon="logout" class="w-4 h-4" />Revoke
            </button>
          </li>
        </ul>

        <!-- Desktop -->
        <div class="hidden md:block table-wrapper max-h-[calc(100vh-320px)] min-h-[320px] scrollbar-thin">
          <table class="data-table">
            <thead>
              <tr><th>User</th><th>Role</th><th>Status</th><th>IP address</th><th>Device</th><th>Last used</th><th>Expires</th><th class="cell-actions"><span class="sr-only">Actions</span></th></tr>
            </thead>
            <tbody>
              <tr v-for="session in sessions" :key="session.id">
                <td>
                  <div class="flex items-center gap-2.5 min-w-0">
                    <span class="avatar w-8 h-8 text-[11px] shrink-0">{{ initials(session.user?.name) }}</span>
                    <div class="min-w-0">
                      <p class="cell-primary truncate max-w-[200px]">{{ session.user?.name }}</p>
                      <p class="text-xs text-ink-muted truncate max-w-[220px]">{{ session.user?.email }}</p>
                    </div>
                  </div>
                </td>
                <td><span :class="getRoleBadge(session.user?.role)">{{ formatRole(session.user?.role) }}</span></td>
                <td><span :class="getStatusBadge(session)">{{ getStatusLabel(session) }}</span></td>
                <td class="ref whitespace-nowrap">{{ session.ip_address || '—' }}</td>
                <td><span class="truncate inline-block max-w-[150px] align-middle" :title="session.user_agent ?? undefined">{{ parseDevice(session.user_agent) }}</span></td>
                <td class="whitespace-nowrap">{{ formatDate(session.last_used_at) }}</td>
                <td class="whitespace-nowrap">{{ formatDate(session.expires_at) }}</td>
                <td class="cell-actions">
                  <button v-if="!session.is_revoked && !isExpired(session)" class="btn-danger-ghost btn-sm" :disabled="revokingId === session.id" title="Revoke this session" @click="revokeSession(session)">
                    <AppIcon icon="logout" class="w-4 h-4" />{{ revokingId === session.id ? 'Revoking…' : 'Revoke' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <TablePager v-if="pagination" :page="pagination.current_page" :per-page="pagination.per_page" :total="pagination.total" @update:page="goToPage" />
      </template>
    </section>

    <ConfirmDialog v-model:visible="showRevokeModal" title="Revoke session" confirm-label="Revoke session" tone="danger" icon="logout" :loading="revoking" @confirm="confirmRevoke">
      <p class="font-medium text-ink">This signs the user out immediately.</p>
      <p class="mt-1"><strong class="text-ink">{{ confirmSession?.user?.name }}</strong>'s token stops working and they'll need to sign in again.</p>
      <dl class="mt-3 panel-sunken px-3 py-1">
        <div class="dl-row"><dt>IP</dt><dd class="ref">{{ confirmSession?.ip_address || 'Unknown' }}</dd></div>
        <div class="dl-row"><dt>Device</dt><dd>{{ parseDevice(confirmSession?.user_agent ?? null) }}</dd></div>
      </dl>
    </ConfirmDialog>
  </div>
</template>

<script setup lang="ts">
import { SelectInput } from '@/components/forms'
import { ref, onMounted } from 'vue'
import { toast } from 'vue-sonner'
import api from '@/lib/axios'
import AppIcon from '@/components/ui/AppIcon.vue'
import DataToolbar from '@/components/admin/DataToolbar.vue'
import ConfirmDialog from '@/components/admin/ConfirmDialog.vue'
import KpiTile from '@/components/dashboard/KpiTile.vue'
import TablePager from '@/components/dashboard/TablePager.vue'
import { initials } from '@/components/dashboard/metrics'

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

const loadError = ref('')
const countsLoading = ref(true)
const counts = ref({ total: 0, active: 0, revoked: 0, expired: 0 })
const statusTabs = [
  { value: '', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'revoked', label: 'Revoked' },
  { value: 'expired', label: 'Expired' },
]

// Platform-wide counts (one tiny request per status) instead of counting the current page.
async function loadCounts() {
  countsLoading.value = true
  const total = (status?: string) => api.get('/admin/sessions', { params: { per_page: 1, ...(status ? { status } : {}) } })
    .then(({ data }) => Number(data.data?.total) || 0).catch(() => 0)
  const [all, active, revoked, expired] = await Promise.all([total(), total('active'), total('revoked'), total('expired')])
  counts.value = { total: all, active, revoked, expired }
  countsLoading.value = false
}

function refreshAll() {
  loadSessions()
  loadCounts()
}

async function loadSessions() {
  loading.value = true
  loadError.value = ''
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

  } catch (e: any) {
    loadError.value = e?.response?.data?.message || 'Please check your connection and try again.'
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
    toast.success('Session revoked.')
    await loadSessions()
    loadCounts()
  } catch (e: any) {
    toast.error(e?.response?.data?.message || 'Could not revoke this session.')
  } finally {
    revoking.value   = false
    revokingId.value = null
  }
}

function goToPage(page: number) {
  filters.value.page = page
  loadSessions()
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
  if (session.is_revoked) return 'badge-rejected'
  if (isExpired(session)) return 'badge-cancelled'
  return 'badge-confirmed'
}

function getRoleBadge(role?: string): string {
  const map: Record<string, string> = {
    admin: 'badge-info',
    store_owner: 'badge-warning',
    client: 'badge-neutral',
  }
  return map[role || ''] || 'badge-neutral'
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
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('en-GB', {
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

onMounted(refreshAll)
</script>
