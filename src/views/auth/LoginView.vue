<template>
  <div class="fixed inset-0 overflow-hidden overscroll-none flex items-center justify-center bg-warm-100 dark:bg-warm-950 p-3 sm:p-6">
    <div class="w-full h-full max-h-full flex rounded-3xl overflow-hidden shadow-elevated bg-warm-50 dark:bg-warm-900">
      <!-- Left: Brand panel (desktop) -->
      <div class="hidden lg:flex lg:w-[58%] xl:w-[66%] items-center justify-center relative bg-gradient-to-br from-primary-800 via-primary-700 to-primary-600 overflow-hidden rounded-3xl m-2">
        <PixelCanvas ref="canvasRef" variant="glow" />

        <div class="absolute top-0 right-0 w-[350px] h-[350px] rounded-full bg-primary-400/30 blur-[80px] -translate-y-20 translate-x-10" />
        <div class="absolute bottom-0 left-0 w-[250px] h-[250px] rounded-full bg-accent/20 blur-[80px] translate-y-10 -translate-x-10" />
        <div class="relative z-10 max-w-[480px] px-8">
          <div class="flex items-center gap-3 mb-8">
            <div class="w-11 h-11 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-sm">
              <AppIcon icon="calendar-event" class="w-5 h-5 text-white" />
            </div>
            <div>
              <p class="text-primary-200 font-extrabold uppercase text-xs tracking-widest">EventGenius</p>
              <p class="text-white font-semibold opacity-80">Booking Platform</p>
            </div>
          </div>
          <h2 class="text-white font-bold text-3xl tracking-tight mb-4">Discover, book, and manage venues with ease.</h2>
          <p class="text-white/60 leading-relaxed mb-8">EventGenius connects clients with top venues across Pakistan. Browse hundreds of spaces, check availability, and confirm bookings in minutes.</p>
          <div class="flex flex-col gap-3">
            <div v-for="f in features" :key="f" class="flex items-center gap-3">
              <span class="w-6 h-6 rounded-full bg-primary-400/20 border border-primary-400/30 flex items-center justify-center shrink-0 text-primary-300">
                <AppIcon icon="check" class="w-3 h-3" />
              </span>
              <span class="text-white/75 text-sm">{{ f }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Form -->
      <div class="flex-1 flex overflow-y-auto overscroll-contain p-4 sm:p-12">
        <div class="w-full max-w-[400px] m-auto">
        <div class="lg:hidden flex items-center gap-2 mb-4 sm:mb-6 [@media(max-height:600px)]:hidden">
          <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-primary-400 flex items-center justify-center">
            <span class="text-white font-bold text-sm">EG</span>
          </div>
          <span class="font-bold text-warm-800 dark:text-white">EventGenius</span>
        </div>

        <RouterLink to="/" class="flex w-fit items-center gap-1.5 text-sm text-warm-500 hover:text-primary-600 dark:text-warm-400 mb-5 sm:mb-8">
          <AppIcon icon="arrow-left" class="w-4 h-4" /> Back to EventGenius
        </RouterLink>
        <span class="badge-primary mb-3">{{ portalCopy.badge }}</span>
        <h1 class="text-2xl font-bold tracking-tight text-warm-900 dark:text-white mb-1">{{ portalCopy.title }}</h1>
        <p class="text-warm-500 dark:text-warm-400 mb-6">{{ portalCopy.subtitle }}</p>

        <form @submit.prevent="handleLogin" class="space-y-5">
          <div>
            <label for="login-email" class="form-label">Email address</label>
            <input
              v-model="form.email"
              type="email"
              id="login-email"
              required
              class="form-input"
              placeholder="you@example.com"
              autocomplete="email"
            />
          </div>

          <div>
            <div class="flex justify-between items-center mb-1.5">
              <label for="login-password" class="block text-sm font-medium text-warm-700 dark:text-warm-300">Password</label>
              <RouterLink :to="forgotPasswordLink" class="text-sm font-medium text-primary-600 hover:text-primary-700">Forgot password?</RouterLink>
            </div>
            <div class="flex rounded-xl border border-warm-300 dark:border-warm-600 overflow-hidden bg-white dark:bg-warm-800 focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-500 transition-all duration-200">
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                id="login-password"
                required
                class="flex-1 px-4 py-2.5 bg-transparent text-warm-800 dark:text-warm-100 placeholder-warm-400 dark:placeholder-warm-500 outline-none"
                placeholder="••••••••••••"
                autocomplete="current-password"
              />
              <button
                type="button"
                class="px-3 text-warm-500 hover:text-warm-700 dark:hover:text-warm-300 transition-colors"
                @click="showPassword = !showPassword"
              >
                <AppIcon :icon="showPassword ? 'eye' : 'eye-off'" class="w-5 h-5" />
              </button>
            </div>
          </div>

          <div v-if="error" class="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-coral dark:text-red-300 text-sm">
            <AppIcon icon="alert-triangle" class="w-5 h-5 shrink-0" />
            <span>{{ error }}</span>
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full py-3 rounded-xl font-semibold text-white bg-primary-500 hover:bg-primary-600 focus:ring-2 focus:ring-primary-500/20 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 shadow-soft hover:shadow-card"
          >
            <span v-if="loading" class="inline-flex items-center justify-center gap-2">
              <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Signing in...
            </span>
            <span v-else>Sign In</span>
          </button>
        </form>

        <p v-if="portal !== 'support'" class="mt-6 text-center text-sm text-warm-500 dark:text-warm-400">
          Don't have an account?
          <RouterLink :to="{ path: registerPath, query: route.query.redirect ? { redirect: route.query.redirect } : {} }" class="ml-1 font-semibold text-primary-600 hover:text-primary-700">Create one</RouterLink>
        </p>
        <p v-if="portal === 'customer'" class="mt-3 text-center text-xs text-warm-400">
          Own a venue? <RouterLink to="/shop/sign-in" class="font-semibold text-warm-600 dark:text-warm-300 hover:text-primary-600">Sign in to the shop portal</RouterLink>
        </p>
        <p v-else-if="portal === 'shop'" class="mt-3 text-center text-xs text-warm-400">
          Booking an event? <RouterLink to="/customer/sign-in" class="font-semibold text-warm-600 dark:text-warm-300 hover:text-primary-600">Sign in as a customer</RouterLink>
        </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink, useRouter, useRoute } from 'vue-router'
import { toast } from 'vue-sonner'
import { useAuthStore } from '@/stores/auth'
import AppIcon from '@/components/ui/AppIcon.vue'
import PixelCanvas from '@/components/ui/PixelCanvas.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const portal = computed(() => (route.meta.portal as string) ?? 'customer')
const portalCopy = computed(() => ({
  customer: { badge: 'Customer', title: 'Welcome back', subtitle: 'Sign in to book venues and manage your events.' },
  shop: { badge: 'Venue owner', title: 'Sign in to your shop', subtitle: 'Manage your venues, bookings and customers.' },
  support: { badge: 'Administrator', title: 'Admin sign in', subtitle: 'Restricted to EventGenius staff.' },
}[portal.value as 'customer' | 'shop' | 'support'] ?? { badge: 'Customer', title: 'Welcome back', subtitle: '' }))
const registerPath = computed(() => (portal.value === 'shop' ? '/shop/sign-up' : '/customer/sign-up'))
const forgotPasswordLink = computed(() => {
  const p = portal.value
  if (p === 'shop') return '/forgot-password?from=shop'
  if (p === 'support') return '/forgot-password?from=support'
  return '/forgot-password?from=customer'
})

/** Internal path from ?redirect=, if it is reachable from this portal. */
function safeRedirect(): string | null {
  const r = route.query.redirect
  if (typeof r !== 'string' || !r.startsWith('/') || r.startsWith('//')) return null
  const target = r.startsWith('/support') ? 'support' : r.startsWith('/shop') ? 'shop' : 'customer'
  // Must match the account that actually signed in (a shop owner using the
  // customer page goes to the shop dashboard, not a customer-only page).
  const role = authStore.user?.role
  const accountPortal = role === 'admin' ? 'support' : role === 'store_owner' ? 'shop' : 'customer'
  return target === portal.value && target === accountPortal ? r : null
}

const form = ref({ email: '', password: '' })
const error = ref('')
const loading = ref(false)
const showPassword = ref(false)

const canvasRef = ref<InstanceType<typeof PixelCanvas> | null>(null)

const features = [
  'Browse hundreds of verified venues across Pakistan',
  'Real-time availability and instant booking confirmation',
  'Manage all your venues, galleries and bookings in one place',
]

async function handleLogin() {
  loading.value = true
  error.value = ''
  const result = await authStore.login(form.value.email, form.value.password)
  
  if (result.success) {
    canvasRef.value?.triggerPulse('success')
    // Wait for the pulse animation slightly before redirecting
    setTimeout(async () => {
      loading.value = false
      const destination = safeRedirect() ?? result.redirectTo ?? authStore.defaultRoute
      toast.success('Signed in successfully.')
      try {
        await router.replace(destination)
      } catch {
        window.location.href = router.resolve(destination).fullPath
      }
    }, 600)
  } else {
    loading.value = false
    error.value = result.message || 'Login failed. Please check your credentials.'
    
    const errStr = (error.value + ' ' + JSON.stringify(result.errors || {})).toLowerCase()
    // If it's specifically a password warning (and not a "user not found" scenario)
    if (errStr.includes('password') && !errStr.includes('user not found') && !errStr.includes('email')) {
      canvasRef.value?.triggerPulse('warning')
    } else {
      canvasRef.value?.triggerPulse('error')
    }
    
    toast.error(error.value)
  }
}
</script>
