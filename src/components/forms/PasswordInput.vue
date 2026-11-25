<template>
  <div>
    <div v-bind="split.wrapper" :class="ctl.boxClass.value" data-control>
      <span v-if="prefixIcon" class="control-affix"><AppIcon :icon="prefixIcon" :class="ctl.iconClass.value" /></span>
      <input
        ref="inputEl"
        v-bind="split.input"
        :id="ctl.id.value"
        :value="model ?? ''"
        :type="visible ? 'text' : 'password'"
        class="control-input"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :disabled="ctl.disabled.value"
        :readonly="readonly"
        :required="ctl.required.value"
        :minlength="minlength"
        :aria-invalid="ctl.invalid.value || undefined"
        :aria-describedby="ctl.describedBy.value"
        autocapitalize="off"
        spellcheck="false"
        @input="model = ($event.target as HTMLInputElement).value"
      />
      <button
        type="button"
        class="control-btn"
        :aria-label="visible ? `Hide ${toggleName}` : `Show ${toggleName}`"
        :aria-pressed="visible"
        :aria-controls="ctl.id.value"
        :disabled="ctl.disabled.value"
        @click="visible = !visible"
      ><AppIcon :icon="visible ? 'eye-off' : 'eye'" :class="ctl.iconClass.value" /></button>
    </div>
    <PasswordStrength v-if="strength" :password="model ?? ''" />
  </div>
</template>

<script setup lang="ts">
/** Password field with an inset show/hide toggle and an optional strength meter. */
import { computed, ref, useAttrs } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import PasswordStrength from '@/components/auth/PasswordStrength.vue'
import { splitAttrs, useControl, type ControlSize } from './useControl'

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<{
  placeholder?: string
  autocomplete?: 'current-password' | 'new-password' | 'off'
  id?: string
  size?: ControlSize
  invalid?: boolean
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  minlength?: number
  /** Show the 4-bar strength meter under the field. */
  strength?: boolean
  /** Used in the toggle's label: "Show password". */
  toggleName?: string
  prefixIcon?: string
  describedby?: string
}>(), { placeholder: '', autocomplete: 'current-password', minlength: undefined, toggleName: 'password', prefixIcon: '' })

const model = defineModel<string | null>({ default: '' })
const ctl = useControl(props)
const attrs = useAttrs()
const split = computed(() => splitAttrs(attrs))
const visible = ref(false)
const inputEl = ref<HTMLInputElement | null>(null)
defineExpose({ focus: () => inputEl.value?.focus() })
</script>
