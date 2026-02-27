<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h1 class="page-title">Landing Page</h1>
        <p class="page-subtitle">Customize your public store page that customers see when they visit your shop.</p>
      </div>
      <button @click="save" :disabled="saving" class="btn-primary gap-2">
        <svg v-if="saving" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        {{ saving ? 'Saving...' : 'Save Changes' }}
      </button>
    </div>

    <!-- Alerts -->
    <transition name="fade">
      <div v-if="successMsg" class="alert alert-success">{{ successMsg }}</div>
    </transition>
    <transition name="fade">
      <div v-if="errorMsg" class="alert alert-danger">{{ errorMsg }}</div>
    </transition>

    <div v-if="loading" class="flex justify-center py-16">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2" style="border-color: var(--color-primary)"></div>
    </div>

    <div v-else class="space-y-6">
      <!-- Hero Section -->
      <div class="card card-body space-y-4">
        <div class="flex items-center gap-2 pb-3 border-b border-surface-100">
          <div class="w-7 h-7 rounded-lg bg-primary-100 flex items-center justify-center">
            <svg class="w-3.5 h-3.5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          </div>
          <h2 class="text-sm font-semibold text-surface-800">Hero & Tagline</h2>
        </div>
        <div class="form-group">
          <label class="form-label">Hero Image</label>
          <div class="flex items-center gap-4">
            <div v-if="form.hero_image" class="w-32 h-20 rounded-lg overflow-hidden bg-surface-100">
              <img :src="getStorageUrl(form.hero_image)" class="w-full h-full object-cover" />
            </div>
            <label class="btn-primary-outline cursor-pointer gap-1.5">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
              </svg>
              Upload Hero
              <input type="file" accept="image/*" class="hidden" @change="uploadHero" />
            </label>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Tagline</label>
          <input v-model="form.tagline" class="form-input" placeholder="e.g. Premium venue experiences since 2020" />
        </div>
      </div>

      <!-- About -->
      <div class="card card-body space-y-4">
        <div class="flex items-center gap-2 pb-3 border-b border-surface-100">
          <div class="w-7 h-7 rounded-lg bg-info-100 flex items-center justify-center">
            <svg class="w-3.5 h-3.5 text-info-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <h2 class="text-sm font-semibold text-surface-800">About</h2>
        </div>
        <div class="form-group">
          <label class="form-label">About Your Business</label>
          <textarea v-model="form.about_text" class="form-input" rows="5" placeholder="Tell your customers about your venue business, history, and what makes you special..."></textarea>
        </div>
      </div>

      <!-- Services -->
      <div class="card card-body space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-surface-100">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-lg bg-success-100 flex items-center justify-center">
              <svg class="w-3.5 h-3.5 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
              </svg>
            </div>
            <h2 class="text-sm font-semibold text-surface-800">Services</h2>
          </div>
          <button @click="addService" class="btn-ghost btn-sm gap-1">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Add
          </button>
        </div>
        <div v-for="(s, i) in form.services" :key="i" class="flex gap-3 items-start">
          <div class="flex-1 space-y-2">
            <input v-model="s.title" class="form-input" placeholder="Service title" />
            <input v-model="s.description" class="form-input" placeholder="Brief description" />
          </div>
          <button @click="form.services.splice(i, 1)" class="btn-ghost btn-icon mt-1">
            <svg class="w-4 h-4 text-danger-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <p v-if="!form.services.length" class="text-sm text-surface-400">No services added yet.</p>
      </div>

      <!-- FAQ -->
      <div class="card card-body space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-surface-100">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-lg bg-warning-100 flex items-center justify-center">
              <svg class="w-3.5 h-3.5 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h2 class="text-sm font-semibold text-surface-800">FAQ</h2>
          </div>
          <button @click="addFaq" class="btn-ghost btn-sm gap-1">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Add
          </button>
        </div>
        <div v-for="(f, i) in form.faq" :key="i" class="flex gap-3 items-start">
          <div class="flex-1 space-y-2">
            <input v-model="f.question" class="form-input" placeholder="Question" />
            <textarea v-model="f.answer" class="form-input" rows="2" placeholder="Answer"></textarea>
          </div>
          <button @click="form.faq.splice(i, 1)" class="btn-ghost btn-icon mt-1">
            <svg class="w-4 h-4 text-danger-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <p v-if="!form.faq.length" class="text-sm text-surface-400">No FAQ items added yet.</p>
      </div>

      <!-- Testimonials -->
      <div class="card card-body space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-surface-100">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-lg bg-accent-100 flex items-center justify-center">
              <svg class="w-3.5 h-3.5 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
              </svg>
            </div>
            <h2 class="text-sm font-semibold text-surface-800">Testimonials</h2>
          </div>
          <button @click="addTestimonial" class="btn-ghost btn-sm gap-1">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Add
          </button>
        </div>
        <div v-for="(t, i) in form.testimonials" :key="i" class="flex gap-3 items-start">
          <div class="flex-1 space-y-2">
            <div class="grid grid-cols-2 gap-2">
              <input v-model="t.name" class="form-input" placeholder="Customer name" />
              <select v-model.number="t.rating" class="form-input">
                <option :value="5">5 Stars</option>
                <option :value="4">4 Stars</option>
                <option :value="3">3 Stars</option>
              </select>
            </div>
            <textarea v-model="t.quote" class="form-input" rows="2" placeholder="What they said..."></textarea>
          </div>
          <button @click="form.testimonials.splice(i, 1)" class="btn-ghost btn-icon mt-1">
            <svg class="w-4 h-4 text-danger-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <p v-if="!form.testimonials.length" class="text-sm text-surface-400">No testimonials added yet.</p>
      </div>

      <!-- Social Links -->
      <div class="card card-body space-y-4">
        <div class="flex items-center gap-2 pb-3 border-b border-surface-100">
          <div class="w-7 h-7 rounded-lg bg-secondary-100 flex items-center justify-center">
            <svg class="w-3.5 h-3.5 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
            </svg>
          </div>
          <h2 class="text-sm font-semibold text-surface-800">Social Links</h2>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="form-group">
            <label class="form-label">Facebook</label>
            <input v-model="form.social_links.facebook" class="form-input" placeholder="https://facebook.com/..." />
          </div>
          <div class="form-group">
            <label class="form-label">Instagram</label>
            <input v-model="form.social_links.instagram" class="form-input" placeholder="https://instagram.com/..." />
          </div>
          <div class="form-group">
            <label class="form-label">Twitter / X</label>
            <input v-model="form.social_links.twitter" class="form-input" placeholder="https://x.com/..." />
          </div>
          <div class="form-group">
            <label class="form-label">Website</label>
            <input v-model="form.social_links.website" class="form-input" placeholder="https://..." />
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
