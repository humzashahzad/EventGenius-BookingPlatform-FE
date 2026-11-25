<template>
  <!-- Store-owner amenities manager for one venue (self-contained: own API calls). -->
  <div class="card">
    <div class="card-header justify-start">
      <span class="icon-chip icon-chip-sm tone-brand"><AppIcon icon="circle-check" class="w-4 h-4" /></span>
      <div class="min-w-0">
        <h2 class="card-title">Amenities</h2>
        <p class="card-subtitle">Free amenities are listed on the venue page; paid ones can be added by customers when booking.</p>
      </div>
    </div>

    <div class="card-body space-y-3">
      <div v-if="loading" class="py-4 flex justify-center"><AppIcon icon="loader" class="w-6 h-6 animate-spin text-ink-muted" /></div>

      <template v-else>
        <p v-if="!amenities.length" class="text-sm text-ink-muted">No amenities yet.</p>

        <div v-for="a in amenities" :key="a.id" class="flex flex-wrap items-center gap-2 p-2 pl-3 rounded-lg border border-line">
          <template v-if="editingId === a.id">
            <TextInput v-model="edit.name" class="flex-1 !w-auto min-w-[10rem]" :maxlength="255" placeholder="Name" aria-label="Amenity name" size="sm" />
            <SwitchInput v-model="edit.is_paid" label="Paid" size="sm" class="!py-0 items-center" />
            <CurrencyInput v-if="edit.is_paid" v-model="edit.price" :decimals="2" class="!w-36" placeholder="Price" aria-label="Price (PKR)" size="sm" />
            <button type="button" :disabled="busy" class="btn-primary btn-sm" @click="saveEdit(a)">Save</button>
            <button type="button" class="btn-ghost btn-sm" @click="editingId = null">Cancel</button>
          </template>
          <template v-else>
            <AppIcon icon="circle-check" class="w-4 h-4 text-brand shrink-0" />
            <span class="flex-1 min-w-0 text-sm font-medium text-ink">{{ a.name }}</span>
            <span :class="a.is_paid ? 'badge-warning' : 'badge-success'">{{ a.is_paid ? `PKR ${Number(a.price || 0).toLocaleString()}` : 'Free' }}</span>
            <button type="button" class="btn-icon btn-icon-sm" :aria-label="`Edit ${a.name}`" title="Edit" @click="startEdit(a)">
              <AppIcon icon="edit" class="w-4 h-4" />
            </button>
            <button type="button" class="btn-icon btn-icon-sm hover:!text-danger-text" :disabled="busy" :aria-label="`Delete ${a.name}`" title="Delete" @click="remove(a)">
              <AppIcon icon="trash" class="w-4 h-4" />
            </button>
          </template>
        </div>

        <!-- Add new -->
        <form class="flex flex-wrap items-end gap-3 pt-3 border-t border-line" @submit.prevent="add">
          <FormField label="New amenity" class="flex-1 min-w-[10rem]">
            <TextInput v-model="draft.name" required :maxlength="255" placeholder="e.g. Valet parking, DJ, Stage lighting" />
          </FormField>
          <div class="h-control-md flex items-center"><SwitchInput v-model="draft.is_paid" label="Paid" class="!py-0 items-center" /></div>
          <FormField v-if="draft.is_paid" label="Price" class="w-40">
            <CurrencyInput v-model="draft.price" :decimals="2" required />
          </FormField>
          <button type="submit" :disabled="busy || !draft.name.trim()" class="btn-primary">
            <AppIcon icon="plus" class="w-4 h-4" /> Add
          </button>
        </form>
        <p v-if="errorMsg" class="form-error">{{ errorMsg }}</p>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import api from '@/lib/axios'
import AppIcon from '@/components/ui/AppIcon.vue'
import { FormField, TextInput, SwitchInput, CurrencyInput } from '@/components/forms'

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
