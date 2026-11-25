<template>
  <div class="bg-canvas">
    <!-- Loading skeleton -->
    <div v-if="loading" class="content-container py-6 sm:py-8" aria-busy="true" aria-label="Loading venue">
      <div class="skeleton h-3 w-48"></div>
      <div class="skeleton mt-4 h-8 w-2/3 max-w-md"></div>
      <div class="skeleton mt-3 h-4 w-1/2 max-w-sm"></div>
      <div class="mt-6 grid gap-2 sm:grid-cols-4 sm:grid-rows-2 h-[260px] sm:h-[420px]">
        <div class="skeleton sm:col-span-2 sm:row-span-2 !rounded-xl"></div>
        <div class="skeleton hidden sm:block !rounded-xl"></div>
        <div class="skeleton hidden sm:block !rounded-xl"></div>
        <div class="skeleton hidden sm:block !rounded-xl"></div>
        <div class="skeleton hidden sm:block !rounded-xl"></div>
      </div>
      <div class="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div class="space-y-4"><div class="skeleton h-40 !rounded-xl"></div><div class="skeleton h-56 !rounded-xl"></div></div>
        <div class="skeleton h-72 !rounded-xl hidden lg:block"></div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="loadError" class="content-container py-16">
      <div class="card">
        <div class="empty-state">
          <div class="empty-state-icon"><AppIcon icon="alert-triangle" class="w-5 h-5" /></div>
          <p class="empty-state-title">We couldn't load this venue</p>
          <p class="empty-state-desc">Check your connection and try again.</p>
          <div class="empty-state-actions">
            <button type="button" class="btn-primary" @click="loadVenue">Try again</button>
            <RouterLink to="/venues" class="btn-secondary">Browse venues</RouterLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Venue -->
    <article v-else-if="venue" class="content-container pt-5 pb-12 sm:pt-6 lg:pb-16">
      <nav aria-label="Breadcrumb" class="text-[0.8125rem] text-ink-muted min-w-0 truncate">
        <RouterLink to="/" class="hover:text-ink">Home</RouterLink>
        <span class="mx-1.5" aria-hidden="true">/</span>
        <RouterLink to="/venues" class="hover:text-ink">Venues</RouterLink>
        <template v-if="venue.city">
          <span class="mx-1.5" aria-hidden="true">/</span>
          <RouterLink :to="{ path: '/venues', query: { city: venue.city } }" class="hover:text-ink">{{ venue.city }}</RouterLink>
        </template>
        <span class="mx-1.5" aria-hidden="true">/</span>
        <span class="text-ink-secondary">{{ venue.name }}</span>
      </nav>

      <!-- Title block -->
      <header class="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <span v-if="venue.is_featured" class="badge-warning"><AppIcon icon="star-filled" class="fill-current w-3 h-3" />Featured</span>
            <span v-if="venue.total_bookings" class="badge-neutral num">{{ plural(Number(venue.total_bookings), 'booking') }} so far</span>
          </div>
          <h1 class="mt-2 font-display text-[1.75rem] sm:text-[2.125rem] font-bold leading-tight tracking-tight text-ink break-words">{{ venue.name }}</h1>
          <div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[0.9375rem] text-ink-secondary">
            <a v-if="rating" href="#reviews" class="inline-flex items-center gap-1.5 hover:text-ink">
              <AppIcon icon="star-filled" class="fill-current w-4 h-4 text-[#B45309]" />
              <span class="font-semibold text-ink num">{{ rating }}</span>
              <span class="underline underline-offset-2 decoration-line-strong/60 num">{{ plural(Number(venue.total_reviews), 'review') }}</span>
            </a>
            <span v-else class="inline-flex items-center gap-1.5"><AppIcon icon="star" class="w-4 h-4" />New — no reviews yet</span>
            <span class="inline-flex items-center gap-1.5 min-w-0"><AppIcon icon="map-pin" class="w-4 h-4 shrink-0" /><span class="truncate">{{ formatAddress(venue) }}</span></span>
            <RouterLink
              v-if="venue.store?.id"
              :to="{ name: 'store-profile', params: { id: venue.store.id } }"
              class="inline-flex items-center gap-1.5 link"
            >
              <AppIcon icon="building-store" class="w-4 h-4" />{{ venue.store.name }}
            </RouterLink>
          </div>
        </div>
      </header>

      <!-- Gallery mosaic -->
      <section class="mt-5" aria-label="Photos">
        <div v-if="!images.length" class="flex h-[220px] sm:h-[360px] flex-col items-center justify-center gap-2 rounded-xl border border-line bg-surface-sunken text-ink-muted">
          <AppIcon icon="image" class="w-8 h-8" />
          <p class="text-sm">No photos have been added yet</p>
        </div>
        <div v-else class="gallery" :class="`gallery--${Math.min(images.length, 5)}`">
          <button
            v-for="(img, i) in images.slice(0, 5)"
            :key="img.path + i"
            type="button"
            class="gallery-tile"
            :class="{ 'hidden sm:block': i > 0 && images.length > 1 }"
            :aria-label="`Open photo ${i + 1} of ${images.length}`"
            @click="openLightbox(i)"
          >
            <img
              :src="getStorageUrl(img.path)"
              :alt="img.alt_text || `${venue.name} photo ${i + 1}`"
              :loading="i === 0 ? 'eager' : 'lazy'"
              class="h-full w-full object-cover"
              @error="onImageError"
            />
          </button>
          <button type="button" class="gallery-all btn-secondary btn-sm" @click="openLightbox(0)">
            <AppIcon icon="photo" class="w-4 h-4" />
            {{ images.length === 1 ? 'View photo' : `Show all ${images.length} photos` }}
          </button>
        </div>
      </section>

      <!-- Key facts -->
      <dl class="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-4">
        <div v-for="f in keyFacts" :key="f.label" class="flex items-center gap-3 bg-surface px-4 py-3.5 min-w-0">
          <span class="icon-chip icon-chip-sm tone-neutral shrink-0"><AppIcon :icon="f.icon" class="w-4 h-4" /></span>
          <div class="min-w-0">
            <dt class="text-xs text-ink-muted">{{ f.label }}</dt>
            <dd class="truncate text-sm font-semibold text-ink num">{{ f.value }}</dd>
          </div>
        </div>
      </dl>

      <div class="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10">
        <!-- Main column -->
        <div class="min-w-0 space-y-6">
          <nav class="tabs" aria-label="Sections">
            <a v-for="s in sectionLinks" :key="s.id" :href="`#${s.id}`" class="tab">{{ s.label }}</a>
          </nav>

          <section id="about" class="card scroll-mt-24">
            <div class="card-header"><h2 class="card-title">About this venue</h2></div>
            <div class="card-body">
              <p class="whitespace-pre-line text-[0.9375rem] leading-relaxed text-ink-secondary">{{ venue.description || 'The owner has not added a description yet.' }}</p>
            </div>
          </section>

          <section id="specs" class="card scroll-mt-24">
            <div class="card-header"><h2 class="card-title">Venue details</h2></div>
            <div class="card-body">
              <dl class="grid gap-x-10 sm:grid-cols-2">
                <div v-for="r in specRows" :key="r.label" class="dl-row">
                  <dt class="flex items-center gap-2"><AppIcon :icon="r.icon" class="w-4 h-4" />{{ r.label }}</dt>
                  <dd>{{ r.value }}</dd>
                </div>
              </dl>
            </div>
          </section>

          <section v-if="eventTypes.length" id="events" class="card scroll-mt-24">
            <div class="card-header">
              <div><h2 class="card-title">Suitable for</h2><p class="card-subtitle">Occasions this venue hosts</p></div>
            </div>
            <div class="card-body">
              <ul class="flex flex-wrap gap-2">
                <li v-for="t in eventTypes" :key="t">
                  <RouterLink :to="{ path: '/venues', query: { event_type: t } }" class="event-chip">
                    <AppIcon :icon="eventTypeIcon(t)" class="w-4 h-4 text-brand-text" />{{ eventTypeLabel(t, categories) }}
                  </RouterLink>
                </li>
              </ul>
            </div>
          </section>

          <section id="amenities" class="card scroll-mt-24">
            <div class="card-header">
              <div><h2 class="card-title">Amenities</h2><p class="card-subtitle">{{ amenitySubtitle }}</p></div>
            </div>
            <div class="card-body">
              <p v-if="!includedAmenities.length && !paidAmenities.length" class="text-sm text-ink-muted">The owner has not listed amenities yet. Ask them in chat after you send a request.</p>
              <div v-else class="grid gap-6 md:grid-cols-2">
                <div v-if="includedAmenities.length">
                  <h3 class="text-sm font-semibold text-ink">Included</h3>
                  <ul class="mt-2 space-y-2">
                    <li v-for="a in includedAmenities" :key="a.id" class="flex items-center gap-2.5 text-sm text-ink-secondary">
                      <AppIcon icon="circle-check" class="w-4 h-4 shrink-0 text-brand-text" />{{ a.name }}
                    </li>
                  </ul>
                </div>
                <div v-if="paidAmenities.length">
                  <h3 class="text-sm font-semibold text-ink">Paid add-ons</h3>
                  <ul class="mt-2 divide-y divide-line rounded-lg border border-line">
                    <li v-for="a in paidAmenities" :key="a.id" class="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                      <span class="flex items-center gap-2.5 text-ink-secondary min-w-0"><AppIcon icon="plus" class="w-4 h-4 shrink-0 text-ink-muted" /><span class="truncate">{{ a.name }}</span></span>
                      <span class="shrink-0 font-medium text-ink num">{{ formatPKR(a.price) }}</span>
                    </li>
                  </ul>
                  <p class="mt-2 text-xs text-ink-muted">Choose add-ons when you book. Prices are per event.</p>
                </div>
              </div>
            </div>
          </section>

          <!-- Reviews -->
          <section id="reviews" class="scroll-mt-24 space-y-4" aria-labelledby="reviews-title">
            <div class="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="reviews-title" class="heading-2">Reviews</h2>
                <p class="text-sm text-ink-muted">Only customers who held an event here can leave a review.</p>
              </div>
              <div v-if="rating" class="flex items-center gap-2">
                <span class="font-display text-3xl font-bold text-ink num">{{ rating }}</span>
                <div>
                  <StarRating :model-value="Math.round(Number(venue.avg_rating))" readonly size="sm" />
                  <p class="text-xs text-ink-muted num">{{ plural(Number(venue.total_reviews), 'review') }}</p>
                </div>
              </div>
            </div>

            <ReviewSummary :data="venue.review_summary" :min-reviews="3" />

            <div class="card">
              <div class="card-body !py-2">
                <VenueReviews :venue-id="venue.id">
                  <template #empty>
                    <div class="empty-state !py-8">
                      <div class="empty-state-icon"><AppIcon icon="message-off" class="w-5 h-5" /></div>
                      <p class="empty-state-title">No reviews yet</p>
                      <p class="empty-state-desc">Book this venue and be the first to share how your event went.</p>
                      <div class="empty-state-actions"><a href="#book" class="btn-secondary btn-sm">Check availability</a></div>
                    </div>
                  </template>
                </VenueReviews>
              </div>
            </div>
          </section>

          <!-- Location & host -->
          <section id="location" class="card scroll-mt-24">
            <div class="card-header"><h2 class="card-title">Location and host</h2></div>
            <div class="card-body grid gap-6 md:grid-cols-2">
              <div class="min-w-0">
                <h3 class="text-sm font-semibold text-ink">Address</h3>
                <p class="mt-1.5 text-sm leading-relaxed text-ink-secondary">{{ venue.address || '—' }}</p>
                <p class="text-sm text-ink-secondary">{{ [venue.city, venue.state, venue.country].filter(Boolean).join(', ') }}</p>
                <a v-if="mapsUrl" :href="mapsUrl" target="_blank" rel="noopener" class="btn-secondary btn-sm mt-3">
                  <AppIcon icon="map" class="w-4 h-4" />Open in Google Maps
                  <AppIcon icon="external-link" class="w-3.5 h-3.5" />
                </a>
              </div>
              <div v-if="venue.store" class="min-w-0 rounded-lg border border-line bg-surface-sunken p-4">
                <div class="flex items-center gap-3">
                  <span class="avatar h-10 w-10 shrink-0 bg-brand-soft text-brand-text font-semibold">{{ initials(venue.store.name) }}</span>
                  <div class="min-w-0">
                    <p class="text-xs text-ink-muted">Hosted by</p>
                    <p class="truncate font-semibold text-ink">{{ venue.store.name }}</p>
                  </div>
                </div>
                <ul class="mt-3 space-y-1.5 text-sm text-ink-secondary">
                  <li v-if="venue.store.city" class="flex items-center gap-2"><AppIcon icon="map-pin" class="w-4 h-4 text-ink-muted" />{{ venue.store.city }}</li>
                  <li v-if="venue.store.phone" class="flex items-center gap-2 min-w-0"><AppIcon icon="phone" class="w-4 h-4 text-ink-muted shrink-0" /><a :href="`tel:${venue.store.phone}`" class="link truncate">{{ venue.store.phone }}</a></li>
                  <li v-if="venue.store.email" class="flex items-center gap-2 min-w-0"><AppIcon icon="mail" class="w-4 h-4 text-ink-muted shrink-0" /><a :href="`mailto:${venue.store.email}`" class="link truncate">{{ venue.store.email }}</a></li>
                </ul>
                <RouterLink v-if="venue.store.id" :to="{ name: 'store-profile', params: { id: venue.store.id } }" class="btn-ghost btn-sm mt-3 -ml-2">
                  View host profile <AppIcon icon="arrow-right" class="w-4 h-4" />
                </RouterLink>
              </div>
            </div>
          </section>
        </div>

        <!-- Booking panel -->
        <aside id="book" ref="bookPanel" class="scroll-mt-24 lg:self-start lg:sticky lg:top-20" aria-label="Book this venue">
          <div class="card">
            <div class="card-body space-y-5">
              <div class="flex items-baseline justify-between gap-3">
                <p v-if="perHead > 0">
                  <span class="font-display text-[1.625rem] font-bold text-ink num">PKR {{ formatNumber(perHead) }}</span>
                  <span class="text-sm text-ink-muted"> / head</span>
                </p>
                <p v-else class="text-lg font-semibold text-ink">Price on request</p>
                <span v-if="rating" class="inline-flex items-center gap-1 text-sm text-ink-secondary"><AppIcon icon="star-filled" class="fill-current w-3.5 h-3.5 text-[#B45309]" /><span class="num">{{ rating }}</span></span>
              </div>

              <div>
                <label for="est-guests" class="form-label">Number of guests</label>
                <div class="flex items-stretch gap-2">
                  <button type="button" class="btn-secondary !px-0 w-11 shrink-0" aria-label="Fewer guests" :disabled="guests <= guestMin" @click="stepGuests(-1)">
                    <AppIcon icon="minus" class="w-4 h-4" />
                  </button>
                  <input
                    id="est-guests"
                    v-model.number="guests"
                    type="number"
                    inputmode="numeric"
                    class="form-input text-center num"
                    :min="guestMin"
                    :max="guestMax || undefined"
                    :aria-invalid="!!guestError"
                    aria-describedby="est-guests-hint"
                  />
                  <button type="button" class="btn-secondary !px-0 w-11 shrink-0" aria-label="More guests" :disabled="!!guestMax && guests >= guestMax" @click="stepGuests(1)">
                    <AppIcon icon="plus" class="w-4 h-4" />
                  </button>
                </div>
                <p v-if="guestError" id="est-guests-hint" class="form-error">{{ guestError }}</p>
                <p v-else id="est-guests-hint" class="form-hint">This venue takes {{ capacityRange(venue) }} guests.</p>
              </div>

              <dl v-if="perHead > 0" class="panel-sunken px-4 py-1">
                <div class="dl-row"><dt>PKR {{ formatNumber(perHead) }} × <span class="num">{{ formatNumber(estGuests) }}</span> guests</dt><dd>{{ formatPKR(estimate.base) }}</dd></div>
                <div class="dl-row"><dt>Tax (5%)</dt><dd>{{ formatPKR(estimate.tax) }}</dd></div>
                <div class="dl-row !text-[0.9375rem]"><dt class="!text-ink font-semibold">Estimated total</dt><dd class="!font-semibold">{{ formatPKR(estimate.total) }}</dd></div>
              </dl>

              <div>
                <template v-if="authStore.isLoggedIn && authStore.user?.role === 'client'">
                  <RouterLink :to="bookingLink" class="btn-primary btn-lg btn-block">
                    <AppIcon icon="calendar-event" class="w-4 h-4" />Check dates and book
                  </RouterLink>
                </template>
                <p v-else-if="authStore.isLoggedIn" class="alert-info text-sm">
                  <AppIcon icon="info-circle" class="w-4 h-4 shrink-0" />
                  <span>Only customer accounts can book venues.</span>
                </p>
                <template v-else>
                  <RouterLink :to="{ path: '/customer/sign-in', query: { redirect: bookingPath } }" class="btn-primary btn-lg btn-block">
                    Sign in to book
                  </RouterLink>
                  <p class="mt-2 text-center text-[0.8125rem] text-ink-muted">
                    New here? <RouterLink :to="{ path: '/customer/sign-up', query: { redirect: bookingPath } }" class="link">Create a free account</RouterLink>
                  </p>
                </template>
              </div>

              <ul class="space-y-2 border-t border-line pt-4 text-[0.8125rem] text-ink-secondary">
                <li class="flex gap-2"><AppIcon icon="shield-check" class="w-4 h-4 shrink-0 text-brand-text" />You won't pay anything until the owner confirms.</li>
                <li class="flex gap-2"><AppIcon icon="calendar-check" class="w-4 h-4 shrink-0 text-brand-text" />Multi-day bookings supported.</li>
                <li class="flex gap-2"><AppIcon icon="receipt" class="w-4 h-4 shrink-0 text-brand-text" />Paid add-ons are chosen in the next step.</li>
              </ul>
            </div>
          </div>
        </aside>
      </div>

      <!-- Mobile booking bar -->
      <div v-show="showMobileBar" class="mobile-book-bar lg:hidden">
        <div class="min-w-0">
          <p v-if="perHead > 0" class="truncate text-sm font-semibold text-ink num">{{ formatPKR(estimate.total) }} <span class="font-normal text-ink-muted">est.</span></p>
          <p v-else class="text-sm font-semibold text-ink">Price on request</p>
          <p class="truncate text-xs text-ink-muted num">{{ perHead > 0 ? `PKR ${formatNumber(perHead)}/head · ${formatNumber(estGuests)} guests` : capacityRange(venue) + ' guests' }}</p>
        </div>
        <RouterLink
          v-if="authStore.isLoggedIn && authStore.user?.role === 'client'"
          :to="bookingLink"
          class="btn-primary shrink-0"
        >Book now</RouterLink>
        <RouterLink
          v-else-if="!authStore.isLoggedIn"
          :to="{ path: '/customer/sign-in', query: { redirect: bookingPath } }"
          class="btn-primary shrink-0"
        >Sign in to book</RouterLink>
        <a v-else href="#book" class="btn-secondary shrink-0">Details</a>
      </div>
    </article>

    <!-- Not found -->
    <div v-else class="content-container py-16">
      <div class="card">
        <div class="empty-state">
          <div class="empty-state-icon"><AppIcon icon="building-store" class="w-5 h-5" /></div>
          <p class="empty-state-title">Venue not found</p>
          <p class="empty-state-desc">This venue may have been removed, or the link is incorrect.</p>
          <div class="empty-state-actions"><RouterLink to="/venues" class="btn-primary">Browse venues</RouterLink></div>
        </div>
      </div>
    </div>

    <ImageLightbox ref="lightboxRef" :images="lightboxImages" :initial-index="0" />
  </div>
</template>

<script setup lang="ts">
import { formatPKR, formatAddress } from '@/lib/format'
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import api from '@/lib/axios'
import { useAuthStore } from '@/stores/auth'
import { getStorageUrl } from '@/lib/storageUrl'
import ImageLightbox from '@/components/gallery/ImageLightbox.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import VenueReviews from '@/components/reviews/VenueReviews.vue'
import StarRating from '@/components/reviews/StarRating.vue'
import ReviewSummary from '@/components/venue/ReviewSummary.vue'
import type { LightboxImage } from '@/components/gallery/ImageLightbox.vue'
import {
  capacityRange, eventTypeIcon, eventTypeLabel, formatClock, formatNumber, plural, ratingText, type CategoryLike,
} from '@/components/venue/venueUtils'

const route = useRoute()
const authStore = useAuthStore()

const venue = ref<any>(null)
const loading = ref(true)
const loadError = ref(false)
const categories = ref<CategoryLike[]>([])
const lightboxRef = ref<InstanceType<typeof ImageLightbox> | null>(null)

async function loadVenue() {
  loading.value = true
  loadError.value = false
  try {
    const { data } = await api.get(`/venues/${route.params.id}`)
    venue.value = data?.data ?? null
    guests.value = Number(venue.value?.capacity_min) || 1
  } catch (e: any) {
    venue.value = null
    // A missing venue shows "not found"; anything else is a load error with a retry.
    loadError.value = !!e && e.response?.status !== 404 && e.response?.status !== 403
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadVenue()
  api.get('/categories').then(r => { categories.value = r.data?.data ?? [] }).catch(() => {})
})
watch(() => route.params.id, (id, old) => { if (id && id !== old && route.name === 'venue-detail') loadVenue() })

// ─── Photos ──────────────────────────────────────────────────────────────────
const images = computed<any[]>(() => {
  const imgs: any[] = (venue.value?.images || []).filter((i: any) => i?.path)
  if (!imgs.length) return venue.value?.thumbnail ? [{ path: venue.value.thumbnail, alt_text: venue.value.name }] : []
  const primary = imgs.find(i => i.is_primary)
  return primary ? [primary, ...imgs.filter(i => i !== primary)] : imgs
})

const lightboxImages = computed<LightboxImage[]>(() => images.value.map((img: any, i: number) => ({
  url: getStorageUrl(img.path),
  thumbnail: getStorageUrl(img.path),
  alt: img.alt_text || `${venue.value?.name || 'Venue'} photo ${i + 1}`,
})))

function openLightbox(index = 0) {
  lightboxRef.value?.open(index)
}

function onImageError(e: Event) {
  (e.target as HTMLImageElement).style.visibility = 'hidden'
}

// ─── Facts ───────────────────────────────────────────────────────────────────
const rating = computed(() => ratingText(venue.value))
const perHead = computed(() => Number(venue.value?.price_per_head) || 0)

const hoursText = computed(() => {
  const s = venue.value?.operating_start
  const e = venue.value?.operating_end
  return s && e ? `${formatClock(s)} – ${formatClock(e)}` : 'Ask the host'
})

const PRICING_LABELS: Record<string, string> = {
  per_head: 'Per guest (per head)',
  per_hour: 'Per hour',
  per_day: 'Per day',
  per_event: 'Per event',
}

const keyFacts = computed(() => [
  { icon: 'users', label: 'Guests', value: capacityRange(venue.value) },
  { icon: 'banknote', label: 'Price per head', value: perHead.value ? `PKR ${formatNumber(perHead.value)}` : 'On request' },
  { icon: 'ruler', label: 'Area', value: venue.value?.area_sqft ? `${formatNumber(venue.value.area_sqft)} sq ft` : '—' },
  { icon: 'clock', label: 'Open', value: hoursText.value },
])

const specRows = computed(() => {
  const v = venue.value || {}
  return [
    { icon: 'users', label: 'Capacity', value: `${capacityRange(v)} guests` },
    { icon: 'ruler', label: 'Area', value: v.area_sqft ? `${formatNumber(v.area_sqft)} sq ft` : 'Not listed' },
    { icon: 'building', label: 'Floors', value: v.floors ? formatNumber(v.floors) : 'Not listed' },
    { icon: 'clock', label: 'Operating hours', value: hoursText.value },
    { icon: 'receipt', label: 'Pricing', value: PRICING_LABELS[v.pricing_type] || (v.pricing_type ? String(v.pricing_type).replace(/_/g, ' ') : 'Per head') },
    { icon: 'calendar-check', label: 'Bookings on EventGenius', value: formatNumber(v.total_bookings || 0) },
  ]
})

const eventTypes = computed<string[]>(() => (Array.isArray(venue.value?.event_types) ? venue.value.event_types : []))
const includedAmenities = computed(() => (venue.value?.amenities || []).filter((a: any) => !a.is_paid))
const paidAmenities = computed(() => (venue.value?.amenities || []).filter((a: any) => a.is_paid))
const amenitySubtitle = computed(() => {
  const i = includedAmenities.value.length
  const p = paidAmenities.value.length
  if (!i && !p) return 'Not listed yet'
  return [i ? `${i} included` : '', p ? `${p} paid add-on${p === 1 ? '' : 's'}` : ''].filter(Boolean).join(' · ')
})

const sectionLinks = computed(() => [
  { id: 'about', label: 'Overview' },
  { id: 'amenities', label: 'Amenities' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'location', label: 'Location' },
])

const mapsUrl = computed(() => {
  const v = venue.value
  if (!v) return ''
  const lat = Number(v.latitude)
  const lng = Number(v.longitude)
  if (Number.isFinite(lat) && Number.isFinite(lng) && (lat || lng)) return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
  const q = formatAddress(v)
  return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : ''
})

function initials(name: string) {
  return String(name || '').split(/\s+/).filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'EG'
}

// ─── Guest estimate (same maths as the booking flow: per head × guests + 5% tax) ──
const guests = ref(1)
const guestMin = computed(() => Number(venue.value?.capacity_min) || 1)
const guestMax = computed(() => Number(venue.value?.capacity_max) || 0)
const guestError = computed(() => {
  const g = Number(guests.value)
  if (!g) return 'Enter how many guests you expect.'
  if (!Number.isInteger(g) || g < guestMin.value || (guestMax.value && g > guestMax.value)) {
    return guestMax.value
      ? `This venue takes between ${formatNumber(guestMin.value)} and ${formatNumber(guestMax.value)} guests.`
      : `This venue needs at least ${formatNumber(guestMin.value)} guests.`
  }
  return ''
})
/** Guests used for the estimate: the typed number, clamped to what the venue allows. */
const estGuests = computed(() => {
  let g = Math.round(Number(guests.value) || guestMin.value)
  g = Math.max(guestMin.value, g)
  if (guestMax.value) g = Math.min(guestMax.value, g)
  return g
})
const estimate = computed(() => {
  const round2 = (n: number) => Math.round(n * 100) / 100
  const base = round2(perHead.value * estGuests.value)
  const tax = round2(base * 0.05)
  return { base, tax, total: round2(base + tax) }
})

function stepGuests(dir: 1 | -1) {
  const step = estGuests.value >= 200 ? 50 : 10
  let g = (Number(guests.value) || guestMin.value) + dir * step
  g = Math.max(guestMin.value, g)
  if (guestMax.value) g = Math.min(guestMax.value, g)
  guests.value = g
}

const bookingPath = computed(() => {
  const base = `/venues/${route.params.id}/book`
  return guestError.value ? base : `${base}?guests=${estGuests.value}`
})
const bookingLink = computed(() => bookingPath.value)

// ─── Mobile booking bar: shown only while the booking panel is still below the screen ──
const bookPanel = ref<HTMLElement | null>(null)
const showMobileBar = ref(true)
let observer: IntersectionObserver | null = null
function observePanel() {
  observer?.disconnect()
  if (!bookPanel.value || typeof IntersectionObserver === 'undefined') return
  observer = new IntersectionObserver(([entry]) => {
    showMobileBar.value = !entry.isIntersecting && entry.boundingClientRect.top > 0
  })
  observer.observe(bookPanel.value)
}
watch(venue, () => nextTick(observePanel))
onBeforeUnmount(() => observer?.disconnect())
</script>

<style scoped>
/* Photo mosaic: 1 large photo plus up to 4 smaller ones. */
.gallery {
  position: relative;
  display: grid;
  gap: 0.5rem;
  height: clamp(240px, 46vw, 460px);
  overflow: hidden;
  border-radius: var(--radius-xl);
}
.gallery--1 { grid-template-columns: 1fr; }
@media (min-width: 640px) {
  .gallery--2 { grid-template-columns: 1fr 1fr; }
  .gallery--3 { grid-template-columns: 2fr 1fr; grid-template-rows: 1fr 1fr; }
  .gallery--3 .gallery-tile:first-child { grid-row: span 2; }
  .gallery--4 { grid-template-columns: 2fr 1fr 1fr; grid-template-rows: 1fr 1fr; }
  .gallery--4 .gallery-tile:first-child { grid-row: span 2; }
  .gallery--4 .gallery-tile:nth-child(4) { grid-column: span 2; }
  .gallery--5 { grid-template-columns: 2fr 1fr 1fr; grid-template-rows: 1fr 1fr; }
  .gallery--5 .gallery-tile:first-child { grid-row: span 2; }
}
.gallery-tile {
  position: relative;
  min-height: 0;
  overflow: hidden;
  background: var(--surface-sunken);
  cursor: zoom-in;
}
.gallery-tile img { transition: transform .4s ease, opacity .2s ease; }
.gallery-tile:hover img { transform: scale(1.02); opacity: .94; }
.gallery-tile:focus-visible { outline-offset: -3px; }
.gallery-all {
  position: absolute;
  right: 0.75rem;
  bottom: 0.75rem;
  box-shadow: var(--shadow-md);
}

.event-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 40px;
  padding: 0 0.875rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--ink);
  font-size: 0.875rem;
  font-weight: 500;
  transition: border-color .15s ease, background-color .15s ease;
}
.event-chip:hover { border-color: rgb(var(--c-line-strong) / 0.6); background: var(--surface-hover); }

.mobile-book-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: var(--z-sticky);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 1rem calc(0.75rem + env(safe-area-inset-bottom));
  background: var(--surface);
  border-top: 1px solid var(--line);
  box-shadow: 0 -2px 10px rgba(28, 25, 23, 0.06);
}

/* Remove number spinners; the +/- buttons do this job. */
input[type='number']::-webkit-outer-spin-button,
input[type='number']::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
input[type='number'] { -moz-appearance: textfield; appearance: textfield; }
</style>
