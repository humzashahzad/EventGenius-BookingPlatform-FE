<template>
  <div class="min-h-screen flex items-center justify-center py-12 px-4" style="background: var(--color-bg);">
    <div class="card card-body w-full max-w-md">
      <div class="text-center mb-8">
        <h2 class="text-2xl font-bold" style="color: var(--color-text);">Reset your password</h2>
        <p class="mt-2 text-sm" style="color: var(--color-text-secondary);">
          Enter your email and we'll send you a reset link.
        </p>
      </div>

      <div v-if="sent" class="alert alert-success">
        <p class="font-medium">Password reset email sent!</p>
        <p class="text-sm mt-1 opacity-90">Check your inbox for the reset link.</p>
        <RouterLink :to="loginBackLink" class="btn-primary mt-4 inline-block">Back to Login</RouterLink>
      </div>

      <form v-else @submit.prevent="handleSubmit" class="space-y-4">
        <div class="form-group">
          <label class="form-label">Email Address</label>
          <input v-model="email" type="email" required class="form-input" placeholder="you@example.com" />
        </div>

        <div v-if="errorMsg" class="alert alert-danger py-2">{{ errorMsg }}</div>

        <button type="submit" :disabled="loading" class="btn-primary w-full">
          {{ loading ? 'Sending…' : 'Send Reset Link' }}
        </button>

        <p class="text-center text-sm" style="color: var(--color-text-secondary);">
          <RouterLink :to="loginBackLink" class="font-medium" style="color: var(--color-primary);">Back to Login</RouterLink>
        </p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import api from '@/lib/axios'

const route = useRoute()

const email = ref('')
const loading = ref(false)
const errorMsg = ref('')
const sent = ref(false)

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
