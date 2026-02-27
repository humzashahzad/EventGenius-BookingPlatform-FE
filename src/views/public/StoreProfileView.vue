<template>
  <div class="store-profile-page">
    <!-- Loading -->
    <div v-if="loading" class="loading-container">
      <div class="spinner-lg"></div>
      <p class="text-sm text-surface-500 mt-4">Loading store profile...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="error-container">
      <svg class="w-16 h-16 text-danger-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <h2 class="text-xl font-semibold text-surface-800 mb-2">Store Not Found</h2>
      <p class="text-surface-600">{{ error }}</p>
      <RouterLink to="/venues" class="btn-primary mt-6">Browse All Venues</RouterLink>
    </div>

    <!-- Store Landing Page -->
    <div v-else-if="store">
      <!-- Hero -->
      <section class="store-hero" :style="heroStyle">
        <div class="store-hero-overlay"></div>
        <div class="store-hero-content">
          <div class="store-hero-avatar">
            <img v-if="store.user?.avatar" :src="getAvatarUrl(store.user.avatar)" :alt="store.user.name" />
            <span v-else class="store-hero-initials">{{ getInitials(store.user?.name || store.name) }}</span>
          </div>
          <h1 class="store-hero-name">{{ store.user?.name || store.name }}</h1>
          <p v-if="landing?.tagline" class="store-hero-tagline">{{ landing.tagline }}</p>
          <div class="store-hero-actions">
            <button @click="startChat" class="hero-btn-primary gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
              Contact Store
            </button>
          </div>
        </div>
      </section>

      <!-- Stats -->
      <section class="store-stats-row">
        <div class="max-w-6xl mx-auto px-4 flex flex-wrap justify-center gap-8 sm:gap-16">
          <div class="stat-item">
            <div class="stat-number">{{ stats?.total_venues || 0 }}</div>
            <div class="stat-text">Venues</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ stats?.total_bookings || 0 }}</div>
            <div class="stat-text">Bookings</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ stats?.member_since || 'N/A' }}</div>
            <div class="stat-text">Member Since</div>
          </div>
        </div>
      </section>

      <!-- About -->
      <section v-if="landing?.about_text" class="py-16 px-4">
        <div class="max-w-4xl mx-auto">
          <h2 class="text-2xl font-bold text-surface-900 mb-4">About Us</h2>
          <p class="text-surface-600 leading-relaxed whitespace-pre-line">{{ landing.about_text }}</p>
        </div>
      </section>

      <!-- Services -->
      <section v-if="landing?.services?.length" class="py-16 px-4" style="background: var(--color-bg-elevated);">
        <div class="max-w-6xl mx-auto">
          <h2 class="text-2xl font-bold text-surface-900 mb-8 text-center">Our Services</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div v-for="(s, i) in landing.services" :key="i" class="service-card">
              <h3 class="text-lg font-semibold text-surface-900 mb-2">{{ s.title }}</h3>
              <p class="text-sm text-surface-500 leading-relaxed">{{ s.description }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Venues -->
      <section v-if="store.venues?.length" class="py-16 px-4">
        <div class="max-w-6xl mx-auto">
          <h2 class="text-2xl font-bold text-surface-900 mb-8 text-center">Our Venues</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <RouterLink v-for="venue in store.venues" :key="venue.id" :to="`/venues/${venue.id}`" class="venue-card">
              <div class="venue-card-img">
                <img v-if="venue.images?.length" :src="getImageUrl(venue.images[0].path)" :alt="venue.name" />
                <div v-else class="venue-card-placeholder"><span class="text-4xl">🏛️</span></div>
              </div>
              <div class="venue-card-body">
                <h3 class="font-semibold text-surface-900 mb-1">{{ venue.name }}</h3>
                <p class="text-sm text-surface-500 mb-2">{{ venue.city }}</p>
                <div class="flex justify-between items-center">
                  <span class="font-bold" style="color: var(--color-primary)">PKR {{ venue.price_per_head ? Number(venue.price_per_head).toLocaleString() : 'Contact' }}/head</span>
                  <span class="text-xs text-surface-400">{{ venue.capacity_min }}-{{ venue.capacity_max }} guests</span>
                </div>
              </div>
            </RouterLink>
          </div>
        </div>
      </section>

      <!-- Testimonials -->
      <section v-if="landing?.testimonials?.length" class="py-16 px-4" style="background: var(--color-bg-elevated);">
        <div class="max-w-6xl mx-auto">
          <h2 class="text-2xl font-bold text-surface-900 mb-8 text-center">What Customers Say</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div v-for="(t, i) in landing.testimonials" :key="i" class="testimonial-card">
              <div class="flex gap-0.5 text-amber-400 mb-3">
                <span v-for="s in (t.rating || 5)" :key="s">★</span>
              </div>
              <p class="text-surface-600 text-sm leading-relaxed italic mb-4">"{{ t.quote }}"</p>
              <p class="font-semibold text-surface-900 text-sm">— {{ t.name }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- FAQ -->
      <section v-if="landing?.faq?.length" class="py-16 px-4">
        <div class="max-w-4xl mx-auto">
          <h2 class="text-2xl font-bold text-surface-900 mb-8 text-center">Frequently Asked Questions</h2>
          <div class="space-y-3">
            <div v-for="(f, i) in landing.faq" :key="i" class="faq-item">
              <button class="faq-question" @click="toggleFaq(i)">
                <span>{{ f.question }}</span>
                <svg class="w-5 h-5 flex-shrink-0 transition-transform" :class="{ 'rotate-180': openFaqs.has(i) }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>
              <div v-if="openFaqs.has(i)" class="faq-answer">
                {{ f.answer }}
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Social Links -->
      <section v-if="hasSocialLinks" class="py-12 px-4" style="background: var(--color-bg-elevated); border-top: 1px solid var(--color-border);">
        <div class="max-w-4xl mx-auto text-center">
          <h3 class="text-lg font-semibold text-surface-900 mb-4">Connect With Us</h3>
          <div class="flex justify-center gap-4">
            <a v-if="landing?.social_links?.facebook" :href="landing.social_links.facebook" target="_blank" rel="noopener" class="social-link">Facebook</a>
            <a v-if="landing?.social_links?.instagram" :href="landing.social_links.instagram" target="_blank" rel="noopener" class="social-link">Instagram</a>
            <a v-if="landing?.social_links?.twitter" :href="landing.social_links.twitter" target="_blank" rel="noopener" class="social-link">Twitter</a>
            <a v-if="landing?.social_links?.website" :href="landing.social_links.website" target="_blank" rel="noopener" class="social-link">Website</a>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import api from '@/lib/axios'
import { useChat } from '@/composables/useChat'
import { getStorageUrl } from '@/lib/storageUrl'

const route = useRoute()
const { startConversation } = useChat()

const store = ref<any>(null)
const stats = ref<any>(null)
const landing = ref<any>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const openFaqs = ref(new Set<number>())

const heroStyle = computed(() => {
  if (landing.value?.hero_image) {
    return { backgroundImage: `url(${getStorageUrl(landing.value.hero_image)})` }
  }
  return {}
})

const hasSocialLinks = computed(() => {
  const links = landing.value?.social_links
  return links && Object.values(links).some((v: any) => v)
})

function toggleFaq(i: number) {
  if (openFaqs.value.has(i)) {
    openFaqs.value.delete(i)
  } else {
    openFaqs.value.add(i)
  }
}

async function fetchStoreProfile() {
  try {
    loading.value = true
    error.value = null
    const storeId = route.params.id
    const response = await api.get(`/stores/${storeId}/profile`)
    if (response.data.success) {
      store.value = response.data.data.store
      stats.value = response.data.data.stats
      landing.value = store.value.landing_page || null
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load store profile'
  } finally {
    loading.value = false
  }
}

async function startChat() {
  if (store.value?.user?.id) {
    await startConversation(store.value.user.id)
  }
}

function getAvatarUrl(path: string): string {
  if (path.startsWith('http')) return path
  return getStorageUrl(path)
}

function getImageUrl(path: string): string {
  return getStorageUrl(path)
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'ST'
}

onMounted(fetchStoreProfile)
</script>

<style scoped>
.store-profile-page {
  min-height: 100vh;
  background: var(--color-bg);
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
}

/* Hero */
.store-hero {
  position: relative;
  padding: 5rem 1rem;
  background: linear-gradient(135deg, #0a0a14 0%, #141420 35%, #1e1e30 65%, #0f0f1a 100%);
  background-size: cover;
  background-position: center;
}

.store-hero-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
}

.store-hero-content {
  position: relative;
  z-index: 1;
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
}

.store-hero-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  margin: 0 auto 1.5rem;
  border: 4px solid rgba(245, 158, 11, 0.4);
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.store-hero-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.store-hero-initials {
  font-size: 2rem;
  font-weight: 700;
  color: #f59e0b;
}

.store-hero-name {
  font-size: 2.5rem;
  font-weight: 800;
  color: white;
  margin-bottom: 0.5rem;
}

.store-hero-tagline {
  font-size: 1.125rem;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 2rem;
}

.store-hero-actions {
  display: flex;
  justify-content: center;
}

.hero-btn-primary {
  display: inline-flex;
  align-items: center;
  padding: 0.75rem 2rem;
  background: var(--color-primary);
  color: #1a1a00;
  font-weight: 700;
  border-radius: 0.75rem;
  text-decoration: none;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
  transition: all 0.2s;
}

.hero-btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(245, 158, 11, 0.4);
}

/* Stats */
.store-stats-row {
  padding: 2rem 1rem;
  background: var(--color-bg-elevated);
  border-bottom: 1px solid var(--color-border);
}

.stat-item { text-align: center; }
.stat-number { font-size: 1.5rem; font-weight: 800; color: var(--color-primary); }
.stat-text { font-size: 0.8125rem; color: var(--color-text-secondary); font-weight: 500; margin-top: 0.125rem; }

/* Service cards */
.service-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  padding: 1.5rem;
  transition: all 0.2s;
}

.service-card:hover {
  border-color: rgba(245, 158, 11, 0.2);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Venue cards */
.venue-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  overflow: hidden;
  text-decoration: none;
  transition: all 0.3s ease;
}

.venue-card:hover {
  border-color: rgba(245, 158, 11, 0.2);
  box-shadow: 0 8px 30px rgba(245, 158, 11, 0.08);
  transform: translateY(-4px);
}

.venue-card-img {
  aspect-ratio: 16/10;
  background: var(--color-bg-hover);
  overflow: hidden;
}

.venue-card-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.venue-card-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.venue-card-body {
  padding: 1rem 1.25rem 1.25rem;
}

/* Testimonial cards */
.testimonial-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  padding: 1.5rem;
}

/* FAQ */
.faq-item {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  overflow: hidden;
}

.faq-question {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  font-weight: 600;
  font-size: 0.9375rem;
  color: var(--color-text);
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
}

.faq-question:hover {
  background: var(--color-bg-hover);
}

.faq-answer {
  padding: 0 1.25rem 1rem;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  line-height: 1.7;
}

/* Social links */
.social-link {
  padding: 0.5rem 1.25rem;
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
  text-decoration: none;
  transition: all 0.2s;
}

.social-link:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.spinner-lg {
  width: 48px;
  height: 48px;
  border: 4px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .store-hero-name {
    font-size: 1.75rem;
  }
}
</style>
