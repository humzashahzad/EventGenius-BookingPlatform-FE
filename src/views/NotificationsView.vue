<template>
  <div class="min-h-screen bg-warm-50 dark:bg-warm-900">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="flex flex-wrap justify-between items-center gap-4 mb-8">
        <div>
          <h4 class="text-2xl font-bold text-warm-900 dark:text-warm-50">Notifications</h4>
          <p class="text-warm-500 dark:text-warm-400 mt-1">Review and manage your {{ portalLabel.toLowerCase() }} alerts.</p>
        </div>
        <div class="flex items-center gap-3">
          <button
            class="btn-secondary"
            :disabled="loadingFirst || loadingMore"
            @click="loadNotifications(1)"
          >
            <AppIcon icon="refresh" class="w-4 h-4" />
            Refresh
          </button>
          <button
            class="btn-primary"
            :disabled="notifStore.unreadCount === 0 || actionBusy"
            @click="markAll"
          >
            <AppIcon icon="mail-opened" class="w-4 h-4" />
            Mark All Read
          </button>
        </div>
      </div>

      <!-- Error Alert -->
      <div v-if="errorMsg" class="flex items-center gap-3 p-4 mb-6 rounded-2xl bg-coral/10 text-coral border border-coral/20">
        <AppIcon icon="alert-circle" class="w-[18px] h-[18px]" />
        <span class="text-sm font-medium">{{ errorMsg }}</span>
      </div>

      <!-- Stat Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div class="card p-5">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-warm-500 dark:text-warm-400 text-sm mb-1">Total</p>
              <h4 class="text-2xl font-bold text-warm-900 dark:text-warm-50">{{ total }}</h4>
            </div>
            <span class="badge-primary">
              <AppIcon icon="bell" class="w-[18px] h-[18px]" />
            </span>
          </div>
        </div>
        <div class="card p-5">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-warm-500 dark:text-warm-400 text-sm mb-1">Unread</p>
              <h4 class="text-2xl font-bold text-warm-900 dark:text-warm-50">{{ notifStore.unreadCount }}</h4>
            </div>
            <span class="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-coral/10 text-coral">
              <AppIcon icon="bell-ringing" class="w-[18px] h-[18px]" />
            </span>
          </div>
        </div>
        <div class="card p-5">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-warm-500 dark:text-warm-400 text-sm mb-1">Read</p>
              <h4 class="text-2xl font-bold text-warm-900 dark:text-warm-50">{{ readCount }}</h4>
            </div>
            <span class="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
              <AppIcon icon="check" class="w-[18px] h-[18px]" />
            </span>
          </div>
        </div>
      </div>

      <!-- Notification Feed Card -->
      <div class="card overflow-hidden">
        <!-- Card Header -->
        <div class="flex flex-wrap justify-between items-center gap-4 px-4 sm:px-6 py-4 border-b border-warm-200 dark:border-warm-700">
          <h5 class="text-lg font-bold text-warm-900 dark:text-warm-50">Notification Feed</h5>
          <div class="inline-flex rounded-xl overflow-hidden border border-warm-200 dark:border-warm-700">
            <button
              class="px-4 py-2 text-sm font-semibold transition-all"
              :class="filter === 'all' ? 'bg-primary-500 text-white' : 'bg-warm-50 dark:bg-warm-800 text-warm-600 dark:text-warm-300 hover:bg-warm-100 dark:hover:bg-warm-700'"
              @click="filter = 'all'"
            >All</button>
            <button
              class="px-4 py-2 text-sm font-semibold transition-all border-x border-warm-200 dark:border-warm-700"
              :class="filter === 'unread' ? 'bg-primary-500 text-white' : 'bg-warm-50 dark:bg-warm-800 text-warm-600 dark:text-warm-300 hover:bg-warm-100 dark:hover:bg-warm-700'"
              @click="filter = 'unread'"
            >Unread</button>
            <button
              class="px-4 py-2 text-sm font-semibold transition-all"
              :class="filter === 'read' ? 'bg-primary-500 text-white' : 'bg-warm-50 dark:bg-warm-800 text-warm-600 dark:text-warm-300 hover:bg-warm-100 dark:hover:bg-warm-700'"
              @click="filter = 'read'"
            >Read</button>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loadingFirst" class="flex flex-col items-center justify-center py-16">
          <div class="w-8 h-8 border-3 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
          <p class="text-warm-500 dark:text-warm-400 text-sm mt-3">Loading notifications...</p>
        </div>

        <template v-else>
          <!-- Notification List -->
          <div v-if="filteredNotifications.length" class="divide-y divide-warm-100 dark:divide-warm-700/50">
            <div
              v-for="n in filteredNotifications"
              :key="n.id"
              class="flex flex-wrap sm:flex-nowrap gap-3 sm:gap-4 items-start px-4 sm:px-6 py-4 transition-colors hover:bg-warm-50 dark:hover:bg-warm-800/50"
              :class="{ 'bg-primary-50/50 dark:bg-primary-900/10': !n.is_read }"
            >
              <!-- Teal unread indicator dot -->
              <div class="flex-shrink-0 pt-1">
                <div
                  class="w-2.5 h-2.5 rounded-full transition-colors"
                  :class="!n.is_read ? 'bg-primary-500' : 'bg-warm-200 dark:bg-warm-700'"
                ></div>
              </div>

              <div class="flex-shrink-0">
                <span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-lg">
                  {{ notifStore.iconForType(n.type) }}
                </span>
              </div>

              <div class="flex-grow min-w-0">
                <div class="flex flex-wrap items-center gap-2 mb-1">
                  <h6 class="text-sm text-warm-900 dark:text-warm-50" :class="{ 'font-bold': !n.is_read, 'font-medium': n.is_read }">{{ n.title }}</h6>
                  <span class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold" :class="typeBadgeClass(n.type)">{{ formatType(n.type) }}</span>
                </div>
                <p class="text-sm text-warm-600 dark:text-warm-300 mb-1">{{ n.body }}</p>
                <small class="text-warm-400 dark:text-warm-500 text-xs">{{ formatDate(n.created_at) }} &bull; {{ notifStore.timeAgo(n.created_at) }}</small>
              </div>

              <div class="flex gap-2 flex-shrink-0">
                <button
                  v-if="!n.is_read"
                  class="px-3 py-1.5 text-xs font-semibold rounded-xl border border-primary-300 dark:border-primary-700 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                  :disabled="actionBusy"
                  @click="markRead(n)"
                >
                  Read
                </button>
                <button
                  class="px-3 py-1.5 text-xs font-semibold rounded-xl border border-coral/30 text-coral hover:bg-coral/10 transition-colors"
                  :disabled="actionBusy"
                  @click="removeNotif(n.id)"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="flex flex-col items-center justify-center py-16">
            <AppIcon icon="bell-off" class="w-10 h-10 text-warm-300 dark:text-warm-600" />
            <p class="font-semibold text-warm-700 dark:text-warm-300 mt-4 mb-1">No notifications</p>
            <p class="text-warm-400 dark:text-warm-500 text-sm">You're all caught up.</p>
          </div>
        </template>

        <!-- Card Footer -->
        <div
          v-if="total > 0"
          class="flex justify-between items-center px-4 sm:px-6 py-4 border-t border-warm-200 dark:border-warm-700 bg-warm-50/50 dark:bg-warm-800/50"
        >
          <small class="text-warm-500 dark:text-warm-400 text-sm">Showing {{ notifStore.notifications.length }} of {{ total }}</small>
          <button
            class="btn-secondary text-sm"
            :disabled="!canLoadMore || loadingMore"
            @click="loadMore"
          >
            <span v-if="loadingMore" class="w-4 h-4 border-2 border-warm-300 border-t-primary-500 rounded-full animate-spin mr-2"></span>
            {{ loadingMore ? 'Loading...' : canLoadMore ? 'Load More' : 'No More' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
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

const portalLabel = computed(() => {
  if (route.path.startsWith('/support')) return 'Support'
  if (route.path.startsWith('/shop')) return 'Shop'
  return 'Customer'
})

const readCount = computed(() => Math.max(0, total.value - notifStore.unreadCount))
const canLoadMore = computed(() => page.value < lastPage.value)

const filteredNotifications = computed(() => {
  if (filter.value === 'unread') return notifStore.notifications.filter(n => !n.is_read)
  if (filter.value === 'read') return notifStore.notifications.filter(n => n.is_read)
  return notifStore.notifications
})

function formatType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, s => s.toUpperCase())
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString()
}

function typeBadgeClass(type: string): string {
  const color = notifStore.colorForType(type)
  const map: Record<string, string> = {
    primary: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
    success: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
    danger: 'bg-coral/10 text-coral',
    warning: 'bg-accent/10 text-amber-700 dark:text-accent',
    info: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
  }
  return map[color] ?? 'bg-warm-100 text-warm-600 dark:bg-warm-700 dark:text-warm-300'
}

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
