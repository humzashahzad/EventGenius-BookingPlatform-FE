<template>
  <div v-if="loading" class="flex items-center justify-center py-24">
    <div class="flex flex-col items-center gap-3">
      <div class="w-10 h-10 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
      <span class="text-sm text-warm-500">Loading venue...</span>
    </div>
  </div>

  <div v-else-if="venue" class="max-w-7xl mx-auto flex-grow px-4 py-8 font-['DM_Sans']">
    <!-- Gallery -->
    <div class="detail-gallery mb-10">
      <div class="gallery-main">
        <img
          v-if="mainImage"
          :src="getImageUrl(mainImage)"
          class="gallery-main-img cursor-pointer"
          :alt="venue.name"
          @error="onImageError"
          @click="openLightbox(galleryIndex)"
        />
        <div v-else class="gallery-placeholder">
          <AppIcon icon="building" class="w-16 h-16 text-[var(--color-text-muted)]" />
          <p class="text-warm-400 mt-2">No photos available</p>
        </div>
        <button
          v-if="allImages.length > 1"
          type="button"
          class="gallery-photos-btn"
          @click="openLightbox(0)"
        >
          <AppIcon icon="image" class="w-4 h-4" />
          {{ allImages.length }} Photos
        </button>
        <button
          v-if="allImages.length > 1 && galleryIndex > 0"
          type="button"
          class="gallery-nav gallery-prev"
          @click="galleryIndex = Math.max(0, galleryIndex - 1)"
        >
          <AppIcon icon="chevron-left" class="w-5 h-5" />
        </button>
        <button
          v-if="allImages.length > 1 && galleryIndex < allImages.length - 1"
          type="button"
          class="gallery-nav gallery-next"
          @click="galleryIndex = Math.min(allImages.length - 1, galleryIndex + 1)"
        >
          <AppIcon icon="chevron-right" class="w-5 h-5" />
        </button>
      </div>
      <div v-if="allImages.length > 1" class="gallery-thumbs">
        <button
          v-for="(img, i) in allImages"
          :key="i"
          type="button"
          class="gallery-thumb"
          :class="{ active: i === galleryIndex }"
          @click="galleryIndex = i; setMainImage(img.path)"
        >
          <img :src="getImageUrl(img.path)" :alt="venue.name" @error="onImageError" />
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-10">
      <!-- Main Info -->
      <div class="lg:col-span-2">
        <!-- Title & Rating -->
        <div class="flex items-start justify-between mb-6">
          <div>
            <h2 class="detail-title">{{ venue.name }}</h2>
            <p class="detail-location">
              <AppIcon icon="map-pin" class="w-3.5 h-3.5" />
              {{ venue.address }}, {{ venue.city }}, {{ venue.country }}
            </p>
          </div>
          <div class="detail-rating">
            <div class="detail-rating-score">
              <AppIcon icon="star-filled" class="w-4 h-4 text-[#F59E0B]" />
              {{ venue.avg_rating?.toFixed(1) || 'New' }}
            </div>
            <span class="detail-rating-count">{{ venue.total_reviews }} reviews</span>
          </div>
        </div>

        <!-- Event Type Tags -->
        <div class="flex flex-wrap gap-2 mb-10">
          <span v-for="type in (venue.event_types || [])" :key="type" class="detail-tag">
            {{ type.replace('_', ' ') }}
          </span>
        </div>

        <!-- About -->
        <div class="detail-section">
          <h3 class="detail-section-title">
            <AppIcon icon="info-circle" class="w-[18px] h-[18px] text-[#10B981]" />
            About this venue
          </h3>
          <p class="detail-section-text">{{ venue.description || 'No description provided.' }}</p>
        </div>

        <!-- Venue Details -->
        <div class="detail-section">
          <h3 class="detail-section-title">
            <AppIcon icon="building" class="w-[18px] h-[18px] text-[#10B981]" />
            Venue Details
          </h3>
          <div class="detail-stats-grid">
            <div class="detail-stat-item">
              <div class="detail-stat-icon" style="--accent: #10B981;">
                <AppIcon icon="users" class="w-5 h-5" />
              </div>
              <div class="detail-stat-value">{{ venue.capacity_min }}-{{ venue.capacity_max }}</div>
              <div class="detail-stat-label">Guests</div>
            </div>
            <div class="detail-stat-item">
              <div class="detail-stat-icon" style="--accent: #F59E0B;">
                <AppIcon icon="ruler" class="w-5 h-5" />
              </div>
              <div class="detail-stat-value">{{ venue.area_sqft || 'N/A' }}</div>
              <div class="detail-stat-label">Sq. Ft.</div>
            </div>
            <div class="detail-stat-item">
              <div class="detail-stat-icon" style="--accent: #34D399;">
                <AppIcon icon="building" class="w-5 h-5" />
              </div>
              <div class="detail-stat-value">{{ venue.floors }}</div>
              <div class="detail-stat-label">Floors</div>
            </div>
            <div class="detail-stat-item">
              <div class="detail-stat-icon" style="--accent: #F59E0B;">
                <AppIcon icon="calendar-event" class="w-5 h-5" />
              </div>
              <div class="detail-stat-value">{{ venue.total_bookings }}</div>
              <div class="detail-stat-label">Bookings</div>
            </div>
          </div>
        </div>

        <!-- Amenities -->
        <div v-if="venue.amenities?.length" class="detail-section">
          <h3 class="detail-section-title">
            <AppIcon icon="sparkles" class="w-[18px] h-[18px] text-[#10B981]" />
            Amenities
          </h3>
          <div class="amenities-grid">
            <div v-for="amenity in venue.amenities" :key="amenity.id" class="amenity-item">
              <AppIcon icon="circle-check" class="w-4 h-4 text-[#10B981]" />
              <span class="amenity-name">{{ amenity.name }}</span>
              <span v-if="amenity.is_paid" class="amenity-price">PKR {{ amenity.price }}</span>
            </div>
          </div>
        </div>

        <!-- Reviews -->
        <div class="detail-section">
          <h3 class="detail-section-title">
            <AppIcon icon="message-star" class="w-[18px] h-[18px] text-[#10B981]" />
            Reviews
          </h3>
          <div v-if="!venue.reviews?.length" class="empty-state" style="padding:2rem;">
            <div class="empty-state-icon" style="width:3.5rem;height:3.5rem;">
              <AppIcon icon="message-off" class="w-5 h-5" />
            </div>
            <p class="empty-state-title" style="font-size:0.9375rem;">No reviews yet</p>
            <p class="empty-state-desc" style="font-size:0.8125rem;">Be the first to review this venue after your booking!</p>
          </div>
          <div v-else class="reviews-list">
            <div v-for="(review, idx) in venue.reviews" :key="review.id" class="review-card" :class="{ 'border-b-0': idx === venue.reviews.length - 1 }">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <div class="review-avatar">{{ review.client?.name?.charAt(0) || '?' }}</div>
                  <span class="review-author">{{ review.client?.name }}</span>
                </div>
                <div class="review-stars">
                  <AppIcon v-for="i in review.rating" :key="i" icon="star-filled" class="w-3 h-3 text-[#F59E0B]" />
                </div>
              </div>
              <p class="review-text">{{ review.comment }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Booking Sidebar -->
      <div class="lg:col-span-1">
        <div class="booking-sidebar">
          <div class="booking-price-section">
            <div class="booking-price">PKR {{ formatPrice(venue) }}</div>
            <div class="booking-price-label">per head</div>
          </div>

          <div class="booking-divider"></div>

          <div v-if="authStore.isLoggedIn && authStore.user?.role === 'client'">
            <RouterLink :to="`/venues/${venue.id}/book`" class="booking-btn">
              <AppIcon icon="calendar-event" class="w-[18px] h-[18px]" />
              Book This Venue
            </RouterLink>
            <p class="booking-note">Multi-day booking supported</p>
          </div>

          <div v-else-if="authStore.isLoggedIn" class="booking-note" style="padding:1rem 0;">
            Only customers can book venues.
          </div>

          <div v-else>
            <p class="booking-note" style="margin-bottom:0.75rem;">Sign in to book this venue</p>
            <RouterLink to="/customer/sign-in" class="booking-btn">Sign In to Book</RouterLink>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Not Found -->
  <div v-else class="max-w-7xl mx-auto flex-grow px-4 py-8">
    <div class="empty-state">
      <div class="empty-state-icon" style="background:rgba(249,112,102,0.12);color:#F97066;">
        <AppIcon icon="building-store" class="w-7 h-7" />
      </div>
      <p class="empty-state-title">Venue not found</p>
      <p class="empty-state-desc">The venue may have been removed or the link is incorrect.</p>
      <RouterLink to="/venues" class="inline-flex items-center gap-2 mt-4 px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-soft hover:shadow-elevated">Browse Venues</RouterLink>
    </div>
  </div>

  <ImageLightbox
    ref="lightboxRef"
    :images="lightboxImages"
    :initial-index="galleryIndex"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import api from '@/lib/axios'
import { useAuthStore } from '@/stores/auth'
import { getStorageUrl } from '@/lib/storageUrl'
import ImageLightbox from '@/components/gallery/ImageLightbox.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import type { LightboxImage } from '@/components/gallery/ImageLightbox.vue'

const route = useRoute()
const authStore = useAuthStore()

const venue = ref<any>(null)
const loading = ref(true)
const mainImage = ref<string | null>(null)
const galleryIndex = ref(0)

const lightboxRef = ref<InstanceType<typeof ImageLightbox> | null>(null)

const lightboxImages = computed<LightboxImage[]>(() => {
  return allImages.value.map((img: any) => ({
    url: getStorageUrl(img.path),
    thumbnail: getStorageUrl(img.path),
    alt: img.alt_text || venue.value?.name || 'Venue image',
  }))
})

function openLightbox(index: number = 0) {
  lightboxRef.value?.open(index)
}

const allImages = computed(() => {
  const imgs = venue.value?.images || []
  if (!imgs.length) return []
  const primary = imgs.find((i: any) => i.is_primary)
  const ordered = primary ? [primary, ...imgs.filter((i: any) => i !== primary)] : imgs
  return ordered
})

watch(allImages, (imgs) => {
  if (imgs.length && mainImage.value) {
    const idx = imgs.findIndex((i: any) => i.path === mainImage.value)
    galleryIndex.value = idx >= 0 ? idx : 0
  }
})

watch(galleryIndex, (i) => {
  const imgs = allImages.value
  if (imgs[i]) mainImage.value = imgs[i].path
})

async function loadVenue() {
  loading.value = true
  try {
    const { data } = await api.get(`/venues/${route.params.id}`)
    venue.value = data.data
    const primary = venue.value.images?.find((i: any) => i.is_primary)
    mainImage.value = primary?.path || venue.value.images?.[0]?.path || venue.value.thumbnail || null
    galleryIndex.value = 0
  } catch {
    venue.value = null
  } finally {
    loading.value = false
  }
}

function setMainImage(path: string) {
  mainImage.value = path
  const idx = allImages.value.findIndex((i: any) => i.path === path)
  if (idx >= 0) galleryIndex.value = idx
}

function getImageUrl(path: string) {
  return getStorageUrl(path)
}

function onImageError(e: Event) {
  (e.target as HTMLImageElement).style.display = 'none'
}

function formatPrice(v: any) {
  const price = v.price_per_head
  return price ? Number(price).toLocaleString() : 'Contact'
}

onMounted(loadVenue)
</script>

<style scoped>
.cursor-pointer { cursor: pointer; }

/* ─── Gallery ──────────────────────────────────────────────────────────────── */
.detail-gallery {
  border-radius: 1rem;
  overflow: hidden;
  border: 1px solid var(--color-border-light);
  box-shadow: var(--shadow-card, 0 2px 8px rgba(0,0,0,0.08));
}

.gallery-main {
  position: relative;
  aspect-ratio: 16/9;
  max-height: 480px;
  background: var(--color-bg-hover);
}

.gallery-main-img {
  width: 100%; height: 100%;
  object-fit: cover;
}

.gallery-placeholder {
  width: 100%; height: 100%;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
}

.gallery-nav {
  position: absolute;
  top: 50%; transform: translateY(-50%);
  width: 44px; height: 44px;
  border-radius: 50%;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.1);
  color: white;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}
.gallery-nav:hover { background: rgba(0,0,0,0.7); }
.gallery-prev { left: 16px; }
.gallery-next { right: 16px; }

.gallery-photos-btn {
  position: absolute;
  bottom: 16px; right: 16px;
  display: flex; align-items: center; gap: 6px;
  padding: 8px 16px;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(12px);
  color: white;
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 0.75rem;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.gallery-photos-btn:hover {
  background: rgba(0,0,0,0.8);
  transform: translateY(-1px);
}

.gallery-thumbs {
  display: flex; gap: 8px;
  padding: 12px 16px;
  overflow-x: auto;
  background: var(--color-bg-card);
}

.gallery-thumb {
  flex-shrink: 0;
  width: 72px; height: 72px;
  border-radius: 0.5rem;
  overflow: hidden;
  border: 2px solid transparent;
  padding: 0; cursor: pointer;
  transition: all 0.2s;
  opacity: 0.65;
}
.gallery-thumb:hover { opacity: 1; }
.gallery-thumb.active { border-color: #10B981; opacity: 1; }
.gallery-thumb img { width: 100%; height: 100%; object-fit: cover; }

/* ─── Detail Content ───────────────────────────────────────────────────────── */
.detail-title {
  font-family: 'DM Sans', sans-serif;
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--color-text);
  letter-spacing: -0.02em;
  margin-bottom: 0.375rem;
}

.detail-location {
  display: flex; align-items: center; gap: 0.375rem;
  color: var(--color-text-secondary);
  font-size: 0.9375rem;
  margin-bottom: 0;
}

.detail-rating {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex-shrink: 0;
}

.detail-rating-score {
  display: flex; align-items: center; gap: 0.375rem;
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--color-text);
}

.detail-rating-count {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.detail-tag {
  padding: 0.375rem 0.875rem;
  background: #ECFDF5;
  color: #10B981;
  border: 1px solid #A7F3D0;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
}

:root.dark .detail-tag {
  background: rgba(16, 185, 129, 0.12);
  color: #34D399;
  border-color: rgba(16, 185, 129, 0.25);
}

/* ─── Sections ─────────────────────────────────────────────────────────────── */
.detail-section {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-light);
  border-radius: 1rem;
  padding: 1.75rem;
  margin-bottom: 1.5rem;
  box-shadow: var(--shadow-soft, 0 1px 2px rgba(0,0,0,0.04));
}

.detail-section-title {
  display: flex; align-items: center; gap: 0.625rem;
  font-family: 'DM Sans', sans-serif;
  font-size: 1.0625rem;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 1.25rem;
}

.detail-section-text {
  color: var(--color-text-secondary);
  line-height: 1.7;
  font-size: 0.9375rem;
  margin-bottom: 0;
}

/* ─── Detail Stats ─────────────────────────────────────────────────────────── */
.detail-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.detail-stat-item {
  text-align: center;
  padding: 1.25rem 0.75rem;
  background: var(--color-bg);
  border-radius: 0.75rem;
  border: 1px solid var(--color-border-light);
}

.detail-stat-icon {
  width: 42px; height: 42px;
  border-radius: 0.75rem;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 0.75rem;
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  color: var(--accent);
}

.detail-stat-value {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 0.125rem;
}

.detail-stat-label {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  font-weight: 500;
}

/* ─── Amenities ────────────────────────────────────────────────────────────── */
.amenities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.75rem;
}

.amenity-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.875rem;
  background: var(--color-bg);
  border-radius: 0.75rem;
  font-size: 0.875rem;
}

.amenity-name {
  font-weight: 500;
  color: var(--color-text);
}

.amenity-price {
  margin-left: auto;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

/* ─── Reviews ──────────────────────────────────────────────────────────────── */
.reviews-list {
  display: flex;
  flex-direction: column;
}

.review-card {
  padding-bottom: 1.25rem;
  margin-bottom: 1.25rem;
  border-bottom: 1px solid var(--color-border-light);
}

.review-card:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.review-avatar {
  width: 32px; height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10B981, #34D399);
  color: white;
  font-weight: 700;
  font-size: 0.75rem;
  display: flex; align-items: center; justify-content: center;
}

.review-author {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--color-text);
}

.review-stars {
  display: flex; gap: 1px;
}

.review-text {
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  line-height: 1.6;
  margin-bottom: 0;
  margin-top: 0.25rem;
}

/* ─── Booking Sidebar ──────────────────────────────────────────────────────── */
.booking-sidebar {
  position: sticky;
  top: 1.5rem;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-light);
  border-radius: 1rem;
  padding: 1.75rem;
  box-shadow: var(--shadow-elevated, 0 8px 30px rgba(0,0,0,0.1));
}

.booking-price-section {
  text-align: center;
}

.booking-price {
  font-family: 'DM Sans', sans-serif;
  font-size: 1.75rem;
  font-weight: 800;
  color: #10B981;
  letter-spacing: -0.02em;
}

.booking-price-label {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

.booking-divider {
  height: 1px;
  background: var(--color-border-light);
  margin: 1.25rem 0;
}

.booking-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.875rem 1.5rem;
  background: linear-gradient(135deg, #10B981, #34D399);
  color: white;
  font-weight: 700;
  font-size: 1rem;
  border-radius: 0.75rem;
  text-decoration: none;
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.3);
  transition: all 0.25s ease;
}

.booking-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 28px rgba(16, 185, 129, 0.4);
  color: white;
}

.booking-note {
  text-align: center;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  margin-top: 0.75rem;
  margin-bottom: 0;
}

/* ─── Responsive ───────────────────────────────────────────────────────────── */
@media (max-width: 767.98px) {
  .detail-stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .detail-title {
    font-size: 1.375rem;
  }

  .gallery-main {
    max-height: 280px;
  }

  .gallery-thumb {
    width: 56px;
    height: 56px;
  }

  .detail-section {
    padding: 1.25rem;
  }
}

@media (max-width: 400px) {
  .detail-stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
