<template>
  <nav class="customer-navbar">
    <div class="customer-navbar-inner">
      <!-- Left: Logo -->
      <RouterLink to="/" class="customer-navbar-logo">
        <div class="customer-navbar-logo-icon">EG</div>
        <div class="customer-navbar-logo-text">
          <span class="text-xs font-bold tracking-widest uppercase leading-none" style="color: var(--color-primary);">EventGenius</span>
          <span class="text-sm font-bold leading-tight" style="color: var(--color-text);">Booking Platform</span>
        </div>
      </RouterLink>

      <!-- Center: Nav links (desktop) -->
      <div class="customer-navbar-links">
        <RouterLink to="/" class="customer-nav-link" :class="{ active: route.path === '/' }">Home</RouterLink>
        <RouterLink to="/venues" class="customer-nav-link" :class="{ active: route.path === '/venues' || route.path.startsWith('/venues/') }">Venues</RouterLink>
        <RouterLink to="/customer/bookings" class="customer-nav-link" :class="{ active: route.path.startsWith('/customer/bookings') }">
          My Bookings
        </RouterLink>
        <RouterLink to="/customer/messages" class="customer-nav-link" :class="{ active: route.path.startsWith('/customer/messages') }">
          Messages
          <span v-if="chatUnreadCount > 0" class="customer-nav-badge">{{ chatUnreadCount > 99 ? '99+' : chatUnreadCount }}</span>
        </RouterLink>
        <RouterLink to="/customer/notifications" class="customer-nav-link" :class="{ active: route.path.startsWith('/customer/notifications') }">
          Notifications
          <span v-if="generalNotifUnreadCount > 0" class="customer-nav-badge">{{ generalNotifUnreadCount > 99 ? '99+' : generalNotifUnreadCount }}</span>
        </RouterLink>
      </div>

      <!-- Right: Actions -->
      <div class="customer-navbar-actions">
        <!-- Theme toggle -->
        <button @click="showThemeCustomizer = true" class="customer-navbar-icon-btn" title="Theme">
          <AppIcon icon="sun" class="w-5 h-5" />
        </button>

        <!-- Notifications -->
        <div class="relative" ref="notifRef">
          <button @click="toggleNotif" class="customer-navbar-icon-btn" aria-label="Notifications">
            <AppIcon icon="bell" class="w-5 h-5" />
            <span v-if="generalNotifUnreadCount > 0" class="customer-navbar-notif-badge">{{ generalNotifUnreadCount > 99 ? '99+' : generalNotifUnreadCount }}</span>
          </button>
          <Transition name="dropdown">
            <div v-if="showNotif" class="customer-navbar-dropdown notif-dropdown">
              <div class="flex items-center justify-between p-3" style="border-bottom: 1px solid var(--color-border-light)">
                <span class="font-semibold text-sm" style="color: var(--color-text)">Notifications</span>
                <button v-if="generalNotifUnreadCount > 0" @click="notifStore.markAllRead()" class="text-xs font-medium" style="color: var(--color-primary)">Mark all read</button>
              </div>
              <div class="max-h-80 overflow-y-auto">
                <div v-if="!notifStore.notifications.length" class="p-6 text-center text-sm" style="color: var(--color-text-muted)">No notifications yet</div>
                <div
                  v-for="n in notifStore.notifications.slice(0, 20)"
                  :key="n.id"
                  @click="handleNotifClick(n)"
                  class="flex gap-3 p-3 cursor-pointer transition-colors"
                  :style="{ borderBottom: '1px solid var(--color-border-light)', background: !n.is_read ? 'rgba(16,185,129,0.06)' : 'transparent' }"
                  @mouseenter="($event.currentTarget as HTMLElement).style.background = 'var(--color-bg-hover)'"
                  @mouseleave="($event.currentTarget as HTMLElement).style.background = !n.is_read ? 'rgba(16,185,129,0.06)' : 'transparent'"
                >
                  <div class="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0" style="background: rgba(16,185,129,0.12)">{{ notifStore.iconForType(n.type) }}</div>
                  <div class="min-w-0 flex-1">
                    <p class="text-sm" :style="{ fontWeight: !n.is_read ? '600' : '400', color: 'var(--color-text)' }">{{ n.title }}</p>
                    <p class="text-xs truncate" style="color: var(--color-text-secondary)">{{ n.body }}</p>
                    <p class="text-xs mt-0.5" style="color: var(--color-text-muted)">{{ notifStore.timeAgo(n.created_at) }}</p>
                  </div>
                </div>
              </div>
              <div class="p-3" style="border-top: 1px solid var(--color-border-light)">
                <RouterLink to="/customer/notifications" @click="showNotif = false" class="customer-dropdown-item">
                  <AppIcon icon="bell" class="w-4 h-4" />
                  View all notifications
                </RouterLink>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Profile -->
        <div class="relative" ref="profileRef">
          <button @click="toggleProfile" class="customer-navbar-profile-btn">
            <div class="customer-navbar-avatar">
              <img v-if="avatarUrl" :src="avatarUrl" alt="" class="w-full h-full object-cover rounded-full" />
              <span v-else>{{ userInitials }}</span>
            </div>
            <span class="customer-navbar-profile-name hidden sm:inline">{{ authStore.user?.name?.split(' ')[0] }}</span>
            <AppIcon icon="chevron-down" class="w-4 h-4 hidden sm:block" style="color: var(--color-text-muted)" />
          </button>
          <Transition name="dropdown">
            <div v-if="showProfile" class="customer-navbar-dropdown profile-dropdown">
              <div class="p-4 flex items-center gap-3" style="border-bottom: 1px solid var(--color-border-light)">
                <div class="w-10 h-10 rounded-full flex items-center justify-center font-semibold overflow-hidden" style="background: rgba(16,185,129,0.12); color: var(--color-primary)">
                  <img v-if="avatarUrl" :src="avatarUrl" alt="" class="w-full h-full object-cover" />
                  <span v-else>{{ userInitials }}</span>
                </div>
                <div>
                  <p class="font-semibold text-sm" style="color: var(--color-text)">{{ authStore.user?.name }}</p>
                  <p class="text-xs" style="color: var(--color-text-secondary)">{{ authStore.user?.email }}</p>
                </div>
              </div>
              <div class="p-1.5">
                <RouterLink to="/customer/profile" @click="showProfile = false" class="customer-dropdown-item">
                  <AppIcon icon="user" class="w-4 h-4" />
                  My Profile
                </RouterLink>
                <RouterLink to="/customer/bookings" @click="showProfile = false" class="customer-dropdown-item">
                  <AppIcon icon="calendar-event" class="w-4 h-4" />
                  My Bookings
                </RouterLink>
                <RouterLink to="/customer/messages" @click="showProfile = false" class="customer-dropdown-item">
                  <AppIcon icon="message" class="w-4 h-4" />
                  Messages
                </RouterLink>
                <RouterLink to="/customer/notifications" @click="showProfile = false" class="customer-dropdown-item">
                  <AppIcon icon="bell" class="w-4 h-4" />
                  Notifications
                </RouterLink>
              </div>
              <div class="p-1.5" style="border-top: 1px solid var(--color-border-light)">
                <button @click="logout" class="customer-dropdown-item customer-dropdown-logout w-full text-left">
                  <AppIcon icon="logout" class="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Mobile menu toggle -->
        <button @click="mobileOpen = !mobileOpen" class="customer-navbar-icon-btn sm:hidden" aria-label="Menu">
          <AppIcon v-if="!mobileOpen" icon="menu-2" class="w-5 h-5" />
          <AppIcon v-else icon="x" class="w-5 h-5" />
        </button>
      </div>
    </div>

    <!-- Mobile nav -->
    <Transition name="mobile-nav">
      <div v-if="mobileOpen" class="customer-navbar-mobile">
        <RouterLink to="/" @click="mobileOpen = false" class="customer-mobile-link" :class="{ active: route.path === '/' }">Home</RouterLink>
        <RouterLink to="/venues" @click="mobileOpen = false" class="customer-mobile-link" :class="{ active: route.path === '/venues' }">Venues</RouterLink>
        <RouterLink to="/customer/bookings" @click="mobileOpen = false" class="customer-mobile-link" :class="{ active: route.path.startsWith('/customer/bookings') }">My Bookings</RouterLink>
        <RouterLink to="/customer/messages" @click="mobileOpen = false" class="customer-mobile-link" :class="{ active: route.path.startsWith('/customer/messages') }">
          Messages
          <span v-if="chatUnreadCount > 0" class="customer-nav-badge ml-auto">{{ chatUnreadCount }}</span>
        </RouterLink>
        <RouterLink to="/customer/notifications" @click="mobileOpen = false" class="customer-mobile-link" :class="{ active: route.path.startsWith('/customer/notifications') }">
          Notifications
          <span v-if="generalNotifUnreadCount > 0" class="customer-nav-badge ml-auto">{{ generalNotifUnreadCount }}</span>
        </RouterLink>
        <RouterLink to="/customer/profile" @click="mobileOpen = false" class="customer-mobile-link" :class="{ active: route.path.startsWith('/customer/profile') }">Profile</RouterLink>
      </div>
    </Transition>
  </nav>

  <ThemeCustomizer v-model:open="showThemeCustomizer" />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'
import { useChatStore } from '@/stores/chat'
import ThemeCustomizer from '@/components/theme/ThemeCustomizer.vue'
import AppIcon from '@/components/ui/AppIcon.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const notifStore = useNotificationStore()
const chatStore = useChatStore()

const showNotif = ref(false)
const showProfile = ref(false)
const showThemeCustomizer = ref(false)
const mobileOpen = ref(false)
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
const chatUnreadCount = computed(() => chatStore.totalUnreadCount)
const generalNotifUnreadCount = computed(() => notifStore.unreadCount)

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
  router.push('/customer/sign-in')
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
.customer-navbar {
  position: sticky;
  top: 0;
  z-index: 50;
  background: color-mix(in srgb, var(--color-bg-elevated) 88%, transparent);
  border-bottom: 1px solid var(--color-border-light);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 4px 12px rgba(28, 25, 23, 0.05);
}

.customer-navbar-inner {
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 1.5rem;
}

@media (max-width: 640px) {
  .customer-navbar-inner {
    height: 56px;
    padding: 0 1rem;
  }
}

.customer-navbar-logo {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  text-decoration: none;
  flex-shrink: 0;
}

.customer-navbar-logo-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #10B981, #34D399);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8125rem;
  font-weight: 700;
}

.customer-navbar-logo-text {
  display: flex;
  flex-direction: column;
}

.customer-navbar-links {
  display: none;
  align-items: center;
  gap: 0.25rem;
}

@media (min-width: 768px) {
  .customer-navbar-links {
    display: flex;
  }
}

.customer-nav-link {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: all 0.15s ease;
}

.customer-nav-link:hover {
  color: var(--color-text);
  background: var(--color-bg-hover);
}

.customer-nav-link.active {
  color: var(--color-primary);
  background: rgba(16, 185, 129, 0.1);
  font-weight: 600;
}

.customer-nav-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: #F97066;
  color: white;
  font-size: 0.625rem;
  font-weight: 700;
  border-radius: 9px;
}

.customer-navbar-actions {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.customer-navbar-icon-btn {
  position: relative;
  width: 38px;
  height: 38px;
  border-radius: 0.75rem;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.customer-navbar-icon-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-primary);
}

.customer-navbar-notif-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  background: #F97066;
  color: white;
  font-size: 0.5625rem;
  font-weight: 700;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.customer-navbar-profile-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem;
  padding-right: 0.625rem;
  border-radius: 2rem;
  border: 1px solid var(--color-border-light);
  background: var(--color-bg-card);
  cursor: pointer;
  transition: all 0.15s;
}

.customer-navbar-profile-btn:hover {
  border-color: rgba(16, 185, 129, 0.3);
  background: var(--color-bg-hover);
}

.customer-navbar-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10B981, #34D399);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.6875rem;
  color: white;
  overflow: hidden;
  flex-shrink: 0;
}

.customer-navbar-profile-name {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text);
}

.customer-navbar-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: auto;
  right: 0;
  width: min(340px, calc(100vw - 1rem));
  max-width: calc(100vw - 1rem);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-light);
  border-radius: 1rem;
  box-shadow: 0 20px 48px rgba(28, 25, 23, 0.1), 0 8px 16px rgba(28, 25, 23, 0.06);
  z-index: 100;
  overflow: hidden;
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

.notif-dropdown {
  width: min(340px, calc(100vw - 1rem));
}

.profile-dropdown {
  width: min(260px, calc(100vw - 1rem));
}

.customer-dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.75rem;
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: 0.8125rem;
  transition: background 0.15s;
  border: none;
  background: transparent;
  cursor: pointer;
}

.customer-dropdown-item:hover {
  background: var(--color-bg-hover);
  color: var(--color-text);
}

.customer-dropdown-logout {
  color: #F97066;
}

.customer-dropdown-logout:hover {
  background: rgba(249, 112, 102, 0.08);
  color: #F97066;
}

.customer-navbar-mobile {
  display: flex;
  flex-direction: column;
  padding: 0.5rem;
  border-top: 1px solid var(--color-border-light);
  background: var(--color-bg-elevated);
  max-height: 80vh;
  overflow-y: auto;
}

@media (min-width: 768px) {
  .customer-navbar-mobile {
    display: none;
  }
}

.customer-mobile-link {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: all 0.15s;
}

.customer-mobile-link:hover {
  background: var(--color-bg-hover);
  color: var(--color-text);
}

.customer-mobile-link.active {
  color: var(--color-primary);
  background: rgba(16, 185, 129, 0.1);
  font-weight: 600;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.mobile-nav-enter-active,
.mobile-nav-leave-active {
  transition: max-height 0.3s ease, opacity 0.2s ease;
  overflow: hidden;
}

.mobile-nav-enter-from,
.mobile-nav-leave-to {
  max-height: 0;
  opacity: 0;
}

.mobile-nav-enter-to,
.mobile-nav-leave-from {
  max-height: 300px;
  opacity: 1;
}
</style>
