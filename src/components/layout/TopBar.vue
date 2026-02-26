<template>
  <header class="topbar">
    <!-- Left: collapse arrow + hamburger (3 lines) + page title -->
    <div class="flex items-center gap-3">
      <button
        @click="emit('toggle-sidebar')"
        class="topbar-hamburger"
        :aria-label="sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        :title="sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
      >
        <svg
          class="w-5 h-5 transition-transform duration-300"
          :class="{ 'rotate-180': sidebarCollapsed }"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
      </button>
      <button @click="emit('toggle-sidebar')" class="topbar-hamburger" aria-label="Toggle menu" title="Toggle menu">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </button>
      <div class="hidden sm:block">
        <h1 class="topbar-title">{{ pageTitle }}</h1>
      </div>
    </div>

    <!-- Right: global search/filter (store & admin) + theme + notifications + profile -->
    <div class="flex items-center gap-2">
      <TopBarActions />

      <!-- Theme (opens customizer) -->
      <button @click="showThemeCustomizer = true" class="theme-toggle" aria-label="Theme" title="Theme">
        <svg v-if="themeStore.themeMode === 'light'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
        </svg>
        <svg v-else-if="themeStore.themeMode === 'dark'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
        </svg>
        <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
        </svg>
      </button>

      <!-- Notification Bell -->
      <div class="relative" ref="notifRef">
        <button
          @click="toggleNotif"
          class="topbar-icon-btn"
          :class="{ 'text-primary-600': showNotif }"
          aria-label="Notifications"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
          </svg>
          <span v-if="notifStore.unreadCount > 0" class="notif-badge">
            {{ notifStore.unreadCount > 99 ? '99+' : notifStore.unreadCount }}
          </span>
        </button>

        <!-- Notification Dropdown -->
        <Transition name="dropdown">
          <div v-if="showNotif" class="notif-dropdown">
            <!-- Header -->
            <div class="notif-dropdown-header">
              <span class="font-semibold text-surface-800">Notifications</span>
              <div class="flex items-center gap-2">
                <span v-if="notifStore.unreadCount > 0" class="text-xs text-surface-500">{{ notifStore.unreadCount }} unread</span>
                <button
                  v-if="notifStore.unreadCount > 0"
                  @click="notifStore.markAllRead()"
                  class="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  Mark all read
                </button>
              </div>
            </div>

            <!-- Notification list -->
            <div class="notif-list" ref="listRef">
              <div v-if="!notifStore.notifications.length" class="notif-empty">
                <svg class="w-10 h-10 text-surface-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                </svg>
                <p class="text-sm text-surface-500">No notifications yet</p>
              </div>

              <div
                v-for="n in notifStore.notifications.slice(0, 20)"
                :key="n.id"
                @click="handleNotifClick(n)"
                class="notif-item"
                :class="{ 'notif-item-unread': !n.is_read }"
              >
                <div class="notif-icon" :class="`notif-icon-${notifStore.colorForType(n.type)}`">
                  {{ notifStore.iconForType(n.type) }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="notif-title" :class="{ 'font-semibold': !n.is_read }">{{ n.title }}</p>
                  <p class="notif-body">{{ n.body }}</p>
                  <p class="notif-time">{{ notifStore.timeAgo(n.created_at) }}</p>
                </div>
                <button
                  @click.stop="notifStore.remove(n.id)"
                  class="notif-delete-btn"
                  title="Remove"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Footer -->
            <div class="notif-dropdown-footer">
              <RouterLink :to="notifPageLink" @click="showNotif = false" class="text-xs text-primary-600 hover:text-primary-700 font-medium">
                View all notifications
              </RouterLink>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Profile Dropdown -->
      <div class="relative" ref="profileRef">
        <button @click="toggleProfile" class="topbar-profile-btn">
          <div class="topbar-avatar">
            <img v-if="avatarUrl" :src="avatarUrl" alt="" class="topbar-avatar-img" />
            <span v-else>{{ userInitials }}</span>
          </div>
          <div class="hidden sm:block text-left">
            <p class="text-sm font-semibold text-surface-800 leading-tight">{{ authStore.user?.name?.split(' ')[0] }}</p>
            <p class="text-2xs text-surface-400 capitalize">{{ roleLabel }}</p>
          </div>
          <svg class="w-4 h-4 text-surface-400 hidden sm:block transition-transform duration-200"
            :class="{ 'rotate-180': showProfile }"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>

        <!-- Profile Dropdown -->
        <Transition name="dropdown">
          <div v-if="showProfile" class="profile-dropdown">
            <div class="profile-dropdown-header">
              <div class="topbar-avatar topbar-avatar-lg">
                <img v-if="avatarUrl" :src="avatarUrl" alt="" class="topbar-avatar-img" />
                <span v-else>{{ userInitials }}</span>
              </div>
              <div>
                <p class="font-semibold text-surface-800 text-sm">{{ authStore.user?.name }}</p>
                <p class="text-xs text-surface-500">{{ authStore.user?.email }}</p>
                <span class="badge badge-primary capitalize mt-1">{{ roleLabel }}</span>
              </div>
            </div>
            <div class="profile-dropdown-body">
              <RouterLink :to="profileLink" @click="showProfile = false" class="profile-menu-item">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
                My Profile
              </RouterLink>
              <RouterLink :to="dashboardLink" @click="showProfile = false" class="profile-menu-item">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
                </svg>
                Dashboard
              </RouterLink>
            </div>
            <div class="profile-dropdown-footer">
              <button @click="logout" class="profile-logout-btn">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <ThemeCustomizer v-model:open="showThemeCustomizer" />
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'
import { useThemeStore } from '@/stores/theme'
import TopBarActions from '@/components/layout/TopBarActions.vue'
import ThemeCustomizer from '@/components/theme/ThemeCustomizer.vue'

const props = defineProps<{ sidebarCollapsed?: boolean }>()
const emit  = defineEmits<{ 'toggle-sidebar': [] }>()

const authStore   = useAuthStore()
const notifStore  = useNotificationStore()
const themeStore  = useThemeStore()
const route       = useRoute()
const router      = useRouter()

const showNotif         = ref(false)
const showProfile       = ref(false)
const showThemeCustomizer = ref(false)
const notifRef    = ref<HTMLElement | null>(null)
const profileRef  = ref<HTMLElement | null>(null)

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

const pageTitle = computed(() => {
  const segs = route.path.split('/').filter(Boolean)
  const last = segs[segs.length - 1] || 'Dashboard'
  return last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, ' ')
})

const profileLink = computed(() => {
  const role = authStore.user?.role
  if (role === 'admin') return '/admin-panel/settings'
  if (role === 'store_owner') return '/store/profile'
  return '/client/profile'
})

const dashboardLink = computed(() => {
  const role = authStore.user?.role
  if (role === 'admin') return '/admin-panel/dashboard'
  if (role === 'store_owner') return '/store/dashboard'
  return '/client/dashboard'
})

const notifPageLink = computed(() => {
  const role = authStore.user?.role
  if (role === 'admin') return '/admin-panel/bookings'
  if (role === 'store_owner') return '/store/bookings'
  return '/client/bookings'
})

function toggleNotif() {
  showNotif.value   = !showNotif.value
  showProfile.value = false
}

function toggleProfile() {
  showProfile.value = !showProfile.value
  showNotif.value   = false
}

function handleNotifClick(n: any) {
  if (!n.is_read) notifStore.markRead(n.id)
  showNotif.value = false
}

async function logout() {
  showProfile.value = false
  await authStore.logout()
  const role = authStore.user?.role
  if (role === 'admin') router.push('/admin-panel/sign-in')
  else if (role === 'store_owner') router.push('/store/sign-in')
  else router.push('/client/sign-in')
}

// Close dropdowns when clicking outside
function handleClickOutside(e: MouseEvent) {
  if (notifRef.value && !notifRef.value.contains(e.target as Node)) {
    showNotif.value = false
  }
  if (profileRef.value && !profileRef.value.contains(e.target as Node)) {
    showProfile.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  notifStore.fetchUnread()
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.dropdown-enter-active, .dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dropdown-enter-from, .dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.97);
}
</style>
