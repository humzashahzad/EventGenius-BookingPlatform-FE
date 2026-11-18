<template>
  <!-- Store-owner amenities manager for one venue (self-contained: own API calls). -->
  <div class="card">
    <div class="border-b border-warm-200 dark:border-warm-700 px-5 py-4 sm:px-6 flex items-center gap-3">
      <div class="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
        <AppIcon icon="sparkles" class="w-4 h-4 text-primary-600 dark:text-primary-400" />
      </div>
      <div>
        <h2 class="text-sm font-semibold text-warm-900 dark:text-warm-50">Amenities</h2>
        <p class="text-xs text-warm-500 dark:text-warm-400">Free amenities are listed on the venue page; paid ones can be added by customers when booking.</p>
      </div>
    </div>

    <div class="p-5 sm:p-6 space-y-4">
      <div v-if="loading" class="py-4 text-center">
        <div class="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
      </div>

      <template v-else>
        <p v-if="!amenities.length" class="text-sm text-warm-500 dark:text-warm-400">No amenities yet.</p>

        <div v-for="a in amenities" :key="a.id" class="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-warm-200 dark:border-warm-700">
          <template v-if="editingId === a.id">
            <input v-model="edit.name" class="form-input flex-1 min-w-[10rem]" maxlength="255" placeholder="Name" />
            <label class="inline-flex items-center gap-2 text-sm text-warm-700 dark:text-warm-300">
              <input v-model="edit.is_paid" type="checkbox" class="rounded" /> Paid
            </label>
            <input v-if="edit.is_paid" v-model.number="edit.price" type="number" min="0" step="0.01" class="form-input w-32" placeholder="Price (PKR)" />
            <button type="button" @click="saveEdit(a)" :disabled="busy" class="btn-primary text-sm">Save</button>
            <button type="button" @click="editingId = null" class="btn-ghost text-sm">Cancel</button>
          </template>
          <template v-else>
            <AppIcon icon="circle-check" class="w-4 h-4 text-primary-500 shrink-0" />
            <span class="flex-1 text-sm font-medium text-warm-800 dark:text-warm-100">{{ a.name }}</span>
            <span :class="a.is_paid ? 'badge-accent' : 'badge-primary'">{{ a.is_paid ? `PKR ${Number(a.price || 0).toLocaleString()}` : 'Free' }}</span>
            <button type="button" @click="startEdit(a)" class="w-8 h-8 rounded-xl flex items-center justify-center text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30" title="Edit">
              <AppIcon icon="edit" class="w-4 h-4" />
            </button>
            <button type="button" @click="remove(a)" :disabled="busy" class="w-8 h-8 rounded-xl flex items-center justify-center text-coral hover:bg-coral/10" title="Delete">
              <AppIcon icon="trash" class="w-4 h-4" />
            </button>
          </template>
        </div>

        <!-- Add new -->
        <form @submit.prevent="add" class="flex flex-wrap items-end gap-3 pt-2 border-t border-warm-100 dark:border-warm-800">
          <div class="flex-1 min-w-[10rem]">
            <label class="form-label">New amenity</label>
            <input v-model="draft.name" required maxlength="255" class="form-input" placeholder="e.g. Valet parking, DJ, Stage lighting" />
          </div>
          <label class="inline-flex items-center gap-2 text-sm text-warm-700 dark:text-warm-300 pb-2.5">
            <input v-model="draft.is_paid" type="checkbox" class="rounded" /> Paid
          </label>
          <div v-if="draft.is_paid" class="w-36">
            <label class="form-label">Price (PKR)</label>
            <input v-model.number="draft.price" type="number" min="0" step="0.01" required class="form-input" />
          </div>
          <button type="submit" :disabled="busy || !draft.name.trim()" class="btn-primary inline-flex items-center gap-1.5">
            <AppIcon icon="plus" class="w-4 h-4" /> Add
          </button>
        </form>
        <p v-if="errorMsg" class="text-sm text-coral">{{ errorMsg }}</p>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import api from '@/lib/axios'
import AppIcon from '@/components/ui/AppIcon.vue'

interface Amenity { id: number; name: string; icon?: string | null; is_paid: boolean; price: number | null }

const props = defineProps<{ venueId: number | string }>()

const amenities = ref<Amenity[]>([])
const loading = ref(true)
const busy = ref(false)
const errorMsg = ref('')
const editingId = ref<number | null>(null)
const draft = reactive({ name: '', is_paid: false, price: null as number | null })
const edit = reactive({ name: '', is_paid: false, price: null as number | null })

function apiError(e: any, fallback: string) {
  const errs = e.response?.data?.errors
  errorMsg.value = errs ? (Object.values(errs)[0] as string[])[0] : (e.response?.data?.message || fallback)
}

function payload(src: { name: string; is_paid: boolean; price: number | null }) {
  return { name: src.name.trim(), is_paid: src.is_paid, price: src.is_paid ? src.price : null }
}

async function load() {
  loading.value = true
  try {
    const { data } = await api.get(`/store/venues/${props.venueId}/amenities`)
    amenities.value = data.data || []
  } catch (e) {
    apiError(e, 'Failed to load amenities.')
  } finally {
    loading.value = false
  }
}

async function add() {
  busy.value = true; errorMsg.value = ''
  try {
    const { data } = await api.post(`/store/venues/${props.venueId}/amenities`, payload(draft))
    amenities.value.push(data.data)
    Object.assign(draft, { name: '', is_paid: false, price: null })
  } catch (e) { apiError(e, 'Failed to add amenity.') } finally { busy.value = false }
}

function startEdit(a: Amenity) {
  editingId.value = a.id
  Object.assign(edit, { name: a.name, is_paid: a.is_paid, price: a.price })
}

async function saveEdit(a: Amenity) {
  busy.value = true; errorMsg.value = ''
  try {
    const { data } = await api.put(`/store/venues/${props.venueId}/amenities/${a.id}`, payload(edit))
    Object.assign(a, data.data)
    editingId.value = null
  } catch (e) { apiError(e, 'Failed to update amenity.') } finally { busy.value = false }
}

async function remove(a: Amenity) {
  if (!confirm(`Remove "${a.name}"?`)) return
  busy.value = true; errorMsg.value = ''
  try {
    await api.delete(`/store/venues/${props.venueId}/amenities/${a.id}`)
    amenities.value = amenities.value.filter(x => x.id !== a.id)
  } catch (e) { apiError(e, 'Failed to remove amenity.') } finally { busy.value = false }
}

watch(() => props.venueId, load)
onMounted(load)
</script>
