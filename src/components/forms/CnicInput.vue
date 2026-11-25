<template>
  <div v-bind="split.wrapper" :class="ctl.boxClass.value" data-control>
    <span class="control-affix"><AppIcon icon="id-card" :class="ctl.iconClass.value" /></span>
    <input
      ref="inputEl"
      v-bind="split.input"
      :id="ctl.id.value"
      :value="model ?? ''"
      type="text"
      inputmode="numeric"
      class="control-input num tracking-wide"
      placeholder="XXXXX-XXXXXXX-X"
      maxlength="15"
      :disabled="ctl.disabled.value"
      :readonly="readonly"
      :required="ctl.required.value"
      :aria-invalid="ctl.invalid.value || undefined"
      :aria-describedby="ctl.describedBy.value"
      autocomplete="off"
      @input="onInput"
    />
  </div>
</template>

<script setup lang="ts">
/** Pakistani CNIC with the XXXXX-XXXXXXX-X mask. v-model stores the formatted value. Validate with rules.cnic(). */
import { computed, ref, useAttrs } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { splitAttrs, useControl, type ControlSize } from './useControl'
import { formatCnic } from './utils'

defineOptions({ inheritAttrs: false })
const props = defineProps<{ id?: string; size?: ControlSize; invalid?: boolean; disabled?: boolean; readonly?: boolean; required?: boolean; describedby?: string }>()
const model = defineModel<string | null>({ default: '' })
const ctl = useControl(props)
const attrs = useAttrs()
const split = computed(() => splitAttrs(attrs))
const inputEl = ref<HTMLInputElement | null>(null)

function onInput(e: Event) {
  const el = e.target as HTMLInputElement
  const f = formatCnic(el.value)
  el.value = f
  model.value = f
}
defineExpose({ focus: () => inputEl.value?.focus() })
</script>
