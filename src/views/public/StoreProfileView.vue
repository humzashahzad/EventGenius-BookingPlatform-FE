<template>
  <div class="store-profile-page font-['DM_Sans']">
    <!-- Loading -->
    <div v-if="loading" class="loading-container">
      <div class="w-10 h-10 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
      <p class="text-sm text-warm-500 mt-4">Loading store profile...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="error-container">
      <div class="w-16 h-16 rounded-full bg-coral/10 flex items-center justify-center mx-auto mb-4">
        <AppIcon icon="alert-circle" class="w-8 h-8 text-coral" />
      </div>
      <h5 class="font-semibold text-warm-800 dark:text-warm-200 mb-2">Store Not Found</h5>
      <p class="text-warm-500">{{ error }}</p>
      <RouterLink to="/venues" class="inline-flex items-center gap-2 mt-4 px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-soft hover:shadow-elevated">Browse All Venues</RouterLink>
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
            <button @click="startChat" class="store-hero-btn">
              <AppIcon icon="message-circle" class="w-5 h-5" />
              Contact Store
            </button>
          </div>
        </div>
      </section>

      <!-- Stats -->
      <section class="store-stats-row">
        <div class="max-w-7xl mx-auto flex flex-wrap justify-center gap-8 sm:gap-12">
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
      <section v-if="landing?.about_text" class="py-12 px-4">
        <div class="mx-auto max-w-3xl">
          <h4 class="text-xl font-bold text-warm-800 dark:text-warm-100 mb-4">About Us</h4>
          <p class="text-warm-500 leading-relaxed whitespace-pre-line">{{ landing.about_text }}</p>
        </div>
      </section>

      <!-- Services -->
      <section v-if="landing?.services?.length" class="py-12 px-4 bg-warm-50 dark:bg-warm-900/50">
        <div class="mx-auto max-w-6xl">
          <h4 class="text-xl font-bold text-warm-800 dark:text-warm-100 mb-10 text-center">Our Services</h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div v-for="(s, i) in landing.services" :key="i" class="service-card">
              <h5 class="font-semibold text-warm-800 dark:text-warm-100 mb-2">{{ s.title }}</h5>
              <p class="text-sm text-warm-500 mb-0">{{ s.description }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Venues -->
      <section v-if="store.venues?.length" class="py-12 px-4">
        <div class="mx-auto max-w-6xl">
          <h4 class="text-xl font-bold text-warm-800 dark:text-warm-100 mb-10 text-center">Our Venues</h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div v-for="venue in store.venues" :key="venue.id">
              <RouterLink :to="`/venues/${venue.id}`" class="venue-card">
                <div class="venue-card-img">
                  <img v-if="venue.images?.length" :src="getImageUrl(venue.images[0].path)" :alt="venue.name" />
                  <div v-else class="venue-card-placeholder">
                    <AppIcon icon="building" class="w-10 h-10" style="color:var(--color-text-muted);" />
                  </div>
                </div>
                <div class="venue-card-body">
                  <h6 class="font-semibold text-warm-800 dark:text-warm-100 mb-1">{{ venue.name }}</h6>
                  <p class="text-sm text-warm-500 mb-2">{{ venue.city }}</p>
                  <div class="flex justify-between items-center">
                    <span class="font-bold text-primary-500">PKR {{ venue.price_per_head ? Number(venue.price_per_head).toLocaleString() : 'Contact' }}/head</span>
                    <span class="text-sm text-warm-400">{{ venue.capacity_min }}-{{ venue.capacity_max }} guests</span>
                  </div>
                </div>
              </RouterLink>
            </div>
          </div>
        </div>
      </section>

      <!-- Testimonials -->
      <section v-if="landing?.testimonials?.length" class="py-12 px-4 bg-warm-50 dark:bg-warm-900/50">
        <div class="mx-auto max-w-6xl">
          <h4 class="text-xl font-bold text-warm-800 dark:text-warm-100 mb-10 text-center">What Customers Say</h4>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div v-for="(t, i) in landing.testimonials" :key="i" class="testimonial-card">
              <div class="flex gap-1 mb-3 text-accent">
                <span v-for="s in (t.rating || 5)" :key="s">&#9733;</span>
              </div>
              <p class="text-sm text-warm-500 italic mb-4">"{{ t.quote }}"</p>
              <p class="text-sm font-semibold text-warm-700 dark:text-warm-300 mb-0">&mdash; {{ t.name }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- FAQ -->
      <section v-if="landing?.faq?.length" class="py-12 px-4">
        <div class="mx-auto max-w-3xl">
          <h4 class="text-xl font-bold text-warm-800 dark:text-warm-100 mb-10 text-center">Frequently Asked Questions</h4>
          <div class="flex flex-col gap-3">
            <div v-for="(f, i) in landing.faq" :key="i" class="faq-item">
              <button class="faq-question" @click="toggleFaq(i)">
                <span>{{ f.question }}</span>
                <span class="flex-shrink-0 transition-transform duration-200" :class="{ 'rotate-180': openFaqs.has(i) }">
                  <AppIcon icon="chevron-down" class="w-5 h-5" />
                </span>
              </button>
              <div v-if="openFaqs.has(i)" class="faq-answer">
                {{ f.answer }}
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Social Links -->
      <section v-if="hasSocialLinks" class="py-12 px-4 bg-warm-50 dark:bg-warm-900/50 border-t border-warm-200 dark:border-warm-800">
        <div class="mx-auto text-center max-w-3xl">
          <h5 class="font-semibold text-warm-800 dark:text-warm-100 mb-4">Connect With Us</h5>
          <div class="flex justify-center gap-3">
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
import AppIcon from '@/components/ui/AppIcon.vue'

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
  background: linear-gradient(135deg, #064E3B 0%, #065F46 35%, #047857 65%, #064E3B 100%);
  background-size: cover;
  background-position: center;
}

.store-hero-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
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
  border-radius: 9999px;
  overflow: hidden;
  margin: 0 auto 1.5rem;
  border: 4px solid #6EE7B7;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.2s ease;
}

.store-hero-avatar:hover {
  border-color: #34D399;
}

.store-hero-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.store-hero-initials {
  font-size: 2rem;
  font-weight: 700;
  color: #34D399;
}

.store-hero-name {
  font-family: 'DM Sans', sans-serif;
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

.store-hero-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #10B981;
  color: white;
  font-weight: 600;
  font-size: 0.9375rem;
  border: none;
  border-radius: 0.75rem;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
  transition: all 0.2s ease;
}

.store-hero-btn:hover {
  background: #059669;
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.5);
  transform: translateY(-1px);
}

/* Stats */
.store-stats-row {
  padding: 2rem 1rem;
  background: var(--color-bg-card);
  border-bottom: 1px solid var(--color-border-light);
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-family: 'DM Sans', sans-serif;
  font-size: 1.5rem;
  font-weight: 800;
  color: #10B981;
}

.stat-text {
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  font-weight: 500;
  margin-top: 0.125rem;
}

/* Service cards */
.service-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-light);
  border-radius: 1rem;
  padding: 1.5rem;
  transition: all 0.2s ease;
  height: 100%;
}

.service-card:hover {
  border-color: #6EE7B7;
  box-shadow: var(--shadow-card, 0 2px 8px rgba(0,0,0,0.08));
}

/* Venue cards */
.venue-card {
  display: block;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-light);
  border-radius: 1rem;
  overflow: hidden;
  text-decoration: none;
  transition: all 0.25s ease;
  height: 100%;
}

.venue-card:hover {
  border-color: #6EE7B7;
  box-shadow: var(--shadow-elevated, 0 10px 40px rgba(0,0,0,0.1));
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
  transition: transform 0.3s ease;
}

.venue-card:hover .venue-card-img img {
  transform: scale(1.03);
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
  border: 1px solid var(--color-border-light);
  border-radius: 1rem;
  padding: 1.5rem;
  height: 100%;
  transition: box-shadow 0.2s ease;
}

.testimonial-card:hover {
  box-shadow: var(--shadow-soft, 0 2px 6px rgba(0,0,0,0.06));
}

/* FAQ */
.faq-item {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-light);
  border-radius: 0.75rem;
  overflow: hidden;
  transition: border-color 0.15s ease;
}

.faq-item:hover {
  border-color: #6EE7B7;
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
  transition: background 0.15s ease;
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
  border: 1px solid var(--color-border-light);
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
  text-decoration: none;
  transition: all 0.15s ease;
}

.social-link:hover {
  border-color: #10B981;
  color: #10B981;
  background: #ECFDF5;
  box-shadow: var(--shadow-soft, 0 1px 3px rgba(0,0,0,0.06));
}

:root.dark .social-link:hover {
  background: rgba(16, 185, 129, 0.1);
  color: #34D399;
  border-color: #34D399;
}

@media (max-width: 768px) {
  .store-hero-name {
    font-size: 1.75rem;
  }
}

@media (max-width: 640px) {
  .store-hero {
    padding: 2.5rem 1rem;
  }

  .store-hero-avatar {
    width: 72px;
    height: 72px;
    margin-bottom: 1rem;
  }

  .store-hero-initials {
    font-size: 1.5rem;
  }

  .store-hero-name {
    font-size: 1.5rem;
  }

  .store-hero-tagline {
    font-size: 0.9375rem;
    margin-bottom: 1.5rem;
  }

  .store-stats-row {
    padding: 1.5rem 1rem;
  }

  .stat-number {
    font-size: 1.25rem;
  }
}
</style>
