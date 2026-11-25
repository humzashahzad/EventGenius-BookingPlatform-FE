<template>
  <AuthShell
    :heading="sent ? 'Check your email' : 'Forgot your password?'"
    :subheading="sent ? '' : 'Enter the email you signed up with and we\'ll send you a link to reset it.'"
    panel-eyebrow="Account recovery"
    panel-title="Locked out? It happens."
    panel-text="We'll email you a secure link so you can choose a new password and get back to your bookings."
  >
    <!-- Success state -->
    <div v-if="sent" class="space-y-4" role="status">
      <div class="alert-success">
        <AppIcon icon="mail" class="w-5 h-5 shrink-0" />
        <div>
          <p class="alert-title">Reset link sent</p>
          <p class="text-sm break-words">If an account exists for <strong>{{ email }}</strong>, you'll get an email with a link to reset your password. Check your spam folder too.</p>
        </div>
      </div>
      <RouterLink :to="loginBackLink" class="btn-primary btn-lg btn-block">Back to sign in</RouterLink>
      <button type="button" class="btn-ghost btn-block" @click="sent = false">Use a different email</button>
    </div>

    <!-- Form state -->
    <form v-else class="space-y-4" novalidate @submit.prevent="onSubmit">
      <div>
        <label for="forgot-email" class="form-label">Email address</label>
        <input
          id="forgot-email" v-model="email" type="email" required class="form-input" placeholder="you@example.com" autocomplete="email" inputmode="email"
          :aria-invalid="!!emailError" :aria-describedby="emailError ? 'forgot-email-error' : undefined" @blur="touched = true"
        />
        <p v-if="emailError" id="forgot-email-error" class="form-error">{{ emailError }}</p>
      </div>

      <div v-if="errorMsg" class="alert-danger" role="alert">
        <AppIcon icon="alert-triangle" class="w-5 h-5 shrink-0" />
        <p>{{ errorMsg }}</p>
      </div>

      <button type="submit" :disabled="loading" class="btn-primary btn-lg btn-block">
        <span v-if="loading" class="spinner-border spinner-border-sm" aria-hidden="true"></span>
        {{ loading ? 'Sending…' : 'Send reset link' }}
      </button>
    </form>

    <template v-if="!sent" #footer>
      <p>Remembered it? <RouterLink :to="loginBackLink" class="link ml-1">Back to sign in</RouterLink></p>
    </template>
  </AuthShell>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import api from '@/lib/axios'
import AppIcon from '@/components/ui/AppIcon.vue'
import AuthShell from '@/components/auth/AuthShell.vue'

const route = useRoute()

const email = ref('')
const loading = ref(false)
const errorMsg = ref('')
const sent = ref(false)
const touched = ref(false)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const emailError = computed(() => {
  if (!touched.value) return ''
  if (!email.value.trim()) return 'Enter your email address.'
  return EMAIL_RE.test(email.value.trim()) ? '' : 'Enter a valid email, like name@example.com.'
})

function onSubmit() {
  touched.value = true
  if (emailError.value) return
  handleSubmit()
}

const loginBackLink = computed(() => {
  const from = (route.query.from as string) || 'customer'
  if (from === 'shop') return '/shop/sign-in'
  if (from === 'support') return '/support/sign-in'
  return '/customer/sign-in'
})

async function handleSubmit() {
  loading.value = true
  errorMsg.value = ''
  try {
    const { data } = await api.post('/auth/forgot-password', { email: email.value })
    if (data?.success) {
      sent.value = true
    } else {
      errorMsg.value = data?.message || 'Something went wrong.'
    }
  } catch (e: any) {
    errorMsg.value = e.response?.data?.message || 'Something went wrong.'
  } finally {
    loading.value = false
  }
}
</script>
