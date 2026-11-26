<template>
  <div class="cwc">
    <header class="cw-head cwc-head">
      <button type="button" class="btn-icon btn-icon-sm" aria-label="Back to conversations" title="Back" @click="emit('back')">
        <AppIcon icon="arrow-left" class="w-4 h-4" />
      </button>
      <span class="cwc-who">
        <span class="cwc-avatar-wrap">
          <img v-if="avatar" :src="getStorageUrl(avatar)" alt="" class="avatar" />
          <span v-else class="avatar">{{ initial(name) }}</span>
          <span v-if="other?.is_online" class="cwc-online" aria-hidden="true" />
        </span>
        <span class="cwc-who-text">
          <span class="cwc-name">{{ name || 'Conversation' }}</span>
          <span class="cwc-status" aria-live="polite">{{ statusText }}</span>
        </span>
      </span>
      <div class="cw-head-actions">
        <RouterLink
          :to="{ path: messagesHref, query: { chat: chatId, full: '1' } }"
          class="btn-icon btn-icon-sm"
          aria-label="Open in full messages"
          title="Open in full messages"
        >
          <AppIcon icon="external-link" class="w-4 h-4" />
        </RouterLink>
        <button type="button" class="btn-icon btn-icon-sm" aria-label="Close messages" title="Close" @click="emit('close')">
          <AppIcon icon="x" class="w-4 h-4" />
        </button>
      </div>
    </header>

    <!-- Messages -->
    <div
      ref="scrollRef"
      class="cwc-scroll"
      role="log"
      aria-label="Messages"
      aria-live="polite"
      tabindex="0"
      @scroll.passive="onScroll"
    >
      <div v-if="loadingOlder" class="cwc-older" role="status"><span class="spinner-border spinner-border-sm" /> Loading earlier messages</div>

      <template v-if="showSkeleton">
        <div v-for="n in 4" :key="n" class="cwc-skel" :class="n % 2 ? 'justify-start' : 'justify-end'" aria-hidden="true">
          <div class="skeleton h-9" :class="n % 2 ? 'w-48' : 'w-36'" />
        </div>
        <span class="sr-only" role="status">Loading messages</span>
      </template>

      <div v-else-if="!list.length" class="empty-state !py-10">
        <div class="empty-state-icon"><AppIcon icon="send" class="w-5 h-5" /></div>
        <p class="empty-state-title">No messages yet</p>
        <p class="empty-state-desc">Say hello to start the conversation.</p>
        <div class="empty-state-actions">
          <button type="button" class="btn-secondary btn-sm" @click="focusInput">Write a message</button>
        </div>
      </div>

      <template v-for="(msg, idx) in list" :key="msg.id">
        <div v-if="newDay(idx)" class="cwc-day"><span>{{ dayLabel(msg.created_at) }}</span></div>
        <div
          class="cwc-row"
          :class="[mine(msg) ? 'cwc-row-own' : 'cwc-row-other', { 'cwc-row-pending': msg.id < 0 }]"
          :data-message-id="msg.id"
        >
          <div class="cwc-bubble-wrap">
            <p v-if="isGroup && !mine(msg) && firstOfRun(idx)" class="cwc-sender">{{ msg.sender?.name }}</p>
            <div v-if="msg.reply_to && !msg.is_deleted" class="cwc-reply">
              <span class="font-semibold">{{ msg.reply_to.sender_name }}</span>
              <span class="truncate">{{ msg.reply_to.body || 'Attachment' }}</span>
            </div>

            <div class="cwc-bubble" :class="{ 'cwc-bubble-deleted': msg.is_deleted }">
              <template v-if="msg.is_deleted">
                <span class="cwc-deleted"><AppIcon icon="ban" class="w-3.5 h-3.5" /> This message was deleted</span>
              </template>
              <template v-else>
                <div v-if="msg.attachments?.length" class="cwc-atts">
                  <template v-for="att in msg.attachments" :key="att.path">
                    <a v-if="att.mime?.startsWith('image/')" :href="getStorageUrl(att.path)" target="_blank" rel="noopener" class="cwc-att-img">
                      <img :src="getStorageUrl(att.path)" :alt="att.name || 'Photo'" loading="lazy" />
                    </a>
                    <video v-else-if="att.mime?.startsWith('video/')" :src="getStorageUrl(att.path)" controls preload="metadata" class="cwc-att-media" />
                    <audio v-else-if="att.mime?.startsWith('audio/') || msg.type === 'voice'" :src="getStorageUrl(att.path)" controls preload="metadata" class="cwc-att-audio" />
                    <a v-else :href="getStorageUrl(att.path)" target="_blank" rel="noopener" class="cwc-att-file">
                      <AppIcon icon="file" class="w-4 h-4 shrink-0" />
                      <span class="truncate">{{ att.name || 'File' }}</span>
                    </a>
                  </template>
                </div>
                <p v-if="msg.body" class="cwc-text">{{ msg.body }}</p>
              </template>
              <span class="cwc-meta">
                <span v-if="msg.is_edited && !msg.is_deleted">edited</span>
                <time :datetime="msg.created_at">{{ time(msg.created_at) }}</time>
                <template v-if="mine(msg) && !msg.is_deleted">
                  <span v-if="msg.id < 0" class="sr-only">Sending</span>
                  <AppIcon
                    v-else
                    :icon="msg.status === 'read' || msg.status === 'delivered' ? 'checks' : 'check'"
                    class="w-3.5 h-3.5"
                    :class="msg.status === 'read' ? 'cwc-tick-read' : ''"
                    :aria-label="msg.status === 'read' ? 'Read' : msg.status === 'delivered' ? 'Delivered' : 'Sent'"
                  />
                </template>
              </span>
            </div>

            <div v-if="msg.reactions?.length && !msg.is_deleted" class="cwc-reactions">
              <button
                v-for="r in msg.reactions"
                :key="r.emoji"
                type="button"
                class="cwc-reaction"
                :class="{ 'cwc-reaction-own': r.users.some(u => u.id === myId) }"
                :title="r.users.map(u => u.name).join(', ')"
                :aria-label="`${r.emoji} ${r.count}, ${r.users.some(u => u.id === myId) ? 'remove your reaction' : 'react'}`"
                @click="chatStore.toggleReaction(msg.id, r.emoji)"
              >{{ r.emoji }} {{ r.count }}</button>
            </div>
          </div>

          <!-- Message actions -->
          <div v-if="!msg.is_deleted && msg.id > 0" class="cwc-actions">
            <button
              type="button"
              class="btn-icon btn-icon-sm cwc-more"
              :aria-label="'Message options'"
              :aria-expanded="menuFor === msg.id"
              @click.stop="toggleMenu(msg.id)"
            >
              <AppIcon icon="more-vertical" class="w-4 h-4" />
            </button>
            <div
              v-if="menuFor === msg.id"
              class="menu cwc-menu"
              :class="mine(msg) ? 'cwc-menu-own' : 'cwc-menu-other'"
              role="menu"
              @keydown.esc.stop.prevent="closeMenu(true)"
            >
              <div class="cwc-quick" role="group" aria-label="React">
                <button
                  v-for="e in quickReactions"
                  :key="e"
                  type="button"
                  role="menuitem"
                  class="cwc-quick-btn"
                  :aria-label="`React ${e}`"
                  @click="react(msg, e)"
                >{{ e }}</button>
              </div>
              <button type="button" role="menuitem" class="menu-item" @click="startReply(msg)">
                <AppIcon icon="reply" class="w-4 h-4" /> Reply
              </button>
              <button v-if="msg.body" type="button" role="menuitem" class="menu-item" @click="copyText(msg)">
                <AppIcon icon="copy" class="w-4 h-4" /> Copy text
              </button>
              <button v-if="mine(msg) && msg.body" type="button" role="menuitem" class="menu-item" @click="startEdit(msg)">
                <AppIcon icon="edit" class="w-4 h-4" /> Edit
              </button>
              <button v-if="mine(msg)" type="button" role="menuitem" class="menu-item cwc-danger" @click="remove(msg)">
                <AppIcon icon="trash" class="w-4 h-4" /> Delete
              </button>
            </div>
          </div>
        </div>
      </template>

      <div v-if="typingText" class="cwc-typing" aria-live="polite">
        <span class="cwc-dots" aria-hidden="true"><i /><i /><i /></span>{{ typingText }}
      </div>
    </div>

    <button v-if="showJump" type="button" class="cwc-jump" aria-label="Jump to latest message" @click="scrollToBottom(true)">
      <AppIcon icon="chevron-down" class="w-4 h-4" />
      <span v-if="unseen > 0">{{ unseen }} new</span>
    </button>

    <!-- Composer -->
    <form class="cwc-composer" @submit.prevent="send">
      <div v-if="editing || replyTo" class="cwc-context">
        <AppIcon :icon="editing ? 'edit' : 'reply'" class="w-4 h-4 shrink-0 text-brand-text" />
        <span class="cwc-context-text">
          <span class="font-semibold">{{ editing ? 'Editing message' : `Replying to ${replyTo?.sender?.name || ''}` }}</span>
          <span v-if="replyTo && !editing" class="truncate block">{{ replyTo.body || 'Attachment' }}</span>
        </span>
        <button type="button" class="btn-icon btn-icon-sm" :aria-label="editing ? 'Cancel editing' : 'Cancel reply'" @click="cancelContext">
          <AppIcon icon="x" class="w-4 h-4" />
        </button>
      </div>

      <ul v-if="files.length" class="cwc-files" aria-label="Files to send">
        <li v-for="(f, i) in files" :key="i + f.name" class="cwc-file">
          <AppIcon :icon="f.type.startsWith('image/') ? 'photo' : 'file'" class="w-3.5 h-3.5 shrink-0" />
          <span class="truncate">{{ f.name }}</span>
          <button type="button" class="cwc-file-x" :aria-label="`Remove ${f.name}`" @click="files.splice(i, 1)">
            <AppIcon icon="x" class="w-3.5 h-3.5" />
          </button>
        </li>
      </ul>

      <div class="cwc-input-row">
        <button
          v-if="!editing"
          type="button"
          class="btn-icon btn-icon-sm"
          aria-label="Attach files"
          title="Attach files"
          :disabled="files.length >= 5"
          @click="fileInput?.click()"
        >
          <AppIcon icon="paperclip" class="w-4 h-4" />
        </button>
        <input ref="fileInput" type="file" multiple class="sr-only" tabindex="-1" aria-hidden="true" @change="onFiles" />
        <label :for="inputId" class="sr-only">Message</label>
        <textarea
          :id="inputId"
          ref="inputRef"
          v-model="text"
          class="cwc-textarea"
          rows="1"
          :placeholder="editing ? 'Edit your message' : 'Write a message'"
          aria-describedby="cw-composer-hint"
          data-autofocus
          enterkeyhint="send"
          @input="onType"
          @keydown="onKeydown"
        />
        <span id="cw-composer-hint" class="sr-only">Enter sends, Shift and Enter adds a new line.</span>
        <button
          type="submit"
          class="btn-primary btn-icon btn-icon-sm cwc-send"
          :aria-label="editing ? 'Save edit' : 'Send message'"
          :disabled="!canSend || sending"
          :aria-busy="sending || undefined"
        >
          <span v-if="sending" class="spinner-border spinner-border-sm" aria-hidden="true" />
          <AppIcon v-else :icon="editing ? 'check' : 'send'" class="w-4 h-4" />
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { toast } from 'vue-sonner'
import { format, formatDistanceToNow, isSameDay, isToday, isYesterday, isThisYear } from 'date-fns'
import AppIcon from '@/components/ui/AppIcon.vue'
import { getStorageUrl } from '@/lib/storageUrl'
import { useAuthStore } from '@/stores/auth'
import { useChatStore, type ChatMessage } from '@/stores/chat'
import { useChatWidgetStore } from '@/stores/chatWidget'
import { useChatDrafts } from '@/composables/useChatDrafts'

const props = defineProps<{ chatId: number; messagesHref: string }>()
const emit = defineEmits<{ (e: 'back'): void; (e: 'close'): void }>()

const auth = useAuthStore()
const chatStore = useChatStore()
const widget = useChatWidgetStore()
const drafts = useChatDrafts()

const inputId = `cw-input-${props.chatId}`
const scrollRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLTextAreaElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

const myId = computed(() => auth.user?.id)
const chat = computed(() => chatStore.chats.find(c => c.id === props.chatId) || null)
const isGroup = computed(() => chat.value?.type === 'group')
const other = computed(() => (chat.value?.type === 'private' ? chat.value.other_user || null : null))
const name = computed(() => (isGroup.value ? chat.value?.name || 'Group chat' : other.value?.name || ''))
const avatar = computed(() => (isGroup.value ? chat.value?.avatar : other.value?.avatar) || null)

/** Messages of this conversation (the store may still hold another chat for a moment). */
const list = computed<ChatMessage[]>(() => (chatStore.currentChatId === props.chatId ? chatStore.messages : []))
const showSkeleton = computed(() => !list.value.length && (chatStore.currentChatId !== props.chatId || chatStore.messagesLoading))

const typingText = computed(() => {
  if (chatStore.currentChatId !== props.chatId) return ''
  const t = chatStore.currentTypingUsers
  if (!t.length) return ''
  if (t.length > 1) return 'Several people are typing…'
  return isGroup.value ? `${t[0].userName} is typing…` : `${name.value || 'They'} is typing…`
})

const statusText = computed(() => {
  if (typingText.value) return 'Typing…'
  if (isGroup.value) return `${chat.value?.participants?.length || ''} members`.trim()
  const o = other.value
  if (!o) return ''
  if (o.is_online) return 'Online'
  if (o.last_seen_at) {
    try { return `Last seen ${formatDistanceToNow(new Date(o.last_seen_at), { addSuffix: true })}` } catch { /* ignore */ }
  }
  return o.role === 'admin' ? 'Support' : o.role === 'store_owner' ? 'Venue owner' : o.role === 'client' ? 'Customer' : ''
})

function initial(n: string) { return (n || '?').trim().charAt(0).toUpperCase() }
function mine(m: ChatMessage) { return m.sender_id === myId.value }
function time(iso: string) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : format(d, 'HH:mm')
}
function dayLabel(iso: string) {
  const d = new Date(iso)
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, isThisYear(d) ? 'EEEE, d MMMM' : 'd MMMM yyyy')
}
function newDay(idx: number) {
  if (idx === 0) return true
  return !isSameDay(new Date(list.value[idx - 1].created_at), new Date(list.value[idx].created_at))
}
function firstOfRun(idx: number) {
  return idx === 0 || list.value[idx - 1].sender_id !== list.value[idx].sender_id
}

// ── Scrolling ────────────────────────────────────────────────────────
const showJump = ref(false)
const unseen = ref(0)
const loadingOlder = ref(false)
let restored = false

function distanceFromBottom() {
  const el = scrollRef.value
  return el ? el.scrollHeight - el.scrollTop - el.clientHeight : 0
}

function scrollToBottom(smooth = false) {
  nextTick(() => {
    const el = scrollRef.value
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' })
    unseen.value = 0
    showJump.value = false
  })
}

function onScroll() {
  const el = scrollRef.value
  if (!el || !restored) return
  const atBottom = distanceFromBottom() < 48
  widget.setScroll(el.scrollTop, atBottom)
  showJump.value = distanceFromBottom() > 240
  if (atBottom) unseen.value = 0
  if (el.scrollTop < 80) void loadOlder()
}

async function loadOlder() {
  const el = scrollRef.value
  if (!el || loadingOlder.value || !chatStore.hasMoreMessages || chatStore.messagesLoading) return
  if (chatStore.currentChatId !== props.chatId || !list.value.length) return
  loadingOlder.value = true
  const prevHeight = el.scrollHeight
  const prevTop = el.scrollTop
  try {
    await chatStore.loadOlderMessages()
  } finally {
    loadingOlder.value = false
  }
  await nextTick()
  // Keep the message the user was reading in place.
  el.scrollTop = prevTop + (el.scrollHeight - prevHeight)
}

/** First paint of this conversation: back to where the user was (or the newest message). */
function restoreScroll() {
  if (restored || !list.value.length) return
  nextTick(() => {
    const el = scrollRef.value
    if (!el) return
    if (widget.atBottom || !widget.scrollTop) el.scrollTop = el.scrollHeight
    else el.scrollTop = Math.min(widget.scrollTop, el.scrollHeight)
    restored = true
    showJump.value = distanceFromBottom() > 240
  })
}

watch(() => list.value.length, (len, prev) => {
  if (!restored) { restoreScroll(); return }
  if (!len || len <= (prev || 0)) return
  const last = list.value[len - 1]
  const added = len - (prev || 0)
  // Older pages are prepended (handled by loadOlder); only react to messages at the end.
  if (loadingOlder.value) return
  if (mine(last) || distanceFromBottom() < 160) scrollToBottom(true)
  else { unseen.value += added; showJump.value = true }
})

// ── Composer + drafts ────────────────────────────────────────────────
const text = ref(drafts.getDraft(props.chatId))
const files = ref<File[]>([])
const sending = ref(false)
const editing = ref<ChatMessage | null>(null)
const replyTo = ref<ChatMessage | null>(null)
const canSend = computed(() => !!text.value.trim() || files.value.length > 0)

// Another tab (or the messages page) changed the draft while this one is idle.
watch(() => drafts.getDraft(props.chatId), (d) => {
  if (!editing.value && !sending.value && d !== text.value && document.activeElement !== inputRef.value) text.value = d
})

function autoSize() {
  const el = inputRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, 128)}px`
}
watch(text, () => nextTick(autoSize))

function onType() {
  if (!editing.value) drafts.setDraft(props.chatId, text.value)
  chatStore.emitTyping(props.chatId)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
    e.preventDefault()
    void send()
  }
}

function focusInput() {
  inputRef.value?.focus()
}

function onFiles(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files) return
  const room = 5 - files.value.length
  const picked = Array.from(input.files)
  if (picked.length > room) toast.error('You can send up to 5 files at a time.')
  files.value.push(...picked.slice(0, room))
  input.value = ''
  focusInput()
}

function cancelContext() {
  if (editing.value) {
    editing.value = null
    text.value = drafts.getDraft(props.chatId)
  }
  replyTo.value = null
  focusInput()
}

async function send() {
  if (!canSend.value || sending.value) return
  const chatId = props.chatId
  const body = text.value.trim()

  if (editing.value) {
    const msg = editing.value
    if (!body) return
    sending.value = true
    const ok = await chatStore.editMessage(msg.id, body)
    sending.value = false
    if (!ok) { toast.error('Could not save your edit. Please try again.'); return }
    editing.value = null
    text.value = drafts.getDraft(chatId)
    return
  }

  const toSend = [...files.value]
  const reply = replyTo.value
  // Clear the box straight away; the saved draft stays until the server accepts the message.
  text.value = ''
  files.value = []
  replyTo.value = null
  chatStore.stopTyping(chatId)
  sending.value = true
  scrollToBottom(true)
  const sent = await chatStore.sendMessage(chatId, body, {
    replyToId: reply?.id,
    files: toSend.length ? toSend : undefined,
  })
  sending.value = false
  if (sent) {
    if (drafts.getDraft(chatId) === body || !drafts.getDraft(chatId)) drafts.clearDraft(chatId)
    if (!text.value) text.value = ''
  } else {
    // Put everything back so nothing typed is lost.
    if (!text.value.trim()) text.value = body
    if (!files.value.length) files.value = toSend
    if (!replyTo.value) replyTo.value = reply
    drafts.setDraft(chatId, text.value)
    toast.error('Message not sent. Your text is kept, try again.')
  }
  focusInput()
}

// ── Message menu ─────────────────────────────────────────────────────
const quickReactions = ['👍', '❤️', '😂', '😮', '😢', '🙏']
const menuFor = ref<number | null>(null)

function toggleMenu(id: number) {
  menuFor.value = menuFor.value === id ? null : id
  if (menuFor.value) {
    nextTick(() => scrollRef.value?.querySelector<HTMLElement>(`[data-message-id="${id}"] .cwc-menu button`)?.focus())
  }
}
function closeMenu(returnFocus = false) {
  const id = menuFor.value
  menuFor.value = null
  if (returnFocus && id) nextTick(() => scrollRef.value?.querySelector<HTMLElement>(`[data-message-id="${id}"] .cwc-more`)?.focus())
}
function onDocClick(e: MouseEvent) {
  if (menuFor.value && !(e.target as HTMLElement)?.closest?.('.cwc-actions')) closeMenu()
}
function react(msg: ChatMessage, emoji: string) {
  closeMenu()
  void chatStore.toggleReaction(msg.id, emoji)
}
function startReply(msg: ChatMessage) {
  closeMenu()
  editing.value = null
  replyTo.value = msg
  focusInput()
}
function startEdit(msg: ChatMessage) {
  closeMenu()
  replyTo.value = null
  files.value = []
  editing.value = msg
  text.value = msg.body || ''
  nextTick(() => {
    focusInput()
    const el = inputRef.value
    if (el) el.selectionStart = el.selectionEnd = el.value.length
  })
}
async function copyText(msg: ChatMessage) {
  closeMenu()
  try {
    await navigator.clipboard.writeText(msg.body || '')
    toast.success('Copied.')
  } catch {
    toast.error('Could not copy this message.')
  }
}
async function remove(msg: ChatMessage) {
  closeMenu()
  if (!window.confirm('Delete this message for everyone?')) return
  const ok = await chatStore.deleteMessage(msg.id)
  if (!ok) toast.error('Could not delete this message.')
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
  restoreScroll()
  nextTick(autoSize)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  chatStore.stopTyping(props.chatId)
  // Remember the unsent text (unless it is an edit of an old message).
  if (!editing.value) drafts.setDraft(props.chatId, text.value)
})
</script>

<style scoped>
.cwc { position: relative; display: flex; flex-direction: column; flex: 1; min-height: 0; }
.cwc-head { border-bottom: 1px solid var(--line); padding-left: 0.375rem; }
.cwc-who { display: flex; align-items: center; gap: 0.625rem; min-width: 0; flex: 1; }
.cwc-avatar-wrap { position: relative; flex-shrink: 0; }
.cwc-avatar-wrap .avatar { width: 2.25rem; height: 2.25rem; object-fit: cover; }
.cwc-online {
  position: absolute; right: 0; bottom: 0; width: 0.625rem; height: 0.625rem; border-radius: 9999px;
  background: var(--success); box-shadow: 0 0 0 2px var(--surface);
}
.cwc-who-text { display: flex; flex-direction: column; min-width: 0; }
.cwc-name { font-size: 0.875rem; font-weight: 600; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cwc-status { font-size: 0.75rem; color: var(--ink-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-height: 1rem; }

.cwc-scroll {
  flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden; overscroll-behavior: contain;
  padding: 0.75rem 0.75rem 0.5rem; background: var(--canvas);
  display: flex; flex-direction: column; gap: 0.25rem;
}
.cwc-scroll:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: -2px; }
.cwc-older { display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.25rem; font-size: 0.75rem; color: var(--ink-muted); }
.cwc-skel { display: flex; padding: 0.25rem 0; }

.cwc-day { display: flex; justify-content: center; margin: 0.5rem 0 0.25rem; }
.cwc-day span {
  padding: 0.125rem 0.625rem; border-radius: 9999px; border: 1px solid var(--line);
  background: var(--surface); font-size: 0.6875rem; font-weight: 600; color: var(--ink-muted);
}

.cwc-row { position: relative; display: flex; align-items: flex-start; gap: 0.25rem; min-width: 0; }
.cwc-row-own { flex-direction: row-reverse; }
.cwc-row-pending { opacity: 0.7; }
.cwc-bubble-wrap { display: flex; flex-direction: column; max-width: 80%; min-width: 0; }
.cwc-row-own .cwc-bubble-wrap { align-items: flex-end; }
.cwc-sender { margin: 0.25rem 0 0.125rem 0.25rem; font-size: 0.6875rem; font-weight: 600; color: var(--ink-muted); }

.cwc-bubble {
  position: relative; min-width: 0; max-width: 100%;
  padding: 0.4375rem 0.625rem 0.3125rem; border-radius: 0.875rem;
  font-size: 0.875rem; line-height: 1.35rem; overflow-wrap: anywhere;
}
.cwc-row-other .cwc-bubble { background: var(--surface); color: var(--ink); border: 1px solid var(--line); border-bottom-left-radius: 0.25rem; }
.cwc-row-own .cwc-bubble { background: var(--brand-strong); color: var(--on-brand); border-bottom-right-radius: 0.25rem; }
.cwc-bubble-deleted { background: transparent !important; color: var(--ink-muted) !important; border: 1px dashed var(--line) !important; }
.cwc-deleted { display: inline-flex; align-items: center; gap: 0.375rem; font-style: italic; }
.cwc-text { white-space: pre-wrap; margin: 0; }
.cwc-meta { display: flex; align-items: center; justify-content: flex-end; gap: 0.25rem; margin-top: 0.0625rem; font-size: 0.6875rem; line-height: 1rem; opacity: 0.75; font-variant-numeric: tabular-nums; }
.cwc-tick-read { opacity: 1; color: #bfdbfe; }
.cwc-row-other .cwc-tick-read { color: var(--brand-text); }

.cwc-reply {
  display: flex; flex-direction: column; max-width: 100%; margin-bottom: 0.125rem; padding: 0.25rem 0.5rem;
  border-left: 3px solid var(--brand); border-radius: 0.375rem; background: var(--surface-sunken);
  font-size: 0.75rem; color: var(--ink-secondary); min-width: 0;
}

.cwc-atts { display: flex; flex-direction: column; gap: 0.375rem; margin-bottom: 0.25rem; }
.cwc-att-img img { display: block; max-width: 100%; max-height: 220px; border-radius: 0.5rem; object-fit: cover; }
.cwc-att-media { max-width: 100%; max-height: 220px; border-radius: 0.5rem; }
.cwc-att-audio { width: 220px; max-width: 100%; height: 36px; }
.cwc-att-file {
  display: flex; align-items: center; gap: 0.375rem; min-width: 0; padding: 0.375rem 0.5rem; border-radius: 0.5rem;
  background: rgba(0, 0, 0, 0.06); color: inherit; text-decoration: underline; text-underline-offset: 2px;
}
.cwc-row-own .cwc-att-file { background: rgba(255, 255, 255, 0.16); }

.cwc-reactions { display: flex; flex-wrap: wrap; gap: 0.25rem; margin-top: 0.1875rem; }
.cwc-reaction {
  display: inline-flex; align-items: center; gap: 0.125rem; height: 1.5rem; padding: 0 0.4375rem;
  border: 1px solid var(--line); border-radius: 9999px; background: var(--surface); font-size: 0.75rem; color: var(--ink-secondary);
}
.cwc-reaction-own { border-color: var(--brand-strong); background: var(--brand-soft); color: var(--brand-text); }

.cwc-actions { position: relative; flex-shrink: 0; align-self: center; }
.cwc-more { opacity: 0; color: var(--ink-muted); }
.cwc-row:hover .cwc-more, .cwc-more:focus-visible, .cwc-more[aria-expanded='true'] { opacity: 1; }
@media (hover: none) { .cwc-more { opacity: 0.6; } }
.cwc-menu { position: absolute; z-index: 5; top: 100%; width: 13rem; padding: 0.25rem 0; }
.cwc-menu-own { right: 0; }
.cwc-menu-other { left: 0; }
.cwc-row:last-of-type .cwc-menu, .cwc-row:nth-last-of-type(2) .cwc-menu { top: auto; bottom: 100%; }
.cwc-quick { display: flex; justify-content: space-between; padding: 0.25rem 0.375rem; border-bottom: 1px solid var(--line); }
.cwc-quick-btn { width: 1.875rem; height: 1.875rem; border-radius: 9999px; font-size: 1rem; }
.cwc-quick-btn:hover { background: var(--surface-hover); }
.cwc-danger { color: var(--danger-text); }
.cwc-danger:hover { color: var(--danger-text); }

.cwc-typing { display: flex; align-items: center; gap: 0.5rem; padding: 0.25rem 0.25rem 0; font-size: 0.75rem; color: var(--ink-muted); }
.cwc-dots { display: inline-flex; gap: 3px; }
.cwc-dots i { width: 5px; height: 5px; border-radius: 9999px; background: var(--ink-muted); animation: cwc-blink 1.2s infinite ease-in-out; }
.cwc-dots i:nth-child(2) { animation-delay: .15s; }
.cwc-dots i:nth-child(3) { animation-delay: .3s; }
@keyframes cwc-blink { 0%, 80%, 100% { opacity: .3; } 40% { opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .cwc-dots i { animation: none; } }

.cwc-jump {
  position: absolute; right: 0.75rem; bottom: 4.5rem; z-index: 4;
  display: inline-flex; align-items: center; gap: 0.25rem; height: 2rem; padding: 0 0.625rem;
  border: 1px solid var(--line); border-radius: 9999px; background: var(--surface-raised);
  box-shadow: var(--shadow-md); font-size: 0.75rem; font-weight: 600; color: var(--ink-secondary);
}

.cwc-composer { flex-shrink: 0; border-top: 1px solid var(--line); background: var(--surface); padding: 0.5rem; }
.cwc-context {
  display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.375rem; padding: 0.25rem 0.25rem 0.25rem 0.5rem;
  border-radius: var(--radius-md); background: var(--surface-sunken); font-size: 0.75rem; color: var(--ink-secondary);
}
.cwc-context-text { flex: 1; min-width: 0; }
.cwc-files { display: flex; flex-wrap: wrap; gap: 0.25rem; margin: 0 0 0.375rem; padding: 0; list-style: none; }
.cwc-file {
  display: inline-flex; align-items: center; gap: 0.25rem; max-width: 100%; height: 1.75rem; padding: 0 0.25rem 0 0.5rem;
  border: 1px solid var(--line); border-radius: 9999px; background: var(--surface-sunken); font-size: 0.75rem; color: var(--ink-secondary);
}
.cwc-file-x { display: inline-flex; align-items: center; justify-content: center; width: 1.25rem; height: 1.25rem; border-radius: 9999px; }
.cwc-file-x:hover { background: var(--surface-hover); }
.cwc-input-row { display: flex; align-items: flex-end; gap: 0.25rem; }
.cwc-textarea {
  flex: 1; min-width: 0; min-height: 2.25rem; max-height: 8rem; resize: none; overflow-y: auto;
  padding: 0.4375rem 0.75rem; border: 1px solid rgb(var(--c-line-strong) / 0.55); border-radius: 1.125rem;
  background: var(--surface); color: var(--ink); font-size: 0.875rem; line-height: 1.25rem;
}
.cwc-textarea::placeholder { color: var(--ink-muted); }
.cwc-textarea:focus { outline: none; border-color: var(--brand-strong); box-shadow: var(--control-ring); }
.cwc-input-row > .btn-icon { margin-bottom: 0.125rem; }
.cwc-send { border-radius: 9999px; background-color: var(--brand-strong); border-color: var(--brand-strong); color: var(--on-brand); }
.cwc-send:hover:not(:disabled) { background-color: var(--brand-hover); }
.cwc-send:disabled { background-color: var(--surface-sunken); border-color: var(--line); color: var(--ink-muted); opacity: 1; }
</style>
