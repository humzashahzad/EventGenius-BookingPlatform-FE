<template>
  <div class="fixed inset-0 overflow-hidden overscroll-none flex items-center justify-center bg-warm-100 dark:bg-warm-950 p-3 sm:p-6">
    <div class="w-full h-full max-h-full flex rounded-3xl overflow-hidden shadow-elevated bg-warm-50 dark:bg-warm-900">
      <!-- Left: Brand Panel (desktop) -->
      <AuthPhotoPanel
        eyebrow="Create your account"
        title="Start your journey with us today."
        text="Whether you're booking your next event or listing your venue, EventGenius makes it effortless." :features="features"
      />

      <!-- Right: Form -->
      <div class="flex-1 flex overflow-y-auto overscroll-contain p-4 sm:p-12">
        <div class="w-full max-w-[400px] m-auto">
        <div class="lg:hidden flex items-center gap-2 mb-8">
          <AppLogo class="w-9 h-9" />
          <span class="font-bold text-warm-800 dark:text-white">EventGenius</span>
        </div>

        <RouterLink to="/" class="inline-flex items-center gap-1.5 text-sm text-warm-500 hover:text-primary-600 dark:text-warm-400 mb-8">

          <AppIcon icon="arrow-left" class="w-4 h-4" /> Back to EventGenius

        </RouterLink>

        <h1 class="text-2xl font-bold tracking-tight text-warm-900 dark:text-white mb-1">Create your account</h1>
        <p class="text-warm-500 dark:text-warm-400 mb-6">
          {{ portal === 'shop' ? 'Register as a store owner to list your venues.' : 'Join EventGenius to browse and book venues.' }}
        </p>

        <form @submit.prevent="handleRegister" class="space-y-4">
          <div>
            <label class="form-label">Full Name</label>
            <input v-model="form.name" type="text" required class="form-input" placeholder="John Doe" autocomplete="name" />
            <p v-if="errors.name" class="mt-1 text-sm text-coral">{{ errors.name[0] }}</p>
          </div>

          <div>
            <label class="form-label">Email Address</label>
            <input v-model="form.email" type="email" required class="form-input" placeholder="you@example.com" autocomplete="email" />
            <p v-if="errors.email" class="mt-1 text-sm text-coral">{{ errors.email[0] }}</p>
          </div>

          <div v-if="portal === 'shop'">
            <label class="form-label">Store Name</label>
            <input v-model="form.store_name" type="text" required class="form-input" placeholder="My Venue Co." />
            <p v-if="errors.store_name" class="mt-1 text-sm text-coral">{{ errors.store_name[0] }}</p>
          </div>

          <div>
            <label class="form-label">Password</label>
            <div class="flex rounded-xl border border-warm-300 dark:border-warm-600 overflow-hidden bg-white dark:bg-warm-800 focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-500 transition-all duration-200">
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                required
                class="flex-1 px-4 py-2.5 bg-transparent text-warm-800 dark:text-warm-100 placeholder-warm-400 dark:placeholder-warm-500 outline-none"
                placeholder="Min. 8 characters"
                autocomplete="new-password"
              />
              <button
                type="button"
                class="px-3 text-warm-500 hover:text-warm-700 dark:hover:text-warm-300 transition-colors"
                @click="showPassword = !showPassword"
              >
                <AppIcon :icon="showPassword ? 'eye' : 'eye-off'" class="w-5 h-5" />
              </button>
            </div>
            <p v-if="errors.password" class="mt-1 text-sm text-coral">{{ errors.password[0] }}</p>
          </div>

          <div>
            <label class="form-label">Confirm Password</label>
            <input
              v-model="form.password_confirmation"
              :type="showPassword ? 'text' : 'password'"
              required
              class="form-input"
              placeholder="Repeat password"
              autocomplete="new-password"
            />
          </div>

          <div v-if="errorMsg" class="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-coral dark:text-red-300 text-sm">
            <AppIcon icon="alert-triangle" class="w-5 h-5 shrink-0" />
            <span>{{ errorMsg }}</span>
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full py-3 rounded-xl font-semibold text-white bg-primary-500 hover:bg-primary-600 focus:ring-2 focus:ring-primary-500/20 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 shadow-soft hover:shadow-card"
          >
            <span v-if="loading" class="inline-flex items-center justify-center gap-2">
              <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Creating account...
            </span>
            <span v-else>Create Account</span>
          </button>
        </form>

        <p class="mt-6 text-center text-sm text-warm-500 dark:text-warm-400">
          Already have an account?
          <RouterLink :to="loginPath" class="ml-1 font-semibold text-primary-600 hover:text-primary-700">Sign in</RouterLink>
        </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppLogo from '@/components/brand/AppLogo.vue'
import { ref, reactive, computed } from 'vue'
import { RouterLink, useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppIcon from '@/components/ui/AppIcon.vue'
import AuthPhotoPanel from '@/components/auth/AuthPhotoPanel.vue'

const router    = useRouter()
const route     = useRoute()
const authStore = useAuthStore()

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

  if (result.success) {
    setTimeout(() => {
      loading.value = false
      // Customers who signed up mid-booking go straight back to it.
      const r = route.query.redirect
      const back = typeof r === 'string' && r.startsWith('/') && !r.startsWith('//') && portal.value === 'customer' && !r.startsWith('/shop') && !r.startsWith('/support') ? r : null
      router.push(back ?? authStore.defaultRoute)
    }, 600)
  } else {
    loading.value = false
    if (result.errors) Object.assign(errors, result.errors)
    else errorMsg.value = result.message || 'Registration failed. Please try again.'
  }
}
</script>
