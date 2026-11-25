<template>
  <button
    type="button"
    class="chat-toast group flex w-[356px] max-w-[calc(100vw-2rem)] items-start gap-3 rounded-xl border border-line bg-surface-raised p-3 text-left shadow-lg transition-colors hover:bg-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
    :aria-label="`New message from ${senderName}. Open conversation`"
    @click="onOpen"
  >
    <img
      v-if="avatarUrl"
      :src="avatarUrl"
      alt=""
      class="h-9 w-9 shrink-0 rounded-full object-cover"
    />
    <span
      v-else
      class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand-text"
      aria-hidden="true"
    >{{ initial }}</span>
    <span class="min-w-0 flex-1">
      <span class="flex items-baseline justify-between gap-2">
        <span class="truncate text-sm font-semibold text-ink">{{ senderName }}</span>
        <span v-if="count > 1" class="shrink-0 text-xs text-ink-muted">{{ count }} new</span>
      </span>
      <span class="mt-0.5 line-clamp-2 block break-words text-sm text-ink-secondary">{{ preview }}</span>
    </span>
    <AppIcon icon="message-circle" class="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { getStorageUrl } from '@/lib/storageUrl'

const props = defineProps<{
  senderName: string
  preview: string
  avatar?: string | null
  count?: number
  onOpen?: () => void
}>()

const initial = computed(() => (props.senderName || '?').trim().charAt(0).toUpperCase())
const avatarUrl = computed(() => (props.avatar ? getStorageUrl(props.avatar) : ''))
const count = computed(() => props.count ?? 1)

function onOpen() {
  props.onOpen?.()
}
</script>
