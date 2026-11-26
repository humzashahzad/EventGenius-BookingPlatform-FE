<template>
  <RouterLink
    :to="venue.url || `/venues/${venue.id}`"
    class="group flex w-60 shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-xs transition-shadow hover:border-line-strong hover:shadow-md"
    @click="$emit('open')"
  >
    <div class="relative aspect-[16/10] bg-surface-sunken">
      <img
        v-if="imageUrl && !imgFailed"
        :src="imageUrl"
        :alt="`${venue.name} venue photo`"
        loading="lazy"
        class="h-full w-full object-cover"
        @error="imgFailed = true"
      />
      <div v-else class="flex h-full items-center justify-center text-ink-muted" aria-hidden="true">
        <AppIcon icon="building" class="h-7 w-7" />
      </div>
      <span class="absolute left-2 top-2 rounded-md bg-surface px-1.5 py-0.5 text-xs font-semibold text-ink shadow-xs num">#{{ position }}</span>
    </div>
    <div class="flex min-w-0 flex-1 flex-col p-3">
      <h3 class="truncate text-sm font-semibold text-ink group-hover:text-brand-text" :title="venue.name">{{ venue.name }}</h3>
      <p class="mt-0.5 flex min-w-0 items-center gap-1 text-xs text-ink-muted">
        <AppIcon icon="map-pin" class="h-3.5 w-3.5 shrink-0" />
        <span class="truncate">{{ place }}</span>
      </p>
      <div class="mt-2 flex items-center justify-between gap-2 text-xs">
        <span v-if="rating" class="inline-flex items-center gap-1 font-medium text-ink">
          <AppIcon icon="star-filled" class="h-3.5 w-3.5 text-warning-text" />
          {{ rating }} <span class="font-normal text-ink-muted">({{ venue.total_reviews }})</span>
        </span>
        <span v-else class="text-ink-muted">No reviews yet</span>
        <span v-if="venue.price_per_head" class="font-semibold text-ink num">PKR {{ formatNumber(venue.price_per_head) }}<span class="font-normal text-ink-muted">/head</span></span>
      </div>
      <p v-if="capacity" class="mt-1 flex items-center gap-1 text-xs text-ink-muted">
        <AppIcon icon="users" class="h-3.5 w-3.5 shrink-0" /> {{ capacity }} guests
      </p>
      <p v-if="reason" class="mt-2 inline-flex max-w-full items-center gap-1 self-start rounded-md bg-brand-soft px-1.5 py-0.5 text-xs font-medium text-brand-text" :title="reason">
        <AppIcon icon="check" class="h-3 w-3 shrink-0" />
        <span class="truncate">{{ reason }}</span>
      </p>
    </div>
  </RouterLink>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'
import { getStorageUrl } from '@/lib/storageUrl'
import { capacityRange, formatNumber, ratingText } from '@/components/venue/venueUtils'
import type { AssistantVenue } from './types'

const props = defineProps<{ venue: AssistantVenue; position: number }>()
defineEmits<{ (e: 'open'): void }>()

const imgFailed = ref(false)
const imageUrl = computed(() => (props.venue.thumbnail ? getStorageUrl(props.venue.thumbnail) : ''))
const rating = computed(() => ratingText(props.venue))
const place = computed(() => (props.venue.area ? `${props.venue.area}, ${props.venue.city}` : props.venue.city))
const capacity = computed(() => (props.venue.capacity_max ? capacityRange(props.venue) : ''))
const reason = computed(() => props.venue.match?.reasons?.[0] || '')
</script>
