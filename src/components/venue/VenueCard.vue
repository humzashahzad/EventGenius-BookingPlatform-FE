<template>
  <RouterLink :to="`/venues/${venue.id}`" class="venue-card group">
    <div class="venue-media">
      <img
        v-if="photo && !imgFailed"
        :src="getStorageUrl(photo)"
        :alt="venue.name"
        loading="lazy"
        @error="imgFailed = true"
      />
      <div v-else class="venue-media-empty">
        <AppIcon icon="building" class="w-10 h-10" />
      </div>
      <span v-if="venue.is_featured" class="venue-featured">Featured</span>
    </div>

    <div class="venue-body">
      <div class="venue-top">
        <h3 class="venue-name">{{ venue.name }}</h3>
        <span v-if="Number(venue.total_reviews) > 0" class="venue-rating" :aria-label="`Rated ${rating} out of 5 from ${venue.total_reviews} reviews`">
          <AppIcon icon="star-filled" class="w-3.5 h-3.5 venue-star" />
          {{ rating }}
          <span class="venue-rating-count">({{ venue.total_reviews }})</span>
        </span>
        <span v-else class="badge">New</span>
      </div>

      <div class="venue-meta">
        <span><AppIcon icon="map-pin" class="w-3.5 h-3.5" />{{ venue.city }}</span>
        <span v-if="venue.capacity_max">
          <AppIcon icon="users" class="w-3.5 h-3.5" />
          {{ Number(venue.capacity_min || 1).toLocaleString() }} to {{ Number(venue.capacity_max).toLocaleString() }} guests
        </span>
      </div>

      <div class="venue-price">
        <template v-if="venue.price_per_head">
          <strong>PKR {{ Number(venue.price_per_head).toLocaleString() }}</strong>
          <span>per head</span>
        </template>
        <span v-else>Price on request</span>
      </div>
    </div>
  </RouterLink>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'
import { getStorageUrl } from '@/lib/storageUrl'

const props = defineProps<{ venue: any }>()
const imgFailed = ref(false)
const photo = computed<string | null>(() => props.venue.thumbnail || props.venue.images?.[0]?.path || null)
const rating = computed(() => Number(props.venue.avg_rating || 0).toFixed(1))
</script>

<style scoped>
.venue-card {
  display: flex; flex-direction: column; overflow: hidden; min-width: 0;
  background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card); color: inherit; text-decoration: none;
  transition: box-shadow .2s ease, transform .2s ease;
}
.venue-card:hover { box-shadow: var(--shadow-elevated); transform: translateY(-2px); }
.venue-media { position: relative; aspect-ratio: 3 / 2; background: var(--surface-sunken); overflow: hidden; }
.venue-media img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .4s ease; }
.venue-card:hover .venue-media img { transform: scale(1.03); }
.venue-media-empty { width: 100%; height: 100%; display: grid; place-items: center; color: var(--ink-muted); }
.venue-featured {
  position: absolute; top: 12px; left: 12px; height: 24px; padding: 0 10px; border-radius: var(--radius-full);
  display: inline-flex; align-items: center; background: var(--accent); color: var(--on-accent);
  font-size: 12px; font-weight: 600;
}
.venue-body { padding: 16px 20px 20px; display: flex; flex-direction: column; gap: 8px; flex: 1; }
.venue-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.venue-name {
  margin: 0; font-family: var(--font-display); font-size: 17px; line-height: 24px;
  font-weight: 600; letter-spacing: -0.01em; color: var(--ink);
}
.venue-rating { display: inline-flex; align-items: center; gap: 4px; flex-shrink: 0; font-size: 14px; font-weight: 600; color: var(--ink); }
.venue-star { color: var(--accent); }
.venue-rating-count { font-weight: 400; color: var(--ink-muted); }
.venue-meta { display: flex; flex-wrap: wrap; gap: 4px 16px; font-size: 13px; line-height: 20px; color: var(--ink-muted); }
.venue-meta span { display: inline-flex; align-items: center; gap: 4px; }
.venue-price {
  display: flex; align-items: baseline; gap: 4px; margin-top: auto; padding-top: 12px;
  border-top: 1px solid var(--line); font-size: 13px; color: var(--ink-muted);
}
.venue-price strong { font-size: 17px; line-height: 24px; font-weight: 600; font-variant-numeric: tabular-nums; color: var(--ink); }
</style>
