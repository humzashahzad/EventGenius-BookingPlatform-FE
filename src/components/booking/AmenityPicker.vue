<template>
  <!-- Amenity selection for the booking wizard. v-model = selected amenity ids. -->
  <div v-if="amenities.length">
    <label class="form-label-warm">Amenities</label>
    <div class="flex flex-col gap-2">
      <label
        v-for="a in amenities"
        :key="a.id"
        class="flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors"
        :class="isFree(a)
          ? 'border-warm-200 dark:border-warm-700 opacity-80 cursor-default'
          : modelValue.includes(a.id) ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20' : 'border-warm-200 dark:border-warm-700 hover:border-primary-300'"
      >
        <input
          type="checkbox"
          class="rounded"
          :checked="isFree(a) || modelValue.includes(a.id)"
          :disabled="isFree(a)"
          @change="toggle(a.id)"
        />
        <span class="flex-1 text-sm text-warm-800 dark:text-warm-100">{{ a.name }}</span>
        <span class="text-sm font-medium" :class="isFree(a) ? 'text-primary-600' : 'text-warm-700 dark:text-warm-300'">
          {{ isFree(a) ? 'Included' : `+ PKR ${Number(a.price || 0).toLocaleString()}` }}
        </span>
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ amenities: any[]; modelValue: number[] }>()
const emit = defineEmits<{ 'update:modelValue': [ids: number[]] }>()

function isFree(a: any) { return !a.is_paid }

function toggle(id: number) {
  const set = new Set(props.modelValue)
  set.has(id) ? set.delete(id) : set.add(id)
  emit('update:modelValue', [...set])
}
</script>
