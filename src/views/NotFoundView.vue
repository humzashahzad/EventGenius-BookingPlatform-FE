<template>
  <div class="flex min-h-screen flex-col bg-canvas">
    <header class="border-b border-line bg-surface">
      <div class="content-container flex h-16 items-center">
        <RouterLink to="/" class="flex items-center gap-2" aria-label="EventGenius home">
          <AppLogo class="w-8 h-8" title="EventGenius" />
          <span class="font-display text-lg font-bold tracking-tight text-ink">EventGenius</span>
        </RouterLink>
      </div>
    </header>

    <main class="flex flex-1 items-center py-12 sm:py-16">
      <div class="content-container grid w-full items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
        <div class="min-w-0">
          <p class="ref text-brand-text font-medium">Error 404</p>
          <h1 class="text-display mt-2 text-ink">We couldn't find that page</h1>
          <p class="mt-3 max-w-lg text-base leading-relaxed text-ink-secondary">
            The link may be broken, or the page may have been moved. Search for a venue below or head back to where you were.
          </p>

          <div class="mt-6 max-w-lg">
            <SmartSearchBox
              v-model="query"
              aria-label="Search venues"
              placeholder="Search venues, cities or event types"
              @submit="search"
              @select="select"
            />
          </div>

          <div class="mt-6 flex flex-col gap-3 sm:flex-row">
            <RouterLink to="/" class="btn-primary"><AppIcon icon="arrow-left" class="w-4 h-4" />Go to home</RouterLink>
            <RouterLink to="/venues" class="btn-secondary">Browse venues</RouterLink>
            <button type="button" class="btn-ghost" @click="goBack">Go back</button>
          </div>

          <p class="mt-8 text-sm text-ink-muted">
            Requested: <span class="ref break-all text-ink-secondary">{{ route.fullPath }}</span>
          </p>
        </div>

        <div class="hidden lg:block">
          <img src="/images/venue-hall.jpg" alt="An empty event hall" class="aspect-[4/3] w-full rounded-2xl border border-line object-cover" />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import AppLogo from '@/components/brand/AppLogo.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import SmartSearchBox from '@/components/search/SmartSearchBox.vue'
import type { Suggestion } from '@/components/search/types'

const route = useRoute()
const router = useRouter()
const query = ref('')

function search(q: string) {
  router.push(q ? { path: '/venues', query: { q } } : { path: '/venues' })
}

function select(s: Suggestion) {
  if (s.type === 'city') router.push({ path: '/venues', query: { city: s.city || s.value } })
  else if (s.type === 'category') router.push({ path: '/venues', query: { event_type: s.value } })
  else search(s.value)
}

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/')
}
</script>
