<template>
  <div class="chat-panel" :class="{ 'chat-panel-open': isOpen, 'chat-panel-minimized': isMinimized }">
    <!-- Chat Toggle Button (floating) -->
    <button
      v-if="!isOpen"
      @click="toggleChat"
      class="chat-toggle-btn"
      :title="`${totalUnreadCount > 0 ? totalUnreadCount + ' unread messages' : 'Open chat'}`"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
      </svg>
      <span v-if="totalUnreadCount > 0" class="chat-toggle-badge">
        {{ totalUnreadCount > 99 ? '99+' : totalUnreadCount }}
      </span>
    </button>

    <!-- Chat Window -->
    <div v-if="isOpen" class="chat-window">
      <!-- Header -->
      <div class="chat-panel-header">
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
          </svg>
          <h3 class="chat-panel-header-title">
            {{ currentConversation ? currentConversation.other_user.name : 'Messages' }}
          </h3>
        </div>
        <div class="flex items-center gap-1">
          <button @click="toggleMinimize" class="chat-header-btn" title="Minimize">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
            </svg>
          </button>
          <button @click="closeChat" class="chat-header-btn" title="Close">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Body -->
      <div v-if="!isMinimized" class="chat-body">
        <!-- Conversations List -->
        <div v-if="!currentConversationId" class="chat-conversations">
          <!-- Inline Search to Start New Conversation -->
          <div class="cp-search-wrap">
            <svg class="cp-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
              v-model="userSearchQuery"
              type="text"
              placeholder="Search users to chat..."
              class="cp-search-input"
              autocomplete="off"
              @input="debouncedUserSearch"
            />
            <div v-if="userSearchQuery && (userSearchResults.length > 0 || loadingUsers)" class="cp-search-dropdown">
              <div v-if="loadingUsers" class="cp-search-loading">Searching...</div>
              <button
                v-for="user in userSearchResults"
                :key="user.id"
                type="button"
                class="cp-search-item"
                @click="startNewConversation(user.id)"
              >
                <div class="cp-search-avatar">
                  <img v-if="user.avatar" :src="getAvatarUrl(user.avatar)" :alt="user.name" class="cp-avatar-img" />
                  <span v-else class="cp-avatar-initials">{{ getInitials(user.name) }}</span>
                </div>
                <div class="cp-search-info">
                  <span class="cp-search-name">{{ user.name }}</span>
                  <span class="cp-search-role">{{ getUserRole(user) }}</span>
                </div>
              </button>
            </div>
            <div v-if="userSearchQuery && !loadingUsers && userSearchResults.length === 0" class="cp-search-empty">
              No users found
            </div>
          </div>

          <div v-if="loading" class="chat-loading">
            <div class="spinner"></div>
            <p class="text-sm text-surface-500 mt-2">Loading conversations...</p>
          </div>
          <div v-else-if="conversations.length === 0" class="chat-empty">
            <svg class="w-10 h-10 text-purple-200 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
            <p class="text-sm text-surface-500">No conversations yet</p>
            <p class="text-xs text-surface-400 mt-1">Search a user above to start chatting</p>
          </div>
          <div v-else class="chat-conversations-list">
            <div
              v-for="conv in conversations"
              :key="conv.id"
              @click="openConversation(conv.id)"
              class="chat-conversation-item"
            >
              <div class="chat-avatar">
                <img v-if="conv.other_user.avatar" :src="getAvatarUrl(conv.other_user.avatar)" :alt="conv.other_user.name" />
                <span v-else class="chat-avatar-initials">{{ getInitials(conv.other_user.name) }}</span>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between mb-1">
                  <p class="chat-conversation-name" :class="{ 'font-semibold': conv.unread_count > 0 }">
                    {{ conv.other_user.name }}
                  </p>
                  <span class="chat-conversation-time">{{ timeAgo(conv.updated_at) }}</span>
                </div>
                <p class="chat-conversation-preview" :class="{ 'font-medium text-surface-700': conv.unread_count > 0 }">
                  {{ conv.last_message?.message || 'No messages yet' }}
                </p>
              </div>
              <span v-if="conv.unread_count > 0" class="chat-unread-badge">
                {{ conv.unread_count > 9 ? '9+' : conv.unread_count }}
              </span>
            </div>
          </div>
        </div>

        <!-- Messages View -->
        <div v-else class="chat-messages-container">
          <!-- Back Button -->
          <button @click="backToConversations" class="chat-back-btn">
            <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
            Back to conversations
          </button>

          <!-- Messages List -->
          <div ref="messagesRef" class="chat-messages-list">
            <div v-if="loading" class="chat-loading">
              <div class="spinner"></div>
            </div>
            <div v-else-if="messages.length === 0" class="chat-empty">
              <p class="text-sm text-surface-500">No messages yet</p>
              <p class="text-xs text-surface-400 mt-1">Start the conversation!</p>
            </div>
            <div v-else>
              <div
                v-for="msg in messages"
                :key="msg.id"
                class="chat-message"
                :class="{ 'chat-message-mine': msg.is_mine }"
              >
                <div class="chat-message-avatar" v-if="!msg.is_mine">
                  <img v-if="msg.sender.avatar" :src="getAvatarUrl(msg.sender.avatar)" :alt="msg.sender.name" />
                  <span v-else class="chat-avatar-initials-sm">{{ getInitials(msg.sender.name) }}</span>
                </div>
                <div class="chat-message-bubble">
                  <p class="chat-message-text">{{ msg.message }}</p>
                  <span class="chat-message-time">{{ formatTime(msg.created_at) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Input Box -->
          <form @submit.prevent="sendMessage" class="chat-input-container">
            <input
              v-model="newMessage"
              type="text"
              placeholder="Type a message..."
              class="chat-input"
              :disabled="sendingMessage"
            />
            <button
              type="submit"
              class="chat-send-btn"
              :disabled="!newMessage.trim() || sendingMessage"
            >
              <svg v-if="!sendingMessage" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
              </svg>
              <div v-else class="spinner-sm"></div>
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useChatStore } from '@/stores/chat'
import { useAuthStore } from '@/stores/auth'
import api from '@/lib/axios'
import { getStorageUrl } from '@/lib/storageUrl'

const chatStore = useChatStore()
const authStore = useAuthStore()

const isOpen = ref(false)
const isMinimized = ref(false)
const newMessage = ref('')
const sendingMessage = ref(false)
const messagesRef = ref<HTMLElement | null>(null)

// Inline user search state
const userSearchQuery = ref('')
const loadingUsers = ref(false)
const availableUsers = ref<any[]>([])
let userSearchTimeout: ReturnType<typeof setTimeout>
const userSearchResults = computed(() => availableUsers.value)

const conversations = computed(() => chatStore.conversations)
const currentConversationId = computed(() => chatStore.currentConversationId)
const currentConversation = computed(() => chatStore.currentConversation)
const messages = computed(() => chatStore.messages)
const loading = computed(() => chatStore.loading)
const totalUnreadCount = computed(() => chatStore.totalUnreadCount)

function toggleChat() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    isMinimized.value = false
    chatStore.fetchConversations()
  }
}

function closeChat() {
  isOpen.value = false
  chatStore.clearCurrentConversation()
  userSearchQuery.value = ''
  availableUsers.value = []
}

function toggleMinimize() {
  isMinimized.value = !isMinimized.value
}

function openConversation(conversationId: number) {
  chatStore.fetchMessages(conversationId)
}

function backToConversations() {
  chatStore.clearCurrentConversation()
}

async function sendMessage() {
  if (!newMessage.value.trim() || !currentConversationId.value) return

  try {
    sendingMessage.value = true
    await chatStore.sendMessage(currentConversationId.value, newMessage.value)
    newMessage.value = ''
    await nextTick()
    scrollToBottom()
  } catch (error) {
    console.error('Failed to send message:', error)
  } finally {
    sendingMessage.value = false
  }
}

function scrollToBottom() {
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
}

function getAvatarUrl(path: string): string {
  return getStorageUrl(path)
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'
}

function getUserRole(user: any) {
  if (!user) return ''
  const roleMap: Record<string, string> = {
    'admin': 'Administrator',
    'store_owner': 'Store Owner',
    'client': 'Client'
  }
  return roleMap[user.role] || user.role
}

function timeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return date.toLocaleDateString()
}

function formatTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// Inline search functions
async function loadAvailableUsers() {
  loadingUsers.value = true
  try {
    const params = userSearchQuery.value.trim() ? { search: userSearchQuery.value.trim() } : {}
    const { data } = await api.get('/users', { params })
    availableUsers.value = data.data || []
  } catch (error) {
    console.error('Failed to load users:', error)
    availableUsers.value = []
  } finally {
    loadingUsers.value = false
  }
}

function debouncedUserSearch() {
  clearTimeout(userSearchTimeout)
  userSearchTimeout = setTimeout(() => {
    if (userSearchQuery.value.trim()) loadAvailableUsers()
    else availableUsers.value = []
  }, 300)
}

async function startNewConversation(userId: number) {
  try {
    const conversationId = await chatStore.getOrCreateConversation(userId)
    userSearchQuery.value = ''
    availableUsers.value = []
    if (conversationId) {
      openConversation(conversationId)
    }
  } catch (error) {
    console.error('Failed to start conversation:', error)
  }
}

watch(messages, () => {
  nextTick(() => scrollToBottom())
})
</script>

<style scoped>
.chat-panel {
  position: fixed;
  bottom: 0;
  right: 24px;
  z-index: 1000;
}

.chat-toggle-btn {
  position: relative;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #7c3aed, #8b5cf6);
  color: white;
  box-shadow: 0 4px 15px rgba(124, 58, 237, 0.3), 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
}

.chat-toggle-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(124, 58, 237, 0.4), 0 3px 6px rgba(0, 0, 0, 0.15);
}

.chat-toggle-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #ef4444;
  color: white;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
}

.chat-window {
  width: 380px;
  height: 550px;
  background: white;
  border-radius: 12px 12px 0 0;
  box-shadow: 0 -2px 20px rgba(124, 58, 237, 0.12), 0 -1px 4px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-panel-minimized .chat-window {
  height: auto;
}

.chat-panel-header {
  padding: 16px;
  background: linear-gradient(135deg, #6d28d9, #7c3aed);
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.chat-panel-header-title {
  font-size: 16px;
  font-weight: 600;
}

.chat-header-btn {
  padding: 6px;
  border-radius: 6px;
  background: transparent;
  color: white;
  border: none;
  cursor: pointer;
  transition: background 0.15s ease;
}

.chat-header-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.chat-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Inline Search */
.cp-search-wrap {
  position: relative;
  padding: 10px 12px;
  border-bottom: 1px solid #ede9fe;
  background: #faf5ff;
}

.cp-search-icon {
  position: absolute;
  left: 22px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: #a78bfa;
  pointer-events: none;
}

.cp-search-input {
  width: 100%;
  padding: 8px 12px 8px 34px;
  border: 1px solid #ddd6fe;
  border-radius: 8px;
  font-size: 13px;
  background: white;
  color: #1e293b;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.cp-search-input::placeholder { color: #a78bfa; }

.cp-search-input:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.cp-search-dropdown {
  position: absolute;
  left: 12px;
  right: 12px;
  top: 100%;
  margin-top: 4px;
  max-height: 240px;
  overflow-y: auto;
  background: white;
  border: 1px solid #ede9fe;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(124, 58, 237, 0.1);
  z-index: 50;
}

.cp-search-loading {
  padding: 12px;
  text-align: center;
  color: #a78bfa;
  font-size: 13px;
}

.cp-search-empty {
  padding: 8px 12px;
  font-size: 12px;
  color: #9ca3af;
}

.cp-search-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  text-align: left;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: background 0.15s;
  border-bottom: 1px solid #f5f3ff;
}

.cp-search-item:last-child { border-bottom: none; }
.cp-search-item:hover { background: #f5f3ff; }

.cp-search-avatar {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  background: #ede9fe;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cp-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cp-avatar-initials {
  font-weight: 600;
  font-size: 13px;
  color: #7c3aed;
}

.cp-search-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.cp-search-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 13px;
}

.cp-search-role {
  font-size: 11px;
  color: #9ca3af;
}

/* Conversations */
.chat-conversations,
.chat-messages-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-conversations-list {
  flex: 1;
  overflow-y: auto;
}

.chat-conversation-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.15s ease;
  border-bottom: 1px solid #f5f3ff;
}

.chat-conversation-item:hover {
  background: #faf5ff;
}

.chat-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: #ede9fe;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chat-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.chat-avatar-initials {
  font-size: 14px;
  font-weight: 600;
  color: #7c3aed;
}

.chat-avatar-initials-sm {
  font-size: 10px;
  font-weight: 600;
  color: #7c3aed;
}

.chat-conversation-name {
  font-size: 14px;
  color: #1e293b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-conversation-time {
  font-size: 11px;
  color: #9ca3af;
  flex-shrink: 0;
}

.chat-conversation-preview {
  font-size: 13px;
  color: #6b7280;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-unread-badge {
  background: #7c3aed;
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
  flex-shrink: 0;
}

.chat-back-btn {
  padding: 10px 16px;
  background: transparent;
  color: #7c3aed;
  border: none;
  border-bottom: 1px solid #ede9fe;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: background 0.15s ease;
}

.chat-back-btn:hover {
  background: #faf5ff;
}

.chat-messages-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chat-message {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

.chat-message-mine {
  flex-direction: row-reverse;
}

.chat-message-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: #ede9fe;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chat-message-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.chat-message-bubble {
  max-width: 70%;
  padding: 10px 14px;
  border-radius: 16px;
  background: #f5f3ff;
}

.chat-message-mine .chat-message-bubble {
  background: linear-gradient(135deg, #7c3aed, #8b5cf6);
  color: white;
}

.chat-message-text {
  font-size: 14px;
  line-height: 1.4;
  word-wrap: break-word;
}

.chat-message-time {
  font-size: 10px;
  color: #9ca3af;
  display: block;
  margin-top: 4px;
}

.chat-message-mine .chat-message-time {
  color: rgba(255, 255, 255, 0.75);
}

.chat-input-container {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #ede9fe;
  background: white;
}

.chat-input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #ddd6fe;
  border-radius: 20px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.15s ease;
  background: white;
  color: #1e293b;
}

.chat-input:focus {
  border-color: #8b5cf6;
}

.chat-send-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #7c3aed;
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease;
  flex-shrink: 0;
}

.chat-send-btn:hover:not(:disabled) {
  background: #6d28d9;
}

.chat-send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.chat-loading,
.chat-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  text-align: center;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #ede9fe;
  border-top-color: #7c3aed;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spinner-sm {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 640px) {
  .chat-panel {
    right: 16px;
    left: 16px;
  }

  .chat-window {
    width: 100%;
    height: 500px;
  }

  .chat-toggle-btn {
    width: 52px;
    height: 52px;
  }
}
</style>
