<template>
  <footer class="bg-warm-900 text-warm-300 border-t border-warm-800">
    <div class="content-container pt-12 pb-8 lg:pt-14">
      <div class="grid grid-cols-2 md:grid-cols-12 gap-x-8 gap-y-10">
        <div class="col-span-2 md:col-span-5">
          <RouterLink to="/" class="inline-flex items-center gap-2.5 mb-4 rounded-md">
            <AppLogo tone="on-dark" class="w-8 h-8" />
            <span class="font-display font-bold text-lg text-white tracking-tight">EventGenius</span>
          </RouterLink>
          <p class="text-sm text-warm-400 max-w-sm leading-relaxed">
            Discover, compare and book event venues across Pakistan — from weddings to conferences — with secure online payment.
          </p>
          <ul class="mt-6 grid gap-2.5 text-sm text-warm-300">
            <li class="flex items-center gap-2.5">
              <span class="w-7 h-7 rounded-md bg-warm-800 border border-warm-700 flex items-center justify-center shrink-0"><AppIcon icon="shield-lock" class="w-4 h-4 text-primary-400" /></span>
              Verified venues and shop owners
            </li>
            <li class="flex items-center gap-2.5">
              <span class="w-7 h-7 rounded-md bg-warm-800 border border-warm-700 flex items-center justify-center shrink-0"><AppIcon icon="credit-card" class="w-4 h-4 text-primary-400" /></span>
              Secure PayFast checkout
            </li>
            <li class="flex items-center gap-2.5">
              <span class="w-7 h-7 rounded-md bg-warm-800 border border-warm-700 flex items-center justify-center shrink-0"><AppIcon icon="message" class="w-4 h-4 text-primary-400" /></span>
              Chat with venues before you book
            </li>
          </ul>
        </div>

        <nav class="md:col-span-2" aria-label="Customers">
          <h2 class="font-sans text-xs font-semibold uppercase tracking-wider text-white mb-4">Customers</h2>
          <ul class="space-y-1 text-sm">
            <li><RouterLink to="/venues" class="footer-link">Browse venues</RouterLink></li>
            <li><RouterLink to="/customer/sign-up" class="footer-link">Create account</RouterLink></li>
            <li><RouterLink to="/customer/sign-in" class="footer-link">Sign in</RouterLink></li>
          </ul>
        </nav>

        <nav class="md:col-span-2" aria-label="Venue owners">
          <h2 class="font-sans text-xs font-semibold uppercase tracking-wider text-white mb-4">Venue owners</h2>
          <ul class="space-y-1 text-sm">
            <li><RouterLink to="/shop/sign-up" class="footer-link">List your venue</RouterLink></li>
            <li><RouterLink to="/shop/sign-in" class="footer-link">Shop sign in</RouterLink></li>
          </ul>
        </nav>

        <nav class="col-span-2 md:col-span-3" aria-label="Support">
          <h2 class="font-sans text-xs font-semibold uppercase tracking-wider text-white mb-4">Support</h2>
          <ul class="space-y-1 text-sm">
            <li><RouterLink to="/customer/messages" class="footer-link">Message support</RouterLink></li>
            <li><RouterLink to="/forgot-password" class="footer-link">Reset your password</RouterLink></li>
          </ul>
        </nav>
      </div>

      <div class="mt-12 pt-6 border-t border-warm-800 flex flex-col sm:flex-row gap-2 sm:items-center justify-between text-xs text-warm-400">
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

<style scoped>
.footer-link {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  color: #d6d3d1;
  transition: color .15s ease;
}
.footer-link:hover { color: #fff; text-decoration: underline; text-underline-offset: 3px; }
</style>
