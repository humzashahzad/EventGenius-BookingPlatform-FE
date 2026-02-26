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
          <span class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
          Trusted by 10,000+ event planners
        </div>
        <h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6 tracking-tight">
          Find the Perfect Venue<br>
          <span class="text-purple-200">for Every Event</span>
        </h1>
        <p class="text-lg sm:text-xl text-purple-100 mb-10 max-w-2xl mx-auto leading-relaxed">
          Weddings, corporate events, film shoots &amp; more — discover, compare and book venues across Pakistan in minutes.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <RouterLink to="/venues" class="hero-btn-primary">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            Browse Venues
          </RouterLink>
          <RouterLink to="/client/sign-up" class="hero-btn-outline">
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

    <!-- For Store Owners CTA -->
    <section class="store-cta-section">
      <div class="max-w-4xl mx-auto text-center px-4">
        <div class="store-cta-card">
          <h2 class="text-3xl font-bold text-surface-900 mb-3">Own a Venue? List It Here</h2>
          <p class="text-surface-500 mb-8 max-w-2xl mx-auto leading-relaxed">
            Register your store, add your venues, and start receiving bookings from clients across Pakistan. Free to get started.
          </p>
          <RouterLink to="/store/sign-up" class="store-cta-btn">
            Register as Store Owner
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </RouterLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<style scoped>
/* Hero Section */
.hero-section {
  position: relative;
  padding: 6rem 1rem 5rem;
  background: linear-gradient(135deg, #4c1d95 0%, #6d28d9 35%, #7c3aed 65%, #a855f7 100%);
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
  opacity: 0.3;
}

.hero-blob-1 {
  width: 400px;
  height: 400px;
  background: #c084fc;
  top: -100px;
  right: -100px;
}

.hero-blob-2 {
  width: 300px;
  height: 300px;
  background: #e879f9;
  bottom: -50px;
  left: -50px;
}

.hero-blob-3 {
  width: 200px;
  height: 200px;
  background: #818cf8;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.hero-btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 2rem;
  background: white;
  color: #6d28d9;
  font-weight: 700;
  font-size: 1rem;
  border-radius: 0.875rem;
  text-decoration: none;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  transition: all 0.2s;
}

.hero-btn-primary:hover {
  background: #f5f3ff;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
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
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-radius: 0.875rem;
  text-decoration: none;
  transition: all 0.2s;
}

.hero-btn-outline:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: white;
}

/* Stats Row */
.stats-row {
  padding: 2.5rem 1rem;
  background: white;
  border-bottom: 1px solid #f1f5f9;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 1.75rem;
  font-weight: 800;
  color: #6d28d9;
  letter-spacing: -0.02em;
}

.stat-text {
  font-size: 0.8125rem;
  color: #64748b;
  font-weight: 500;
  margin-top: 0.125rem;
}

/* How It Works Cards */
.how-card {
  background: white;
  border: 1px solid #f1f5f9;
  border-radius: 1rem;
  padding: 2rem;
  text-align: center;
  transition: all 0.3s ease;
}

.how-card:hover {
  border-color: #ede9fe;
  box-shadow: 0 8px 30px rgba(124, 58, 237, 0.08);
  transform: translateY(-4px);
}

.how-icon {
  width: 56px;
  height: 56px;
  border-radius: 1rem;
  background: linear-gradient(135deg, #7c3aed, #a855f7);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.25);
}

.how-step {
  font-size: 0.6875rem;
  font-weight: 700;
  color: #7c3aed;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 0.5rem;
}

/* Store Owner CTA */
.store-cta-section {
  padding: 5rem 1rem;
  background: #faf5ff;
}

.store-cta-card {
  background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #e9d5ff 100%);
  border: 1px solid #ddd6fe;
  border-radius: 1.5rem;
  padding: 3rem 2rem;
}

.store-cta-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 2rem;
  background: linear-gradient(135deg, #6d28d9, #7c3aed);
  color: white;
  font-weight: 700;
  font-size: 1rem;
  border-radius: 0.875rem;
  text-decoration: none;
  box-shadow: 0 4px 15px rgba(124, 58, 237, 0.3);
  transition: all 0.2s;
}

.store-cta-btn:hover {
  opacity: 0.95;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(124, 58, 237, 0.4);
}
</style>
