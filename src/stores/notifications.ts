import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/lib/axios'
import { useAuthStore } from '@/stores/auth'
import { getToken } from '@/lib/portalToken'
import { useChatStore } from '@/stores/chat'
import { soundService } from '@/services/soundService'

export interface AppNotification {
  id: number
  type: string
  title: string
  body: string
  data: Record<string, any> | null
  is_read: boolean
  created_at: string
}

export const useNotificationStore = defineStore('notifications', () => {
  const notifications  = ref<AppNotification[]>([])
  const unreadCount    = ref(0)
  const loading        = ref(false)
  const sseSource      = ref<EventSource | null>(null)
  const lastEventId    = ref(0)
  /** Dedupe: when chat socket already showed sound+browser notif for this conversation, skip when SSE delivers same */
  const lastChatNotifConversationId = ref<number | null>(null)
  const lastChatNotifTime = ref(0)
  const CHAT_NOTIF_DEDUPE_MS = 4000

  const unread = computed(() => notifications.value.filter(n => !n.is_read))

  function recordChatNotificationShown(conversationId: number) {
    lastChatNotifConversationId.value = conversationId
    lastChatNotifTime.value = Date.now()
  }

  function shouldSkipChatNotifSoundAndBrowser(conversationId: number | undefined): boolean {
    if (conversationId == null) return false
    if (lastChatNotifConversationId.value !== conversationId) return false
    return Date.now() - lastChatNotifTime.value < CHAT_NOTIF_DEDUPE_MS
  }

  // ── Fetch latest notifications (initial load + poll fallback) ──────────────
  async function fetchUnread() {
    try {
      const { data } = await api.get('/notifications/unread')
      unreadCount.value = data.unread_count
      // Merge latest into notifications (prepend new ones)
      const incoming: AppNotification[] = data.latest || []
      for (const n of incoming) {
        if (!notifications.value.find(x => x.id === n.id)) {
          notifications.value.unshift(n)
          if (n.id > lastEventId.value) lastEventId.value = n.id
        }
      }
    } catch { /* silent */ }
  }

  async function fetchAll(page = 1) {
    loading.value = true
    try {
      const { data } = await api.get('/notifications', { params: { page, per_page: 30 } })
      if (page === 1) {
        notifications.value = data.data.data
        unreadCount.value   = data.unread_count
        if (notifications.value.length) {
          lastEventId.value = Math.max(...notifications.value.map(n => n.id))
        }
      } else {
        notifications.value.push(...data.data.data)
      }
      return data.data
    } catch { /* silent */ } finally {
      loading.value = false
    }
  }

  // ── SSE real-time stream ───────────────────────────────────────────────────
  function startSSE() {
    const authStore = useAuthStore()
    const token = getToken()
    if (!token || sseSource.value) return

    const url = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/notifications/stream?token=${encodeURIComponent(token)}&lastId=${lastEventId.value}`

    const es = new EventSource(url)
    sseSource.value = es

    es.addEventListener('notification', (event) => {
      try {
        const n: AppNotification = JSON.parse(event.data)
        if (!notifications.value.find(x => x.id === n.id)) {
          notifications.value.unshift(n)
          if (!n.is_read) unreadCount.value++
          lastEventId.value = Math.max(lastEventId.value, n.id)
          const conversationId = n.type === 'chat_message' ? n.data?.conversation_id : undefined
          const chatStore = useChatStore()
          const isViewingThisChat = n.type === 'chat_message' &&
            conversationId != null &&
            chatStore.currentConversationId === conversationId
          const alreadyShownBySocket = n.type === 'chat_message' && shouldSkipChatNotifSoundAndBrowser(conversationId)
          // Real-time chat is driven by WebSockets (socket server). We only show notification/sound here.
          if (!alreadyShownBySocket) {
            showBrowserNotification(n)
            if (!isViewingThisChat) soundService.playNotification()
          }
        }
      } catch { /* ignore parse errors */ }
    })

    es.addEventListener('reconnect', () => {
      stopSSE()
      setTimeout(startSSE, 1000)
    })

    es.addEventListener('connected', () => {
      // SSE connected successfully
    })

    es.onerror = () => {
      stopSSE()
      // Fallback: poll every 15 seconds when SSE fails
      setTimeout(() => {
        fetchUnread()
        startSSE()
      }, 15000)
    }
  }

  function stopSSE() {
    if (sseSource.value) {
      sseSource.value.close()
      sseSource.value = null
    }
  }

  // ── Actions ────────────────────────────────────────────────────────────────
  async function markRead(id: number) {
    await api.patch(`/notifications/${id}/read`)
    const n = notifications.value.find(x => x.id === id)
    if (n && !n.is_read) {
      n.is_read = true
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    }
  }

  async function markAllRead() {
    await api.post('/notifications/read-all')
    notifications.value.forEach(n => { n.is_read = true })
    unreadCount.value = 0
  }

  async function remove(id: number) {
    await api.delete(`/notifications/${id}`)
    const idx = notifications.value.findIndex(x => x.id === id)
    if (idx !== -1) {
      if (!notifications.value[idx].is_read) unreadCount.value = Math.max(0, unreadCount.value - 1)
      notifications.value.splice(idx, 1)
    }
  }

  function showBrowserNotification(n: AppNotification) {
    if (!('Notification' in window)) return
    if (Notification.permission === 'granted') {
      try {
        new Notification(n.title, {
          body: n.body,
          icon: '/favicon.ico',
          tag: `notif-${n.id}`,
        })
      } catch (e) {
        console.warn('Browser notification failed:', e)
      }
      return
    }
    if (Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          try {
            new Notification(n.title, { body: n.body, icon: '/favicon.ico', tag: `notif-${n.id}` })
          } catch (e) {
            console.warn('Browser notification failed:', e)
          }
        }
      })
    }
  }

  /** Call when chat socket delivers a new message and user is not viewing that conversation: instant sound + browser notif; records so SSE won’t duplicate. */
  function showChatMessageNotification(title: string, body: string, conversationId: number) {
    recordChatNotificationShown(conversationId)
    soundService.playNotification()
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico', tag: `chat-${conversationId}-${Date.now()}` })
    }
  }

  function requestBrowserPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }

  // ── Icon by type ───────────────────────────────────────────────────────────
  function iconForType(type: string): string {
    const map: Record<string, string> = {
      booking_created:      '📅',
      booking_confirmed:    '✅',
      booking_rejected:     '❌',
      booking_cancelled:    '🚫',
      new_booking_received: '🔔',
      store_approved:       '🏪',
      store_suspended:      '⛔',
      chat_message:         '💬',
    }
    return map[type] || '🔔'
  }

  function colorForType(type: string): string {
    const map: Record<string, string> = {
      booking_created:      'primary',
      booking_confirmed:    'success',
      booking_rejected:     'danger',
      booking_cancelled:    'warning',
      new_booking_received: 'info',
      store_approved:       'success',
      store_suspended:      'danger',
      chat_message:         'primary',
    }
    return map[type] || 'primary'
  }

  function timeAgo(dateStr: string): string {
    const date = new Date(dateStr)
    const now  = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
    if (diff < 60)    return 'just now'
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  return {
    notifications, unreadCount, loading, unread,
    fetchUnread, fetchAll, startSSE, stopSSE,
    markRead, markAllRead, remove,
    iconForType, colorForType, timeAgo,
    requestBrowserPermission,
    showBrowserNotification,
    showChatMessageNotification,
  }
})
