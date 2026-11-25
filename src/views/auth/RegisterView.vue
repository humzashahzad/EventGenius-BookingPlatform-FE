<template>
  <AuthShell
    :badge="portal === 'shop' ? 'Venue owner' : 'Customer'"
    :badge-icon="portal === 'shop' ? 'building-store' : 'user'"
    :heading="portal === 'shop' ? 'List your venue on EventGenius' : 'Create your account'"
    :subheading="portal === 'shop' ? 'Register as a store owner to list venues and take bookings.' : 'Join EventGenius to browse and book venues across Pakistan.'"
    :panel-eyebrow="portal === 'shop' ? 'For venue owners' : 'Create your account'"
    :panel-title="portal === 'shop' ? 'Reach customers planning their next event.' : 'Plan your next event in minutes.'"
    :panel-text="portal === 'shop' ? 'Create your store, add venues with photos and pricing, and manage every request in one place.' : 'Compare venues, send a booking request and pay securely once the venue confirms.'"
    :features="features"
  >
    <form class="space-y-4" novalidate @submit.prevent="onSubmit">
      <div>
        <label for="reg-name" class="form-label">Full name <span class="req" aria-hidden="true">*</span></label>
        <input
          id="reg-name" v-model="form.name" type="text" required class="form-input" placeholder="e.g. Ayesha Khan" autocomplete="name"
          :aria-invalid="!!fieldError('name')" :aria-describedby="fieldError('name') ? 'reg-name-error' : undefined" @blur="touched.name = true"
        />
        <p v-if="fieldError('name')" id="reg-name-error" class="form-error">{{ fieldError('name') }}</p>
      </div>

      <div>
        <label for="reg-email" class="form-label">Email address <span class="req" aria-hidden="true">*</span></label>
        <input
          id="reg-email" v-model="form.email" type="email" required class="form-input" placeholder="you@example.com" autocomplete="email" inputmode="email"
          :aria-invalid="!!fieldError('email')" :aria-describedby="fieldError('email') ? 'reg-email-error' : undefined" @blur="touched.email = true"
        />
        <p v-if="fieldError('email')" id="reg-email-error" class="form-error">{{ fieldError('email') }}</p>
      </div>

      <div v-if="portal === 'shop'">
        <label for="reg-store" class="form-label">Store name <span class="req" aria-hidden="true">*</span></label>
        <input
          id="reg-store" v-model="form.store_name" type="text" required class="form-input" placeholder="e.g. Shalimar Banquets" autocomplete="organization"
          :aria-invalid="!!fieldError('store_name')" :aria-describedby="fieldError('store_name') ? 'reg-store-error' : 'reg-store-hint'" @blur="touched.store_name = true"
        />
        <p v-if="fieldError('store_name')" id="reg-store-error" class="form-error">{{ fieldError('store_name') }}</p>
        <p v-else id="reg-store-hint" class="form-hint">The business name customers will see.</p>
      </div>

      <PasswordField
        id="reg-password"
        v-model="form.password"
        label="Password"
        placeholder="At least 8 characters"
        autocomplete="new-password"
        required
        mark-required
        :error="fieldError('password')"
        @blur="touched.password = true"
      >
        <PasswordStrength :password="form.password" />
      </PasswordField>

      <PasswordField
        id="reg-password-confirm"
        v-model="form.password_confirmation"
        label="Confirm password"
        placeholder="Repeat your password"
        autocomplete="new-password"
        required
        mark-required
        :error="fieldError('password_confirmation')"
        @blur="touched.password_confirmation = true"
      />

      <div v-if="errorMsg" class="alert-danger" role="alert">
        <AppIcon icon="alert-triangle" class="w-5 h-5 shrink-0" />
        <p>{{ errorMsg }}</p>
      </div>

      <button type="submit" :disabled="loading" class="btn-primary btn-lg btn-block">
        <span v-if="loading" class="spinner-border spinner-border-sm" aria-hidden="true"></span>
        {{ loading ? 'Creating account…' : portal === 'shop' ? 'Create shop account' : 'Create account' }}
      </button>
    </form>

    <template #footer>
      <p>
        Already have an account?
        <RouterLink :to="loginPath" class="link ml-1">Sign in</RouterLink>
      </p>
      <p class="pt-3 border-t border-line text-xs">
        <template v-if="portal === 'shop'">Booking an event instead? <RouterLink to="/customer/sign-up" class="link">Create a customer account</RouterLink></template>
        <template v-else>Own a venue? <RouterLink to="/shop/sign-up" class="link">Register your shop</RouterLink></template>
      </p>
    </template>
  </AuthShell>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { RouterLink, useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppIcon from '@/components/ui/AppIcon.vue'
import AuthShell from '@/components/auth/AuthShell.vue'
import PasswordField from '@/components/auth/PasswordField.vue'
import PasswordStrength from '@/components/auth/PasswordStrength.vue'

const router    = useRouter()
const route     = useRoute()
const authStore = useAuthStore()

const portal    = computed(() => (route.meta.portal as string) ?? 'customer')
const loginPath = computed(() => portal.value === 'shop' ? '/shop/sign-in' : '/customer/sign-in')

const loading      = ref(false)
const errorMsg     = ref('')
const errors       = reactive<Record<string, string[]>>({})

const form = reactive({
  name:                  '',
  email:                 '',
  store_name:            '',
  password:              '',
  password_confirmation: '',
})

const features = computed(() => portal.value === 'shop'
  ? ['Free to list your venues', 'Accept or decline requests in one tap', 'Payments and reviews tracked for you']
  : ['Free to join, no booking fees', 'Verified venues with real photos and prices', 'Track every booking and payment in one place'])

type Field = 'name' | 'email' | 'store_name' | 'password' | 'password_confirmation'
const touched = reactive<Record<Field | 'submit', boolean>>({ name: false, email: false, store_name: false, password: false, password_confirmation: false, submit: false })
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Inline error for a field: server error first, then client checks once touched. */
function fieldError(f: Field): string {
  if (errors[f]?.length) return errors[f][0]
  if (!touched[f] && !touched.submit) return ''
  if (f === 'name') return form.name.trim() ? '' : 'Enter your full name.'
  if (f === 'email') return !form.email.trim() ? 'Enter your email address.' : EMAIL_RE.test(form.email.trim()) ? '' : 'Enter a valid email, like name@example.com.'
  if (f === 'store_name') return portal.value !== 'shop' || form.store_name.trim() ? '' : 'Enter your store name.'
  if (f === 'password') return !form.password ? 'Choose a password.' : form.password.length < 8 ? 'Use at least 8 characters.' : ''
  if (f === 'password_confirmation') return form.password_confirmation === form.password ? '' : "Passwords don't match."
  return ''
}

// Clear a server error as soon as the user edits that field.
for (const f of ['name', 'email', 'store_name', 'password', 'password_confirmation'] as Field[]) {
  watch(() => form[f], () => { if (errors[f]) delete errors[f] })
}

function onSubmit() {
  touched.submit = true
  const fields: Field[] = ['name', 'email', 'store_name', 'password', 'password_confirmation']
  if (fields.some(f => fieldError(f))) return
  handleRegister()
}

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
