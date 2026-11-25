<template>
  <div class="space-y-6">
    <header class="page-header !mb-0">
      <div>
        <h1 class="page-title">Public page</h1>
        <p class="page-subtitle">Customise the store page customers see when they visit your shop.</p>
      </div>
      <div class="page-header-actions">
        <RouterLink v-if="storeId" :to="{ name: 'store-profile', params: { id: storeId } }" target="_blank" class="btn-secondary">
          <AppIcon icon="external-link" class="w-4 h-4" />View public page
        </RouterLink>
      </div>
    </header>

    <div v-if="loading" class="space-y-6" aria-busy="true">
      <div class="skeleton h-56" /><div class="skeleton h-40" /><div class="skeleton h-40" />
    </div>

    <div v-else class="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
      <div class="space-y-6 min-w-0">
        <!-- Hero -->
        <section class="card">
          <div class="card-header"><div><h2 class="card-title">Hero &amp; tagline</h2><p class="card-subtitle">The first thing visitors see.</p></div></div>
          <div class="card-body space-y-5">
            <div>
              <p class="form-label">Hero image</p>
              <div class="flex flex-col sm:flex-row sm:items-center gap-4">
                <div class="w-full sm:w-48 aspect-[16/9] rounded-lg overflow-hidden bg-surface-sunken border border-line shrink-0 flex items-center justify-center">
                  <img v-if="form.hero_image" :src="getStorageUrl(form.hero_image)" alt="Current hero image" class="w-full h-full object-cover" />
                  <AppIcon v-else icon="image" class="w-6 h-6 text-ink-muted" />
                </div>
                <div class="flex-1 min-w-0">
                  <FileUpload accept="image/*" instant compact icon="upload" :title="form.hero_image ? 'Replace image: drop a photo or' : 'Upload image: drop a photo or'" hint="Wide landscape photo, at least 1600px across. Uploads straight away." @select="files => uploadHero(files[0])" />
                </div>
              </div>
            </div>
            <FormField id="lp-tagline" label="Tagline" :count="form.tagline.length" :maxlength="160">
              <TextInput v-model="form.tagline" :maxlength="160" placeholder="e.g. Premium venue experiences since 2020" />
            </FormField>
          </div>
        </section>

        <!-- About -->
        <section class="card">
          <div class="card-header"><div><h2 class="card-title">About</h2><p class="card-subtitle">Your story, history and what makes you special.</p></div></div>
          <div class="card-body">
            <FormField id="lp-about" label="About your business" label-hidden :count="form.about_text.length">
              <TextareaInput v-model="form.about_text" :rows="6" auto-grow placeholder="Tell customers about your venue business…" />
            </FormField>
          </div>
        </section>

        <!-- Services -->
        <section class="card">
          <div class="card-header">
            <div><h2 class="card-title">Services</h2><p class="card-subtitle">{{ form.services.length }} listed · empty titles are skipped on save</p></div>
            <button type="button" @click="addService" class="btn-secondary btn-sm"><AppIcon icon="plus" class="w-4 h-4" />Add service</button>
          </div>
          <div class="card-body space-y-3">
            <div v-for="(s, i) in form.services" :key="i" class="repeat-row">
              <span class="repeat-index">{{ i + 1 }}</span>
              <div class="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-2">
                <TextInput v-model="s.title" placeholder="Service title" :aria-label="`Service ${i + 1} title`" />
                <TextInput v-model="s.description" placeholder="Brief description" :aria-label="`Service ${i + 1} description`" />
              </div>
              <button type="button" @click="form.services.splice(i, 1)" class="btn-icon hover:!text-danger-text" :aria-label="`Remove service ${i + 1}`"><AppIcon icon="trash" class="w-4 h-4" /></button>
            </div>
            <p v-if="!form.services.length" class="text-sm text-ink-muted">No services yet — add catering, decor, sound, parking and so on.</p>
          </div>
        </section>

        <!-- FAQ -->
        <section class="card">
          <div class="card-header">
            <div><h2 class="card-title">FAQ</h2><p class="card-subtitle">{{ form.faq.length }} question{{ form.faq.length === 1 ? '' : 's' }}</p></div>
            <button type="button" @click="addFaq" class="btn-secondary btn-sm"><AppIcon icon="plus" class="w-4 h-4" />Add question</button>
          </div>
          <div class="card-body space-y-3">
            <div v-for="(f, i) in form.faq" :key="i" class="repeat-row">
              <span class="repeat-index">{{ i + 1 }}</span>
              <div class="flex-1 min-w-0 space-y-2">
                <TextInput v-model="f.question" placeholder="Question" :aria-label="`Question ${i + 1}`" />
                <TextareaInput v-model="f.answer" class="[&_textarea]:!min-h-[72px]" :rows="2" auto-grow placeholder="Answer" :aria-label="`Answer ${i + 1}`" />
              </div>
              <button type="button" @click="form.faq.splice(i, 1)" class="btn-icon hover:!text-danger-text" :aria-label="`Remove question ${i + 1}`"><AppIcon icon="trash" class="w-4 h-4" /></button>
            </div>
            <p v-if="!form.faq.length" class="text-sm text-ink-muted">No questions yet — answer what customers ask most (parking, catering, timings).</p>
          </div>
        </section>

        <!-- Testimonials -->
        <section class="card">
          <div class="card-header">
            <div><h2 class="card-title">Testimonials</h2><p class="card-subtitle">{{ form.testimonials.length }} quote{{ form.testimonials.length === 1 ? '' : 's' }}</p></div>
            <button type="button" @click="addTestimonial" class="btn-secondary btn-sm"><AppIcon icon="plus" class="w-4 h-4" />Add testimonial</button>
          </div>
          <div class="card-body space-y-3">
            <div v-for="(t, i) in form.testimonials" :key="i" class="repeat-row">
              <span class="repeat-index">{{ i + 1 }}</span>
              <div class="flex-1 min-w-0 space-y-2">
                <div class="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_140px] gap-2">
                  <TextInput v-model="t.name" placeholder="Customer name" :aria-label="`Testimonial ${i + 1} name`" />
                  <SelectInput v-model="t.rating" :options="[{ value: 5, label: '5 stars' }, { value: 4, label: '4 stars' }, { value: 3, label: '3 stars' }]" :aria-label="`Testimonial ${i + 1} rating`" />
                </div>
                <TextareaInput v-model="t.quote" class="[&_textarea]:!min-h-[72px]" :rows="2" auto-grow placeholder="What they said…" :aria-label="`Testimonial ${i + 1} quote`" />
              </div>
              <button type="button" @click="form.testimonials.splice(i, 1)" class="btn-icon hover:!text-danger-text" :aria-label="`Remove testimonial ${i + 1}`"><AppIcon icon="trash" class="w-4 h-4" /></button>
            </div>
            <p v-if="!form.testimonials.length" class="text-sm text-ink-muted">No testimonials yet.</p>
          </div>
        </section>

        <!-- Social -->
        <section class="card">
          <div class="card-header"><div><h2 class="card-title">Social links</h2><p class="card-subtitle">Shown as icons on your page.</p></div></div>
          <div class="card-body grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField id="lp-fb" label="Facebook">
              <TextInput v-model="form.social_links.facebook" type="url" prefix-icon="brand-facebook" placeholder="https://facebook.com/…" />
            </FormField>
            <FormField id="lp-ig" label="Instagram">
              <TextInput v-model="form.social_links.instagram" type="url" prefix-icon="brand-instagram" placeholder="https://instagram.com/…" />
            </FormField>
            <FormField id="lp-x" label="Twitter / X">
              <TextInput v-model="form.social_links.twitter" type="url" prefix-icon="brand-x" placeholder="https://x.com/…" />
            </FormField>
            <FormField id="lp-web" label="Website">
              <TextInput v-model="form.social_links.website" type="url" prefix-icon="globe" placeholder="https://…" />
            </FormField>
          </div>
        </section>

        <FormActions sticky :saving="saving" :error="errorMsg" :success="successMsg" idle-text="The hero image saves on upload; everything else when you press Save." @save="save" />
      </div>

      <!-- Checklist -->
      <aside class="card xl:sticky xl:top-[calc(var(--topbar-height)+1.5rem)]">
        <div class="card-header"><div><h2 class="card-title">Page checklist</h2><p class="card-subtitle">{{ doneCount }} of {{ checklist.length }} done</p></div></div>
        <div class="card-body">
          <div class="h-2 rounded-full bg-surface-sunken overflow-hidden mb-4" role="progressbar" :aria-valuenow="doneCount" aria-valuemin="0" :aria-valuemax="checklist.length" aria-label="Page completeness">
            <div class="h-full bg-brand rounded-full" :style="{ width: `${(doneCount / checklist.length) * 100}%` }" />
          </div>
          <ul class="space-y-2.5">
            <li v-for="c in checklist" :key="c.label" class="flex items-center gap-2.5 text-sm">
              <span class="w-5 h-5 rounded-full flex items-center justify-center shrink-0" :class="c.done ? 'tone-success' : 'border border-dashed border-line-strong'">
                <AppIcon v-if="c.done" icon="check" class="w-3 h-3" />
              </span>
              <span :class="c.done ? 'text-ink' : 'text-ink-muted'">{{ c.label }}</span>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { FormField, TextInput, TextareaInput, SelectInput, FileUpload, FormActions } from '@/components/forms'
import { ref, reactive, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
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

async function uploadHero(file: File | undefined) {
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

const checklist = computed(() => [
  { label: 'Hero image', done: !!form.hero_image },
  { label: 'Tagline', done: !!form.tagline.trim() },
  { label: 'About text', done: form.about_text.trim().length > 40 },
  { label: 'At least 3 services', done: form.services.filter(s => s.title.trim()).length >= 3 },
  { label: 'At least 3 FAQs', done: form.faq.filter(f => f.question.trim()).length >= 3 },
  { label: 'A testimonial', done: form.testimonials.some(t => t.name.trim()) },
  { label: 'A social link', done: Object.values(form.social_links || {}).some(v => !!String(v || '').trim()) },
])
const doneCount = computed(() => checklist.value.filter(c => c.done).length)

// Public profile link (/stores/:id) — only approved stores are publicly visible.
const storeId = ref<number | null>(null)
async function loadStoreId() {
  try {
    const { data } = await api.get('/store/profile')
    const st = data.data?.store
    storeId.value = st?.status === 'approved' ? st.id : null
  } catch { storeId.value = null }
}

onMounted(() => { loadLanding(); loadStoreId() })
</script>

<style scoped>
.repeat-row { display: flex; align-items: flex-start; gap: 0.75rem; padding: 0.75rem; border: 1px solid var(--line); border-radius: var(--radius-md); background-color: var(--surface); }
.repeat-index { flex-shrink: 0; width: 1.5rem; height: 1.5rem; margin-top: calc((var(--control-h-md) - 1.5rem) / 2); border-radius: 9999px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 600; color: var(--ink-muted); background-color: var(--surface-sunken); }
</style>
