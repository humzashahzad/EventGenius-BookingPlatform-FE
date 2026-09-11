<template>
  <header class="client-topbar">
    <!-- Left: Toggle + Page title -->
    <div class="client-topbar-left">
      <button @click="$emit('toggle-sidebar')" class="client-topbar-toggle" title="Toggle sidebar">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </button>
      <div>
        <h1 class="client-topbar-title">{{ pageTitle }}</h1>
        <p class="client-topbar-subtitle">{{ greeting }}</p>
      </div>
    </div>

    <!-- Right: Theme, Notifications, Profile -->
    <div class="client-topbar-right">
      <button @click="showThemeCustomizer = true" class="client-topbar-icon" aria-label="Theme" title="Theme">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
        </svg>
      </button>

      <div class="relative" ref="notifRef">
        <button @click="toggleNotif" class="client-topbar-icon" aria-label="Notifications">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
          </svg>
          <span v-if="notifStore.unreadCount > 0" class="client-topbar-badge">{{ notifStore.unreadCount > 99 ? '99+' : notifStore.unreadCount }}</span>
        </button>
        <Transition name="dropdown">
          <div v-if="showNotif" class="client-topbar-dropdown notif-panel">
            <div class="flex items-center justify-between p-3 border-b border-surface-200">
              <span class="font-semibold text-surface-800">Notifications</span>
              <button v-if="notifStore.unreadCount > 0" @click="notifStore.markAllRead()" class="text-xs text-primary-600 hover:text-primary-700 font-medium">Mark all read</button>
            </div>
            <div class="max-h-80 overflow-y-auto">
              <div v-if="!notifStore.notifications.length" class="p-6 text-center text-surface-500 text-sm">No notifications yet</div>
              <div
                v-for="n in notifStore.notifications.slice(0, 20)"
                :key="n.id"
                @click="handleNotifClick(n)"
                class="flex gap-3 p-3 hover:bg-surface-50 cursor-pointer border-b border-surface-100 last:border-0"
                :class="{ 'bg-primary-50/50': !n.is_read }"
              >
                <div class="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-lg flex-shrink-0">{{ notifStore.iconForType(n.type) }}</div>
                <div class="min-w-0 flex-1">
                  <p class="text-sm" :class="!n.is_read ? 'font-semibold text-surface-800' : 'text-surface-700'">{{ n.title }}</p>
                  <p class="text-xs text-surface-500 truncate">{{ n.body }}</p>
                  <p class="text-xs text-surface-400 mt-0.5">{{ notifStore.timeAgo(n.created_at) }}</p>
                </div>
              </div>
            </div>
            <div class="p-2 border-t border-surface-200">
              <RouterLink to="/client/bookings" @click="showNotif = false" class="text-xs text-primary-600 hover:text-primary-700 font-medium block text-center">View all</RouterLink>
            </div>
          </div>
        </Transition>
      </div>

      <div class="relative" ref="profileRef">
        <button @click="toggleProfile" class="client-topbar-profile-btn">
          <div class="client-topbar-avatar">
            <img v-if="avatarUrl" :src="avatarUrl" alt="" class="w-full h-full object-cover rounded-full" />
            <span v-else>{{ userInitials }}</span>
          </div>
          <span v-if="!sidebarCollapsed" class="client-topbar-profile-name">{{ authStore.user?.name?.split(' ')[0] }}</span>
        </button>
        <Transition name="dropdown">
          <div v-if="showProfile" class="client-topbar-dropdown profile-panel">
            <div class="p-4 border-b border-surface-200 flex items-center gap-3">
              <div class="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-lg overflow-hidden">
                <img v-if="avatarUrl" :src="avatarUrl" alt="" class="w-full h-full object-cover" />
                <span v-else>{{ userInitials }}</span>
              </div>
              <div>
                <p class="font-semibold text-surface-800">{{ authStore.user?.name }}</p>
                <p class="text-xs text-surface-500">{{ authStore.user?.email }}</p>
              </div>
            </div>
            <div class="p-2">
              <RouterLink to="/client/profile" @click="showProfile = false" class="client-dropdown-item">My Profile</RouterLink>
              <RouterLink to="/client/dashboard" @click="showProfile = false" class="client-dropdown-item">Dashboard</RouterLink>
            </div>
            <div class="p-2 border-t border-surface-200">
              <button @click="logout" class="client-dropdown-item text-red-600 hover:bg-red-50 w-full text-left">
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
import ThemeCustomizer from '@/components/theme/ThemeCustomizer.vue'

defineProps<{ sidebarCollapsed?: boolean }>()
defineEmits<{ 'toggle-sidebar': [] }>()

const authStore = useAuthStore()
const notifStore = useNotificationStore()
const themeStore = useThemeStore()
const route = useRoute()
const router = useRouter()

const showNotif = ref(false)
const showProfile = ref(false)
const showThemeCustomizer = ref(false)
const notifRef = ref<HTMLElement | null>(null)
const profileRef = ref<HTMLElement | null>(null)

const pageTitle = computed(() => {
  const name = route.name as string
  const map: Record<string, string> = {
    'client-dashboard': 'Dashboard',
    'client-bookings': 'My Bookings',
    'client-booking-detail': 'Booking Details',
    'client-messages': 'Messages',
    'client-profile': 'My Profile',
  }
  return map[name] || 'Dashboard'
})

const greeting = computed(() => {
  const hour = new Date().getHours()
  const name = authStore.user?.name?.split(' ')[0] || 'there'
  if (hour < 12) return `Good morning, ${name}`
  if (hour < 17) return `Good afternoon, ${name}`
  return `Good evening, ${name}`
})

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
  await authStore.logout()
  router.push('/client/sign-in')
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

<style scoped>
.client-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 1.5rem;
  background: white;
  border-bottom: 1px solid #ede9fe;
  flex-shrink: 0;
}

.client-topbar-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.client-topbar-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 0.5rem;
  border: none;
  background: #f5f3ff;
  color: #7c3aed;
  cursor: pointer;
  transition: background 0.15s;
}

.client-topbar-toggle:hover {
  background: #ede9fe;
}

.client-topbar-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.2;
}

.client-topbar-subtitle {
  font-size: 0.75rem;
  color: #64748b;
}

.client-topbar-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.client-topbar-icon {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: none;
  background: #f5f3ff;
  color: #7c3aed;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.client-topbar-icon:hover {
  background: #ede9fe;
}

.client-topbar-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: #f43f5e;
  color: white;
  font-size: 0.625rem;
  font-weight: 700;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.client-topbar-profile-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.625rem 0.25rem 0.25rem;
  border-radius: 0.625rem;
  border: 1px solid #ede9fe;
  background: white;
  cursor: pointer;
  transition: all 0.15s;
}

.client-topbar-profile-btn:hover {
  border-color: #ddd6fe;
  background: #faf5ff;
}

.client-topbar-profile-name {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #334155;
}

.client-topbar-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #7c3aed, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.75rem;
  color: white;
  overflow: hidden;
  flex-shrink: 0;
}

.client-topbar-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 320px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.12);
  z-index: 100;
  overflow: hidden;
}

.client-dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  border-radius: 8px;
  color: #334155;
  text-decoration: none;
  font-size: 0.875rem;
  transition: background 0.15s;
}

.client-dropdown-item:hover {
  background: #f5f3ff;
}

.dropdown-enter-active, .dropdown-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-8px); }

/* Dark mode */
:global(html.dark) .client-topbar {
  background: #1a1625;
  border-bottom-color: rgba(139, 92, 246, 0.15);
}

:global(html.dark) .client-topbar-title { color: #f3f4f6; }
:global(html.dark) .client-topbar-subtitle { color: #9ca3af; }

:global(html.dark) .client-topbar-toggle {
  background: rgba(139, 92, 246, 0.15);
  color: #a78bfa;
}

:global(html.dark) .client-topbar-icon {
  background: rgba(139, 92, 246, 0.15);
  color: #a78bfa;
}

:global(html.dark) .client-topbar-profile-btn {
  border-color: rgba(139, 92, 246, 0.2);
  background: transparent;
}

:global(html.dark) .client-topbar-profile-name { color: #e5e7eb; }

:global(html.dark) .client-topbar-dropdown {
  background: #1e2939;
  border: 1px solid #2d3748;
}

:global(html.dark) .client-dropdown-item {
  color: #e5e7eb;
}

:global(html.dark) .client-dropdown-item:hover {
  background: rgba(139, 92, 246, 0.1);
}
</style>
