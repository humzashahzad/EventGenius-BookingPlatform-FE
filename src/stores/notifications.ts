import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Channel } from 'laravel-echo'
import api from '@/lib/axios'
import { getEcho } from '@/lib/echo'
import { useAuthStore } from '@/stores/auth'
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
  const notifications = ref<AppNotification[]>([])
  const unreadCount = ref(0)
  const bookingUnreadCount = ref(0)
  const loading = ref(false)
  const lastEventId = ref(0)
  const userChannel = ref<Channel | null>(null)
  const connectedUserId = ref<number | null>(null)

  // Dedupe: chat socket may already show sound/browser notification before
  // the persisted app notification reaches the same user channel.
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

  function mergeNotification(notification: AppNotification): boolean {
    const existing = notifications.value.find(n => n.id === notification.id)
    if (existing) {
      Object.assign(existing, notification)
      lastEventId.value = Math.max(lastEventId.value, notification.id)
      return false
    }

    notifications.value.unshift(notification)
    if (!notification.is_read) unreadCount.value++
    lastEventId.value = Math.max(lastEventId.value, notification.id)
    return true
  }

  async function fetchUnread() {
    try {
      notifications.value = notifications.value.filter(notification => notification.type !== 'chat_message')
      const { data } = await api.get('/notifications/unread', {
        params: { exclude_types: ['chat_message'] },
      })
      unreadCount.value = Number(data.counts?.general ?? data.unread_count ?? 0)
      bookingUnreadCount.value = Number(data.counts?.booking ?? 0)
      lastEventId.value = Math.max(lastEventId.value, Number(data.last_id || 0))

      const incoming: AppNotification[] = data.latest || []
      for (const notification of incoming) {
        if (!notifications.value.find(existing => existing.id === notification.id)) {
          notifications.value.unshift(notification)
        }
      }
    } catch {
      // Silent by design for header refreshes.
    }
  }

  async function fetchAll(page = 1) {
    loading.value = true
    try {
      const { data } = await api.get('/notifications', {
        params: {
          page,
          per_page: 30,
          exclude_types: ['chat_message'],
        },
      })
      if (page === 1) {
        notifications.value = data.data.data
        unreadCount.value = Number(data.counts?.general ?? data.unread_count ?? 0)
        bookingUnreadCount.value = Number(data.counts?.booking ?? 0)
        if (notifications.value.length) {
          lastEventId.value = Math.max(...notifications.value.map(notification => notification.id))
        }
      } else {
        notifications.value.push(...data.data.data)
      }
      return data.data
    } finally {
      loading.value = false
    }
  }

  function connectRealtime() {
    const authStore = useAuthStore()
    if (!authStore.user || !authStore.token) return

    if (connectedUserId.value === authStore.user.id && userChannel.value) {
      return
    }

    disconnectRealtime()

    connectedUserId.value = authStore.user.id
    userChannel.value = getEcho().private(`user.${authStore.user.id}`)
    userChannel.value.listen('.notification.created', (event: any) => {
      handleIncomingNotification(event.notification as AppNotification)
    })
  }

  function disconnectRealtime() {
    if (connectedUserId.value != null) {
      getEcho().leave(`user.${connectedUserId.value}`)
    }
    userChannel.value = null
    connectedUserId.value = null
  }

  function handleIncomingNotification(notification: AppNotification) {
    if (notification.type === 'session_revoked') {
      window.dispatchEvent(new CustomEvent('auth:session-expired'))
    }

    if (notification.type === 'chat_message') {
      return
    }

    const inserted = mergeNotification(notification)
    if (inserted && isBookingNotification(notification.type) && !notification.is_read) {
      bookingUnreadCount.value++
    }

    if (!inserted) return

    showBrowserNotification(notification)
    if (!document.hasFocus()) {
      soundService.playNotification()
    }
  }

  async function markRead(id: number) {
    await api.patch(`/notifications/${id}/read`)
    const notification = notifications.value.find(item => item.id === id)
    if (notification && !notification.is_read) {
      notification.is_read = true
      unreadCount.value = Math.max(0, unreadCount.value - 1)
      if (isBookingNotification(notification.type)) {
        bookingUnreadCount.value = Math.max(0, bookingUnreadCount.value - 1)
      }
    }
  }

  async function markAllRead() {
    await api.post('/notifications/read-all')
    notifications.value.forEach(notification => {
      notification.is_read = true
    })
    unreadCount.value = 0
    bookingUnreadCount.value = 0
  }

  async function remove(id: number) {
    await api.delete(`/notifications/${id}`)
    const index = notifications.value.findIndex(item => item.id === id)
    if (index !== -1) {
      if (!notifications.value[index].is_read) {
        unreadCount.value = Math.max(0, unreadCount.value - 1)
        if (isBookingNotification(notifications.value[index].type)) {
          bookingUnreadCount.value = Math.max(0, bookingUnreadCount.value - 1)
        }
      }
      notifications.value.splice(index, 1)
    }
  }

  function isBookingNotification(type: string): boolean {
    return [
      'booking_created',
      'booking_confirmed',
      'booking_rejected',
      'booking_cancelled',
      'new_booking_received',
    ].includes(type)
  }

  function showBrowserNotification(notification: AppNotification) {
    if (!('Notification' in window)) return
    if (Notification.permission === 'granted') {
      try {
        new Notification(notification.title, {
          body: notification.body,
          icon: '/favicon.svg',
          tag: `notif-${notification.id}`,
        })
      } catch (error) {
        console.warn('Browser notification failed:', error)
      }
      return
    }

    if (Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          try {
            new Notification(notification.title, {
              body: notification.body,
              icon: '/favicon.svg',
              tag: `notif-${notification.id}`,
            })
          } catch (error) {
            console.warn('Browser notification failed:', error)
          }
        }
      })
    }
  }

  function showChatMessageNotification(title: string, body: string, conversationId: number) {
    recordChatNotificationShown(conversationId)

    const chatStore = useChatStore()
    const isViewingThisChat = chatStore.currentChatId === conversationId && document.hasFocus()
    if (!isViewingThisChat) {
      soundService.playMessage()
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: '/favicon.svg',
          tag: `chat-${conversationId}-${Date.now()}`,
        })
      }
    }
  }

  function requestBrowserPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }

  function iconForType(type: string): string {
    const map: Record<string, string> = {
      booking_created: '📅',
      booking_confirmed: '✅',
      booking_rejected: '❌',
      booking_cancelled: '🚫',
      new_booking_received: '🔔',
      store_approved: '🏪',
      store_suspended: '⛔',
      chat_message: '💬',
      session_revoked: '🔒',
    }
    return map[type] || '🔔'
  }

  function colorForType(type: string): string {
    const map: Record<string, string> = {
      booking_created: 'primary',
      booking_confirmed: 'success',
      booking_rejected: 'danger',
      booking_cancelled: 'warning',
      new_booking_received: 'info',
      store_approved: 'success',
      store_suspended: 'danger',
      chat_message: 'primary',
      session_revoked: 'danger',
    }
    return map[type] || 'primary'
  }

  function timeAgo(dateStr: string): string {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  return {
    notifications,
    unreadCount,
    bookingUnreadCount,
    loading,
    unread,
    fetchUnread,
    fetchAll,
    connectRealtime,
    disconnectRealtime,
    markRead,
    markAllRead,
    remove,
    iconForType,
    colorForType,
    timeAgo,
    requestBrowserPermission,
    showBrowserNotification,
    showChatMessageNotification,
  }
})
