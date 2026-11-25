<template>
  <div class="bg-canvas min-h-[70vh]">
    <!-- Loading -->
    <div v-if="loading" aria-busy="true" aria-label="Loading store profile">
      <div class="skeleton h-40 sm:h-56 !rounded-none"></div>
      <div class="content-container">
        <div class="-mt-10 flex items-end gap-4">
          <div class="skeleton h-20 w-20 !rounded-xl border-4 border-canvas"></div>
          <div class="flex-1 space-y-2 pb-1"><div class="skeleton h-6 w-56 max-w-full"></div><div class="skeleton h-4 w-32"></div></div>
        </div>
        <div class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 pb-16">
          <VenueCardSkeleton v-for="i in 3" :key="i" />
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="content-container py-16">
      <div class="card">
        <div class="empty-state">
          <div class="empty-state-icon"><AppIcon icon="alert-circle" class="w-5 h-5" /></div>
          <p class="empty-state-title">Store not found</p>
          <p class="empty-state-desc">{{ error }}</p>
          <div class="empty-state-actions">
            <button type="button" class="btn-secondary" @click="fetchStoreProfile">Try again</button>
            <RouterLink to="/venues" class="btn-primary">Browse all venues</RouterLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Store page -->
    <div v-else-if="store" class="pb-16">
      <!-- Cover -->
      <div class="relative h-40 sm:h-56 lg:h-64 overflow-hidden border-b border-line bg-surface-sunken">
        <img v-if="coverUrl" :src="coverUrl" :alt="`${store.name} venue`" class="h-full w-full object-cover" />
      </div>

      <div class="content-container">
        <!-- Profile header -->
        <header class="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div class="flex items-end gap-4 min-w-0">
            <div class="store-logo -mt-10 sm:-mt-12">
              <img v-if="store.logo" :src="getAvatarUrl(store.logo)" :alt="`${store.name} logo`" />
              <img v-else-if="store.user?.avatar" :src="getAvatarUrl(store.user.avatar)" :alt="store.name" />
              <span v-else class="font-display text-2xl font-bold text-brand-text">{{ getInitials(store.name || '') }}</span>
            </div>
            <div class="min-w-0 pb-1">
              <h1 class="font-display text-2xl sm:text-[1.875rem] font-bold leading-tight tracking-tight text-ink break-words">{{ store.name }}</h1>
              <p class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-secondary">
                <span v-if="store.city" class="inline-flex items-center gap-1"><AppIcon icon="map-pin" class="w-4 h-4 text-ink-muted" />{{ [store.city, store.country].filter(Boolean).join(', ') }}</span>
                <span v-if="stats?.total_reviews" class="inline-flex items-center gap-1"><AppIcon icon="star-filled" class="fill-current w-4 h-4 text-[#B45309]" /><span class="font-semibold text-ink num">{{ Number(stats.avg_rating).toFixed(1) }}</span><span class="text-ink-muted num">({{ stats.total_reviews }} reviews)</span></span>
                <span class="badge-success"><AppIcon icon="shield-check" class="w-3 h-3" />Verified host</span>
              </p>
            </div>
          </div>
          <div class="flex flex-wrap gap-2 sm:pb-1">
            <button v-if="authStore.isLoggedIn && store.user?.id && authStore.user?.id !== store.user.id" type="button" @click="startChat" class="btn-primary">
              <AppIcon icon="message-circle" class="w-4 h-4" />
              Contact store
            </button>
            <a v-if="store.venues?.length" href="#venues" class="btn-secondary">View venues</a>
          </div>
        </header>

        <p v-if="landing?.tagline" class="mt-5 max-w-3xl text-lg text-ink-secondary">{{ landing.tagline }}</p>

        <!-- Stats -->
        <dl class="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-4">
          <div v-for="st in statTiles" :key="st.label" class="bg-surface px-4 py-4">
            <dt class="text-[0.8125rem] text-ink-muted">{{ st.label }}</dt>
            <dd class="mt-0.5 font-display text-xl font-semibold text-ink num">{{ st.value }}</dd>
          </div>
        </dl>

        <div class="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div class="min-w-0 space-y-12">
            <!-- Venues -->
            <section v-if="store.venues?.length" id="venues" class="scroll-mt-24" aria-labelledby="venues-title">
              <h2 id="venues-title" class="heading-2">Venues <span class="text-ink-muted font-normal num">({{ store.venues.length }})</span></h2>
              <ul class="mt-4 grid gap-5 sm:grid-cols-2">
                <li v-for="venue in store.venues" :key="venue.id" class="min-w-0"><VenueCard :venue="venue" /></li>
              </ul>
            </section>
            <div v-else class="card">
              <div class="empty-state">
                <div class="empty-state-icon"><AppIcon icon="building" class="w-5 h-5" /></div>
                <p class="empty-state-title">No venues listed yet</p>
                <p class="empty-state-desc">This host hasn't published a venue yet. Browse other venues in the meantime.</p>
                <div class="empty-state-actions"><RouterLink to="/venues" class="btn-primary">Browse venues</RouterLink></div>
              </div>
            </div>

            <!-- About -->
            <section v-if="landing?.about_text || store.description" aria-labelledby="about-title">
              <h2 id="about-title" class="heading-2">About</h2>
              <p class="mt-3 whitespace-pre-line leading-relaxed text-ink-secondary">{{ landing?.about_text || store.description }}</p>
            </section>

            <!-- Services -->
            <section v-if="landing?.services?.length" aria-labelledby="services-title">
              <h2 id="services-title" class="heading-2">Services</h2>
              <ul class="mt-4 grid gap-4 sm:grid-cols-2">
                <li v-for="(s, i) in landing.services" :key="i" class="card card-body">
                  <span class="icon-chip icon-chip-sm tone-brand"><AppIcon icon="circle-check" class="w-4 h-4" /></span>
                  <h3 class="heading-3 mt-3">{{ s.title }}</h3>
                  <p class="mt-1 text-sm leading-relaxed text-ink-secondary">{{ s.description }}</p>
                </li>
              </ul>
            </section>

            <!-- Gallery -->
            <section v-if="landing?.gallery?.length" aria-labelledby="gallery-title">
              <h2 id="gallery-title" class="heading-2">Gallery</h2>
              <ul class="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
                <li v-for="(g, i) in landing.gallery" :key="i">
                  <button type="button" class="block w-full overflow-hidden rounded-lg border border-line bg-surface-sunken cursor-zoom-in" :aria-label="`Open photo ${i + 1}`" @click="lightboxRef?.open(i)">
                    <img :src="getImageUrl(g)" :alt="`${store.name} photo ${i + 1}`" class="aspect-square w-full object-cover" loading="lazy" />
                  </button>
                </li>
              </ul>
            </section>

            <!-- Testimonials -->
            <section v-if="landing?.testimonials?.length" aria-labelledby="testi-title">
              <h2 id="testi-title" class="heading-2">What customers say</h2>
              <ul class="mt-4 grid gap-4 md:grid-cols-2">
                <li v-for="(t, i) in landing.testimonials" :key="i" class="card card-body">
                  <StarRating :model-value="Number(t.rating) || 5" readonly size="sm" />
                  <p class="mt-3 text-sm leading-relaxed text-ink-secondary">“{{ t.quote }}”</p>
                  <p class="mt-3 text-sm font-semibold text-ink">{{ t.name }}</p>
                </li>
              </ul>
            </section>

            <!-- FAQ -->
            <section v-if="landing?.faq?.length" aria-labelledby="faq-title">
              <h2 id="faq-title" class="heading-2">Frequently asked questions</h2>
              <div class="mt-4 card divide-y divide-line overflow-hidden">
                <div v-for="(f, i) in landing.faq" :key="i">
                  <h3>
                    <button
                      type="button"
                      class="faq-q"
                      :aria-expanded="openFaqs.has(i) ? 'true' : 'false'"
                      :aria-controls="`faq-${i}`"
                      @click="toggleFaq(i)"
                    >
                      <span>{{ f.question }}</span>
                      <span class="shrink-0 text-ink-muted transition-transform duration-200" :class="{ 'rotate-180': openFaqs.has(i) }"><AppIcon icon="chevron-down" class="w-5 h-5" /></span>
                    </button>
                  </h3>
                  <div v-show="openFaqs.has(i)" :id="`faq-${i}`" class="px-5 pb-4 text-sm leading-relaxed text-ink-secondary">{{ f.answer }}</div>
                </div>
              </div>
            </section>
          </div>

          <!-- Contact sidebar -->
          <aside class="lg:sticky lg:top-20 lg:self-start" aria-label="Contact details">
            <div class="card">
              <div class="card-header"><h2 class="card-title">Contact and details</h2></div>
              <div class="card-body space-y-3 text-sm">
                <p v-if="store.address || store.city" class="flex gap-2.5 text-ink-secondary"><AppIcon icon="map-pin" class="w-4 h-4 mt-0.5 shrink-0 text-ink-muted" /><span>{{ [store.address, store.city, store.state].filter(Boolean).join(', ') }}</span></p>
                <p v-if="store.phone" class="flex gap-2.5 min-w-0"><AppIcon icon="phone" class="w-4 h-4 mt-0.5 shrink-0 text-ink-muted" /><a :href="`tel:${store.phone}`" class="link truncate">{{ store.phone }}</a></p>
                <p v-if="store.email" class="flex gap-2.5 min-w-0"><AppIcon icon="mail" class="w-4 h-4 mt-0.5 shrink-0 text-ink-muted" /><a :href="`mailto:${store.email}`" class="link truncate">{{ store.email }}</a></p>
                <p v-if="store.website" class="flex gap-2.5 min-w-0"><AppIcon icon="globe" class="w-4 h-4 mt-0.5 shrink-0 text-ink-muted" /><a :href="store.website" target="_blank" rel="noopener" class="link truncate">{{ store.website.replace(/^https?:\/\//, '') }}</a></p>
                <p v-if="stats?.member_since" class="flex gap-2.5 text-ink-secondary"><AppIcon icon="calendar" class="w-4 h-4 mt-0.5 shrink-0 text-ink-muted" />On EventGenius since {{ stats.member_since }}</p>
              </div>
              <div v-if="hasSocialLinks" class="card-footer flex flex-wrap gap-2">
                <a v-if="landing?.social_links?.facebook" :href="landing.social_links.facebook" target="_blank" rel="noopener" class="btn-secondary btn-sm"><AppIcon icon="brand-facebook" class="w-4 h-4" />Facebook</a>
                <a v-if="landing?.social_links?.instagram" :href="landing.social_links.instagram" target="_blank" rel="noopener" class="btn-secondary btn-sm"><AppIcon icon="brand-instagram" class="w-4 h-4" />Instagram</a>
                <a v-if="landing?.social_links?.twitter" :href="landing.social_links.twitter" target="_blank" rel="noopener" class="btn-secondary btn-sm"><AppIcon icon="brand-x" class="w-4 h-4" />Twitter</a>
                <a v-if="landing?.social_links?.website" :href="landing.social_links.website" target="_blank" rel="noopener" class="btn-secondary btn-sm"><AppIcon icon="globe" class="w-4 h-4" />Website</a>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <ImageLightbox v-if="landing?.gallery?.length" ref="lightboxRef" :images="galleryImages" />
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
import { useAuthStore } from '@/stores/auth'
import VenueCard from '@/components/venue/VenueCard.vue'
import VenueCardSkeleton from '@/components/venue/VenueCardSkeleton.vue'
import StarRating from '@/components/reviews/StarRating.vue'
import ImageLightbox from '@/components/gallery/ImageLightbox.vue'
import type { LightboxImage } from '@/components/gallery/ImageLightbox.vue'

const route = useRoute()
const { startConversation } = useChat()
const authStore = useAuthStore()

const store = ref<any>(null)
const stats = ref<any>(null)
const landing = ref<any>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const openFaqs = ref(new Set<number>())

const lightboxRef = ref<InstanceType<typeof ImageLightbox> | null>(null)

const coverUrl = computed(() => {
  const path = landing.value?.hero_image || store.value?.cover_image
  return path ? getStorageUrl(path) : ''
})

const galleryImages = computed<LightboxImage[]>(() => (landing.value?.gallery || []).map((g: string, i: number) => ({
  url: getStorageUrl(g),
  thumbnail: getStorageUrl(g),
  alt: `${store.value?.name || 'Store'} photo ${i + 1}`,
})))

const statTiles = computed(() => [
  { label: 'Venues', value: Number(stats.value?.total_venues || 0).toLocaleString('en-PK') },
  { label: 'Bookings hosted', value: Number(stats.value?.total_bookings || 0).toLocaleString('en-PK') },
  { label: 'Average rating', value: stats.value?.total_reviews ? `${Number(stats.value.avg_rating).toFixed(1)} / 5` : 'No reviews yet' },
  { label: 'Member since', value: stats.value?.member_since || '—' },
])

const hasSocialLinks = computed(() => {
  const links = landing.value?.social_links
  return links && Object.values(links).some((v: any) => v)
})

function toggleFaq(i: number) {
  const next = new Set(openFaqs.value)
  if (next.has(i)) next.delete(i)
  else next.add(i)
  openFaqs.value = next
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
.store-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 5rem;
  height: 5rem;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: var(--radius-xl);
  border: 4px solid var(--canvas);
  background: var(--brand-soft);
  box-shadow: var(--shadow-sm);
}
@media (min-width: 640px) { .store-logo { width: 6rem; height: 6rem; } }
.store-logo img { width: 100%; height: 100%; object-fit: cover; }

.faq-q {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-height: 52px;
  padding: 0.875rem 1.25rem;
  text-align: left;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--ink);
  transition: background-color .15s ease;
}
.faq-q:hover { background: var(--surface-hover); }
</style>
