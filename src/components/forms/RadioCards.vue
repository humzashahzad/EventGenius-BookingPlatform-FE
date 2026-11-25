<template>
  <div role="radiogroup" :aria-labelledby="ctl.labelledBy.value" :aria-describedby="ctl.describedBy.value" :class="['grid gap-2', colClass]">
    <label v-for="o in opts" :key="String(o.value)" class="choice-card" :class="[model === o.value && 'is-checked', (o.disabled || ctl.disabled.value) && 'is-disabled']">
      <input
        type="radio"
        class="form-check mt-0.5 shrink-0"
        :name="groupName"
        :checked="model === o.value"
        :disabled="o.disabled || ctl.disabled.value"
        :aria-invalid="ctl.invalid.value || undefined"
        @change="model = o.value"
      />
      <AppIcon v-if="o.icon" :icon="o.icon" class="w-5 h-5 text-ink-muted shrink-0" />
      <span class="min-w-0 flex-1">
        <span class="block text-sm font-medium text-ink">{{ o.label }}</span>
        <span v-if="o.description" class="block text-xs text-ink-muted mt-0.5">{{ o.description }}</span>
      </span>
      <span v-if="o.meta" class="text-sm font-semibold text-ink num shrink-0">{{ o.meta }}</span>
    </label>
  </div>
</template>

<script setup lang="ts">
/** Radio options shown as selectable cards (visibility, payment method, plan…). */
import { computed, useId } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { useControl } from './useControl'

export interface RadioCardOption { value: unknown; label: string; description?: string; icon?: string; meta?: string; disabled?: boolean }
const props = withDefaults(defineProps<{
  options: RadioCardOption[]
  columns?: 1 | 2 | 3
  name?: string
  id?: string
  invalid?: boolean
  disabled?: boolean
  describedby?: string
}>(), { columns: 2, name: '' })
const model = defineModel<any>()
const ctl = useControl(props)
const uid = useId()
const groupName = computed(() => props.name || `eg-rc-${uid}`)
const opts = computed(() => props.options)
const colClass = computed(() => ({ 1: 'grid-cols-1', 2: 'grid-cols-1 sm:grid-cols-2', 3: 'grid-cols-1 sm:grid-cols-3' })[props.columns])
</script>
