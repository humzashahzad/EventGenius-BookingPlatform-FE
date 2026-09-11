<template>
  <div class="nexus-chat">
    <div class="nexus-container">

      <!-- Left Sidebar — Chat List -->
      <aside class="chat-sidebar" :class="{ 'mobile-hidden': chatStore.currentChatId }">
        <!-- Compact Header -->
        <div class="sidebar-header">
          <div class="sidebar-header-left">
            <h2 class="sidebar-title">
              <AppIcon icon="message-circle" class="w-[18px] h-[18px] title-icon" />
              Messages
            </h2>
          </div>
          <span class="connection-badge" :class="'conn-' + chatStore.connectionStatus">
            <span class="conn-dot"></span>
            {{ chatStore.connectionStatus === 'connected' ? 'Live' : chatStore.connectionStatus === 'connecting' ? 'Connecting' : 'Offline' }}
          </span>
        </div>

        <!-- Unified Search -->
        <div class="sidebar-search">
          <div class="search-box">
            <AppIcon icon="search" class="w-4 h-4 search-icon" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search or start a new chat"
              class="search-input"
              autocomplete="off"
              @input="onSearchInput"
            />
            <button v-if="searchQuery" @click="clearSearch" class="search-clear">
              <AppIcon icon="x" class="w-3.5 h-3.5" />
            </button>
          </div>
          <!-- Search Results Dropdown -->
          <div v-if="searchQuery && (searchResultConversations.length > 0 || searchResults.length > 0 || searchLoading)" class="search-dropdown">
            <div v-if="searchLoading" class="search-loading">
              <span class="spinner-border spinner-border-sm"></span> Searching...
            </div>
            <template v-if="searchResultConversations.length > 0">
              <div class="dropdown-section-label">Conversations</div>
              <button v-for="chat in searchResultConversations" :key="'c-' + chat.id" @click="openChat(chat.id); clearSearch()" class="search-result">
                <div class="avatar-wrap">
                  <img v-if="chatAvatar(chat)" :src="getStorageUrl(chatAvatar(chat)!)" :alt="chatName(chat)" class="avatar" />
                  <div v-else class="avatar-placeholder">{{ chatName(chat).charAt(0) }}</div>
                  <span v-if="chat.type === 'private' && chat.other_user?.is_online" class="online-dot"></span>
                </div>
                <div class="search-result-info">
                  <span class="search-result-name">{{ chatName(chat) }}</span>
                  <span class="search-result-role">{{ chat.latest_message?.body ? messagePreview(chat) : formatRole(chat.other_user?.role) }}</span>
                </div>
              </button>
            </template>
            <template v-if="searchResults.length > 0">
              <div class="dropdown-section-label">Users</div>
              <button v-for="user in searchResults" :key="'u-' + user.id" @click="startChat(user)" class="search-result">
                <div class="avatar-wrap">
                  <img v-if="user.avatar" :src="getStorageUrl(user.avatar)" :alt="user.name" class="avatar" />
                  <div v-else class="avatar-placeholder">{{ user.name.charAt(0) }}</div>
                  <span v-if="user.is_online" class="online-dot"></span>
                </div>
                <div class="search-result-info">
                  <span class="search-result-name">{{ user.name }}</span>
                  <span class="search-result-role">{{ formatRole(user.role) }}</span>
                </div>
                <span class="user-status-text" :class="user.is_online ? 'status-online' : 'status-offline'">{{ user.is_online ? 'Online' : 'Offline' }}</span>
              </button>
            </template>
          </div>
        </div>

        <!-- Filter Tabs -->
        <div class="sidebar-filter-tabs">
          <button
            v-for="tab in sidebarTabs"
            :key="tab.key"
            @click="activeSidebarTab = tab.key"
            class="sidebar-tab"
            :class="{ 'sidebar-tab-active': activeSidebarTab === tab.key }"
          >
            {{ tab.label }}
            <span v-if="tab.badge > 0" class="sidebar-tab-badge">{{ tab.badge }}</span>
          </button>
        </div>

        <!-- Chat List -->
        <div class="chat-list" ref="chatListRef">
          <div v-if="chatStore.loading" class="chat-list-loading">
            <span class="spinner-border spinner-border-sm"></span> Loading chats...
          </div>

          <div v-else-if="filteredChats.length === 0 && !showUsersSection" class="chat-list-empty">
            <div class="empty-state-orb">
              <AppIcon icon="message-circle" class="w-10 h-10 empty-icon" />
            </div>
            <p>{{ searchQuery ? 'No matching conversations' : 'No conversations yet' }}</p>
            <p class="empty-hint">
              {{ searchQuery ? 'Try a different name or clear the filter.' : 'Search for a user above to start chatting.' }}
            </p>
          </div>

          <!-- RECENT section -->
          <template v-if="filteredChats.length > 0">
            <div class="chat-list-section-label">RECENT</div>
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
                  <div class="chat-item-heading">
                    <span class="chat-item-name">{{ chatName(chat) }}</span>
                    <span class="chat-item-role">
                      {{ chat.type === 'group' ? 'Group' : formatRole(chat.other_user?.role) || '' }}
                    </span>
                  </div>
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
          </template>

          <!-- USERS section -->
          <template v-if="showUsersSection && allContactsList.length > 0">
            <div class="chat-list-section-label">USERS</div>
            <button
              v-for="contact in allContactsList"
              :key="'contact-' + contact.id"
              @click="startChat(contact)"
              class="chat-item user-item"
            >
              <div class="avatar-wrap">
                <img v-if="contact.avatar" :src="getStorageUrl(contact.avatar)" :alt="contact.name" class="avatar" />
                <div v-else class="avatar-placeholder">{{ contact.name.charAt(0) }}</div>
                <span v-if="contact.is_online" class="online-dot"></span>
              </div>
              <div class="chat-item-info">
                <div class="chat-item-top">
                  <span class="chat-item-name">{{ contact.name }}</span>
                </div>
                <div class="chat-item-bottom">
                  <span class="user-status-text" :class="contact.is_online ? 'status-online' : 'status-offline'">
                    {{ contact.is_online ? 'Online' : 'Offline' }}
                  </span>
                </div>
              </div>
            </button>
          </template>
        </div>
      </aside>

      <!-- Right Panel — Chat Messages -->
      <main class="chat-panel" :class="{ 'mobile-hidden': !chatStore.currentChatId }">
        <!-- No Chat Selected -->
        <div v-if="!chatStore.currentChatId" class="no-chat-selected">
          <div class="no-chat-card">
            <div class="no-chat-orb">
              <AppIcon icon="message-circle" class="w-16 h-16 no-chat-icon" />
            </div>
            <span class="no-chat-kicker">Realtime Messaging</span>
            <h3>Pick a conversation to begin</h3>
            <p>Messages, delivery states, reactions, and notifications update instantly without refreshing the page.</p>
            <div class="no-chat-points">
              <span class="no-chat-point">Live delivery</span>
              <span class="no-chat-point">Read receipts</span>
              <span class="no-chat-point">Instant notifications</span>
            </div>
          </div>
        </div>

        <!-- Chat Active -->
        <template v-else>
          <!-- Chat Header -->
          <div class="chat-header">
            <div class="chat-header-main">
              <button @click="goBack" class="back-btn d-md-none">
                <AppIcon icon="arrow-left" class="w-5 h-5" />
              </button>

              <div class="avatar-wrap clickable" @click="showUserProfile = true">
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
                <h3 class="chat-header-name clickable" @click="showUserProfile = true">{{ currentChatName }}</h3>
                <p class="chat-header-status">
                  <template v-if="chatStore.currentTypingUsers.length > 0">
                    <span class="typing-text">
                      {{ chatStore.currentTypingUsers.map(t => t.userName).join(', ') }}
                      {{ chatStore.currentTypingUsers.length === 1 ? 'is' : 'are' }} typing
                      <span class="typing-dots"><span>.</span><span>.</span><span>.</span></span>
                    </span>
                  </template>
                  <template v-else-if="chatStore.currentChat?.type === 'private'">
                    <span v-if="currentOtherUser?.is_online" class="status-online">
                      <span class="status-dot-inline online"></span> Online
                    </span>
                    <span v-else class="status-offline">
                      <span class="status-dot-inline offline"></span>
                      {{ currentOtherUser?.last_seen_at ? 'Last seen ' + formatRelativeTime(currentOtherUser.last_seen_at) : 'Offline' }}
                    </span>
                  </template>
                  <template v-else-if="chatStore.currentChat?.type === 'group'">
                    <span class="status-offline">{{ chatStore.currentChat.participants?.length || 0 }} members</span>
                  </template>
                </p>
              </div>
            </div>

            <div class="chat-header-actions">
              <button @click="goBack" class="header-close-btn" title="Close chat">
                <AppIcon icon="x" class="w-[18px] h-[18px]" />
              </button>
            </div>
          </div>

          <!-- Messages Area -->
          <div class="messages-area" ref="messagesAreaRef" @scroll="onMessagesScroll">
            <!-- Scroll to Bottom Button -->
            <Transition name="fade-up">
              <button
                v-if="showScrollBtn"
                class="scroll-to-bottom-btn"
                @click="scrollToBottom()"
                title="Scroll to latest"
              >
                <AppIcon icon="chevron-down" class="w-[18px] h-[18px]" />
                <span v-if="chatStore.currentChat?.unread_count" class="scroll-unread">{{ chatStore.currentChat.unread_count }}</span>
              </button>
            </Transition>
            <div v-if="chatStore.messages.length > 0" class="messages-intro">
              <div class="messages-intro-icon">
                <AppIcon icon="bolt" class="w-[18px] h-[18px]" />
              </div>
              <div class="messages-intro-copy">
                <p class="messages-intro-title">Live conversation with {{ currentChatName }}</p>
                <p class="messages-intro-text">New messages, reactions, and read status sync in real time.</p>
              </div>
            </div>
            <!-- Load More -->
            <div v-if="chatStore.hasMoreMessages" class="load-more">
              <button @click="chatStore.loadOlderMessages()" :disabled="chatStore.messagesLoading" class="load-more-btn">
                <span v-if="chatStore.messagesLoading" class="spinner-border spinner-border-sm"></span>
                Load older messages
              </button>
            </div>

            <!-- Messages Loading -->
            <div v-if="chatStore.messagesLoading && chatStore.messages.length === 0" class="messages-loading">
              <span class="spinner-border spinner-border-sm"></span> Loading messages...
            </div>

            <!-- Empty State -->
            <div v-else-if="chatStore.messages.length === 0" class="messages-empty">
              <div class="empty-state-orb empty-state-orb-sm">
                <AppIcon icon="send" class="w-8 h-8 empty-send-icon" />
              </div>
              <p>No messages yet</p>
              <p class="empty-hint">Send the first message to start this conversation.</p>
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
                :data-message-id="msg.id"
              >
                <!-- Avatar (for other users) -->
                <template v-if="msg.sender_id !== authStore.user?.id && showAvatar(idx)">
                  <img
                    v-if="msg.sender.avatar"
                    :src="getStorageUrl(msg.sender.avatar)"
                    :alt="msg.sender.name"
                    class="message-avatar"
                  />
                  <div v-else class="avatar-placeholder sm message-avatar-placeholder">{{ msg.sender.name.charAt(0) }}</div>
                </template>
                <div v-else-if="msg.sender_id !== authStore.user?.id && !showAvatar(idx)" class="message-avatar-spacer"></div>

                <div class="message-bubble-wrap">
                  <div v-if="msg.sender_id !== authStore.user?.id && showAvatar(idx)" class="message-sender">
                    {{ msg.sender.name }}
                  </div>

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
                    <AppIcon icon="arrow-forward-up" class="w-3 h-3" /> Forwarded
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
                        <AppIcon icon="ban" class="w-3.5 h-3.5" />
                        This message was deleted
                      </span>
                    </template>

                    <!-- Normal Message -->
                    <template v-else>
                      <!-- Voice Message Player -->
                      <div v-if="msg.type === 'voice' && msg.attachments?.length" class="voice-message-player">
                        <button @click="togglePlayVoice(msg.id, msg.attachments[0].path)" class="voice-play-btn">
                          <AppIcon :icon="playingVoiceId === msg.id ? 'player-pause' : 'player-play'" class="w-[18px] h-[18px]" />
                        </button>
                        <div class="voice-waveform">
                          <div class="voice-progress" :style="{ width: (voiceProgress[msg.id] || 0) + '%' }"></div>
                        </div>
                        <span class="voice-duration">{{ voiceDurations[msg.id] || '0:00' }}</span>
                      </div>

                      <!-- Attachments (non-voice) -->
                      <div v-if="msg.type !== 'voice' && msg.attachments && msg.attachments.length > 0" class="message-attachments">
                        <template v-for="att in msg.attachments" :key="att.path">
                          <img
                            v-if="att.mime?.startsWith('image/')"
                            :src="getStorageUrl(att.path)"
                            :alt="att.name"
                            class="attachment-image"
                            @click="openAttachment(att)"
                          />
                          <video
                            v-else-if="att.mime?.startsWith('video/')"
                            :src="getStorageUrl(att.path)"
                            controls
                            preload="metadata"
                            class="attachment-video"
                          ></video>
                          <audio
                            v-else-if="att.mime?.startsWith('audio/')"
                            :src="getStorageUrl(att.path)"
                            controls
                            preload="metadata"
                            class="attachment-audio"
                          ></audio>
                          <a
                            v-else
                            :href="getStorageUrl(att.path)"
                            target="_blank"
                            class="attachment-file"
                          >
                            <AppIcon icon="file" class="w-4 h-4" />
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
                          <AppIcon v-if="msg.status === 'sent'" icon="check" class="w-3.5 h-3.5 tick-sent" />
                          <AppIcon v-else-if="msg.status === 'delivered'" icon="checks" class="w-3.5 h-3.5 tick-delivered" />
                          <AppIcon v-else-if="msg.status === 'read'" icon="checks" class="w-3.5 h-3.5 tick-read" />
                          <AppIcon v-else icon="check" class="w-3.5 h-3.5 tick-sent" />
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
              <AppIcon icon="arrow-back-up" class="w-3.5 h-3.5" />
              <span class="reply-bar-name">{{ replyingTo.sender.name }}</span>
              <span class="reply-bar-text">{{ replyingTo.body || '[Attachment]' }}</span>
            </div>
            <button @click="replyingTo = null" class="reply-bar-close">
              <AppIcon icon="x" class="w-3.5 h-3.5" />
            </button>
          </div>

          <div v-if="editingMessage" class="reply-bar-input edit-bar-input">
            <div class="reply-bar-content">
              <AppIcon icon="pencil" class="w-3.5 h-3.5" />
              <span class="reply-bar-name">Editing message</span>
              <span class="reply-bar-text">{{ editingMessage.body || '[Attachment]' }}</span>
            </div>
            <button @click="cancelEditing" class="reply-bar-close">
              <AppIcon icon="x" class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- Message Input -->
          <div class="message-input-area">
            <!-- Attachment Menu Overlay -->
            <div v-if="showAttachmentMenu" class="attachment-menu-overlay" @click="showAttachmentMenu = false"></div>

            <!-- Categorized Attachment Menu -->
            <Transition name="attachment-menu">
              <div v-if="showAttachmentMenu" class="attachment-menu" @click.stop>
                <button @click="triggerCategoryFileInput('photo')" class="attachment-menu-item">
                  <div class="attachment-menu-icon photo">
                    <AppIcon icon="photo" class="w-5 h-5" />
                  </div>
                  <span>Photo</span>
                </button>
                <button @click="triggerCategoryFileInput('video')" class="attachment-menu-item">
                  <div class="attachment-menu-icon video">
                    <AppIcon icon="video" class="w-5 h-5" />
                  </div>
                  <span>Video</span>
                </button>
                <button @click="triggerCategoryFileInput('document')" class="attachment-menu-item">
                  <div class="attachment-menu-icon document">
                    <AppIcon icon="file-text" class="w-5 h-5" />
                  </div>
                  <span>Document</span>
                </button>
              </div>
            </Transition>

            <!-- Hidden file inputs per category -->
            <input ref="photoInputRef" type="file" multiple @change="onFilesSelected" style="display:none" accept="image/*" />
            <input ref="videoInputRef" type="file" multiple @change="onFilesSelected" style="display:none" accept="video/*" />
            <input ref="documentInputRef" type="file" multiple @change="onFilesSelected" style="display:none" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar" />

            <!-- File Preview Panel -->
            <div v-if="selectedFiles.length > 0" class="file-preview">
              <div v-for="(file, i) in selectedFiles" :key="i" class="file-preview-item">
                <img v-if="file.type.startsWith('image/')" :src="filePreviewUrl(file)" class="file-preview-img" />
                <AppIcon v-else icon="file" class="w-4 h-4 text-warm-500" />
                <span class="file-preview-name">{{ file.name }}</span>
                <button @click="removeFile(i)" class="file-remove">
                  <AppIcon icon="x" class="w-2.5 h-2.5" />
                </button>
              </div>
              <span class="file-count-badge">{{ selectedFiles.length }}/5</span>
            </div>

            <!-- Voice Recording Bar -->
            <div v-if="isRecording" class="input-row voice-recording-bar">
              <button @click="cancelVoiceRecording" class="voice-cancel-btn" title="Cancel recording">
                <AppIcon icon="x" class="w-[18px] h-[18px]" />
              </button>
              <div class="voice-recording-indicator">
                <span class="recording-dot"></span>
                <span class="recording-time">{{ formattedRecordingTime }}</span>
              </div>
              <button @click="stopAndSendVoiceRecording" class="send-btn" title="Send voice message">
                <AppIcon icon="send-2" class="w-[18px] h-[18px]" />
              </button>
            </div>

            <!-- Normal Input Row -->
            <div v-else class="input-row">
              <!-- Cancel button (when replying/editing) -->
              <button
                v-if="replyingTo || editingMessage"
                @click="replyingTo ? (replyingTo = null) : cancelEditing()"
                class="input-action-btn"
                title="Cancel"
              >
                <AppIcon icon="x" class="w-5 h-5" />
              </button>

              <!-- Emoji button -->
              <button @click="showEmojiPicker = !showEmojiPicker" class="input-action-btn" title="Emoji">
                <AppIcon icon="mood-smile" class="w-[22px] h-[22px]" />
              </button>

              <!-- Text Input (pill shape) -->
              <div class="input-wrap">
                <textarea
                  ref="messageInputRef"
                  v-model="messageText"
                  :placeholder="editingMessage ? 'Update your message...' : 'Type a message...'"
                  class="message-input"
                  rows="1"
                  @keydown="onInputKeydown"
                  @input="onInputChange"
                ></textarea>
              </div>

              <!-- Attach button (opens categorized menu) -->
              <button @click="toggleAttachmentMenu" class="input-action-btn" title="Attach files">
                <AppIcon icon="paperclip" class="w-[22px] h-[22px]" />
              </button>

              <!-- Send OR Mic button -->
              <button v-if="canSend" @click="handleSend" class="send-btn" :disabled="!canSend">
                <AppIcon icon="send-2" class="w-[18px] h-[18px]" />
              </button>
              <button v-else @click="startVoiceRecording" class="input-action-btn voice-btn" title="Voice message">
                <AppIcon icon="microphone" class="w-[22px] h-[22px]" />
              </button>
            </div>
          </div>

          <!-- Quick Reaction Picker -->
          <div v-if="contextMenu.show" class="context-menu" :style="contextMenuStyle" @click.stop>
            <div class="context-reactions">
              <button v-for="emoji in quickReactions" :key="emoji" @click="reactToMessage(emoji)" class="quick-reaction">
                {{ emoji }}
              </button>
            </div>
            <div class="context-actions">
              <button v-if="contextMenu.message?.sender_id === authStore.user?.id" @click="startEdit" class="context-action">
                <AppIcon icon="pencil" class="w-3.5 h-3.5" /> Edit
              </button>
              <button @click="startReply" class="context-action">
                <AppIcon icon="arrow-back-up" class="w-3.5 h-3.5" /> Reply
              </button>
              <button v-if="contextMenu.message?.sender_id === authStore.user?.id" @click="confirmDelete" class="context-action context-danger">
                <AppIcon icon="trash" class="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </div>
        </template>
      </main>
    </div>

    <!-- Overlay to close context menu -->
    <div v-if="contextMenu.show" class="context-overlay" @click="contextMenu.show = false"></div>

    <!-- User Profile Panel -->
    <Transition name="profile-panel">
      <div v-if="showUserProfile && currentOtherUser" class="profile-panel-overlay" @click.self="showUserProfile = false">
        <div class="profile-panel">
          <div class="profile-panel-header">
            <h3 class="profile-panel-title">Contact Info</h3>
            <button class="profile-panel-close" @click="showUserProfile = false">
              <AppIcon icon="x" class="w-[18px] h-[18px]" />
            </button>
          </div>

          <div class="profile-panel-body">
            <!-- Avatar -->
            <div class="profile-panel-avatar-section">
              <div class="profile-panel-avatar">
                <img
                  v-if="currentChatAvatar"
                  :src="getStorageUrl(currentChatAvatar)"
                  :alt="currentChatName"
                />
                <div v-else class="profile-panel-avatar-placeholder">{{ currentChatName.charAt(0) }}</div>
              </div>
              <h2 class="profile-panel-name">{{ currentChatName }}</h2>
              <div class="profile-panel-status">
                <span v-if="currentOtherUser.is_online" class="status-dot online"></span>
                <span v-else class="status-dot offline"></span>
                <span>{{ currentOtherUser.is_online ? 'Online' : currentOtherUser.last_seen_at ? 'Last seen ' + formatRelativeTime(currentOtherUser.last_seen_at) : 'Offline' }}</span>
              </div>
            </div>

            <!-- Info Section -->
            <div class="profile-panel-info">
              <div class="profile-info-item">
                <div class="profile-info-icon">
                  <AppIcon icon="user" class="w-[18px] h-[18px]" />
                </div>
                <div class="profile-info-content">
                  <span class="profile-info-label">Role</span>
                  <span class="profile-info-value">{{ formatRole(currentOtherUser.role) || 'User' }}</span>
                </div>
              </div>

              <div v-if="currentOtherUser.email" class="profile-info-item">
                <div class="profile-info-icon">
                  <AppIcon icon="mail" class="w-[18px] h-[18px]" />
                </div>
                <div class="profile-info-content">
                  <span class="profile-info-label">Email</span>
                  <span class="profile-info-value">{{ currentOtherUser.email }}</span>
                </div>
              </div>

              <div class="profile-info-item">
                <div class="profile-info-icon">
                  <AppIcon icon="message-2" class="w-[18px] h-[18px]" />
                </div>
                <div class="profile-info-content">
                  <span class="profile-info-label">Messages</span>
                  <span class="profile-info-value">{{ chatStore.messages.length }} in this chat</span>
                </div>
              </div>

              <div v-if="chatStore.currentChat?.created_at" class="profile-info-item">
                <div class="profile-info-icon">
                  <AppIcon icon="calendar" class="w-[18px] h-[18px]" />
                </div>
                <div class="profile-info-content">
                  <span class="profile-info-label">Chat started</span>
                  <span class="profile-info-value">{{ format(new Date(chatStore.currentChat.created_at), 'MMM d, yyyy') }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Image Lightbox -->
    <Teleport to="body">
      <Transition name="lightbox">
        <div v-if="lightboxSrc" class="lightbox-overlay" @click.self="lightboxSrc = ''">
          <button class="lightbox-close" @click="lightboxSrc = ''" title="Close">
            <AppIcon icon="x" class="w-6 h-6" />
          </button>
          <img :src="lightboxSrc" class="lightbox-img" :alt="lightboxName" />
          <div v-if="lightboxName" class="lightbox-caption">{{ lightboxName }}</div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useChatStore, type Chat, type ChatMessage, type ChatUser } from '@/stores/chat'
import { useAuthStore } from '@/stores/auth'
import api from '@/lib/axios'
import { getStorageUrl } from '@/lib/storageUrl'
import { formatDistanceToNow, format, isToday, isYesterday, isSameDay } from 'date-fns'
import { toast } from 'vue-sonner'
import AppIcon from '@/components/ui/AppIcon.vue'

const chatStore = useChatStore()
const authStore = useAuthStore()

// ── Role-based chat restrictions ────────────────────────────────────────
const userRole = computed(() => authStore.user?.role || 'client')
const eligibleContacts = ref<ChatUser[]>([])

async function fetchEligibleContacts() {
  if (userRole.value === 'admin') return
  try {
    const { data } = await api.get('/nexus/eligible-contacts')
    eligibleContacts.value = data.data || []
  } catch {
    eligibleContacts.value = []
  }
}

async function contactSupport() {
  try {
    const { data } = await api.get('/nexus/users/search', {
      params: { role: 'admin', limit: 1 },
    })
    const supportUsers: ChatUser[] = data.data || []
    if (supportUsers.length > 0) {
      await startChat(supportUsers[0])
    } else {
      toast.error('No support user is available right now.')
    }
  } catch {
    toast.error('Unable to connect to support right now.')
  }
}

// ── Sidebar Tabs ────────────────────────────────────────────────────────
const activeSidebarTab = ref<'all' | 'unread' | 'groups'>('all')

const sidebarTabs = computed(() => [
  { key: 'all' as const, label: 'All', badge: 0 },
  { key: 'unread' as const, label: 'Unread', badge: chatStore.totalUnreadCount },
  { key: 'groups' as const, label: 'Groups', badge: chatStore.sortedChats.filter(c => c.type === 'group').length },
])

const showUsersSection = computed(() => activeSidebarTab.value === 'all' && !searchQuery.value)

const allContactsList = computed(() => {
  return eligibleContacts.value.map(c => ({
    ...c,
    is_online: chatStore.onlineUserIds.has(c.id),
  }))
})

// ── Search (Unified) ────────────────────────────────────────────────────
const searchQuery = ref('')
const searchResults = ref<ChatUser[]>([])
const searchLoading = ref(false)
let searchTimeout: ReturnType<typeof setTimeout> | null = null

const searchResultConversations = computed(() => {
  if (!searchQuery.value) return []
  const q = searchQuery.value.toLowerCase()
  return chatStore.sortedChats.filter(c => chatName(c).toLowerCase().includes(q))
})

function onSearchInput() {
  if (searchTimeout) clearTimeout(searchTimeout)
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    return
  }
  searchLoading.value = true
  searchTimeout = setTimeout(async () => {
    const allUsers = await chatStore.searchUsers(searchQuery.value.trim())
    // Filter out users that already appear in conversation results
    const conversationUserIds = new Set(searchResultConversations.value.map(c => c.other_user?.id).filter(Boolean))
    searchResults.value = allUsers.filter(u => !conversationUserIds.has(u.id))
    searchLoading.value = false
  }, 300)
}

function clearSearch() {
  searchQuery.value = ''
  searchResults.value = []
}

async function startChat(user: ChatUser) {
  try {
    clearSearch()
    const chat = await chatStore.getOrCreateChat(user.id)
    if (!chat) {
      toast.error('Could not start this chat right now.')
      return
    }
    await chatStore.selectChat(chat.id)
    scrollToBottom()
  } catch {
    toast.error('Could not start this chat right now.')
  }
}

// ── Chat List ───────────────────────────────────────────────────────────
const chatListRef = ref<HTMLElement | null>(null)

const filteredChats = computed(() => {
  let result = chatStore.sortedChats

  // Tab filter
  if (activeSidebarTab.value === 'unread') {
    result = result.filter(c => c.unread_count > 0)
  } else if (activeSidebarTab.value === 'groups') {
    result = result.filter(c => c.type === 'group')
  }

  // Text filter (only when dropdown is closed / no active search)
  if (searchQuery.value && searchResultConversations.value.length === 0) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(c => chatName(c).toLowerCase().includes(q))
  }

  return result
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

async function openChat(chatId: number) {
  await chatStore.selectChat(chatId)
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
const replyingTo = ref<ChatMessage | null>(null)
const editingMessage = ref<ChatMessage | null>(null)
const showEmojiPicker = ref(false)
const showScrollBtn = ref(false)
const lightboxSrc = ref('')
const lightboxName = ref('')
const showUserProfile = ref(false)

const canSend = computed(() => messageText.value.trim() || selectedFiles.value.length > 0)

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

  messageText.value = ''
  selectedFiles.value = []
  replyingTo.value = null
  resetTextarea()

  if (editingMessage.value) {
    const ok = await chatStore.editMessage(editingMessage.value.id, body)
    if (!ok) toast.error('Failed to edit message.')
    editingMessage.value = null
  } else {
    const sent = await chatStore.sendMessage(chatStore.currentChatId, body, {
      replyToId: replyId,
      files: files.length > 0 ? files : undefined,
    })
    if (!sent) toast.error('Failed to send message.')
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

// ── Attachment Menu ─────────────────────────────────────────────────────
const showAttachmentMenu = ref(false)
const photoInputRef = ref<HTMLInputElement | null>(null)
const videoInputRef = ref<HTMLInputElement | null>(null)
const documentInputRef = ref<HTMLInputElement | null>(null)

function toggleAttachmentMenu() {
  showAttachmentMenu.value = !showAttachmentMenu.value
}

function triggerCategoryFileInput(category: 'photo' | 'video' | 'document') {
  showAttachmentMenu.value = false
  if (category === 'photo') photoInputRef.value?.click()
  else if (category === 'video') videoInputRef.value?.click()
  else documentInputRef.value?.click()
}

// ── Voice Recording ─────────────────────────────────────────────────────
const isRecording = ref(false)
const mediaRecorder = ref<MediaRecorder | null>(null)
const audioChunks = ref<Blob[]>([])
const recordingStartTime = ref(0)
const recordingDuration = ref(0)
let recordingTimerInterval: ReturnType<typeof setInterval> | null = null

const formattedRecordingTime = computed(() => {
  const mins = Math.floor(recordingDuration.value / 60)
  const secs = recordingDuration.value % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
})

async function startVoiceRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const recorder = new MediaRecorder(stream, {
      mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm',
    })

    audioChunks.value = []
    recorder.ondataavailable = (e: BlobEvent) => {
      if (e.data.size > 0) audioChunks.value.push(e.data)
    }
    recorder.onstop = () => {
      stream.getTracks().forEach(t => t.stop())
    }

    recorder.start()
    mediaRecorder.value = recorder
    isRecording.value = true
    recordingStartTime.value = Date.now()
    recordingDuration.value = 0
    recordingTimerInterval = setInterval(() => {
      recordingDuration.value = Math.floor((Date.now() - recordingStartTime.value) / 1000)
    }, 1000)
  } catch {
    toast.error('Microphone access denied. Please allow microphone permission.')
  }
}

function cancelVoiceRecording() {
  if (mediaRecorder.value && mediaRecorder.value.state !== 'inactive') {
    mediaRecorder.value.stop()
  }
  cleanupRecording()
}

async function stopAndSendVoiceRecording() {
  if (!mediaRecorder.value || !chatStore.currentChatId) return
  const recorder = mediaRecorder.value
  return new Promise<void>((resolve) => {
    recorder.onstop = async () => {
      recorder.stream.getTracks().forEach(t => t.stop())
      const audioBlob = new Blob(audioChunks.value, { type: 'audio/webm' })
      const file = new File([audioBlob], `voice-${Date.now()}.webm`, { type: 'audio/webm' })
      const sent = await chatStore.sendMessage(chatStore.currentChatId!, '', {
        files: [file],
        type: 'voice',
      })
      if (!sent) toast.error('Failed to send voice message.')
      cleanupRecording()
      nextTick(() => scrollToBottom())
      resolve()
    }
    recorder.stop()
  })
}

function cleanupRecording() {
  isRecording.value = false
  mediaRecorder.value = null
  audioChunks.value = []
  recordingDuration.value = 0
  if (recordingTimerInterval) {
    clearInterval(recordingTimerInterval)
    recordingTimerInterval = null
  }
}

// ── Voice Playback ──────────────────────────────────────────────────────
const playingVoiceId = ref<number | null>(null)
const voiceProgress = ref<Record<number, number>>({})
const voiceDurations = ref<Record<number, string>>({})
let currentAudio: HTMLAudioElement | null = null

function togglePlayVoice(msgId: number, path: string) {
  if (playingVoiceId.value === msgId) {
    currentAudio?.pause()
    playingVoiceId.value = null
    return
  }
  if (currentAudio) { currentAudio.pause(); currentAudio = null }

  const audio = new Audio(getStorageUrl(path))
  currentAudio = audio
  playingVoiceId.value = msgId

  audio.onloadedmetadata = () => {
    const mins = Math.floor(audio.duration / 60)
    const secs = Math.floor(audio.duration % 60)
    voiceDurations.value[msgId] = `${mins}:${secs.toString().padStart(2, '0')}`
  }
  audio.ontimeupdate = () => {
    if (audio.duration) voiceProgress.value[msgId] = (audio.currentTime / audio.duration) * 100
  }
  audio.onended = () => {
    playingVoiceId.value = null
    voiceProgress.value[msgId] = 0
  }
  audio.play()
}

// ── File Handling ───────────────────────────────────────────────────────

function onFilesSelected(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files) return
  const newFiles = Array.from(input.files).slice(0, 5 - selectedFiles.value.length)
  selectedFiles.value.push(...newFiles)
  input.value = ''
}

function removeFile(index: number) {
  selectedFiles.value.splice(index, 1)
}

function filePreviewUrl(file: File): string {
  return URL.createObjectURL(file)
}

function openAttachment(att: { path: string; name: string; mime?: string }) {
  if (att.mime?.startsWith('image/')) {
    lightboxSrc.value = getStorageUrl(att.path)
    lightboxName.value = att.name
  } else {
    window.open(getStorageUrl(att.path), '_blank')
  }
}

// ── Context Menu ───────────────────────────────────────────────────────
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
  editingMessage.value = null
  replyingTo.value = contextMenu.value.message
  contextMenu.value.show = false
  messageInputRef.value?.focus()
}

function startEdit() {
  const msg = contextMenu.value.message
  if (msg) {
    replyingTo.value = null
    selectedFiles.value = []
    editingMessage.value = msg
    messageText.value = msg.body || ''
    contextMenu.value.show = false
    messageInputRef.value?.focus()
  }
}

function cancelEditing() {
  editingMessage.value = null
  messageText.value = ''
  selectedFiles.value = []
  resetTextarea()
}

async function confirmDelete() {
  const msg = contextMenu.value.message
  if (msg && confirm('Delete this message?')) {
    const ok = await chatStore.deleteMessage(msg.id)
    if (!ok) toast.error('Failed to delete message.')
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
  const area = messagesAreaRef.value
  if (!area) return
  const distFromBottom = area.scrollHeight - area.scrollTop - area.clientHeight
  showScrollBtn.value = distFromBottom > 300
}

watch(() => chatStore.messages.length, () => {
  const area = messagesAreaRef.value
  if (!area) return
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
  const map: Record<string, string> = {
    admin: 'Support',
    store_owner: 'Shop Owner',
    client: 'Customer',
  }
  return map[role] || role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
}

// ── Lifecycle ───────────────────────────────────────────────────────────
onMounted(async () => {
  chatStore.requestNotificationPermission()
  chatStore.connect()
  await chatStore.fetchChats()
  await fetchEligibleContacts()
})

onBeforeUnmount(() => {
  if (searchTimeout) clearTimeout(searchTimeout)
  if (recordingTimerInterval) clearInterval(recordingTimerInterval)
  if (currentAudio) { currentAudio.pause(); currentAudio = null }
  // Keep realtime socket alive globally; App.vue manages disconnect on logout.
})
</script>

<style scoped>
/* ═══════════════════════════════════════════════════════════════════════
   MessagesView — Warm & Elegant theme
   Teal primary (#10B981), warm neutrals, amber accent.
   Sent bubbles: bg-primary-500 text-white
   Received bubbles: bg-warm-100 dark:bg-warm-700
   ═══════════════════════════════════════════════════════════════════════ */

.nexus-chat {
  height: 100%;
  max-height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, color-mix(in srgb, var(--color-primary) 8%, transparent), transparent 22rem),
    radial-gradient(circle at bottom right, rgba(16, 185, 129, 0.07), transparent 24rem),
    linear-gradient(180deg, rgba(250, 250, 249, 0.6), rgba(250, 250, 249, 0.95));
}

:root.dark .nexus-chat {
  background:
    radial-gradient(circle at top left, color-mix(in srgb, var(--color-primary) 6%, transparent), transparent 22rem),
    radial-gradient(circle at bottom right, rgba(16, 185, 129, 0.05), transparent 24rem),
    linear-gradient(180deg, var(--color-warm-900), var(--color-warm-950));
}

.nexus-container {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  gap: 10px;
  padding: 10px;
  background: transparent;
}

.chat-sidebar {
  width: 360px;
  min-width: 360px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  border-radius: var(--radius-xl);
  border: 1px solid color-mix(in srgb, var(--color-primary) 12%, transparent);
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: var(--shadow-card);
}

:root.dark .chat-sidebar {
  background: rgba(41, 37, 36, 0.8);
  border-color: rgba(68, 64, 60, 0.6);
}

.sidebar-header {
  padding: 18px 22px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.sidebar-header-left {
  min-width: 0;
}

.sidebar-title {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--color-text);
}

.title-icon {
  color: var(--color-primary);
}

/* ── Unified Search ── */
.sidebar-search {
  position: relative;
  padding: 0 22px 12px;
}

/* ── Filter Tabs ── */
.sidebar-filter-tabs {
  display: flex;
  gap: 6px;
  padding: 0 22px 14px;
}

.sidebar-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0.5rem 0.85rem;
  border-radius: var(--radius-full);
  border: 1px solid transparent;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.sidebar-tab:hover {
  background: color-mix(in srgb, var(--color-primary) 6%, transparent);
  color: var(--color-text);
}

.sidebar-tab-active {
  background: color-mix(in srgb, var(--color-primary) 14%, transparent);
  color: var(--color-primary);
  border-color: color-mix(in srgb, var(--color-primary) 20%, transparent);
  font-weight: 700;
}

.sidebar-tab-badge {
  min-width: 1.2rem;
  height: 1.2rem;
  padding: 0 0.3rem;
  border-radius: var(--radius-full);
  background: #EF4444;
  color: #fff;
  font-size: 0.625rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* ── Section Labels ── */
.chat-list-section-label {
  padding: 10px 14px 6px;
  color: var(--color-text-muted);
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

/* ── Dropdown section label ── */
.dropdown-section-label {
  padding: 8px 14px 4px;
  color: var(--color-text-muted);
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

/* ── User Status Text ── */
.user-status-text {
  flex-shrink: 0;
  font-size: 0.75rem;
  font-weight: 600;
}

.user-status-text.status-online {
  color: #059669;
}

.user-status-text.status-offline {
  color: var(--color-text-muted);
}

.connection-badge {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0.45rem 0.8rem;
  border-radius: var(--radius-full);
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.conn-dot {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  display: inline-block;
}

.conn-connected {
  background: color-mix(in srgb, #10B981 12%, transparent);
  color: #059669;
}

.conn-connected .conn-dot {
  background: #10B981;
}

.conn-connecting {
  background: color-mix(in srgb, #F59E0B 14%, transparent);
  color: #a25c12;
}

.conn-connecting .conn-dot {
  background: #F59E0B;
  animation: pulse 1s infinite;
}

.conn-disconnected {
  background: color-mix(in srgb, #F97066 12%, transparent);
  color: #dc2626;
}

.conn-disconnected .conn-dot {
  background: #F97066;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0.85rem 0.95rem;
  border: 1px solid color-mix(in srgb, var(--color-primary) 14%, transparent);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.95);
  box-shadow: var(--shadow-soft);
  transition: border-color var(--transition-base), box-shadow var(--transition-base), transform var(--transition-base);
}

:root.dark .search-box {
  background: var(--color-warm-800);
}

.search-box:focus-within {
  border-color: color-mix(in srgb, var(--color-primary) 40%, transparent);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-primary) 8%, transparent);
  transform: translateY(-1px);
}

.search-icon {
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: var(--color-text);
  font-size: 0.875rem;
}

.search-input::placeholder {
  color: var(--color-text-muted);
}

.search-clear {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: var(--radius-full);
  color: var(--color-text-muted);
  transition: background var(--transition-fast), color var(--transition-fast);
}

.search-clear:hover {
  background: var(--color-bg-hover);
  color: var(--color-text);
}

.search-dropdown {
  position: absolute;
  top: calc(100% - 10px);
  left: 22px;
  right: 22px;
  z-index: 20;
  overflow-y: auto;
  max-height: 280px;
  border: 1px solid color-mix(in srgb, var(--color-primary) 14%, transparent);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.98);
  box-shadow: var(--shadow-elevated);
  backdrop-filter: blur(14px);
}

:root.dark .search-dropdown {
  background: var(--color-warm-800);
}

.search-loading {
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text-secondary);
  font-size: 0.8125rem;
}

.search-result {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 14px;
  text-align: left;
  border-radius: var(--radius-md);
  transition: background var(--transition-fast) ease, transform var(--transition-fast) ease;
}

.search-result:hover {
  background: color-mix(in srgb, var(--color-primary) 8%, transparent);
  transform: translateX(2px);
}

.search-result-info {
  flex: 1;
  min-width: 0;
}

.search-result-name {
  display: block;
  color: var(--color-text);
  font-size: 0.875rem;
  font-weight: 700;
  line-height: 1.2;
}

.search-result-role {
  display: block;
  margin-top: 0.18rem;
  color: var(--color-text-secondary);
  font-size: 0.75rem;
}

.search-result-status {
  flex-shrink: 0;
  padding: 0.28rem 0.55rem;
  border-radius: var(--radius-full);
  background: color-mix(in srgb, #10B981 12%, transparent);
  color: #059669;
  font-size: 0.6875rem;
  font-weight: 700;
}

/* (old contact-support/eligible-contacts styles removed — replaced by USERS section) */

.avatar-wrap {
  position: relative;
  flex-shrink: 0;
}

.avatar {
  width: 42px;
  height: 42px;
  border-radius: var(--radius-full);
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.95);
  box-shadow: var(--shadow-soft);
}

.avatar-placeholder {
  width: 42px;
  height: 42px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #34D399, #10B981);
  color: #fff;
  font-size: 1rem;
  font-weight: 700;
  box-shadow: var(--shadow-card);
}

.avatar-placeholder.sm {
  width: 40px;
  height: 40px;
  font-size: 0.95rem;
}

.online-dot {
  position: absolute;
  right: 2px;
  bottom: 2px;
  width: 11px;
  height: 11px;
  border-radius: var(--radius-full);
  border: 2px solid #fff;
  background: #10B981;
}

.chat-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 12px 14px;
}

.chat-list-loading,
.chat-list-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 3rem 1.25rem;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 0.8125rem;
}

.empty-state-orb {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 5rem;
  height: 5rem;
  border-radius: var(--radius-full);
  background:
    radial-gradient(circle at top, color-mix(in srgb, var(--color-primary) 20%, transparent), color-mix(in srgb, var(--color-primary) 6%, transparent));
  color: var(--color-primary);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    var(--shadow-card);
}

.empty-state-orb-sm {
  width: 4rem;
  height: 4rem;
}

.empty-icon,
.empty-send-icon,
.no-chat-icon {
  color: inherit;
}

.empty-hint {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 0.75rem;
  line-height: 1.55;
  max-width: 26ch;
}

.chat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  margin-bottom: 4px;
  padding: 13px 14px;
  border: 1px solid transparent;
  border-radius: var(--radius-lg);
  text-align: left;
  background: transparent;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease, border-color 0.2s ease;
}

.chat-item:hover {
  transform: translateY(-1px);
  background: color-mix(in srgb, var(--color-primary) 6%, transparent);
  border-color: color-mix(in srgb, var(--color-primary) 8%, transparent);
}

.chat-item-active {
  background: linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 16%, transparent), color-mix(in srgb, var(--color-primary) 8%, transparent)) !important;
  border-color: color-mix(in srgb, var(--color-primary) 24%, transparent);
  box-shadow: var(--shadow-card);
}

.chat-item-unread .chat-item-name {
  color: var(--color-primary);
}

.chat-item-info {
  flex: 1;
  min-width: 0;
}

.chat-item-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 0.3rem;
}

.chat-item-heading {
  min-width: 0;
}

.chat-item-name {
  display: block;
  color: var(--color-text);
  font-size: 0.9rem;
  font-weight: 700;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-item-role {
  display: inline-flex;
  margin-top: 0.32rem;
  padding: 0.18rem 0.5rem;
  border-radius: var(--radius-full);
  background: color-mix(in srgb, var(--color-primary) 8%, transparent);
  color: var(--color-primary);
  font-size: 0.6875rem;
  font-weight: 700;
}

.chat-item-time {
  flex-shrink: 0;
  color: var(--color-text-muted);
  font-size: 0.6875rem;
  font-weight: 600;
}

.chat-item-bottom {
  display: flex;
  align-items: center;
  gap: 10px;
}

.chat-item-preview {
  flex: 1;
  min-width: 0;
  color: var(--color-text-secondary);
  font-size: 0.79rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preview-unread {
  color: var(--color-text);
  font-weight: 600;
}

.unread-badge {
  flex-shrink: 0;
  min-width: 1.35rem;
  padding: 0.15rem 0.45rem;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, #34D399, #10B981);
  color: #fff;
  font-size: 0.6875rem;
  font-weight: 700;
  text-align: center;
  box-shadow: var(--shadow-soft);
}

.chat-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: transparent;
}

:root.dark .chat-panel {
  background: transparent;
}

.no-chat-selected {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  border-radius: var(--radius-xl);
  border: 1px solid color-mix(in srgb, var(--color-primary) 12%, transparent);
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: var(--shadow-card);
}

:root.dark .no-chat-selected {
  background: rgba(41, 37, 36, 0.8);
  border-color: rgba(68, 64, 60, 0.6);
}

.no-chat-card {
  max-width: 36rem;
  padding: 2.5rem 2.25rem;
  border: 1px solid color-mix(in srgb, var(--color-primary) 12%, transparent);
  border-radius: var(--radius-xl);
  background:
    radial-gradient(circle at top, color-mix(in srgb, var(--color-primary) 10%, transparent), transparent 16rem),
    rgba(255, 255, 255, 0.88);
  box-shadow: var(--shadow-card);
  text-align: center;
}

:root.dark .no-chat-card {
  background:
    radial-gradient(circle at top, color-mix(in srgb, var(--color-primary) 8%, transparent), transparent 16rem),
    var(--color-warm-800);
}

.no-chat-orb {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 6.25rem;
  height: 6.25rem;
  margin-bottom: 1.25rem;
  border-radius: var(--radius-full);
  background:
    radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.95), color-mix(in srgb, var(--color-primary) 15%, transparent));
  color: var(--color-primary);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.95),
    var(--shadow-elevated);
}

.no-chat-kicker {
  display: inline-flex;
  margin-bottom: 0.85rem;
  color: var(--color-primary);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.no-chat-selected h3 {
  margin: 0;
  color: var(--color-text);
  font-size: 1.625rem;
  font-weight: 700;
}

.no-chat-selected p {
  margin: 0.85rem auto 0;
  color: var(--color-text-secondary);
  font-size: 0.9375rem;
  line-height: 1.75;
  max-width: 36ch;
}

.no-chat-points {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 1.4rem;
}

.no-chat-point {
  display: inline-flex;
  align-items: center;
  padding: 0.55rem 0.9rem;
  border-radius: var(--radius-full);
  background: color-mix(in srgb, var(--color-primary) 8%, transparent);
  color: var(--color-primary);
  font-size: 0.75rem;
  font-weight: 700;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 22px;
  border-radius: var(--radius-xl);
  border: 1px solid color-mix(in srgb, var(--color-primary) 12%, transparent);
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: var(--shadow-card);
  flex-shrink: 0;
}

:root.dark .chat-header {
  background: rgba(41, 37, 36, 0.8);
  border-color: rgba(68, 64, 60, 0.6);
}

.chat-header-main {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  background: color-mix(in srgb, var(--color-primary) 6%, transparent);
  transition: background var(--transition-fast) ease, color var(--transition-fast) ease, transform var(--transition-fast) ease;
}

.back-btn:hover {
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
  color: var(--color-primary);
  transform: translateX(-1px);
}

.chat-header-info {
  min-width: 0;
}

.chat-header-name {
  margin: 0;
  color: var(--color-text);
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.25;
}

.chat-header-status {
  margin: 0.22rem 0 0;
  color: var(--color-text-secondary);
  font-size: 0.8125rem;
}

.status-online {
  color: #059669;
  font-weight: 700;
}

.status-offline {
  color: var(--color-text-muted);
}

.typing-text {
  color: var(--color-primary);
  font-weight: 700;
}

.typing-dots span {
  animation: typingDot 1.4s infinite;
  animation-fill-mode: both;
}

.typing-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

.chat-header-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.chat-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0.55rem 0.85rem;
  border-radius: var(--radius-full);
  background: color-mix(in srgb, var(--color-primary) 10%, transparent);
  color: var(--color-primary);
  font-size: 0.75rem;
  font-weight: 700;
}

.chat-chip-muted {
  background: color-mix(in srgb, var(--color-warm-500) 8%, transparent);
  color: var(--color-text-secondary);
}

.messages-area {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px 22px 22px;
  border-radius: var(--radius-xl);
  border: 1px solid color-mix(in srgb, var(--color-primary) 10%, transparent);
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: var(--shadow-soft);
}

:root.dark .messages-area {
  background: rgba(41, 37, 36, 0.8);
  border-color: rgba(68, 64, 60, 0.6);
}

.messages-intro {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0.9rem 1rem;
  margin-bottom: 6px;
  border: 1px solid color-mix(in srgb, var(--color-primary) 12%, transparent);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.78);
  box-shadow: var(--shadow-soft);
}

:root.dark .messages-intro {
  background: var(--color-warm-800);
}

.messages-intro-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.4rem;
  height: 2.4rem;
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
  color: var(--color-primary);
}

.messages-intro-copy {
  min-width: 0;
}

.messages-intro-title {
  margin: 0;
  color: var(--color-text);
  font-size: 0.875rem;
  font-weight: 700;
}

.messages-intro-text {
  margin: 0.2rem 0 0;
  color: var(--color-text-secondary);
  font-size: 0.75rem;
}

.load-more {
  text-align: center;
  padding: 8px 0 2px;
}

.load-more-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0.55rem 1rem;
  border-radius: var(--radius-full);
  background: color-mix(in srgb, var(--color-primary) 8%, transparent);
  color: var(--color-primary);
  font-size: 0.75rem;
  font-weight: 700;
  transition: background var(--transition-fast) ease, transform var(--transition-fast) ease;
}

.load-more-btn:hover {
  background: color-mix(in srgb, var(--color-primary) 14%, transparent);
  transform: translateY(-1px);
}

.messages-loading,
.messages-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--color-text-muted);
  text-align: center;
  font-size: 0.875rem;
}

.date-separator {
  text-align: center;
  padding: 14px 0 10px;
}

.date-separator span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.38rem 0.9rem;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid color-mix(in srgb, var(--color-primary) 10%, transparent);
  color: var(--color-text-secondary);
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

:root.dark .date-separator span {
  background: var(--color-warm-800);
}

.message-group {
  display: flex;
  flex-direction: column;
  animation: messageSlideIn 0.25s ease-out both;
}

@keyframes messageSlideIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-row {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  max-width: min(80%, 44rem);
  margin-bottom: 4px;
}

.message-own {
  margin-left: auto;
  flex-direction: row-reverse;
}

.message-other {
  margin-right: auto;
}

.message-avatar {
  width: 30px;
  height: 30px;
  border-radius: var(--radius-full);
  object-fit: cover;
  flex-shrink: 0;
  border: 2px solid rgba(255, 255, 255, 0.95);
}

.message-avatar-placeholder {
  width: 30px;
  height: 30px;
  font-size: 0.75rem;
}

.message-avatar-spacer {
  width: 30px;
  flex-shrink: 0;
}

.message-bubble-wrap {
  max-width: 100%;
  min-width: 0;
}

.message-sender {
  margin-bottom: 4px;
  padding-left: 4px;
  color: var(--color-text-secondary);
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.reply-preview {
  display: flex;
  align-items: stretch;
  gap: 10px;
  padding: 0.55rem 0.75rem;
  margin-bottom: 4px;
  border-radius: var(--radius-md) var(--radius-md) var(--radius-sm) var(--radius-sm);
  background: color-mix(in srgb, var(--color-primary) 10%, transparent);
  cursor: pointer;
  font-size: 0.75rem;
}

.reply-bar {
  width: 3px;
  border-radius: var(--radius-full);
  background: linear-gradient(180deg, #34D399, #10B981);
}

.reply-content {
  min-width: 0;
}

.reply-name {
  display: block;
  color: var(--color-primary);
  font-weight: 700;
}

.reply-text {
  display: block;
  margin-top: 0.18rem;
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.forwarded-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
  padding: 0 6px;
  color: var(--color-text-secondary);
  font-size: 0.6875rem;
  font-style: italic;
}

.message-bubble {
  position: relative;
  padding: 0.9rem 1rem 0.78rem;
  border-radius: var(--radius-xl);
  word-break: break-word;
  box-shadow: var(--shadow-soft);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

/* Sent messages: teal bubble */
.message-own .message-bubble {
  border-bottom-right-radius: var(--radius-sm);
  background: linear-gradient(135deg, #34D399, #10B981);
  color: #fff;
}

/* Received messages: warm tones */
.message-other .message-bubble {
  border: 1px solid color-mix(in srgb, var(--color-primary) 10%, transparent);
  border-bottom-left-radius: var(--radius-sm);
  background: var(--color-warm-100, #F5F5F4);
  color: var(--color-text);
}

:root.dark .message-other .message-bubble {
  background: var(--color-warm-700, #44403C);
  border-color: color-mix(in srgb, var(--color-primary) 12%, transparent);
}

.bubble-deleted {
  background: rgba(250, 250, 249, 0.9) !important;
  color: var(--color-text-muted) !important;
  font-style: italic;
}

:root.dark .bubble-deleted {
  background: var(--color-warm-800) !important;
}

.deleted-text {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8125rem;
}

.message-text {
  margin: 0;
  white-space: pre-wrap;
  font-size: 0.9rem;
  line-height: 1.6;
}

.message-attachments {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.attachment-image {
  max-width: 280px;
  max-height: 220px;
  border-radius: var(--radius-lg);
  object-fit: cover;
  cursor: pointer;
  box-shadow: var(--shadow-card);
}

.attachment-file {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  max-width: 100%;
  padding: 0.65rem 0.8rem;
  border-radius: var(--radius-md);
  text-decoration: none;
  font-size: 0.75rem;
  font-weight: 600;
}

.message-own .attachment-file {
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
}

.message-other .attachment-file {
  background: color-mix(in srgb, var(--color-primary) 8%, transparent);
  color: var(--color-text);
}

.message-meta {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  margin-top: 6px;
}

.edited-label,
.message-time {
  font-size: 0.625rem;
  font-weight: 600;
  opacity: 0.7;
}

.status-ticks {
  display: flex;
  align-items: center;
}

.tick-sent {
  opacity: 0.55;
}

.tick-delivered {
  opacity: 0.72;
}

.tick-read {
  color: #6EE7B7;
  opacity: 1;
}

.message-own .tick-read {
  color: #A7F3D0;
}

.message-reactions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.reaction-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0.28rem 0.55rem;
  border-radius: var(--radius-full);
  border: 1px solid color-mix(in srgb, var(--color-primary) 12%, transparent);
  background: rgba(255, 255, 255, 0.82);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-text-secondary);
  transition: transform var(--transition-fast) ease, border-color var(--transition-fast) ease, background var(--transition-fast) ease;
}

:root.dark .reaction-pill {
  background: var(--color-warm-800);
}

.reaction-pill:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--color-primary) 28%, transparent);
  background: color-mix(in srgb, var(--color-primary) 8%, transparent);
}

.reaction-own {
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
  border-color: color-mix(in srgb, var(--color-primary) 24%, transparent);
  color: var(--color-primary);
}

.typing-indicator-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  max-width: 75%;
  margin-right: auto;
}

.typing-bubble {
  padding: 0.75rem 0.95rem;
  border-radius: var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-sm);
  border: 1px solid color-mix(in srgb, var(--color-primary) 10%, transparent);
  background: var(--color-warm-100, #F5F5F4);
  box-shadow: var(--shadow-soft);
}

:root.dark .typing-bubble {
  background: var(--color-warm-700);
}

.typing-animation {
  display: flex;
  gap: 4px;
}

.typing-animation span {
  width: 6px;
  height: 6px;
  border-radius: var(--radius-full);
  background: var(--color-text-muted);
  animation: typingBounce 1.4s infinite;
}

.typing-animation span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-animation span:nth-child(3) {
  animation-delay: 0.4s;
}

.reply-bar-input {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0.8rem 1.2rem;
  border-radius: var(--radius-xl);
  border: 1px solid color-mix(in srgb, var(--color-primary) 12%, transparent);
  background: rgba(255, 255, 255, 0.95);
  box-shadow: var(--shadow-soft);
  flex-shrink: 0;
}

:root.dark .reply-bar-input {
  background: var(--color-warm-800);
  border-color: var(--color-warm-700);
}

.edit-bar-input {
  background: color-mix(in srgb, #F59E0B 8%, transparent);
}

.reply-bar-content {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  color: var(--color-text-secondary);
  font-size: 0.75rem;
}

.reply-bar-name {
  color: var(--color-primary);
  font-weight: 700;
}

.reply-bar-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.reply-bar-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: var(--radius-full);
  color: var(--color-text-muted);
  transition: background var(--transition-fast) ease, color var(--transition-fast) ease;
}

.reply-bar-close:hover {
  background: var(--color-bg-hover);
  color: var(--color-text);
}

.message-input-area {
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border-light);
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: var(--shadow-sm);
  flex-shrink: 0;
}

:root.dark .message-input-area {
  background: rgba(41, 37, 36, 0.8);
  border-color: rgba(68, 64, 60, 0.6);
}

/* ── File Preview (above input bar) ──────────────────────────────── */
.file-preview {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--color-border-light);
}

.file-preview-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px 4px 4px;
  border-radius: 8px;
  background: var(--color-bg-elevated);
  color: var(--color-text);
  font-size: 0.7rem;
  transition: background 0.15s ease;
}

.file-preview-item:hover {
  background: var(--color-bg-hover);
}

:root.dark .file-preview-item {
  background: var(--color-warm-700);
}

.file-preview-img {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  object-fit: cover;
}

.file-preview-name {
  max-width: 100px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
}

.file-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  color: var(--color-text-muted);
  transition: all 0.15s ease;
}

.file-remove:hover {
  background: rgba(249, 112, 102, 0.15);
  color: #F97066;
}

.file-count-badge {
  font-size: 0.6rem;
  font-weight: 700;
  color: var(--color-text-muted);
  padding: 2px 6px;
  border-radius: 10px;
  background: var(--color-bg-elevated);
}

/* ── WhatsApp-style Input Row ────────────────────────────────────── */
.input-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 8px 10px;
}

.input-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
  color: var(--color-text-secondary);
  transition: color 0.15s ease;
  flex-shrink: 0;
}

.input-action-btn:hover {
  color: var(--color-text);
}

:root.dark .input-action-btn:hover {
  color: var(--color-primary-light);
}

.input-wrap {
  flex: 1;
  min-width: 0;
  border-radius: 22px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-light);
  transition: border-color 0.15s ease;
}

.input-wrap:focus-within {
  border-color: var(--color-primary);
}

:root.dark .input-wrap {
  background: var(--color-warm-700);
  border-color: transparent;
}

.message-input {
  width: 100%;
  border: none;
  outline: none;
  resize: none;
  background: transparent;
  color: var(--color-text);
  padding: 9px 16px;
  font-size: 0.9rem;
  line-height: 1.4;
  max-height: 120px;
  border-radius: 22px;
}

.message-input::placeholder {
  color: var(--color-text-muted);
}

.send-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  padding: 0;
  cursor: pointer;
  background: var(--color-primary);
  color: #fff;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.send-btn:hover:not(:disabled) {
  background: var(--color-primary-light);
}

.send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: var(--color-text-muted);
}

.context-menu {
  position: fixed;
  z-index: 50;
  min-width: 220px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--color-primary) 14%, transparent);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.98);
  box-shadow: var(--shadow-float);
  backdrop-filter: blur(20px);
  animation: contextMenuIn 0.15s ease-out both;
}

:root.dark .context-menu {
  background: var(--color-warm-800);
}

.context-reactions {
  display: flex;
  gap: 4px;
  padding: 10px;
  border-bottom: 1px solid color-mix(in srgb, var(--color-primary) 8%, transparent);
}

.quick-reaction {
  font-size: 1.25rem;
  padding: 0.35rem 0.45rem;
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast) ease, transform var(--transition-fast) ease;
}

.quick-reaction:hover {
  background: color-mix(in srgb, var(--color-primary) 8%, transparent);
  transform: translateY(-1px);
}

.context-actions {
  padding: 8px;
}

.context-action {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 0.7rem 0.85rem;
  border-radius: var(--radius-md);
  color: var(--color-text);
  font-size: 0.8125rem;
  font-weight: 600;
  text-align: left;
  transition: background var(--transition-fast) ease;
}

.context-action:hover {
  background: color-mix(in srgb, var(--color-primary) 8%, transparent);
}

.context-danger {
  color: #F97066;
}

.context-danger:hover {
  background: color-mix(in srgb, #F97066 8%, transparent);
}

.context-overlay {
  position: fixed;
  inset: 0;
  z-index: 40;
}

.italic {
  font-style: italic;
}

/* ── Scroll to Bottom Button ── */
.scroll-to-bottom-btn {
  position: sticky;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, #34D399, #10B981);
  color: #fff;
  box-shadow: var(--shadow-elevated), 0 0 20px rgba(16, 185, 129, 0.25);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  margin: 0 auto;
  float: none;
}

.scroll-to-bottom-btn:hover {
  transform: translateX(-50%) translateY(-2px);
  box-shadow: var(--shadow-float), 0 0 28px rgba(16, 185, 129, 0.3);
}

.scroll-unread {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 1.2rem;
  height: 1.2rem;
  padding: 0 0.3rem;
  border-radius: var(--radius-full);
  background: #F97066;
  color: #fff;
  font-size: 0.625rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ── Message Bubble Hover Effects ── */
.message-row:hover .message-bubble {
  transform: translateY(-1px);
  box-shadow: var(--shadow-card);
}

.message-row.message-own:hover .message-bubble {
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.2);
}

/* ── Transition Helpers ── */
.fade-up-enter-active,
.fade-up-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-up-enter-from,
.fade-up-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
}

/* ── Scrollbar Styling ── */
.messages-area::-webkit-scrollbar {
  width: 6px;
}

.messages-area::-webkit-scrollbar-track {
  background: transparent;
}

.messages-area::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--color-primary) 20%, transparent);
  border-radius: var(--radius-full);
}

.messages-area::-webkit-scrollbar-thumb:hover {
  background: color-mix(in srgb, var(--color-primary) 35%, transparent);
}

.chat-list::-webkit-scrollbar {
  width: 5px;
}

.chat-list::-webkit-scrollbar-track {
  background: transparent;
}

.chat-list::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--color-warm-500) 15%, transparent);
  border-radius: var(--radius-full);
}

.chat-list::-webkit-scrollbar-thumb:hover {
  background: color-mix(in srgb, var(--color-warm-500) 30%, transparent);
}

/* ── Context Menu Animation ── */
@keyframes contextMenuIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-4px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* ── Send Button Pulse ── */
.send-btn:not(:disabled) {
  animation: sendPulse 2s ease-in-out infinite;
}

@keyframes sendPulse {
  0%, 100% {
    box-shadow: var(--shadow-card);
  }
  50% {
    box-shadow: var(--shadow-card), 0 0 16px rgba(16, 185, 129, 0.15);
  }
}

@keyframes typingDot {
  0%,
  80%,
  100% {
    opacity: 0;
  }
  40% {
    opacity: 1;
  }
}

@keyframes typingBounce {
  0%,
  80%,
  100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-6px);
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@media (max-width: 1200px) {
  .chat-header {
    flex-direction: column;
    align-items: stretch;
  }

  .chat-header-actions {
    justify-content: flex-start;
  }

  .message-row {
    max-width: min(88%, 38rem);
  }
}

@media (max-width: 768px) {
  .nexus-container {
    gap: 0;
    padding: 0;
  }

  .chat-sidebar {
    width: 100%;
    min-width: 100%;
    border-radius: 0;
    border: none;
    box-shadow: none;
  }

  .chat-panel {
    gap: 0;
  }

  .chat-header,
  .messages-area,
  .message-input-area,
  .reply-bar-input {
    border-radius: 0;
    border-left: none;
    border-right: none;
    box-shadow: none;
  }

  .no-chat-selected {
    border-radius: 0;
    border: none;
  }

  .mobile-hidden {
    display: none !important;
  }

  .sidebar-header,
  .sidebar-stats,
  .search-section,
  .messages-area,
  .chat-header,
  .composer-meta-row,
  .file-preview,
  .input-row {
    padding-left: 16px;
    padding-right: 16px;
  }

  .sidebar-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .chat-header-main {
    width: 100%;
  }

  .message-row,
  .typing-indicator-row {
    max-width: 92%;
  }

  .input-row {
    gap: 4px;
    padding: 6px 8px;
  }

  .input-action-btn {
    width: 36px;
    height: 36px;
  }

  .send-btn {
    width: 36px;
    height: 36px;
  }
}

@media (max-width: 560px) {
  .sidebar-header {
    flex-direction: column;
    align-items: stretch;
  }

  .connection-badge {
    align-self: flex-start;
  }

  .sidebar-stats {
    grid-template-columns: 1fr;
  }

  .no-chat-card {
    padding: 2rem 1.25rem;
  }

  .chat-header-actions {
    gap: 8px;
  }

  .chat-chip {
    width: 100%;
    justify-content: center;
  }

}

/* ── Clickable header elements ──────────────────────────────────── */
.clickable {
  cursor: pointer;
}
.avatar-wrap.clickable:hover .avatar,
.avatar-wrap.clickable:hover .avatar-placeholder {
  opacity: 0.8;
  transform: scale(1.05);
  transition: all 0.2s ease;
}
.chat-header-name.clickable:hover {
  color: var(--color-primary);
  transition: color 0.2s ease;
}

/* ── User Profile Panel ────────────────────────────────────────── */
.profile-panel-overlay {
  position: fixed;
  inset: 0;
  z-index: 9998;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  justify-content: flex-end;
}

.profile-panel {
  width: 340px;
  max-width: 90vw;
  height: 100%;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-left: 1px solid var(--color-border-light);
  display: flex;
  flex-direction: column;
  box-shadow: -8px 0 32px rgba(0, 0, 0, 0.1);
}

:root.dark .profile-panel {
  background: rgba(41, 37, 36, 0.95);
  border-left-color: rgba(68, 64, 60, 0.6);
  box-shadow: -8px 0 32px rgba(0, 0, 0, 0.3);
}

.profile-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  border-bottom: 1px solid var(--color-border-light);
}

:root.dark .profile-panel-header {
  border-bottom-color: rgba(68, 64, 60, 0.6);
}

.profile-panel-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
}

.profile-panel-close {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.profile-panel-close:hover {
  background: var(--color-bg-hover);
  color: var(--color-text);
}

.profile-panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px 20px;
}

.profile-panel-avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 28px;
}

.profile-panel-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  margin-bottom: 14px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  border: 3px solid var(--color-primary);
}

.profile-panel-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-panel-avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  font-weight: 700;
  color: white;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
}

.profile-panel-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 6px;
}

.profile-panel-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  color: var(--color-text-secondary);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-dot.online {
  background: #10B981;
  box-shadow: 0 0 6px rgba(16, 185, 129, 0.5);
}

.status-dot.offline {
  background: var(--color-text-muted);
}

.profile-panel-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.profile-info-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  border-radius: var(--radius-lg);
  transition: background 0.15s;
}

.profile-info-item:hover {
  background: var(--color-bg-hover);
}

.profile-info-icon {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--color-primary) 10%, transparent);
  color: var(--color-primary);
  flex-shrink: 0;
}

.profile-info-content {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.profile-info-label {
  font-size: 0.72rem;
  font-weight: 500;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.profile-info-value {
  font-size: 0.88rem;
  color: var(--color-text);
  word-break: break-word;
}

/* Profile panel transitions */
.profile-panel-enter-active,
.profile-panel-leave-active {
  transition: opacity 0.25s ease;
}
.profile-panel-enter-active .profile-panel,
.profile-panel-leave-active .profile-panel {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.profile-panel-enter-from,
.profile-panel-leave-to {
  opacity: 0;
}
.profile-panel-enter-from .profile-panel {
  transform: translateX(100%);
}
.profile-panel-leave-to .profile-panel {
  transform: translateX(100%);
}

/* ── Image Lightbox ──────────────────────────────────────────────── */
.lightbox-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  cursor: zoom-out;
}

.lightbox-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease;
  cursor: pointer;
  z-index: 1;
}

.lightbox-close:hover {
  background: rgba(255, 255, 255, 0.25);
}

.lightbox-img {
  max-width: 90vw;
  max-height: 85vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  cursor: default;
}

.lightbox-caption {
  margin-top: 12px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.8rem;
  font-weight: 500;
}

.lightbox-enter-active {
  transition: opacity 0.2s ease;
}
.lightbox-enter-active .lightbox-img {
  transition: transform 0.2s ease;
}
.lightbox-leave-active {
  transition: opacity 0.15s ease;
}
.lightbox-enter-from {
  opacity: 0;
}
.lightbox-enter-from .lightbox-img {
  transform: scale(0.92);
}
.lightbox-leave-to {
  opacity: 0;
}

/* ═══════════════════════════════════════════════════════════════════════
   NEW: Header close button, Attachment Menu, Voice, Status dots
   ═══════════════════════════════════════════════════════════════════════ */

/* ── Header Close Button ── */
.header-close-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: var(--radius-full);
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.header-close-btn:hover {
  background: color-mix(in srgb, var(--color-primary) 10%, transparent);
  color: var(--color-text);
}

/* ── Inline Status Dots ── */
.status-dot-inline {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: var(--radius-full);
  margin-right: 3px;
  vertical-align: middle;
}

.status-dot-inline.online {
  background: #10B981;
}

.status-dot-inline.offline {
  background: var(--color-text-muted);
}

/* ── Categorized Attachment Menu ── */
.attachment-menu-overlay {
  position: fixed;
  inset: 0;
  z-index: 25;
}

.attachment-menu {
  position: absolute;
  bottom: calc(100% + 8px);
  right: 50px;
  z-index: 30;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px;
  border-radius: var(--radius-lg);
  border: 1px solid color-mix(in srgb, var(--color-primary) 14%, transparent);
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: var(--shadow-float, 0 20px 48px rgba(28, 25, 23, 0.1));
}

:root.dark .attachment-menu {
  background: rgba(41, 37, 36, 0.95);
}

.attachment-menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  border: none;
  background: transparent;
  color: var(--color-text);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease;
  white-space: nowrap;
}

.attachment-menu-item:hover {
  background: color-mix(in srgb, var(--color-primary) 8%, transparent);
}

.attachment-menu-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
}

.attachment-menu-icon.photo {
  background: color-mix(in srgb, #8B5CF6 12%, transparent);
  color: #8B5CF6;
}

.attachment-menu-icon.video {
  background: color-mix(in srgb, #EF4444 12%, transparent);
  color: #EF4444;
}

.attachment-menu-icon.document {
  background: color-mix(in srgb, #3B82F6 12%, transparent);
  color: #3B82F6;
}

.attachment-menu-enter-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.attachment-menu-leave-active {
  transition: opacity 0.1s ease, transform 0.1s ease;
}
.attachment-menu-enter-from,
.attachment-menu-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.95);
}

/* ── Voice Recording ── */
.voice-btn {
  color: var(--color-text-secondary);
}

.voice-btn:hover {
  color: var(--color-primary);
}

.voice-recording-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.voice-cancel-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: color-mix(in srgb, #EF4444 10%, transparent);
  color: #EF4444;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s ease;
}

.voice-cancel-btn:hover {
  background: color-mix(in srgb, #EF4444 18%, transparent);
}

.voice-recording-indicator {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.recording-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #EF4444;
  animation: recordingPulse 1s ease-in-out infinite;
}

@keyframes recordingPulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
}

.recording-time {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
}

/* ── Voice Message Player (in bubbles) ── */
.voice-message-player {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 0;
  min-width: 180px;
}

.voice-play-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s ease;
}

.message-own .voice-play-btn {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.message-own .voice-play-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.message-other .voice-play-btn {
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
  color: var(--color-primary);
}

.message-other .voice-play-btn:hover {
  background: color-mix(in srgb, var(--color-primary) 20%, transparent);
}

.voice-waveform {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: rgba(0, 0, 0, 0.15);
  position: relative;
  overflow: hidden;
}

.message-own .voice-waveform {
  background: rgba(255, 255, 255, 0.25);
}

.voice-progress {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  border-radius: 2px;
  transition: width 0.2s linear;
}

.message-own .voice-progress {
  background: #fff;
}

.message-other .voice-progress {
  background: var(--color-primary);
}

.voice-duration {
  font-size: 0.6875rem;
  font-weight: 600;
  opacity: 0.7;
  font-variant-numeric: tabular-nums;
}

/* ── Video / Audio Attachments ── */
.attachment-video {
  max-width: 320px;
  max-height: 240px;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
}

.attachment-audio {
  width: 100%;
  max-width: 280px;
  border-radius: var(--radius-full);
}

/* ── Mobile: Attachment Menu + Voice + Tabs ── */
@media (max-width: 768px) {
  .sidebar-filter-tabs {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 8px;
  }

  .attachment-menu {
    right: 10px;
    left: 10px;
    flex-direction: row;
    justify-content: space-around;
  }

  .voice-recording-bar {
    padding: 6px 8px;
  }
}
</style>
