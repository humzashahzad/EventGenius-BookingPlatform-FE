<template>
  <!-- Loading spinner while auth initializes -->
  <div
    v-if="!authStore.initialized"
    class="flex items-center justify-center min-h-screen bg-warm-50 dark:bg-warm-900"
  >
    <div class="flex flex-col items-center gap-4">
      <div
        class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-400 flex items-center justify-center shadow-lg shadow-primary-500/20"
      >
        <span class="text-white font-bold text-lg">EG</span>
      </div>
      <div
        class="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"
        role="status"
        aria-label="Loading"
      />
    </div>
  </div>

  <div v-else>
    <template v-if="layout === 'public'">
      <PublicNavbar />
      <main><RouterView /></main>
      <Footer />
    </template>

    <template v-else-if="layout === 'auth'">
      <RouterView />
    </template>

    <!-- Customer / Shop / Support: floating sidebar + main -->
    <template v-else-if="layout === 'customer' || layout === 'shop' || layout === 'support'">
      <div class="flex bg-warm-100 dark:bg-warm-900" :class="isMessagesRoute ? 'h-screen overflow-hidden' : 'min-h-screen'">
        <!-- Sidebar -->
        <CustomerSidebar
          v-if="layout === 'customer'"
          v-model:collapsed="customerCollapsed"
        />
        <StoreSidebar
          v-else-if="layout === 'shop'"
          v-model:collapsed="storeCollapsed"
        />
        <AdminSidebar
          v-else-if="layout === 'support'"
          v-model:collapsed="adminCollapsed"
        />

        <!-- Overlay on mobile when sidebar open -->
        <div
          v-if="sidebarOpen"
          class="fixed inset-0 z-30 bg-warm-900/50 backdrop-blur-sm lg:hidden"
          aria-hidden="true"
          @click="closeSidebar"
        />

        <!-- Main content -->
        <div
          class="flex-1 flex flex-col min-w-0 transition-[margin] duration-300 ease-out"
          :class="sidebarMarginClass"
        >
          <div class="px-3 pt-3 shrink-0">
            <TopBar
              :sidebar-collapsed="sidebarCollapsed"
              @toggle-sidebar="toggleSidebar"
            />
          </div>
          <div
            class="flex-1 min-h-0"
            :class="isMessagesRoute ? 'overflow-hidden' : 'p-4 sm:p-6 overflow-auto'"
          >
            <RouterView />
          </div>
        </div>
      </div>
    </template>

    <template v-else>
      <RouterView />
    </template>

    <Toaster position="top-right" rich-colors close-button :duration="3200" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { Toaster } from 'vue-sonner'
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '@/stores/chat'
import { useNotificationStore } from '@/stores/notifications'
import PublicNavbar from '@/components/layout/PublicNavbar.vue'
import CustomerSidebar from '@/components/layout/CustomerSidebar.vue'
import Footer from '@/components/layout/Footer.vue'
import TopBar from '@/components/layout/TopBar.vue'
import StoreSidebar from '@/components/layout/StoreSidebar.vue'
import AdminSidebar from '@/components/layout/AdminSidebar.vue'

const route = useRoute()
const authStore = useAuthStore()
const notifStore = useNotificationStore()
const chatStore = useChatStore()
const layout = computed(() => route.meta.layout as string | undefined)
const isMessagesRoute = computed(() => (route.name as string || '').includes('messages'))

const customerCollapsed = ref(true)
const storeCollapsed = ref(true)
const adminCollapsed = ref(true)

const sidebarCollapsed = computed(() => {
  if (layout.value === 'customer') return customerCollapsed.value
  if (layout.value === 'shop') return storeCollapsed.value
  if (layout.value === 'support') return adminCollapsed.value
  return false
})

const sidebarOpen = computed(() => !sidebarCollapsed.value)

const sidebarMarginClass = computed(() => {
  const c = sidebarCollapsed.value
  return c ? 'lg:ml-[5.5rem]' : 'lg:ml-[17.5rem]'
})

function closeSidebar() {
  if (layout.value === 'customer') customerCollapsed.value = true
  else if (layout.value === 'shop') storeCollapsed.value = true
  else if (layout.value === 'support') adminCollapsed.value = true
}

function toggleSidebar() {
  if (layout.value === 'customer') customerCollapsed.value = !customerCollapsed.value
  else if (layout.value === 'shop') storeCollapsed.value = !storeCollapsed.value
  else if (layout.value === 'support') adminCollapsed.value = !adminCollapsed.value
}

function shouldIgnoreShortcutTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el) return false
  const tag = el.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  return el.isContentEditable === true
}

function handleGlobalKeydown(e: KeyboardEvent) {
  const isCtrlB = e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey && e.key.toLowerCase() === 'b'
  if (!isCtrlB) return
  if (shouldIgnoreShortcutTarget(e.target)) return
  if (layout.value !== 'customer' && layout.value !== 'shop' && layout.value !== 'support') return
  e.preventDefault()
  toggleSidebar()
}

watch(
  () => authStore.user,
  async (user) => {
    if (user && authStore.token) {
      notifStore.requestBrowserPermission()
      chatStore.connect()
      await Promise.all([
        notifStore.fetchUnread(),
        chatStore.fetchChats({ silent: true }),
      ])
      notifStore.connectRealtime()
    } else {
      notifStore.disconnectRealtime()
      chatStore.disconnect()
    }
  },
  { immediate: true }
)

onMounted(() => window.addEventListener('keydown', handleGlobalKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', handleGlobalKeydown))
</script>
