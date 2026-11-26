<template>
  <div class="bg-canvas">
    <div class="content-container flex h-[calc(100dvh-4rem)] min-h-[30rem] max-w-3xl flex-col">
      <!-- Header -->
      <header class="flex items-start justify-between gap-3 border-b border-line py-4">
        <div class="min-w-0">
          <h1 class="font-display text-xl font-semibold text-ink sm:text-2xl">Ask EventGenius</h1>
          <p class="mt-0.5 text-sm text-ink-muted">Plan with us: describe your event and refine the results as you chat.</p>
        </div>
        <button type="button" class="btn-ghost btn-sm shrink-0" :disabled="sending" @click="startOver">
          <AppIcon icon="refresh" class="h-4 w-4" />
          Start over
        </button>
      </header>

      <!-- Conversation -->
      <div
        ref="logEl"
        class="min-h-0 flex-1 overflow-y-auto overflow-x-hidden py-4"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label="Conversation with EventGenius"
        tabindex="0"
      >
        <ol class="space-y-4">
          <li v-for="(m, i) in messages" :key="m.id" class="flex min-w-0 flex-col" :class="m.role === 'user' ? 'items-end' : 'items-start'">
            <!-- User -->
            <template v-if="m.role === 'user'">
              <span class="sr-only">You said:</span>
              <div class="max-w-[85%] whitespace-pre-wrap break-words rounded-xl rounded-br-sm bg-brand-strong px-3.5 py-2.5 text-[0.9375rem] leading-relaxed text-white">{{ m.text }}</div>
              <div v-if="m.failed" class="mt-1.5 flex flex-wrap items-center justify-end gap-2 text-xs text-danger-text" role="alert">
                <AppIcon icon="alert-circle" class="h-4 w-4 shrink-0" />
                <span>{{ m.error || 'Not sent.' }}</span>
                <button type="button" class="btn-outline btn-sm" :disabled="sending" @click="retry(m)">Retry</button>
              </div>
            </template>

            <!-- Assistant -->
            <template v-else>
              <span class="sr-only">EventGenius said:</span>
              <div class="flex max-w-[92%] min-w-0 items-start gap-2.5">
                <span class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-surface" aria-hidden="true">
                  <AppLogo class="h-5 w-5" />
                </span>
                <div class="min-w-0 rounded-xl rounded-tl-sm border border-line bg-surface px-3.5 py-2.5 text-[0.9375rem] leading-relaxed text-ink shadow-xs">
                  <ChatText :text="m.text" />
                  <RouterLink
                    v-if="m.action"
                    :ref="el => i === messages.length - 1 && setActionEl(el)"
                    :to="m.action.url"
                    class="btn-primary btn-sm mt-3"
                  >
                    {{ actionLabel(m.action) }}
                    <AppIcon icon="arrow-right" class="h-4 w-4" />
                  </RouterLink>
                </div>
              </div>
              <ul
                v-if="m.venues && m.venues.length"
                class="mt-3 flex w-full snap-x gap-3 overflow-x-auto pb-2 sm:pl-[2.625rem]"
                :aria-label="`${m.venues.length} ${m.venues.length === 1 ? 'venue' : 'venues'}`"
              >
                <li v-for="(v, j) in m.venues" :key="v.id" class="flex">
                  <ChatVenueCard :venue="v" :position="j + 1" @open="trackClick(v.id, j + 1, m.searchId)" />
                </li>
              </ul>
            </template>
          </li>

          <!-- Typing -->
          <li v-if="sending" class="flex items-start gap-2.5">
            <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-surface" aria-hidden="true">
              <AppLogo class="h-5 w-5" />
            </span>
            <div class="rounded-xl rounded-tl-sm border border-line bg-surface px-4 py-3.5 shadow-xs">
              <span class="sr-only">EventGenius is typing</span>
              <span class="typing" aria-hidden="true"><span></span><span></span><span></span></span>
            </div>
          </li>
        </ol>

        <p v-if="startError" class="mt-4 flex flex-wrap items-center gap-2 text-sm text-danger-text" role="alert">
          <AppIcon icon="alert-circle" class="h-4 w-4 shrink-0" />
          {{ startError }}
          <button type="button" class="btn-outline btn-sm" @click="loadStart">Try again</button>
        </p>
      </div>

      <!-- Quick replies + composer -->
      <div class="border-t border-line bg-canvas pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
        <div v-if="quickReplies.length && !sending" class="mb-2.5 flex flex-wrap gap-2" role="group" aria-label="Suggested replies">
          <button
            v-for="q in quickReplies"
            :key="q"
            type="button"
            class="inline-flex min-h-9 max-w-full items-center rounded-lg border border-line bg-surface px-3 py-1.5 text-left text-sm font-medium text-ink-secondary hover:border-line-strong hover:text-ink"
            @click="send(q)"
          >
            <span class="break-words">{{ q }}</span>
          </button>
        </div>

        <form class="flex items-end gap-2" @submit.prevent="send(draft)">
          <label for="ask-composer" class="sr-only">Message</label>
          <TextareaInput
            id="ask-composer"
            ref="composer"
            v-model="draft"
            class="ask-composer min-w-0 flex-1"
            :rows="1"
            auto-grow
            :max-rows="5"
            :maxlength="MAX_LENGTH"
            placeholder="Describe your event or ask about a venue…"
            aria-describedby="ask-help"
            enterkeyhint="send"
            @keydown="onKeydown"
          />
          <button type="submit" class="btn-primary h-11 w-11 shrink-0 !px-0" :disabled="sending || !draft.trim()" aria-label="Send message">
            <AppIcon icon="send" class="h-4 w-4" />
          </button>
        </form>
        <p id="ask-help" class="mt-1.5 text-xs text-ink-muted">
          Try: wedding hall in Lahore for 300 guests. Enter sends, Shift+Enter adds a line.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import api from '@/lib/axios'
import AppIcon from '@/components/ui/AppIcon.vue'
import AppLogo from '@/components/brand/AppLogo.vue'
import { TextareaInput } from '@/components/forms'
import ChatText from '@/components/assistant/ChatText.vue'
import ChatVenueCard from '@/components/assistant/ChatVenueCard.vue'
import type { AssistantAction, AssistantReply, ChatMessage } from '@/components/assistant/types'

const STORAGE_KEY = 'eg.ask.v1'
const MAX_LENGTH = 500
const MAX_STORED = 60

const route = useRoute()
const router = useRouter()

const messages = ref<ChatMessage[]>([])
const quickReplies = ref<string[]>([])
const conversationId = ref<string | null>(null)
const draft = ref('')
const sending = ref(false)
const startError = ref('')
const logEl = ref<HTMLElement | null>(null)
const composer = ref<{ focus: () => void } | null>(null)
let actionEl: HTMLElement | null = null

let seq = 0
const newId = () => `${Date.now().toString(36)}-${(seq++).toString(36)}`

// ── Persistence (per tab) ─────────────────────────────────────────────────
function save() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      conversationId: conversationId.value,
      messages: messages.value.slice(-MAX_STORED),
      quickReplies: quickReplies.value,
    }))
  } catch { /* storage unavailable: the chat still works for this page view */ }
}

function restore(): boolean {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return false
    const data = JSON.parse(raw)
    if (!Array.isArray(data?.messages) || !data.messages.length) return false
    messages.value = data.messages.filter((m: ChatMessage) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.text === 'string')
    quickReplies.value = Array.isArray(data.quickReplies) ? data.quickReplies.filter((q: unknown) => typeof q === 'string') : []
    conversationId.value = typeof data.conversationId === 'string' ? data.conversationId : null
    return messages.value.length > 0
  } catch {
    return false
  }
}

// ── Talking to the API ────────────────────────────────────────────────────
function pushReply(r: AssistantReply) {
  messages.value.push({
    id: newId(),
    role: 'assistant',
    text: r.reply,
    venues: Array.isArray(r.venues) ? r.venues : [],
    action: r.action || null,
    searchId: r.search_id || null,
  })
  quickReplies.value = Array.isArray(r.quick_replies) ? r.quick_replies : []
  if (r.conversation_id) conversationId.value = r.conversation_id
}

async function loadStart() {
  startError.value = ''
  try {
    const { data } = await api.get('/assistant/start')
    pushReply(data.data)
    save()
  } catch {
    startError.value = "We couldn't load the chat."
  }
}

function errorText(e: any): string {
  const status = e?.response?.status
  const msg = e?.response?.data?.message
  if (status === 429 && typeof msg === 'string') return msg
  if (status === 422) return 'Please keep your message under 500 characters.'
  return "Couldn't send. Check your connection and try again."
}

async function send(text: string) {
  const message = String(text || '').trim().slice(0, MAX_LENGTH)
  if (!message || sending.value) return
  const userMsg: ChatMessage = { id: newId(), role: 'user', text: message }
  messages.value.push(userMsg)
  if (draft.value.trim() === message) draft.value = ''
  quickReplies.value = []
  sending.value = true
  actionEl = null
  scrollToBottom()
  try {
    const { data } = await api.post('/assistant/message', { conversation_id: conversationId.value, message })
    pushReply(data.data)
  } catch (e) {
    userMsg.failed = true
    userMsg.error = errorText(e)
    // Vue tracks the array item, so replace it to update the view.
    messages.value = messages.value.map(m => (m.id === userMsg.id ? { ...userMsg } : m))
  } finally {
    sending.value = false
    save()
    await scrollToBottom()
    focusAfterReply()
  }
}

function retry(m: ChatMessage) {
  messages.value = messages.value.filter(x => x.id !== m.id)
  send(m.text)
}

async function startOver() {
  try { sessionStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
  messages.value = []
  quickReplies.value = []
  conversationId.value = null
  draft.value = ''
  await loadStart()
  composer.value?.focus()
}

function trackClick(venueId: number, position: number, searchId?: string | null) {
  api.post(`/venues/${venueId}/click`, { search_id: searchId || undefined, position }).catch(() => {})
}

// ── UI helpers ────────────────────────────────────────────────────────────
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
    e.preventDefault()
    send(draft.value)
  }
}

function actionLabel(a: AssistantAction): string {
  if (a.type === 'open_search') return 'See all results'
  return a.url.includes('/book') ? 'Continue to booking' : 'Open venue page'
}

function setActionEl(el: unknown) {
  const node = (el as { $el?: HTMLElement } | null)?.$el
  if (node) actionEl = node
}

async function scrollToBottom() {
  await nextTick()
  const el = logEl.value
  if (el) el.scrollTop = el.scrollHeight
}

const finePointer = () => typeof window !== 'undefined' && window.matchMedia?.('(pointer: fine)').matches

function focusAfterReply() {
  nextTick(() => {
    if (actionEl) actionEl.focus()
    else if (finePointer()) composer.value?.focus()
  })
}

onMounted(async () => {
  const restored = restore()
  if (!restored) await loadStart()
  await scrollToBottom()

  // "Ask EventGenius" links from the home page and venues page can pass the current search.
  const q = typeof route.query.q === 'string' ? route.query.q.trim() : ''
  if (q) {
    router.replace({ query: {} })
    send(q)
  } else if (finePointer()) {
    composer.value?.focus()
  }
})
</script>

<style scoped>
/* One line by default; it grows with the text (TextareaInput autoGrow). */
.ask-composer :deep(textarea) {
  min-height: 44px;
  resize: none;
}
.typing {
  display: inline-flex;
  gap: 4px;
  align-items: center;
}
.typing span {
  width: 6px;
  height: 6px;
  border-radius: 9999px;
  background: var(--ink-muted);
  animation: typing 1.2s infinite ease-in-out;
}
.typing span:nth-child(2) { animation-delay: 0.15s; }
.typing span:nth-child(3) { animation-delay: 0.3s; }
@keyframes typing {
  0%, 80%, 100% { opacity: 0.25; }
  40% { opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .typing span { animation: none; opacity: 0.6; }
}
</style>
