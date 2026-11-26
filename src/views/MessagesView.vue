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
          <div class="sidebar-header-actions">
            <button
              v-if="notifStore.desktopPermission === 'default'"
              type="button"
              class="header-icon-btn"
              title="Show message alerts on your desktop"
              aria-label="Show message alerts on your desktop"
              @click="enableDesktopAlerts"
            >
              <AppIcon icon="bell" class="w-[18px] h-[18px]" />
            </button>
            <button
              type="button"
              class="header-icon-btn"
              :title="soundMuted ? 'Turn message sounds on' : 'Mute message sounds'"
              :aria-label="soundMuted ? 'Turn message sounds on' : 'Mute message sounds'"
              :aria-pressed="soundMuted"
              @click="toggleSound"
            >
              <AppIcon :icon="soundMuted ? 'volume-off' : 'volume'" class="w-[18px] h-[18px]" />
            </button>
          </div>
        </div>

        <!-- Unified Search -->
        <div class="sidebar-search">
          <TextInput
            v-model="searchQuery"
            prefix-icon="search"
            clearable
            clear-label="Clear search"
            placeholder="Search or start a new chat"
            aria-label="Search conversations and people"
            autocomplete="off"
            @input="onSearchInput"
            @clear="clearSearch"
          />
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
              <AppIcon icon="message-circle" class="w-5 h-5 empty-icon" />
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
              <AppIcon icon="message-circle" class="w-6 h-6 no-chat-icon" />
            </div>
            <h3>Select a conversation</h3>
            <p>Choose a chat on the left, or search for a venue, customer or support agent to start a new one.</p>
            <div class="no-chat-points">
              <span class="no-chat-point"><AppIcon icon="checks" class="w-3.5 h-3.5" />Read receipts</span>
              <span class="no-chat-point"><AppIcon icon="paperclip" class="w-3.5 h-3.5" />Photos and files</span>
            </div>
          </div>
        </div>

        <!-- Chat Active -->
        <template v-else>
          <!-- Chat Header -->
          <div class="chat-header">
            <div class="chat-header-main">
              <button type="button" @click="goBack" class="back-btn" aria-label="Back to conversations">
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
              <button type="button" @click="goBack" class="header-close-btn" title="Close chat" aria-label="Close chat">
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
                type="button"
                class="scroll-to-bottom-btn"
                @click="scrollToBottom()"
                title="Scroll to latest"
                aria-label="Scroll to latest message"
              >
                <AppIcon icon="chevron-down" class="w-[18px] h-[18px]" />
                <span v-if="chatStore.currentChat?.unread_count" class="scroll-unread">{{ chatStore.currentChat.unread_count }}</span>
              </button>
            </Transition>
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
                <AppIcon icon="send" class="w-5 h-5 empty-send-icon" />
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

                  <!-- Options (opens the same menu as right-click / long-press) -->
                  <button
                    v-if="!msg.is_deleted"
                    type="button"
                    class="message-more-btn"
                    aria-label="Message options"
                    title="React, reply or edit"
                    @click.stop="showMessageMenu($event, msg)"
                  >
                    <AppIcon icon="more-vertical" class="w-4 h-4" />
                  </button>

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
            <button type="button" @click="replyingTo = null" class="reply-bar-close" aria-label="Cancel reply">
              <AppIcon icon="x" class="w-3.5 h-3.5" />
            </button>
          </div>

          <div v-if="editingMessage" class="reply-bar-input edit-bar-input">
            <div class="reply-bar-content">
              <AppIcon icon="pencil" class="w-3.5 h-3.5" />
              <span class="reply-bar-name">Editing message</span>
              <span class="reply-bar-text">{{ editingMessage.body || '[Attachment]' }}</span>
            </div>
            <button type="button" @click="cancelEditing" class="reply-bar-close" aria-label="Cancel editing">
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
                <button type="button" @click="removeFile(i)" class="file-remove" :aria-label="`Remove ${file.name}`">
                  <AppIcon icon="x" class="w-2.5 h-2.5" />
                </button>
              </div>
              <span class="file-count-badge">{{ selectedFiles.length }}/5</span>
            </div>

            <!-- Voice Recording Bar -->
            <div v-if="isRecording" class="input-row voice-recording-bar">
              <button type="button" @click="cancelVoiceRecording" class="voice-cancel-btn" title="Cancel recording" aria-label="Cancel recording">
                <AppIcon icon="x" class="w-[18px] h-[18px]" />
              </button>
              <div class="voice-recording-indicator">
                <span class="recording-dot"></span>
                <span class="recording-time">{{ formattedRecordingTime }}</span>
              </div>
              <button type="button" @click="stopAndSendVoiceRecording" class="send-btn" title="Send voice message" aria-label="Send voice message">
                <AppIcon icon="send-2" class="w-[18px] h-[18px]" />
              </button>
            </div>

            <!-- Normal Input Row -->
            <div v-else class="input-row">
              <!-- Cancel button (when replying/editing) -->
              <button
                v-if="replyingTo || editingMessage"
                @click="replyingTo ? (replyingTo = null) : cancelEditing()"
                type="button"
                class="input-action-btn"
                title="Cancel"
                aria-label="Cancel"
              >
                <AppIcon icon="x" class="w-5 h-5" />
              </button>

              <!-- Emoji button + small picker -->
              <div class="emoji-anchor">
                <button type="button" @click="showEmojiPicker = !showEmojiPicker" class="input-action-btn" title="Emoji" aria-label="Insert emoji" :aria-expanded="showEmojiPicker">
                  <AppIcon icon="mood-smile" class="w-[22px] h-[22px]" />
                </button>
                <div v-if="showEmojiPicker" class="emoji-overlay" @click="showEmojiPicker = false"></div>
                <div v-if="showEmojiPicker" class="emoji-picker" role="menu" aria-label="Emoji">
                  <button
                    v-for="e in emojiChoices"
                    :key="e"
                    type="button"
                    role="menuitem"
                    class="emoji-choice"
                    @click="messageText += e; onInputChange(); showEmojiPicker = false; messageInputRef?.focus()"
                  >{{ e }}</button>
                </div>
              </div>

              <!-- Text Input (pill shape) -->
              <div class="input-wrap">
                <textarea
                  ref="messageInputRef"
                  v-model="messageText"
                  :placeholder="editingMessage ? 'Update your message...' : 'Type a message...'"
                  class="message-input"
                  rows="1"
                  aria-label="Message"
                  @keydown="onInputKeydown"
                  @input="onInputChange"
                ></textarea>
              </div>

              <!-- Attach button (opens categorized menu) -->
              <button type="button" @click="toggleAttachmentMenu" class="input-action-btn" title="Attach files" aria-label="Attach files" :aria-expanded="showAttachmentMenu">
                <AppIcon icon="paperclip" class="w-[22px] h-[22px]" />
              </button>

              <!-- Send OR Mic button -->
              <button v-if="canSend" type="button" @click="handleSend" class="send-btn" :disabled="!canSend" aria-label="Send message" title="Send">
                <AppIcon icon="send-2" class="w-[18px] h-[18px]" />
              </button>
              <button v-else type="button" @click="startVoiceRecording" class="input-action-btn voice-btn" title="Voice message" aria-label="Record voice message">
                <AppIcon icon="microphone" class="w-[22px] h-[22px]" />
              </button>
            </div>
          </div>

          <!-- Quick Reaction Picker -->
          <div v-if="contextMenu.show" class="context-menu" :style="contextMenuStyle" @click.stop>
            <div class="context-reactions" role="group" aria-label="React">
              <button v-for="emoji in quickReactions" :key="emoji" type="button" :aria-label="`React with ${emoji}`" @click="reactToMessage(emoji)" class="quick-reaction">
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
            <button type="button" class="profile-panel-close" aria-label="Close contact info" @click="showUserProfile = false">
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
          <button type="button" class="lightbox-close" @click="lightboxSrc = ''" title="Close" aria-label="Close image">
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
import { TextInput } from '@/components/forms'
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useChatStore, type Chat, type ChatMessage, type ChatUser } from '@/stores/chat'
import { useAuthStore } from '@/stores/auth'
import api from '@/lib/axios'
import { getStorageUrl } from '@/lib/storageUrl'
import { formatDistanceToNow, format, isToday, isYesterday, isSameDay } from 'date-fns'
import { toast } from 'vue-sonner'
import AppIcon from '@/components/ui/AppIcon.vue'
import { useNotificationStore } from '@/stores/notifications'
import { soundService } from '@/services/soundService'
import { useChatDrafts } from '@/composables/useChatDrafts'

const chatStore = useChatStore()
const authStore = useAuthStore()
const notifStore = useNotificationStore()

// ── Alert settings (sound + desktop notifications) ─────────────────────
const soundMuted = computed(() => soundService.muted.value)
function toggleSound() {
  soundService.setMuted(!soundService.isMuted())
  toast.success(soundService.isMuted() ? 'Message sounds muted.' : 'Message sounds on.')
}
async function enableDesktopAlerts() {
  const result = await notifStore.requestBrowserPermission()
  if (result === 'granted') toast.success('You will get a desktop alert for new messages while this tab is in the background.')
  else if (result === 'denied') toast.error('Desktop alerts are blocked in your browser settings.')
}
const route = useRoute()
const router = useRouter()

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
const emojiChoices = ['😀', '😊', '😂', '😍', '🥰', '😎', '🤔', '😮', '😢', '🙏', '👍', '👏', '🙌', '💯', '🎉', '🎂', '💐', '❤️', '🔥', '🎊', '✅', '📅', '📍', '🍽️']
const showScrollBtn = ref(false)
const lightboxSrc = ref('')
const lightboxName = ref('')
const showUserProfile = ref(false)

const canSend = computed(() => messageText.value.trim() || selectedFiles.value.length > 0)

// Unsent text is kept per conversation (shared with the chat widget, survives reloads).
const chatDrafts = useChatDrafts()
watch(() => chatStore.currentChatId, (id) => {
  if (!editingMessage.value) messageText.value = chatDrafts.getDraft(id)
  nextTick(autoResizeTextarea)
}, { immediate: true })

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

  const chatId = chatStore.currentChatId
  if (editingMessage.value) {
    const ok = await chatStore.editMessage(editingMessage.value.id, body)
    if (!ok) toast.error('Failed to edit message.')
    editingMessage.value = null
    if (!messageText.value) messageText.value = chatDrafts.getDraft(chatId)
  } else {
    const sent = await chatStore.sendMessage(chatId, body, {
      replyToId: replyId,
      files: files.length > 0 ? files : undefined,
    })
    if (sent) {
      if (!chatDrafts.getDraft(chatId) || chatDrafts.getDraft(chatId) === body) chatDrafts.clearDraft(chatId)
    } else {
      // Keep what was typed: back in the box (if still on this chat) and in the saved draft.
      if (chatStore.currentChatId === chatId && !messageText.value.trim()) {
        messageText.value = body
        if (!selectedFiles.value.length) selectedFiles.value = files
      }
      if (body && !chatDrafts.getDraft(chatId)) chatDrafts.setDraft(chatId, body)
      toast.error('Message not sent. Your text is kept, try again.')
    }
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
  if (!editingMessage.value) chatDrafts.setDraft(chatStore.currentChatId, messageText.value)
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
    // Keep the whole menu (about 240×200px) on screen, including on phones.
    x: Math.max(8, Math.min(e.clientX, window.innerWidth - 248)),
    y: Math.max(8, Math.min(e.clientY, window.innerHeight - 210)),
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
  messageText.value = chatDrafts.getDraft(chatStore.currentChatId)
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
  chatStore.setViewActive(true)
  chatStore.connect()
  await chatStore.fetchChats({ silent: chatStore.chats.length > 0 })
  // Coming back to the page with a conversation still open: bring it up to date.
  if (chatStore.currentChatId && !route.query.chat) {
    await chatStore.fetchMessages(chatStore.currentChatId, undefined, { silent: true })
    chatStore.setViewActive(true)
    nextTick(() => scrollToBottom())
  }
  void fetchEligibleContacts()
  await openChatFromQuery()
  // Deep link: /…/messages?with=<userId> opens (or creates) the chat with that user,
  // e.g. "Message customer" on a booking page.
  const withId = Number(route.query.with)
  if (withId) {
    const chat = await chatStore.getOrCreateChat(withId)
    if (chat) await openChat(chat.id)
    else toast.error('Could not open this conversation.')
    router.replace({ query: {} })
  }
})

// Opening a chat from a new-message alert: /…/messages?chat=<chatId>
async function openChatFromQuery() {
  const chatId = Number(route.query.chat)
  if (!chatId) return
  if (!chatStore.chats.some(c => c.id === chatId)) await chatStore.fetchChats({ silent: true })
  if (chatStore.chats.some(c => c.id === chatId)) await openChat(chatId)
  router.replace({ query: {} })
}
watch(() => route.query.chat, (value) => { if (value) void openChatFromQuery() })

onBeforeUnmount(() => {
  chatStore.setViewActive(false)
  if (chatStore.currentChatId) chatStore.stopTyping(chatStore.currentChatId)
  if (searchTimeout) clearTimeout(searchTimeout)
  if (recordingTimerInterval) clearInterval(recordingTimerInterval)
  if (currentAudio) { currentAudio.pause(); currentAudio = null }
  // Keep realtime socket alive globally; App.vue manages disconnect on logout.
})
</script>

<style scoped>
/* ═══════════════════════════════════════════════════════════════════════
   MessagesView — solid, token-based chat UI (light + dark via main.css vars)
   One bordered surface split into a conversation list and a chat pane.
   Own bubbles: brand-strong fill, white text. Others: surface + hairline.
   ═══════════════════════════════════════════════════════════════════════ */

/* ── Shell ─────────────────────────────────────────────────────────── */
.nexus-chat {
  height: 100%;
  max-height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--canvas);
}

.nexus-container {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  margin: 16px;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow: var(--shadow-xs);
}

@media (min-width: 1024px) {
  .nexus-container { margin: 20px 24px 24px; }
}

.italic { font-style: italic; }
.clickable { cursor: pointer; }

/* ── Sidebar ───────────────────────────────────────────────────────── */
.chat-sidebar {
  width: 340px;
  min-width: 340px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  border-right: 1px solid var(--line);
  background: var(--surface);
}

@media (min-width: 1280px) {
  .chat-sidebar { width: 360px; min-width: 360px; }
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 16px 12px;
}

.sidebar-header-left { min-width: 0; }

.sidebar-title {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-display);
  font-size: 1.125rem;
  line-height: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--ink);
}

.title-icon { color: var(--brand-text); }

.sidebar-header-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.header-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: var(--radius-md);
  color: var(--ink-secondary);
  transition: background-color .12s ease, color .12s ease;
}

.header-icon-btn:hover { background: var(--surface-hover); color: var(--ink); }
.header-icon-btn:focus-visible { outline: 2px solid var(--brand-strong); outline-offset: 1px; }

/* Search */
.sidebar-search {
  position: relative;
  padding: 0 16px 12px;
}

.search-dropdown {
  position: absolute;
  top: calc(100% - 4px);
  left: 16px;
  right: 16px;
  z-index: 30;
  max-height: 360px;
  overflow-y: auto;
  padding: 6px;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--surface-raised);
  box-shadow: var(--shadow-lg);
}

.search-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  font-size: 0.8125rem;
  color: var(--ink-muted);
}

.dropdown-section-label,
.chat-list-section-label {
  padding: 10px 10px 6px;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-muted);
}

.chat-list-section-label { padding: 12px 16px 6px; }

.search-result {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  text-align: left;
}

.search-result:hover { background: var(--surface-hover); }

.search-result-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.search-result-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.search-result-role {
  font-size: 0.75rem;
  color: var(--ink-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Filter tabs */
.sidebar-filter-tabs {
  display: flex;
  gap: 4px;
  padding: 0 16px;
  border-bottom: 1px solid var(--line);
  overflow-x: auto;
  scrollbar-width: none;
}

.sidebar-filter-tabs::-webkit-scrollbar { display: none; }

.sidebar-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px 10px;
  margin-bottom: -1px;
  border-bottom: 2px solid transparent;
  color: var(--ink-muted);
  font-size: 0.8125rem;
  font-weight: 500;
  white-space: nowrap;
  transition: color .15s ease, border-color .15s ease;
}

.sidebar-tab:hover { color: var(--ink); }

.sidebar-tab-active {
  color: var(--ink);
  font-weight: 600;
  border-bottom-color: var(--brand-strong);
}

:root.dark .sidebar-tab-active { border-bottom-color: var(--brand-text); }

.sidebar-tab-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.125rem;
  height: 1.125rem;
  padding: 0 0.3rem;
  border-radius: 9999px;
  background: rgb(var(--c-neutral-soft));
  color: rgb(var(--c-neutral-text));
  font-size: 0.6875rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.sidebar-tab-active .sidebar-tab-badge { background: var(--brand-soft); color: var(--brand-text); }

/* Chat list */
.chat-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 4px 8px 12px;
  scrollbar-width: thin;
  scrollbar-color: rgb(var(--c-line-strong) / 0.5) transparent;
}

.chat-list-loading,
.messages-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 32px 16px;
  font-size: 0.8125rem;
  color: var(--ink-muted);
}

.chat-list-empty,
.messages-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px 20px;
  color: var(--ink);
  font-size: 0.9375rem;
  font-weight: 600;
}

.messages-empty { flex: 1; }

.empty-state-orb {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  margin-bottom: 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--line);
  background: var(--surface-sunken);
  color: var(--ink-muted);
}

.empty-hint {
  margin-top: 4px;
  max-width: 18rem;
  font-size: 0.8125rem;
  font-weight: 400;
  line-height: 1.25rem;
  color: var(--ink-muted);
}

.chat-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px;
  border-radius: var(--radius-md);
  text-align: left;
  transition: background-color .12s ease;
}

.chat-item:hover { background: var(--surface-hover); }

.chat-item-active,
.chat-item-active:hover { background: var(--brand-soft); }

.chat-item-active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 10px;
  bottom: 10px;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: var(--brand-strong);
}

:root.dark .chat-item-active::before { background: var(--brand-text); }

.chat-item-info {
  flex: 1;
  min-width: 0;
}

.chat-item-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.chat-item-heading {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
}

.chat-item-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-item-unread .chat-item-name { font-weight: 700; }

.chat-item-role {
  flex-shrink: 0;
  font-size: 0.6875rem;
  font-weight: 500;
  color: var(--ink-muted);
  white-space: nowrap;
}

.chat-item-time {
  flex-shrink: 0;
  font-size: 0.6875rem;
  color: var(--ink-muted);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.chat-item-unread .chat-item-time { color: var(--brand-text); font-weight: 600; }

.chat-item-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 2px;
}

.chat-item-preview {
  min-width: 0;
  font-size: 0.8125rem;
  color: var(--ink-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preview-unread { color: var(--ink-secondary); font-weight: 500; }

.unread-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  min-width: 1.25rem;
  height: 1.25rem;
  padding: 0 0.375rem;
  border-radius: 9999px;
  background: var(--brand-strong);
  color: #fff;
  font-size: 0.6875rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.user-status-text {
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
}

.user-status-text.status-online { color: var(--success-text); }
.user-status-text.status-offline { color: var(--ink-muted); }

/* Avatars */
.avatar-wrap {
  position: relative;
  flex-shrink: 0;
}

.avatar,
.avatar-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 9999px;
}

.avatar {
  object-fit: cover;
  border: 1px solid var(--line);
  background: var(--surface-sunken);
}

.avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--brand-soft);
  color: var(--brand-text);
  font-size: 0.9375rem;
  font-weight: 700;
  text-transform: uppercase;
}

.avatar-placeholder.sm {
  width: 36px;
  height: 36px;
  font-size: 0.8125rem;
}

.online-dot {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 11px;
  height: 11px;
  border-radius: 9999px;
  border: 2px solid var(--surface);
  background: rgb(var(--c-success));
}

.avatar-wrap.clickable:hover .avatar,
.avatar-wrap.clickable:hover .avatar-placeholder { opacity: 0.85; }

/* ── Chat pane ─────────────────────────────────────────────────────── */
.chat-panel {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: var(--surface);
}

.no-chat-selected {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: var(--canvas);
}

.no-chat-card {
  max-width: 26rem;
  text-align: center;
}

.no-chat-orb {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  margin: 0 auto 16px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--brand-text);
  box-shadow: var(--shadow-xs);
}

.no-chat-selected h3 {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--ink);
}

.no-chat-selected p {
  margin-top: 6px;
  font-size: 0.875rem;
  line-height: 1.375rem;
  color: var(--ink-muted);
}

.no-chat-points {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: 20px;
}

.no-chat-point {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 1.75rem;
  padding: 0 0.625rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--ink-secondary);
  font-size: 0.75rem;
  font-weight: 500;
}

/* Header */
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 64px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--line);
  background: var(--surface);
}

.chat-header-main {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.back-btn,
.header-close-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  color: var(--ink-secondary);
  transition: background-color .12s ease, color .12s ease;
}

.back-btn:hover,
.header-close-btn:hover { background: var(--surface-hover); color: var(--ink); }

.back-btn { display: none; margin-left: -6px; }

.chat-header-info { min-width: 0; }

.chat-header-name {
  font-size: 0.9375rem;
  font-weight: 600;
  line-height: 1.25rem;
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-header-name.clickable:hover { text-decoration: underline; text-underline-offset: 3px; }

.chat-header-status {
  margin-top: 1px;
  font-size: 0.75rem;
  line-height: 1rem;
  color: var(--ink-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-online { color: var(--success-text); font-weight: 500; }
.status-offline { color: var(--ink-muted); }

.status-dot-inline {
  display: inline-block;
  width: 7px;
  height: 7px;
  margin-right: 3px;
  border-radius: 9999px;
  vertical-align: 1px;
}

.status-dot-inline.online { background: rgb(var(--c-success)); }
.status-dot-inline.offline { background: var(--ink-muted); }

.typing-text { color: var(--brand-text); font-weight: 500; }

.typing-dots span { animation: typingDot 1.4s infinite; }
.typing-dots span:nth-child(2) { animation-delay: .2s; }
.typing-dots span:nth-child(3) { animation-delay: .4s; }

.chat-header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

/* Messages area */
.messages-area {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 16px 20px 20px;
  background: var(--canvas);
  scrollbar-width: thin;
  scrollbar-color: rgb(var(--c-line-strong) / 0.5) transparent;
}

.messages-area::-webkit-scrollbar,
.chat-list::-webkit-scrollbar { width: 6px; }
.messages-area::-webkit-scrollbar-track,
.chat-list::-webkit-scrollbar-track { background: transparent; }
.messages-area::-webkit-scrollbar-thumb,
.chat-list::-webkit-scrollbar-thumb { background: rgb(var(--c-line-strong) / 0.5); border-radius: 9999px; }

.load-more {
  display: flex;
  justify-content: center;
  padding: 4px 0 12px;
}

.load-more-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  padding: 0 12px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--ink-secondary);
  font-size: 0.8125rem;
  font-weight: 500;
}

.load-more-btn:hover:not(:disabled) { background: var(--surface-hover); color: var(--ink); }
.load-more-btn:disabled { opacity: .6; cursor: default; }

.date-separator {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 14px 0 10px;
}

.date-separator::before,
.date-separator::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--line);
}

.date-separator span {
  padding: 2px 10px;
  border: 1px solid var(--line);
  border-radius: 9999px;
  background: var(--surface);
  color: var(--ink-muted);
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.message-group { display: flex; flex-direction: column; }

.message-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  max-width: min(78%, 40rem);
  margin-top: 4px;
}

.message-own {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message-other { align-self: flex-start; }

.message-avatar,
.message-avatar-placeholder {
  width: 28px !important;
  height: 28px !important;
  flex-shrink: 0;
  border-radius: 9999px;
}

.message-avatar { object-fit: cover; border: 1px solid var(--line); }
.message-avatar-placeholder { font-size: 0.6875rem !important; }
.message-avatar-spacer { width: 28px; flex-shrink: 0; }

.message-bubble-wrap {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.message-own .message-bubble-wrap { align-items: flex-end; }
.message-other .message-bubble-wrap { align-items: flex-start; }

.message-sender {
  margin: 0 0 3px 2px;
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--ink-muted);
}

.message-bubble {
  position: relative;
  max-width: 100%;
  padding: 8px 12px 6px;
  border-radius: 14px;
  font-size: 0.875rem;
  line-height: 1.375rem;
  overflow-wrap: anywhere;
}

.message-own .message-bubble {
  border-bottom-right-radius: 4px;
  background: var(--brand-strong);
  color: #fff;
}

.message-other .message-bubble {
  border-bottom-left-radius: 4px;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--ink);
  box-shadow: var(--shadow-xs);
}

.bubble-deleted,
.message-own .bubble-deleted,
.message-other .bubble-deleted {
  border: 1px dashed rgb(var(--c-line-strong) / 0.6);
  background: transparent;
  color: var(--ink-muted);
  box-shadow: none;
}

.deleted-text {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8125rem;
  font-style: italic;
}

.message-text {
  margin: 0;
  white-space: pre-wrap;
}

.message-meta {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  margin-top: 2px;
  font-size: 0.6875rem;
  line-height: 1rem;
  font-variant-numeric: tabular-nums;
}

.message-own .message-meta { color: rgba(255, 255, 255, 0.82); }
.message-other .message-meta { color: var(--ink-muted); }

.edited-label { font-style: italic; }

.status-ticks { display: inline-flex; }
.tick-sent, .tick-delivered { opacity: 0.85; }
.message-other .tick-read { color: var(--info-text); }
.message-own .tick-read { color: #a7f3d0; opacity: 1; }

/* Message options button (desktop hover, always visible on touch) */
.message-more-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 9999px;
  color: var(--ink-muted);
  opacity: 0;
  transition: opacity .12s ease, background-color .12s ease;
}

.message-own .message-more-btn { right: calc(100% + 4px); }
.message-other .message-more-btn { left: calc(100% + 4px); }
.message-more-btn:hover { background: var(--surface-hover); color: var(--ink); }
.message-row:hover .message-more-btn,
.message-more-btn:focus-visible { opacity: 1; }

@media (hover: none) {
  .message-more-btn { opacity: 0.6; }
}

/* Reply quote inside a message */
.reply-preview {
  display: flex;
  gap: 8px;
  max-width: 100%;
  margin-bottom: 4px;
  padding: 6px 10px;
  border-radius: var(--radius-md);
  border: 1px solid var(--line);
  background: var(--surface-sunken);
  cursor: pointer;
}

.reply-preview:hover { background: var(--surface-hover); }

.reply-bar {
  width: 3px;
  flex-shrink: 0;
  border-radius: 9999px;
  background: var(--brand);
}

.reply-content {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.reply-name {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--brand-text);
}

.reply-text {
  font-size: 0.75rem;
  color: var(--ink-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 260px;
}

.forwarded-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 3px;
  font-size: 0.6875rem;
  font-style: italic;
  color: var(--ink-muted);
}

/* Attachments */
.message-attachments {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 2px 0 6px;
}

.attachment-image {
  max-width: 240px;
  max-height: 240px;
  width: auto;
  border-radius: 10px;
  object-fit: cover;
  cursor: zoom-in;
  background: var(--surface-sunken);
}

.attachment-video {
  max-width: 280px;
  max-height: 220px;
  border-radius: 10px;
  background: #000;
}

.attachment-audio {
  width: 100%;
  max-width: 280px;
}

.attachment-file {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  max-width: 260px;
  padding: 8px 10px;
  border-radius: var(--radius-md);
  font-size: 0.8125rem;
  font-weight: 500;
  text-decoration: none;
}

.attachment-file span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.message-own .attachment-file { background: rgba(255, 255, 255, 0.16); color: #fff; }
.message-own .attachment-file:hover { background: rgba(255, 255, 255, 0.24); }
.message-other .attachment-file { background: var(--surface-sunken); color: var(--ink); border: 1px solid var(--line); }
.message-other .attachment-file:hover { background: var(--surface-hover); }

/* Voice message */
.voice-message-player {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 200px;
  padding: 2px 0 4px;
}

.voice-play-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border-radius: 9999px;
  transition: background-color .12s ease;
}

.message-own .voice-play-btn { background: rgba(255, 255, 255, 0.2); color: #fff; }
.message-own .voice-play-btn:hover { background: rgba(255, 255, 255, 0.3); }
.message-other .voice-play-btn { background: var(--brand-soft); color: var(--brand-text); }
.message-other .voice-play-btn:hover { background: var(--brand-muted); }

.voice-waveform {
  position: relative;
  flex: 1;
  height: 4px;
  overflow: hidden;
  border-radius: 2px;
  background: var(--line);
}

.message-own .voice-waveform { background: rgba(255, 255, 255, 0.3); }

.voice-progress {
  position: absolute;
  inset: 0 auto 0 0;
  height: 100%;
  border-radius: 2px;
  transition: width .2s linear;
}

.message-own .voice-progress { background: #fff; }
.message-other .voice-progress { background: var(--brand-strong); }

.voice-duration {
  flex-shrink: 0;
  font-size: 0.6875rem;
  font-variant-numeric: tabular-nums;
  opacity: 0.85;
}

/* Reactions */
.message-reactions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: -4px;
  padding: 0 6px;
  position: relative;
  z-index: 1;
}

.reaction-pill {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  height: 22px;
  padding: 0 7px;
  border: 1px solid var(--line);
  border-radius: 9999px;
  background: var(--surface);
  color: var(--ink-secondary);
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
  box-shadow: var(--shadow-xs);
}

.reaction-pill:hover { border-color: rgb(var(--c-line-strong) / 0.6); }

.reaction-own {
  border-color: var(--brand-strong);
  background: var(--brand-soft);
  color: var(--brand-text);
}

/* Typing indicator */
.typing-indicator-row {
  align-self: flex-start;
  margin: 6px 0 0 36px;
}

.typing-bubble {
  padding: 10px 14px;
  border: 1px solid var(--line);
  border-radius: 14px;
  border-bottom-left-radius: 4px;
  background: var(--surface);
}

.typing-animation {
  display: flex;
  align-items: center;
  gap: 4px;
}

.typing-animation span {
  width: 6px;
  height: 6px;
  border-radius: 9999px;
  background: var(--ink-muted);
  animation: typingBounce 1.4s infinite;
}

.typing-animation span:nth-child(2) { animation-delay: .2s; }
.typing-animation span:nth-child(3) { animation-delay: .4s; }

/* Scroll to bottom */
.scroll-to-bottom-btn {
  position: sticky;
  bottom: 8px;
  z-index: 10;
  align-self: center;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  margin: 0 auto;
  border: 1px solid var(--line);
  border-radius: 9999px;
  background: var(--surface-raised);
  color: var(--ink);
  box-shadow: var(--shadow-md);
  order: 999;
}

.scroll-to-bottom-btn:hover { background: var(--surface-hover); }

.scroll-unread {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 1.125rem;
  height: 1.125rem;
  padding: 0 0.3rem;
  border-radius: 9999px;
  background: var(--brand-strong);
  color: #fff;
  font-size: 0.625rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fade-up-enter-active,
.fade-up-leave-active { transition: opacity .15s ease; }
.fade-up-enter-from,
.fade-up-leave-to { opacity: 0; }

/* ── Composer ──────────────────────────────────────────────────────── */
.reply-bar-input {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 16px;
  border-top: 1px solid var(--line);
  background: var(--surface-sunken);
}

.reply-bar-content {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-size: 0.8125rem;
  color: var(--ink-secondary);
  border-left: 3px solid var(--brand);
  padding-left: 10px;
}

.edit-bar-input .reply-bar-content { border-left-color: rgb(var(--c-warning)); }

.reply-bar-name {
  flex-shrink: 0;
  font-weight: 600;
  color: var(--ink);
}

.reply-bar-text {
  min-width: 0;
  color: var(--ink-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.reply-bar-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  color: var(--ink-muted);
}

.reply-bar-close:hover { background: var(--surface-hover); color: var(--ink); }

.message-input-area {
  position: relative;
  border-top: 1px solid var(--line);
  background: var(--surface);
}

.file-preview {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 10px 16px 0;
}

.file-preview-item {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 200px;
  padding: 4px 26px 4px 6px;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--surface-sunken);
}

.file-preview-img {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  object-fit: cover;
}

.file-preview-name {
  font-size: 0.75rem;
  color: var(--ink-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-remove {
  position: absolute;
  top: 50%;
  right: 4px;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 9999px;
  background: var(--surface-hover);
  color: var(--ink-secondary);
}

.file-remove:hover { background: rgb(var(--c-danger-soft)); color: rgb(var(--c-danger-text)); }

.file-count-badge {
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--ink-muted);
  font-variant-numeric: tabular-nums;
}

.input-row {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  padding: 10px 12px;
}

.input-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  color: var(--ink-muted);
  transition: background-color .12s ease, color .12s ease;
}

.input-action-btn:hover { background: var(--surface-hover); color: var(--ink); }

.input-wrap {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  min-height: 40px;
  padding: 0 12px;
  border: 1px solid rgb(var(--c-line-strong) / 0.55);
  border-radius: var(--radius-md);
  background: var(--surface);
  transition: border-color .15s ease, box-shadow .15s ease;
}

.input-wrap:focus-within {
  border-color: var(--brand-strong);
  box-shadow: 0 0 0 3px rgb(var(--c-brand) / 0.18);
}

.message-input {
  display: block;
  width: 100%;
  max-height: 120px;
  padding: 9px 0;
  border: 0;
  outline: none;
  resize: none;
  background: transparent;
  color: var(--ink);
  font-size: 0.875rem;
  line-height: 1.25rem;
}

.message-input::placeholder { color: var(--ink-muted); }

.send-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background: var(--brand-strong);
  color: #fff;
  box-shadow: var(--shadow-xs);
  transition: background-color .12s ease;
}

.send-btn:hover:not(:disabled) { background: var(--brand-hover); }
.send-btn:disabled { opacity: .5; cursor: not-allowed; }

/* Emoji picker */
.emoji-anchor { position: relative; flex-shrink: 0; }

.emoji-overlay {
  position: fixed;
  inset: 0;
  z-index: 25;
}

.emoji-picker {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  z-index: 30;
  display: grid;
  grid-template-columns: repeat(6, 36px);
  gap: 2px;
  padding: 8px;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--surface-raised);
  box-shadow: var(--shadow-lg);
}

.emoji-choice {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  font-size: 1.25rem;
  line-height: 1;
}

.emoji-choice:hover { background: var(--surface-hover); }

/* Attachment menu */
.attachment-menu-overlay {
  position: fixed;
  inset: 0;
  z-index: 25;
}

.attachment-menu {
  position: absolute;
  bottom: calc(100% + 8px);
  right: 56px;
  z-index: 30;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 180px;
  padding: 6px;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--surface-raised);
  box-shadow: var(--shadow-lg);
}

.attachment-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: var(--radius-md);
  color: var(--ink);
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
  text-align: left;
}

.attachment-menu-item:hover { background: var(--surface-hover); }

.attachment-menu-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
}

.attachment-menu-icon.photo { background: var(--info-soft); color: var(--info-text); }
.attachment-menu-icon.video { background: var(--danger-soft); color: var(--danger-text); }
.attachment-menu-icon.document { background: var(--warning-soft); color: var(--warning-text); }

.attachment-menu-enter-active,
.attachment-menu-leave-active { transition: opacity .12s ease, transform .12s ease; }
.attachment-menu-enter-from,
.attachment-menu-leave-to { opacity: 0; transform: translateY(4px); }

/* Voice recording */
.voice-btn:hover { color: var(--brand-text); }

.voice-recording-bar { align-items: center; }

.voice-cancel-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  color: var(--danger-text);
}

.voice-cancel-btn:hover { background: var(--danger-soft); }

.voice-recording-indicator {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  height: 40px;
  padding: 0 14px;
  border: 1px solid rgb(var(--c-danger-line));
  border-radius: var(--radius-md);
  background: rgb(var(--c-danger-soft));
}

.recording-dot {
  width: 10px;
  height: 10px;
  border-radius: 9999px;
  background: rgb(var(--c-danger));
  animation: recordingPulse 1s ease-in-out infinite;
}

.recording-time {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgb(var(--c-danger-text));
  font-variant-numeric: tabular-nums;
}

/* ── Context menu ──────────────────────────────────────────────────── */
.context-overlay {
  position: fixed;
  inset: 0;
  z-index: 40;
}

.context-menu {
  position: fixed;
  z-index: 50;
  min-width: 220px;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--surface-raised);
  box-shadow: var(--shadow-xl);
  animation: contextMenuIn .12s ease-out both;
}

.context-reactions {
  display: flex;
  gap: 2px;
  padding: 6px;
  border-bottom: 1px solid var(--line);
}

.quick-reaction {
  width: 34px;
  height: 34px;
  border-radius: var(--radius-sm);
  font-size: 1.2rem;
  line-height: 1;
}

.quick-reaction:hover { background: var(--surface-hover); }

.context-actions { padding: 4px; }

.context-action {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  color: var(--ink);
  font-size: 0.875rem;
  text-align: left;
}

.context-action:hover { background: var(--surface-hover); }
.context-danger { color: var(--danger-text); }
.context-danger:hover { background: var(--danger-soft); }

/* ── Contact panel ─────────────────────────────────────────────────── */
.profile-panel-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  justify-content: flex-end;
  background: var(--scrim);
}

.profile-panel {
  display: flex;
  flex-direction: column;
  width: 340px;
  max-width: 90vw;
  height: 100%;
  border-left: 1px solid var(--line);
  background: var(--surface-raised);
  box-shadow: var(--shadow-xl);
}

.profile-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 64px;
  padding: 0 16px;
  border-bottom: 1px solid var(--line);
}

.profile-panel-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--ink);
}

.profile-panel-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  color: var(--ink-secondary);
}

.profile-panel-close:hover { background: var(--surface-hover); color: var(--ink); }

.profile-panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px 16px;
}

.profile-panel-avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--line);
}

.profile-panel-avatar {
  width: 88px;
  height: 88px;
  overflow: hidden;
  border-radius: 9999px;
  border: 1px solid var(--line);
}

.profile-panel-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-panel-avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: var(--brand-soft);
  color: var(--brand-text);
  font-family: var(--font-display);
  font-size: 2rem;
  font-weight: 700;
  text-transform: uppercase;
}

.profile-panel-name {
  margin-top: 12px;
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--ink);
  overflow-wrap: anywhere;
}

.profile-panel-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  font-size: 0.8125rem;
  color: var(--ink-muted);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 9999px;
}

.status-dot.online { background: rgb(var(--c-success)); }
.status-dot.offline { background: var(--ink-muted); }

.profile-panel-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-top: 12px;
}

.profile-info-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 8px;
  border-radius: var(--radius-md);
}

.profile-info-item:hover { background: var(--surface-hover); }

.profile-info-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border-radius: var(--radius-sm);
  background: var(--surface-sunken);
  color: var(--ink-muted);
}

.profile-info-content {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.profile-info-label {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-muted);
}

.profile-info-value {
  font-size: 0.875rem;
  color: var(--ink);
  overflow-wrap: anywhere;
}

.profile-panel-enter-active,
.profile-panel-leave-active { transition: opacity .2s ease; }
.profile-panel-enter-active .profile-panel,
.profile-panel-leave-active .profile-panel { transition: transform .2s ease; }
.profile-panel-enter-from,
.profile-panel-leave-to { opacity: 0; }
.profile-panel-enter-from .profile-panel,
.profile-panel-leave-to .profile-panel { transform: translateX(100%); }

/* ── Lightbox ──────────────────────────────────────────────────────── */
.lightbox-overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(12, 10, 9, 0.9);
  cursor: zoom-out;
}

.lightbox-close {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}

.lightbox-close:hover { background: rgba(255, 255, 255, 0.24); }

.lightbox-img {
  max-width: 92vw;
  max-height: 84vh;
  object-fit: contain;
  border-radius: var(--radius-md);
  cursor: default;
}

.lightbox-caption {
  margin-top: 12px;
  color: rgba(255, 255, 255, 0.75);
  font-size: 0.8125rem;
}

.lightbox-enter-active { transition: opacity .2s ease; }
.lightbox-leave-active { transition: opacity .15s ease; }
.lightbox-enter-from,
.lightbox-leave-to { opacity: 0; }

/* ── Keyframes ─────────────────────────────────────────────────────── */
@keyframes contextMenuIn {
  from { opacity: 0; transform: scale(.97); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes typingDot {
  0%, 60%, 100% { opacity: .3; }
  30% { opacity: 1; }
}

@keyframes typingBounce {
  0%, 80%, 100% { transform: translateY(0); opacity: .5; }
  40% { transform: translateY(-4px); opacity: 1; }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: .4; }
}

@keyframes recordingPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: .35; }
}

@media (prefers-reduced-motion: reduce) {
  .typing-animation span,
  .typing-dots span,
  .recording-dot,
  .context-menu { animation: none; }
}

/* ── Responsive ────────────────────────────────────────────────────── */
@media (max-width: 1023px) {
  .chat-sidebar { width: 300px; min-width: 300px; }
  .message-row { max-width: 86%; }
}

@media (max-width: 768px) {
  .nexus-container {
    margin: 0;
    border: 0;
    border-radius: 0;
    box-shadow: none;
  }

  .chat-sidebar {
    width: 100%;
    min-width: 100%;
    border-right: 0;
  }

  .mobile-hidden { display: none !important; }

  .back-btn { display: inline-flex; }
  .header-close-btn { display: none; }

  .chat-header { padding: 8px 12px; min-height: 56px; }
  .messages-area { padding: 12px 12px 16px; }
  .message-row { max-width: 88%; }
  .attachment-image { max-width: 200px; max-height: 200px; }
  .attachment-video { max-width: 220px; }

  .input-row { gap: 2px; padding: 8px; }
  .input-action-btn,
  .send-btn { width: 40px; height: 40px; }

  .attachment-menu {
    left: 8px;
    right: 8px;
    flex-direction: row;
    justify-content: space-around;
  }

  .attachment-menu-item { flex-direction: column; gap: 4px; font-size: 0.75rem; }
  .reply-bar-input { padding: 8px 12px; }
}
</style>
