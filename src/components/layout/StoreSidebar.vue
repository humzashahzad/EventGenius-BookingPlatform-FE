<template>
  <aside
    class="fixed top-3 left-3 bottom-3 z-40 flex flex-col bg-white dark:bg-warm-800 border border-warm-200 dark:border-warm-700 rounded-2xl shadow-float transition-all duration-300 ease-out lg:translate-x-0 overflow-hidden"
    :class="[
      collapsed ? 'w-[4.5rem]' : 'w-64',
      sidebarOpen ? 'translate-x-0' : '-translate-x-[calc(100%+1rem)]'
    ]"
  >
    <div class="flex items-center h-14 px-3 border-b border-warm-200 dark:border-warm-700 shrink-0">
      <RouterLink to="/shop/dashboard" class="flex items-center gap-2 min-w-0 flex-1">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-400 flex items-center justify-center shadow-md shadow-primary-500/20 shrink-0">
          <span class="text-white font-extrabold text-xs">EG</span>
        </div>
        <span v-show="!collapsed" class="font-bold text-warm-800 dark:text-white truncate">EventGenius</span>
      </RouterLink>
    </div>

    <nav class="flex-1 overflow-y-auto scrollbar-thin py-3">
      <p v-show="!collapsed" class="px-3 text-xs font-semibold uppercase tracking-wider text-warm-400 dark:text-warm-500 mb-1">Main</p>
      <RouterLink
        v-for="item in mainNav"
        :key="item.to"
        :to="item.to"
        class="flex items-center gap-3 px-3 py-2.5 mx-2 rounded-xl text-warm-600 dark:text-warm-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors duration-150"
        :class="{ 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-medium': isActive(item.to) }"
      >
        <span class="relative shrink-0">
          <AppIcon :icon="item.icon" class="w-5 h-5" />
          <span v-if="item.badge && collapsed" class="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-bold rounded-full bg-red-500 text-white">{{ item.badge }}</span>
        </span>
        <span v-show="!collapsed" class="flex-1 truncate">{{ item.label }}</span>
        <span v-if="item.badge && !collapsed" class="px-2 py-0.5 text-xs font-medium rounded-full bg-red-500 text-white">{{ item.badge }}</span>
      </RouterLink>
      <RouterLink
        to="/shop/venues/create"
        class="flex items-center gap-3 px-3 py-2.5 mx-2 mt-2 rounded-xl text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors duration-150"
      >
        <AppIcon icon="plus" class="w-5 h-5 shrink-0" />
        <span v-show="!collapsed">Add Venue</span>
      </RouterLink>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'
import { useChatStore } from '@/stores/chat'
import AppIcon from '@/components/ui/AppIcon.vue'

const props = defineProps<{ collapsed?: boolean }>()
const emit = defineEmits<{ 'update:collapsed': [value: boolean] }>()

const notifStore = useNotificationStore()
const chatStore = useChatStore()
const route = useRoute()

const sidebarOpen = computed(() => !props.collapsed)

const mainNav = computed(() => [
  { to: '/shop/dashboard', label: 'Dashboard', icon: 'layout-grid', badge: undefined },
  { to: '/shop/venues', label: 'My Venues', icon: 'map-pin', badge: undefined },
  { to: '/shop/bookings', label: 'Bookings', icon: 'calendar-event', badge: notifStore.bookingUnreadCount > 0 ? notifStore.bookingUnreadCount : undefined },
  { to: '/shop/messages', label: 'Messages', icon: 'message', badge: chatStore.totalUnreadCount > 0 ? chatStore.totalUnreadCount : undefined },
  { to: '/shop/notifications', label: 'Notifications', icon: 'bell', badge: notifStore.unreadCount > 0 ? notifStore.unreadCount : undefined },
  { to: '/shop/landing', label: 'Landing Page', icon: 'layout-kanban', badge: undefined },
  { to: '/shop/profile', label: 'My Profile', icon: 'user', badge: undefined },
])

function isActive(path: string) {
  return route.path.startsWith(path)
}
</script>
