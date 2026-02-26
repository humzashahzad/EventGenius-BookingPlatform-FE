<template>
  <!--
    ╔══════════════════════════════════════════════════════════════╗
    ║  NexusChat — Full Messages View                             ║
    ║  Real-time chat powered by Laravel Reverb + Echo            ║
    ╚══════════════════════════════════════════════════════════════╝
  -->
  <div class="nexus-chat">
    <div class="nexus-container">

      <!-- ─── Left Sidebar — Chat List ──────────────────────────────── -->
      <aside class="chat-sidebar" :class="{ 'mobile-hidden': chatStore.currentChatId }">
        <!-- Header -->
        <div class="sidebar-header">
          <h2 class="sidebar-title">
            <component :is="MessageCircle" :size="20" class="title-icon" />
            Messages
          </h2>
          <span class="connection-badge" :class="'conn-' + chatStore.connectionStatus">
            <span class="conn-dot"></span>
            {{ chatStore.connectionStatus === 'connected' ? 'Live' : chatStore.connectionStatus === 'connecting' ? 'Connecting' : 'Offline' }}
          </span>
        </div>

        <!-- User Search -->
        <div class="search-section">
          <div class="search-box">
            <component :is="Search" :size="16" class="search-icon" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search users to start a chat..."
              class="search-input"
              autocomplete="off"
              @input="onSearchInput"
            />
            <button v-if="searchQuery" @click="clearSearch" class="search-clear">
              <component :is="X" :size="14" />
            </button>
          </div>

          <!-- Search Results Dropdown -->
          <div v-if="searchQuery && (searchResults.length > 0 || searchLoading)" class="search-dropdown">
            <div v-if="searchLoading" class="search-loading">
              <component :is="Loader2" :size="16" class="animate-spin" /> Searching...
            </div>
            <button
              v-for="user in searchResults"
              :key="user.id"
              @click="startChat(user)"
              class="search-result"
            >
              <div class="avatar-wrap">
                <img v-if="user.avatar" :src="getStorageUrl(user.avatar)" :alt="user.name" class="avatar" />
                <div v-else class="avatar-placeholder">{{ user.name.charAt(0) }}</div>
                <span v-if="user.is_online" class="online-dot"></span>
              </div>
              <div class="search-result-info">
                <span class="search-result-name">{{ user.name }}</span>
                <span class="search-result-role">{{ formatRole(user.role) }}</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Chat List -->
        <div class="chat-list" ref="chatListRef">
          <div v-if="chatStore.loading" class="chat-list-loading">
            <component :is="Loader2" :size="20" class="animate-spin" /> Loading chats...
          </div>

          <div v-else-if="chatStore.sortedChats.length === 0" class="chat-list-empty">
            <component :is="MessageCircle" :size="40" class="empty-icon" />
            <p>No conversations yet</p>
            <p class="empty-hint">Search for a user above to start chatting</p>
          </div>

          <button
            v-for="chat in filteredChats"
            :key="chat.id"
            @click="openChat(chat.id)"
            class="chat-item"
            :class="{
              'chat-item-active': chat.id === chatStore.currentChatId,
              'chat-item-unread': chat.unread_count > 0,
            }"
          >
            <div class="avatar-wrap">
              <img
                v-if="chatAvatar(chat)"
                :src="getStorageUrl(chatAvatar(chat)!)"
                :alt="chatName(chat)"
                class="avatar"
              />
              <div v-else class="avatar-placeholder">{{ chatName(chat).charAt(0) }}</div>
              <span v-if="chat.type === 'private' && chat.other_user?.is_online" class="online-dot"></span>
            </div>

            <div class="chat-item-info">
              <div class="chat-item-top">
                <span class="chat-item-name">{{ chatName(chat) }}</span>
                <span class="chat-item-time">{{ formatRelativeTime(chat.last_message_at || chat.created_at) }}</span>
              </div>
              <div class="chat-item-bottom">
                <span class="chat-item-preview" :class="{ 'preview-unread': chat.unread_count > 0 }">
                  <template v-if="chat.latest_message">
                    <span v-if="chat.latest_message.is_deleted" class="italic">Message deleted</span>
                    <span v-else>{{ messagePreview(chat) }}</span>
                  </template>
                  <template v-else>
                    <span class="italic">No messages yet</span>
                  </template>
                </span>
                <span v-if="chat.unread_count > 0" class="unread-badge">{{ chat.unread_count > 99 ? '99+' : chat.unread_count }}</span>
              </div>
            </div>
          </button>
        </div>
      </aside>

      <!-- ─── Right Panel — Chat Messages ───────────────────────────── -->
      <main class="chat-panel" :class="{ 'mobile-hidden': !chatStore.currentChatId }">
        <!-- No Chat Selected -->
        <div v-if="!chatStore.currentChatId" class="no-chat-selected">
          <component :is="MessageCircle" :size="64" class="no-chat-icon" />
          <h3>Select a conversation</h3>
          <p>Choose a chat from the sidebar or search for a user to start messaging</p>
        </div>

        <!-- Chat Active -->
        <template v-else>
          <!-- Chat Header -->
          <div class="chat-header">
            <button @click="goBack" class="back-btn md:hidden">
              <component :is="ArrowLeft" :size="20" />
            </button>

            <div class="avatar-wrap">
              <img
                v-if="currentChatAvatar"
                :src="getStorageUrl(currentChatAvatar)"
                :alt="currentChatName"
                class="avatar"
              />
              <div v-else class="avatar-placeholder sm">{{ currentChatName.charAt(0) }}</div>
              <span v-if="currentOtherUser?.is_online" class="online-dot"></span>
            </div>

            <div class="chat-header-info">
              <h3 class="chat-header-name">{{ currentChatName }}</h3>
              <p class="chat-header-status">
                <template v-if="chatStore.currentTypingUsers.length > 0">
                  <span class="typing-text">
                    {{ chatStore.currentTypingUsers.map(t => t.userName).join(', ') }}
                    {{ chatStore.currentTypingUsers.length === 1 ? 'is' : 'are' }} typing
                    <span class="typing-dots"><span>.</span><span>.</span><span>.</span></span>
                  </span>
                </template>
                <template v-else-if="chatStore.currentChat?.type === 'private'">
                  <span v-if="currentOtherUser?.is_online" class="status-online">Online</span>
                  <span v-else-if="currentOtherUser?.last_seen_at" class="status-offline">
                    Last seen {{ formatRelativeTime(currentOtherUser.last_seen_at) }}
                  </span>
                  <span v-else class="status-offline">Offline</span>
                </template>
              </p>
            </div>
          </div>

          <!-- Messages Area -->
          <div class="messages-area" ref="messagesAreaRef" @scroll="onMessagesScroll">
            <!-- Load More -->
            <div v-if="chatStore.hasMoreMessages" class="load-more">
              <button @click="chatStore.loadOlderMessages()" :disabled="chatStore.messagesLoading" class="load-more-btn">
                <component :is="Loader2" v-if="chatStore.messagesLoading" :size="14" class="animate-spin" />
                Load older messages
              </button>
            </div>

            <!-- Messages Loading -->
            <div v-if="chatStore.messagesLoading && chatStore.messages.length === 0" class="messages-loading">
              <component :is="Loader2" :size="24" class="animate-spin" /> Loading messages...
            </div>

            <!-- Empty State -->
            <div v-else-if="chatStore.messages.length === 0" class="messages-empty">
              <component :is="Send" :size="32" class="empty-send-icon" />
              <p>No messages yet. Say hello!</p>
            </div>

            <!-- Message List -->
            <div v-for="(msg, idx) in chatStore.messages" :key="msg.id" class="message-group">
              <!-- Date Separator -->
              <div v-if="showDateSeparator(idx)" class="date-separator">
                <span>{{ formatDateLabel(msg.created_at) }}</span>
              </div>

              <!-- Message Bubble -->
              <div
                class="message-row"
                :class="{
                  'message-own': msg.sender_id === authStore.user?.id,
                  'message-other': msg.sender_id !== authStore.user?.id,
                }"
              >
                <!-- Avatar (for other users) -->
                <img
                  v-if="msg.sender_id !== authStore.user?.id && showAvatar(idx)"
                  :src="getStorageUrl(msg.sender.avatar)"
                  :alt="msg.sender.name"
                  class="message-avatar"
                />
                <div v-else-if="msg.sender_id !== authStore.user?.id && !showAvatar(idx)" class="message-avatar-spacer"></div>

                <div class="message-bubble-wrap">
                  <!-- Reply Preview -->
                  <div v-if="msg.reply_to" class="reply-preview" @click="scrollToMessage(msg.reply_to.id)">
                    <div class="reply-bar"></div>
                    <div class="reply-content">
                      <span class="reply-name">{{ msg.reply_to.sender_name }}</span>
                      <span class="reply-text">{{ msg.reply_to.body || '[Attachment]' }}</span>
                    </div>
                  </div>

                  <!-- Forwarded Label -->
                  <div v-if="msg.forwarded_from" class="forwarded-label">
                    <component :is="Forward" :size="12" /> Forwarded
                  </div>

                  <!-- Bubble -->
                  <div
                    class="message-bubble"
                    :class="{ 'bubble-deleted': msg.is_deleted }"
                    @contextmenu.prevent="showMessageMenu($event, msg)"
                  >
                    <!-- Deleted Message -->
                    <template v-if="msg.is_deleted">
                      <span class="deleted-text">
                        <component :is="Ban" :size="14" />
                        This message was deleted
                      </span>
                    </template>

                    <!-- Normal Message -->
                    <template v-else>
                      <!-- Attachments -->
                      <div v-if="msg.attachments && msg.attachments.length > 0" class="message-attachments">
                        <template v-for="att in msg.attachments" :key="att.path">
                          <img
                            v-if="att.mime?.startsWith('image/')"
                            :src="getStorageUrl(att.path)"
                            :alt="att.name"
                            class="attachment-image"
                            @click="openAttachment(att)"
                          />
                          <a
                            v-else
                            :href="getStorageUrl(att.path)"
                            target="_blank"
                            class="attachment-file"
                          >
                            <component :is="FileIcon" :size="16" />
                            <span>{{ att.name }}</span>
                          </a>
                        </template>
                      </div>

                      <!-- Text -->
                      <p v-if="msg.body" class="message-text">{{ msg.body }}</p>

                      <!-- Meta -->
                      <div class="message-meta">
                        <span v-if="msg.is_edited" class="edited-label">edited</span>
                        <span class="message-time">{{ formatTime(msg.created_at) }}</span>

                        <!-- Status Ticks (own messages) -->
                        <span v-if="msg.sender_id === authStore.user?.id" class="status-ticks">
                          <component :is="Check" v-if="msg.status === 'sent'" :size="14" class="tick-sent" />
                          <component :is="CheckCheck" v-else-if="msg.status === 'delivered'" :size="14" class="tick-delivered" />
                          <component :is="CheckCheck" v-else-if="msg.status === 'read'" :size="14" class="tick-read" />
                          <component :is="Check" v-else :size="14" class="tick-sent" />
                        </span>
                      </div>
                    </template>
                  </div>

                  <!-- Reactions -->
                  <div v-if="msg.reactions && msg.reactions.length > 0" class="message-reactions">
                    <button
                      v-for="r in msg.reactions"
                      :key="r.emoji"
                      @click="chatStore.toggleReaction(msg.id, r.emoji)"
                      class="reaction-pill"
                      :class="{ 'reaction-own': r.users.some(u => u.id === authStore.user?.id) }"
                      :title="r.users.map(u => u.name).join(', ')"
                    >
                      {{ r.emoji }} {{ r.count }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Typing Indicator -->
            <div v-if="chatStore.currentTypingUsers.length > 0" class="typing-indicator-row">
              <div class="typing-bubble">
                <div class="typing-animation">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>

            <div ref="messagesEndRef"></div>
          </div>

          <!-- Reply Bar -->
          <div v-if="replyingTo" class="reply-bar-input">
            <div class="reply-bar-content">
              <component :is="Reply" :size="14" />
              <span class="reply-bar-name">{{ replyingTo.sender.name }}</span>
              <span class="reply-bar-text">{{ replyingTo.body || '[Attachment]' }}</span>
            </div>
            <button @click="replyingTo = null" class="reply-bar-close">
              <component :is="X" :size="14" />
            </button>
          </div>

          <!-- Message Input -->
          <div class="message-input-area">
            <!-- File Preview -->
            <div v-if="selectedFiles.length > 0" class="file-preview">
              <div v-for="(file, i) in selectedFiles" :key="i" class="file-preview-item">
                <img v-if="file.type.startsWith('image/')" :src="filePreviewUrl(file)" class="file-preview-img" />
                <component v-else :is="FileIcon" :size="20" />
                <span class="file-preview-name">{{ file.name }}</span>
                <button @click="removeFile(i)" class="file-remove">
                  <component :is="X" :size="12" />
                </button>
              </div>
            </div>

            <div class="input-row">
              <!-- Emoji (future) -->
              <button @click="showEmojiPicker = !showEmojiPicker" class="input-action-btn" title="Reactions">
                <component :is="Smile" :size="20" />
              </button>

              <!-- File Attach -->
              <button @click="triggerFileInput" class="input-action-btn" title="Attach files">
                <component :is="Paperclip" :size="20" />
              </button>
              <input ref="fileInputRef" type="file" multiple @change="onFilesSelected" class="hidden" accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar" />

              <!-- Text Input -->
              <div class="input-wrap">
                <textarea
                  ref="messageInputRef"
                  v-model="messageText"
                  placeholder="Type a message..."
                  class="message-input"
                  rows="1"
                  @keydown="onInputKeydown"
                  @input="onInputChange"
                ></textarea>
              </div>

              <!-- Send -->
              <button @click="handleSend" class="send-btn" :disabled="!canSend">
                <component :is="Send" :size="20" />
              </button>
            </div>
          </div>

          <!-- Quick Reaction Picker (simplified) -->
          <div v-if="contextMenu.show" class="context-menu" :style="contextMenuStyle" @click.stop>
            <div class="context-reactions">
              <button v-for="emoji in quickReactions" :key="emoji" @click="reactToMessage(emoji)" class="quick-reaction">
                {{ emoji }}
              </button>
            </div>
            <div class="context-actions">
              <button v-if="contextMenu.message?.sender_id === authStore.user?.id" @click="startEdit" class="context-action">
                <component :is="Pencil" :size="14" /> Edit
              </button>
              <button @click="startReply" class="context-action">
                <component :is="Reply" :size="14" /> Reply
              </button>
              <button v-if="contextMenu.message?.sender_id === authStore.user?.id" @click="confirmDelete" class="context-action context-danger">
                <component :is="Trash2" :size="14" /> Delete
              </button>
            </div>
          </div>
        </template>
      </main>
    </div>

    <!-- Overlay to close context menu -->
    <div v-if="contextMenu.show" class="context-overlay" @click="contextMenu.show = false"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useChatStore, type Chat, type ChatMessage, type ChatUser } from '@/stores/chat'
import { useAuthStore } from '@/stores/auth'
import { getStorageUrl } from '@/lib/storageUrl'
import {
  MessageCircle, Search, X, Loader2, Send, ArrowLeft, Check, CheckCheck,
  Paperclip, Smile, Pencil, Reply, Trash2, Forward, Ban, FileIcon,
} from 'lucide-vue-next'
import { formatDistanceToNow, format, isToday, isYesterday, isSameDay } from 'date-fns'

const chatStore = useChatStore()
const authStore = useAuthStore()

// ── Search ──────────────────────────────────────────────────────────────
const searchQuery = ref('')
const searchResults = ref<ChatUser[]>([])
const searchLoading = ref(false)
let searchTimeout: ReturnType<typeof setTimeout> | null = null

function onSearchInput() {
  if (searchTimeout) clearTimeout(searchTimeout)
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    return
  }
  searchLoading.value = true
  searchTimeout = setTimeout(async () => {
    searchResults.value = await chatStore.searchUsers(searchQuery.value.trim())
    searchLoading.value = false
  }, 300)
}

function clearSearch() {
  searchQuery.value = ''
  searchResults.value = []
}

async function startChat(user: ChatUser) {
  clearSearch()
  const chat = await chatStore.getOrCreateChat(user.id)
  if (chat) {
    chatStore.selectChat(chat.id)
    scrollToBottom()
  }
}

// ── Chat List ───────────────────────────────────────────────────────────
const chatListRef = ref<HTMLElement | null>(null)

const filteredChats = computed(() => {
  if (!searchQuery.value) return chatStore.sortedChats
  const q = searchQuery.value.toLowerCase()
  return chatStore.sortedChats.filter(c => {
    const name = chatName(c).toLowerCase()
    return name.includes(q)
  })
})

function chatName(chat: Chat): string {
  if (chat.type === 'group') return chat.name || 'Group Chat'
  return chat.other_user?.name || 'Unknown'
}

function chatAvatar(chat: Chat): string | null {
  if (chat.type === 'group') return chat.avatar
  return chat.other_user?.avatar || null
}

function messagePreview(chat: Chat): string {
  const msg = chat.latest_message
  if (!msg) return ''
  const isMine = msg.sender_id === authStore.user?.id
  const prefix = chat.type === 'group' ? (isMine ? 'You: ' : `${msg.sender_name}: `) : (isMine ? 'You: ' : '')
  const text = msg.body || (msg.type === 'image' ? 'Photo' : msg.type === 'file' ? 'File' : 'Attachment')
  return prefix + (text.length > 40 ? text.substring(0, 40) + '...' : text)
}

function openChat(chatId: number) {
  chatStore.selectChat(chatId)
  nextTick(() => scrollToBottom())
}

function goBack() {
  chatStore.deselectChat()
}

// ── Messages ────────────────────────────────────────────────────────────
const messagesAreaRef = ref<HTMLElement | null>(null)
const messagesEndRef = ref<HTMLElement | null>(null)
const messageInputRef = ref<HTMLTextAreaElement | null>(null)
const messageText = ref('')
const selectedFiles = ref<File[]>([])
const fileInputRef = ref<HTMLInputElement | null>(null)
const replyingTo = ref<ChatMessage | null>(null)
const editingMessage = ref<ChatMessage | null>(null)
const showEmojiPicker = ref(false)

const canSend = computed(() => messageText.value.trim() || selectedFiles.value.length > 0)

// Computed for current chat info
const currentChatName = computed(() => {
  const c = chatStore.currentChat
  return c ? chatName(c) : ''
})

const currentChatAvatar = computed(() => {
  const c = chatStore.currentChat
  return c ? chatAvatar(c) : null
})

const currentOtherUser = computed(() => {
  return chatStore.currentChat?.other_user || null
})

// ── Send Message ────────────────────────────────────────────────────────
async function handleSend() {
  if (!canSend.value || !chatStore.currentChatId) return

  const body = messageText.value.trim()
  const files = [...selectedFiles.value]
  const replyId = replyingTo.value?.id

  // Clear input immediately (optimistic)
  messageText.value = ''
  selectedFiles.value = []
  replyingTo.value = null
  resetTextarea()

  if (editingMessage.value) {
    // Edit mode
    await chatStore.editMessage(editingMessage.value.id, body)
    editingMessage.value = null
  } else {
    // New message
    await chatStore.sendMessage(chatStore.currentChatId, body, {
      replyToId: replyId,
      files: files.length > 0 ? files : undefined,
    })
  }

  nextTick(() => scrollToBottom())
}

function onInputKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

function onInputChange() {
  autoResizeTextarea()
  if (chatStore.currentChatId) {
    chatStore.emitTyping(chatStore.currentChatId)
  }
}

function autoResizeTextarea() {
  const el = messageInputRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 120) + 'px'
}

function resetTextarea() {
  const el = messageInputRef.value
  if (el) el.style.height = 'auto'
}

// ── File Handling ───────────────────────────────────────────────────────
function triggerFileInput() {
  fileInputRef.value?.click()
}

function onFilesSelected(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files) return
  const newFiles = Array.from(input.files).slice(0, 5 - selectedFiles.value.length)
  selectedFiles.value.push(...newFiles)
  input.value = '' // Reset
}

function removeFile(index: number) {
  selectedFiles.value.splice(index, 1)
}

function filePreviewUrl(file: File): string {
  return URL.createObjectURL(file)
}

function openAttachment(att: { path: string; name: string; mime?: string }) {
  window.open(getStorageUrl(att.path), '_blank')
}

// ── Context Menu (right-click on message) ───────────────────────────────
const contextMenu = ref<{ show: boolean; x: number; y: number; message: ChatMessage | null }>({
  show: false, x: 0, y: 0, message: null,
})
const quickReactions = ['👍', '❤️', '😂', '😮', '😢', '🙏']

const contextMenuStyle = computed(() => ({
  top: contextMenu.value.y + 'px',
  left: contextMenu.value.x + 'px',
}))

function showMessageMenu(e: MouseEvent, msg: ChatMessage) {
  if (msg.is_deleted) return
  contextMenu.value = {
    show: true,
    x: Math.min(e.clientX, window.innerWidth - 200),
    y: Math.min(e.clientY, window.innerHeight - 200),
    message: msg,
  }
}

function reactToMessage(emoji: string) {
  if (contextMenu.value.message) {
    chatStore.toggleReaction(contextMenu.value.message.id, emoji)
  }
  contextMenu.value.show = false
}

function startReply() {
  replyingTo.value = contextMenu.value.message
  contextMenu.value.show = false
  messageInputRef.value?.focus()
}

function startEdit() {
  const msg = contextMenu.value.message
  if (msg) {
    editingMessage.value = msg
    messageText.value = msg.body || ''
    contextMenu.value.show = false
    messageInputRef.value?.focus()
  }
}

function confirmDelete() {
  const msg = contextMenu.value.message
  if (msg && confirm('Delete this message?')) {
    chatStore.deleteMessage(msg.id)
  }
  contextMenu.value.show = false
}

// ── Scroll Logic ────────────────────────────────────────────────────────
function scrollToBottom() {
  nextTick(() => {
    messagesEndRef.value?.scrollIntoView({ behavior: 'smooth' })
  })
}

function scrollToMessage(messageId: number) {
  const el = document.querySelector(`[data-message-id="${messageId}"]`)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

function onMessagesScroll() {
  // Could implement infinite scroll here
}

// Auto-scroll when new messages arrive
watch(() => chatStore.messages.length, () => {
  const area = messagesAreaRef.value
  if (!area) return
  // Only auto-scroll if user is near the bottom
  const isNearBottom = area.scrollHeight - area.scrollTop - area.clientHeight < 150
  if (isNearBottom) {
    scrollToBottom()
  }
})

// ── Date / Time Helpers ─────────────────────────────────────────────────
function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return ''
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
  } catch {
    return ''
  }
}

function formatTime(dateStr: string): string {
  if (!dateStr) return ''
  return format(new Date(dateStr), 'HH:mm')
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr)
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'EEEE, MMMM d, yyyy')
}

function showDateSeparator(idx: number): boolean {
  if (idx === 0) return true
  const prev = chatStore.messages[idx - 1]
  const curr = chatStore.messages[idx]
  return !isSameDay(new Date(prev.created_at), new Date(curr.created_at))
}

function showAvatar(idx: number): boolean {
  if (idx === 0) return true
  const prev = chatStore.messages[idx - 1]
  const curr = chatStore.messages[idx]
  return prev.sender_id !== curr.sender_id
}

function formatRole(role?: string): string {
  if (!role) return ''
  return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
}

// ── Lifecycle ───────────────────────────────────────────────────────────
onMounted(async () => {
  chatStore.requestNotificationPermission()
  chatStore.connect()
  await chatStore.fetchChats()
})

onBeforeUnmount(() => {
  // Don't disconnect — let the store manage the connection globally
})
</script>

<style scoped>
/* ─── Layout ─────────────────────────────────────────────────────────── */
.nexus-chat {
  height: calc(100vh - 64px);
  display: flex;
  flex-direction: column;
}

.nexus-container {
  display: flex;
  flex: 1;
  overflow: hidden;
  background: #fff;
  border-radius: 12px;
  margin: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,.08);
}

/* ─── Sidebar ────────────────────────────────────────────────────────── */
.chat-sidebar {
  width: 340px;
  min-width: 340px;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  background: #faf8ff;
}

.sidebar-header {
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #f3f0ff;
}

.sidebar-title {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon { color: var(--color-primary-600, #7c3aed); }

.connection-badge {
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 99px;
  display: flex;
  align-items: center;
  gap: 4px;
}
.conn-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  display: inline-block;
}
.conn-connected { background: #ecfdf5; color: #059669; }
.conn-connected .conn-dot { background: #10b981; }
.conn-connecting { background: #fffbeb; color: #d97706; }
.conn-connecting .conn-dot { background: #f59e0b; animation: pulse 1s infinite; }
.conn-disconnected { background: #fef2f2; color: #dc2626; }
.conn-disconnected .conn-dot { background: #ef4444; }

/* ─── Search ─────────────────────────────────────────────────────────── */
.search-section {
  padding: 12px 16px;
  position: relative;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 8px 12px;
  transition: border-color .2s;
}
.search-box:focus-within { border-color: var(--color-primary-500, #8b5cf6); }

.search-icon { color: #9ca3af; flex-shrink: 0; }
.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 13px;
  background: transparent;
  color: #374151;
}
.search-input::placeholder { color: #9ca3af; }
.search-clear {
  color: #9ca3af;
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
}
.search-clear:hover { background: #f3f4f6; }

.search-dropdown {
  position: absolute;
  top: 100%;
  left: 16px;
  right: 16px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,.12);
  max-height: 260px;
  overflow-y: auto;
  z-index: 20;
}
.search-loading {
  padding: 12px 16px;
  color: #6b7280;
  font-size: 13px;
  display: flex; align-items: center; gap: 8px;
}
.search-result {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  width: 100%;
  text-align: left;
  cursor: pointer;
  transition: background .15s;
}
.search-result:hover { background: #f5f3ff; }
.search-result-info { flex: 1; min-width: 0; }
.search-result-name { font-size: 13px; font-weight: 600; color: #1f2937; display: block; }
.search-result-role { font-size: 11px; color: #6b7280; text-transform: capitalize; }

/* ─── Avatar ─────────────────────────────────────────────────────────── */
.avatar-wrap { position: relative; flex-shrink: 0; }
.avatar {
  width: 40px; height: 40px;
  border-radius: 50%;
  object-fit: cover;
}
.avatar-placeholder {
  width: 40px; height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary-500, #8b5cf6), var(--color-primary-600, #7c3aed));
  color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-weight: 600;
  font-size: 16px;
}
.avatar-placeholder.sm { width: 36px; height: 36px; font-size: 14px; }
.online-dot {
  position: absolute;
  bottom: 1px; right: 1px;
  width: 10px; height: 10px;
  border-radius: 50%;
  background: #10b981;
  border: 2px solid #fff;
}

/* ─── Chat List ──────────────────────────────────────────────────────── */
.chat-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
}
.chat-list-loading, .chat-list-empty {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 40px 20px; color: #9ca3af; gap: 8px;
  font-size: 13px;
}
.empty-icon { color: #d1d5db; }
.empty-hint { font-size: 12px; }

.chat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  width: 100%;
  text-align: left;
  cursor: pointer;
  transition: background .15s;
  border-left: 3px solid transparent;
}
.chat-item:hover { background: #f5f3ff; }
.chat-item-active {
  background: #ede9fe !important;
  border-left-color: var(--color-primary-600, #7c3aed);
}
.chat-item-info { flex: 1; min-width: 0; }
.chat-item-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px; }
.chat-item-name { font-size: 14px; font-weight: 600; color: #1f2937; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.chat-item-time { font-size: 11px; color: #9ca3af; flex-shrink: 0; }
.chat-item-bottom { display: flex; justify-content: space-between; align-items: center; }
.chat-item-preview {
  font-size: 12px; color: #6b7280;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  flex: 1; min-width: 0;
}
.preview-unread { color: #374151; font-weight: 500; }
.unread-badge {
  background: var(--color-primary-600, #7c3aed);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 99px;
  min-width: 18px;
  text-align: center;
  flex-shrink: 0;
}

/* ─── Chat Panel ─────────────────────────────────────────────────────── */
.chat-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: #fff;
}

.no-chat-selected {
  flex: 1;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  color: #9ca3af; gap: 8px; text-align: center;
}
.no-chat-icon { color: #d1d5db; }
.no-chat-selected h3 { font-size: 18px; font-weight: 600; color: #6b7280; }
.no-chat-selected p { font-size: 13px; }

/* ─── Chat Header ────────────────────────────────────────────────────── */
.chat-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  border-bottom: 1px solid #e5e7eb;
  background: #faf8ff;
}
.back-btn {
  color: #6b7280;
  padding: 4px;
  border-radius: 6px;
}
.back-btn:hover { background: #f3f4f6; }
.chat-header-info { flex: 1; min-width: 0; }
.chat-header-name { font-size: 15px; font-weight: 600; color: #1f2937; }
.chat-header-status { font-size: 12px; color: #6b7280; }
.status-online { color: #10b981; font-weight: 500; }
.status-offline { color: #9ca3af; }
.typing-text { color: var(--color-primary-600, #7c3aed); font-weight: 500; }

.typing-dots span {
  animation: typingDot 1.4s infinite;
  animation-fill-mode: both;
}
.typing-dots span:nth-child(2) { animation-delay: .2s; }
.typing-dots span:nth-child(3) { animation-delay: .4s; }

@keyframes typingDot {
  0%, 80%, 100% { opacity: 0; }
  40% { opacity: 1; }
}

/* ─── Messages Area ──────────────────────────────────────────────────── */
.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.load-more { text-align: center; padding: 8px; }
.load-more-btn {
  font-size: 12px; color: var(--color-primary-600, #7c3aed);
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 12px; border-radius: 6px;
}
.load-more-btn:hover { background: #f5f3ff; }

.messages-loading, .messages-empty {
  flex: 1;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  color: #9ca3af; gap: 8px; font-size: 13px;
}
.empty-send-icon { color: #d1d5db; }

/* ─── Date Separator ─────────────────────────────────────────────────── */
.date-separator {
  text-align: center;
  padding: 12px 0;
}
.date-separator span {
  background: #f3f4f6;
  color: #6b7280;
  font-size: 11px;
  font-weight: 500;
  padding: 4px 12px;
  border-radius: 99px;
}

/* ─── Message Row ────────────────────────────────────────────────────── */
.message-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  max-width: 75%;
  margin-bottom: 2px;
}
.message-own { margin-left: auto; flex-direction: row-reverse; }
.message-other { margin-right: auto; }

.message-avatar {
  width: 28px; height: 28px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}
.message-avatar-spacer { width: 28px; flex-shrink: 0; }

.message-bubble-wrap { max-width: 100%; min-width: 0; }

/* ─── Reply Preview ──────────────────────────────────────────────────── */
.reply-preview {
  display: flex; align-items: stretch; gap: 8px;
  padding: 6px 10px; margin-bottom: 2px;
  background: rgba(139,92,246,.08);
  border-radius: 8px 8px 0 0;
  cursor: pointer;
  font-size: 12px;
}
.reply-bar { width: 3px; background: var(--color-primary-500, #8b5cf6); border-radius: 2px; }
.reply-content { min-width: 0; }
.reply-name { font-weight: 600; color: var(--color-primary-700, #6d28d9); display: block; }
.reply-text { color: #6b7280; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }

.forwarded-label {
  font-size: 11px; color: #6b7280;
  display: flex; align-items: center; gap: 4px;
  padding: 0 4px; margin-bottom: 2px;
  font-style: italic;
}

/* ─── Message Bubble ─────────────────────────────────────────────────── */
.message-bubble {
  padding: 8px 12px;
  border-radius: 12px;
  word-break: break-word;
  position: relative;
}

.message-own .message-bubble {
  background: linear-gradient(135deg, var(--color-primary-500, #8b5cf6), var(--color-primary-600, #7c3aed));
  color: #fff;
  border-bottom-right-radius: 4px;
}
.message-other .message-bubble {
  background: #f3f4f6;
  color: #1f2937;
  border-bottom-left-radius: 4px;
}

.bubble-deleted {
  background: #f9fafb !important;
  color: #9ca3af !important;
  font-style: italic;
}
.deleted-text { display: flex; align-items: center; gap: 6px; font-size: 13px; }

.message-text { font-size: 14px; line-height: 1.5; margin: 0; white-space: pre-wrap; }

/* ─── Attachments ────────────────────────────────────────────────────── */
.message-attachments { margin-bottom: 4px; }
.attachment-image {
  max-width: 280px;
  max-height: 200px;
  border-radius: 8px;
  cursor: pointer;
  object-fit: cover;
}
.attachment-file {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 10px; background: rgba(255,255,255,.15);
  border-radius: 6px; font-size: 12px;
  text-decoration: none; color: inherit;
}
.message-own .attachment-file { background: rgba(255,255,255,.2); }
.message-other .attachment-file { background: #e5e7eb; color: #374151; }

/* ─── Message Meta ───────────────────────────────────────────────────── */
.message-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: flex-end;
  margin-top: 2px;
}
.edited-label { font-size: 10px; opacity: .6; font-style: italic; }
.message-time { font-size: 10px; opacity: .6; }

.status-ticks { display: flex; align-items: center; }
.tick-sent { opacity: .5; }
.tick-delivered { opacity: .7; }
.tick-read { color: #60a5fa; opacity: 1; }
.message-own .tick-read { color: #93c5fd; }

/* ─── Reactions ──────────────────────────────────────────────────────── */
.message-reactions {
  display: flex; flex-wrap: wrap; gap: 4px;
  margin-top: 4px;
}
.reaction-pill {
  display: inline-flex; align-items: center; gap: 2px;
  padding: 2px 6px; border-radius: 99px;
  font-size: 12px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  transition: all .15s;
}
.reaction-pill:hover { background: #ede9fe; border-color: var(--color-primary-300, #c4b5fd); }
.reaction-own { background: #ede9fe; border-color: var(--color-primary-400, #a78bfa); }

/* ─── Typing Indicator ───────────────────────────────────────────────── */
.typing-indicator-row {
  display: flex; align-items: flex-end; gap: 8px;
  max-width: 75%; margin-right: auto;
}
.typing-bubble {
  padding: 10px 14px;
  background: #f3f4f6;
  border-radius: 12px 12px 12px 4px;
}
.typing-animation { display: flex; gap: 4px; }
.typing-animation span {
  width: 6px; height: 6px;
  background: #9ca3af;
  border-radius: 50%;
  animation: typingBounce 1.4s infinite;
}
.typing-animation span:nth-child(2) { animation-delay: .2s; }
.typing-animation span:nth-child(3) { animation-delay: .4s; }

@keyframes typingBounce {
  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-6px); }
}

/* ─── Reply Bar (above input) ────────────────────────────────────────── */
.reply-bar-input {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 20px;
  background: #f5f3ff;
  border-top: 1px solid #ede9fe;
}
.reply-bar-content {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; color: #6b7280;
  min-width: 0;
}
.reply-bar-name { font-weight: 600; color: var(--color-primary-700, #6d28d9); }
.reply-bar-text { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.reply-bar-close { color: #9ca3af; padding: 2px; border-radius: 4px; }
.reply-bar-close:hover { background: #e5e7eb; }

/* ─── Message Input ──────────────────────────────────────────────────── */
.message-input-area {
  border-top: 1px solid #e5e7eb;
  background: #faf8ff;
}

.file-preview {
  display: flex; flex-wrap: wrap; gap: 8px;
  padding: 8px 20px 0;
}
.file-preview-item {
  display: flex; align-items: center; gap: 6px;
  padding: 4px 8px;
  background: #f3f4f6;
  border-radius: 6px;
  font-size: 12px; color: #374151;
}
.file-preview-img { width: 40px; height: 40px; object-fit: cover; border-radius: 4px; }
.file-preview-name { max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.file-remove { color: #9ca3af; padding: 2px; border-radius: 4px; }
.file-remove:hover { background: #e5e7eb; }

.input-row {
  display: flex; align-items: flex-end; gap: 8px;
  padding: 12px 16px;
}

.input-action-btn {
  color: #6b7280;
  padding: 8px;
  border-radius: 8px;
  transition: all .15s;
  flex-shrink: 0;
}
.input-action-btn:hover { background: #f3f4f6; color: var(--color-primary-600, #7c3aed); }

.input-wrap { flex: 1; min-width: 0; }
.message-input {
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 14px;
  resize: none;
  outline: none;
  background: #fff;
  color: #1f2937;
  line-height: 1.4;
  max-height: 120px;
  transition: border-color .2s;
}
.message-input:focus { border-color: var(--color-primary-500, #8b5cf6); }
.message-input::placeholder { color: #9ca3af; }

.send-btn {
  background: var(--color-primary-600, #7c3aed);
  color: #fff;
  padding: 10px;
  border-radius: 10px;
  transition: all .15s;
  flex-shrink: 0;
}
.send-btn:hover:not(:disabled) { background: var(--color-primary-700, #6d28d9); }
.send-btn:disabled { opacity: .4; cursor: not-allowed; }

/* ─── Context Menu ───────────────────────────────────────────────────── */
.context-menu {
  position: fixed;
  z-index: 50;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 8px 30px rgba(0,0,0,.15);
  min-width: 180px;
  overflow: hidden;
}
.context-reactions {
  display: flex; gap: 2px; padding: 8px;
  border-bottom: 1px solid #f3f4f6;
}
.quick-reaction {
  font-size: 20px; padding: 4px 6px;
  border-radius: 6px; cursor: pointer;
  transition: background .15s;
}
.quick-reaction:hover { background: #f5f3ff; }

.context-actions { padding: 4px; }
.context-action {
  display: flex; align-items: center; gap: 8px;
  width: 100%; text-align: left;
  padding: 8px 12px; font-size: 13px; color: #374151;
  border-radius: 6px; cursor: pointer;
  transition: background .15s;
}
.context-action:hover { background: #f5f3ff; }
.context-danger { color: #dc2626; }
.context-danger:hover { background: #fef2f2; }

.context-overlay {
  position: fixed; inset: 0; z-index: 40;
}

/* ─── Responsive ─────────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .nexus-container { margin: 0; border-radius: 0; }
  .chat-sidebar { width: 100%; min-width: 100%; }
  .mobile-hidden { display: none !important; }
  .message-row { max-width: 90%; }
}

/* ─── Utility ────────────────────────────────────────────────────────── */
.hidden { display: none; }
.italic { font-style: italic; }

.animate-spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: .5; }
}
</style>
