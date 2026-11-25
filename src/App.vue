<template>
  <!-- Loading screen while auth initializes -->
  <div
    v-if="!authStore.initialized"
    class="flex items-center justify-center min-h-screen bg-canvas"
    role="status"
    aria-live="polite"
  >
    <div class="flex flex-col items-center gap-5">
      <div class="flex items-center gap-2.5">
        <AppLogo class="w-10 h-10" title="EventGenius" />
        <span class="font-display font-bold text-xl text-ink tracking-tight">EventGenius</span>
      </div>
      <div class="w-40 h-1 rounded-full bg-surface-sunken overflow-hidden" aria-hidden="true">
        <div class="eg-loading-bar h-full w-1/3 rounded-full bg-brand-strong" />
      </div>
      <span class="sr-only">Loading</span>
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
      <div class="flex bg-canvas" :class="isMessagesRoute ? 'h-screen overflow-hidden' : 'min-h-screen'">
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
          class="fixed inset-0 z-30 bg-warm-900/50 lg:hidden"
          aria-hidden="true"
          @click="closeSidebar"
        />

        <!-- Main content -->
        <div
          class="flex-1 flex flex-col min-w-0 transition-[margin] duration-200 ease-out"
          :class="sidebarMarginClass"
        >
          <TopBar
            :sidebar-collapsed="sidebarCollapsed"
            @toggle-sidebar="toggleSidebar"
          />
          <main
            class="flex-1 min-h-0"
            :class="isMessagesRoute ? 'overflow-hidden' : 'px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8'"
          >
            <div v-if="!isMessagesRoute" class="mx-auto w-full max-w-[1440px]">
              <RouterView />
            </div>
            <RouterView v-else />
          </main>
        </div>
      </div>
    </template>

    <template v-else>
      <RouterView />
    </template>

    <Toaster position="top-right" rich-colors close-button :duration="3200" :theme="toastTheme" />
  </div>
</template>

<script setup lang="ts">
import AppLogo from '@/components/brand/AppLogo.vue'
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
const toastTheme = ref<'light' | 'dark'>('light')
// Follow the <html class="dark"> switch (set by the theme store) for toasts.
let themeObserver: MutationObserver | null = null

// Desktop: sidebar expanded by default, user's choice remembered.
// Mobile: sidebar is an overlay and starts closed.
const isDesktop = () => window.innerWidth >= 1024
function readCollapsedPref(): boolean {
  if (!isDesktop()) return true
  try { return localStorage.getItem('sidebarCollapsed') === '1' } catch { return false }
}
const customerCollapsed = ref(readCollapsedPref())
const storeCollapsed = ref(readCollapsedPref())
const adminCollapsed = ref(readCollapsedPref())
watch([customerCollapsed, storeCollapsed, adminCollapsed], () => {
  if (!isDesktop()) return
  try { localStorage.setItem('sidebarCollapsed', sidebarCollapsed.value ? '1' : '0') } catch { /* storage unavailable */ }
})

const sidebarCollapsed = computed(() => {
  if (layout.value === 'customer') return customerCollapsed.value
  if (layout.value === 'shop') return storeCollapsed.value
  if (layout.value === 'support') return adminCollapsed.value
  return false
})

const sidebarOpen = computed(() => !sidebarCollapsed.value)

const sidebarMarginClass = computed(() => {
  const c = sidebarCollapsed.value
  return c ? 'lg:ml-[4.5rem]' : 'lg:ml-64'
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

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown)
  const sync = () => { toastTheme.value = document.documentElement.classList.contains('dark') ? 'dark' : 'light' }
  sync()
  themeObserver = new MutationObserver(sync)
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
  themeObserver?.disconnect()
})
</script>

<style>
.eg-loading-bar { animation: eg-loading 1.1s ease-in-out infinite; }
@keyframes eg-loading {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(300%); }
}
</style>
