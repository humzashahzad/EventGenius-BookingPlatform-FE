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
          <p class="text-2xs mt-0.5 uppercase tracking-wider opacity-80">Support Panel</p>
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

      <p v-if="!collapsed" class="sidebar-section-label mt-3">Security</p>

      <RouterLink
        v-for="item in securityNav"
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
      </RouterLink>
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
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'

const props = defineProps<{ collapsed?: boolean }>()
const emit  = defineEmits<{ 'update:collapsed': [value: boolean] }>()

const authStore  = useAuthStore()
const notifStore = useNotificationStore()
const route      = useRoute()
const router     = useRouter()

const mainNav = computed(() => [
  {
    to: '/support/dashboard', label: 'Dashboard',
    icon: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>`,
    badge: undefined,
  },
  {
    to: '/support/users', label: 'Users',
    icon: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>`,
    badge: undefined,
  },
  {
    to: '/support/stores', label: 'Stores',
    icon: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>`,
    badge: undefined,
  },
  {
    to: '/support/venues', label: 'Venues',
    icon: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`,
    badge: undefined,
  },
  {
    to: '/support/bookings', label: 'Bookings',
    icon: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>`,
    badge: notifStore.unreadCount > 0 ? notifStore.unreadCount : undefined,
  },
  {
    to: '/support/categories', label: 'Categories',
    icon: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>`,
    badge: undefined,
  },
  {
    to: '/support/locations', label: 'Locations',
    icon: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
    badge: undefined,
  },
  {
    to: '/support/messages', label: 'Messages',
    icon: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>`,
    badge: undefined,
  },
  {
    to: '/support/settings', label: 'Settings',
    icon: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`,
    badge: undefined,
  },
])

const securityNav = [
  {
    to: '/support/sessions', label: 'Sessions',
    icon: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>`,
  },
]

function isActive(path: string) { return route.path.startsWith(path) }

async function logout() {
  await authStore.logout()
  router.push('/support/sign-in')
}
</script>

<style scoped>
.label-enter-active, .label-leave-active { transition: opacity 0.15s ease, width 0.2s ease; overflow: hidden; white-space: nowrap; }
.label-enter-from, .label-leave-to { opacity: 0; }
</style>
