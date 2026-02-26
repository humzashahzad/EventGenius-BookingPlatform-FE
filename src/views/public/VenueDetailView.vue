<template>
  <div v-if="loading" class="flex justify-center py-24">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
  </div>

  <div v-else-if="venue" class="page-container">
    <!-- Venue gallery -->
    <div class="venue-gallery mb-8 rounded-xl overflow-hidden border border-surface-200">
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
          <span class="text-6xl">🏛️</span>
          <p class="text-surface-500 mt-2">No photos</p>
        </div>
        <!-- View All Photos overlay -->
        <button
          v-if="allImages.length > 1"
          type="button"
          class="gallery-view-all"
          @click="openLightbox(0)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>
          View All Photos ({{ allImages.length }})
        </button>
        <button
          v-if="allImages.length > 1 && galleryIndex > 0"
          type="button"
          class="gallery-nav gallery-prev"
          aria-label="Previous"
          @click="galleryIndex = Math.max(0, galleryIndex - 1)"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <button
          v-if="allImages.length > 1 && galleryIndex < allImages.length - 1"
          type="button"
          class="gallery-nav gallery-next"
          aria-label="Next"
          @click="galleryIndex = Math.min(allImages.length - 1, galleryIndex + 1)"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
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

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Main Info -->
      <div class="lg:col-span-2">
        <div class="flex items-start justify-between mb-4">
          <div>
            <h1 class="text-3xl font-bold text-surface-900">{{ venue.name }}</h1>
            <p class="text-surface-500 mt-1">📍 {{ venue.address }}, {{ venue.city }}, {{ venue.country }}</p>
          </div>
          <div class="flex items-center gap-1 text-amber-500 flex-shrink-0">
            <span class="text-lg">★</span>
            <span class="text-xl font-bold text-surface-900">{{ venue.avg_rating?.toFixed(1) || 'New' }}</span>
            <span class="text-sm text-surface-500">({{ venue.total_reviews }} reviews)</span>
          </div>
        </div>

        <div class="flex flex-wrap gap-2 mb-6">
          <span v-for="type in (venue.event_types || [])" :key="type" class="badge-info capitalize">{{ type.replace('_', ' ') }}</span>
        </div>

        <div class="card mb-6">
          <div class="card-body">
            <h2 class="section-title mb-3">About this venue</h2>
            <p class="text-surface-600 leading-relaxed">{{ venue.description || 'No description provided.' }}</p>
          </div>
        </div>

        <div class="card mb-6">
          <div class="card-body">
            <h2 class="section-title mb-4">Venue Details</h2>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="text-center p-3 bg-surface-50 rounded-lg">
                <div class="text-2xl mb-1">👥</div>
                <div class="text-sm font-medium text-surface-900">{{ venue.capacity_min }}-{{ venue.capacity_max }}</div>
                <div class="text-xs text-surface-500">Guests</div>
              </div>
              <div class="text-center p-3 bg-surface-50 rounded-lg">
                <div class="text-2xl mb-1">📐</div>
                <div class="text-sm font-medium text-surface-900">{{ venue.area_sqft || 'N/A' }}</div>
                <div class="text-xs text-surface-500">Sq. Ft.</div>
              </div>
              <div class="text-center p-3 bg-surface-50 rounded-lg">
                <div class="text-2xl mb-1">🏢</div>
                <div class="text-sm font-medium text-surface-900">{{ venue.floors }}</div>
                <div class="text-xs text-surface-500">Floors</div>
              </div>
              <div class="text-center p-3 bg-surface-50 rounded-lg">
                <div class="text-2xl mb-1">📅</div>
                <div class="text-sm font-medium text-surface-900">{{ venue.total_bookings }}</div>
                <div class="text-xs text-surface-500">Bookings</div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="venue.amenities?.length" class="card mb-6">
          <div class="card-body">
            <h2 class="section-title mb-4">Amenities</h2>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div v-for="amenity in venue.amenities" :key="amenity.id" class="flex items-center gap-2 text-sm text-surface-700">
                <span class="text-success-500">✓</span>
                <span>{{ amenity.name }}</span>
                <span v-if="amenity.is_paid" class="text-xs text-surface-400">(PKR {{ amenity.price }})</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Reviews -->
        <div class="card">
          <div class="card-body">
            <h2 class="section-title mb-4">Reviews</h2>
            <div v-if="venue.reviews?.length === 0" class="empty-state py-8">
              <p class="empty-state-desc">No reviews yet.</p>
            </div>
            <div v-else class="space-y-4">
              <div v-for="review in venue.reviews" :key="review.id" class="border-b border-surface-100 pb-4 last:border-0">
                <div class="flex items-center justify-between mb-2">
                  <span class="font-medium text-surface-900">{{ review.client?.name }}</span>
                  <div class="flex gap-0.5 text-amber-400">
                    <span v-for="i in review.rating" :key="i">★</span>
                  </div>
                </div>
                <p class="text-sm text-surface-600">{{ review.comment }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Booking Sidebar -->
      <div class="lg:col-span-1">
        <div class="card card-body sticky top-4">
          <div class="mb-4">
            <div class="text-2xl font-bold text-primary-600">
              PKR {{ formatPrice(venue) }}
            </div>
            <div class="text-sm text-surface-500">per {{ venue.pricing_type?.replace('per_', '') }}</div>
          </div>

          <div v-if="authStore.isLoggedIn && authStore.user?.role === 'client'">
            <form @submit.prevent="submitBooking" class="space-y-3">
              <div>
                <label class="form-label">Event Name</label>
                <input v-model="booking.event_name" required class="form-input" placeholder="My Wedding" />
              </div>
              <div>
                <label class="form-label">Event Type</label>
                <select v-model="booking.event_type" required class="form-input">
                  <option value="">Select type</option>
                  <option value="wedding">Wedding</option>
                  <option value="corporate">Corporate</option>
                  <option value="birthday">Birthday</option>
                  <option value="film_shoot">Film Shoot</option>
                  <option value="concert">Concert</option>
                  <option value="exhibition">Exhibition</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label class="form-label">Event Date & Time</label>
                <p class="text-xs text-surface-500 mb-2">Pick a date and available slot (booked slots are disabled).</p>
                <BookingCalendar
                  :venue-id="venue.id"
                  @select="onCalendarSelect"
                />
              </div>
              <div v-if="booking.event_date" class="grid grid-cols-2 gap-2">
                <div>
                  <label class="form-label">Start Time</label>
                  <input v-model="booking.start_time" type="time" required class="form-input" />
                </div>
                <div>
                  <label class="form-label">End Time</label>
                  <input v-model="booking.end_time" type="time" required class="form-input" />
                </div>
              </div>
              <div>
                <label class="form-label">Expected Guests</label>
                <input v-model.number="booking.expected_guests" type="number" required class="form-input"
                  :min="venue.capacity_min" :max="venue.capacity_max" :placeholder="`${venue.capacity_min}-${venue.capacity_max}`" />
              </div>
              <div>
                <label class="form-label">Special Requirements</label>
                <textarea v-model="booking.special_requirements" class="form-input" rows="2" placeholder="Any special requests..."></textarea>
              </div>

              <div v-if="bookingError" class="alert alert-danger py-2">{{ bookingError }}</div>
              <div v-if="bookingSuccess" class="alert alert-success py-2">Booking submitted! We'll confirm shortly.</div>

              <button type="submit" :disabled="bookingLoading" class="btn-primary w-full">
                <span v-if="bookingLoading">Submitting...</span>
                <span v-else>Book Now</span>
              </button>
            </form>
          </div>

          <div v-else-if="authStore.isLoggedIn" class="text-center py-4 text-surface-500 text-sm">
            Only clients can book venues.
          </div>

          <div v-else class="text-center py-4">
            <p class="text-surface-600 text-sm mb-3">Sign in to book this venue</p>
            <RouterLink to="/client/sign-in" class="btn-primary w-full block text-center">Sign In to Book</RouterLink>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="page-container">
    <div class="empty-state py-20">
      <p class="empty-state-title">Venue not found</p>
      <p class="empty-state-desc mt-1">The venue may have been removed or the link is incorrect.</p>
      <RouterLink to="/venues" class="btn-primary mt-4">Browse Venues</RouterLink>
    </div>
  </div>

  <!-- Image Lightbox -->
  <ImageLightbox
    ref="lightboxRef"
    :images="lightboxImages"
    :initial-index="galleryIndex"
  />
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import api from '@/lib/axios'
import { useAuthStore } from '@/stores/auth'
import { getStorageUrl } from '@/lib/storageUrl'
import BookingCalendar from '@/components/booking/BookingCalendar.vue'
import ImageLightbox from '@/components/gallery/ImageLightbox.vue'
import type { LightboxImage } from '@/components/gallery/ImageLightbox.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const venue = ref<any>(null)
const loading = ref(true)
const mainImage = ref<string | null>(null)
const galleryIndex = ref(0)
const bookingLoading = ref(false)
const bookingError = ref('')
const bookingSuccess = ref(false)

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

const booking = reactive({
  event_name: '',
  event_type: '',
  event_date: '',
  start_time: '',
  end_time: '',
  expected_guests: 1,
  special_requirements: '',
})

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

const minDate = computed(() => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
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

function onCalendarSelect(date: Date, time: string) {
  booking.event_date = date.toISOString().split('T')[0]
  booking.start_time = time
  const [h, m] = time.split(':').map(Number)
  const end = new Date(date)
  end.setHours(h + 1, m, 0, 0)
  booking.end_time = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`
}

function formatPrice(v: any) {
  const price = v.price_per_hour ?? v.price_per_day ?? v.price_per_event
  return price ? Number(price).toLocaleString() : 'Contact'
}

async function submitBooking() {
  bookingLoading.value = true
  bookingError.value = ''
  bookingSuccess.value = false
  try {
    await api.post('/client/bookings', { ...booking, venue_id: venue.value.id })
    bookingSuccess.value = true
    setTimeout(() => router.push('/client/bookings'), 2000)
  } catch (e: any) {
    bookingError.value = e.response?.data?.message || 'Booking failed. Please try again.'
  } finally {
    bookingLoading.value = false
  }
}

onMounted(loadVenue)
</script>

<style scoped>
.venue-gallery {
  background: var(--color-bg-elevated, #f8fafc);
}
.gallery-main {
  position: relative;
  aspect-ratio: 16/9;
  max-height: 420px;
  background: var(--color-surface-100, #f1f5f9);
}
.gallery-main-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.gallery-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted, #64748b);
}
.gallery-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255,255,255,0.9);
  border: 1px solid var(--color-border, #e2e8f0);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: background 0.2s;
}
.gallery-nav:hover { background: #fff; }
.gallery-prev { left: 12px; }
.gallery-next { right: 12px; }
.gallery-thumbs {
  display: flex;
  gap: 8px;
  padding: 12px;
  overflow-x: auto;
  background: var(--color-bg, #fff);
}
.gallery-thumb {
  flex-shrink: 0;
  width: 72px;
  height: 72px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid transparent;
  padding: 0;
  cursor: pointer;
  transition: border-color 0.2s;
}
.gallery-thumb.active { border-color: var(--color-primary-500, #3b82f6); }
.gallery-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.gallery-view-all {
  position: absolute;
  bottom: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 2;
}
.gallery-view-all:hover {
  background: rgba(0, 0, 0, 0.85);
  transform: translateY(-1px);
}
</style>
