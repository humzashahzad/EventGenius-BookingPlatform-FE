<template>
  <footer class="bg-warm-900 dark:bg-warm-950 text-warm-400 border-t border-warm-800">
    <div class="content-container py-10 lg:py-12">
      <div class="grid grid-cols-2 md:grid-cols-12 gap-8">
        <div class="col-span-2 md:col-span-5">
          <RouterLink to="/" class="inline-flex items-center gap-2.5 mb-4">
            <AppLogo tone="on-dark" class="w-9 h-9" />
            <span class="font-extrabold text-lg text-white tracking-tight">EventGenius</span>
          </RouterLink>
          <p class="text-sm text-warm-400 max-w-sm leading-relaxed">
            Discover, compare and book event venues across Pakistan — from weddings to conferences — with secure online payment.
          </p>
          <div class="flex flex-wrap gap-4 mt-5 text-xs text-warm-500">
            <span class="inline-flex items-center gap-1.5"><AppIcon icon="shield" class="w-4 h-4 text-primary-400" />Verified venues</span>
            <span class="inline-flex items-center gap-1.5"><AppIcon icon="credit-card" class="w-4 h-4 text-primary-400" />Secure PayFast checkout</span>
          </div>
        </div>

        <nav class="md:col-span-2" aria-label="Customers">
          <h2 class="text-xs font-bold uppercase tracking-wider text-warm-300 mb-4">Customers</h2>
          <ul class="space-y-2.5 text-sm">
            <li><RouterLink to="/venues" class="hover:text-primary-400 transition-colors">Browse venues</RouterLink></li>
            <li><RouterLink to="/customer/sign-up" class="hover:text-primary-400 transition-colors">Create account</RouterLink></li>
            <li><RouterLink to="/customer/sign-in" class="hover:text-primary-400 transition-colors">Sign in</RouterLink></li>
          </ul>
        </nav>

        <nav class="md:col-span-2" aria-label="Venue owners">
          <h2 class="text-xs font-bold uppercase tracking-wider text-warm-300 mb-4">Venue owners</h2>
          <ul class="space-y-2.5 text-sm">
            <li><RouterLink to="/shop/sign-up" class="hover:text-primary-400 transition-colors">List your venue</RouterLink></li>
            <li><RouterLink to="/shop/sign-in" class="hover:text-primary-400 transition-colors">Shop sign in</RouterLink></li>
          </ul>
        </nav>

        <nav class="col-span-2 md:col-span-3" aria-label="Support">
          <h2 class="text-xs font-bold uppercase tracking-wider text-warm-300 mb-4">Support</h2>
          <ul class="space-y-2.5 text-sm">
            <li><RouterLink to="/customer/messages" class="hover:text-primary-400 transition-colors">Message support</RouterLink></li>
            <li><RouterLink to="/forgot-password" class="hover:text-primary-400 transition-colors">Reset your password</RouterLink></li>
          </ul>
        </nav>
      </div>

      <div class="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row gap-2 items-center justify-between text-xs text-warm-500">
        <p>&copy; {{ year }} EventGenius. All rights reserved.</p>
        <p>Final Year Project · Payments run in PayFast sandbox mode</p>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import AppLogo from '@/components/brand/AppLogo.vue'
import { RouterLink } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'

const year = new Date().getFullYear()
</script>
