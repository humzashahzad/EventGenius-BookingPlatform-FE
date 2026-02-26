<template>
  <div class="min-h-screen flex">
    <!-- Left Panel -->
    <div class="hidden lg:flex lg:w-3/5 relative flex-col" style="background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 50%, #ede9fe 100%);">
      <!-- Logo -->
      <div class="absolute top-8 left-10 flex items-center gap-2.5">
        <div class="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center shadow-md">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
        </div>
        <div>
          <p class="text-xs font-bold tracking-widest text-primary-500 uppercase leading-none">EventGenius</p>
          <p class="text-base font-bold text-surface-800 leading-tight">Booking Platform</p>
        </div>
      </div>

      <!-- Center content -->
      <div class="flex-1 flex flex-col justify-center px-16 pb-16">
        <p class="text-xs font-semibold tracking-widest text-primary-500 uppercase mb-4">Venue Booking Platform</p>
        <h1 class="text-4xl font-bold text-surface-900 leading-tight mb-5">
          Discover, book, and<br>manage venues with ease.
        </h1>
        <p class="text-surface-500 text-base leading-relaxed max-w-sm">
          EventGenius connects clients with top venues across Pakistan. Browse hundreds of spaces, check availability, and confirm bookings in minutes.
        </p>

        <!-- Feature bullets -->
        <div class="mt-10 space-y-3">
          <div v-for="f in features" :key="f" class="flex items-center gap-3">
            <div class="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
              <svg class="w-3 h-3 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <span class="text-sm text-surface-600">{{ f }}</span>
          </div>
        </div>
      </div>

      <!-- Version -->
      <div class="absolute bottom-8 left-10 flex items-center gap-2">
        <div class="w-7 h-7 rounded-full bg-surface-800 flex items-center justify-center">
          <span class="text-2xs font-bold text-white">EG</span>
        </div>
        <span class="text-xs text-surface-400 font-mono tracking-wider uppercase">Version 1.0.0</span>
      </div>
    </div>

    <!-- Right Panel -->
    <div class="w-full lg:w-2/5 bg-white flex flex-col items-center justify-center px-8 py-12">
      <!-- Mobile logo -->
      <div class="lg:hidden flex items-center gap-2 mb-10">
        <div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
        </div>
        <span class="text-lg font-bold text-surface-800">EventGenius</span>
      </div>

      <!-- Login card -->
      <div class="w-full max-w-sm">
        <div class="login-card-theme">
          <div class="mb-7">
            <h2 class="text-xl font-bold text-surface-900">Sign in to your account</h2>
            <p class="text-sm text-surface-500 mt-1.5">Continue to manage your venues and bookings.</p>
          </div>

          <form @submit.prevent="handleLogin" class="space-y-5">
            <!-- Email -->
            <div>
              <label class="form-label">Email address</label>
              <input
                v-model="form.email"
                type="email"
                required
                class="form-input"
                placeholder="you@example.com"
                autocomplete="email"
              />
            </div>

            <!-- Password -->
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="form-label mb-0">Password</label>
                <RouterLink :to="forgotPasswordLink" class="text-xs text-primary-600 hover:text-primary-700 font-medium">
                  Forgot password?
                </RouterLink>
              </div>
              <div class="relative">
                <input
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  required
                  class="form-input pr-10"
                  placeholder="••••••••"
                  autocomplete="current-password"
                />
                <button type="button" @click="showPassword = !showPassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors">
                  <svg v-if="!showPassword" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  </svg>
                  <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Error -->
            <div v-if="error" class="flex items-start gap-2.5 text-sm text-danger-700 bg-danger-50 border border-danger-200 rounded-lg px-3.5 py-3">
              <svg class="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              {{ error }}
            </div>

            <!-- Submit -->
            <button type="submit" :disabled="loading" class="btn-theme-primary w-full justify-center">
              <svg v-if="loading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              {{ loading ? 'Signing in…' : 'Sign In' }}
            </button>
          </form>

          <p v-if="portal !== 'admin'" class="text-center text-sm text-surface-500 mt-6">
            Don't have an account?
            <RouterLink :to="registerPath" class="text-primary-600 hover:text-primary-700 font-semibold">Register</RouterLink>
          </p>
        </div>

        <!-- Footer -->
        <p class="text-center text-xs text-surface-400 font-mono tracking-wider uppercase mt-6">
          &copy; {{ year }} EventGenius. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink, useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router    = useRouter()
const route     = useRoute()
const authStore = useAuthStore()

const portal = computed(() => (route.meta.portal as string) ?? 'client')
const registerPath = computed(() =>
  portal.value === 'store' ? '/store/sign-up' : '/client/sign-up'
)
const forgotPasswordLink = computed(() => {
  const p = portal.value
  if (p === 'store') return '/forgot-password?from=store'
  if (p === 'admin') return '/forgot-password?from=admin'
  return '/forgot-password?from=client'
})

const form         = ref({ email: '', password: '' })
const error        = ref('')
const loading      = ref(false)
const showPassword = ref(false)
const year         = new Date().getFullYear()

const features = [
  'Browse hundreds of verified venues across Pakistan',
  'Real-time availability and instant booking confirmation',
  'Manage all your venues, galleries and bookings in one place',
]

async function handleLogin() {
  loading.value = true
  error.value   = ''
  const result  = await authStore.login(form.value.email, form.value.password)
  loading.value = false
  if (result.success) {
    router.push(authStore.defaultRoute)
  } else {
    error.value = result.message || 'Login failed. Please check your credentials.'
  }
}
</script>
