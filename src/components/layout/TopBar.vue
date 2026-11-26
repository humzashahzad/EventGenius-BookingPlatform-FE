<template>
  <header class="sticky top-0 z-20 flex items-center h-16 px-3 sm:px-4 lg:px-6 bg-surface border-b border-line shrink-0">
    <button
      type="button"
      class="btn-icon -ml-1"
      :aria-label="props.sidebarCollapsed ? 'Open menu' : 'Collapse menu'"
      :aria-expanded="!props.sidebarCollapsed"
      title="Toggle menu (Ctrl+B)"
      @click="emit('toggle-sidebar')"
    >
      <AppIcon icon="menu-2" class="w-5 h-5" />
    </button>

    <div class="hidden sm:block h-6 w-px bg-line mx-3" aria-hidden="true" />
    <p class="ml-2 sm:ml-0 min-w-0 flex items-center gap-1.5 text-sm truncate">
      <span class="hidden md:inline text-ink-muted">{{ portalName }}</span>
      <AppIcon icon="chevron-right" class="hidden md:inline w-3.5 h-3.5 text-ink-muted shrink-0" />
      <span class="font-semibold text-ink truncate max-w-[150px] sm:max-w-[260px]">{{ pageTitle }}</span>
    </p>

    <div class="flex-1 min-w-0"></div>

    <div class="flex items-center gap-2 ml-auto">
      <!-- Page Actions (search, filters) — right-aligned before theme -->
      <div class="hidden lg:flex items-center">
        <TopBarActions />
      </div>

      <!-- Theme Switcher — inline row -->
      <div class="hidden sm:inline-flex segmented" role="group" aria-label="Theme">
        <button
          v-for="m in themeModes"
          :key="m.mode"
          type="button"
          class="!px-2"
          :aria-pressed="themeStore.themeMode === m.mode"
          :aria-label="m.label"
          :title="m.label"
          @click="themeStore.setThemeMode(m.mode)"
        >
          <AppIcon :icon="m.icon" class="w-4 h-4" />
        </button>
      </div>

      <!-- Notifications -->
      <div class="relative" ref="notifRef">
        <button
          type="button"
          class="btn-icon relative"
          :aria-label="notifStore.unreadCount > 0 ? `Notifications, ${notifStore.unreadCount} unread` : 'Notifications'"
          :aria-expanded="showNotif"
          @click="toggleNotif"
        >
          <AppIcon icon="bell" class="w-5 h-5" />
          <span
            v-if="notifStore.unreadCount > 0"
            class="count-badge absolute top-0 right-0 !px-1 ring-2 ring-surface"
          >
            {{ notifStore.unreadCount > 99 ? '99+' : notifStore.unreadCount }}
          </span>
        </button>
        <div
          v-if="showNotif"
          class="menu absolute right-0 top-full mt-2 w-80 sm:w-[22rem] max-w-[calc(100vw-1rem)] z-50"
        >
          <div class="flex items-center justify-between px-4 py-3 border-b border-line">
            <span class="font-semibold text-ink">Notifications</span>
            <div class="flex items-center gap-2">
              <span v-if="notifStore.unreadCount > 0" class="badge-success">
                {{ notifStore.unreadCount }} new
              </span>
              <button
                v-if="notifStore.unreadCount > 0"
                type="button"
                class="btn-icon btn-icon-sm"
                aria-label="Mark all as read"
                title="Mark all as read"
                :disabled="actions.isPending('all')"
                @click="markAllRead"
              >
                <AppIcon :icon="actions.isPending('all') ? 'loader' : 'mail-opened'" :class="actions.isPending('all') ? 'w-4 h-4 animate-spin' : 'w-4 h-4'" />
              </button>
            </div>
          </div>
          <div class="max-h-80 overflow-y-auto scrollbar-thin">
            <div v-if="!notifStore.notifications.length" class="empty-state !py-8">
              <div class="empty-state-icon"><AppIcon icon="bell-off" class="w-5 h-5" /></div>
              <p class="empty-state-title !text-sm">No notifications yet</p>
              <p class="empty-state-desc !text-xs">Booking updates and messages will show up here.</p>
            </div>
            <div
              v-for="n in notifStore.notifications.slice(0, 20)"
              :key="n.id"
              role="button"
              tabindex="0"
              class="relative w-full flex items-start gap-3 px-4 py-3 text-left cursor-pointer hover:bg-surface-hover border-b border-line last:border-b-0"
              :class="{ 'bg-brand-soft/60': !n.is_read }"
              @click="handleNotifClick(n)"
              @keydown.enter="handleNotifClick(n)"
            >
              <span v-if="!n.is_read" class="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-brand" aria-hidden="true" />
              <span class="icon-chip icon-chip-sm tone-brand">
                <AppIcon :icon="notifStore.iconForType(n.type)" class="w-4 h-4" />
              </span>
              <span class="flex-1 min-w-0">
                <p class="text-sm font-medium text-ink truncate" :class="{ 'font-semibold': !n.is_read }">{{ n.title }}</p>
                <p class="text-xs text-ink-secondary line-clamp-2">{{ n.body }}</p>
                <p class="text-xs text-ink-muted mt-0.5">{{ notifStore.timeAgo(n.created_at) }}</p>
              </span>
              <button type="button" class="btn-icon btn-icon-sm !w-7 !h-7" aria-label="Remove notification" :disabled="actions.isPending(`del-${n.id}`)" @click.stop="removeNotif(n.id)">
                <AppIcon icon="x" class="w-4 h-4" />
              </button>
            </div>
          </div>
          <div class="p-3 border-t border-line bg-surface-sunken">
            <RouterLink
              :to="notifPageLink"
              class="btn-secondary btn-sm w-full"
              @click="showNotif = false"
            >
              View all notifications
            </RouterLink>
          </div>
        </div>
      </div>

      <!-- Profile -->
      <div class="relative" ref="profileRef">
        <button
          type="button"
          class="flex items-center gap-2 h-10 pl-1 pr-1 sm:pr-2 rounded-md hover:bg-surface-hover"
          :aria-expanded="showProfile"
          aria-label="Account menu"
          @click="toggleProfile"
        >
          <img
            v-if="avatarUrl"
            :src="avatarUrl"
            alt=""
            class="w-8 h-8 rounded-full object-cover border border-line"
          />
          <span v-else class="avatar !w-8 !h-8 !text-xs">{{ userInitials }}</span>
          <span class="hidden md:block text-left leading-tight max-w-[140px]">
            <span class="block text-sm font-semibold text-ink truncate">{{ authStore.user?.name }}</span>
            <span class="block text-[11px] text-ink-muted capitalize truncate">{{ roleLabel }}</span>
          </span>
          <AppIcon icon="chevron-down" class="hidden md:block w-4 h-4 text-ink-muted" />
        </button>
        <div
          v-if="showProfile"
          class="menu absolute right-0 top-full mt-2 w-60 z-50"
        >
          <div class="px-4 py-3 border-b border-line">
            <p class="font-semibold text-sm text-ink truncate">{{ authStore.user?.name }}</p>
            <p class="text-xs text-ink-muted truncate">{{ authStore.user?.email }}</p>
          </div>
          <div class="py-1">
            <RouterLink
              :to="profileLink"
              class="menu-item"
              @click="showProfile = false"
            >
              <AppIcon icon="user" class="w-4 h-4" />
              My Profile
            </RouterLink>
            <RouterLink
              :to="dashboardLink"
              class="menu-item"
              @click="showProfile = false"
            >
              <AppIcon icon="layout-grid" class="w-4 h-4" />
              Dashboard
            </RouterLink>
          </div>
          <div class="sm:hidden border-t border-line px-3 py-2 flex items-center justify-between">
            <span class="text-sm text-ink-secondary">Theme</span>
            <div class="segmented" role="group" aria-label="Theme">
              <button v-for="m in themeModes" :key="m.mode" type="button" class="!px-2.5" :aria-pressed="themeStore.themeMode === m.mode" :aria-label="m.label" @click="themeStore.setThemeMode(m.mode)">
                <AppIcon :icon="m.icon" class="w-4 h-4" />
              </button>
            </div>
          </div>
          <div class="border-t border-line py-1">
            <button
              type="button"
              class="menu-item !text-danger-text hover:!bg-danger-soft"
              @click="logout"
            >
              <AppIcon icon="logout" class="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>

  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'
import { useThemeStore } from '@/stores/theme'
import TopBarActions from '@/components/layout/TopBarActions.vue'
import { useRowActions } from '@/composables/useRowActions'
import AppIcon from '@/components/ui/AppIcon.vue'

const props = defineProps<{ sidebarCollapsed?: boolean }>()
const emit = defineEmits<{ 'toggle-sidebar': [] }>()

const authStore = useAuthStore()
const notifStore = useNotificationStore()
const themeStore = useThemeStore()
const route = useRoute()
const router = useRouter()

const themeModes = [
  { mode: 'light' as const, icon: 'sun', label: 'Light mode' },
  { mode: 'dark' as const, icon: 'moon', label: 'Dark mode' },
  { mode: 'auto' as const, icon: 'device-desktop', label: 'System theme' },
]

const showNotif = ref(false)
const showProfile = ref(false)
const notifRef = ref<HTMLElement | null>(null)
const profileRef = ref<HTMLElement | null>(null)

const userInitials = computed(() => {
  const name = authStore.user?.name || ''
  return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'EG'
})

function getAvatarUrl(path: string | undefined): string | null {
  if (!path) return null
  const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/api\/?$/, '') || 'http://localhost:8000'
  const p = path.startsWith('/') ? path.slice(1) : path
  return p.startsWith('storage/') ? `${base}/${p}` : `${base}/storage/${p}`
}
const avatarUrl = computed(() => getAvatarUrl(authStore.user?.avatar))

const portalName = computed(() => {
  const r = authStore.user?.role
  if (r === 'admin') return 'Support'
  if (r === 'store_owner') return 'Shop'
  return 'Customer'
})

const roleLabel = computed(() => {
  const r = authStore.user?.role || ''
  return r.replace('_', ' ')
})

const routeTitles: Record<string, string> = {
  'support-dashboard': 'Dashboard', 'support-users': 'Users', 'support-stores': 'Stores', 'support-venues': 'Venues',
  'support-bookings': 'Bookings', 'support-sessions': 'Sessions', 'support-settings': 'Settings', 'support-categories': 'Categories',
  'support-messages': 'Messages', 'support-notifications': 'Notifications', 'support-reviews': 'Reviews',
  'shop-dashboard': 'Dashboard', 'shop-venues': 'My Venues', 'shop-venue-create': 'Add Venue', 'shop-venue-edit': 'Edit Venue',
  'shop-venue-gallery': 'Venue Gallery', 'shop-bookings': 'Bookings', 'shop-profile': 'My Profile', 'shop-landing': 'Landing Page',
  'shop-messages': 'Messages', 'shop-notifications': 'Notifications', 'shop-reviews': 'Reviews', 'shop-booking-detail': 'Booking Details',
  'customer-dashboard': 'Overview', 'customer-bookings': 'My Bookings', 'customer-booking-detail': 'Booking Details', 'customer-profile': 'My Profile',
  'customer-messages': 'Messages', 'customer-notifications': 'Notifications', 'customer-payment': 'Payment',
  'customer-payment-success': 'Payment Success', 'customer-payment-cancel': 'Payment Cancelled',
  'venue-booking': 'Book Venue',
}

const pageTitle = computed(() => {
  const byName = routeTitles[route.name as string]
  if (byName) return byName
  const segs = route.path.split('/').filter(Boolean)
  const last = segs[segs.length - 1] || 'Dashboard'
  return last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, ' ')
})

const profileLink = computed(() => {
  const role = authStore.user?.role
  if (role === 'admin') return '/support/settings'
  if (role === 'store_owner') return '/shop/profile'
  return '/customer/profile'
})

const dashboardLink = computed(() => {
  const role = authStore.user?.role
  if (role === 'admin') return '/support/dashboard'
  if (role === 'store_owner') return '/shop/dashboard'
  return '/customer/dashboard'
})

const notifPageLink = computed(() => {
  const role = authStore.user?.role
  if (role === 'admin') return '/support/notifications'
  if (role === 'store_owner') return '/shop/notifications'
  return '/customer/notifications'
})

function toggleNotif() {
  showNotif.value = !showNotif.value
  showProfile.value = false
}

function toggleProfile() {
  showProfile.value = !showProfile.value
  showNotif.value = false
}

// Bell actions are optimistic (the store rolls back on failure) and per item, so
// several can be cleared quickly one after another.
const actions = useRowActions()

function markAllRead() {
  void actions.run('all', {
    request: () => notifStore.markAllRead(),
    success: 'All notifications marked as read',
    error: 'Could not mark all as read.',
  })
}

function removeNotif(id: number) {
  void actions.run(`del-${id}`, {
    request: () => notifStore.remove(id),
    success: 'Notification removed',
    error: 'Could not remove this notification.',
  })
}

function handleNotifClick(n: any) {
  if (!n.is_read) {
    void actions.run(n.id, { request: () => notifStore.markRead(n.id), success: false, error: 'Could not mark this notification as read.' })
  }
  showNotif.value = false
  const to = notifStore.linkFor(n, authStore.user?.role)
  if (to) router.push(to)
}

async function logout() {
  showProfile.value = false
  const role = authStore.user?.role
  await authStore.logout()
  if (role === 'admin') router.push('/support/sign-in')
  else if (role === 'store_owner') router.push('/shop/sign-in')
  else router.push('/customer/sign-in')
}

function handleClickOutside(e: MouseEvent) {
  if (notifRef.value && !notifRef.value.contains(e.target as Node)) showNotif.value = false
  if (profileRef.value && !profileRef.value.contains(e.target as Node)) showProfile.value = false
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  notifStore.fetchUnread()
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
