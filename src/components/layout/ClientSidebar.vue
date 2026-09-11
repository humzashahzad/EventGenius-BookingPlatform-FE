<template>
  <aside class="client-sidebar" :class="{ 'client-sidebar-collapsed': collapsed }">
    <!-- Logo -->
    <div class="client-sidebar-logo">
      <RouterLink to="/client/dashboard" class="flex items-center gap-3 no-underline">
        <div class="client-sidebar-logo-icon">EG</div>
        <div v-if="!collapsed" class="client-sidebar-logo-text">
          <span class="text-sm font-bold text-surface-900">EventGenius</span>
          <p class="text-[0.625rem] text-surface-500 leading-tight">Client Portal</p>
        </div>
      </RouterLink>
      <button @click="toggle" class="client-sidebar-toggle" :title="collapsed ? 'Expand' : 'Collapse'">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="collapsed ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'" />
        </svg>
      </button>
    </div>

    <!-- Navigation -->
    <nav class="client-sidebar-nav">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="client-sidebar-link"
        :class="{ active: isActive(item.to) }"
        :title="collapsed ? item.label : undefined"
      >
        <span class="client-sidebar-link-icon" v-html="item.icon"></span>
        <span v-if="!collapsed" class="client-sidebar-link-label">{{ item.label }}</span>
        <span v-if="item.badge && item.badge > 0 && !collapsed" class="client-sidebar-badge">{{ item.badge }}</span>
        <span v-if="item.badge && item.badge > 0 && collapsed" class="client-sidebar-badge-dot"></span>
      </RouterLink>
    </nav>

    <!-- Bottom: Logout -->
    <div class="client-sidebar-footer">
      <button @click="logout" class="client-sidebar-link client-sidebar-logout" :title="collapsed ? 'Sign Out' : undefined">
        <span class="client-sidebar-link-icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
        </span>
        <span v-if="!collapsed" class="client-sidebar-link-label">Sign Out</span>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'

const props = defineProps<{ collapsed: boolean }>()
const emit = defineEmits<{ 'update:collapsed': [value: boolean] }>()

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const notifStore = useNotificationStore()

function toggle() {
  emit('update:collapsed', !props.collapsed)
}

const navItems = computed(() => [
  { to: '/client/dashboard', label: 'Dashboard', badge: 0, icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>' },
  { to: '/venues', label: 'Browse Venues', badge: 0, icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>' },
  { to: '/client/bookings', label: 'My Bookings', badge: 0, icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>' },
  { to: '/client/messages', label: 'Messages', badge: notifStore.unreadCount, icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>' },
  { to: '/client/profile', label: 'My Profile', badge: 0, icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>' },
])

function isActive(path: string) {
  if (path === '/client/dashboard') return route.path === '/client/dashboard'
  if (path === '/venues') return route.path === '/venues'
  return route.path.startsWith(path)
}

async function logout() {
  await authStore.logout()
  router.push('/client/sign-in')
}
</script>

<style scoped>
.client-sidebar {
  width: 220px;
  min-width: 220px;
  background: #faf5ff;
  border-right: 1px solid #ede9fe;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  transition: width 0.3s ease, min-width 0.3s ease;
  overflow: hidden;
}

.client-sidebar-collapsed {
  width: 72px;
  min-width: 72px;
}

.client-sidebar-logo {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 0.875rem;
  border-bottom: 1px solid #ede9fe;
  min-height: 64px;
  flex-shrink: 0;
}

.client-sidebar-logo-icon {
  width: 36px;
  height: 36px;
  min-width: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #7c3aed, #8b5cf6);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8125rem;
  font-weight: 700;
}

.client-sidebar-collapsed .client-sidebar-logo {
  justify-content: center;
  padding: 1rem 0.5rem;
}

.client-sidebar-collapsed .client-sidebar-logo a {
  justify-content: center;
}

.client-sidebar-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: none;
  background: #ede9fe;
  color: #7c3aed;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s;
}

.client-sidebar-toggle:hover {
  background: #ddd6fe;
}

.client-sidebar-collapsed .client-sidebar-toggle {
  display: none;
}

.client-sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.client-sidebar-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.75rem;
  border-radius: 0.625rem;
  color: #6b7280;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.15s ease;
  position: relative;
  white-space: nowrap;
  overflow: hidden;
}

.client-sidebar-link:hover {
  background: #ede9fe;
  color: #6d28d9;
}

.client-sidebar-link.active {
  background: #ede9fe;
  color: #6d28d9;
  font-weight: 600;
  border-left: 3px solid #7c3aed;
  padding-left: calc(0.75rem - 3px);
}

.client-sidebar-link-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.client-sidebar-link-icon :deep(svg) {
  width: 20px;
  height: 20px;
}

.client-sidebar-link-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.client-sidebar-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: #7c3aed;
  color: white;
  font-size: 0.625rem;
  font-weight: 700;
  border-radius: 9px;
  flex-shrink: 0;
}

.client-sidebar-badge-dot {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 7px;
  height: 7px;
  background: #7c3aed;
  border-radius: 50%;
}

.client-sidebar-footer {
  padding: 0.5rem;
  border-top: 1px solid #ede9fe;
  flex-shrink: 0;
}

.client-sidebar-logout {
  border: none;
  background: transparent;
  cursor: pointer;
  width: 100%;
  font-size: 0.875rem;
}

.client-sidebar-logout:hover {
  background: #fef2f2;
  color: #dc2626;
}

/* Collapsed state */
.client-sidebar-collapsed .client-sidebar-nav {
  align-items: center;
}

.client-sidebar-collapsed .client-sidebar-link {
  justify-content: center;
  padding: 0.625rem;
  border-left: none;
}

.client-sidebar-collapsed .client-sidebar-link.active {
  border-left: none;
  padding-left: 0.625rem;
}

.client-sidebar-collapsed .client-sidebar-footer {
  display: flex;
  justify-content: center;
}

.client-sidebar-collapsed .client-sidebar-logout {
  justify-content: center;
  padding: 0.625rem;
}

/* Dark mode */
:global(html.dark) .client-sidebar {
  background: #1a1625;
  border-right-color: rgba(139, 92, 246, 0.15);
}

:global(html.dark) .client-sidebar-logo {
  border-bottom-color: rgba(139, 92, 246, 0.15);
}

:global(html.dark) .client-sidebar-toggle {
  background: rgba(139, 92, 246, 0.15);
  color: #a78bfa;
}

:global(html.dark) .client-sidebar-link {
  color: #9ca3af;
}

:global(html.dark) .client-sidebar-link:hover {
  background: rgba(139, 92, 246, 0.1);
  color: #c4b5fd;
}

:global(html.dark) .client-sidebar-link.active {
  background: rgba(139, 92, 246, 0.15);
  color: #c4b5fd;
  border-left-color: #8b5cf6;
}

:global(html.dark) .client-sidebar-footer {
  border-top-color: rgba(139, 92, 246, 0.15);
}

@media (max-width: 768px) {
  .client-sidebar {
    width: 72px;
    min-width: 72px;
  }
  .client-sidebar-link-label,
  .client-sidebar-logo-text,
  .client-sidebar-toggle,
  .client-sidebar-badge {
    display: none;
  }
  .client-sidebar-link {
    justify-content: center;
    padding: 0.625rem;
  }
}
</style>
