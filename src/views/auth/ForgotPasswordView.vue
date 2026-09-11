<template>
  <div class="h-screen overflow-hidden flex items-center justify-center bg-warm-100 dark:bg-warm-950 p-4 sm:p-6">
    <div class="w-full h-full max-h-full flex rounded-3xl overflow-hidden shadow-elevated bg-warm-50 dark:bg-warm-900">
      <!-- Left: Brand Panel (desktop) -->
      <div class="hidden lg:flex lg:w-[58%] xl:w-[66%] items-center justify-center relative bg-gradient-to-br from-primary-800 via-primary-700 to-primary-600 overflow-hidden rounded-3xl m-2">
        <PixelCanvas ref="canvasRef" variant="glow" />

        <div class="absolute top-0 right-0 w-[350px] h-[350px] rounded-full bg-primary-400/30 blur-[80px] -translate-y-20 translate-x-10" />
        <div class="absolute bottom-0 left-0 w-[250px] h-[250px] rounded-full bg-accent/20 blur-[80px] translate-y-10 -translate-x-10" />
        <div class="relative z-10 max-w-[400px] px-4 sm:px-8 text-center">
          <div class="w-20 h-20 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-sm mx-auto mb-6">
            <AppIcon icon="lock-question" class="w-10 h-10 text-white" />
          </div>
          <h2 class="text-white font-bold text-3xl tracking-tight mb-4">Forgot your password?</h2>
          <p class="text-white/60 leading-relaxed">No worries! Enter your email and we'll send you a reset link to get back into your account.</p>
        </div>
      </div>

      <!-- Right: Form -->
      <div class="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div class="w-full max-w-[400px]">
        <div class="lg:hidden flex items-center gap-2 mb-8">
          <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-primary-400 flex items-center justify-center">
            <span class="text-white font-bold text-sm">EG</span>
          </div>
          <span class="font-bold text-warm-800 dark:text-white">EventGenius</span>
        </div>

        <h1 class="text-xl font-bold text-warm-800 dark:text-white mb-1">Reset your password</h1>
        <p class="text-warm-500 dark:text-warm-400 mb-6">Enter your email and we'll send you a reset link.</p>

        <!-- Success state -->
        <div v-if="sent" class="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-2xl p-5">
          <h3 class="font-semibold text-primary-700 dark:text-primary-300 mb-1">Password reset email sent!</h3>
          <p class="text-sm text-primary-600 dark:text-primary-400 mb-4">Check your inbox for the reset link.</p>
          <RouterLink
            :to="loginBackLink"
            class="inline-flex items-center justify-center px-4 py-2 rounded-xl font-semibold text-white bg-primary-500 hover:bg-primary-600 transition-all duration-200 text-sm shadow-soft"
          >
            Back to Login
          </RouterLink>
        </div>

        <!-- Form state -->
        <form v-else @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="form-label">Email Address</label>
            <input v-model="email" type="email" required class="form-input" placeholder="you@example.com" />
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
              Sending...
            </span>
            <span v-else>Send Reset Link</span>
          </button>

          <p class="text-center">
            <RouterLink :to="loginBackLink" class="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
              <AppIcon icon="chevron-left" class="w-4 h-4" />
              Back to Login
            </RouterLink>
          </p>
        </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import api from '@/lib/axios'
import AppIcon from '@/components/ui/AppIcon.vue'
import PixelCanvas from '@/components/ui/PixelCanvas.vue'

const route = useRoute()

const email = ref('')
const loading = ref(false)
const errorMsg = ref('')
const sent = ref(false)
const canvasRef = ref<InstanceType<typeof PixelCanvas> | null>(null)

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
      canvasRef.value?.triggerPulse('success')
    } else {
      errorMsg.value = data?.message || 'Something went wrong.'
      canvasRef.value?.triggerPulse('error')
    }
  } catch (e: any) {
    errorMsg.value = e.response?.data?.message || 'Something went wrong.'
    canvasRef.value?.triggerPulse('error')
  } finally {
    loading.value = false
  }
}
</script>
