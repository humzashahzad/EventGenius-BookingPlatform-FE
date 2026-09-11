import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/lib/axios'
import { getEcho, updateEchoAuth, disconnectEcho, isEchoConnected } from '@/lib/echo'
import { soundService } from '@/services/soundService'
import { useAuthStore } from '@/stores/auth'
import type { Channel } from 'laravel-echo'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ChatUser {
  id: number
  name: string
  email?: string
  avatar?: string
  role?: string
  is_online?: boolean
  last_seen_at?: string
}

export interface Attachment {
  path: string
  name: string
  mime: string
  size: number
}

export interface ReplyTo {
  id: number
  body: string | null
  sender_id: number
  sender_name: string
  type: string
}

export interface Reaction {
  emoji: string
  count: number
  users: { id: number; name: string }[]
}

export interface ChatMessage {
  id: number
  chat_id: number
  sender_id: number
  body: string | null
  type: 'text' | 'image' | 'video' | 'audio' | 'file' | 'voice' | 'gif' | 'system'
  attachments: Attachment[]
  is_edited: boolean
  edited_at: string | null
  is_deleted: boolean
  reply_to?: ReplyTo | null
  forwarded_from?: { id: number; sender_name: string } | null
  sender: ChatUser
  reactions: Reaction[]
  status?: 'sent' | 'delivered' | 'read' | null
  created_at: string
  updated_at: string
}

export interface LatestMessage {
  id: number
  body: string | null
  type: string
  sender_id: number
  sender_name: string
  is_deleted: boolean
  created_at: string
}

export interface Chat {
  id: number
  type: 'private' | 'group'
  name: string | null
  avatar: string | null
  description?: string
  created_by: number
  last_message_at: string | null
  created_at: string
  other_user?: ChatUser | null
  is_muted: boolean
  is_pinned: boolean
  is_archived: boolean
  unread_count: number
  latest_message?: LatestMessage | null
  participants?: ChatUser[]
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useChatStore = defineStore('chat', () => {
  // ── State ────────────────────────────────────────────────────────────
  const chats = ref<Chat[]>([])
  const currentChatId = ref<number | null>(null)
  const messages = ref<ChatMessage[]>([])
  const loading = ref(false)
  const messagesLoading = ref(false)
  const hasMoreMessages = ref(false)
  const connectionStatus = ref<'disconnected' | 'connecting' | 'connected'>('disconnected')
  const typingUsers = ref<Map<number, { userId: number; userName: string; timeout: ReturnType<typeof setTimeout> }>>(new Map())
  const onlineUserIds = ref<Set<number>>(new Set())

  // Deduplication
  const processedMessageIds = ref<Set<number>>(new Set())

  // Echo channel references
  const subscribedChatChannels = ref<Set<number>>(new Set())
  let userChannel: Channel | null = null
  let onlineChannel: Channel | null = null

  // ── Computed ─────────────────────────────────────────────────────────
  const currentChat = computed(() => chats.value.find(c => c.id === currentChatId.value) || null)

  const sortedChats = computed(() => {
    return [...chats.value].sort((a, b) => {
      // Pinned first
      if (a.is_pinned && !b.is_pinned) return -1
      if (!a.is_pinned && b.is_pinned) return 1
      // Then by last_message_at
      const aTime = a.last_message_at || a.created_at
      const bTime = b.last_message_at || b.created_at
      return new Date(bTime).getTime() - new Date(aTime).getTime()
    })
  })

  const totalUnread = computed(() => chats.value.reduce((sum, c) => sum + c.unread_count, 0))

  const currentTypingUsers = computed(() => {
    const result: { userId: number; userName: string }[] = []
    typingUsers.value.forEach(t => {
      result.push({ userId: t.userId, userName: t.userName })
    })
    return result
  })

  // ── Echo Connection ──────────────────────────────────────────────────

  function connect() {
    const auth = useAuthStore()
    if (!auth.user || !auth.token) return

    connectionStatus.value = 'connecting'
    updateEchoAuth()

    const echo = getEcho()

    // Monitor connection state
    const pusher = (echo.connector as any).pusher
    if (pusher) {
      pusher.connection.bind('connected', () => {
        connectionStatus.value = 'connected'
      })
      pusher.connection.bind('disconnected', () => {
        connectionStatus.value = 'disconnected'
      })
      pusher.connection.bind('error', () => {
        connectionStatus.value = 'disconnected'
      })
    }

    // Subscribe to user's private channel (for personal notifications)
    userChannel = echo.private(`user.${auth.user.id}`)
    userChannel.listen('.chat.notification', (e: any) => {
      handleChatNotification(e)
    })

    // Subscribe to online presence channel
    onlineChannel = echo.join('online')
      .here((users: ChatUser[]) => {
        onlineUserIds.value = new Set(users.map(u => u.id))
        updateOnlineStatus()
      })
      .joining((user: ChatUser) => {
        onlineUserIds.value.add(user.id)
        updateOnlineStatus()
      })
      .leaving((user: ChatUser) => {
        onlineUserIds.value.delete(user.id)
        updateOnlineStatus()
      })

    // Start heartbeat
    startHeartbeat()
  }

  function disconnect() {
    disconnectEcho()
    subscribedChatChannels.value.clear()
    userChannel = null
    onlineChannel = null
    connectionStatus.value = 'disconnected'
    stopHeartbeat()
  }

  // ── Heartbeat ────────────────────────────────────────────────────────
  let heartbeatInterval: ReturnType<typeof setInterval> | null = null

  function startHeartbeat() {
    stopHeartbeat()
    heartbeatInterval = setInterval(() => {
      api.post('/nexus/heartbeat').catch(() => {})
    }, 60000) // Every 60 seconds
  }

  function stopHeartbeat() {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval)
      heartbeatInterval = null
    }
  }

  // ── Subscribe to a chat channel ──────────────────────────────────────

  function subscribeToChatChannel(chatId: number) {
    if (subscribedChatChannels.value.has(chatId)) return

    const echo = getEcho()
    const channel = echo.private(`chat.${chatId}`)

    channel
      .listen('.message.sent', (e: any) => {
        handleIncomingMessage(e.message)
      })
      .listen('.messages.read', (e: any) => {
        handleReadReceipt(e)
      })
      .listen('.message.reacted', (e: any) => {
        handleReaction(e)
      })
      .listen('.message.updated', (e: any) => {
        handleMessageUpdate(e)
      })
      .listen('.user.typing', (e: any) => {
        handleTypingEvent(e)
      })

    subscribedChatChannels.value.add(chatId)
  }

  function unsubscribeFromChatChannel(chatId: number) {
    if (!subscribedChatChannels.value.has(chatId)) return
    const echo = getEcho()
    echo.leave(`chat.${chatId}`)
    subscribedChatChannels.value.delete(chatId)
  }

  // ── Online status ────────────────────────────────────────────────────

  function updateOnlineStatus() {
    chats.value.forEach(chat => {
      if (chat.type === 'private' && chat.other_user) {
        chat.other_user.is_online = onlineUserIds.value.has(chat.other_user.id)
      }
    })
  }

  function isUserOnline(userId: number): boolean {
    return onlineUserIds.value.has(userId)
  }

  // ── Fetch Chats ──────────────────────────────────────────────────────

  async function fetchChats() {
    loading.value = true
    try {
      const { data } = await api.get('/nexus/chats')
      chats.value = data.data

      // Subscribe to all chat channels
      chats.value.forEach(chat => subscribeToChatChannel(chat.id))
    } catch (err) {
      console.error('Failed to fetch chats:', err)
    } finally {
      loading.value = false
    }
  }

  // ── Create / Get Chat ────────────────────────────────────────────────

  async function getOrCreateChat(userId: number): Promise<Chat | null> {
    try {
      const { data } = await api.post('/nexus/chats', { user_id: userId })
      const chat: Chat = data.data

      // Add to list if not already there
      const existing = chats.value.find(c => c.id === chat.id)
      if (!existing) {
        chats.value.unshift(chat)
      }

      subscribeToChatChannel(chat.id)
      return chat
    } catch (err) {
      console.error('Failed to create chat:', err)
      return null
    }
  }

  // ── Select Chat ──────────────────────────────────────────────────────

  async function selectChat(chatId: number) {
    currentChatId.value = chatId
    messages.value = []
    processedMessageIds.value.clear()
    typingUsers.value.clear()

    subscribeToChatChannel(chatId)
    await fetchMessages(chatId)

    // Mark as read
    const chat = chats.value.find(c => c.id === chatId)
    if (chat && chat.unread_count > 0) {
      markAsRead(chatId)
    }
  }

  function deselectChat() {
    currentChatId.value = null
    messages.value = []
    processedMessageIds.value.clear()
    typingUsers.value.clear()
  }

  // ── Fetch Messages ───────────────────────────────────────────────────

  async function fetchMessages(chatId: number, before?: number) {
    messagesLoading.value = true
    try {
      const params: any = { limit: 50 }
      if (before) params.before = before

      const { data } = await api.get(`/nexus/chats/${chatId}/messages`, { params })

      const newMessages: ChatMessage[] = data.data
      newMessages.forEach(m => processedMessageIds.value.add(m.id))

      if (before) {
        messages.value = [...newMessages, ...messages.value]
      } else {
        messages.value = newMessages
      }

      hasMoreMessages.value = data.has_more
    } catch (err) {
      console.error('Failed to fetch messages:', err)
    } finally {
      messagesLoading.value = false
    }
  }

  async function loadOlderMessages() {
    if (!currentChatId.value || !hasMoreMessages.value || messagesLoading.value) return
    const oldest = messages.value[0]
    if (oldest) {
      await fetchMessages(currentChatId.value, oldest.id)
    }
  }

  // ── Send Message ─────────────────────────────────────────────────────

  async function sendMessage(
    chatId: number,
    body: string,
    options?: {
      replyToId?: number
      forwardedFromId?: number
      files?: File[]
      type?: string
    }
  ): Promise<ChatMessage | null> {
    const auth = useAuthStore()
    if (!auth.user) return null

    // Optimistic message (temp ID)
    const tempId = -Date.now()
    const optimistic: ChatMessage = {
      id: tempId,
      chat_id: chatId,
      sender_id: auth.user.id,
      body,
      type: (options?.type as any) || 'text',
      attachments: [],
      is_edited: false,
      edited_at: null,
      is_deleted: false,
      reply_to: null,
      forwarded_from: null,
      sender: {
        id: auth.user.id,
        name: auth.user.name,
        avatar: auth.user.avatar,
        role: auth.user.role,
      },
      reactions: [],
      status: 'sent',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (chatId === currentChatId.value) {
      messages.value.push(optimistic)
    }

    try {
      let response: any

      if (options?.files && options.files.length > 0) {
        // Multipart form for file uploads
        const formData = new FormData()
        if (body) formData.append('body', body)
        if (options.replyToId) formData.append('reply_to_id', String(options.replyToId))
        if (options.forwardedFromId) formData.append('forwarded_from_id', String(options.forwardedFromId))
        if (options.type) formData.append('type', options.type)
        options.files.forEach(f => formData.append('attachments[]', f))

        response = await api.post(`/nexus/chats/${chatId}/messages`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      } else {
        response = await api.post(`/nexus/chats/${chatId}/messages`, {
          body,
          reply_to_id: options?.replyToId,
          forwarded_from_id: options?.forwardedFromId,
          type: options?.type,
        })
      }

      const realMessage: ChatMessage = response.data.data

      // Replace optimistic message with real one
      if (chatId === currentChatId.value) {
        const idx = messages.value.findIndex(m => m.id === tempId)
        if (idx !== -1) {
          messages.value[idx] = realMessage
        }
        processedMessageIds.value.add(realMessage.id)
      }

      // Update chat's latest message
      updateChatPreview(chatId, realMessage)

      return realMessage
    } catch (err) {
      console.error('Failed to send message:', err)
      // Remove optimistic message on failure
      if (chatId === currentChatId.value) {
        messages.value = messages.value.filter(m => m.id !== tempId)
      }
      return null
    }
  }

  // ── Edit Message ─────────────────────────────────────────────────────

  async function editMessage(messageId: number, body: string): Promise<boolean> {
    try {
      const { data } = await api.put(`/nexus/messages/${messageId}`, { body })
      const updated: ChatMessage = data.data

      const idx = messages.value.findIndex(m => m.id === messageId)
      if (idx !== -1) {
        messages.value[idx] = updated
      }
      return true
    } catch (err) {
      console.error('Failed to edit message:', err)
      return false
    }
  }

  // ── Delete Message ───────────────────────────────────────────────────

  async function deleteMessage(messageId: number): Promise<boolean> {
    try {
      await api.delete(`/nexus/messages/${messageId}`)

      const idx = messages.value.findIndex(m => m.id === messageId)
      if (idx !== -1) {
        messages.value[idx] = {
          ...messages.value[idx],
          is_deleted: true,
          body: null,
          attachments: [],
        }
      }
      return true
    } catch (err) {
      console.error('Failed to delete message:', err)
      return false
    }
  }

  // ── Mark as Read ─────────────────────────────────────────────────────

  async function markAsRead(chatId: number) {
    try {
      await api.post(`/nexus/chats/${chatId}/read`)

      // Update local unread count
      const chat = chats.value.find(c => c.id === chatId)
      if (chat) {
        chat.unread_count = 0
      }
    } catch (err) {
      console.error('Failed to mark as read:', err)
    }
  }

  // ── Toggle Reaction ──────────────────────────────────────────────────

  async function toggleReaction(messageId: number, emoji: string) {
    try {
      const { data } = await api.post(`/nexus/messages/${messageId}/reactions`, { emoji })
      return data.action
    } catch (err) {
      console.error('Failed to toggle reaction:', err)
      return null
    }
  }

  // ── Typing Indicator ─────────────────────────────────────────────────

  let typingTimeout: ReturnType<typeof setTimeout> | null = null

  function emitTyping(chatId: number) {
    api.post(`/nexus/chats/${chatId}/typing`, { is_typing: true }).catch(() => {})

    // Auto-stop after 3 seconds
    if (typingTimeout) clearTimeout(typingTimeout)
    typingTimeout = setTimeout(() => {
      api.post(`/nexus/chats/${chatId}/typing`, { is_typing: false }).catch(() => {})
    }, 3000)
  }

  function stopTyping(chatId: number) {
    if (typingTimeout) clearTimeout(typingTimeout)
    api.post(`/nexus/chats/${chatId}/typing`, { is_typing: false }).catch(() => {})
  }

  // ── Search Users ─────────────────────────────────────────────────────

  async function searchUsers(query: string): Promise<ChatUser[]> {
    try {
      const { data } = await api.get('/nexus/users/search', { params: { q: query } })
      return data.data
    } catch (err) {
      console.error('Failed to search users:', err)
      return []
    }
  }

  // ── Event Handlers ───────────────────────────────────────────────────

  function handleIncomingMessage(msg: ChatMessage) {
    // Dedup
    if (processedMessageIds.value.has(msg.id)) return
    processedMessageIds.value.add(msg.id)

    // Add to current chat's messages if viewing that chat
    if (msg.chat_id === currentChatId.value) {
      messages.value.push(msg)
      // Auto-read since user is viewing this chat
      markAsRead(msg.chat_id)
    }

    // Update chat preview
    updateChatPreview(msg.chat_id, msg)

    // Clear typing for this user
    typingUsers.value.delete(msg.sender_id)
  }

  function handleChatNotification(event: any) {
    const auth = useAuthStore()

    if (event.type === 'new_message') {
      const data = event.data

      // Update unread count (if not viewing that chat)
      if (data.chat_id !== currentChatId.value) {
        const chat = chats.value.find(c => c.id === data.chat_id)
        if (chat) {
          chat.unread_count = (chat.unread_count || 0) + 1
          chat.last_message_at = data.created_at
          chat.latest_message = {
            id: data.message_id,
            body: data.body,
            type: data.type,
            sender_id: data.sender_id,
            sender_name: data.sender_name,
            is_deleted: false,
            created_at: data.created_at,
          }
        }

        // Play sound + browser notification
        if (!chat?.is_muted) {
          soundService.playMessage()
          showBrowserNotification(data.sender_name, data.body || '[Attachment]', data.chat_id)
        }
      }
    } else if (event.type === 'chat_created') {
      // New chat was created with this user
      const chatData = event.data.chat
      if (!chats.value.find(c => c.id === chatData.id)) {
        chats.value.unshift(chatData)
        subscribeToChatChannel(chatData.id)
      }
    }
  }

  function handleReadReceipt(event: any) {
    const { message_ids, user_id, read_at } = event

    // Update message status in current view
    messages.value.forEach(msg => {
      if (message_ids.includes(msg.id) && msg.status !== 'read') {
        msg.status = 'read'
      }
    })
  }

  function handleReaction(event: any) {
    const { message_id, user_id, user_name, emoji, action } = event

    const msg = messages.value.find(m => m.id === message_id)
    if (!msg) return

    if (action === 'added') {
      const existing = msg.reactions.find(r => r.emoji === emoji)
      if (existing) {
        existing.count++
        existing.users.push({ id: user_id, name: user_name })
      } else {
        msg.reactions.push({
          emoji,
          count: 1,
          users: [{ id: user_id, name: user_name }],
        })
      }
    } else {
      const existing = msg.reactions.find(r => r.emoji === emoji)
      if (existing) {
        existing.count--
        existing.users = existing.users.filter(u => u.id !== user_id)
        if (existing.count <= 0) {
          msg.reactions = msg.reactions.filter(r => r.emoji !== emoji)
        }
      }
    }
  }

  function handleMessageUpdate(event: any) {
    const { message, action } = event
    const idx = messages.value.findIndex(m => m.id === message.id)
    if (idx !== -1) {
      messages.value[idx] = message
    }
  }

  function handleTypingEvent(event: any) {
    const auth = useAuthStore()
    if (event.user_id === auth.user?.id) return
    if (event.chat_id !== currentChatId.value) return

    if (event.is_typing) {
      // Set typing with auto-clear timeout
      const existing = typingUsers.value.get(event.user_id)
      if (existing?.timeout) clearTimeout(existing.timeout)

      const timeout = setTimeout(() => {
        typingUsers.value.delete(event.user_id)
      }, 4000)

      typingUsers.value.set(event.user_id, {
        userId: event.user_id,
        userName: event.user_name,
        timeout,
      })
    } else {
      typingUsers.value.delete(event.user_id)
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────────

  function updateChatPreview(chatId: number, msg: ChatMessage) {
    const chat = chats.value.find(c => c.id === chatId)
    if (chat) {
      chat.last_message_at = msg.created_at
      chat.latest_message = {
        id: msg.id,
        body: msg.is_deleted ? 'This message was deleted' : msg.body,
        type: msg.type,
        sender_id: msg.sender_id,
        sender_name: msg.sender?.name || '',
        is_deleted: msg.is_deleted,
        created_at: msg.created_at,
      }
    }
  }

  // ── Browser Notifications ────────────────────────────────────────────

  function showBrowserNotification(title: string, body: string, chatId: number) {
    if (!('Notification' in window)) return
    if (Notification.permission !== 'granted') return
    if (document.hasFocus() && currentChatId.value === chatId) return

    const notification = new Notification(title, {
      body,
      icon: '/favicon.ico',
      tag: `chat-${chatId}`,
    })

    notification.onclick = () => {
      window.focus()
      selectChat(chatId)
      notification.close()
    }
  }

  function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }

  // ── Reset ────────────────────────────────────────────────────────────

  function $reset() {
    disconnect()
    chats.value = []
    currentChatId.value = null
    messages.value = []
    loading.value = false
    messagesLoading.value = false
    hasMoreMessages.value = false
    typingUsers.value.clear()
    onlineUserIds.value.clear()
    processedMessageIds.value.clear()
  }

  return {
    // State
    chats,
    currentChatId,
    messages,
    loading,
    messagesLoading,
    hasMoreMessages,
    connectionStatus,
    typingUsers,
    onlineUserIds,

    // Computed
    currentChat,
    sortedChats,
    totalUnread,
    currentTypingUsers,

    // Methods
    connect,
    disconnect,
    fetchChats,
    getOrCreateChat,
    selectChat,
    deselectChat,
    fetchMessages,
    loadOlderMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    markAsRead,
    toggleReaction,
    emitTyping,
    stopTyping,
    searchUsers,
    isUserOnline,
    requestNotificationPermission,
    $reset,
  }
})
