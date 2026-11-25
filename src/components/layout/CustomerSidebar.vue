<template>
  <PortalSidebar
    :collapsed="collapsed"
    :sections="sections"
    portal-label="Customer"
    home-to="/customer/dashboard"
    sign-in-to="/customer/sign-in"
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
    items: [
      { to: '/customer/dashboard', label: 'Dashboard', icon: 'layout-grid' },
      { to: '/venues', label: 'Browse venues', icon: 'map-pin' },
    ],
  },
  {
    title: 'My account',
    items: [
      { to: '/customer/bookings', label: 'My bookings', icon: 'calendar-event', badge: notifStore.bookingUnreadCount || undefined },
      { to: '/customer/messages', label: 'Messages', icon: 'message', badge: chatStore.totalUnreadCount || undefined },
      { to: '/customer/notifications', label: 'Notifications', icon: 'bell', badge: notifStore.unreadCount || undefined },
      { to: '/customer/profile', label: 'Profile', icon: 'user' },
    ],
  },
])
</script>
