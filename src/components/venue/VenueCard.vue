<template>
  <RouterLink
    :to="`/venues/${venue.id}`"
    class="venue-card group"
    :class="layout === 'list' ? 'venue-card--list' : 'venue-card--grid'"
    @click="emit('open')"
    @auxclick="(e: MouseEvent) => e.button === 1 && emit('open')"
  >
    <div class="venue-card-media">
      <img
        v-if="imageUrl && !imgFailed"
        :src="imageUrl"
        :alt="`${venue.name}${venue.city ? `, ${venue.city}` : ''}`"
        :loading="eager ? 'eager' : 'lazy'"
        decoding="async"
        class="w-full h-full object-cover"
        @error="imgFailed = true"
      />
      <div v-else class="w-full h-full flex flex-col items-center justify-center gap-1.5 text-ink-muted bg-surface-sunken">
        <AppIcon icon="image" class="w-7 h-7" />
        <span class="text-xs">No photo yet</span>
      </div>
      <span v-if="venue.is_featured" class="venue-card-featured">
        <AppIcon icon="star-filled" class="fill-current w-3 h-3" />
        Featured
      </span>
    </div>

    <div class="venue-card-body">
      <div class="flex items-start justify-between gap-3 min-w-0">
        <div class="min-w-0">
          <component :is="headingTag" class="venue-card-name">{{ venue.name }}</component>
          <p class="mt-0.5 flex items-center gap-1 text-[0.8125rem] text-ink-muted min-w-0">
            <AppIcon icon="map-pin" class="w-3.5 h-3.5 shrink-0" />
            <span class="truncate">{{ placeText }}</span>
          </p>
        </div>
        <p v-if="rating" class="venue-card-rating" :aria-label="`Rated ${rating} out of 5 from ${venue.total_reviews} reviews`">
          <AppIcon icon="star-filled" class="fill-current w-3.5 h-3.5 text-[#B45309]" />
          <span class="font-semibold text-ink num">{{ rating }}</span>
          <span class="text-ink-muted num">({{ formatNumber(venue.total_reviews) }})</span>
        </p>
        <span v-else class="badge-neutral shrink-0">New</span>
      </div>

      <MatchReasons v-if="showReasons" :reasons="venue.match?.reasons" :max="layout === 'list' ? 3 : 2" class="mt-2.5 !mb-0" />

      <p v-if="layout === 'list' && venue.description" class="mt-2 text-sm text-ink-secondary line-clamp-2">{{ venue.description }}</p>

      <ul v-if="types.length" class="mt-3 flex flex-wrap gap-1.5" aria-label="Event types">
        <li v-for="t in types" :key="t" class="venue-card-tag">{{ eventTypeLabel(t, categories) }}</li>
        <li v-if="extraTypes > 0" class="venue-card-tag">+{{ extraTypes }}</li>
      </ul>

      <div class="flex-1 min-h-[0.875rem]" aria-hidden="true"></div>
      <div class="venue-card-foot">
        <p class="flex items-center gap-1.5 text-[0.8125rem] text-ink-secondary">
          <AppIcon icon="users" class="w-4 h-4 text-ink-muted" />
          <span class="num">{{ capacityRange(venue) }}</span>
          <span class="text-ink-muted">guests</span>
        </p>
        <p class="text-right">
          <template v-if="hasPerHeadPrice(venue)">
            <span class="font-semibold text-ink num">PKR {{ formatNumber(venue.price_per_head) }}</span>
            <span class="text-[0.8125rem] text-ink-muted"> / head</span>
          </template>
          <span v-else class="text-sm font-medium text-ink-secondary">Price on request</span>
        </p>
      </div>
    </div>
  </RouterLink>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'
import MatchReasons from '@/components/search/MatchReasons.vue'
import {
  venueImageUrl, eventTypeLabel, capacityRange, hasPerHeadPrice, ratingText, formatNumber, type CategoryLike,
} from './venueUtils'

const props = withDefaults(defineProps<{
  venue: any
  layout?: 'grid' | 'list'
  categories?: CategoryLike[]
  showReasons?: boolean
  eager?: boolean
  headingTag?: 'h2' | 'h3' | 'h4'
}>(), { layout: 'grid', categories: () => [], showReasons: false, eager: false, headingTag: 'h3' })

const emit = defineEmits<{ (e: 'open'): void }>()

const imgFailed = ref(false)
const imageUrl = computed(() => venueImageUrl(props.venue))
const rating = computed(() => ratingText(props.venue))

const placeText = computed(() => {
  const v = props.venue
  const city = (v.city || '').trim()
  const area = String(v.address || '').split(',')[0].trim()
  if (area && city && area.toLowerCase() !== city.toLowerCase()) return `${area}, ${city}`
  return city || area || v.country || 'Pakistan'
})

const allTypes = computed<string[]>(() => (Array.isArray(props.venue.event_types) ? props.venue.event_types : []))
const maxTypes = computed(() => (props.layout === 'list' ? 4 : 2))
const types = computed(() => allTypes.value.slice(0, maxTypes.value))
const extraTypes = computed(() => allTypes.value.length - types.value.length)
</script>

<style scoped>
.venue-card {
  display: flex;
  min-width: 0;
  height: 100%;
  overflow: hidden;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xs);
  color: inherit;
  text-decoration: none;
  transition: box-shadow .2s ease, border-color .2s ease;
}
.venue-card:hover { box-shadow: var(--shadow-md); border-color: rgb(var(--c-line-strong) / 0.5); }
.venue-card--grid { flex-direction: column; }
.venue-card--list { flex-direction: column; }
@media (min-width: 640px) {
  .venue-card--list { flex-direction: row; }
  .venue-card--list .venue-card-media { width: 16rem; flex-shrink: 0; aspect-ratio: auto; min-height: 12rem; }
}

.venue-card-media {
  position: relative;
  aspect-ratio: 4 / 3;
  background: var(--surface-sunken);
  overflow: hidden;
}
.venue-card-media img { transition: transform .4s ease; }
.venue-card:hover .venue-card-media img { transform: scale(1.03); }

.venue-card-featured {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--ink);
  font-size: 0.75rem;
  font-weight: 600;
  box-shadow: var(--shadow-sm);
}
.venue-card-featured :deep(svg) { color: #B45309; }

.venue-card-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  padding: 1rem 1.125rem 1.125rem;
}
.venue-card-name {
  font-family: var(--font-display);
  font-size: 1.0625rem;
  line-height: 1.4rem;
  font-weight: 650;
  letter-spacing: -0.01em;
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.venue-card:hover .venue-card-name { color: var(--brand-text); }
.venue-card-rating {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8125rem;
}
.venue-card-tag {
  padding: 0.125rem 0.5rem;
  border-radius: var(--radius-sm);
  background: var(--surface-sunken);
  border: 1px solid var(--line);
  color: var(--ink-secondary);
  font-size: 0.75rem;
  line-height: 1.125rem;
  font-weight: 500;
}
.venue-card-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding-top: 0.875rem;
  border-top: 1px solid var(--line);
}
</style>
