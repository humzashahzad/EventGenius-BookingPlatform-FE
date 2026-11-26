<template>
  <VuexyModal :visible="visible" :title="title" width="28rem" @update:visible="$emit('update:visible', $event)">
    <div class="flex items-start gap-3">
      <span class="icon-chip" :class="tone === 'danger' ? 'tone-danger' : tone === 'warning' ? 'tone-warning' : 'tone-brand'">
        <AppIcon :icon="icon || (tone === 'danger' ? 'alert-triangle' : tone === 'warning' ? 'alert-circle' : 'circle-check')" class="w-5 h-5" />
      </span>
      <div class="text-sm text-ink-secondary min-w-0 pt-0.5"><slot /></div>
    </div>
    <p v-if="error" class="alert-danger mt-4 !text-sm" role="alert">{{ error }}</p>
    <template #footer>
      <div class="flex justify-end gap-2">
        <button type="button" class="btn-secondary" @click="$emit('update:visible', false)">Cancel</button>
        <button type="button" :class="tone === 'danger' ? 'btn-danger' : 'btn-primary'" :disabled="loading" @click="$emit('confirm')">
          <AppIcon v-if="loading" icon="loader" class="w-4 h-4 animate-spin" />
          {{ confirmLabel }}
        </button>
      </div>
    </template>
  </VuexyModal>
</template>

<script setup lang="ts">
import { watch, nextTick } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import VuexyModal from '@/components/ui/VuexyModal.vue'

const props = withDefaults(defineProps<{
  visible: boolean
  title: string
  confirmLabel?: string
  tone?: 'danger' | 'warning' | 'primary'
  icon?: string
  loading?: boolean
  error?: string
}>(), { confirmLabel: 'Confirm', tone: 'primary', loading: false, error: '' })
defineEmits<{ 'update:visible': [v: boolean]; confirm: [] }>()

// Put keyboard focus back on the button that opened the dialog, so people can carry on
// down the list (the row's own buttons stay where they were).
let opener: HTMLElement | null = null
watch(() => props.visible, v => {
  if (v) {
    opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    return
  }
  const el = opener
  opener = null
  nextTick(() => { if (el && el.isConnected && !(el as HTMLButtonElement).disabled) el.focus({ preventScroll: true }) })
})
</script>
