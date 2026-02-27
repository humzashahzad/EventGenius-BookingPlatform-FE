<template>
  <div class="min-h-screen flex items-center justify-center py-12 px-4" style="background: var(--color-bg);">
    <div class="card card-body w-full max-w-md">
      <div class="text-center mb-8">
        <h2 class="text-2xl font-bold" style="color: var(--color-text);">Set new password</h2>
        <p class="mt-2 text-sm" style="color: var(--color-text-secondary);">
          Enter your new password below.
        </p>
      </div>

      <div v-if="success" class="alert alert-success">
        <p class="font-medium">Password updated!</p>
        <p class="text-sm mt-1 opacity-90">You can now sign in with your new password.</p>
        <RouterLink :to="loginBackLink" class="btn-primary mt-4 inline-block">Sign In</RouterLink>
      </div>

      <form v-else-if="hasToken" @submit.prevent="handleSubmit" class="space-y-4">
        <div class="form-group">
          <label class="form-label">Email</label>
          <input v-model="email" type="email" required class="form-input" readonly />
        </div>
        <div class="form-group">
          <label class="form-label">New Password</label>
          <input v-model="form.password" type="password" required minlength="8" class="form-input" placeholder="Min. 8 characters" autocomplete="new-password" />
          <p v-if="errors.password" class="text-xs text-danger-600 mt-1">{{ errors.password[0] }}</p>
        </div>
        <div class="form-group">
          <label class="form-label">Confirm Password</label>
          <input v-model="form.password_confirmation" type="password" required class="form-input" placeholder="Repeat password" autocomplete="new-password" />
          <p v-if="errors.password_confirmation" class="text-xs text-danger-600 mt-1">{{ errors.password_confirmation[0] }}</p>
        </div>

        <div v-if="errorMsg" class="alert alert-danger py-2">{{ errorMsg }}</div>

        <button type="submit" :disabled="loading" class="btn-primary w-full">
          {{ loading ? 'Updating…' : 'Update Password' }}
        </button>

        <p class="text-center text-sm" style="color: var(--color-text-secondary);">
          <RouterLink :to="loginBackLink" class="font-medium" style="color: var(--color-primary);">Back to Sign In</RouterLink>
        </p>
      </form>

      <div v-else class="alert alert-danger">
        <p class="font-medium">Invalid reset link</p>
        <p class="text-sm mt-1">This page requires a valid reset link (token and email). Request a new link from the sign-in page.</p>
        <RouterLink :to="loginBackLink" class="btn-primary mt-4 inline-block">Back to Sign In</RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import api from '@/lib/axios'

const route = useRoute()

const email = ref('')
const form = ref({ password: '', password_confirmation: '' })
const errors = ref<Record<string, string[]>>({})
const loading = ref(false)
const errorMsg = ref('')
const success = ref(false)
const hasToken = ref(false)

const loginBackLink = computed(() => {
  const from = (route.query.from as string) || 'customer'
  if (from === 'shop') return '/shop/sign-in'
  if (from === 'support') return '/support/sign-in'
  return '/customer/sign-in'
})

onMounted(() => {
  const token = route.query.token as string
  const emailQ = route.query.email as string
  if (token && emailQ) {
    hasToken.value = true
    email.value = decodeURIComponent(emailQ)
  }
})

async function handleSubmit() {
  loading.value = true
  errorMsg.value = ''
  errors.value = {}
  try {
    await api.post('/auth/reset-password', {
      token: route.query.token,
      email: email.value,
      password: form.value.password,
      password_confirmation: form.value.password_confirmation,
    })
    success.value = true
  } catch (e: any) {
    const data = e.response?.data
    if (data?.errors) errors.value = data.errors
    errorMsg.value = data?.message || 'Could not update password. The link may have expired.'
  } finally {
    loading.value = false
  }
}
</script>
