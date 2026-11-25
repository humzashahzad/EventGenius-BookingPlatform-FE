<template>
  <nav v-if="total > 0" class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-t border-line text-sm" aria-label="Pagination">
    <p class="text-ink-muted num">
      Showing <span class="font-medium text-ink">{{ from }}–{{ to }}</span> of <span class="font-medium text-ink">{{ total.toLocaleString('en-PK') }}</span>
    </p>
    <div class="flex items-center gap-2">
      <SelectInput
        v-if="perPageOptions?.length"
        :model-value="perPage"
        :options="perPageOptions.map(n => ({ value: n, label: `${n} / page` }))"
        size="sm"
        class="!w-auto"
        aria-label="Rows per page"
        @update:model-value="v => $emit('update:perPage', Number(v))"
      />
      <button type="button" class="btn-secondary btn-icon btn-icon-sm" :disabled="page <= 1" aria-label="Previous page" @click="$emit('update:page', page - 1)">
        <AppIcon icon="chevron-left" class="w-4 h-4" />
      </button>
      <span class="num text-ink-secondary whitespace-nowrap">Page {{ page }} of {{ lastPage }}</span>
      <button type="button" class="btn-secondary btn-icon btn-icon-sm" :disabled="page >= lastPage" aria-label="Next page" @click="$emit('update:page', page + 1)">
        <AppIcon icon="chevron-right" class="w-4 h-4" />
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { SelectInput } from '@/components/forms'

const props = defineProps<{ page: number; perPage: number; total: number; perPageOptions?: number[] }>()
defineEmits<{ 'update:page': [n: number]; 'update:perPage': [n: number] }>()

const lastPage = computed(() => Math.max(1, Math.ceil(props.total / props.perPage)))
const from = computed(() => Math.min(props.total, (props.page - 1) * props.perPage + 1))
const to = computed(() => Math.min(props.total, props.page * props.perPage))
</script>
