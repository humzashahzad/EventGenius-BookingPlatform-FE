<template>
  <!-- Loading -->
  <div v-if="loading" class="vd-page" aria-busy="true">
    <div class="vd-inner">
      <div class="skeleton h-4 w-64 mb-5"></div>
      <div class="skeleton vd-mosaic-skel"></div>
      <div class="skeleton h-10 w-2/3 mt-8"></div>
      <div class="skeleton h-5 w-1/2 mt-3"></div>
    </div>
  </div>

  <div v-else-if="venue" class="vd-page">
    <div class="vd-inner">
      <!-- Breadcrumb -->
      <nav class="vd-crumbs" aria-label="Breadcrumb">
        <RouterLink to="/venues">Venues</RouterLink>
        <AppIcon icon="chevron-right" class="w-3.5 h-3.5" />
        <RouterLink :to="{ path: '/venues', query: { city: venue.city } }">{{ venue.city }}</RouterLink>
        <AppIcon icon="chevron-right" class="w-3.5 h-3.5" />
        <span aria-current="page">{{ venue.name }}</span>
      </nav>

      <!-- Photo mosaic -->
      <div v-if="allImages.length" class="vd-mosaic" :class="`vd-mosaic-${Math.min(allImages.length, 5)}`">
        <button
          v-for="(img, i) in allImages.slice(0, 5)"
          :key="img.id ?? i"
          type="button"
          class="vd-tile"
          :aria-label="`Open photo ${i + 1} of ${allImages.length}`"
          @click="openLightbox(i)"
        >
          <img :src="getStorageUrl(img.path)" :alt="img.alt_text || venue.name" @error="onImageError" />
        </button>
        <button v-if="allImages.length > 1" type="button" class="vd-all-photos" @click="openLightbox(0)">
          <AppIcon icon="photo" class="w-4 h-4" />
          Show all {{ allImages.length }} photos
        </button>
      </div>
      <div v-else class="vd-no-photo">
        <AppIcon icon="building" class="w-12 h-12" />
        <span>No photos yet</span>
      </div>

      <div class="vd-layout">
        <!-- Details -->
        <div class="vd-main">
          <header class="vd-head">
            <div class="vd-badges">
              <span v-if="venue.is_featured" class="vd-featured">Featured</span>
              <span v-if="Number(venue.total_reviews) > 0" class="vd-rating">
                <AppIcon icon="star-filled" class="w-4 h-4 vd-star" />
                {{ Number(venue.avg_rating).toFixed(1) }}
                <a href="#reviews" class="vd-rating-link">{{ venue.total_reviews }} {{ venue.total_reviews === 1 ? 'review' : 'reviews' }}</a>
              </span>
              <span v-else class="badge">New venue</span>
            </div>
            <h1 class="vd-title">{{ venue.name }}</h1>
            <div class="vd-facts">
              <span><AppIcon icon="map-pin" class="w-4 h-4" />{{ venue.address || venue.city }}</span>
              <span><AppIcon icon="users" class="w-4 h-4" />{{ Number(venue.capacity_min).toLocaleString() }} to {{ Number(venue.capacity_max).toLocaleString() }} guests</span>
              <span v-if="venue.operating_start"><AppIcon icon="calendar-event" class="w-4 h-4" />Open {{ formatTimeRange(venue.operating_start, venue.operating_end) }}</span>
            </div>
          </header>

          <section class="vd-section">
            <h2 class="vd-h2">About this venue</h2>
            <p class="vd-text">{{ venue.description || 'The venue has not added a description yet.' }}</p>
            <dl class="vd-specs">
              <div><dt>Capacity</dt><dd>{{ Number(venue.capacity_max).toLocaleString() }} guests</dd></div>
              <div v-if="venue.area_sqft"><dt>Area</dt><dd>{{ Number(venue.area_sqft).toLocaleString() }} sq ft</dd></div>
              <div><dt>Floors</dt><dd>{{ venue.floors }}</dd></div>
              <div><dt>Events hosted</dt><dd>{{ venue.total_bookings }}</dd></div>
            </dl>
          </section>

          <section v-if="eventTypeNames.length" class="vd-section">
            <h2 class="vd-h2">Good for</h2>
            <div class="vd-chips">
              <RouterLink
                v-for="t in eventTypeNames"
                :key="t.slug"
                :to="{ path: '/venues', query: { event_type: t.slug } }"
                class="vd-chip"
              >{{ t.name }}</RouterLink>
            </div>
          </section>

          <section v-if="venue.amenities?.length" class="vd-section">
            <h2 class="vd-h2">Amenities</h2>
            <div class="vd-amenities">
              <div v-for="a in venue.amenities" :key="a.id" class="vd-amenity">
                <span class="vd-amenity-icon"><AppIcon icon="check" class="w-4 h-4" /></span>
                <span class="vd-amenity-name">{{ a.name }}</span>
                <span class="vd-amenity-price">{{ a.is_paid ? `+ ${Number(a.price).toLocaleString()}` : 'Included' }}</span>
              </div>
            </div>
            <p class="vd-note">Paid amenities are optional. You choose them when you book.</p>
          </section>

          <section id="reviews" class="vd-section">
            <h2 class="vd-h2">Reviews</h2>
            <VenueReviews :venue-id="venue.id">
              <template #empty>
                <div class="empty-state" style="padding: 2rem 1rem">
                  <div class="empty-state-icon"><AppIcon icon="message-star" class="w-5 h-5" /></div>
                  <p class="empty-state-title">No reviews yet</p>
                  <p class="empty-state-desc">Guests can review this venue after their event.</p>
                </div>
              </template>
            </VenueReviews>
          </section>

          <section class="vd-section">
            <h2 class="vd-h2">Location and host</h2>
            <div class="vd-host">
              <div class="vd-host-avatar">{{ initials(venue.store?.name || venue.name) }}</div>
              <div class="vd-host-text">
                <RouterLink
                  v-if="venue.store?.id"
                  :to="{ name: 'store-profile', params: { id: venue.store.id } }"
                  class="vd-host-name"
                >{{ venue.store.name }}</RouterLink>
                <span>{{ formatAddress(venue) }}</span>
              </div>
            </div>
          </section>
        </div>

        <!-- Booking panel -->
        <aside class="vd-panel" aria-label="Book this venue">
          <div class="vd-panel-card">
            <div class="vd-price">
              <strong>PKR {{ Number(venue.price_per_head || 0).toLocaleString() }}</strong>
              <span>per head</span>
            </div>

            <label class="vd-guests" for="vd-guests">
              <span class="form-label">Expected guests</span>
              <input
                id="vd-guests"
                v-model.number="guests"
                type="number"
                class="form-input"
                :min="venue.capacity_min || 1"
                :max="venue.capacity_max"
                :aria-invalid="guestError ? 'true' : undefined"
                aria-describedby="vd-guest-help"
              />
              <span id="vd-guest-help" :class="guestError ? 'vd-error' : 'vd-help'">
                {{ guestError || `${Number(venue.capacity_min).toLocaleString()} to ${Number(venue.capacity_max).toLocaleString()} guests` }}
              </span>
            </label>

            <div v-if="!guestError && venue.price_per_head" class="vd-breakdown">
              <div class="vd-row"><span>PKR {{ Number(venue.price_per_head).toLocaleString() }} × {{ guests.toLocaleString() }} guests</span><b>{{ base.toLocaleString() }}</b></div>
              <div class="vd-row"><span>Tax (5%)</span><b>{{ tax.toLocaleString() }}</b></div>
              <div class="vd-total"><span>Estimated total</span><b>PKR {{ total.toLocaleString() }}</b></div>
            </div>

            <template v-if="authStore.isLoggedIn && authStore.user?.role === 'client'">
              <RouterLink :to="bookLink" class="btn-primary vd-cta">Request to book</RouterLink>
            </template>
            <p v-else-if="authStore.isLoggedIn" class="vd-help vd-center">Only customer accounts can book venues.</p>
            <template v-else>
              <RouterLink :to="{ path: '/customer/sign-in', query: { redirect: bookLink } }" class="btn-primary vd-cta">Sign in to book</RouterLink>
            </template>
            <p class="vd-help vd-center">You won’t pay until the venue confirms your date.</p>
          </div>
        </aside>
      </div>
    </div>

    <!-- Phone booking bar -->
    <div class="vd-mobile-bar">
      <div>
        <strong>PKR {{ Number(venue.price_per_head || 0).toLocaleString() }}</strong>
        <span>per head</span>
      </div>
      <RouterLink
        :to="authStore.isLoggedIn ? bookLink : { path: '/customer/sign-in', query: { redirect: bookLink } }"
        class="btn-primary"
      >Request to book</RouterLink>
    </div>
  </div>

  <!-- Not found -->
  <div v-else class="vd-page">
    <div class="vd-inner">
      <div class="card empty-state">
        <div class="empty-state-icon"><AppIcon icon="building-store" class="w-6 h-6" /></div>
        <p class="empty-state-title">Venue not found</p>
        <p class="empty-state-desc">The venue may have been removed, or the link is wrong.</p>
        <RouterLink to="/venues" class="btn-primary btn-sm mt-4">Browse venues</RouterLink>
      </div>
    </div>
  </div>

  <ImageLightbox ref="lightboxRef" :images="lightboxImages" :initial-index="0" />
</template>

<script setup lang="ts">
import { formatAddress, formatTimeRange } from '@/lib/format'
import { ref, computed, onMounted, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import api from '@/lib/axios'
import { useAuthStore } from '@/stores/auth'
import { getStorageUrl } from '@/lib/storageUrl'
import ImageLightbox from '@/components/gallery/ImageLightbox.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import VenueReviews from '@/components/reviews/VenueReviews.vue'
import type { LightboxImage } from '@/components/gallery/ImageLightbox.vue'

const route = useRoute()
const authStore = useAuthStore()

const venue = ref<any>(null)
const loading = ref(true)
const categories = ref<any[]>([])
const guests = ref(100)
const lightboxRef = ref<InstanceType<typeof ImageLightbox> | null>(null)

const bookLink = computed(() => `/venues/${route.params.id}/book`)

const allImages = computed(() => {
  const imgs = venue.value?.images || []
  const primary = imgs.find((i: any) => i.is_primary)
  return primary ? [primary, ...imgs.filter((i: any) => i !== primary)] : imgs
})

const lightboxImages = computed<LightboxImage[]>(() =>
  allImages.value.map((img: any) => ({
    url: getStorageUrl(img.path),
    thumbnail: getStorageUrl(img.path),
    alt: img.alt_text || venue.value?.name || 'Venue photo',
  })),
)

const eventTypeNames = computed(() =>
  (venue.value?.event_types || []).map((slug: string) => ({
    slug,
    name: categories.value.find(c => c.slug === slug)?.name ?? slug.replace(/_/g, ' ').replace(/^\w/, (m: string) => m.toUpperCase()),
  })),
)

// Same formula as the API's BookingPricing: price per head × guests, plus 5% tax.
const base = computed(() => Math.round(Number(venue.value?.price_per_head || 0) * (guests.value || 0)))
const tax = computed(() => Math.round(base.value * 0.05))
const total = computed(() => base.value + tax.value)

const guestError = computed(() => {
  const v = venue.value
  if (!v) return ''
  if (!guests.value || guests.value < 1) return 'Enter how many guests you expect.'
  if (v.capacity_max && guests.value > v.capacity_max) return `This venue holds up to ${Number(v.capacity_max).toLocaleString()} guests.`
  if (v.capacity_min && guests.value < v.capacity_min) return `This venue takes bookings from ${Number(v.capacity_min).toLocaleString()} guests.`
  return ''
})

function openLightbox(index = 0) {
  lightboxRef.value?.open(index)
}

function onImageError(e: Event) {
  (e.target as HTMLImageElement).style.visibility = 'hidden'
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

async function loadVenue() {
  loading.value = true
  try {
    const { data } = await api.get(`/venues/${route.params.id}`)
    venue.value = data.data
    const min = Number(venue.value.capacity_min || 1)
    const max = Number(venue.value.capacity_max || min)
    guests.value = Math.min(max, Math.max(min, Math.round((min + max) / 2 / 10) * 10))
  } catch {
    venue.value = null
  } finally {
    loading.value = false
  }
}

watch(() => route.params.id, () => { if (route.params.id) loadVenue() })

onMounted(() => {
  loadVenue()
  api.get('/categories').then(r => { categories.value = r.data?.data ?? [] }).catch(() => {})
})
</script>

<style scoped>
.vd-page { background: var(--canvas); padding: 24px 16px 80px; }
.vd-inner { max-width: 80rem; margin: 0 auto; }

.vd-crumbs { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-bottom: 16px; font-size: 13px; color: var(--ink-muted); }
.vd-crumbs a { color: inherit; text-decoration: none; }
.vd-crumbs a:hover { color: var(--ink); text-decoration: underline; }
.vd-crumbs [aria-current] { color: var(--ink-secondary); }

/* Mosaic: one large photo plus up to four smaller ones */
.vd-mosaic {
  position: relative; display: grid; gap: 8px; height: 440px; border-radius: var(--radius-xl); overflow: hidden;
  grid-template-columns: 2fr 1fr 1fr; grid-template-rows: 1fr 1fr;
}
.vd-mosaic-1 { grid-template-columns: 1fr; grid-template-rows: 1fr; }
.vd-mosaic-2 { grid-template-columns: 2fr 1fr; grid-template-rows: 1fr; }
.vd-mosaic-3 { grid-template-columns: 2fr 1fr; }
.vd-tile { padding: 0; border: 0; background: var(--surface-sunken); cursor: zoom-in; overflow: hidden; min-width: 0; }
.vd-tile img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .4s ease, filter .2s ease; }
.vd-tile:hover img { transform: scale(1.03); filter: brightness(.95); }
.vd-tile:first-child { grid-row: span 2; }
.vd-mosaic-1 .vd-tile:first-child, .vd-mosaic-2 .vd-tile:first-child { grid-row: auto; }
.vd-mosaic-4 .vd-tile:nth-child(4) { grid-column: span 2; }
.vd-all-photos {
  position: absolute; right: 16px; bottom: 16px; display: inline-flex; align-items: center; gap: 8px;
  height: 40px; padding: 0 14px; border: 1px solid var(--line); border-radius: var(--radius-md);
  background: var(--surface); color: var(--ink); font-size: 14px; font-weight: 600; cursor: pointer; box-shadow: var(--shadow-elevated);
}
.vd-mosaic-skel { height: 440px; border-radius: var(--radius-xl); }
.vd-no-photo {
  height: 240px; border-radius: var(--radius-xl); background: var(--surface-sunken); color: var(--ink-muted);
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; font-size: 14px;
}

.vd-layout { display: grid; grid-template-columns: minmax(0, 1fr) 380px; gap: 56px; align-items: start; margin-top: 32px; }
.vd-main { min-width: 0; }

.vd-head { padding-bottom: 24px; border-bottom: 1px solid var(--line); }
.vd-badges { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-bottom: 10px; }
.vd-featured {
  display: inline-flex; align-items: center; height: 24px; padding: 0 10px; border-radius: 9999px;
  background: var(--accent); color: var(--on-accent); font-size: 12px; font-weight: 600;
}
.vd-rating { display: inline-flex; align-items: center; gap: 6px; font-weight: 600; color: var(--ink); }
.vd-star { color: var(--accent); }
.vd-rating-link { font-weight: 400; color: var(--ink-muted); text-decoration: underline; text-underline-offset: 3px; }
.vd-title {
  margin: 0; font-family: var(--font-display); font-size: 42px; line-height: 48px; font-weight: 700;
  letter-spacing: -0.03em; color: var(--ink);
}
.vd-facts { display: flex; flex-wrap: wrap; gap: 8px 20px; margin-top: 12px; font-size: 15px; color: var(--ink-secondary); }
.vd-facts span { display: inline-flex; align-items: center; gap: 6px; }
.vd-facts :deep(svg) { color: var(--ink-muted); }

.vd-section { padding: 32px 0; border-bottom: 1px solid var(--line); }
.vd-section:last-child { border-bottom: 0; }
.vd-h2 { margin: 0 0 16px; font-family: var(--font-display); font-size: 22px; line-height: 28px; font-weight: 650; letter-spacing: -0.015em; color: var(--ink); }
.vd-text { margin: 0; max-width: 42rem; font-size: 16px; line-height: 27px; color: var(--ink-secondary); white-space: pre-line; }
.vd-specs { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin: 24px 0 0; }
.vd-specs div { padding: 14px 16px; border: 1px solid var(--line); border-radius: var(--radius-md); background: var(--surface); }
.vd-specs dt { font-size: 12px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: var(--ink-muted); }
.vd-specs dd { margin: 4px 0 0; font-family: var(--font-display); font-size: 19px; font-weight: 650; color: var(--ink); font-variant-numeric: tabular-nums; }

.vd-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.vd-chip {
  display: inline-flex; align-items: center; height: 36px; padding: 0 14px; border-radius: 9999px;
  border: 1px solid var(--line-strong); background: var(--surface); color: var(--ink-secondary);
  font-size: 14px; font-weight: 500; text-decoration: none;
}
.vd-chip:hover { border-color: var(--brand-strong); background: var(--brand-soft); color: var(--brand-text); }

.vd-amenities { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 8px; }
.vd-amenity { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border: 1px solid var(--line); border-radius: var(--radius-md); background: var(--surface); }
.vd-amenity-icon { display: grid; place-items: center; width: 28px; height: 28px; border-radius: var(--radius-sm); background: var(--brand-soft); color: var(--brand-text); flex: none; }
.vd-amenity-name { flex: 1; min-width: 0; font-size: 14px; font-weight: 500; color: var(--ink); }
.vd-amenity-price { font-family: var(--font-mono); font-size: 13px; color: var(--ink-muted); white-space: nowrap; }
.vd-note { margin: 12px 0 0; font-size: 13px; color: var(--ink-muted); }

.vd-host { display: flex; align-items: center; gap: 14px; }
.vd-host-avatar {
  width: 48px; height: 48px; border-radius: 9999px; display: grid; place-items: center; flex: none;
  background: var(--accent-soft); color: var(--accent-text); font-weight: 700;
}
.vd-host-text { display: flex; flex-direction: column; font-size: 14px; color: var(--ink-muted); }
.vd-host-name { font-size: 16px; font-weight: 600; color: var(--ink); text-decoration: none; }
.vd-host-name:hover { text-decoration: underline; }

/* Booking panel */
.vd-panel { position: sticky; top: 88px; }
.vd-panel-card {
  display: flex; flex-direction: column; gap: 18px; padding: 24px;
  background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-lg); box-shadow: var(--shadow-elevated);
}
.vd-price { display: flex; align-items: baseline; gap: 6px; }
.vd-price strong { font-family: var(--font-display); font-size: 28px; line-height: 34px; font-weight: 700; letter-spacing: -0.02em; color: var(--ink); }
.vd-price span { font-size: 14px; color: var(--ink-muted); }
.vd-guests { display: flex; flex-direction: column; }
.vd-guests .form-label { margin-bottom: 6px; }
.vd-help { margin-top: 6px; font-size: 13px; line-height: 20px; color: var(--ink-muted); }
.vd-error { margin-top: 6px; font-size: 13px; line-height: 20px; color: var(--danger-text); }
.vd-center { margin: 0; text-align: center; }
.vd-breakdown { display: flex; flex-direction: column; gap: 8px; font-size: 14px; }
.vd-row { display: flex; justify-content: space-between; gap: 12px; color: var(--ink-secondary); }
.vd-row b, .vd-total b { font-family: var(--font-mono); font-weight: 500; font-variant-numeric: tabular-nums; color: var(--ink); }
.vd-total { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; padding-top: 12px; border-top: 1px dashed var(--line-strong); }
.vd-total span { font-weight: 600; color: var(--ink); }
.vd-total b { font-family: var(--font-display); font-size: 21px; font-weight: 700; }
.vd-cta { width: 100%; min-height: 52px; font-size: 15px; }

.vd-mobile-bar { display: none; }

@media (max-width: 1023px) {
  .vd-layout { grid-template-columns: 1fr; gap: 0; }
  .vd-panel { position: static; margin-top: 8px; }
  .vd-mosaic { height: 360px; }
}
@media (max-width: 639px) {
  .vd-page { padding-bottom: 104px; }
  .vd-mosaic { height: 260px; grid-template-columns: 1fr; grid-template-rows: 1fr; border-radius: var(--radius-lg); }
  .vd-tile:not(:first-child) { display: none; }
  .vd-tile:first-child { grid-row: auto; }
  .vd-title { font-size: 30px; line-height: 36px; }
  .vd-panel { display: none; }
  .vd-mobile-bar {
    position: fixed; left: 0; right: 0; bottom: 0; z-index: 40;
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
    padding: 12px max(16px, env(safe-area-inset-right)) calc(12px + env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left));
    background: var(--surface); border-top: 1px solid var(--line); box-shadow: var(--shadow-float);
  }
  .vd-mobile-bar strong { display: block; font-family: var(--font-display); font-size: 19px; color: var(--ink); }
  .vd-mobile-bar span { font-size: 13px; color: var(--ink-muted); }
}
</style>
