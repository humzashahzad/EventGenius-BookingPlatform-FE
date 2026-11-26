<template>
  <div class="bg-canvas">
    <!-- ── Hero ─────────────────────────────────────────────────────────── -->
    <section class="border-b border-line bg-surface">
      <div class="content-container grid items-center gap-10 py-10 sm:py-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-14 lg:py-20">
        <div class="min-w-0">
          <p class="inline-flex items-center gap-2 rounded-md border border-line bg-surface-sunken px-2.5 py-1 text-[0.8125rem] font-medium text-ink-secondary">
            <AppIcon icon="shield-check" class="w-4 h-4 text-brand-text" />
            Verified venues across Pakistan
          </p>
          <h1 class="text-display mt-4 text-ink">Book the right venue for every occasion</h1>
          <p class="mt-4 max-w-xl text-base sm:text-lg leading-relaxed text-ink-secondary">
            Compare wedding halls, marquees, banquet and conference venues with real photos, guest reviews and clear per-head prices — then request your date in minutes.
          </p>

          <div class="mt-7 max-w-xl">
            <SmartSearchBox
              v-model="heroQuery"
              variant="hero"
              aria-label="Search venues"
              placeholder="Try: shadi hall in Lahore for 300 guests"
              @submit="heroSearch"
              @select="heroSelect"
            />
          </div>
          <RouterLink :to="{ path: '/ask', query: heroQuery.trim() ? { q: heroQuery.trim() } : {} }" class="link mt-3 inline-flex items-center gap-1.5 text-sm font-medium">
            <AppIcon icon="message-circle" class="w-4 h-4" />
            Not sure what to search? Ask EventGenius
          </RouterLink>

          <div class="mt-4 flex flex-wrap items-center gap-2 max-w-xl">
            <span class="text-[0.8125rem] text-ink-muted">Popular:</span>
            <RouterLink
              v-for="q in popularSearches"
              :key="q.label"
              :to="q.to"
              class="inline-flex items-center h-8 rounded-md border border-line bg-surface px-2.5 text-[0.8125rem] font-medium text-ink-secondary hover:border-line-strong hover:text-ink"
            >{{ q.label }}</RouterLink>
          </div>

          <dl class="mt-8 grid max-w-xl grid-cols-3 gap-4 border-t border-line pt-6">
            <div v-for="s in heroStats" :key="s.label" class="min-w-0">
              <dt class="text-[0.8125rem] text-ink-muted">{{ s.label }}</dt>
              <dd class="mt-0.5 font-display text-2xl font-semibold text-ink num">
                <span v-if="loading" class="skeleton inline-block h-7 w-12 align-middle"></span>
                <template v-else>{{ s.value }}</template>
              </dd>
            </div>
          </dl>
        </div>

        <!-- Photo mosaic of real venues -->
        <div class="min-w-0">
          <div v-if="loading" class="hero-mosaic" aria-hidden="true">
            <div class="skeleton hero-mosaic-a"></div>
            <div class="skeleton hero-mosaic-b"></div>
            <div class="skeleton hero-mosaic-c"></div>
          </div>
          <div v-else-if="heroVenues.length" class="hero-mosaic">
            <RouterLink
              v-for="(v, i) in heroVenues"
              :key="v.id"
              :to="`/venues/${v.id}`"
              class="hero-tile group"
              :class="['hero-mosaic-a', 'hero-mosaic-b', 'hero-mosaic-c'][i]"
            >
              <img :src="venueImageUrl(v)" :alt="`${v.name}, ${v.city}`" class="h-full w-full object-cover" :loading="i === 0 ? 'eager' : 'lazy'" />
              <span class="hero-tile-caption">
                <span class="block truncate text-sm font-semibold text-ink group-hover:text-brand-text">{{ v.name }}</span>
                <span class="flex items-center gap-1 text-xs text-ink-muted">
                  <AppIcon icon="map-pin" class="w-3 h-3" />{{ v.city }}
                  <template v-if="ratingText(v)">
                    <span aria-hidden="true">·</span>
                    <AppIcon icon="star-filled" class="fill-current w-3 h-3 text-[#B45309]" />{{ ratingText(v) }}
                  </template>
                </span>
              </span>
            </RouterLink>
          </div>
          <img v-else src="/images/venue-hall.jpg" alt="A decorated event hall" class="aspect-[4/3] w-full rounded-2xl object-cover" />
        </div>
      </div>
    </section>

    <!-- ── Browse by event type ─────────────────────────────────────────── -->
    <section class="py-14 lg:py-20" aria-labelledby="browse-type">
      <div class="content-container">
        <div class="section-head">
          <div>
            <p class="eyebrow">Browse</p>
            <h2 id="browse-type" class="heading-1 mt-1">Find a venue by occasion</h2>
          </div>
          <RouterLink to="/venues" class="btn-ghost btn-sm">All venues <AppIcon icon="arrow-right" class="w-4 h-4" /></RouterLink>
        </div>

        <div v-if="loading" class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <div v-for="i in 6" :key="i" class="skeleton h-[5.5rem] !rounded-xl"></div>
        </div>
        <ul v-else-if="eventTypes.length" class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <li v-for="(t, i) in eventTypes" :key="t.slug" :class="{ 'hidden sm:block': i >= 8 }">
            <RouterLink :to="{ path: '/venues', query: { event_type: t.slug } }" class="type-tile">
              <span class="icon-chip icon-chip-sm tone-brand"><AppIcon :icon="eventTypeIcon(t.slug)" class="w-4 h-4" /></span>
              <span class="min-w-0 flex-1">
                <span class="block text-sm font-semibold leading-snug text-ink break-words">{{ t.name }}</span>
                <span class="block text-xs text-ink-muted num">{{ plural(t.count, 'venue') }}</span>
              </span>
            </RouterLink>
          </li>
        </ul>
        <p v-else class="text-sm text-ink-muted">Event types will appear here once venues are listed.</p>
      </div>
    </section>

    <!-- ── Featured venues ──────────────────────────────────────────────── -->
    <section class="border-y border-line bg-surface py-14 lg:py-20" aria-labelledby="featured-title">
      <div class="content-container">
        <div class="section-head">
          <div>
            <p class="eyebrow">Featured</p>
            <h2 id="featured-title" class="heading-1 mt-1">Popular venues right now</h2>
            <p class="mt-1 text-ink-muted">Highly rated, frequently booked and ready for your date.</p>
          </div>
          <RouterLink to="/venues?sort=avg_rating" class="btn-secondary btn-sm">See top rated <AppIcon icon="arrow-right" class="w-4 h-4" /></RouterLink>
        </div>

        <div v-if="loading" class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <VenueCardSkeleton v-for="i in 6" :key="i" />
        </div>
        <div v-else-if="loadError" class="alert-danger" role="alert">
          <AppIcon icon="alert-triangle" class="w-5 h-5 shrink-0" />
          <div class="flex-1">
            <p class="alert-title">We couldn't load venues</p>
            <p>Check your connection and try again.</p>
          </div>
          <button type="button" class="btn-secondary btn-sm" @click="load">Try again</button>
        </div>
        <div v-else-if="featuredVenues.length" class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <VenueCard v-for="v in featuredVenues" :key="v.id" :venue="v" :categories="categories" />
        </div>
        <div v-else class="empty-state">
          <div class="empty-state-icon"><AppIcon icon="building" class="w-5 h-5" /></div>
          <p class="empty-state-title">No venues listed yet</p>
          <p class="empty-state-desc">Own a venue? List it and be the first one customers see.</p>
          <div class="empty-state-actions"><RouterLink to="/shop/sign-up" class="btn-primary">List your venue</RouterLink></div>
        </div>
      </div>
    </section>

    <!-- ── Browse by city ───────────────────────────────────────────────── -->
    <section v-if="loading || cities.length" class="py-14 lg:py-20" aria-labelledby="city-title">
      <div class="content-container">
        <div class="section-head">
          <div>
            <p class="eyebrow">Cities</p>
            <h2 id="city-title" class="heading-1 mt-1">Venues near you</h2>
            <p class="mt-1 text-ink-muted">Listed in {{ cities.length || '…' }} cities and growing.</p>
          </div>
        </div>
        <div v-if="loading" class="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div v-for="i in 4" :key="i" class="skeleton aspect-[4/3] !rounded-xl"></div>
        </div>
        <ul v-else class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          <li v-for="c in cities.slice(0, 8)" :key="c.name">
            <RouterLink :to="{ path: '/venues', query: { city: c.name } }" class="city-tile group">
              <img v-if="c.image" :src="c.image" :alt="`Venue in ${c.name}`" loading="lazy" class="aspect-[4/3] w-full object-cover" />
              <div v-else class="aspect-[4/3] w-full bg-surface-sunken"></div>
              <span class="flex items-center justify-between gap-2 px-3.5 py-3">
                <span class="min-w-0">
                  <span class="block truncate font-semibold text-ink group-hover:text-brand-text">{{ c.name }}</span>
                  <span class="block text-xs text-ink-muted num">{{ plural(c.count, 'venue') }}<template v-if="c.from"> · from PKR {{ formatNumber(c.from) }}/head</template></span>
                </span>
                <AppIcon icon="chevron-right" class="w-4 h-4 shrink-0 text-ink-muted" />
              </span>
            </RouterLink>
          </li>
        </ul>
      </div>
    </section>

    <!-- ── How booking works ────────────────────────────────────────────── -->
    <section class="border-y border-line bg-surface py-14 lg:py-20" aria-labelledby="how-title">
      <div class="content-container">
        <div class="max-w-2xl">
          <p class="eyebrow">How it works</p>
          <h2 id="how-title" class="heading-1 mt-1">From search to confirmed booking</h2>
          <p class="mt-1 text-ink-muted">No phone tag with venue managers. Everything happens in one place.</p>
        </div>
        <ol class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <li v-for="(s, i) in steps" :key="s.title" class="relative">
            <div class="flex items-center gap-3">
              <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line-strong/50 bg-surface font-semibold text-ink num">{{ i + 1 }}</span>
              <span class="hidden h-px flex-1 bg-line lg:block" :class="{ 'lg:invisible': i === steps.length - 1 }"></span>
            </div>
            <h3 class="heading-3 mt-4 flex items-center gap-2">
              <AppIcon :icon="s.icon" class="w-4 h-4 text-brand-text" />{{ s.title }}
            </h3>
            <p class="mt-1.5 text-sm leading-relaxed text-ink-secondary">{{ s.text }}</p>
          </li>
        </ol>
      </div>
    </section>

    <!-- ── Trust / proof ────────────────────────────────────────────────── -->
    <section class="py-14 lg:py-20" aria-labelledby="trust-title">
      <div class="content-container grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14">
        <div>
          <p class="eyebrow">Why EventGenius</p>
          <h2 id="trust-title" class="heading-1 mt-1">Book with confidence</h2>
          <p class="mt-2 text-ink-secondary leading-relaxed">
            Every listing comes from a venue owner our team has approved. Prices are shown up front and reviews come only from customers who actually held their event there.
          </p>
          <dl class="mt-8 grid grid-cols-2 gap-4">
            <div v-for="s in proofStats" :key="s.label" class="stat-card !items-start">
              <span class="icon-chip tone-brand"><AppIcon :icon="s.icon" class="w-5 h-5" /></span>
              <div class="min-w-0">
                <dt class="stat-label">{{ s.label }}</dt>
                <dd class="stat-value num">
                  <span v-if="loading" class="skeleton inline-block h-7 w-14 align-middle"></span>
                  <template v-else>{{ s.value }}</template>
                </dd>
              </div>
            </div>
          </dl>
        </div>
        <ul class="grid gap-4 sm:grid-cols-2">
          <li v-for="f in features" :key="f.title" class="card card-body">
            <span class="icon-chip tone-neutral"><AppIcon :icon="f.icon" class="w-5 h-5" /></span>
            <h3 class="heading-3 mt-4">{{ f.title }}</h3>
            <p class="mt-1.5 text-sm leading-relaxed text-ink-secondary">{{ f.text }}</p>
          </li>
        </ul>
      </div>
    </section>

    <!-- ── Owner CTA ────────────────────────────────────────────────────── -->
    <section class="pb-16 lg:pb-20" aria-labelledby="owner-title">
      <div class="content-container">
        <div class="owner-cta">
          <div class="min-w-0 p-6 sm:p-10 lg:p-12">
            <p class="text-xs font-semibold uppercase tracking-[0.08em] text-[#A7F3D0]">For venue owners</p>
            <h2 id="owner-title" class="mt-2 font-display text-[1.75rem] sm:text-[2rem] font-bold leading-tight text-white">Fill more dates at your venue</h2>
            <p class="mt-3 max-w-lg text-[0.9375rem] leading-relaxed text-[#D6D3D1]">
              List your hall, marquee or banquet for free. Get booking requests with dates, guest counts and event details, chat with customers and get paid online.
            </p>
            <ul class="mt-5 grid gap-2 text-sm text-[#E7E5E4] sm:grid-cols-2">
              <li v-for="p in ownerPoints" :key="p" class="flex items-center gap-2"><AppIcon icon="circle-check" class="w-4 h-4 shrink-0 text-[#6EE7B7]" />{{ p }}</li>
            </ul>
            <div class="mt-7 flex flex-col gap-3 sm:flex-row">
              <RouterLink to="/shop/sign-up" class="btn-primary btn-lg">List your venue <AppIcon icon="arrow-right" class="w-4 h-4" /></RouterLink>
              <RouterLink to="/shop/sign-in" class="owner-cta-secondary">Owner sign in</RouterLink>
            </div>
          </div>
          <img
            :src="ownerImage"
            alt="Event hall set up for a function"
            loading="lazy"
            class="hidden h-full w-full object-cover md:block"
          />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import api from '@/lib/axios'
import AppIcon from '@/components/ui/AppIcon.vue'
import SmartSearchBox from '@/components/search/SmartSearchBox.vue'
import VenueCard from '@/components/venue/VenueCard.vue'
import VenueCardSkeleton from '@/components/venue/VenueCardSkeleton.vue'
import type { Suggestion } from '@/components/search/types'
import {
  venueImageUrl, ratingText, eventTypeIcon, formatNumber, plural, type CategoryLike,
} from '@/components/venue/venueUtils'

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

// ─── Data (all real, from the public API) ────────────────────────────────────
const venues = ref<any[]>([])
const totalVenues = ref(0)
const categories = ref<CategoryLike[]>([])
const loading = ref(true)
const loadError = ref(false)

async function load() {
  loading.value = true
  loadError.value = false
  try {
    const [vRes, cRes] = await Promise.allSettled([
      api.get('/venues', { params: { per_page: 100, sort_by: 'avg_rating', sort_dir: 'desc' } }),
      api.get('/categories'),
    ])
    if (vRes.status !== 'fulfilled') throw vRes.reason
    const page = vRes.value.data?.data ?? {}
    venues.value = Array.isArray(page.data) ? page.data : []
    totalVenues.value = Number(page.total) || venues.value.length
    if (cRes.status === 'fulfilled') {
      categories.value = (cRes.value.data?.data ?? []).filter((c: any) => c && c.is_active !== false)
    }
  } catch {
    loadError.value = true
    venues.value = []
  } finally {
    loading.value = false
  }
}

onMounted(load)

const withPhoto = computed(() => venues.value.filter(v => venueImageUrl(v)))

const featuredVenues = computed(() => {
  const featured = venues.value.filter(v => v.is_featured)
  const rest = venues.value.filter(v => !v.is_featured)
  return [...featured, ...rest].slice(0, 6)
})

const heroVenues = computed(() => {
  const picks = [...withPhoto.value.filter(v => v.is_featured), ...withPhoto.value.filter(v => !v.is_featured)]
  return picks.slice(0, 3)
})

const cities = computed(() => {
  const map = new Map<string, { name: string; count: number; image: string; from: number }>()
  for (const v of venues.value) {
    const name = String(v.city || '').trim()
    if (!name) continue
    const entry = map.get(name) ?? { name, count: 0, image: '', from: 0 }
    entry.count++
    if (!entry.image) entry.image = venueImageUrl(v)
    const price = Number(v.price_per_head) || 0
    if (price > 0 && (!entry.from || price < entry.from)) entry.from = price
    map.set(name, entry)
  }
  return [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
})

const eventTypes = computed(() => {
  const counts = new Map<string, number>()
  for (const v of venues.value) for (const t of (v.event_types || [])) counts.set(t, (counts.get(t) ?? 0) + 1)
  return categories.value
    .map(c => ({ slug: c.slug, name: c.name, count: counts.get(c.slug) ?? 0 }))
    .filter(c => c.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 12)
})

const totalReviews = computed(() => venues.value.reduce((sum, v) => sum + (Number(v.total_reviews) || 0), 0))
const avgRating = computed(() => {
  let weighted = 0
  for (const v of venues.value) weighted += (Number(v.avg_rating) || 0) * (Number(v.total_reviews) || 0)
  return totalReviews.value ? (weighted / totalReviews.value).toFixed(1) : '—'
})

const heroStats = computed(() => [
  { label: 'Venues listed', value: formatNumber(totalVenues.value) },
  { label: 'Cities', value: formatNumber(cities.value.length) },
  { label: 'Guest reviews', value: formatNumber(totalReviews.value) },
])

const proofStats = computed(() => [
  { icon: 'building', label: 'Approved venues', value: formatNumber(totalVenues.value) },
  { icon: 'map-pin', label: 'Cities covered', value: formatNumber(cities.value.length) },
  { icon: 'message-star', label: 'Verified reviews', value: formatNumber(totalReviews.value) },
  { icon: 'star', label: 'Average rating', value: avgRating.value },
])

const popularSearches = computed(() => {
  const out: { label: string; to: any }[] = []
  const wedding = categories.value.find(c => c.slug === 'weddings')
  if (wedding) out.push({ label: 'Wedding halls', to: { path: '/venues', query: { event_type: 'weddings' } } })
  for (const c of cities.value.slice(0, 3)) out.push({ label: c.name, to: { path: '/venues', query: { city: c.name } } })
  out.push({ label: 'Under PKR 3,000/head', to: { path: '/venues', query: { q: 'under 3000' } } })
  return out
})

const ownerImage = computed(() => (withPhoto.value[3] ? venueImageUrl(withPhoto.value[3]) : '/images/venue-hall.jpg'))

const steps = [
  { icon: 'search', title: 'Search and compare', text: 'Describe your event in plain words or filter by city, occasion, guests and budget.' },
  { icon: 'calendar-event', title: 'Pick a date', text: 'See which days and time slots are free on the venue calendar before you ask.' },
  { icon: 'calendar-check', title: 'Request and confirm', text: 'Send your request with guest count and add-ons. The owner confirms or replies in chat.' },
  { icon: 'credit-card', title: 'Pay securely', text: 'Pay online through PayFast once confirmed, and track everything from your dashboard.' },
]

const features = [
  { icon: 'calendar-check', title: 'Live availability', text: 'Booked slots are blocked on the calendar, so you never request a date that is already taken.' },
  { icon: 'receipt', title: 'Clear pricing', text: 'Per-head price, paid add-ons and tax are shown before you send a request. No surprises.' },
  { icon: 'message', title: 'Chat with the owner', text: 'Ask about menus, decor or timings directly and keep the conversation with your booking.' },
  { icon: 'star', title: 'Genuine reviews', text: 'Only customers who completed an event at a venue can review it.' },
]

const ownerPoints = ['Free listing', 'Booking calendar', 'Online payments', 'Customer chat']
</script>

<style scoped>
.section-head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.75rem;
}

/* Hero mosaic: one large photo and two stacked on the right. */
.hero-mosaic {
  display: grid;
  grid-template-columns: 1.35fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 0.75rem;
  aspect-ratio: 5 / 4;
}
.hero-mosaic-a { grid-row: 1 / span 2; }
.hero-mosaic > .skeleton { border-radius: var(--radius-xl); }
@media (max-width: 639.98px) {
  .hero-mosaic { grid-template-columns: 1fr 1fr; grid-template-rows: auto auto; aspect-ratio: auto; }
  .hero-mosaic-a { grid-column: 1 / span 2; grid-row: auto; aspect-ratio: 16 / 10; }
  .hero-mosaic-b, .hero-mosaic-c { aspect-ratio: 1 / 1; }
  .hero-mosaic-b .hero-tile-caption, .hero-mosaic-c .hero-tile-caption { display: none; }
}
.hero-tile {
  position: relative;
  display: block;
  min-height: 0;
  overflow: hidden;
  border-radius: var(--radius-xl);
  background: var(--surface-sunken);
  border: 1px solid var(--line);
}
.hero-tile img { transition: transform .4s ease; }
.hero-tile:hover img { transform: scale(1.03); }
.hero-tile-caption {
  position: absolute;
  left: 0.75rem;
  right: 0.75rem;
  bottom: 0.75rem;
  max-width: 18rem;
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-md);
  background: var(--surface);
  box-shadow: var(--shadow-md);
}

.type-tile {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-height: 5.5rem;
  padding: 1rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow: var(--shadow-xs);
  transition: border-color .15s ease, box-shadow .15s ease;
}
.type-tile:hover { border-color: rgb(var(--c-line-strong) / 0.6); box-shadow: var(--shadow-md); }

.city-tile {
  display: block;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow: var(--shadow-xs);
  transition: border-color .15s ease, box-shadow .15s ease;
}
.city-tile:hover { border-color: rgb(var(--c-line-strong) / 0.6); box-shadow: var(--shadow-md); }

.owner-cta {
  display: grid;
  overflow: hidden;
  border-radius: var(--radius-xl);
  background: #1C1917;
}
@media (min-width: 768px) {
  .owner-cta { grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); }
}
.owner-cta-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 0 1.5rem;
  border-radius: var(--radius-md);
  border: 1px solid rgba(255, 255, 255, 0.35);
  color: #fff;
  font-weight: 600;
  transition: background-color .15s ease, border-color .15s ease;
}
.owner-cta-secondary:hover { background: rgba(255, 255, 255, 0.08); border-color: rgba(255, 255, 255, 0.6); }
</style>
