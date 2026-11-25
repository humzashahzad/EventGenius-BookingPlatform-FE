<template>
  <!-- Shared frame for sign-in / sign-up / password pages.
       The page itself never scrolls (fixed inset-0); on short phones only the
       form panel scrolls. Desktop adds the venue photo panel on the left. -->
  <div class="fixed inset-0 overflow-hidden overscroll-none flex bg-canvas sm:p-3 lg:p-4">
    <div class="w-full h-full max-h-full flex overflow-hidden bg-surface sm:rounded-2xl sm:border sm:border-line sm:shadow-sm">
      <AuthPhotoPanel :eyebrow="panelEyebrow" :title="panelTitle" :text="panelText" :features="features" />

      <div class="flex-1 min-w-0 flex flex-col overflow-y-auto overscroll-contain">
        <!-- Top row: logo (mobile) + back link -->
        <div class="flex items-center justify-between gap-3 px-5 pt-4 sm:px-10 sm:pt-8 lg:justify-end">
          <RouterLink to="/" class="lg:hidden inline-flex items-center gap-2 rounded-md">
            <AppLogo class="w-8 h-8" />
            <span class="font-display font-bold text-ink">EventGenius</span>
          </RouterLink>
          <RouterLink to="/" class="btn-ghost btn-sm -mr-2">
            <AppIcon icon="arrow-left" class="w-4 h-4" />
            <span class="hidden min-[380px]:inline">Back to site</span>
            <span class="min-[380px]:hidden">Back</span>
          </RouterLink>
        </div>

        <div class="flex-1 flex px-5 pb-6 pt-4 sm:px-10 sm:pb-10">
          <main class="w-full max-w-[400px] m-auto">
            <span v-if="badge" class="badge-confirmed mb-3">
              <AppIcon v-if="badgeIcon" :icon="badgeIcon" class="w-3.5 h-3.5 -ml-0.5" />{{ badge }}
            </span>
            <h1 class="font-display text-2xl sm:text-[1.75rem] font-bold tracking-tight text-ink leading-tight">{{ heading }}</h1>
            <p v-if="subheading" class="mt-1.5 text-sm sm:text-base text-ink-muted">{{ subheading }}</p>
            <div class="mt-5 sm:mt-7">
              <slot />
            </div>
            <div v-if="$slots.footer" class="mt-6 space-y-2 text-center text-sm text-ink-muted">
              <slot name="footer" />
            </div>
          </main>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import AppLogo from '@/components/brand/AppLogo.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import AuthPhotoPanel from '@/components/auth/AuthPhotoPanel.vue'

withDefaults(defineProps<{
  heading: string
  subheading?: string
  badge?: string
  badgeIcon?: string
  panelEyebrow?: string
  panelTitle: string
  panelText: string
  features?: string[]
}>(), {
  subheading: '',
  badge: '',
  badgeIcon: '',
  panelEyebrow: '',
  features: () => [],
})
</script>
