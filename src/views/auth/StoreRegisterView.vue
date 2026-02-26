<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
    <div class="card max-w-md w-full">
      <div class="text-center mb-8">
        <h2 class="text-2xl font-bold text-gray-900">Register as Store Owner</h2>
        <p class="mt-2 text-sm text-gray-600">
          Already have an account?
          <RouterLink to="/login" class="text-primary-600 hover:text-primary-500 font-medium">Sign in</RouterLink>
        </p>
      </div>
      <form @submit.prevent="handleRegister" class="space-y-4">
        <div>
          <label class="form-label">Full Name</label>
          <input v-model="form.name" type="text" required class="form-input" placeholder="John Doe" />
          <p v-if="errors.name" class="text-xs text-red-600 mt-1">{{ errors.name[0] }}</p>
        </div>
        <div>
          <label class="form-label">Email Address</label>
          <input v-model="form.email" type="email" required class="form-input" placeholder="you@example.com" />
          <p v-if="errors.email" class="text-xs text-red-600 mt-1">{{ errors.email[0] }}</p>
        </div>
        <div>
          <label class="form-label">Password</label>
          <input v-model="form.password" type="password" required class="form-input" placeholder="••••••••" />
        </div>
        <div>
          <label class="form-label">Confirm Password</label>
          <input v-model="form.password_confirmation" type="password" required class="form-input" placeholder="••••••••" />
        </div>

        <div v-if="errorMsg" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{{ errorMsg }}</div>

        <button type="submit" :disabled="loading" class="btn-primary w-full">
          <span v-if="loading">Creating account...</span>
          <span v-else>Create Store Owner Account</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const loading = ref(false)
const errorMsg = ref('')
const errors = reactive<Record<string, string[]>>({})
const form = reactive({ name: '', email: '', password: '', password_confirmation: '' })

async function handleRegister() {
  loading.value = true
  errorMsg.value = ''
  const result = await authStore.register({ ...form, role: 'store_owner' })
  loading.value = false
  if (result.success) {
    router.push(authStore.defaultRoute)
  } else {
    if (result.errors) Object.assign(errors, result.errors)
    else errorMsg.value = 'Registration failed.'
  }
}
</script>
