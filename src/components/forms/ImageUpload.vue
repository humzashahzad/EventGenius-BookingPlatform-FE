<template>
  <FileUpload v-model="model" :accept="accept" :multiple="multiple" :max-size="maxSize" :max-files="maxFiles" grid icon="image" :title="title" v-bind="$attrs" />
</template>

<script setup lang="ts">
/** FileUpload preset for photos: image types only, thumbnail grid. Same props/events as FileUpload. */
import FileUpload from './FileUpload.vue'

defineOptions({ inheritAttrs: false })
withDefaults(defineProps<{ accept?: string; multiple?: boolean; maxSize?: number; maxFiles?: number; title?: string }>(), {
  accept: 'image/jpeg,image/png,image/webp', multiple: true, maxSize: 5, maxFiles: undefined, title: 'Drag photos here or',
})
const model = defineModel<File[]>({ default: () => [] })
</script>
