/**
 * State of the floating chat widget (bottom-right on every page after sign-in).
 *
 * Saved per portal and user in localStorage so the panel comes back exactly as it was
 * after a reload or when moving between pages:
 *   eg:chat-widget:<portal>:<userId>        open / view / chat id / scroll position
 *   eg:chat-widget-cache:<portal>:<userId>  last conversation list + last 30 messages of the open chat
 * Both are removed on sign-out (see useChatDrafts.purgeChatStorage).
 */
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { hostPortal } from '@/lib/portalHost'
import { useAuthStore } from '@/stores/auth'
import { useChatStore, type Chat, type ChatMessage } from '@/stores/chat'

export type WidgetView = 'list' | 'chat'

interface SavedState {
  open: boolean
  view: WidgetView
  chatId: number | null
  atBottom: boolean
  scrollTop: number
}

interface SavedCache {
  chats: Chat[]
  chatId: number | null
  messages: ChatMessage[]
}

const CACHED_MESSAGES = 30
const portalName = hostPortal ?? 'main'

function safe<T>(fn: () => T, fallback: T): T {
  try { return fn() } catch { return fallback }
}

export const useChatWidgetStore = defineStore('chatWidget', () => {
  const open = ref(false)
  const view = ref<WidgetView>('list')
  const chatId = ref<number | null>(null)
  const atBottom = ref(true)
  const scrollTop = ref(0)
  /** The widget is mounted and allowed on this page (not on the messages page / signed out). */
  const available = ref(false)
  /** Set when the panel was opened by the user (move focus into it); not on restore after reload. */
  const focusRequest = ref(0)

  let userId: number | null = null
  let cacheTimer: ReturnType<typeof setTimeout> | null = null

  const stateKey = (id: number) => `eg:chat-widget:${portalName}:${id}`
  const cacheKey = (id: number) => `eg:chat-widget-cache:${portalName}:${id}`

  function restore(id: number | null) {
    userId = id
    open.value = false
    view.value = 'list'
    chatId.value = null
    atBottom.value = true
    scrollTop.value = 0
    if (!id) return
    const saved = safe<Partial<SavedState> | null>(() => JSON.parse(localStorage.getItem(stateKey(id)) || 'null'), null)
    if (saved) {
      open.value = !!saved.open
      chatId.value = typeof saved.chatId === 'number' ? saved.chatId : null
      view.value = saved.view === 'chat' && chatId.value ? 'chat' : 'list'
      atBottom.value = saved.atBottom !== false
      scrollTop.value = Number(saved.scrollTop) || 0
    }
  }

  function persist() {
    if (!userId) return
    const data: SavedState = {
      open: open.value,
      view: view.value,
      chatId: chatId.value,
      atBottom: atBottom.value,
      scrollTop: Math.round(scrollTop.value),
    }
    safe(() => localStorage.setItem(stateKey(userId!), JSON.stringify(data)), undefined)
  }

  function readCache(): SavedCache | null {
    if (!userId) return null
    return safe<SavedCache | null>(() => JSON.parse(localStorage.getItem(cacheKey(userId!)) || 'null'), null)
  }

  /** Save the conversation list and the open chat's newest messages (debounced). */
  function scheduleCacheWrite() {
    if (!userId) return
    if (cacheTimer) clearTimeout(cacheTimer)
    const id = userId
    cacheTimer = setTimeout(() => {
      cacheTimer = null
      if (userId !== id) return
      const chat = useChatStore()
      const prev = readCache()
      const openId = chatId.value
      let msgs: ChatMessage[] = prev?.chatId === openId ? prev?.messages || [] : []
      if (openId && chat.currentChatId === openId) {
        msgs = chat.messages.filter(m => m.id > 0).slice(-CACHED_MESSAGES)
      }
      const data: SavedCache = { chats: chat.chats, chatId: openId, messages: msgs }
      safe(() => localStorage.setItem(cacheKey(id), JSON.stringify(data)), undefined)
    }, 600)
  }

  function cachedMessagesFor(id: number): ChatMessage[] {
    const c = readCache()
    return c && c.chatId === id && Array.isArray(c.messages) ? c.messages : []
  }

  function cachedChats(): Chat[] {
    const c = readCache()
    return c && Array.isArray(c.chats) ? c.chats : []
  }

  // ── Actions ─────────────────────────────────────────────────────────
  function show() {
    open.value = true
    focusRequest.value++
  }

  function close() {
    open.value = false
  }

  function toggle() {
    if (open.value) close()
    else show()
  }

  function openChat(id: number) {
    if (chatId.value !== id) {
      atBottom.value = true
      scrollTop.value = 0
    }
    chatId.value = id
    view.value = 'chat'
    show()
  }

  function backToList() {
    view.value = 'list'
    focusRequest.value++
  }

  /** Open (or start) the conversation with a user inside the widget. */
  async function openWithUser(otherUserId: number): Promise<boolean> {
    const chat = await useChatStore().getOrCreateChat(otherUserId)
    if (!chat) return false
    openChat(chat.id)
    return true
  }

  function setScroll(top: number, bottom: boolean) {
    scrollTop.value = top
    atBottom.value = bottom
  }

  // Follow the signed-in user; never show one account's widget state to another.
  const auth = useAuthStore()
  watch(() => auth.user?.id ?? null, (id) => { if (id !== userId) restore(id) }, { immediate: true })
  watch([open, view, chatId, atBottom], persist)
  let scrollTimer: ReturnType<typeof setTimeout> | null = null
  watch(scrollTop, () => {
    if (scrollTimer) clearTimeout(scrollTimer)
    scrollTimer = setTimeout(persist, 250)
  })

  return {
    open, view, chatId, atBottom, scrollTop, available, focusRequest,
    show, close, toggle, openChat, backToList, openWithUser, setScroll,
    scheduleCacheWrite, cachedMessagesFor, cachedChats,
  }
})
