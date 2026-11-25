<template>
  <div class="max-w-4xl space-y-5">
    <header class="page-header !mb-0">
      <div>
        <h1 class="page-title">Notifications</h1>
        <p class="page-subtitle">
          <template v-if="notifStore.unreadCount">{{ notifStore.unreadCount }} unread · </template>{{ portalLabel }} alerts about bookings, payments and reviews.
        </p>
      </div>
      <div class="page-header-actions">
        <button type="button" class="btn-secondary" :disabled="loadingFirst || loadingMore" @click="loadNotifications(1)">
          <AppIcon icon="refresh" :class="loadingFirst ? 'w-4 h-4 animate-spin' : 'w-4 h-4'" />
          Refresh
        </button>
        <button type="button" class="btn-primary" :disabled="notifStore.unreadCount === 0 || actionBusy" @click="markAll">
          <AppIcon icon="checks" class="w-4 h-4" />
          Mark all as read
        </button>
      </div>
    </header>

    <div v-if="errorMsg" class="alert-danger" role="alert">
      <AppIcon icon="alert-circle" class="w-5 h-5 shrink-0" />
      <div class="flex-1"><p>{{ errorMsg }}</p></div>
      <button type="button" class="btn-ghost btn-sm" @click="loadNotifications(1)">Retry</button>
    </div>

    <section class="card overflow-hidden" aria-labelledby="feed-title">
      <div class="card-header flex-wrap">
        <h2 id="feed-title" class="card-title">Activity</h2>
        <div class="segmented" role="group" aria-label="Filter notifications">
          <button type="button" :aria-pressed="filter === 'all'" @click="filter = 'all'">All <span class="num text-ink-muted ml-1">{{ total }}</span></button>
          <button type="button" :aria-pressed="filter === 'unread'" @click="filter = 'unread'">Unread <span class="num text-ink-muted ml-1">{{ notifStore.unreadCount }}</span></button>
          <button type="button" :aria-pressed="filter === 'read'" @click="filter = 'read'">Read</button>
        </div>
      </div>

      <!-- Loading -->
      <ul v-if="loadingFirst" class="divide-y divide-line" aria-busy="true" aria-label="Loading notifications">
        <li v-for="i in 5" :key="i" class="flex gap-3 px-5 py-4">
          <div class="skeleton w-10 h-10 shrink-0"></div>
          <div class="flex-1 space-y-2"><div class="skeleton h-4 w-1/3"></div><div class="skeleton h-4 w-3/4"></div></div>
        </li>
      </ul>

      <template v-else>
        <div v-for="group in groups" :key="group.key">
          <h3 class="bg-surface-sunken border-b border-line px-5 py-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
            {{ group.label }}
          </h3>
          <ul class="divide-y divide-line">
            <li
              v-for="n in group.items"
              :key="n.id"
              class="relative flex gap-3 px-4 sm:px-5 py-4 transition-colors"
              :class="n.is_read ? 'hover:bg-surface-hover' : 'bg-brand-soft/50 hover:bg-brand-soft'"
            >
              <span v-if="!n.is_read" class="absolute left-0 top-0 bottom-0 w-[3px] bg-brand" aria-hidden="true"></span>
              <span class="icon-chip shrink-0" :class="toneFor(n.type)"><AppIcon :icon="notifStore.iconForType(n.type)" class="w-5 h-5" /></span>

              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <p class="text-sm text-ink break-words" :class="n.is_read ? 'font-medium' : 'font-semibold'">
                    <span v-if="!n.is_read" class="sr-only">Unread: </span>{{ n.title }}
                  </p>
                  <time class="text-xs text-ink-muted whitespace-nowrap" :datetime="n.created_at" :title="formatDate(n.created_at)">
                    {{ notifStore.timeAgo(n.created_at) }} · {{ formatClock(n.created_at) }}
                  </time>
                </div>
                <p class="mt-0.5 text-sm text-ink-secondary break-words">{{ n.body }}</p>

                <div class="mt-2.5 flex flex-wrap items-center gap-2">
                  <button
                    v-if="notifStore.linkFor(n, authStore.user?.role)"
                    type="button"
                    :class="n.type === 'review_request' && !n.is_read ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'"
                    @click="openNotif(n)"
                  >
                    <AppIcon v-if="n.type === 'review_request'" icon="star" class="w-4 h-4" />
                    {{ actionLabel(n) }}
                  </button>
                  <button v-if="!n.is_read" type="button" class="btn-ghost btn-sm" :disabled="actionBusy" @click="markRead(n)">
                    <AppIcon icon="check" class="w-4 h-4" /> Mark as read
                  </button>
                </div>
              </div>

              <button
                type="button"
                class="btn-icon btn-icon-sm shrink-0 self-start"
                :disabled="actionBusy"
                :aria-label="`Delete notification: ${n.title}`"
                title="Delete"
                @click="removeNotif(n.id)"
              >
                <AppIcon icon="trash" class="w-4 h-4" />
              </button>
            </li>
          </ul>
        </div>

        <!-- Empty -->
        <div v-if="!filteredNotifications.length" class="empty-state">
          <div class="empty-state-icon"><AppIcon :icon="filter === 'unread' ? 'checks' : 'bell-off'" class="w-5 h-5" /></div>
          <p class="empty-state-title">{{ filter === 'unread' ? 'No unread notifications' : 'No notifications yet' }}</p>
          <p class="empty-state-desc">{{ filter === 'unread' ? "You're all caught up." : 'Booking updates, payments and review replies will show up here.' }}</p>
          <div class="empty-state-actions">
            <button v-if="filter !== 'all'" type="button" class="btn-secondary" @click="filter = 'all'">Show all</button>
            <RouterLink :to="homeLink" class="btn-primary">Go to dashboard</RouterLink>
          </div>
        </div>
      </template>

      <div v-if="total > 0" class="card-footer">
        <p class="text-sm text-ink-muted num">Showing {{ notifStore.notifications.length }} of {{ total }}</p>
        <button v-if="canLoadMore" type="button" class="btn-secondary btn-sm" :disabled="loadingMore" @click="loadMore">
          <span v-if="loadingMore" class="spinner-border spinner-border-sm" aria-hidden="true"></span>
          {{ loadingMore ? 'Loading…' : 'Load more' }}
        </button>
        <span v-else class="text-sm text-ink-muted">That's everything</span>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore, type AppNotification } from '@/stores/notifications'
import AppIcon from '@/components/ui/AppIcon.vue'

const route = useRoute()
const notifStore = useNotificationStore()

const loadingFirst = ref(false)
const loadingMore = ref(false)
const actionBusy = ref(false)
const errorMsg = ref('')
const filter = ref<'all' | 'unread' | 'read'>('all')

const page = ref(1)
const lastPage = ref(1)
const total = ref(0)

const homeLink = computed(() => route.path.startsWith('/support') ? '/support/dashboard' : route.path.startsWith('/shop') ? '/shop/dashboard' : '/customer/dashboard')

const portalLabel = computed(() => {
  if (route.path.startsWith('/support')) return 'Support'
  if (route.path.startsWith('/shop')) return 'Shop'
  return 'Customer'
})

const canLoadMore = computed(() => page.value < lastPage.value)

const filteredNotifications = computed(() => {
  if (filter.value === 'unread') return notifStore.notifications.filter(n => !n.is_read)
  if (filter.value === 'read') return notifStore.notifications.filter(n => n.is_read)
  return notifStore.notifications
})

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString()
}

function formatClock(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true })
}

/** Icon chip colour per notification type. */
function toneFor(type: string): string {
  const own: Record<string, string> = {
    payment_completed: 'tone-success',
    review_reply: 'tone-info',
    new_review: 'tone-warning',
    booking_expired: 'tone-neutral',
  }
  if (own[type]) return own[type]
  const color = notifStore.colorForType(type)
  return ({ primary: 'tone-brand', success: 'tone-success', danger: 'tone-danger', warning: 'tone-warning', info: 'tone-info' } as Record<string, string>)[color] ?? 'tone-neutral'
}

function actionLabel(n: AppNotification): string {
  if (n.type === 'review_request') return 'Leave a review'
  if (n.type === 'new_review' || n.type === 'review_reply') return 'See review'
  if (n.type === 'chat_message') return 'Open chat'
  if (n.type === 'store_approved' || n.type === 'store_suspended') return 'Open'
  if ((n.data as any)?.booking_id) return 'View booking'
  return 'Open'
}

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

/** Notifications grouped by calendar day: Today, Yesterday, then dates. */
const groups = computed(() => {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const out: { key: string; label: string; items: AppNotification[] }[] = []
  for (const n of filteredNotifications.value) {
    const d = new Date(n.created_at)
    const key = dayKey(d)
    let g = out.find(x => x.key === key)
    if (!g) {
      const label = key === dayKey(today)
        ? 'Today'
        : key === dayKey(yesterday)
          ? 'Yesterday'
          : d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', ...(d.getFullYear() !== today.getFullYear() ? { year: 'numeric' } : {}) })
      g = { key, label, items: [] }
      out.push(g)
    }
    g.items.push(n)
  }
  return out
})

async function loadNotifications(targetPage = 1) {
  errorMsg.value = ''
  if (targetPage === 1) loadingFirst.value = true
  else loadingMore.value = true

  try {
    const result = await notifStore.fetchAll(targetPage)
    if (result) {
      page.value = Number(result.current_page ?? targetPage)
      lastPage.value = Number(result.last_page ?? page.value)
      total.value = Number(result.total ?? notifStore.notifications.length)
    } else if (targetPage === 1) {
      page.value = 1
      lastPage.value = 1
      total.value = notifStore.notifications.length
    }
  } catch {
    errorMsg.value = 'Failed to load notifications. Please try again.'
  } finally {
    loadingFirst.value = false
    loadingMore.value = false
  }
}

async function loadMore() {
  if (!canLoadMore.value || loadingMore.value) return
  await loadNotifications(page.value + 1)
}

const router = useRouter()
const authStore = useAuthStore()

async function openNotif(n: AppNotification) {
  const to = notifStore.linkFor(n, authStore.user?.role)
  if (!n.is_read) await markRead(n)
  if (to) router.push(to)
}

async function markRead(notification: AppNotification) {
  if (notification.is_read) return
  actionBusy.value = true
  try {
    await notifStore.markRead(notification.id)
  } finally {
    actionBusy.value = false
  }
}

async function markAll() {
  if (!notifStore.unreadCount) return
  actionBusy.value = true
  try {
    await notifStore.markAllRead()
  } finally {
    actionBusy.value = false
  }
}

async function removeNotif(id: number) {
  actionBusy.value = true
  try {
    await notifStore.remove(id)
    total.value = Math.max(0, total.value - 1)
  } finally {
    actionBusy.value = false
  }
}

onMounted(() => {
  void loadNotifications(1)
})
</script>
