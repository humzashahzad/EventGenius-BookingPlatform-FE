<template>
  <div class="cwl">
    <header class="cw-head">
      <h2 class="cw-title">Messages</h2>
      <div class="cw-head-actions">
        <RouterLink :to="messagesHref" class="btn-icon btn-icon-sm" aria-label="Open full messages" title="Open full messages">
          <AppIcon icon="external-link" class="w-4 h-4" />
        </RouterLink>
        <button type="button" class="btn-icon btn-icon-sm" aria-label="Close messages" title="Close" @click="emit('close')">
          <AppIcon icon="x" class="w-4 h-4" />
        </button>
      </div>
    </header>

    <div class="cwl-search">
      <TextInput
        v-model="query"
        type="search"
        size="sm"
        prefix-icon="search"
        placeholder="Search conversations or people"
        aria-label="Search conversations or people"
        clearable
        clear-label="Clear search"
        data-autofocus
        @update:model-value="onQuery"
        @keydown.esc="onSearchEsc"
      />
    </div>

    <div class="cwl-body" role="list" aria-label="Conversations">
      <!-- First load with nothing cached -->
      <template v-if="!ready">
        <div v-for="n in 5" :key="n" class="cwl-skel" aria-hidden="true">
          <div class="skeleton h-9 w-9 !rounded-full shrink-0" />
          <div class="flex-1 space-y-2">
            <div class="skeleton h-3 w-28" />
            <div class="skeleton h-3 w-40" />
          </div>
        </div>
        <span class="sr-only" role="status">Loading conversations</span>
      </template>

      <template v-else>
        <button
          v-for="chat in filtered"
          :key="chat.id"
          type="button"
          role="listitem"
          class="cwl-item"
          :class="{ 'cwl-item-unread': chat.unread_count > 0 }"
          :aria-label="itemLabel(chat)"
          @click="emit('open', chat.id)"
        >
          <span class="cwl-avatar-wrap">
            <img v-if="chatAvatar(chat)" :src="getStorageUrl(chatAvatar(chat)!)" alt="" class="avatar" />
            <span v-else class="avatar">{{ initial(chatName(chat)) }}</span>
            <span v-if="chat.type === 'private' && chat.other_user?.is_online" class="cwl-online" aria-hidden="true" />
          </span>
          <span class="cwl-info">
            <span class="cwl-row">
              <span class="cwl-name">{{ chatName(chat) }}</span>
              <span class="cwl-time">{{ shortTime(chat.last_message_at || chat.created_at) }}</span>
            </span>
            <span class="cwl-row">
              <span class="cwl-preview">
                <template v-if="drafts.getDraft(chat.id)">
                  <span class="cwl-draft">Draft:</span> {{ drafts.getDraft(chat.id) }}
                </template>
                <template v-else-if="chat.latest_message?.is_deleted"><em>Message deleted</em></template>
                <template v-else-if="chat.latest_message">{{ preview(chat) }}</template>
                <em v-else>No messages yet</em>
              </span>
              <span v-if="chat.unread_count > 0" class="count-badge" aria-hidden="true">
                {{ chat.unread_count > 99 ? '99+' : chat.unread_count }}
              </span>
            </span>
          </span>
        </button>

        <!-- People found by search (start a new chat) -->
        <template v-if="query.trim() && people.length">
          <p class="cwl-section">People</p>
          <button
            v-for="u in people"
            :key="'u' + u.id"
            type="button"
            role="listitem"
            class="cwl-item"
            :disabled="startingId === u.id"
            @click="startWith(u)"
          >
            <span class="cwl-avatar-wrap">
              <img v-if="u.avatar" :src="getStorageUrl(u.avatar)" alt="" class="avatar" />
              <span v-else class="avatar">{{ initial(u.name) }}</span>
            </span>
            <span class="cwl-info">
              <span class="cwl-row"><span class="cwl-name">{{ u.name }}</span></span>
              <span class="cwl-row">
                <span class="cwl-preview">{{ startingId === u.id ? 'Opening…' : roleLabel(u.role) || 'Start a conversation' }}</span>
              </span>
            </span>
          </button>
        </template>

        <p v-if="query.trim() && searching && !people.length" class="cwl-note" role="status">Searching…</p>

        <div v-if="!filtered.length && !(query.trim() && (people.length || searching))" class="empty-state !py-10">
          <div class="empty-state-icon"><AppIcon icon="message-circle" class="w-5 h-5" /></div>
          <p class="empty-state-title">{{ query.trim() ? 'No matches' : 'No conversations yet' }}</p>
          <p class="empty-state-desc">
            {{ query.trim() ? 'Try another name.' : 'Message a venue or a customer and the conversation will show up here.' }}
          </p>
          <div class="empty-state-actions">
            <button v-if="query.trim()" type="button" class="btn-secondary btn-sm" @click="clearQuery">Clear search</button>
            <RouterLink v-else :to="messagesHref" class="btn-secondary btn-sm">Open full messages</RouterLink>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { toast } from 'vue-sonner'
import { format, isToday, isYesterday, isThisYear } from 'date-fns'
import AppIcon from '@/components/ui/AppIcon.vue'
import { TextInput } from '@/components/forms'
import { getStorageUrl } from '@/lib/storageUrl'
import { useAuthStore } from '@/stores/auth'
import { useChatStore, type Chat, type ChatUser } from '@/stores/chat'
import { useChatWidgetStore } from '@/stores/chatWidget'
import { useChatDrafts } from '@/composables/useChatDrafts'

defineProps<{ messagesHref: string; ready: boolean }>()
const emit = defineEmits<{ (e: 'open', id: number): void; (e: 'close'): void }>()

const auth = useAuthStore()
const chatStore = useChatStore()
const widget = useChatWidgetStore()
const drafts = useChatDrafts()

const query = ref('')
const people = ref<ChatUser[]>([])
const searching = ref(false)
const startingId = ref<number | null>(null)
let searchTimer: ReturnType<typeof setTimeout> | null = null
let searchSeq = 0

function chatName(chat: Chat) {
  if (chat.type === 'group') return chat.name || 'Group chat'
  return chat.other_user?.name || 'Unknown'
}
function chatAvatar(chat: Chat) {
  return chat.type === 'group' ? chat.avatar : chat.other_user?.avatar || null
}
function initial(name: string) {
  return (name || '?').trim().charAt(0).toUpperCase()
}
function roleLabel(role?: string) {
  return role === 'admin' ? 'Support' : role === 'store_owner' ? 'Venue owner' : role === 'client' ? 'Customer' : ''
}

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  const list = chatStore.sortedChats.filter(c => !c.is_archived)
  return q ? list.filter(c => chatName(c).toLowerCase().includes(q)) : list
})

function preview(chat: Chat) {
  const m = chat.latest_message
  if (!m) return ''
  const mine = m.sender_id === auth.user?.id
  const prefix = mine ? 'You: ' : chat.type === 'group' ? `${m.sender_name}: ` : ''
  const labels: Record<string, string> = { image: 'Photo', video: 'Video', voice: 'Voice message', audio: 'Audio', file: 'File', gif: 'GIF' }
  return prefix + ((m.body || '').trim() || labels[m.type] || 'Attachment')
}

function shortTime(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  if (Date.now() - d.getTime() < 60_000) return 'now'
  if (isToday(d)) return format(d, 'HH:mm')
  if (isYesterday(d)) return 'Yesterday'
  if (Date.now() - d.getTime() < 6 * 86_400_000) return format(d, 'EEE')
  return format(d, isThisYear(d) ? 'd MMM' : 'd MMM yyyy')
}

function itemLabel(chat: Chat) {
  const parts = [chatName(chat)]
  if (chat.unread_count) parts.push(`${chat.unread_count} unread`)
  const draft = drafts.getDraft(chat.id)
  if (draft) parts.push(`draft: ${draft}`)
  else if (chat.latest_message && !chat.latest_message.is_deleted) parts.push(preview(chat))
  return parts.join(', ')
}

function onQuery() {
  if (searchTimer) clearTimeout(searchTimer)
  const q = query.value.trim()
  if (q.length < 2) {
    people.value = []
    searching.value = false
    return
  }
  searching.value = true
  const seq = ++searchSeq
  searchTimer = setTimeout(async () => {
    const found = await chatStore.searchUsers(q)
    if (seq !== searchSeq) return
    const inList = new Set(chatStore.chats.map(c => c.other_user?.id).filter(Boolean))
    people.value = found.filter(u => u.id !== auth.user?.id && !inList.has(u.id)).slice(0, 8)
    searching.value = false
  }, 300)
}

function clearQuery() {
  query.value = ''
  onQuery()
}

function onSearchEsc(e: KeyboardEvent) {
  if (!query.value) return
  // First Esc clears the search; the next one closes the panel.
  e.preventDefault()
  clearQuery()
}

async function startWith(u: ChatUser) {
  startingId.value = u.id
  const ok = await widget.openWithUser(u.id)
  startingId.value = null
  if (!ok) toast.error('Could not start this conversation right now.')
}

onBeforeUnmount(() => { if (searchTimer) clearTimeout(searchTimer) })
</script>

<style scoped>
.cwl { display: flex; flex-direction: column; min-height: 0; flex: 1; }
.cwl-search { padding: 0 0.75rem 0.625rem; border-bottom: 1px solid var(--line); }
.cwl-body { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 0.25rem 0; }

.cwl-item {
  display: flex; align-items: center; gap: 0.75rem; width: 100%; min-width: 0; min-height: 4rem;
  padding: 0.625rem 0.875rem; text-align: left; transition: background-color .12s ease;
}
.cwl-item:disabled { opacity: 0.7; }
.cwl-item:hover { background: var(--surface-hover); }
.cwl-item:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: -2px; }
.cwl-avatar-wrap { position: relative; flex-shrink: 0; }
.cwl-avatar-wrap .avatar { width: 2.5rem; height: 2.5rem; object-fit: cover; }
.cwl-online {
  position: absolute; right: 0; bottom: 0; width: 0.625rem; height: 0.625rem; border-radius: 9999px;
  background: var(--success); box-shadow: 0 0 0 2px var(--surface);
}
.cwl-info { display: flex; flex-direction: column; gap: 0.125rem; min-width: 0; flex: 1; }
.cwl-row { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; min-width: 0; height: 1.25rem; }
.cwl-name { flex: 1; font-size: 0.875rem; font-weight: 600; line-height: 1.25rem; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
.cwl-time { flex-shrink: 0; font-size: 0.75rem; line-height: 1.25rem; color: var(--ink-muted); font-variant-numeric: tabular-nums; }
.cwl-preview { flex: 1; font-size: 0.8125rem; line-height: 1.25rem; color: var(--ink-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
.cwl-row .count-badge { flex-shrink: 0; margin-left: auto; }
.cwl-item-unread .cwl-preview { color: var(--ink); font-weight: 500; }
.cwl-item-unread .cwl-time { color: var(--brand-text); font-weight: 600; }
.cwl-draft { color: var(--danger-text); font-weight: 600; }
.cwl-section { padding: 0.75rem 0.875rem 0.25rem; font-size: 0.6875rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-muted); }
.cwl-note { padding: 0.75rem 0.875rem; font-size: 0.8125rem; color: var(--ink-muted); }
.cwl-skel { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 0.875rem; }
</style>

<style>
/* Shared by the widget list and conversation headers. */
.cw-head {
  display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;
  min-height: 3.25rem; padding: 0.5rem 0.5rem 0.5rem 0.875rem; flex-shrink: 0;
}
.cw-title { margin: 0; font-family: var(--font-display); font-size: 1rem; font-weight: 700; color: var(--ink); }
.cw-head-actions { display: flex; align-items: center; gap: 0.125rem; flex-shrink: 0; }
</style>
