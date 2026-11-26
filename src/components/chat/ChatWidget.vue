<template>
  <div v-show="widget.available" class="cw-root">
    <!-- Launcher -->
    <button
      v-show="!(isPhone && widget.open)"
      ref="launcherRef"
      type="button"
      class="cw-launcher"
      :style="launcherStyle"
      :aria-label="launcherLabel"
      :aria-expanded="widget.open"
      :aria-controls="panelId"
      @click="widget.toggle()"
    >
      <AppIcon :icon="widget.open ? 'chevron-down' : 'message-circle'" class="w-6 h-6" />
      <span v-if="unread > 0 && !widget.open" class="count-badge cw-launcher-badge" aria-hidden="true">
        {{ unread > 99 ? '99+' : unread }}
      </span>
    </button>

    <!-- Panel -->
    <section
      v-if="widget.open"
      :id="panelId"
      ref="panelRef"
      class="cw-panel"
      :class="{ 'cw-panel-phone': isPhone }"
      :style="isPhone ? sheetStyle : panelStyle"
      role="dialog"
      :aria-modal="isPhone ? 'true' : undefined"
      aria-label="Messages"
      tabindex="-1"
      @keydown.esc="onEscape"
    >
      <ChatWidgetConversation
        v-if="widget.view === 'chat' && widget.chatId"
        :key="widget.chatId"
        :chat-id="widget.chatId"
        :messages-href="messagesPath"
        @back="widget.backToList()"
        @close="closeAndReturnFocus"
      />
      <ChatWidgetList
        v-else
        :messages-href="messagesPath"
        :ready="listReady"
        @open="(id: number) => widget.openChat(id)"
        @close="closeAndReturnFocus"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
/**
 * Floating chat (bottom-right) for every signed-in user, on every page except the
 * messages page itself. Mounted once in App.vue so it never remounts on route changes.
 * Panel state, the open conversation, a cache of the list/messages and drafts are kept
 * in localStorage (see stores/chatWidget.ts and composables/useChatDrafts.ts).
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'
import ChatWidgetList from '@/components/chat/ChatWidgetList.vue'
import ChatWidgetConversation from '@/components/chat/ChatWidgetConversation.vue'
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '@/stores/chat'
import { useChatWidgetStore } from '@/stores/chatWidget'
import { useChatDrafts } from '@/composables/useChatDrafts'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const chatStore = useChatStore()
const widget = useChatWidgetStore()
useChatDrafts()

const panelId = 'eg-chat-widget-panel'
const launcherRef = ref<HTMLButtonElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)

// ── Where the widget is allowed ──────────────────────────────────────
function isMessagesName(name: unknown) {
  return typeof name === 'string' && name.includes('messages')
}
const allowed = computed(() =>
  auth.isLoggedIn
  && route.meta.layout !== 'auth'
  && !isMessagesName(route.name)
  && route.matched.length > 0,
)
watch(allowed, (v) => { widget.available = v }, { immediate: true })

const messagesPath = computed(() => {
  const role = auth.user?.role
  const prefix = role === 'admin' ? '/support' : role === 'store_owner' ? '/shop' : '/customer'
  return `${prefix}/messages`
})

const unread = computed(() => chatStore.totalUnread)
const launcherLabel = computed(() => {
  const base = widget.open ? 'Close messages' : 'Open messages'
  if (!unread.value) return base
  return `${base}, ${unread.value} unread`
})

// ── Phone layout ─────────────────────────────────────────────────────
// Phones (and phones in landscape, where a floating panel would be too short) get a full-screen sheet.
const phoneQuery = typeof window !== 'undefined' ? window.matchMedia('(max-width: 639.98px), (max-height: 499.98px) and (pointer: coarse), (max-height: 419.98px)') : null
const isPhone = ref(phoneQuery?.matches ?? false)
const onPhoneChange = (e: MediaQueryListEvent) => { isPhone.value = e.matches }

// Keep the sheet (and so the composer) inside the visible area when the on-screen keyboard opens.
const viewport = ref<{ top: number; height: number } | null>(null)
let viewportRaf = 0
function readViewport() {
  viewportRaf = 0
  const vv = window.visualViewport
  if (!vv) { viewport.value = null; return }
  // Only override while something (the keyboard) actually shrinks the visible area.
  const shrunk = window.innerHeight - vv.height > 1 || vv.offsetTop > 1
  viewport.value = shrunk ? { top: Math.max(0, Math.round(vv.offsetTop)), height: Math.round(vv.height) } : null
}
function onViewportChange() {
  if (!viewportRaf) viewportRaf = requestAnimationFrame(readViewport)
}
function startViewportTracking() {
  const vv = typeof window !== 'undefined' ? window.visualViewport : null
  if (!vv) return
  vv.addEventListener('resize', onViewportChange)
  vv.addEventListener('scroll', onViewportChange)
  readViewport()
}
function stopViewportTracking() {
  const vv = typeof window !== 'undefined' ? window.visualViewport : null
  vv?.removeEventListener('resize', onViewportChange)
  vv?.removeEventListener('scroll', onViewportChange)
  if (viewportRaf) cancelAnimationFrame(viewportRaf)
  viewportRaf = 0
  viewport.value = null
}
const sheetStyle = computed(() => (viewport.value
  ? { top: `${viewport.value.top}px`, height: `${viewport.value.height}px`, bottom: 'auto' }
  : undefined))

watch(() => isPhone.value && widget.open && widget.available, (lock) => {
  document.documentElement.classList.toggle('cw-scroll-lock', lock)
  if (lock) startViewportTracking()
  else stopViewportTracking()
}, { immediate: true })

// ── Keep clear of fixed bottom bars (e.g. the booking page's action bar on phones) ──
const bottomObstacle = ref(0)
let obstacleObserver: ResizeObserver | null = null
let observedBar: Element | null = null

function measureObstacle() {
  let h = 0
  let found: Element | null = null
  document.querySelectorAll('.mbar, [data-fixed-bottom-bar]').forEach((el) => {
    const rect = el.getBoundingClientRect()
    if (!rect.height || getComputedStyle(el).position !== 'fixed') return
    if (rect.bottom < window.innerHeight - 4) return
    const covered = window.innerHeight - rect.top
    if (covered > h) { h = covered; found = el }
  })
  bottomObstacle.value = Math.max(0, Math.round(h))
  if (found !== observedBar) {
    obstacleObserver?.disconnect()
    observedBar = found
    if (found && typeof ResizeObserver !== 'undefined') {
      obstacleObserver = new ResizeObserver(() => measureObstacle())
      obstacleObserver.observe(found)
    }
  }
}
let measureTimers: ReturnType<typeof setTimeout>[] = []
function scheduleMeasure() {
  measureTimers.forEach(clearTimeout)
  measureTimers = [0, 350, 1200].map(ms => setTimeout(measureObstacle, ms))
}
watch(() => route.fullPath, scheduleMeasure)

const launcherStyle = computed(() => ({
  bottom: `calc(var(--cw-gap) + env(safe-area-inset-bottom, 0px) + ${bottomObstacle.value}px)`,
}))
// The panel sits just above the launcher, so the launcher never covers the composer.
const panelStyle = computed(() => ({ '--cw-obstacle': `${bottomObstacle.value}px` }))

// ── Conversation list readiness (cached list counts as ready) ────────
// Show the cached list right away; the API refresh from App.vue replaces it.
const hadChats = chatStore.chats.length > 0
chatStore.hydrateChats(widget.cachedChats())
const fetchedOnce = ref(hadChats)
watch(() => chatStore.chats, () => { fetchedOnce.value = true })
const listReady = computed(() => chatStore.chats.length > 0 || fetchedOnce.value)

// ── Open conversation ↔ chat store ───────────────────────────────────
const wantsChat = computed(() =>
  widget.available && widget.open && widget.view === 'chat' ? widget.chatId : null,
)
let refreshedThisLoad = new Set<number>()

watch(wantsChat, async (id) => {
  if (!id) return
  if (chatStore.currentChatId !== id) {
    await chatStore.selectChat(id, { cached: widget.cachedMessagesFor(id) })
  } else if (!refreshedThisLoad.has(id)) {
    void chatStore.mergeLatestMessages(id)
  }
  refreshedThisLoad.add(id)
}, { immediate: true })

// A saved conversation that no longer exists (or belongs to nobody here): back to the list.
watch(() => [chatStore.chats, fetchedOnce.value] as const, () => {
  const id = widget.chatId
  if (!id || !fetchedOnce.value || !chatStore.chats.length) return
  if (!chatStore.chats.some(c => c.id === id) && widget.view === 'chat') widget.backToList()
})

const viewing = computed(() => !!wantsChat.value && chatStore.currentChatId === wantsChat.value)
watch(viewing, (v) => chatStore.setWidgetViewing(v), { immediate: true })

// Cache the list and the open chat's newest messages for an instant panel after reload.
watch(() => chatStore.chats, () => widget.scheduleCacheWrite(), { deep: true })
watch(() => [chatStore.messages.length, chatStore.messages[chatStore.messages.length - 1]?.id, chatStore.currentChatId], () => {
  if (chatStore.currentChatId && chatStore.currentChatId === widget.chatId) widget.scheduleCacheWrite()
})

// ── Focus handling ───────────────────────────────────────────────────
watch(() => widget.focusRequest, async () => {
  if (!widget.open) return
  await nextTick()
  const target = panelRef.value?.querySelector<HTMLElement>('[data-autofocus]')
  ;(target || panelRef.value)?.focus()
})

watch(() => widget.open, (open, was) => {
  if (!open && was) {
    // Closed from outside the panel controls (e.g. store action): keep focus sensible.
    const active = document.activeElement
    if (!active || active === document.body || panelRef.value?.contains(active)) launcherRef.value?.focus()
  }
})

function closeAndReturnFocus() {
  widget.close()
  nextTick(() => launcherRef.value?.focus())
}

function onEscape(e: KeyboardEvent) {
  if (e.defaultPrevented) return
  e.preventDefault()
  closeAndReturnFocus()
}

// ── "Message …" links (/…/messages?with= or ?chat=) open here instead ─
let removeGuard: (() => void) | null = null

onMounted(() => {
  phoneQuery?.addEventListener('change', onPhoneChange)
  window.addEventListener('resize', scheduleMeasure)
  scheduleMeasure()

  removeGuard = router.beforeEach((to, from) => {
    if (!widget.available || !isMessagesName(to.name) || isMessagesName(from.name)) return
    if (!from.matched.length || to.query.full) return
    const chatId = Number(to.query.chat)
    const withId = Number(to.query.with)
    if (chatId) {
      widget.openChat(chatId)
      return false
    }
    if (withId) {
      void widget.openWithUser(withId).then((ok) => {
        if (!ok) router.push({ path: to.path, query: { ...to.query, full: '1' } })
      })
      return false
    }
  })
})

onBeforeUnmount(() => {
  removeGuard?.()
  phoneQuery?.removeEventListener('change', onPhoneChange)
  window.removeEventListener('resize', scheduleMeasure)
  stopViewportTracking()
  measureTimers.forEach(clearTimeout)
  obstacleObserver?.disconnect()
  chatStore.setWidgetViewing(false)
  widget.available = false
  document.documentElement.classList.remove('cw-scroll-lock')
  refreshedThisLoad = new Set()
})
</script>

<style scoped>
.cw-root { --cw-gap: 1rem; }
@media (min-width: 1024px) { .cw-root { --cw-gap: 1.5rem; } }

.cw-launcher {
  position: fixed;
  right: calc(var(--cw-gap) + env(safe-area-inset-right, 0px));
  z-index: 45;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 9999px;
  background: var(--brand-strong);
  color: var(--on-brand);
  box-shadow: var(--shadow-lg);
  transition: background-color .15s ease, bottom .2s ease;
}
.cw-launcher:hover { background: var(--brand-hover); }
.cw-launcher:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 3px; }
.cw-launcher-badge {
  position: absolute;
  top: -0.125rem;
  right: -0.125rem;
  box-shadow: 0 0 0 2px var(--surface);
}

.cw-panel {
  --cw-obstacle: 0px;
  /* Space taken below the panel: gap + safe area + any fixed bottom bar + launcher (3.5rem) + 0.75rem. */
  --cw-below: calc(var(--cw-gap) + env(safe-area-inset-bottom, 0px) + var(--cw-obstacle) + 4.25rem);
  position: fixed;
  right: calc(var(--cw-gap) + env(safe-area-inset-right, 0px));
  bottom: var(--cw-below);
  z-index: 45;
  display: flex;
  flex-direction: column;
  width: min(380px, calc(100vw - 2 * var(--cw-gap) - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px)));
  height: 560px;
  min-height: min(320px, calc(100vh - var(--cw-below) - 0.75rem));
  max-height: calc(100vh - var(--cw-below) - 0.75rem);
  max-height: calc(100dvh - var(--cw-below) - 0.75rem);
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--surface);
  color: var(--ink);
  box-shadow: var(--shadow-xl);
  animation: cw-in .16s ease-out;
}
/* Larger screens: a little more room for the conversation. */
@media (min-width: 1280px) and (min-height: 820px) {
  .cw-panel { width: 400px; height: 620px; }
}
.cw-panel:focus { outline: none; }
.cw-panel-phone {
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  height: 100dvh;
  min-height: 0;
  max-height: none;
  border: 0;
  border-radius: 0;
  box-shadow: none;
  padding: env(safe-area-inset-top, 0px) env(safe-area-inset-right, 0px) env(safe-area-inset-bottom, 0px) env(safe-area-inset-left, 0px);
  overscroll-behavior: contain;
}
@keyframes cw-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: none; }
}
@media (prefers-reduced-motion: reduce) {
  .cw-panel { animation: none; }
  .cw-launcher { transition: none; }
}
</style>

<style>
html.cw-scroll-lock, html.cw-scroll-lock body { overflow: hidden; }
</style>
