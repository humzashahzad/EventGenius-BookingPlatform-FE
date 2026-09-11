<template>
  <header class="flex items-center h-14 px-3 sm:px-4 bg-white/80 dark:bg-warm-800/80 backdrop-blur-xl border border-warm-200/60 dark:border-warm-700/60 rounded-2xl shadow-card shrink-0">
    <button
      type="button"
      class="p-2 -ml-2 rounded-lg hover:bg-warm-100 dark:hover:bg-warm-700 text-warm-500 dark:text-warm-400"
      aria-label="Toggle menu"
      @click="emit('toggle-sidebar')"
    >
      <AppIcon icon="menu-2" class="w-5 h-5" />
    </button>

    <h1 class="ml-3 text-sm font-semibold text-warm-800 dark:text-white truncate max-w-[120px] sm:max-w-[200px]">
      {{ pageTitle }}
    </h1>

    <div class="flex-1 min-w-0"></div>

    <div class="flex items-center gap-2 ml-auto">
      <!-- Page Actions (search, filters) — right-aligned before theme -->
      <div class="hidden lg:flex items-center">
        <TopBarActions />
      </div>

      <!-- Theme Switcher — inline row -->
      <div class="flex items-center rounded-xl bg-warm-100/80 dark:bg-warm-700/50 p-0.5 gap-0.5">
        <button
          type="button"
          class="p-1.5 rounded-lg transition-all duration-200"
          :class="themeStore.themeMode === 'light' ? 'bg-white dark:bg-warm-600 text-amber-500 shadow-sm' : 'text-warm-400 hover:text-warm-600 dark:hover:text-warm-300'"
          aria-label="Light mode"
          @click="themeStore.setThemeMode('light')"
        >
          <AppIcon icon="sun" class="w-4 h-4" />
        </button>
        <button
          type="button"
          class="p-1.5 rounded-lg transition-all duration-200"
          :class="themeStore.themeMode === 'dark' ? 'bg-white dark:bg-warm-600 text-primary-500 shadow-sm' : 'text-warm-400 hover:text-warm-600 dark:hover:text-warm-300'"
          aria-label="Dark mode"
          @click="themeStore.setThemeMode('dark')"
        >
          <AppIcon icon="moon" class="w-4 h-4" />
        </button>
        <button
          type="button"
          class="p-1.5 rounded-lg transition-all duration-200"
          :class="themeStore.themeMode === 'auto' ? 'bg-white dark:bg-warm-600 text-sky shadow-sm' : 'text-warm-400 hover:text-warm-600 dark:hover:text-warm-300'"
          aria-label="System theme"
          @click="themeStore.setThemeMode('auto')"
        >
          <AppIcon icon="device-desktop" class="w-4 h-4" />
        </button>
      </div>

      <!-- Notifications -->
      <div class="relative" ref="notifRef">
        <button
          type="button"
          class="relative p-2 rounded-lg hover:bg-warm-100 dark:hover:bg-warm-700 text-warm-500 dark:text-warm-400"
          aria-label="Notifications"
          @click="toggleNotif"
        >
          <AppIcon icon="bell" class="w-5 h-5" />
          <span
            v-if="notifStore.unreadCount > 0"
            class="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-xs font-bold rounded-full bg-coral text-white"
          >
            {{ notifStore.unreadCount > 99 ? '99+' : notifStore.unreadCount }}
          </span>
        </button>
        <div
          v-if="showNotif"
          class="absolute right-0 top-full mt-2 w-80 sm:w-[22rem] max-w-[calc(100vw-1rem)] bg-white dark:bg-warm-800 rounded-2xl border border-warm-200 dark:border-warm-700 shadow-elevated z-50 overflow-hidden"
        >
          <div class="flex items-center justify-between p-3 border-b border-warm-200 dark:border-warm-700">
            <span class="font-semibold text-warm-800 dark:text-white">Notifications</span>
            <div class="flex items-center gap-2">
              <span v-if="notifStore.unreadCount > 0" class="px-2 py-0.5 text-xs font-medium rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
                {{ notifStore.unreadCount }} New
              </span>
              <button
                v-if="notifStore.unreadCount > 0"
                type="button"
                class="p-1 rounded-lg hover:bg-warm-100 dark:hover:bg-warm-700"
                @click="notifStore.markAllRead()"
              >
                <AppIcon icon="mail-opened" class="w-4 h-4" />
              </button>
            </div>
          </div>
          <div class="max-h-80 overflow-y-auto scrollbar-thin">
            <div v-if="!notifStore.notifications.length" class="text-center py-8 text-warm-500 dark:text-warm-400">
              <AppIcon icon="bell-off" class="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p class="text-sm">No notifications yet</p>
            </div>
            <div
              v-for="n in notifStore.notifications.slice(0, 20)"
              :key="n.id"
              role="button"
              tabindex="0"
              class="w-full flex items-start gap-3 p-3 text-left cursor-pointer hover:bg-warm-50 dark:hover:bg-warm-700/50 border-b border-warm-100 dark:border-warm-700/50"
              :class="{ 'bg-primary-50/50 dark:bg-primary-900/10': !n.is_read }"
              @click="handleNotifClick(n)"
              @keydown.enter="handleNotifClick(n)"
            >
              <span class="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0">
                {{ notifStore.iconForType(n.type) }}
              </span>
              <span class="flex-1 min-w-0">
                <p class="text-sm font-medium text-warm-800 dark:text-white truncate" :class="{ 'font-semibold': !n.is_read }">{{ n.title }}</p>
                <p class="text-xs text-warm-500 dark:text-warm-400 line-clamp-2">{{ n.body }}</p>
                <p class="text-xs text-warm-400 dark:text-warm-500 mt-0.5">{{ notifStore.timeAgo(n.created_at) }}</p>
              </span>
              <button type="button" class="p-1 rounded-lg hover:bg-warm-200 dark:hover:bg-warm-600 shrink-0" @click.stop="notifStore.remove(n.id)">
                <AppIcon icon="x" class="w-4 h-4" />
              </button>
            </div>
          </div>
          <div class="p-3 border-t border-warm-200 dark:border-warm-700">
            <RouterLink
              :to="notifPageLink"
              class="block w-full py-2 text-center text-sm font-medium rounded-xl bg-primary-500 text-white hover:bg-primary-600 transition-colors"
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
          class="flex items-center p-1 rounded-lg hover:bg-warm-100 dark:hover:bg-warm-700"
          @click="toggleProfile"
        >
          <img
            v-if="avatarUrl"
            :src="avatarUrl"
            alt=""
            class="w-8 h-8 rounded-full object-cover ring-2 ring-warm-200 dark:ring-warm-600"
          />
          <span
            v-else
            class="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center text-sm font-semibold"
          >
            {{ userInitials }}
          </span>
        </button>
        <div
          v-if="showProfile"
          class="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-warm-800 rounded-2xl border border-warm-200 dark:border-warm-700 shadow-elevated z-50 overflow-hidden"
        >
          <div class="p-3 border-b border-warm-200 dark:border-warm-700">
            <p class="font-medium text-warm-800 dark:text-white truncate">{{ authStore.user?.name }}</p>
            <p class="text-xs text-warm-500 dark:text-warm-400 capitalize">{{ roleLabel }}</p>
          </div>
          <div class="py-1">
            <RouterLink
              :to="profileLink"
              class="flex items-center gap-2 px-3 py-2 text-sm text-warm-600 dark:text-warm-300 hover:bg-warm-50 dark:hover:bg-warm-700 transition-colors"
              @click="showProfile = false"
            >
              <AppIcon icon="user" class="w-4 h-4" />
              My Profile
            </RouterLink>
            <RouterLink
              :to="dashboardLink"
              class="flex items-center gap-2 px-3 py-2 text-sm text-warm-600 dark:text-warm-300 hover:bg-warm-50 dark:hover:bg-warm-700 transition-colors"
              @click="showProfile = false"
            >
              <AppIcon icon="layout-grid" class="w-4 h-4" />
              Dashboard
            </RouterLink>
          </div>
          <div class="border-t border-warm-200 dark:border-warm-700 py-1">
            <button
              type="button"
              class="flex items-center gap-2 w-full px-3 py-2 text-sm text-coral dark:text-coral-light hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
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
import AppIcon from '@/components/ui/AppIcon.vue'

const props = defineProps<{ sidebarCollapsed?: boolean }>()
const emit = defineEmits<{ 'toggle-sidebar': [] }>()

const authStore = useAuthStore()
const notifStore = useNotificationStore()
const themeStore = useThemeStore()
const route = useRoute()
const router = useRouter()

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

const roleLabel = computed(() => {
  const r = authStore.user?.role || ''
  return r.replace('_', ' ')
})

const routeTitles: Record<string, string> = {
  'support-dashboard': 'Dashboard', 'support-users': 'Users', 'support-stores': 'Stores', 'support-venues': 'Venues',
  'support-bookings': 'Bookings', 'support-sessions': 'Sessions', 'support-settings': 'Settings', 'support-categories': 'Categories',
  'support-messages': 'Messages', 'support-notifications': 'Notifications',
  'shop-dashboard': 'Dashboard', 'shop-venues': 'My Venues', 'shop-venue-create': 'Add Venue', 'shop-venue-edit': 'Edit Venue',
  'shop-venue-gallery': 'Venue Gallery', 'shop-bookings': 'Bookings', 'shop-profile': 'My Profile', 'shop-landing': 'Landing Page',
  'shop-messages': 'Messages', 'shop-notifications': 'Notifications',
  'customer-bookings': 'My Bookings', 'customer-booking-detail': 'Booking Details', 'customer-profile': 'My Profile',
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
  return '/customer/bookings'
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

function handleNotifClick(n: any) {
  if (!n.is_read) notifStore.markRead(n.id)
  showNotif.value = false
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
