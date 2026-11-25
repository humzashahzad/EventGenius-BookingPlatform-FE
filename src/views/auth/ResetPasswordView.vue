<template>
  <AuthShell
    :heading="success ? 'Password updated' : hasToken ? 'Set a new password' : 'Reset link not valid'"
    :subheading="success ? '' : hasToken ? 'Choose a strong password you don\'t use anywhere else.' : ''"
    panel-eyebrow="Account recovery"
    panel-title="Set a new password"
    panel-text="Choose a strong password to keep your account and bookings secure."
  >
    <!-- Success state -->
    <div v-if="success" class="space-y-4" role="status">
      <div class="alert-success">
        <AppIcon icon="circle-check" class="w-5 h-5 shrink-0" />
        <div><p class="alert-title">All set</p><p class="text-sm">You can now sign in with your new password.</p></div>
      </div>
      <RouterLink :to="loginBackLink" class="btn-primary btn-lg btn-block">Sign in</RouterLink>
    </div>

    <!-- Form state -->
    <form v-else-if="hasToken" class="space-y-4" novalidate @submit.prevent="onSubmit">
      <div>
        <label for="reset-email" class="form-label">Email</label>
        <input id="reset-email" v-model="email" type="email" required class="form-input !bg-surface-sunken !text-ink-secondary cursor-not-allowed" readonly autocomplete="username" />
        <p v-if="errors.email" class="form-error">{{ errors.email[0] }}</p>
      </div>

      <PasswordField
        id="reset-password"
        v-model="form.password"
        label="New password"
        placeholder="At least 8 characters"
        autocomplete="new-password"
        required
        :minlength="8"
        :error="passwordError"
        @blur="touched.password = true"
      >
        <PasswordStrength :password="form.password" />
      </PasswordField>

      <PasswordField
        id="reset-password-confirm"
        v-model="form.password_confirmation"
        label="Confirm new password"
        placeholder="Repeat your password"
        autocomplete="new-password"
        required
        :error="confirmError"
        @blur="touched.confirm = true"
      />

      <div v-if="errorMsg" class="alert-danger" role="alert">
        <AppIcon icon="alert-triangle" class="w-5 h-5 shrink-0" />
        <p>{{ errorMsg }}</p>
      </div>

      <button type="submit" :disabled="loading" class="btn-primary btn-lg btn-block">
        <span v-if="loading" class="spinner-border spinner-border-sm" aria-hidden="true"></span>
        {{ loading ? 'Updating…' : 'Update password' }}
      </button>
    </form>

    <!-- Invalid token state -->
    <div v-else class="space-y-4">
      <div class="alert-danger" role="alert">
        <AppIcon icon="alert-circle" class="w-5 h-5 shrink-0" />
        <div><p class="alert-title">This link is missing or incomplete</p><p class="text-sm">Open the link from your reset email again, or request a new one.</p></div>
      </div>
      <RouterLink :to="forgotLink" class="btn-primary btn-lg btn-block">Request a new link</RouterLink>
    </div>

    <template v-if="!success" #footer>
      <p><RouterLink :to="loginBackLink" class="link">Back to sign in</RouterLink></p>
    </template>
  </AuthShell>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import api from '@/lib/axios'
import AppIcon from '@/components/ui/AppIcon.vue'
import AuthShell from '@/components/auth/AuthShell.vue'
import PasswordField from '@/components/auth/PasswordField.vue'
import PasswordStrength from '@/components/auth/PasswordStrength.vue'

const route = useRoute()

const email = ref('')
const form = ref({ password: '', password_confirmation: '' })
const errors = ref<Record<string, string[]>>({})
const loading = ref(false)
const errorMsg = ref('')
const success = ref(false)
const hasToken = ref(false)
const touched = reactive({ password: false, confirm: false, submit: false })

const passwordError = computed(() => {
  if (errors.value.password?.length) return errors.value.password[0]
  if (!touched.password && !touched.submit) return ''
  if (!form.value.password) return 'Choose a new password.'
  return form.value.password.length < 8 ? 'Use at least 8 characters.' : ''
})
const confirmError = computed(() => {
  if (errors.value.password_confirmation?.length) return errors.value.password_confirmation[0]
  if (!touched.confirm && !touched.submit) return ''
  return form.value.password_confirmation === form.value.password ? '' : "Passwords don't match."
})
const forgotLink = computed(() => `/forgot-password?from=${(route.query.from as string) || 'customer'}`)

// Drop a stale server error once the user edits the password again.
watch(form, () => { if (Object.keys(errors.value).length) errors.value = {} }, { deep: true })

function onSubmit() {
  touched.submit = true
  if (passwordError.value || confirmError.value) return
  handleSubmit()
}

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
