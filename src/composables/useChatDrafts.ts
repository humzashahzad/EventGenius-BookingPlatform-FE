/**
 * Unsent message drafts, per signed-in user and conversation, kept in localStorage
 * (`eg:chat-draft:<userId>:<chatId>`). Shared by the chat widget and the messages page,
 * so text typed in one shows up in the other and survives a reload. Drafts are never
 * sent automatically; they are cleared when the message is sent and on sign-out.
 */
import { ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'

export const DRAFT_PREFIX = 'eg:chat-draft:'
const WRITE_DELAY = 300

const drafts = ref<Record<number, string>>({})
const pending = new Map<number, ReturnType<typeof setTimeout>>()
let loadedFor: number | null = null
let installed = false

function safe<T>(fn: () => T, fallback: T): T {
  try { return fn() } catch { return fallback }
}

function keyFor(userId: number, chatId: number) {
  return `${DRAFT_PREFIX}${userId}:${chatId}`
}

function storageKeys(): string[] {
  return safe(() => {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k) keys.push(k)
    }
    return keys
  }, [])
}

function flushPending() {
  pending.forEach(t => clearTimeout(t))
  pending.clear()
}

function load(userId: number | null) {
  flushPending()
  loadedFor = userId
  const next: Record<number, string> = {}
  if (userId) {
    const prefix = `${DRAFT_PREFIX}${userId}:`
    for (const k of storageKeys()) {
      if (!k.startsWith(prefix)) continue
      const chatId = Number(k.slice(prefix.length))
      const text = safe(() => localStorage.getItem(k), null)
      if (chatId && text) next[chatId] = text
    }
  }
  drafts.value = next
}

/** Remove every chat draft and the widget's saved state (sign-out). */
export function purgeChatStorage(exceptUserId?: number | null) {
  flushPending()
  for (const k of storageKeys()) {
    const isDraft = k.startsWith(DRAFT_PREFIX)
    const isWidget = k.startsWith('eg:chat-widget')
    if (!isDraft && !isWidget) continue
    if (exceptUserId) {
      // Keys end with the user id (widget) or have it before the chat id (drafts).
      const owner = isDraft ? Number(k.slice(DRAFT_PREFIX.length).split(':')[0]) : Number(k.split(':').pop())
      if (owner === exceptUserId) continue
    }
    safe(() => localStorage.removeItem(k), undefined)
  }
  if (!exceptUserId) drafts.value = {}
}

function install() {
  if (installed || typeof window === 'undefined') return
  installed = true
  const auth = useAuthStore()
  watch(() => auth.user?.id ?? null, (id) => {
    if (id !== loadedFor) load(id)
    // Another account signed in on this browser: drop what earlier accounts left behind.
    if (id) purgeChatStorage(id)
  }, { immediate: true })

  // Explicit sign-out clears drafts and the widget's cached chats.
  auth.$onAction(({ name, after }) => {
    if (name === 'logout' || name === 'logoutAll') after(() => purgeChatStorage())
  })

  // Keep other tabs of the same portal in step.
  window.addEventListener('storage', (e) => {
    if (!loadedFor || !e.key?.startsWith(`${DRAFT_PREFIX}${loadedFor}:`)) return
    const chatId = Number(e.key.slice(`${DRAFT_PREFIX}${loadedFor}:`.length))
    if (!chatId) return
    const copy = { ...drafts.value }
    if (e.newValue) copy[chatId] = e.newValue
    else delete copy[chatId]
    drafts.value = copy
  })
}

export function useChatDrafts() {
  install()

  function getDraft(chatId: number | null | undefined): string {
    return chatId ? drafts.value[chatId] || '' : ''
  }

  /** Save what the user typed (written to storage after a short pause). */
  function setDraft(chatId: number | null | undefined, text: string) {
    if (!chatId || !loadedFor) return
    const userId = loadedFor
    const value = text.trim() ? text : ''
    if ((drafts.value[chatId] || '') === value) return
    const copy = { ...drafts.value }
    if (value) copy[chatId] = value
    else delete copy[chatId]
    drafts.value = copy

    const prev = pending.get(chatId)
    if (prev) clearTimeout(prev)
    pending.set(chatId, setTimeout(() => {
      pending.delete(chatId)
      if (loadedFor !== userId) return
      safe(() => {
        if (value) localStorage.setItem(keyFor(userId, chatId), value)
        else localStorage.removeItem(keyFor(userId, chatId))
      }, undefined)
    }, WRITE_DELAY))
  }

  /** Forget the draft right away (message sent). */
  function clearDraft(chatId: number | null | undefined) {
    if (!chatId) return
    const prev = pending.get(chatId)
    if (prev) clearTimeout(prev)
    pending.delete(chatId)
    if (drafts.value[chatId] !== undefined) {
      const copy = { ...drafts.value }
      delete copy[chatId]
      drafts.value = copy
    }
    if (loadedFor) safe(() => localStorage.removeItem(keyFor(loadedFor!, chatId)), undefined)
  }

  return { drafts, getDraft, setDraft, clearDraft }
}

// Write pending drafts before the page goes away (reload within the debounce window).
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => {
    if (!loadedFor) return
    const userId = loadedFor
    pending.forEach((t, chatId) => {
      clearTimeout(t)
      const value = drafts.value[chatId] || ''
      safe(() => {
        if (value) localStorage.setItem(keyFor(userId, chatId), value)
        else localStorage.removeItem(keyFor(userId, chatId))
      }, undefined)
    })
    pending.clear()
  })
}
