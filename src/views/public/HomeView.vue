<template>
  <div>
    <!-- Hero Section -->
    <section class="hero-section">
      <PixelCanvas variant="glow" />
      <div class="hero-bg">
        <div class="hero-orb hero-orb-1"></div>
        <div class="hero-orb hero-orb-2"></div>
        <div class="hero-orb hero-orb-3"></div>
      </div>
      <div class="relative text-center px-4 mx-auto z-10" style="max-width:72rem;">
        <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-4 hero-trust-badge">
          <span class="trust-dot"></span>
          Trusted by 10,000+ event planners
        </div>
        <h1 class="hero-title">
          Find the Perfect Venue<br>
          <span class="hero-gradient-text">for Every Event</span>
        </h1>
        <p class="hero-subtext mx-auto mb-8" style="max-width:38rem;">
          Weddings, corporate events, film shoots &amp; more — discover, compare and book venues across Pakistan in minutes.
        </p>
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <RouterLink to="/venues" class="hero-btn-primary">
            <AppIcon icon="search" class="w-[1.125rem] h-[1.125rem]" />
            Browse Venues
          </RouterLink>
          <RouterLink to="/customer/sign-up" class="hero-btn-secondary">
            Get Started Free
            <AppIcon icon="arrow-right" class="w-4 h-4" />
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- Stats / Trust Row -->
    <section class="stats-section">
      <div class="flex flex-wrap justify-center gap-3 md:gap-4 mx-auto px-4" style="max-width:72rem;">
        <div class="stat-card">
          <div class="stat-icon-wrap" style="--accent: var(--color-primary);">
            <AppIcon icon="building" class="w-5 h-5" />
          </div>
          <div>
            <div class="stat-number">500+</div>
            <div class="stat-label-text">Venues Listed</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-wrap" style="--accent: var(--color-accent);">
            <AppIcon icon="calendar-check" class="w-5 h-5" />
          </div>
          <div>
            <div class="stat-number">10,000+</div>
            <div class="stat-label-text">Bookings Made</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-wrap" style="--accent: #10B981;">
            <AppIcon icon="map-pin" class="w-5 h-5" />
          </div>
          <div>
            <div class="stat-number">50+</div>
            <div class="stat-label-text">Cities Covered</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-wrap" style="--accent: #F59E0B;">
            <AppIcon icon="star-filled" class="w-5 h-5" />
          </div>
          <div>
            <div class="stat-number">4.8</div>
            <div class="stat-label-text">Avg. Rating</div>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section class="py-16 px-4" style="background: var(--color-bg-elevated);">
      <div class="mx-auto" style="max-width:80rem;">
        <div class="text-center mb-12">
          <span class="section-badge">Simple Process</span>
          <h2 class="section-heading">How It Works</h2>
          <p class="section-subheading mx-auto">Book your dream venue in three simple steps</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          <!-- Connection line -->
          <div class="steps-connector hidden md:block"></div>
          <div>
            <div class="step-card">
              <div class="step-number">1</div>
              <div class="step-icon">
                <AppIcon icon="search" class="w-6 h-6 text-white" />
              </div>
              <h3 class="step-title">Discover</h3>
              <p class="step-desc">Browse hundreds of venues filtered by city, event type, capacity and price range.</p>
            </div>
          </div>
          <div>
            <div class="step-card">
              <div class="step-number">2</div>
              <div class="step-icon step-icon-accent">
                <AppIcon icon="calendar-event" class="w-6 h-6 text-white" />
              </div>
              <h3 class="step-title">Book</h3>
              <p class="step-desc">Select your date and time, submit your booking request in just a few clicks.</p>
            </div>
          </div>
          <div>
            <div class="step-card">
              <div class="step-number">3</div>
              <div class="step-icon step-icon-emerald">
                <AppIcon icon="sparkles" class="w-6 h-6 text-white" />
              </div>
              <h3 class="step-title">Celebrate</h3>
              <p class="step-desc">Get confirmed by the venue owner and enjoy your perfectly planned event.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Featured Venues -->
    <section class="py-16 px-4" style="background: var(--color-bg);">
      <div class="mx-auto" style="max-width:80rem;">
        <div class="text-center mb-12">
          <span class="section-badge">Handpicked</span>
          <h2 class="section-heading">Featured Venues</h2>
          <p class="section-subheading mx-auto">Top-rated venues handpicked for your next event</p>
        </div>

        <div v-if="loadingVenues" class="flex justify-center py-12">
          <div class="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>

        <div v-else-if="featuredVenues.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <RouterLink v-for="venue in featuredVenues" :key="venue.id" :to="`/venues/${venue.id}`" class="featured-venue-card">
            <div class="featured-venue-img">
              <img
                v-if="venue.thumbnail"
                :src="getStorageUrl(venue.thumbnail)"
                :alt="venue.name"
                @error="(e: Event) => (e.target as HTMLImageElement).style.display = 'none'"
              />
              <div v-else class="featured-venue-placeholder">
                <AppIcon icon="building" class="w-10 h-10" style="color: var(--color-text-muted);" />
              </div>
              <div v-if="venue.avg_rating" class="featured-venue-rating">
                <AppIcon icon="star-filled" class="w-3 h-3" style="color: #F59E0B;" />
                {{ venue.avg_rating.toFixed(1) }}
              </div>
              <div class="featured-venue-overlay">
                <span class="featured-venue-view-btn">View Details</span>
              </div>
            </div>
            <div class="featured-venue-body">
              <h3 class="featured-venue-name">{{ venue.name }}</h3>
              <p class="featured-venue-location">
                <AppIcon icon="map-pin" class="w-3 h-3" />
                {{ venue.city }}, {{ venue.country }}
              </p>
              <div class="featured-venue-footer">
                <span class="featured-venue-price">PKR {{ formatPrice(venue) }}</span>
                <span class="featured-venue-capacity">
                  <AppIcon icon="users" class="w-3 h-3" />
                  {{ venue.capacity_min }}-{{ venue.capacity_max }}
                </span>
              </div>
            </div>
          </RouterLink>
        </div>

        <div class="text-center mt-10">
          <RouterLink to="/venues" class="view-all-btn">
            View All Venues
            <AppIcon icon="arrow-right" class="w-4 h-4" />
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- Testimonials -->
    <section class="py-16 px-4" style="background: var(--color-bg-elevated);">
      <div class="mx-auto" style="max-width:80rem;">
        <div class="text-center mb-12">
          <span class="section-badge">Testimonials</span>
          <h2 class="section-heading">What Our Users Say</h2>
          <p class="section-subheading mx-auto">Trusted by thousands of event planners and venue owners</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div v-for="t in testimonials" :key="t.name">
            <div class="testimonial-card">
              <div class="testimonial-quote-mark">"</div>
              <div class="testimonial-stars">
                <AppIcon v-for="i in 5" :key="i" icon="star-filled" class="w-3.5 h-3.5" style="color: #F59E0B;" />
              </div>
              <p class="testimonial-text">"{{ t.quote }}"</p>
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
      </div>
    </section>

    <!-- For Store Owners CTA -->
    <section class="cta-section">
      <div class="cta-pattern"></div>
      <div class="mx-auto text-center px-4 relative z-10" style="max-width:56rem;">
        <span class="cta-badge">For Venue Owners</span>
        <h2 class="cta-heading">Grow Your Venue Business</h2>
        <p class="cta-subtext mx-auto" style="max-width:40rem;">
          List your venue on EventGenius and reach thousands of event planners across Pakistan. Manage bookings, chat with customers, and grow your business — all in one place.
        </p>
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <RouterLink to="/shop/sign-up" class="cta-btn-primary">
            Register as Shop Owner
            <AppIcon icon="arrow-right" class="w-4 h-4" />
          </RouterLink>
          <RouterLink to="/shop/sign-in" class="cta-btn-secondary">
            Already Registered? Sign In
          </RouterLink>
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
import AppIcon from '@/components/ui/AppIcon.vue'
import PixelCanvas from '@/components/ui/PixelCanvas.vue'

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
/* ─── Hero ─────────────────────────────────────────────────────────────────── */
.hero-section {
  position: relative;
  padding: 7rem 1rem 6rem;
  background: linear-gradient(145deg, #064E3B 0%, #065F46 35%, #047857 65%, #064E3B 100%);
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.hero-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(circle at 50% 50%, black 30%, transparent 80%);
}

.hero-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
}

.hero-orb-1 {
  width: 500px; height: 500px;
  background: rgba(16, 185, 129, 0.3);
  top: -150px; right: -100px;
  animation: orbFloat 16s ease-in-out infinite alternate;
}

.hero-orb-2 {
  width: 400px; height: 400px;
  background: rgba(245, 158, 11, 0.15);
  bottom: -100px; left: -80px;
  animation: orbFloat 20s ease-in-out infinite alternate-reverse;
}

.hero-orb-3 {
  width: 250px; height: 250px;
  background: rgba(110, 231, 183, 0.2);
  top: 40%; left: 45%;
  animation: orbPulse 10s ease-in-out infinite;
}

.hero-trust-badge {
  color: rgba(255,255,255,0.85);
  border: 1px solid rgba(110, 231, 183, 0.3);
  background: rgba(16, 185, 129, 0.15);
  backdrop-filter: blur(20px);
  font-size: 0.8125rem;
}

.trust-dot {
  display: inline-block;
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #34D399;
  animation: pulse 2s infinite;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 900;
  color: white;
  line-height: 1.1;
  letter-spacing: -0.03em;
  margin-bottom: 1.25rem;
}

.hero-gradient-text {
  background: linear-gradient(135deg, #34D399, #F59E0B, #38BDF8);
  background-size: 200% 200%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: gradientShift 6s ease infinite;
}

.hero-subtext {
  color: rgba(255,255,255,0.65);
  font-size: 1.125rem;
  line-height: 1.7;
}

.hero-btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
  color: white;
  font-weight: 700;
  font-size: 1rem;
  border-radius: var(--radius-xl);
  text-decoration: none;
  box-shadow: 0 8px 30px rgba(16, 185, 129, 0.35);
  transition: all 0.25s ease;
}

.hero-btn-primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 40px rgba(16, 185, 129, 0.45);
  color: white;
}

.hero-btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  background: rgba(255,255,255,0.08);
  color: white;
  font-weight: 600;
  font-size: 1rem;
  border: 1px solid rgba(255,255,255,0.15);
  backdrop-filter: blur(12px);
  border-radius: var(--radius-xl);
  text-decoration: none;
  transition: all 0.25s ease;
}

.hero-btn-secondary:hover {
  background: rgba(255,255,255,0.14);
  border-color: rgba(255,255,255,0.3);
  transform: translateY(-2px);
  color: white;
}

/* ─── Stats ────────────────────────────────────────────────────────────────── */
.stats-section {
  padding: 0 1rem;
  margin-top: -2rem;
  position: relative;
  z-index: 20;
  margin-bottom: 2rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 1.25rem 1.5rem;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  min-width: 140px;
  transition: all 0.25s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-xl);
}

.stat-icon-wrap {
  width: 44px; height: 44px;
  border-radius: var(--radius-lg);
  display: flex; align-items: center; justify-content: center;
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  color: var(--accent);
  flex-shrink: 0;
}

.stat-number {
  font-size: 1.375rem;
  font-weight: 800;
  color: var(--color-text);
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.stat-label-text {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  font-weight: 500;
}

/* ─── Section Headers ──────────────────────────────────────────────────────── */
.section-badge {
  display: inline-block;
  padding: 0.375rem 1rem;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-primary);
  background: var(--color-primary-100);
  border: 1px solid var(--color-primary-200);
  margin-bottom: 0.75rem;
}

.section-heading {
  font-size: 2rem;
  font-weight: 800;
  color: var(--color-text);
  letter-spacing: -0.02em;
  margin-bottom: 0.5rem;
}

.section-subheading {
  color: var(--color-text-secondary);
  font-size: 1rem;
  max-width: 30rem;
}

/* ─── Steps ────────────────────────────────────────────────────────────────── */
.steps-connector {
  position: absolute;
  top: 80px;
  left: calc(16.67% + 24px);
  right: calc(16.67% + 24px);
  height: 2px;
  background: linear-gradient(90deg, var(--color-primary), var(--color-accent), #10B981);
  border-radius: var(--radius-full);
  z-index: 0;
  opacity: 0.3;
}

.step-card {
  text-align: center;
  padding: 2rem 1.5rem;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-2xl);
  position: relative;
  z-index: 1;
  transition: all 0.3s ease;
  height: 100%;
}

.step-card:hover {
  border-color: var(--color-primary-200);
  box-shadow: var(--shadow-lg);
  transform: translateY(-6px);
}

.step-number {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  width: 28px; height: 28px;
  border-radius: var(--radius-full);
  background: var(--color-bg-card);
  border: 2px solid var(--color-primary-200);
  color: var(--color-primary);
  font-size: 0.75rem;
  font-weight: 800;
  display: flex; align-items: center; justify-content: center;
}

.step-icon {
  width: 64px; height: 64px;
  border-radius: var(--radius-xl);
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
  display: flex; align-items: center; justify-content: center;
  margin: 0.5rem auto 1.25rem;
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.25);
}

.step-icon-accent {
  background: linear-gradient(135deg, var(--color-accent), var(--color-accent-light));
  box-shadow: 0 8px 24px rgba(245, 158, 11, 0.25);
}

.step-icon-emerald {
  background: linear-gradient(135deg, #10B981, #6EE7B7);
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.25);
}

.step-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 0.5rem;
}

.step-desc {
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  line-height: 1.6;
  margin-bottom: 0;
}

/* ─── Featured Venue Cards ─────────────────────────────────────────────────── */
.featured-venue-card {
  display: flex;
  flex-direction: column;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-2xl);
  overflow: hidden;
  text-decoration: none;
  transition: all 0.35s ease;
  height: 100%;
  box-shadow: var(--shadow-sm);
}

.featured-venue-card:hover {
  border-color: var(--color-primary-200);
  box-shadow: var(--shadow-xl);
  transform: translateY(-6px);
}

.featured-venue-img {
  position: relative;
  aspect-ratio: 16/10;
  background: var(--color-bg-hover);
  overflow: hidden;
}

.featured-venue-img img {
  width: 100%; height: 100%;
  object-fit: cover;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.featured-venue-card:hover .featured-venue-img img {
  transform: scale(1.08);
}

.featured-venue-placeholder {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  background: var(--color-bg-hover);
}

.featured-venue-rating {
  position: absolute;
  top: 12px; right: 12px;
  display: flex; align-items: center; gap: 4px;
  padding: 5px 10px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  border-radius: var(--radius-sm);
  color: white;
  font-size: 0.8125rem;
  font-weight: 700;
}

.featured-venue-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.6) 100%);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 1.5rem;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.featured-venue-card:hover .featured-venue-overlay {
  opacity: 1;
}

.featured-venue-view-btn {
  padding: 0.5rem 1.25rem;
  background: rgba(255,255,255,0.95);
  color: var(--color-text);
  border-radius: var(--radius-full);
  font-size: 0.8125rem;
  font-weight: 600;
  transform: translateY(10px);
  transition: transform 0.3s ease;
}

.featured-venue-card:hover .featured-venue-view-btn {
  transform: translateY(0);
}

.featured-venue-body {
  padding: 1.125rem 1.375rem 1.375rem;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.featured-venue-name {
  font-size: 1.0625rem;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 0.25rem;
  letter-spacing: -0.01em;
}

.featured-venue-location {
  display: flex; align-items: center; gap: 0.375rem;
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  margin-bottom: 0.875rem;
}

.featured-venue-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
}

.featured-venue-price {
  font-weight: 800;
  color: var(--color-primary);
  font-size: 1rem;
  letter-spacing: -0.02em;
}

.featured-venue-capacity {
  display: flex; align-items: center; gap: 0.25rem;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

.view-all-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 2rem;
  background: var(--color-bg-card);
  color: var(--color-primary);
  font-weight: 700;
  font-size: 1rem;
  border: 2px solid var(--color-primary-200);
  border-radius: var(--radius-xl);
  text-decoration: none;
  transition: all 0.25s ease;
}

.view-all-btn:hover {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
  transform: translateY(-2px);
}

/* ─── Testimonials ─────────────────────────────────────────────────────────── */
.testimonial-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-2xl);
  padding: 2rem;
  transition: all 0.3s ease;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.testimonial-card:hover {
  border-color: var(--color-primary-200);
  box-shadow: var(--shadow-lg);
  transform: translateY(-4px);
}

.testimonial-quote-mark {
  position: absolute;
  top: -10px; left: 16px;
  font-size: 5rem;
  font-weight: 900;
  color: var(--color-primary-100);
  line-height: 1;
  pointer-events: none;
  font-family: Georgia, serif;
}

.testimonial-stars {
  display: flex;
  gap: 2px;
  margin-bottom: 1rem;
  position: relative;
  z-index: 1;
}

.testimonial-text {
  color: var(--color-text-secondary);
  font-size: 0.9375rem;
  line-height: 1.7;
  margin-bottom: 1.5rem;
  position: relative;
  z-index: 1;
}

.testimonial-author {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  position: relative;
  z-index: 1;
}

.testimonial-avatar {
  width: 44px; height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
  color: white;
  font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.125rem;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
}

.testimonial-name {
  font-weight: 700;
  color: var(--color-text);
  font-size: 0.9375rem;
}

.testimonial-role {
  color: var(--color-text-muted);
  font-size: 0.75rem;
  font-weight: 500;
}

/* ─── CTA Section ──────────────────────────────────────────────────────────── */
.cta-section {
  position: relative;
  padding: 5rem 1rem;
  background: linear-gradient(145deg, #064E3B, #065F46, #047857);
  overflow: hidden;
}

.cta-pattern {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0);
  background-size: 32px 32px;
}

.cta-badge {
  display: inline-block;
  padding: 0.375rem 1rem;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #FCD34D;
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.25);
  margin-bottom: 1.25rem;
}

.cta-heading {
  font-size: 2.25rem;
  font-weight: 800;
  color: white;
  letter-spacing: -0.02em;
  margin-bottom: 0.75rem;
}

.cta-subtext {
  color: rgba(255,255,255,0.6);
  font-size: 1rem;
  line-height: 1.7;
  margin-bottom: 2.5rem;
}

.cta-btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, var(--color-accent), var(--color-accent-light));
  color: white;
  font-weight: 700;
  font-size: 1rem;
  border-radius: var(--radius-xl);
  text-decoration: none;
  box-shadow: 0 8px 30px rgba(245, 158, 11, 0.35);
  transition: all 0.25s ease;
}

.cta-btn-primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 40px rgba(245, 158, 11, 0.45);
  color: white;
}

.cta-btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  background: rgba(255,255,255,0.08);
  color: white;
  font-weight: 600;
  font-size: 1rem;
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: var(--radius-xl);
  text-decoration: none;
  transition: all 0.25s ease;
}

.cta-btn-secondary:hover {
  background: rgba(255,255,255,0.14);
  border-color: rgba(255,255,255,0.3);
  color: white;
}

/* ─── Animations ───────────────────────────────────────────────────────────── */
@keyframes orbFloat {
  0%   { transform: translate3d(0, 0, 0) scale(1); }
  100% { transform: translate3d(0, 25px, 0) scale(1.08); }
}

@keyframes orbPulse {
  0%, 100% { opacity: 0.15; transform: translate(-50%, -50%) scale(1); }
  50%      { opacity: 0.3;  transform: translate(-50%, -50%) scale(1.15); }
}

/* ─── Responsive ───────────────────────────────────────────────────────────── */
@media (max-width: 640px) {
  .hero-title {
    font-size: 1.75rem;
  }

  .hero-section {
    padding: 4rem 1rem 3rem;
  }

  .hero-subtext {
    font-size: 1rem;
  }

  .section-heading {
    font-size: 1.5rem;
  }

  .cta-heading {
    font-size: 1.5rem;
  }

  .cta-section {
    padding: 3rem 1rem;
  }

  .stat-card {
    min-width: 130px;
    padding: 1rem 1.125rem;
  }
}

@media (min-width: 641px) and (max-width: 1023px) {
  .hero-title {
    font-size: 2.5rem;
  }

  .hero-section {
    padding: 5rem 1rem 4rem;
  }

  .section-heading {
    font-size: 1.75rem;
  }

  .cta-heading {
    font-size: 1.875rem;
  }

  .stat-card {
    min-width: 150px;
    padding: 1rem 1.25rem;
  }
}
</style>
