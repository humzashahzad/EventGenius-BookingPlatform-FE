<template>
  <!-- Amenity selection for the booking wizard. v-model = selected amenity ids. -->
  <fieldset v-if="amenities.length">
    <legend class="form-label">Amenities</legend>
    <div class="flex flex-col gap-2">
      <label
        v-for="a in amenities"
        :key="a.id"
        class="choice-card items-center"
        :class="isFree(a) ? 'opacity-80 !cursor-default' : modelValue.includes(a.id) && 'is-checked'"
      >
        <input
          type="checkbox"
          class="form-check shrink-0"
          :checked="isFree(a) || modelValue.includes(a.id)"
          :disabled="isFree(a)"
          @change="toggle(a.id)"
        />
        <span class="flex-1 text-sm text-ink">{{ a.name }}</span>
        <span class="text-sm font-medium num" :class="isFree(a) ? 'text-brand-text' : 'text-ink-secondary'">
          {{ isFree(a) ? 'Included' : `+ PKR ${Number(a.price || 0).toLocaleString()}` }}
        </span>
      </label>
    </div>
  </fieldset>
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
