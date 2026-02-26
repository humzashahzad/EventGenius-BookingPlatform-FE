<template>
  <!-- Block render until auth is initialized to prevent dashboard flicker -->
  <div v-if="!authStore.initialized" class="min-h-screen flex items-center justify-center bg-surface-50">
    <div class="flex flex-col items-center gap-4">
      <div class="w-12 h-12 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-glow animate-pulse">
        <span class="text-white font-bold text-lg">EG</span>
      </div>
      <svg class="w-5 h-5 animate-spin text-primary-400" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
    </div>
  </div>

  <div v-else>
    <!-- Public Layout -->
    <template v-if="layout === 'public'">
      <PublicNavbar />
      <main><RouterView /></main>
    </template>

    <!-- Auth Layout -->
    <template v-else-if="layout === 'auth'">
      <RouterView />
    </template>

    <!-- Client Layout (collapsible sidebar + top bar) -->
    <template v-else-if="layout === 'client'">
      <div class="app-shell client-panel" :class="{ 'client-sidebar-is-collapsed': clientCollapsed }">
        <ClientSidebar v-model:collapsed="clientCollapsed" />
        <div class="app-body client-panel-body">
          <ClientTopBar :sidebar-collapsed="clientCollapsed" @toggle-sidebar="clientCollapsed = !clientCollapsed" />
          <main class="main-content client-main" :class="{ 'main-content--fullscreen': isMessagesRoute }">
            <RouterView />
          </main>
        </div>
      </div>
    </template>

    <!-- Store Layout -->
    <template v-else-if="layout === 'store'">
      <div class="app-shell" :class="{ 'sidebar-is-collapsed': storeCollapsed }">
        <StoreSidebar v-model:collapsed="storeCollapsed" />
        <div class="app-body">
          <TopBar :sidebar-collapsed="storeCollapsed" @toggle-sidebar="storeCollapsed = !storeCollapsed" />
          <main class="main-content" :class="{ 'main-content--fullscreen': isMessagesRoute }">
            <RouterView />
          </main>
        </div>
      </div>
    </template>

    <!-- Admin Layout -->
    <template v-else-if="layout === 'admin'">
      <div class="app-shell" :class="{ 'sidebar-is-collapsed': adminCollapsed }">
        <AdminSidebar v-model:collapsed="adminCollapsed" />
        <div class="app-body">
          <TopBar :sidebar-collapsed="adminCollapsed" @toggle-sidebar="adminCollapsed = !adminCollapsed" />
          <main class="main-content" :class="{ 'main-content--fullscreen': isMessagesRoute }">
            <RouterView />
          </main>
        </div>
      </div>
    </template>

    <!-- Fallback -->
    <template v-else>
      <RouterView />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '@/stores/chat'
import { useNotificationStore } from '@/stores/notifications'
import PublicNavbar from '@/components/layout/PublicNavbar.vue'
import TopBar from '@/components/layout/TopBar.vue'
import ClientTopBar from '@/components/layout/ClientTopBar.vue'
import ClientSidebar from '@/components/layout/ClientSidebar.vue'
import StoreSidebar from '@/components/layout/StoreSidebar.vue'
import AdminSidebar from '@/components/layout/AdminSidebar.vue'

const route     = useRoute()
const authStore = useAuthStore()
const notifStore = useNotificationStore()
const chatStore = useChatStore()
const layout    = computed(() => route.meta.layout as string | undefined)

const clientCollapsed = ref(false)
const storeCollapsed  = ref(false)
const adminCollapsed  = ref(false)

const isMessagesRoute = computed(() => {
  const name = route.name as string
  return name === 'client-messages' || name === 'store-messages' || name === 'admin-messages'
})

// After sign-in: load notifications from API, then real-time via SSE + socket; request browser permission
watch(() => authStore.user, (user) => {
  if (user && authStore.token) {
    notifStore.requestBrowserPermission()
    notifStore.fetchUnread()
    notifStore.startSSE()
    chatStore.connectSocket(user.id, authStore.token)
  } else {
    notifStore.stopSSE()
    chatStore.disconnectSocket()
  }
}, { immediate: true })
</script>
