<template>
  <div class="home">
    <!-- Hero: headline + search on the left, real venue photos on the right -->
    <section class="hero">
      <div class="hero-inner">
        <div class="hero-copy">
          <p class="overline">
            <span class="overline-dot"></span>
            {{ totalVenues ? `${totalVenues} venues in ${cities.length} cities` : 'Venue booking across Pakistan' }}
          </p>
          <h1 class="hero-title">Book the hall.<br />Keep the date.</h1>
          <p class="hero-lede">
            Compare wedding halls, marquees and conference venues across Pakistan, see which dates are free,
            and pay securely once the venue confirms.
          </p>

          <form class="hero-search" role="search" @submit.prevent="search">
            <label class="search-field">
              <AppIcon icon="sparkles" class="w-[18px] h-[18px] search-icon" />
              <span class="sr-only">Event type</span>
              <select v-model="form.event_type">
                <option value="">Any event</option>
                <option v-for="c in eventTypes" :key="c.slug" :value="c.slug">{{ c.name }}</option>
              </select>
            </label>
            <label class="search-field">
              <AppIcon icon="map-pin" class="w-[18px] h-[18px] search-icon" />
              <span class="sr-only">City</span>
              <select v-model="form.city">
                <option value="">Any city</option>
                <option v-for="c in cities" :key="c.name" :value="c.name">{{ c.name }}</option>
              </select>
            </label>
            <button type="submit" class="btn-primary search-btn">
              <AppIcon icon="search" class="w-[18px] h-[18px]" />
              Search venues
            </button>
          </form>

          <div v-if="eventTypes.length" class="chips" aria-label="Popular event types">
            <RouterLink
              v-for="c in eventTypes.slice(0, 5)"
              :key="c.slug"
              :to="{ path: '/venues', query: { event_type: c.slug } }"
              class="chip"
            >{{ c.name }}</RouterLink>
          </div>
        </div>

        <div class="hero-collage" aria-hidden="true">
          <div
            v-for="(v, i) in collage"
            :key="v?.id ?? i"
            class="collage-tile"
            :class="`tile-${i}`"
          >
            <img v-if="v?.thumbnail" :src="getStorageUrl(v.thumbnail)" alt="" />
            <span v-if="v && i === 0" class="collage-caption">
              <strong>{{ v.name }}</strong>
              {{ v.city }} · from PKR {{ Number(v.price_per_head).toLocaleString() }} per head
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- Featured venues -->
    <section class="section">
      <div class="section-inner">
        <div class="section-head">
          <div>
            <h2 class="section-title">Featured venues</h2>
            <p class="section-sub">Top-rated halls and spaces our venue partners are proud of.</p>
          </div>
          <RouterLink to="/venues" class="btn-secondary btn-sm">
            View all venues
            <AppIcon icon="arrow-right" class="w-4 h-4" />
          </RouterLink>
        </div>

        <div v-if="loading" class="venue-grid">
          <div v-for="n in 6" :key="n" class="card overflow-hidden" aria-busy="true">
            <div class="skeleton" style="aspect-ratio: 3 / 2; border-radius: 0"></div>
            <div class="p-5 flex flex-col gap-2">
              <div class="skeleton h-5 w-2/3"></div>
              <div class="skeleton h-4 w-1/2"></div>
            </div>
          </div>
        </div>
        <div v-else-if="featured.length" class="venue-grid">
          <VenueCard v-for="v in featured" :key="v.id" :venue="v" />
        </div>
        <div v-else class="card empty-state">
          <div class="empty-state-icon"><AppIcon icon="building" class="w-6 h-6" /></div>
          <p class="empty-state-title">No venues listed yet</p>
          <p class="empty-state-desc">Venues appear here as soon as a venue owner's store is approved.</p>
        </div>
      </div>
    </section>

    <!-- Browse by city -->
    <section v-if="cities.length" class="section section-sunken">
      <div class="section-inner">
        <div class="section-head">
          <div>
            <h2 class="section-title">Browse by city</h2>
            <p class="section-sub">Find a venue close to your guests.</p>
          </div>
        </div>
        <div class="city-grid">
          <RouterLink
            v-for="c in cities"
            :key="c.name"
            :to="{ path: '/venues', query: { city: c.name } }"
            class="city-card"
          >
            <img v-if="c.thumbnail" :src="getStorageUrl(c.thumbnail)" alt="" />
            <span class="city-label">
              <strong>{{ c.name }}</strong>
              {{ c.count }} {{ c.count === 1 ? 'venue' : 'venues' }}
            </span>
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- How it works -->
    <section class="section">
      <div class="section-inner">
        <div class="section-head">
          <div>
            <h2 class="section-title">How booking works</h2>
            <p class="section-sub">You only pay once the venue has said yes.</p>
          </div>
        </div>
        <ol class="steps">
          <li v-for="(s, i) in steps" :key="s.title" class="step">
            <span class="step-n">{{ i + 1 }}</span>
            <div>
              <h3 class="step-title">{{ s.title }}</h3>
              <p class="step-text">{{ s.text }}</p>
            </div>
          </li>
        </ol>
      </div>
    </section>

    <!-- Why EventGenius -->
    <section class="section section-sunken">
      <div class="section-inner">
        <div class="section-head">
          <div>
            <h2 class="section-title">Book with confidence</h2>
            <p class="section-sub">Built for families planning an event and for the venues hosting them.</p>
          </div>
        </div>
        <div class="feature-grid">
          <div v-for="f in features" :key="f.title" class="feature">
            <span class="feature-icon"><AppIcon :icon="f.icon" class="w-5 h-5" /></span>
            <h3 class="feature-title">{{ f.title }}</h3>
            <p class="feature-text">{{ f.text }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Venue owners -->
    <section class="section">
      <div class="section-inner">
        <div class="owner-band">
          <div class="owner-copy">
            <p class="overline overline-light">For venue owners</p>
            <h2 class="owner-title">Fill your calendar, not your inbox.</h2>
            <p class="owner-text">
              List your halls, take booking requests, get paid through PayFast and reply to guests,
              all from one dashboard.
            </p>
          </div>
          <div class="owner-actions">
            <RouterLink to="/shop/sign-up" class="owner-btn">
              List your venue
              <AppIcon icon="arrow-right" class="w-4 h-4" />
            </RouterLink>
            <RouterLink to="/shop/sign-in" class="owner-link">Already listed? Sign in</RouterLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import api from '@/lib/axios'
import { getStorageUrl } from '@/lib/storageUrl'
import AppIcon from '@/components/ui/AppIcon.vue'
import VenueCard from '@/components/venue/VenueCard.vue'

const router = useRouter()
const loading = ref(true)
const venues = ref<any[]>([])
const totalVenues = ref<number | null>(null)
const categories = ref<any[]>([])
const form = reactive({ event_type: '', city: '' })

const featured = computed(() => {
  const sorted = [...venues.value].sort(
    (a, b) => Number(b.is_featured) - Number(a.is_featured) || Number(b.avg_rating) - Number(a.avg_rating),
  )
  return sorted.slice(0, 6)
})

const collage = computed(() => {
  const withPhotos = featured.value.filter(v => v.thumbnail)
  return [withPhotos[0] ?? null, withPhotos[1] ?? null, withPhotos[2] ?? null]
})

// Cities with how many venues each has, busiest first.
const cities = computed(() => {
  const map = new Map<string, { name: string; count: number; thumbnail: string | null }>()
  for (const v of venues.value) {
    if (!v.city) continue
    const c = map.get(v.city) ?? { name: v.city, count: 0, thumbnail: null }
    c.count++
    if (!c.thumbnail && v.thumbnail) c.thumbnail = v.thumbnail
    map.set(v.city, c)
  }
  return [...map.values()].sort((a, b) => b.count - a.count)
})

// Only event types that some venue actually hosts.
const eventTypes = computed(() => {
  const offered = new Set<string>(venues.value.flatMap(v => v.event_types ?? []))
  return categories.value.filter(c => c.is_active && offered.has(c.slug))
})

const steps = [
  { title: 'Find a venue', text: 'Filter by city, event type and guest count, and compare real photos, prices and reviews.' },
  { title: 'Request your date', text: 'Pick a free date on the venue calendar and send your request with guest numbers and needs.' },
  { title: 'Pay after confirmation', text: 'When the venue confirms, pay securely through PayFast and get your receipt instantly.' },
]

const features = [
  { icon: 'calendar-check', title: 'Live availability', text: 'Booked dates are blocked on the calendar, so a confirmed date is never double-booked.' },
  { icon: 'shield', title: 'Approved venues', text: 'Every store is reviewed by our team before its venues are listed.' },
  { icon: 'credit-card', title: 'Secure payments', text: 'Pay online through PayFast only after the venue accepts your request.' },
  { icon: 'star', title: 'Real reviews', text: 'Only guests who held an event at a venue can review it.' },
]

function search() {
  const query: Record<string, string> = {}
  if (form.event_type) query.event_type = form.event_type
  if (form.city) query.city = form.city
  router.push({ path: '/venues', query })
}

onMounted(async () => {
  try {
    const [v, c] = await Promise.all([
      api.get('/venues', { params: { per_page: 100, sort_by: 'avg_rating', sort_dir: 'desc' } }),
      api.get('/categories').catch(() => null),
    ])
    venues.value = v.data?.data?.data ?? []
    totalVenues.value = v.data?.data?.total ?? venues.value.length
    categories.value = c?.data?.data ?? []
  } catch {
    venues.value = []
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.home { background: var(--canvas); }

/* ─── Hero ─────────────────────────────────────────────────────────────────── */
.hero { padding: 64px 16px 56px; }
.hero-inner {
  max-width: 80rem; margin: 0 auto;
  display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr); gap: 56px; align-items: center;
}
.hero-copy { display: flex; flex-direction: column; gap: 24px; min-width: 0; }
.overline {
  display: inline-flex; align-items: center; gap: 8px; margin: 0;
  font-size: 12px; line-height: 16px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase;
  color: var(--brand-text);
}
.overline-dot { width: 8px; height: 8px; border-radius: 9999px; background: var(--brand); box-shadow: 0 0 0 4px var(--brand-soft); }
.hero-title {
  margin: 0; font-family: var(--font-display); font-size: 60px; line-height: 62px; font-weight: 700;
  letter-spacing: -0.035em; color: var(--ink);
}
.hero-lede { margin: 0; max-width: 34rem; font-size: 17px; line-height: 28px; color: var(--ink-secondary); }

.hero-search {
  display: grid; grid-template-columns: 1fr 1fr auto; gap: 6px; padding: 6px;
  background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-xl);
  box-shadow: var(--shadow-float);
}
.search-field { position: relative; display: flex; align-items: center; min-width: 0; }
.search-icon { position: absolute; left: 16px; color: var(--ink-muted); pointer-events: none; }
.search-field select {
  width: 100%; height: 52px; padding: 0 16px 0 44px; border: 0; border-radius: var(--radius-lg);
  background: transparent; color: var(--ink); font-size: 15px; appearance: none; cursor: pointer;
}
.search-field select:hover { background: var(--surface-hover); }
.search-field + .search-field { border-left: 1px solid var(--line); }
.search-btn { min-height: 52px; border-radius: var(--radius-lg); padding: 0 24px; font-size: 15px; }

.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.chip {
  display: inline-flex; align-items: center; height: 36px; padding: 0 14px; border-radius: 9999px;
  border: 1px solid var(--line-strong); background: var(--surface); color: var(--ink-secondary);
  font-size: 13px; font-weight: 500; text-decoration: none; transition: background-color .15s ease, border-color .15s ease;
}
.chip:hover { background: var(--brand-soft); border-color: var(--brand-strong); color: var(--brand-text); }

.hero-collage {
  display: grid; grid-template-columns: 1.15fr 1fr; grid-template-rows: 1fr 1fr; gap: 12px;
  height: 480px; min-width: 0;
}
.collage-tile { position: relative; overflow: hidden; border-radius: var(--radius-xl); background: var(--surface-sunken); }
.collage-tile img { width: 100%; height: 100%; object-fit: cover; display: block; }
.tile-0 { grid-row: span 2; }
.collage-caption {
  position: absolute; left: 12px; right: 12px; bottom: 12px; padding: 10px 14px;
  border-radius: var(--radius-md); background: var(--surface); box-shadow: var(--shadow-elevated);
  font-size: 12px; line-height: 18px; color: var(--ink-muted);
}
.collage-caption strong { display: block; font-size: 14px; color: var(--ink); }

/* ─── Sections ─────────────────────────────────────────────────────────────── */
.section { padding: 64px 16px; }
.section-sunken { background: var(--surface-sunken); }
.section-inner { max-width: 80rem; margin: 0 auto; }
.section-head { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 16px; margin-bottom: 32px; }
.section-title { margin: 0; font-family: var(--font-display); font-size: 32px; line-height: 38px; font-weight: 700; letter-spacing: -0.025em; color: var(--ink); }
.section-sub { margin: 6px 0 0; font-size: 15px; color: var(--ink-muted); }

.venue-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; }

.city-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; }
.city-card {
  position: relative; aspect-ratio: 4 / 5; overflow: hidden; border-radius: var(--radius-lg);
  background: var(--ink); text-decoration: none;
}
.city-card img { width: 100%; height: 100%; object-fit: cover; opacity: .82; transition: transform .4s ease, opacity .2s ease; }
.city-card:hover img { transform: scale(1.04); opacity: .7; }
.city-label {
  position: absolute; inset: auto 0 0 0; padding: 40px 16px 16px;
  background: linear-gradient(to top, rgba(12, 10, 9, .85), rgba(12, 10, 9, 0));
  color: #e7e5e4; font-size: 13px;
}
.city-label strong { display: block; font-family: var(--font-display); font-size: 20px; line-height: 26px; color: #ffffff; }

.steps { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px; counter-reset: step; }
.step { display: flex; gap: 16px; padding: 24px; border-top: 2px solid var(--brand-strong); background: var(--surface); border-radius: 0 0 var(--radius-lg) var(--radius-lg); box-shadow: var(--shadow-card); }
.step-n {
  flex: none; width: 36px; height: 36px; border-radius: 9999px; display: grid; place-items: center;
  background: var(--brand-soft); color: var(--brand-text); font-family: var(--font-display); font-weight: 700;
}
.step-title { margin: 0 0 4px; font-family: var(--font-display); font-size: 18px; line-height: 24px; font-weight: 600; color: var(--ink); }
.step-text { margin: 0; font-size: 14px; line-height: 22px; color: var(--ink-secondary); }

.feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 32px 24px; }
.feature-icon {
  display: grid; place-items: center; width: 44px; height: 44px; margin-bottom: 16px; border-radius: var(--radius-md);
  background: var(--surface); color: var(--brand-text); border: 1px solid var(--line);
}
.feature-title { margin: 0 0 6px; font-family: var(--font-display); font-size: 17px; line-height: 24px; font-weight: 600; color: var(--ink); }
.feature-text { margin: 0; font-size: 14px; line-height: 22px; color: var(--ink-secondary); }

.owner-band {
  display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 32px;
  padding: 48px; border-radius: var(--radius-xl); background: #064e3b; color: #ecfdf5;
}
.owner-copy { max-width: 38rem; display: flex; flex-direction: column; gap: 12px; }
.overline-light { color: #6ee7b7; }
.owner-title { margin: 0; font-family: var(--font-display); font-size: 36px; line-height: 40px; font-weight: 700; letter-spacing: -0.025em; color: #ffffff; }
.owner-text { margin: 0; font-size: 16px; line-height: 26px; color: #d1fae5; }
.owner-actions { display: flex; flex-direction: column; align-items: flex-start; gap: 12px; }
.owner-btn {
  display: inline-flex; align-items: center; gap: 8px; min-height: 52px; padding: 0 24px; border-radius: var(--radius-md);
  background: #fbbf24; color: #1c1917; font-weight: 600; font-size: 15px; text-decoration: none;
}
.owner-btn:hover { background: #fcd34d; }
.owner-link { color: #d1fae5; font-size: 14px; text-decoration: underline; text-underline-offset: 3px; }

/* ─── Responsive ───────────────────────────────────────────────────────────── */
@media (max-width: 1023px) {
  .hero-inner { grid-template-columns: 1fr; gap: 40px; }
  .hero-collage { height: 320px; }
  .steps { grid-template-columns: 1fr; }
}
@media (max-width: 639px) {
  .hero { padding-top: 40px; }
  .hero-title { font-size: 40px; line-height: 44px; }
  .hero-search { grid-template-columns: 1fr; }
  .search-field + .search-field { border-left: 0; border-top: 1px solid var(--line); }
  .hero-collage { grid-template-columns: 1fr; grid-template-rows: 1fr; height: 240px; }
  .tile-1, .tile-2 { display: none; }
  .tile-0 { grid-row: auto; }
  .section { padding: 48px 16px; }
  .section-title { font-size: 26px; line-height: 32px; }
  .city-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  .city-card { aspect-ratio: 1; }
  .city-label strong { font-size: 17px; line-height: 22px; }
  .owner-band { padding: 32px 24px; }
  .owner-title { font-size: 28px; line-height: 32px; }
}
</style>
