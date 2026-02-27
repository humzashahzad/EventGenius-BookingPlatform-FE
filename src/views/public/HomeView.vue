<template>
  <div>
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-bg-blobs">
        <div class="hero-blob hero-blob-1"></div>
        <div class="hero-blob hero-blob-2"></div>
        <div class="hero-blob hero-blob-3"></div>
      </div>
      <div class="max-w-5xl mx-auto text-center relative z-10 px-4">
        <div class="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full text-sm text-white/90 font-medium mb-6 border border-white/20">
          <span class="w-2 h-2 rounded-full bg-success-400 animate-pulse"></span>
          Trusted by 10,000+ event planners
        </div>
        <h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6 tracking-tight">
          Find the Perfect Venue<br>
          <span class="text-amber-200">for Every Event</span>
        </h1>
        <p class="text-lg sm:text-xl text-amber-100 mb-10 max-w-2xl mx-auto leading-relaxed">
          Weddings, corporate events, film shoots &amp; more — discover, compare and book venues across Pakistan in minutes.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <RouterLink to="/venues" class="hero-btn-primary">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            Browse Venues
          </RouterLink>
          <RouterLink to="/customer/sign-up" class="hero-btn-outline">
            Register Free
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- Stats / Trust Row -->
    <section class="stats-row">
      <div class="max-w-5xl mx-auto px-4 flex flex-wrap justify-center gap-8 sm:gap-16">
        <div class="stat-item">
          <div class="stat-number">500+</div>
          <div class="stat-text">Venues Listed</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">10,000+</div>
          <div class="stat-text">Bookings Made</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">50+</div>
          <div class="stat-text">Cities Covered</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">4.8</div>
          <div class="stat-text">Avg. Rating</div>
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section class="py-20 px-4">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-14">
          <h2 class="text-3xl sm:text-4xl font-bold text-surface-900 mb-3">How It Works</h2>
          <p class="text-surface-500 max-w-lg mx-auto">Book your dream venue in three simple steps</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="how-card">
            <div class="how-icon">
              <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>
            <div class="how-step">Step 1</div>
            <h3 class="text-xl font-bold text-surface-900 mb-2">Discover</h3>
            <p class="text-surface-500 leading-relaxed">Browse hundreds of venues filtered by city, event type, capacity and price range.</p>
          </div>
          <div class="how-card">
            <div class="how-icon">
              <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
            <div class="how-step">Step 2</div>
            <h3 class="text-xl font-bold text-surface-900 mb-2">Book</h3>
            <p class="text-surface-500 leading-relaxed">Select your date and time, submit your booking request in just a few clicks.</p>
          </div>
          <div class="how-card">
            <div class="how-icon">
              <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
              </svg>
            </div>
            <div class="how-step">Step 3</div>
            <h3 class="text-xl font-bold text-surface-900 mb-2">Celebrate</h3>
            <p class="text-surface-500 leading-relaxed">Get confirmed by the venue owner and enjoy your perfectly planned event.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Featured Venues -->
    <section class="py-20 px-4" style="background: var(--color-bg);">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-14">
          <h2 class="text-3xl sm:text-4xl font-bold text-surface-900 mb-3">Featured Venues</h2>
          <p class="text-surface-500 max-w-lg mx-auto">Top-rated venues handpicked for your next event</p>
        </div>

        <div v-if="loadingVenues" class="flex justify-center py-12">
          <svg class="w-8 h-8 animate-spin" style="color: var(--color-primary)" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        </div>

        <div v-else-if="featuredVenues.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <RouterLink
            v-for="venue in featuredVenues"
            :key="venue.id"
            :to="`/venues/${venue.id}`"
            class="venue-card"
          >
            <div class="venue-card-img">
              <img
                v-if="venue.thumbnail"
                :src="getStorageUrl(venue.thumbnail)"
                :alt="venue.name"
                @error="(e: Event) => (e.target as HTMLImageElement).style.display = 'none'"
              />
              <div v-else class="venue-card-placeholder">
                <span class="text-4xl">🏛️</span>
              </div>
              <div v-if="venue.avg_rating" class="venue-card-rating">
                <span class="text-amber-400">★</span>
                {{ venue.avg_rating.toFixed(1) }}
              </div>
            </div>
            <div class="venue-card-body">
              <h3 class="venue-card-name">{{ venue.name }}</h3>
              <p class="venue-card-location">📍 {{ venue.city }}, {{ venue.country }}</p>
              <div class="venue-card-footer">
                <span class="venue-card-price">PKR {{ formatPrice(venue) }}</span>
                <span class="venue-card-capacity">👥 {{ venue.capacity_min }}-{{ venue.capacity_max }}</span>
              </div>
            </div>
          </RouterLink>
        </div>

        <div class="text-center mt-10">
          <RouterLink to="/venues" class="store-cta-btn">
            View All Venues
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- Testimonials -->
    <section class="py-20 px-4" style="background: var(--color-bg-elevated);">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-14">
          <h2 class="text-3xl sm:text-4xl font-bold text-surface-900 mb-3">What Our Users Say</h2>
          <p class="text-surface-500 max-w-lg mx-auto">Trusted by thousands of event planners and venue owners</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div v-for="t in testimonials" :key="t.name" class="testimonial-card">
            <div class="testimonial-stars">
              <span v-for="i in 5" :key="i" class="text-amber-400">★</span>
            </div>
            <p class="testimonial-quote">"{{ t.quote }}"</p>
            <div class="testimonial-author">
              <div class="testimonial-avatar">{{ t.name.charAt(0) }}</div>
              <div>
                <div class="testimonial-name">{{ t.name }}</div>
                <div class="testimonial-role">{{ t.role }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- For Store Owners CTA -->
    <section class="store-cta-section">
      <div class="max-w-4xl mx-auto text-center px-4">
        <div class="store-cta-card">
          <div class="store-cta-badge">For Venue Owners</div>
          <h2 class="text-3xl font-bold text-surface-900 mb-3">Grow Your Venue Business</h2>
          <p class="text-surface-500 mb-8 max-w-2xl mx-auto leading-relaxed">
            List your venue on EventGenius and reach thousands of event planners across Pakistan. Manage bookings, chat with customers, and grow your business — all in one place.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <RouterLink to="/shop/sign-up" class="store-cta-btn">
              Register as Shop Owner
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            </RouterLink>
            <RouterLink to="/shop/sign-in" class="store-cta-btn-outline">
              Already Registered? Sign In
            </RouterLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import api from '@/lib/axios'
import { getStorageUrl } from '@/lib/storageUrl'

const featuredVenues = ref<any[]>([])
const loadingVenues = ref(false)

const testimonials = [
  {
    name: 'Ayesha Khan',
    role: 'Wedding Planner',
    quote: 'EventGenius made finding the perfect wedding venue so easy. The booking process was smooth and the venue owner was incredibly responsive.',
  },
  {
    name: 'Usman Ali',
    role: 'Corporate Event Manager',
    quote: 'We use EventGenius for all our corporate events now. The multi-day booking feature is a game-changer for conferences.',
  },
  {
    name: 'Fatima Rizvi',
    role: 'Venue Owner',
    quote: 'Since listing on EventGenius, our bookings have increased by 40%. The platform makes managing everything effortless.',
  },
]

function formatPrice(v: any) {
  const price = v.price_per_head
  return price ? Number(price).toLocaleString() : 'Contact'
}

async function fetchFeaturedVenues() {
  loadingVenues.value = true
  try {
    const { data } = await api.get('/venues', { params: { limit: 6, sort: 'rating' } })
    featuredVenues.value = (data.data || data || []).slice(0, 6)
  } catch {
    featuredVenues.value = []
  } finally {
    loadingVenues.value = false
  }
}

onMounted(fetchFeaturedVenues)
</script>

<style scoped>
/* Hero Section */
.hero-section {
  position: relative;
  padding: 6rem 1rem 5rem;
  background: linear-gradient(135deg, #0a0a14 0%, #141420 35%, #1e1e30 65%, #0f0f1a 100%);
  overflow: hidden;
}

.hero-bg-blobs {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.hero-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.25;
}

.hero-blob-1 {
  width: 400px;
  height: 400px;
  background: #f59e0b;
  top: -100px;
  right: -100px;
}

.hero-blob-2 {
  width: 300px;
  height: 300px;
  background: #d97706;
  bottom: -50px;
  left: -50px;
}

.hero-blob-3 {
  width: 200px;
  height: 200px;
  background: #fbbf24;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.hero-btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 2rem;
  background: var(--color-primary);
  color: #1a1a00;
  font-weight: 700;
  font-size: 1rem;
  border-radius: 0.875rem;
  text-decoration: none;
  box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
  transition: all 0.2s;
}

.hero-btn-primary:hover {
  background: #fbbf24;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(245, 158, 11, 0.4);
}

.hero-btn-outline {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 2rem;
  background: transparent;
  color: white;
  font-weight: 600;
  font-size: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.25);
  border-radius: 0.875rem;
  text-decoration: none;
  transition: all 0.2s;
}

.hero-btn-outline:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.5);
}

/* Stats Row */
.stats-row {
  padding: 2.5rem 1rem;
  background: var(--color-bg-elevated);
  border-bottom: 1px solid var(--color-border);
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--color-primary);
  letter-spacing: -0.02em;
}

.stat-text {
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  font-weight: 500;
  margin-top: 0.125rem;
}

/* How It Works Cards */
.how-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  padding: 2rem;
  text-align: center;
  transition: all 0.3s ease;
}

.how-card:hover {
  border-color: rgba(245, 158, 11, 0.2);
  box-shadow: 0 8px 30px rgba(245, 158, 11, 0.08);
  transform: translateY(-4px);
}

.how-icon {
  width: 56px;
  height: 56px;
  border-radius: 1rem;
  background: linear-gradient(135deg, #d97706, #f59e0b);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25);
}

.how-step {
  font-size: 0.6875rem;
  font-weight: 700;
  color: var(--color-primary);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 0.5rem;
}

/* Store Owner CTA */
.store-cta-section {
  padding: 5rem 1rem;
  background: var(--color-bg);
}

.store-cta-card {
  background: linear-gradient(135deg, var(--color-bg-elevated) 0%, var(--color-bg-card) 50%, var(--color-bg-hover) 100%);
  border: 1px solid var(--color-border);
  border-radius: 1.5rem;
  padding: 3rem 2rem;
}

.store-cta-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 2rem;
  background: linear-gradient(135deg, #d97706, #f59e0b);
  color: #1a1a00;
  font-weight: 700;
  font-size: 1rem;
  border-radius: 0.875rem;
  text-decoration: none;
  box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
  transition: all 0.2s;
}

.store-cta-btn:hover {
  opacity: 0.95;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(245, 158, 11, 0.4);
}

.store-cta-badge {
  display: inline-block;
  padding: 0.375rem 1rem;
  border-radius: 2rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-primary);
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.2);
  margin-bottom: 1rem;
}

.store-cta-btn-outline {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 2rem;
  background: transparent;
  color: var(--color-text);
  font-weight: 600;
  font-size: 1rem;
  border: 2px solid var(--color-border);
  border-radius: 0.875rem;
  text-decoration: none;
  transition: all 0.2s;
}

.store-cta-btn-outline:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

/* Featured Venue Cards */
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
  position: relative;
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
  background: var(--color-bg-hover);
}

.venue-card-rating {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  border-radius: 6px;
  color: white;
  font-size: 0.8125rem;
  font-weight: 600;
}

.venue-card-body {
  padding: 1rem 1.25rem 1.25rem;
}

.venue-card-name {
  font-size: 1.0625rem;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 0.25rem;
}

.venue-card-location {
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  margin-bottom: 0.75rem;
}

.venue-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.venue-card-price {
  font-weight: 700;
  color: var(--color-primary);
  font-size: 0.9375rem;
}

.venue-card-capacity {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

/* Testimonials */
.testimonial-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  padding: 2rem;
  transition: all 0.3s ease;
}

.testimonial-card:hover {
  border-color: rgba(245, 158, 11, 0.2);
  box-shadow: 0 8px 30px rgba(245, 158, 11, 0.08);
}

.testimonial-stars {
  display: flex;
  gap: 2px;
  margin-bottom: 1rem;
  font-size: 1rem;
}

.testimonial-quote {
  color: var(--color-text-secondary);
  font-size: 0.9375rem;
  line-height: 1.7;
  margin-bottom: 1.5rem;
  font-style: italic;
}

.testimonial-author {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.testimonial-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #d97706, #f59e0b);
  color: #1a1a00;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}

.testimonial-name {
  font-weight: 600;
  color: var(--color-text);
  font-size: 0.875rem;
}

.testimonial-role {
  color: var(--color-text-muted);
  font-size: 0.75rem;
}
</style>
