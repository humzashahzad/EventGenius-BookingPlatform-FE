<template>
  <PortalSidebar
    :collapsed="collapsed"
    :sections="sections"
    portal-label="Shop"
    home-to="/shop/dashboard"
    sign-in-to="/shop/sign-in"
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
    title: 'Business',
    items: [
      { to: '/shop/dashboard', label: 'Dashboard', icon: 'layout-grid' },
      { to: '/shop/bookings', label: 'Bookings', icon: 'calendar-event', badge: notifStore.bookingUnreadCount || undefined },
      { to: '/shop/venues', label: 'My venues', icon: 'map-pin' },
      { to: '/shop/venues/create', label: 'Add venue', icon: 'plus', accent: true, exact: true },
      { to: '/shop/reviews', label: 'Reviews', icon: 'star' },
    ],
  },
  {
    title: 'Communication',
    items: [
      { to: '/shop/messages', label: 'Messages', icon: 'message', badge: chatStore.totalUnreadCount || undefined },
      { to: '/shop/notifications', label: 'Notifications', icon: 'bell', badge: notifStore.unreadCount || undefined },
    ],
  },
  {
    title: 'Store',
    items: [
      { to: '/shop/landing', label: 'Public page', icon: 'globe' },
      { to: '/shop/profile', label: 'Store profile', icon: 'building-store' },
    ],
  },
])
</script>
