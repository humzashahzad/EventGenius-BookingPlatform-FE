<template>
  <!-- Left-hand panel of the auth screens (desktop only): a real venue photo
       with a flat dark scrim and plain text. Solid colours only, no animation. -->
  <div class="hidden lg:flex lg:w-[52%] xl:w-[58%] relative overflow-hidden rounded-xl m-2 bg-warm-900">
    <img
      :src="image"
      alt=""
      class="absolute inset-0 w-full h-full object-cover"
      loading="eager"
      decoding="async"
    />
    <div class="absolute inset-0 bg-warm-900/55" aria-hidden="true" />

    <div class="relative z-10 flex flex-col justify-between w-full p-10 xl:p-12">
      <RouterLink to="/" class="inline-flex items-center gap-2.5 w-fit rounded-md">
        <AppLogo tone="white" class="w-9 h-9" />
        <span class="font-display font-bold text-lg text-white tracking-tight">EventGenius</span>
      </RouterLink>

      <div class="max-w-[520px] rounded-xl bg-warm-900/85 border border-white/10 p-7">
        <p v-if="eyebrow" class="text-xs font-semibold uppercase tracking-wider text-primary-300 mb-3">{{ eyebrow }}</p>
        <h2 class="text-white font-bold text-[1.875rem] leading-tight tracking-tight mb-3">{{ title }}</h2>
        <p class="text-warm-300 leading-relaxed">{{ text }}</p>
        <ul v-if="features?.length" class="mt-6 grid gap-2.5">
          <li v-for="f in features" :key="f" class="flex items-start gap-3 text-sm text-warm-200">
            <span class="mt-0.5 w-5 h-5 rounded-full bg-primary-600 flex items-center justify-center shrink-0 text-white">
              <AppIcon icon="check" class="w-3 h-3" />
            </span>
            {{ f }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import AppLogo from '@/components/brand/AppLogo.vue'
import AppIcon from '@/components/ui/AppIcon.vue'

withDefaults(defineProps<{
  title: string
  text: string
  eyebrow?: string
  features?: string[]
  image?: string
}>(), {
  eyebrow: '',
  features: () => [],
  image: '/images/venue-hall.jpg',
})
</script>
