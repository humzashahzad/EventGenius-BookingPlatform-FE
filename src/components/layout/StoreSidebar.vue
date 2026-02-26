<template>
  <aside class="sidebar" :class="{ 'sidebar-collapsed': collapsed }">
    <!-- Logo -->
    <div class="sidebar-logo">
      <div class="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center shadow-glow-sm flex-shrink-0">
        <span class="text-white font-bold text-sm">EG</span>
      </div>
      <Transition name="label">
        <div v-if="!collapsed" class="sidebar-logo-text">
          <span class="text-base font-bold leading-none">EventGenius</span>
          <p class="text-2xs mt-0.5 uppercase tracking-wider opacity-80">Store Panel</p>
        </div>
      </Transition>
    </div>

    <!-- Navigation -->
    <nav class="sidebar-nav">
      <p v-if="!collapsed" class="sidebar-section-label">Main</p>

      <RouterLink
        v-for="item in mainNav"
        :key="item.to"
        :to="item.to"
        class="sidebar-link"
        :class="{ active: isActive(item.to) }"
        :title="collapsed ? item.label : undefined"
      >
        <span class="sidebar-link-icon" v-html="item.icon"></span>
        <Transition name="label">
          <span v-if="!collapsed" class="sidebar-link-label">{{ item.label }}</span>
        </Transition>
        <Transition name="label">
          <span v-if="!collapsed && item.badge" class="sidebar-badge">{{ item.badge }}</span>
        </Transition>
        <span v-if="collapsed && item.badge" class="sidebar-badge-dot"></span>
      </RouterLink>

      <!-- CTA when expanded -->
      <Transition name="label">
        <div v-if="!collapsed" class="mt-4 px-2">
          <RouterLink to="/store/venues/create" class="sidebar-cta-btn">
            <svg class="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Add Venue
          </RouterLink>
        </div>
      </Transition>
    </nav>

    <!-- Footer -->
    <div class="sidebar-footer">
      <button @click="logout" class="sidebar-logout" :title="collapsed ? 'Sign Out' : undefined">
        <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
        </svg>
        <Transition name="label">
          <span v-if="!collapsed">Sign Out</span>
        </Transition>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'

const props = defineProps<{ collapsed?: boolean }>()
const emit  = defineEmits<{ 'update:collapsed': [value: boolean] }>()

const authStore  = useAuthStore()
const notifStore = useNotificationStore()
const route      = useRoute()
const router     = useRouter()

const mainNav = [
  {
    to: '/store/dashboard', label: 'Dashboard',
    icon: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>`,
    badge: undefined as number | undefined,
  },
  {
    to: '/store/venues', label: 'My Venues',
    icon: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`,
    badge: undefined as number | undefined,
  },
  {
    to: '/store/bookings', label: 'Bookings',
    icon: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>`,
    get badge() { return notifStore.unreadCount > 0 ? notifStore.unreadCount : undefined },
  },
  {
    to: '/store/messages', label: 'Messages',
    icon: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>`,
    badge: undefined as number | undefined,
  },
  {
    to: '/store/profile', label: 'My Profile',
    icon: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>`,
    badge: undefined as number | undefined,
  },
]

function isActive(path: string) { return route.path.startsWith(path) }

async function logout() {
  await authStore.logout()
  router.push('/store/sign-in')
}
</script>

<style scoped>
.label-enter-active, .label-leave-active { transition: opacity 0.15s ease, width 0.2s ease; overflow: hidden; white-space: nowrap; }
.label-enter-from, .label-leave-to { opacity: 0; }
</style>
