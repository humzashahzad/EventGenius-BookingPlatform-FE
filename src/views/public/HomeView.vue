<template>
  <div>
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="relative text-center px-4 mx-auto z-10" style="max-width:72rem;">
        <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-4 hero-trust-badge">
          <span class="trust-dot"></span>
          Venue booking made simple across Pakistan
        </div>
        <h1 class="hero-title">
          Find the Perfect Venue<br>
          <span class="hero-accent-text">for Every Event</span>
        </h1>
        <p class="hero-subtext mx-auto mb-8" style="max-width:38rem;">
          Weddings, corporate events, film shoots &amp; more — discover, compare and book venues across Pakistan in minutes.
        </p>
        <div class="hero-search mx-auto mb-6">
          <SmartSearchBox
            v-model="heroQuery"
            variant="hero"
            aria-label="Search venues"
            @submit="heroSearch"
            @select="heroSelect"
          />
        </div>
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
        <div v-for="st in stats" :key="st.label" class="stat-card">
          <div class="stat-icon-wrap" :style="{ '--accent': st.color }">
            <AppIcon :icon="st.icon" class="w-5 h-5" />
          </div>
          <div>
            <div class="stat-number">{{ st.value }}</div>
            <div class="stat-label-text">{{ st.label }}</div>
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

    <!-- Why EventGenius -->
    <section class="py-16 px-4" style="background: var(--color-bg-elevated);">
      <div class="mx-auto" style="max-width:80rem;">
        <div class="text-center mb-12">
          <span class="section-badge">Why EventGenius</span>
          <h2 class="section-heading">Everything you need to book with confidence</h2>
          <p class="section-subheading mx-auto">Built for customers planning an event and for the venues hosting them</p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div v-for="f in features" :key="f.title" class="testimonial-card">
            <div class="w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center mb-4">
              <AppIcon :icon="f.icon" class="w-5 h-5" />
            </div>
            <h3 class="font-semibold text-warm-900 dark:text-white mb-1.5">{{ f.title }}</h3>
            <p class="text-sm text-warm-500 dark:text-warm-400 leading-relaxed">{{ f.text }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- For Store Owners CTA -->
    <section class="cta-section">
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
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import api from '@/lib/axios'
import { getStorageUrl } from '@/lib/storageUrl'
import AppIcon from '@/components/ui/AppIcon.vue'
import SmartSearchBox from '@/components/search/SmartSearchBox.vue'
import type { Suggestion } from '@/components/search/types'

// ─── Hero smart search → /venues?q=… ─────────────────────────────────────────
const router = useRouter()
const heroQuery = ref('')

function heroSearch(q: string) {
  router.push(q ? { path: '/venues', query: { q } } : { path: '/venues' })
}

function heroSelect(s: Suggestion) {
  if (s.type === 'city') router.push({ path: '/venues', query: { city: s.city || s.value } })
  else if (s.type === 'category') router.push({ path: '/venues', query: { event_type: s.value } })
  else heroSearch(s.value)
}

const featuredVenues = ref<any[]>([])
const loadingVenues = ref(false)

const totalVenues = ref<number | null>(null)
const totalCategories = ref<number | null>(null)

// Real numbers only — no invented marketing figures.
const stats = computed(() => [
  { icon: 'building', label: 'Venues listed', value: totalVenues.value ?? '—', color: 'var(--color-primary)' },
  { icon: 'tags', label: 'Event types', value: totalCategories.value ?? '—', color: 'var(--color-accent)' },
  { icon: 'credit-card', label: 'Secure payments', value: 'PayFast', color: '#10B981' },
  { icon: 'message', label: 'Chat with owners', value: 'Live', color: '#F59E0B' },
])

const features = [
  { icon: 'calendar-check', title: 'Real-time availability', text: 'See booked slots on the calendar and pick a time that is actually free — no double bookings.' },
  { icon: 'shield', title: 'Verified venues', text: 'Every shop is reviewed and approved by our team before its venues appear here.' },
  { icon: 'credit-card', title: 'Secure checkout', text: 'Pay online through PayFast once the venue confirms your request.' },
  { icon: 'star', title: 'Genuine reviews', text: 'Only customers who held an event at a venue can review it.' },
]

function formatPrice(v: any) {
  const price = v.price_per_head
  return price ? Number(price).toLocaleString() : 'Contact'
}

async function fetchFeaturedVenues() {
  loadingVenues.value = true
  try {
    // Prefer featured venues; fall back to the best-rated / newest ones.
    const featured = await api.get('/venues', { params: { featured: 1, per_page: 6 } })
    let list: any[] = featured.data?.data?.data ?? []
    if (list.length < 3) {
      const latest = await api.get('/venues', { params: { per_page: 6, sort_by: 'avg_rating', sort_dir: 'desc' } })
      const extra: any[] = latest.data?.data?.data ?? []
      list = [...list, ...extra.filter(v => !list.some(l => l.id === v.id))].slice(0, 6)
      totalVenues.value = latest.data?.data?.total ?? null
    } else {
      totalVenues.value = featured.data?.data?.total ?? null
    }
    featuredVenues.value = list
    api.get('/categories').then(r => { totalCategories.value = (r.data?.data ?? []).length }).catch(() => {})
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
.hero-search {
  max-width: 40rem;
  position: relative;
  z-index: 2;
}

.hero-section {
  position: relative;
  padding: 7rem 1rem 6rem;
  background: #064E3B;
  overflow: hidden;
}




.hero-trust-badge {
  color: rgba(255,255,255,0.85);
  border: 1px solid rgba(110, 231, 183, 0.3);
  background: rgba(16, 185, 129, 0.15);
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

.hero-accent-text {
  color: #6EE7B7;
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
  background: #10B981;
  color: #052E22;
  font-weight: 700;
  font-size: 1rem;
  border-radius: var(--radius-xl);
  text-decoration: none;
  box-shadow: var(--shadow-sm);
  transition: all 0.25s ease;
}

.hero-btn-primary:hover {
  transform: translateY(-3px);
  background: #34D399;
  box-shadow: var(--shadow-md);
  color: #052E22;
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
  background: var(--line);
  border-radius: var(--radius-full);
  z-index: 0;
  opacity: 1;
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
  background: #047857;
  display: flex; align-items: center; justify-content: center;
  margin: 0.5rem auto 1.25rem;
  box-shadow: var(--shadow-sm);
}

.step-icon-accent {
  background: #B45309;
  box-shadow: var(--shadow-sm);
}

.step-icon-emerald {
  background: #0369A1;
  box-shadow: var(--shadow-sm);
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
  border-radius: var(--radius-sm);
  color: white;
  font-size: 0.8125rem;
  font-weight: 700;
}

.featured-venue-overlay {
  position: absolute;
  inset: 0;
  background: rgba(28, 25, 23, 0.45);
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
  background: var(--brand-strong);
  color: white;
  border-color: var(--brand-strong);
  box-shadow: var(--shadow-sm);
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
  background: var(--brand-soft);
  color: var(--brand-text);
  font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.125rem;
  border: 1px solid var(--line);
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
  background: #064E3B;
  overflow: hidden;
}


.cta-badge {
  display: inline-block;
  padding: 0.375rem 1rem;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #A7F3D0;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.16);
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
  background: #FFFFFF;
  color: #064E3B;
  font-weight: 700;
  font-size: 1rem;
  border-radius: var(--radius-xl);
  text-decoration: none;
  box-shadow: var(--shadow-sm);
  transition: all 0.25s ease;
}

.cta-btn-primary:hover {
  transform: translateY(-3px);
  background: #ECFDF5;
  box-shadow: var(--shadow-md);
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
