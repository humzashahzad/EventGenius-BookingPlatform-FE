<template>
  <PortalSidebar
    :collapsed="collapsed"
    :sections="sections"
    portal-label="Admin"
    home-to="/support/dashboard"
    sign-in-to="/support/sign-in"
    @update:collapsed="v => emit('update:collapsed', v)"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useNotificationStore } from '@/stores/notifications'
import { useChatStore } from '@/stores/chat'
import PortalSidebar, { type NavSection } from '@/components/layout/PortalSidebar.vue'

defineProps<{ collapsed?: boolean }>()
const emit = defineEmits<{ 'update:collapsed': [value: boolean] }>()

const notifStore = useNotificationStore()
const chatStore = useChatStore()

const sections = computed<NavSection[]>(() => [
  {
    title: 'Overview',
    items: [{ to: '/support/dashboard', label: 'Dashboard', icon: 'layout-grid' }],
  },
  {
    title: 'Marketplace',
    items: [
      { to: '/support/stores', label: 'Stores', icon: 'building-store' },
      { to: '/support/venues', label: 'Venues', icon: 'map-pin' },
      { to: '/support/bookings', label: 'Bookings', icon: 'calendar-event', badge: notifStore.bookingUnreadCount || undefined },
      { to: '/support/reviews', label: 'Reviews', icon: 'star' },
      { to: '/support/categories', label: 'Categories', icon: 'tags' },
    ],
  },
  {
    title: 'People',
    items: [
      { to: '/support/users', label: 'Users', icon: 'users' },
      { to: '/support/messages', label: 'Messages', icon: 'message', badge: chatStore.totalUnreadCount || undefined },
      { to: '/support/notifications', label: 'Notifications', icon: 'bell', badge: notifStore.unreadCount || undefined },
    ],
  },
  {
    title: 'System',
    items: [
      { to: '/support/sessions', label: 'Sessions', icon: 'shield-lock' },
      { to: '/support/settings', label: 'Settings', icon: 'settings' },
    ],
  },
])
</script>
