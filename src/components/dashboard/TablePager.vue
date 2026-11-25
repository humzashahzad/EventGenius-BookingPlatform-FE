<template>
  <nav v-if="total > 0" class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-t border-line text-sm" aria-label="Pagination">
    <p class="text-ink-muted num">
      Showing <span class="font-medium text-ink">{{ from }}–{{ to }}</span> of <span class="font-medium text-ink">{{ total.toLocaleString('en-PK') }}</span>
    </p>
    <div class="flex items-center gap-2">
      <select v-if="perPageOptions?.length" class="form-select !w-auto !min-h-0 h-8 py-0 text-sm" :value="perPage" aria-label="Rows per page" @change="$emit('update:perPage', Number(($event.target as HTMLSelectElement).value))">
        <option v-for="n in perPageOptions" :key="n" :value="n">{{ n }} / page</option>
      </select>
      <button type="button" class="btn-secondary btn-sm" :disabled="page <= 1" aria-label="Previous page" @click="$emit('update:page', page - 1)">
        <AppIcon icon="chevron-left" class="w-4 h-4" />
      </button>
      <span class="num text-ink-secondary whitespace-nowrap">Page {{ page }} of {{ lastPage }}</span>
      <button type="button" class="btn-secondary btn-sm" :disabled="page >= lastPage" aria-label="Next page" @click="$emit('update:page', page + 1)">
        <AppIcon icon="chevron-right" class="w-4 h-4" />
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'

const props = defineProps<{ page: number; perPage: number; total: number; perPageOptions?: number[] }>()
defineEmits<{ 'update:page': [n: number]; 'update:perPage': [n: number] }>()

const lastPage = computed(() => Math.max(1, Math.ceil(props.total / props.perPage)))
const from = computed(() => Math.min(props.total, (props.page - 1) * props.perPage + 1))
const to = computed(() => Math.min(props.total, props.page * props.perPage))
</script>
