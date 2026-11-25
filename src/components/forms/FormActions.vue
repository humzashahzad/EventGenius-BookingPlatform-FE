<template>
  <div class="form-actions" :class="[sticky && 'is-sticky', align === 'start' && 'is-start']" role="region" :aria-label="regionLabel">
    <div v-if="sticky || status || $slots.status" class="min-w-0 flex-1 text-sm" aria-live="polite">
      <slot name="status">
        <p v-if="error" class="flex items-center gap-2 text-danger-text font-medium"><AppIcon icon="alert-circle" class="w-4 h-4 shrink-0" /><span class="truncate">{{ error }}</span></p>
        <p v-else-if="success" class="flex items-center gap-2 text-success-text font-medium"><AppIcon icon="circle-check" class="w-4 h-4 shrink-0" /><span class="truncate">{{ success }}</span></p>
        <p v-else-if="dirty" class="flex items-center gap-2 text-ink-secondary"><span class="w-2 h-2 rounded-full bg-warning shrink-0" aria-hidden="true" />Unsaved changes</p>
        <p v-else-if="idleText" class="text-ink-muted hidden sm:block">{{ idleText }}</p>
      </slot>
    </div>
    <slot name="secondary" />
    <component :is="cancelTo ? RouterLink : 'button'" v-if="cancelLabel" :to="cancelTo" :type="cancelTo ? undefined : 'button'" class="btn-secondary" :class="size === 'sm' && 'btn-sm'" @click="!cancelTo && emit('cancel')">{{ cancelLabel }}</component>
    <button :type="formId || submit ? 'submit' : 'button'" :form="formId" class="btn-primary" :class="size === 'sm' && 'btn-sm'" :disabled="saving || disabled" @click="!formId && !submit && emit('save')">
      <AppIcon :icon="saving ? 'loader' : saveIcon" :class="['w-4 h-4', saving && 'animate-spin']" />
      {{ saving ? savingLabel : saveLabel }}
    </button>
  </div>
</template>

<script setup lang="ts">
/**
 * Save / cancel row for forms. `sticky` turns it into a floating save bar
 * (status text on the left: error, success, "Unsaved changes").
 * Use `form-id` to submit a <form> elsewhere on the page, or `submit` when inside the form.
 */
import { computed } from 'vue'
import { RouterLink, type RouteLocationRaw } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'

const props = withDefaults(defineProps<{
  saveLabel?: string
  savingLabel?: string
  saveIcon?: string
  cancelLabel?: string
  cancelTo?: RouteLocationRaw
  saving?: boolean
  disabled?: boolean
  dirty?: boolean
  error?: string
  success?: string
  idleText?: string
  formId?: string
  submit?: boolean
  sticky?: boolean
  align?: 'start' | 'end'
  size?: 'sm' | 'md'
  regionLabel?: string
}>(), { saveLabel: 'Save changes', savingLabel: 'Saving…', saveIcon: 'check', cancelLabel: '', cancelTo: undefined, error: '', success: '', idleText: '', formId: undefined, align: 'end', size: 'md', regionLabel: 'Save changes' })
const emit = defineEmits<{ save: []; cancel: [] }>()
const status = computed(() => !!(props.error || props.success || props.dirty || props.idleText))
</script>

<style scoped>
.form-actions { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: 0.5rem 0.75rem; }
.form-actions.is-start { justify-content: flex-start; }
.form-actions.is-sticky {
  position: sticky; bottom: 0; z-index: var(--z-sticky);
  padding: 0.75rem 1rem; margin-top: 0.5rem;
  background-color: var(--surface); border: 1px solid var(--line);
  border-radius: var(--radius-lg); box-shadow: var(--shadow-lg);
}
</style>
