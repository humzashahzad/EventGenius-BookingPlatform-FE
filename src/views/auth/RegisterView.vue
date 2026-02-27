<template>
  <div class="min-h-screen flex">
    <!-- Left Panel -->
    <div class="hidden lg:flex lg:w-3/5 relative flex-col" style="background: linear-gradient(135deg, var(--color-bg) 0%, var(--color-bg-elevated) 50%, var(--color-bg-card) 100%);">
      <!-- Logo -->
      <div class="absolute top-8 left-10 flex items-center gap-2.5">
        <div class="w-9 h-9 rounded-lg flex items-center justify-center shadow-md" style="background: var(--color-primary);">
          <svg class="w-5 h-5" style="color: #1a1a00;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
        </div>
        <div>
          <p class="text-xs font-bold tracking-widest uppercase leading-none" style="color: var(--color-primary);">EventGenius</p>
          <p class="text-base font-bold leading-tight" style="color: var(--color-text);">Booking Platform</p>
        </div>
      </div>

      <!-- Center content -->
      <div class="flex-1 flex flex-col justify-center px-16 pb-16">
        <p class="text-xs font-semibold tracking-widest uppercase mb-4" style="color: var(--color-primary);">Join EventGenius</p>
        <h1 class="text-4xl font-bold leading-tight mb-5" style="color: var(--color-text);">
          Start your journey<br>with us today.
        </h1>
        <p class="text-base leading-relaxed max-w-sm" style="color: var(--color-text-secondary);">
          Whether you're booking your next event or listing your venue, EventGenius makes it effortless.
        </p>
        <div class="mt-10 space-y-3">
          <div v-for="f in features" :key="f" class="flex items-center gap-3">
            <div class="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style="background: rgba(245,158,11,0.15);">
              <svg class="w-3 h-3" style="color: var(--color-primary);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <span class="text-sm" style="color: var(--color-text-secondary);">{{ f }}</span>
          </div>
        </div>
      </div>

      <!-- Version -->
      <div class="absolute bottom-8 left-10 flex items-center gap-2">
        <div class="w-7 h-7 rounded-full flex items-center justify-center" style="background: var(--color-primary);">
          <span class="text-2xs font-bold" style="color: #1a1a00;">EG</span>
        </div>
        <span class="text-xs font-mono tracking-wider uppercase" style="color: var(--color-text-muted);">Version 1.0.0</span>
      </div>
    </div>

    <!-- Right Panel -->
    <div class="w-full lg:w-2/5 flex flex-col items-center justify-center px-8 py-12" style="background: var(--color-bg-card);">
      <!-- Mobile logo -->
      <div class="lg:hidden flex items-center gap-2 mb-10">
        <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background: var(--color-primary);">
          <svg class="w-4 h-4" style="color: #1a1a00;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
        </div>
        <span class="text-lg font-bold" style="color: var(--color-text);">EventGenius</span>
      </div>

      <div class="w-full max-w-sm">
        <div class="login-card-theme">
          <div class="mb-6">
            <h2 class="text-xl font-bold" style="color: var(--color-text);">Create your account</h2>
            <p class="text-sm mt-1.5" style="color: var(--color-text-secondary);">
              {{ portal === 'shop' ? 'Register as a store owner to list your venues.' : 'Join EventGenius to browse and book venues.' }}
            </p>
          </div>

          <form @submit.prevent="handleRegister" class="space-y-4">
            <!-- Full name -->
            <div>
              <label class="form-label">Full Name</label>
              <input v-model="form.name" type="text" required class="form-input" placeholder="John Doe" autocomplete="name" />
              <p v-if="errors.name" class="text-xs text-danger-600 mt-1">{{ errors.name[0] }}</p>
            </div>

            <!-- Email -->
            <div>
              <label class="form-label">Email Address</label>
              <input v-model="form.email" type="email" required class="form-input" placeholder="you@example.com" autocomplete="email" />
              <p v-if="errors.email" class="text-xs text-danger-600 mt-1">{{ errors.email[0] }}</p>
            </div>

            <!-- Store name (store portal only) -->
            <div v-if="portal === 'shop'">
              <label class="form-label">Store Name</label>
              <input v-model="form.store_name" type="text" required class="form-input" placeholder="My Venue Co." />
              <p v-if="errors.store_name" class="text-xs text-danger-600 mt-1">{{ errors.store_name[0] }}</p>
            </div>

            <!-- Password -->
            <div>
              <label class="form-label">Password</label>
              <div class="relative">
                <input v-model="form.password" :type="showPassword ? 'text' : 'password'" required
                  class="form-input pr-10" placeholder="Min. 8 characters" autocomplete="new-password" />
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
              <p v-if="errors.password" class="text-xs text-danger-600 mt-1">{{ errors.password[0] }}</p>
            </div>

            <!-- Confirm password -->
            <div>
              <label class="form-label">Confirm Password</label>
              <input v-model="form.password_confirmation" :type="showPassword ? 'text' : 'password'"
                required class="form-input" placeholder="Repeat password" autocomplete="new-password" />
            </div>

            <!-- Error alert -->
            <div v-if="errorMsg" class="flex items-start gap-2.5 text-sm text-danger-700 bg-danger-50 border border-danger-200 rounded-lg px-3.5 py-3">
              <svg class="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              {{ errorMsg }}
            </div>

            <!-- Submit -->
            <button type="submit" :disabled="loading" class="btn-theme-primary w-full justify-center">
              <svg v-if="loading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              {{ loading ? 'Creating account…' : 'Create Account' }}
            </button>
          </form>

          <p class="text-center text-sm mt-6" style="color: var(--color-text-secondary);">
            Already have an account?
            <RouterLink :to="loginPath" class="font-semibold" style="color: var(--color-primary);">Sign in</RouterLink>
          </p>
        </div>

        <!-- Footer -->
        <p class="text-center text-xs font-mono tracking-wider uppercase mt-6" style="color: var(--color-text-muted);">
          &copy; {{ year }} EventGenius. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { RouterLink, useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router    = useRouter()
const route     = useRoute()
const authStore = useAuthStore()
const year      = new Date().getFullYear()

const portal    = computed(() => (route.meta.portal as string) ?? 'customer')
const loginPath = computed(() => portal.value === 'shop' ? '/shop/sign-in' : '/customer/sign-in')

const loading      = ref(false)
const errorMsg     = ref('')
const showPassword = ref(false)
const errors       = reactive<Record<string, string[]>>({})

const form = reactive({
  name:                  '',
  email:                 '',
  store_name:            '',
  password:              '',
  password_confirmation: '',
})

const features = [
  'Free to join as a client or store owner',
  'Manage bookings, venues, and your profile in one place',
  'Real-time booking and venue management',
]

async function handleRegister() {
  loading.value = true
  errorMsg.value = ''
  Object.keys(errors).forEach(k => delete (errors as any)[k])

  const payload: Record<string, string> = {
    name:                  form.name,
    email:                 form.email,
    password:              form.password,
    password_confirmation: form.password_confirmation,
    role:                  portal.value === 'shop' ? 'store_owner' : 'client',
  }
  if (portal.value === 'shop') {
    payload.store_name = form.store_name
  }

  const result = await authStore.register(payload)
  loading.value = false

  if (result.success) {
    router.push(authStore.defaultRoute)
  } else {
    if (result.errors) Object.assign(errors, result.errors)
    else errorMsg.value = result.message || 'Registration failed. Please try again.'
  }
}
</script>
