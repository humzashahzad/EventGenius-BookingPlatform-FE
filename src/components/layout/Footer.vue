<template>
  <footer class="relative bg-warm-900 dark:bg-warm-950 text-warm-400">
    <div class="h-1 bg-gradient-to-r from-primary-500 via-accent to-primary-300 bg-[length:200%_100%] animate-gradient-shift" />
    <div class="content-container py-6 sm:py-8 lg:py-10">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
        <div class="lg:col-span-4">
          <RouterLink to="/" class="inline-flex items-center gap-2.5 mb-4">
            <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-primary-400 flex items-center justify-center">
              <span class="text-white font-extrabold text-sm">EG</span>
            </div>
            <span class="font-extrabold text-lg text-white tracking-tight">EventGenius</span>
          </RouterLink>
          <p class="text-sm text-warm-500 max-w-xs leading-relaxed">
            The easiest way to discover and book event venues. From weddings to conferences, we've got you covered.
          </p>
          <div class="flex gap-2 mt-5">
            <a href="#" class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-warm-500 hover:bg-primary-500/20 hover:border-primary-500/40 hover:text-primary-400 transition-colors" aria-label="Facebook">
              <AppIcon icon="brand-facebook" class="w-5 h-5" />
            </a>
            <a href="#" class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-warm-500 hover:bg-primary-500/20 hover:border-primary-500/40 hover:text-primary-400 transition-colors" aria-label="Instagram">
              <AppIcon icon="brand-instagram" class="w-5 h-5" />
            </a>
            <a href="#" class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-warm-500 hover:bg-primary-500/20 hover:border-primary-500/40 hover:text-primary-400 transition-colors" aria-label="Twitter">
              <AppIcon icon="brand-x" class="w-5 h-5" />
            </a>
          </div>
        </div>
        <div class="sm:col-span-1 lg:col-span-2">
          <h6 class="text-xs font-bold uppercase tracking-wider text-warm-500 mb-4">Platform</h6>
          <ul class="space-y-2.5">
            <li><RouterLink to="/venues" class="text-sm text-warm-500 hover:text-primary-400 transition-colors">Browse Venues</RouterLink></li>
            <li><RouterLink to="/customer/sign-up" class="text-sm text-warm-500 hover:text-primary-400 transition-colors">Create Account</RouterLink></li>
            <li><RouterLink to="/shop/sign-up" class="text-sm text-warm-500 hover:text-primary-400 transition-colors">List Your Venue</RouterLink></li>
          </ul>
        </div>
        <div class="sm:col-span-1 lg:col-span-2">
          <h6 class="text-xs font-bold uppercase tracking-wider text-warm-500 mb-4">Support</h6>
          <ul class="space-y-2.5">
            <li><RouterLink to="/customer/messages" class="text-sm text-warm-500 hover:text-primary-400 transition-colors">Contact Us</RouterLink></li>
            <li><a href="mailto:help@eventgenius.com" class="text-sm text-warm-500 hover:text-primary-400 transition-colors">help@eventgenius.com</a></li>
          </ul>
        </div>
        <div class="sm:col-span-2 lg:col-span-4">
          <h6 class="text-xs font-bold uppercase tracking-wider text-warm-500 mb-4">Stay Updated</h6>
          <p class="text-sm text-warm-500 mb-4">Get the latest venue listings and booking tips.</p>
          <div class="flex rounded-xl overflow-hidden border border-white/10 bg-white/5">
            <input type="email" placeholder="Enter your email" class="flex-1 px-4 py-3 bg-transparent text-white placeholder-warm-500 text-sm outline-none" />
            <button type="button" class="p-3 bg-gradient-to-r from-primary-500 to-primary-400 text-white hover:opacity-90 transition-opacity">
              <AppIcon icon="arrow-right" class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      <div class="mt-10 pt-6 border-t border-white/10 text-center">
        <p class="text-sm text-warm-600">&copy; {{ year }} EventGenius. All rights reserved.</p>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'

const year = new Date().getFullYear()
</script>
