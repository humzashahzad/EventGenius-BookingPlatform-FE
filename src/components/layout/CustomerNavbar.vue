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
          <span v-if="notifStore.unreadCount > 0" class="customer-nav-badge">{{ notifStore.unreadCount > 99 ? '99+' : notifStore.unreadCount }}</span>
        </RouterLink>
      </div>

      <!-- Right: Actions -->
      <div class="customer-navbar-actions">
        <!-- Theme toggle -->
        <button @click="showThemeCustomizer = true" class="customer-navbar-icon-btn" title="Theme">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
          </svg>
        </button>

        <!-- Notifications -->
        <div class="relative" ref="notifRef">
          <button @click="toggleNotif" class="customer-navbar-icon-btn" aria-label="Notifications">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
            </svg>
            <span v-if="notifStore.unreadCount > 0" class="customer-navbar-notif-badge">{{ notifStore.unreadCount > 99 ? '99+' : notifStore.unreadCount }}</span>
          </button>
          <Transition name="dropdown">
            <div v-if="showNotif" class="customer-navbar-dropdown notif-dropdown">
              <div class="flex items-center justify-between p-3" style="border-bottom: 1px solid var(--color-border)">
                <span class="font-semibold text-sm" style="color: var(--color-text)">Notifications</span>
                <button v-if="notifStore.unreadCount > 0" @click="notifStore.markAllRead()" class="text-xs font-medium" style="color: var(--color-primary)">Mark all read</button>
              </div>
              <div class="max-h-80 overflow-y-auto">
                <div v-if="!notifStore.notifications.length" class="p-6 text-center text-sm" style="color: var(--color-text-muted)">No notifications yet</div>
                <div
                  v-for="n in notifStore.notifications.slice(0, 20)"
                  :key="n.id"
                  @click="handleNotifClick(n)"
                  class="flex gap-3 p-3 cursor-pointer transition-colors"
                  :style="{ borderBottom: '1px solid var(--color-border-light)', background: !n.is_read ? 'rgba(245,158,11,0.04)' : 'transparent' }"
                  @mouseenter="($event.currentTarget as HTMLElement).style.background = 'var(--color-bg-hover)'"
                  @mouseleave="($event.currentTarget as HTMLElement).style.background = !n.is_read ? 'rgba(245,158,11,0.04)' : 'transparent'"
                >
                  <div class="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0" style="background: rgba(245,158,11,0.1)">{{ notifStore.iconForType(n.type) }}</div>
                  <div class="min-w-0 flex-1">
                    <p class="text-sm" :style="{ fontWeight: !n.is_read ? '600' : '400', color: 'var(--color-text)' }">{{ n.title }}</p>
                    <p class="text-xs truncate" style="color: var(--color-text-secondary)">{{ n.body }}</p>
                    <p class="text-xs mt-0.5" style="color: var(--color-text-muted)">{{ notifStore.timeAgo(n.created_at) }}</p>
                  </div>
                </div>
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
            <svg class="w-4 h-4 hidden sm:block" style="color: var(--color-text-muted)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>
          <Transition name="dropdown">
            <div v-if="showProfile" class="customer-navbar-dropdown profile-dropdown">
              <div class="p-4 flex items-center gap-3" style="border-bottom: 1px solid var(--color-border)">
                <div class="w-10 h-10 rounded-full flex items-center justify-center font-semibold overflow-hidden" style="background: rgba(245,158,11,0.1); color: var(--color-primary)">
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
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                  My Profile
                </RouterLink>
                <RouterLink to="/customer/bookings" @click="showProfile = false" class="customer-dropdown-item">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  My Bookings
                </RouterLink>
                <RouterLink to="/customer/messages" @click="showProfile = false" class="customer-dropdown-item">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                  </svg>
                  Messages
                </RouterLink>
              </div>
              <div class="p-1.5" style="border-top: 1px solid var(--color-border)">
                <button @click="logout" class="customer-dropdown-item customer-dropdown-logout w-full text-left">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                  </svg>
                  Sign Out
                </button>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Mobile menu toggle -->
        <button @click="mobileOpen = !mobileOpen" class="customer-navbar-icon-btn sm:hidden" aria-label="Menu">
          <svg v-if="!mobileOpen" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
          <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
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
          <span v-if="notifStore.unreadCount > 0" class="customer-nav-badge ml-auto">{{ notifStore.unreadCount }}</span>
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
import ThemeCustomizer from '@/components/theme/ThemeCustomizer.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const notifStore = useNotificationStore()

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
  background: var(--color-bg-elevated);
  border-bottom: 1px solid var(--color-border);
  backdrop-filter: blur(12px);
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

/* Logo */
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
  background: linear-gradient(135deg, var(--color-primary-dark, #d97706), var(--color-primary, #f59e0b));
  color: #1a1a00;
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

/* Nav links */
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
  border-radius: 0.5rem;
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
  background: rgba(245, 158, 11, 0.08);
  font-weight: 600;
}

.customer-nav-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: #ef4444;
  color: white;
  font-size: 0.625rem;
  font-weight: 700;
  border-radius: 9px;
}

/* Actions */
.customer-navbar-actions {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.customer-navbar-icon-btn {
  position: relative;
  width: 38px;
  height: 38px;
  border-radius: 10px;
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
  background: #ef4444;
  color: white;
  font-size: 0.5625rem;
  font-weight: 700;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Profile button */
.customer-navbar-profile-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem;
  padding-right: 0.625rem;
  border-radius: 2rem;
  border: 1px solid var(--color-border);
  background: var(--color-bg-card);
  cursor: pointer;
  transition: all 0.15s;
}

.customer-navbar-profile-btn:hover {
  border-color: rgba(245, 158, 11, 0.3);
  background: var(--color-bg-hover);
}

.customer-navbar-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: linear-gradient(135deg, #d97706, #f59e0b);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.6875rem;
  color: #1a1a00;
  overflow: hidden;
  flex-shrink: 0;
}

.customer-navbar-profile-name {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text);
}

/* Dropdowns */
.customer-navbar-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 300px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  z-index: 100;
  overflow: hidden;
}

.profile-dropdown {
  min-width: 240px;
}

.customer-dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
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
  color: var(--danger-text);
}

.customer-dropdown-logout:hover {
  background: var(--danger-bg);
  color: var(--danger-text);
}

/* Mobile nav */
.customer-navbar-mobile {
  display: flex;
  flex-direction: column;
  padding: 0.5rem;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-elevated);
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
  border-radius: 0.5rem;
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
  background: rgba(245, 158, 11, 0.08);
  font-weight: 600;
}

/* Transitions */
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
