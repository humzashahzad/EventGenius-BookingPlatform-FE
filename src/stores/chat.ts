import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/lib/axios'
import { getEcho, disconnectEcho, onEchoStateChange, echoState, reconnectEcho } from '@/lib/echo'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'
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
  const connectedUserId = ref<number | null>(null)

  // Deduplication
  const processedMessageIds = ref<Set<number>>(new Set())
  // Messages we already alerted about (toast/sound/unread), whichever event arrived first.
  const alertedMessageIds = new Set<number>()

  /** True while the messages page is mounted (set by MessagesView). */
  const viewActive = ref(false)

  // Echo channel references
  const subscribedChatChannels = ref<Set<number>>(new Set())
  const chatChannels = ref<Map<number, Channel>>(new Map())
  let userChannel: Channel | null = null
  let onlineChannel: Channel | null = null
  let connectionWatchdog: ReturnType<typeof setTimeout> | null = null
  let boundEcho: unknown = null
  let stopStateWatch: (() => void) | null = null
  let hasConnectedOnce = false
  let fallbackPoll: ReturnType<typeof setInterval> | null = null
  let hiddenSince = 0
  let lifecycleInstalled = false
  let syncing: Promise<void> | null = null

  // ── Computed ─────────────────────────────────────────────────────────
  const currentChat = computed(() => chats.value.find(c => c.id === currentChatId.value) || null)
  const currentConversation = computed(() => currentChat.value)
  const currentConversationId = computed(() => currentChatId.value)

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
  const totalUnreadCount = computed(() => totalUnread.value)
  const conversations = computed(() => sortedChats.value)

  const currentTypingUsers = computed(() => {
    const result: { userId: number; userName: string }[] = []
    typingUsers.value.forEach(t => {
      result.push({ userId: t.userId, userName: t.userName })
    })
    return result
  })

  // ── Echo Connection ──────────────────────────────────────────────────

  function setConnectionState(state: string) {
    if (state === 'connected') {
      connectionStatus.value = 'connected'
      if (connectionWatchdog) {
        clearTimeout(connectionWatchdog)
        connectionWatchdog = null
      }
    } else if (state === 'connecting' || state === 'initialized') {
      connectionStatus.value = 'connecting'
    } else {
      connectionStatus.value = 'disconnected'
    }
  }

  function connect() {
    const auth = useAuthStore()
    if (!auth.user || !auth.token) return

    // If user changed, reset old connection fully first.
    if (connectedUserId.value && connectedUserId.value !== auth.user.id) {
      disconnect()
    }

    const echo = getEcho()
    connectedUserId.value = auth.user.id
    installLifecycleHandlers()

    // Listeners are bound once per Echo instance; calling connect() again is a no-op.
    if (boundEcho === echo && userChannel) {
      reconnectEcho()
      return
    }
    boundEcho = echo
    setConnectionState(echoState())

    if (connectionWatchdog) clearTimeout(connectionWatchdog)
    connectionWatchdog = setTimeout(() => {
      if (connectionStatus.value === 'connecting') connectionStatus.value = 'disconnected'
    }, 10000)

    stopStateWatch?.()
    stopStateWatch = onEchoStateChange((current) => {
      setConnectionState(current)
      if (current === 'connected') {
        stopFallbackPoll()
        // Pusher re-subscribes channels itself; fetch whatever arrived while we were away.
        if (hasConnectedOnce) void syncNow()
        hasConnectedOnce = true
      } else if (current === 'unavailable' || current === 'failed') {
        startFallbackPoll()
      }
    })
    if (echoState() === 'connected') hasConnectedOnce = true

    // Personal channel: new-message signals for every chat (shared with the notifications store,
    // which listens for a different event on the same channel).
    userChannel = echo.private(`user.${auth.user.id}`)
    userChannel.stopListening('.chat.notification')
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

    // Chats loaded before the socket existed still need their channels.
    chats.value.forEach(chat => subscribeToChatChannel(chat.id))
  }

  function disconnect() {
    stopStateWatch?.()
    stopStateWatch = null
    stopFallbackPoll()
    disconnectEcho()
    boundEcho = null
    hasConnectedOnce = false
    subscribedChatChannels.value.clear()
    chatChannels.value.clear()
    userChannel = null
    onlineChannel = null
    connectionStatus.value = 'disconnected'
    connectedUserId.value = null
    if (connectionWatchdog) {
      clearTimeout(connectionWatchdog)
      connectionWatchdog = null
    }
  }

  // ── Keeping up after sleep / network loss ───────────────────────────

  function startFallbackPoll() {
    if (fallbackPoll) return
    // The socket is unreachable: keep the inbox fresh by polling until it comes back.
    fallbackPoll = setInterval(() => {
      if (echoState() === 'connected') { stopFallbackPoll(); return }
      if (document.visibilityState === 'visible') void syncNow()
    }, 15000)
  }

  function stopFallbackPoll() {
    if (fallbackPoll) {
      clearInterval(fallbackPoll)
      fallbackPoll = null
    }
  }

  function installLifecycleHandlers() {
    if (lifecycleInstalled || typeof window === 'undefined') return
    lifecycleInstalled = true

    document.addEventListener('visibilitychange', () => {
      if (!connectedUserId.value) return
      if (document.visibilityState === 'hidden') {
        hiddenSince = Date.now()
        return
      }
      const wasAwayLong = hiddenSince > 0 && Date.now() - hiddenSince > 20000
      hiddenSince = 0
      if (echoState() !== 'connected') {
        reconnectEcho()
        void syncNow()
      } else if (wasAwayLong) {
        void syncNow()
      }
      markCurrentReadIfViewing()
    })

    window.addEventListener('focus', () => markCurrentReadIfViewing())

    window.addEventListener('online', () => {
      if (!connectedUserId.value) return
      reconnectEcho()
      void syncNow()
    })
  }

  /** Is the user looking at this conversation right now (messages page, chat open, tab visible)? */
  function isViewingChat(chatId: number): boolean {
    return viewActive.value
      && currentChatId.value === chatId
      && typeof document !== 'undefined'
      && document.visibilityState === 'visible'
  }

  function markCurrentReadIfViewing() {
    const id = currentChatId.value
    if (id == null || !isViewingChat(id)) return
    const chat = chats.value.find(c => c.id === id)
    if (chat && chat.unread_count > 0) void markAsRead(id)
  }

  function setViewActive(active: boolean) {
    viewActive.value = active
    if (active) markCurrentReadIfViewing()
  }

  /**
   * Re-fetch the chat list (and the open conversation) from the API. Used after reconnecting,
   * waking from sleep, or while the socket is unreachable. Alerts once for messages that
   * arrived in the meantime.
   */
  function syncNow(): Promise<void> {
    if (syncing) return syncing
    syncing = (async () => {
      const auth = useAuthStore()
      if (!auth.user) return
      const before = new Map(chats.value.map(c => [c.id, c.latest_message?.id ?? 0]))
      await fetchChats({ silent: true })
      for (const chat of chats.value) {
        const latest = chat.latest_message
        if (!latest || latest.sender_id === auth.user.id || latest.is_deleted) continue
        if ((before.get(chat.id) ?? 0) >= latest.id || chat.unread_count <= 0) continue
        if (!before.has(chat.id) && before.size === 0) continue
        if (isViewingChat(chat.id)) continue
        alertNewMessage(chat, {
          message_id: latest.id,
          sender_id: latest.sender_id,
          sender_name: latest.sender_name,
          sender_avatar: chat.type === 'private' ? chat.other_user?.avatar : null,
          body: latest.body,
        }, true)
      }
      if (currentChatId.value) await mergeLatestMessages(currentChatId.value)
      markCurrentReadIfViewing()
    })().finally(() => { syncing = null })
    return syncing
  }

  /** Merge the newest page of messages into the open conversation without losing older pages. */
  async function mergeLatestMessages(chatId: number) {
    try {
      const { data } = await api.get(`/nexus/chats/${chatId}/messages`, { params: { limit: 50 } })
      if (currentChatId.value !== chatId) return
      const fresh: ChatMessage[] = data.data || []
      const byId = new Map(messages.value.filter(m => m.id > 0).map(m => [m.id, m]))
      for (const m of fresh) {
        processedMessageIds.value.add(m.id)
        byId.set(m.id, m)
      }
      const pending = messages.value.filter(m => m.id < 0)
      messages.value = [...[...byId.values()].sort((a, b) => a.id - b.id), ...pending]
    } catch (err) {
      console.error('Failed to refresh messages:', err)
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

    ;(channel as any).listenForWhisper?.('typing', (payload: any) => {
      handleTypingEvent(payload)
    })

    subscribedChatChannels.value.add(chatId)
    chatChannels.value.set(chatId, channel)
  }

  function unsubscribeFromChatChannel(chatId: number) {
    if (!subscribedChatChannels.value.has(chatId)) return
    const echo = getEcho()
    echo.leave(`chat.${chatId}`)
    subscribedChatChannels.value.delete(chatId)
    chatChannels.value.delete(chatId)
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

  async function fetchChats(options?: { silent?: boolean }) {
    if (!options?.silent) loading.value = true
    try {
      const { data } = await api.get('/nexus/chats')
      chats.value = data.data

      // Subscribe to all chat channels
      chats.value.forEach(chat => subscribeToChatChannel(chat.id))
      updateOnlineStatus()
    } catch (err) {
      console.error('Failed to fetch chats:', err)
    } finally {
      if (!options?.silent) loading.value = false
    }
  }

  // Backward-compatible aliases (older components/composables still call these names).
  async function fetchConversations() {
    await fetchChats()
  }

  async function getOrCreateConversation(userId: number): Promise<number | null> {
    const chat = await getOrCreateChat(userId)
    return chat?.id ?? null
  }

  function clearCurrentConversation() {
    deselectChat()
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
      void markAsRead(chatId)
    }
    useNotificationStore().dismissChatToast(chatId)
  }

  function deselectChat() {
    currentChatId.value = null
    messages.value = []
    processedMessageIds.value.clear()
    typingUsers.value.clear()
  }

  // ── Fetch Messages ───────────────────────────────────────────────────

  async function fetchMessages(chatId: number, before?: number, options?: { silent?: boolean }) {
    if (!options?.silent) messagesLoading.value = true
    try {
      const params: any = { limit: 50 }
      if (before) params.before = before

      const { data } = await api.get(`/nexus/chats/${chatId}/messages`, { params })

      const newMessages: ChatMessage[] = data.data
      newMessages.forEach(m => processedMessageIds.value.add(m.id))

      if (currentChatId.value !== chatId) return
      if (before) {
        messages.value = [...newMessages, ...messages.value]
      } else {
        // Keep anything that arrived over the socket (or is still sending) while this
        // request was in flight.
        const fetchedIds = new Set(newMessages.map(m => m.id))
        const newest = newMessages.length ? newMessages[newMessages.length - 1].id : 0
        const arrived = messages.value.filter(m => m.id < 0 || (m.id > newest && !fetchedIds.has(m.id)))
        messages.value = [...newMessages, ...arrived]
      }

      hasMoreMessages.value = data.has_more
    } catch (err) {
      console.error('Failed to fetch messages:', err)
    } finally {
      if (!options?.silent) messagesLoading.value = false
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

      // Replace optimistic message with real one (another tab's echo may have added it already)
      processedMessageIds.value.add(realMessage.id)
      if (chatId === currentChatId.value) {
        const idx = messages.value.findIndex(m => m.id === tempId)
        const already = messages.value.some(m => m.id === realMessage.id)
        if (idx !== -1 && already) {
          messages.value.splice(idx, 1)
        } else if (idx !== -1) {
          messages.value[idx] = realMessage
        } else if (!already) {
          messages.value.push(realMessage)
        }
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
      refreshPreviewIfLatest(updated)
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
        refreshPreviewIfLatest(messages.value[idx])
      }
      return true
    } catch (err) {
      console.error('Failed to delete message:', err)
      return false
    }
  }

  // ── Mark as Read ─────────────────────────────────────────────────────

  async function markAsRead(chatId: number) {
    const chat = chats.value.find(c => c.id === chatId)
    if (chat) chat.unread_count = 0
    try {
      await api.post(`/nexus/chats/${chatId}/read`)
    } catch (err) {
      console.error('Failed to mark as read:', err)
    }
  }

  // ── Toggle Reaction ──────────────────────────────────────────────────

  async function toggleReaction(messageId: number, emoji: string) {
    try {
      const { data } = await api.post(`/nexus/messages/${messageId}/reactions`, { emoji })
      // Our own socket is left out of the broadcast, so apply the change locally.
      const auth = useAuthStore()
      if (auth.user && (data.action === 'added' || data.action === 'removed')) {
        handleReaction({ message_id: messageId, user_id: auth.user.id, user_name: auth.user.name, emoji, action: data.action })
      }
      return data.action
    } catch (err) {
      console.error('Failed to toggle reaction:', err)
      return null
    }
  }

  // ── Typing Indicator ─────────────────────────────────────────────────

  let typingTimeout: ReturnType<typeof setTimeout> | null = null

  function emitTyping(chatId: number) {
    const auth = useAuthStore()
    const channel = chatChannels.value.get(chatId) as any
    if (!auth.user || !channel?.whisper) return

    channel.whisper('typing', {
      chat_id: chatId,
      user_id: auth.user.id,
      user_name: auth.user.name,
      is_typing: true,
    })

    // Auto-stop after 3 seconds
    if (typingTimeout) clearTimeout(typingTimeout)
    typingTimeout = setTimeout(() => {
      stopTyping(chatId)
    }, 3000)
  }

  function stopTyping(chatId: number) {
    if (typingTimeout) clearTimeout(typingTimeout)
    const auth = useAuthStore()
    const channel = chatChannels.value.get(chatId) as any
    if (!auth.user || !channel?.whisper) return

    channel.whisper('typing', {
      chat_id: chatId,
      user_id: auth.user.id,
      user_name: auth.user.name,
      is_typing: false,
    })
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
    if (!msg || typeof msg.id !== 'number') return
    // Dedup
    if (processedMessageIds.value.has(msg.id)) return
    processedMessageIds.value.add(msg.id)
    const auth = useAuthStore()
    const mine = msg.sender_id === auth.user?.id

    if (msg.chat_id === currentChatId.value && !messages.value.some(m => m.id === msg.id)) {
      // Our own message from this tab may still be the optimistic copy: replace it.
      const tempIdx = mine
        ? messages.value.findIndex(m => m.id < 0 && (m.body || '') === (msg.body || ''))
        : -1
      if (tempIdx !== -1) messages.value[tempIdx] = msg
      else messages.value.push(msg)
    }

    updateChatPreview(msg.chat_id, msg)

    if (!mine) {
      const chat = chats.value.find(c => c.id === msg.chat_id)
      if (!chat) {
        void fetchChats({ silent: true })
      } else {
        alertNewMessage(chat, {
          message_id: msg.id,
          sender_id: msg.sender_id,
          sender_name: msg.sender?.name || '',
          sender_avatar: msg.sender?.avatar,
          body: msg.body,
          type: msg.type,
        })
      }
    }

    // Clear typing for this user
    const typing = typingUsers.value.get(msg.sender_id)
    if (typing?.timeout) clearTimeout(typing.timeout)
    typingUsers.value.delete(msg.sender_id)
  }

  interface NewMessageInfo {
    message_id: number
    sender_id: number
    sender_name: string
    sender_avatar?: string | null
    body: string | null
    type?: string
    created_at?: string
  }

  /**
   * One alert per message, however many events announce it (chat channel, personal channel,
   * stored notification or a catch-up sync): unread count + toast/sound/system notification.
   */
  function alertNewMessage(chat: Chat, info: NewMessageInfo, fromSync = false) {
    if (alertedMessageIds.has(info.message_id)) return
    alertedMessageIds.add(info.message_id)

    if (isViewingChat(chat.id)) {
      void markAsRead(chat.id)
      useNotificationStore().notifyChatMessage({
        chatId: chat.id,
        senderName: info.sender_name,
        senderAvatar: info.sender_avatar,
        body: info.body,
        type: info.type,
        viewing: true,
      })
      return
    }

    // A catch-up sync already carries the server's unread count.
    if (!fromSync) chat.unread_count = (chat.unread_count || 0) + 1
    if (chat.is_muted) return
    useNotificationStore().notifyChatMessage({
      chatId: chat.id,
      senderName: chat.type === 'group' && chat.name ? `${info.sender_name} · ${chat.name}` : info.sender_name,
      senderAvatar: info.sender_avatar,
      body: info.body,
      type: info.type,
      viewing: false,
    })
  }

  /**
   * A message was announced on the personal channel (or as a stored notification). The full
   * message normally arrives on the chat channel too; if it does not (channel not subscribed
   * yet, missed while reconnecting) fetch it.
   */
  function handleNewMessageSignal(data: any) {
    const chatId = Number(data?.chat_id)
    const messageId = Number(data?.message_id)
    if (!chatId || !messageId) return
    const auth = useAuthStore()
    if (Number(data.sender_id) === auth.user?.id) return

    const chat = chats.value.find(c => c.id === chatId)
    if (!chat) {
      // A chat we have not loaded yet (e.g. just created by the other person).
      void fetchChats({ silent: true }).then(() => {
        const loaded = chats.value.find(c => c.id === chatId)
        if (loaded) {
          // The list already contains the server's unread count for this chat.
          alertedMessageIds.add(messageId)
          useNotificationStore().notifyChatMessage({
            chatId,
            senderName: data.sender_name || 'New message',
            senderAvatar: data.sender_avatar,
            body: data.body ?? null,
            type: data.type,
            viewing: isViewingChat(chatId),
          })
        }
      })
      return
    }

    if (!processedMessageIds.value.has(messageId) && (chat.latest_message?.id ?? 0) < messageId) {
      chat.last_message_at = data.created_at || new Date().toISOString()
      chat.latest_message = {
        id: messageId,
        body: data.body ?? null,
        type: data.type || 'text',
        sender_id: Number(data.sender_id),
        sender_name: data.sender_name || '',
        is_deleted: false,
        created_at: chat.last_message_at!,
      }
    }

    alertNewMessage(chat, {
      message_id: messageId,
      sender_id: Number(data.sender_id),
      sender_name: data.sender_name || '',
      sender_avatar: data.sender_avatar,
      body: data.body ?? null,
      type: data.type,
    })

    // The open conversation should show it even if the chat-channel event never comes.
    if (chatId === currentChatId.value) {
      setTimeout(() => {
        if (currentChatId.value === chatId && !messages.value.some(m => m.id === messageId)) {
          void mergeLatestMessages(chatId)
        }
      }, 400)
    }
  }

  function handleChatNotification(event: any) {
    if (event.type === 'new_message') {
      handleNewMessageSignal(event.data)
    } else if (event.type === 'chat_created') {
      // New chat was created with this user
      const chatData = event.data.chat
      if (chatData && !chats.value.find(c => c.id === chatData.id)) {
        chats.value.unshift(chatData)
        subscribeToChatChannel(chatData.id)
      }
    }
  }

  function handleReadReceipt(event: any) {
    const { message_ids } = event
    if (!Array.isArray(message_ids)) return

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

    if (!Array.isArray(msg.reactions)) msg.reactions = []
    if (action === 'added') {
      const existing = msg.reactions.find(r => r.emoji === emoji)
      if (existing?.users.some(u => u.id === user_id)) return
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
      if (existing && existing.users.some(u => u.id === user_id)) {
        existing.count--
        existing.users = existing.users.filter(u => u.id !== user_id)
        if (existing.count <= 0) {
          msg.reactions = msg.reactions.filter(r => r.emoji !== emoji)
        }
      }
    }
  }

  function handleMessageUpdate(event: any) {
    const { message } = event
    if (!message) return
    const idx = messages.value.findIndex(m => m.id === message.id)
    if (idx !== -1) {
      messages.value[idx] = message
    }
    refreshPreviewIfLatest(message)
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

  /** Keep the conversation list preview in sync when its latest message is edited or deleted. */
  function refreshPreviewIfLatest(msg: ChatMessage) {
    const chat = chats.value.find(c => c.id === msg.chat_id)
    if (chat?.latest_message && chat.latest_message.id === msg.id) {
      chat.latest_message = {
        ...chat.latest_message,
        body: msg.is_deleted ? null : msg.body,
        is_deleted: msg.is_deleted,
      }
    }
  }

  function requestNotificationPermission() {
    useNotificationStore().requestBrowserPermission()
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
    alertedMessageIds.clear()
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
    viewActive,
    typingUsers,
    onlineUserIds,

    // Computed
    currentChat,
    currentConversation,
    sortedChats,
    conversations,
    totalUnread,
    totalUnreadCount,
    currentTypingUsers,
    currentConversationId,

    // Methods
    connect,
    disconnect,
    fetchChats,
    fetchConversations,
    getOrCreateChat,
    getOrCreateConversation,
    selectChat,
    deselectChat,
    clearCurrentConversation,
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
    setViewActive,
    syncNow,
    handleNewMessageSignal,
    $reset,
  }
})
