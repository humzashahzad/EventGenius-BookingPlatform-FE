<template>
  <div class="content-container">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="text-2xl font-bold text-warm-900 dark:text-warm-50 tracking-tight">Landing Page</h1>
        <p class="text-sm text-warm-500 dark:text-warm-400 mt-1">Customize your public store page that customers see when they visit your shop.</p>
      </div>
      <button @click="save" :disabled="saving" class="btn-primary gap-1.5">
        <AppIcon v-if="saving" icon="loader" class="w-4 h-4 animate-spin" />
        <AppIcon v-else icon="check" class="w-4 h-4" />
        {{ saving ? 'Saving...' : 'Save Changes' }}
      </button>
    </div>

    <!-- Alerts -->
    <transition name="fade">
      <div v-if="successMsg" class="flex items-center gap-3 p-4 rounded-2xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300 mb-6">
        <AppIcon icon="circle-check" class="w-5 h-5 flex-shrink-0" />
        <p class="text-sm font-medium">{{ successMsg }}</p>
      </div>
    </transition>
    <transition name="fade">
      <div v-if="errorMsg" class="flex items-center gap-3 p-4 rounded-2xl bg-coral/10 dark:bg-coral/20 border border-coral/30 text-coral dark:text-red-300 mb-6">
        <AppIcon icon="alert-circle" class="w-5 h-5 flex-shrink-0" />
        <p class="text-sm font-medium">{{ errorMsg }}</p>
      </div>
    </transition>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-16">
      <AppIcon icon="loader" class="w-8 h-8 animate-spin text-primary-500" />
    </div>

    <div v-else class="space-y-6">
      <!-- Hero Section -->
      <div class="card">
        <div class="border-b border-warm-200 dark:border-warm-700 px-5 py-4 sm:px-6 flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <AppIcon icon="image" class="w-4 h-4 text-primary-600 dark:text-primary-400" />
          </div>
          <h2 class="text-sm font-semibold text-warm-900 dark:text-warm-50">Hero & Tagline</h2>
        </div>
        <div class="p-5 sm:p-6 space-y-4">
          <div>
            <label class="form-label">Hero Image</label>
            <div class="flex items-center gap-4">
              <div v-if="form.hero_image" class="w-32 h-20 rounded-xl overflow-hidden bg-warm-100 dark:bg-warm-800 flex-shrink-0">
                <img :src="getStorageUrl(form.hero_image)" class="w-full h-full object-cover" />
              </div>
              <label class="btn-outline gap-1.5 cursor-pointer">
                <AppIcon icon="upload" class="w-4 h-4" />
                Upload Hero
                <input type="file" accept="image/*" class="hidden" @change="uploadHero" />
              </label>
            </div>
          </div>
          <div>
            <label class="form-label">Tagline</label>
            <input v-model="form.tagline" class="form-input" placeholder="e.g. Premium venue experiences since 2020" />
          </div>
        </div>
      </div>

      <!-- About -->
      <div class="card">
        <div class="border-b border-warm-200 dark:border-warm-700 px-5 py-4 sm:px-6 flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-accent/10 dark:bg-accent/20 flex items-center justify-center">
            <AppIcon icon="info" class="w-4 h-4 text-accent" />
          </div>
          <h2 class="text-sm font-semibold text-warm-900 dark:text-warm-50">About</h2>
        </div>
        <div class="p-5 sm:p-6">
          <label class="form-label">About Your Business</label>
          <textarea v-model="form.about_text" class="form-input" rows="5" placeholder="Tell your customers about your venue business, history, and what makes you special..."></textarea>
        </div>
      </div>

      <!-- Services -->
      <div class="card">
        <div class="border-b border-warm-200 dark:border-warm-700 px-5 py-4 sm:px-6 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <AppIcon icon="sparkles" class="w-4 h-4 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 class="text-sm font-semibold text-warm-900 dark:text-warm-50">Services</h2>
          </div>
          <button type="button" @click="addService" class="btn-ghost btn-sm gap-1">
            <AppIcon icon="plus" class="w-4 h-4" />
            Add
          </button>
        </div>
        <div class="p-5 sm:p-6 space-y-3">
          <div v-for="(s, i) in form.services" :key="i" class="flex gap-3 items-start">
            <div class="flex-1 space-y-2">
              <input v-model="s.title" class="form-input" placeholder="Service title" />
              <input v-model="s.description" class="form-input" placeholder="Brief description" />
            </div>
            <button type="button" @click="form.services.splice(i, 1)" class="btn-ghost !p-2 text-coral hover:bg-coral/10 rounded-xl flex-shrink-0 mt-1">
              <AppIcon icon="x" class="w-4 h-4" />
            </button>
          </div>
          <p v-if="!form.services.length" class="text-warm-500 dark:text-warm-400 text-xs">No services added yet.</p>
        </div>
      </div>

      <!-- FAQ -->
      <div class="card">
        <div class="border-b border-warm-200 dark:border-warm-700 px-5 py-4 sm:px-6 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <AppIcon icon="lock-question" class="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 class="text-sm font-semibold text-warm-900 dark:text-warm-50">FAQ</h2>
          </div>
          <button type="button" @click="addFaq" class="btn-ghost btn-sm gap-1">
            <AppIcon icon="plus" class="w-4 h-4" />
            Add
          </button>
        </div>
        <div class="p-5 sm:p-6 space-y-3">
          <div v-for="(f, i) in form.faq" :key="i" class="flex gap-3 items-start">
            <div class="flex-1 space-y-2">
              <input v-model="f.question" class="form-input" placeholder="Question" />
              <textarea v-model="f.answer" class="form-input" rows="2" placeholder="Answer"></textarea>
            </div>
            <button type="button" @click="form.faq.splice(i, 1)" class="btn-ghost !p-2 text-coral hover:bg-coral/10 rounded-xl flex-shrink-0 mt-1">
              <AppIcon icon="x" class="w-4 h-4" />
            </button>
          </div>
          <p v-if="!form.faq.length" class="text-warm-500 dark:text-warm-400 text-xs">No FAQ items added yet.</p>
        </div>
      </div>

      <!-- Testimonials -->
      <div class="card">
        <div class="border-b border-warm-200 dark:border-warm-700 px-5 py-4 sm:px-6 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-warm-100 dark:bg-warm-800 flex items-center justify-center">
              <AppIcon icon="message" class="w-4 h-4 text-warm-600 dark:text-warm-400" />
            </div>
            <h2 class="text-sm font-semibold text-warm-900 dark:text-warm-50">Testimonials</h2>
          </div>
          <button type="button" @click="addTestimonial" class="btn-ghost btn-sm gap-1">
            <AppIcon icon="plus" class="w-4 h-4" />
            Add
          </button>
        </div>
        <div class="p-5 sm:p-6 space-y-3">
          <div v-for="(t, i) in form.testimonials" :key="i" class="flex gap-3 items-start">
            <div class="flex-1 space-y-2">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input v-model="t.name" class="form-input" placeholder="Customer name" />
                <select v-model.number="t.rating" class="form-select">
                  <option :value="5">5 Stars</option>
                  <option :value="4">4 Stars</option>
                  <option :value="3">3 Stars</option>
                </select>
              </div>
              <textarea v-model="t.quote" class="form-input" rows="2" placeholder="What they said..."></textarea>
            </div>
            <button type="button" @click="form.testimonials.splice(i, 1)" class="btn-ghost !p-2 text-coral hover:bg-coral/10 rounded-xl flex-shrink-0 mt-1">
              <AppIcon icon="x" class="w-4 h-4" />
            </button>
          </div>
          <p v-if="!form.testimonials.length" class="text-warm-500 dark:text-warm-400 text-xs">No testimonials added yet.</p>
        </div>
      </div>

      <!-- Social Links -->
      <div class="card">
        <div class="border-b border-warm-200 dark:border-warm-700 px-5 py-4 sm:px-6 flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <AppIcon icon="link" class="w-4 h-4 text-primary-600 dark:text-primary-400" />
          </div>
          <h2 class="text-sm font-semibold text-warm-900 dark:text-warm-50">Social Links</h2>
        </div>
        <div class="p-5 sm:p-6">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="form-label">Facebook</label>
              <input v-model="form.social_links.facebook" class="form-input" placeholder="https://facebook.com/..." />
            </div>
            <div>
              <label class="form-label">Instagram</label>
              <input v-model="form.social_links.instagram" class="form-input" placeholder="https://instagram.com/..." />
            </div>
            <div>
              <label class="form-label">Twitter / X</label>
              <input v-model="form.social_links.twitter" class="form-input" placeholder="https://x.com/..." />
            </div>
            <div>
              <label class="form-label">Website</label>
              <input v-model="form.social_links.website" class="form-input" placeholder="https://..." />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import api from '@/lib/axios'
import { getStorageUrl } from '@/lib/storageUrl'
import AppIcon from '@/components/ui/AppIcon.vue'

const loading = ref(true)
const saving = ref(false)
const successMsg = ref('')
const errorMsg = ref('')

const form = reactive({
  hero_image: '' as string,
  tagline: '',
  about_text: '',
  services: [] as { title: string; description: string }[],
  faq: [] as { question: string; answer: string }[],
  testimonials: [] as { name: string; quote: string; rating: number }[],
  social_links: { facebook: '', instagram: '', twitter: '', website: '' } as Record<string, string>,
  gallery: [] as string[],
})

function addService() {
  form.services.push({ title: '', description: '' })
}

function addFaq() {
  form.faq.push({ question: '', answer: '' })
}

function addTestimonial() {
  form.testimonials.push({ name: '', quote: '', rating: 5 })
}

async function loadLanding() {
  loading.value = true
  try {
    const { data } = await api.get('/store/landing')
    if (data.data) {
      Object.assign(form, {
        hero_image: data.data.hero_image || '',
        tagline: data.data.tagline || '',
        about_text: data.data.about_text || '',
        services: data.data.services || [],
        faq: data.data.faq || [],
        testimonials: data.data.testimonials || [],
        social_links: data.data.social_links || { facebook: '', instagram: '', twitter: '', website: '' },
        gallery: data.data.gallery || [],
      })
    }
  } catch {
    // No landing page yet — that's fine
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  successMsg.value = ''
  errorMsg.value = ''
  try {
    await api.put('/store/landing', {
      tagline: form.tagline,
      about_text: form.about_text,
      services: form.services.filter(s => s.title.trim()),
      faq: form.faq.filter(f => f.question.trim()),
      testimonials: form.testimonials.filter(t => t.name.trim()),
      social_links: form.social_links,
    })
    successMsg.value = 'Landing page saved!'
    setTimeout(() => (successMsg.value = ''), 3500)
  } catch (e: any) {
    errorMsg.value = e.response?.data?.message || 'Save failed.'
    setTimeout(() => (errorMsg.value = ''), 4000)
  } finally {
    saving.value = false
  }
}

async function uploadHero(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const fd = new FormData()
  fd.append('hero_image', file)
  try {
    const { data } = await api.post('/store/landing/hero', fd)
    form.hero_image = data.data.hero_image
  } catch {
    errorMsg.value = 'Failed to upload hero image.'
    setTimeout(() => (errorMsg.value = ''), 3000)
  }
}

onMounted(loadLanding)
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
