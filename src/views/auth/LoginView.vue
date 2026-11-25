<template>
  <AuthShell
    :badge="portalCopy.badge"
    :badge-icon="portalCopy.icon"
    :heading="portalCopy.title"
    :subheading="portalCopy.subtitle"
    :panel-eyebrow="portalCopy.panelEyebrow"
    :panel-title="portalCopy.panelTitle"
    :panel-text="portalCopy.panelText"
    :features="portalCopy.features"
  >
    <form class="space-y-4" novalidate @submit.prevent="onSubmit">
      <FormField id="login-email" label="Email address" :error="emailError">
        <TextInput v-model="form.email" type="email" required placeholder="you@example.com" autocomplete="email" inputmode="email" @blur="touched.email = true" />
      </FormField>

      <PasswordField
        id="login-password"
        v-model="form.password"
        label="Password"
        placeholder="Your password"
        autocomplete="current-password"
        required
        :error="passwordError"
        @blur="touched.password = true"
      >
        <template #label-extra>
          <RouterLink :to="forgotPasswordLink" class="link text-sm">Forgot password?</RouterLink>
        </template>
      </PasswordField>

      <div v-if="error" class="alert-danger" role="alert">
        <AppIcon icon="alert-triangle" class="w-5 h-5 shrink-0" />
        <p>{{ error }}</p>
      </div>

      <button type="submit" :disabled="loading" class="btn-primary btn-lg btn-block">
        <span v-if="loading" class="spinner-border spinner-border-sm" aria-hidden="true"></span>
        {{ loading ? 'Signing in…' : portalCopy.cta }}
      </button>
    </form>

    <template #footer>
      <p v-if="portal !== 'support'">
        {{ portal === 'shop' ? 'New to EventGenius?' : "Don't have an account?" }}
        <RouterLink :to="{ path: registerPath, query: route.query.redirect ? { redirect: route.query.redirect } : {} }" class="link ml-1">
          {{ portal === 'shop' ? 'List your venue' : 'Create an account' }}
        </RouterLink>
      </p>
      <div class="pt-3 border-t border-line text-xs">
        <p v-if="portal === 'customer'">
          Own a venue? <RouterLink to="/shop/sign-in" class="link">Sign in to the shop portal</RouterLink>
        </p>
        <p v-else-if="portal === 'shop'">
          Booking an event? <RouterLink to="/customer/sign-in" class="link">Sign in as a customer</RouterLink>
        </p>
        <p v-else>
          Not EventGenius staff? <RouterLink to="/customer/sign-in" class="link">Customer sign in</RouterLink>
        </p>
      </div>
    </template>
  </AuthShell>
</template>

<script setup lang="ts">
import { FormField, TextInput } from '@/components/forms'
import { ref, reactive, computed } from 'vue'
import { hrefFor } from '@/lib/portalHost'
import { RouterLink, useRouter, useRoute } from 'vue-router'
import { toast } from 'vue-sonner'
import { useAuthStore } from '@/stores/auth'
import AppIcon from '@/components/ui/AppIcon.vue'
import AuthShell from '@/components/auth/AuthShell.vue'
import PasswordField from '@/components/auth/PasswordField.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const portal = computed(() => (route.meta.portal as string) ?? 'customer')
const COPY = {
  customer: {
    badge: 'Customer', icon: 'user', title: 'Welcome back', cta: 'Sign in',
    subtitle: 'Sign in to book venues and manage your events.',
    panelEyebrow: 'Venue booking across Pakistan',
    panelTitle: 'Discover, book and manage venues with ease.',
    panelText: 'Browse halls, marquees and lawns in your city, check live availability and confirm bookings in minutes.',
    features: ['Verified venues in Lahore, Karachi, Islamabad and more', 'Real-time availability and instant confirmation', 'Pay securely and track every booking in one place'],
  },
  shop: {
    badge: 'Venue owner', icon: 'building-store', title: 'Sign in to your shop', cta: 'Sign in to shop',
    subtitle: 'Manage your venues, bookings and customers.',
    panelEyebrow: 'For venue owners',
    panelTitle: 'Fill your calendar with the right events.',
    panelText: 'List your halls and lawns, reply to booking requests and get paid, all from one dashboard.',
    features: ['Accept or decline requests in one tap', 'Galleries, pricing and amenities per venue', 'Payouts and reviews tracked automatically'],
  },
  support: {
    badge: 'Administrator', icon: 'shield-lock', title: 'Admin sign in', cta: 'Sign in to support',
    subtitle: 'Restricted to EventGenius staff.',
    panelEyebrow: 'Support portal',
    panelTitle: 'Keep the marketplace running smoothly.',
    panelText: 'Review stores and venues, help customers and keep bookings on track.',
    features: [] as string[],
  },
}
const portalCopy = computed(() => COPY[portal.value as keyof typeof COPY] ?? COPY.customer)
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
const touched = reactive({ email: false, password: false, submit: false })

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const emailError = computed(() => {
  if (!touched.email && !touched.submit) return ''
  if (!form.value.email.trim()) return 'Enter your email address.'
  if (!EMAIL_RE.test(form.value.email.trim())) return 'Enter a valid email, like name@example.com.'
  return ''
})
const passwordError = computed(() => ((touched.password || touched.submit) && !form.value.password ? 'Enter your password.' : ''))

function onSubmit() {
  touched.submit = true
  if (emailError.value || passwordError.value) return
  handleLogin()
}

async function handleLogin() {
  loading.value = true
  error.value = ''
  const result = await authStore.login(form.value.email, form.value.password)
  
  if (result.success) {
    // Short pause so the button state is visible before redirecting
    setTimeout(async () => {
      loading.value = false
      const destination = safeRedirect() ?? result.redirectTo ?? authStore.defaultRoute
      toast.success('Signed in successfully.')
      try {
        await router.replace(destination)
      } catch {
        window.location.href = hrefFor(router.resolve(destination).fullPath)
      }
    }, 600)
  } else {
    loading.value = false
    error.value = result.message || 'Login failed. Please check your credentials.'
    toast.error(error.value)
  }
}
</script>
