<template>
  <div class="space-y-5">
    <header class="page-header !mb-0">
      <div>
        <h1 class="page-title">Event categories</h1>
        <p class="page-subtitle">The event types shop owners can tag venues with and customers can filter by.</p>
      </div>
      <div class="page-header-actions">
        <button @click="openCreate" class="btn-primary"><AppIcon icon="plus" class="w-4 h-4" />Add category</button>
      </div>
    </header>

    <section class="card overflow-hidden">
      <DataToolbar v-model:search="search" placeholder="Search name or slug" :count="store.loading ? undefined : filteredCategories.length" noun="categories">
        <SegmentedControl v-model="statusFilter" aria-label="Status" :options="[{ value: '', label: 'All' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]" />
      </DataToolbar>

      <div v-if="store.loading" class="p-4 space-y-3" aria-busy="true"><div v-for="i in 6" :key="i" class="skeleton h-10 w-full" /></div>

      <div v-else-if="filteredCategories.length === 0" class="empty-state">
        <div class="empty-state-icon"><AppIcon icon="tags" class="w-5 h-5" /></div>
        <p class="empty-state-title">{{ store.categories.length ? 'No categories match' : 'No categories yet' }}</p>
        <p class="empty-state-desc">{{ store.categories.length ? 'Try a different search or status.' : 'Create your first event category to get started.' }}</p>
        <div class="empty-state-actions">
          <button v-if="store.categories.length" class="btn-secondary" @click="search = ''; statusFilter = ''">Clear filters</button>
          <button v-else @click="openCreate" class="btn-primary"><AppIcon icon="plus" class="w-4 h-4" />Add category</button>
        </div>
      </div>

      <template v-else>
        <ul class="md:hidden divide-y divide-line">
          <li v-for="cat in filteredCategories" :key="cat.id" class="flex items-center gap-3 px-4 py-3">
            <span class="w-9 h-9 rounded-lg bg-surface-sunken flex items-center justify-center text-lg shrink-0" aria-hidden="true">{{ cat.emoji || cat.name?.[0] }}</span>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-ink truncate">{{ cat.name }}</p>
              <p class="ref text-xs text-ink-muted truncate">{{ cat.slug }}</p>
            </div>
            <span :class="cat.is_active ? 'badge-confirmed' : 'badge-cancelled'">{{ cat.is_active ? 'Active' : 'Inactive' }}</span>
            <button @click="openEdit(cat)" class="btn-icon btn-icon-sm" :aria-label="`Edit ${cat.name}`"><AppIcon icon="edit" class="w-4 h-4" /></button>
            <button @click="confirmDelete(cat)" class="btn-icon btn-icon-sm hover:!text-danger-text" :aria-label="`Delete ${cat.name}`"><AppIcon icon="trash" class="w-4 h-4" /></button>
          </li>
        </ul>
        <div class="hidden md:block table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <SortTh field="name" :sort-key="sortKey" :dir="sortDir" @sort="toggleSort">Name</SortTh>
                <SortTh field="slug" :sort-key="sortKey" :dir="sortDir" @sort="toggleSort">Slug</SortTh>
                <SortTh field="is_active" :sort-key="sortKey" :dir="sortDir" @sort="toggleSort">Status</SortTh>
                <SortTh field="created_at" :sort-key="sortKey" :dir="sortDir" @sort="toggleSort">Created</SortTh>
                <th class="cell-actions"><span class="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="cat in filteredCategories" :key="cat.id">
                <td>
                  <div class="flex items-center gap-3">
                    <span class="w-8 h-8 rounded-lg bg-surface-sunken flex items-center justify-center text-base shrink-0" aria-hidden="true">{{ cat.emoji || cat.name?.[0] }}</span>
                    <span class="cell-primary">{{ cat.name }}</span>
                  </div>
                </td>
                <td><code class="ref text-xs px-2 py-1 rounded-md bg-surface-sunken text-ink-secondary">{{ cat.slug }}</code></td>
                <td><span :class="cat.is_active ? 'badge-confirmed' : 'badge-cancelled'">{{ cat.is_active ? 'Active' : 'Inactive' }}</span></td>
                <td class="whitespace-nowrap">{{ formatDate((cat as any).created_at) || '—' }}</td>
                <td class="cell-actions">
                  <div class="inline-flex items-center gap-1">
                    <button @click="openEdit(cat)" class="btn-ghost btn-sm"><AppIcon icon="edit" class="w-4 h-4" />Edit</button>
                    <button @click="confirmDelete(cat)" class="btn-icon btn-icon-sm hover:!text-danger-text" :aria-label="`Delete ${cat.name}`" title="Delete"><AppIcon icon="trash" class="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </section>

    <!-- Create/Edit Modal -->
    <VuexyModal v-model:visible="showModal" :title="editingId ? 'Edit category' : 'Add category'" width="28rem">
      <form id="cat-form" @submit.prevent="handleSave" class="space-y-4">
        <FormField id="cat-name" label="Name" required>
          <TextInput v-model="form.name" required placeholder="e.g. Wedding" />
        </FormField>
        <FormField id="cat-slug" label="Slug" required hint="URL-friendly identifier, generated from the name for new categories.">
          <TextInput v-model="form.slug" required class="ref" placeholder="e.g. wedding" />
        </FormField>
        <FormField id="cat-emoji" label="Icon" optional>
          <TextInput v-model="form.emoji" placeholder="Single emoji" :maxlength="4" />
        </FormField>
        <SwitchInput id="cat-active" v-model="form.is_active" label="Active" description="Shown to shop owners and in search filters." />
        <p v-if="formError" class="alert-danger !text-sm" role="alert">{{ formError }}</p>
      </form>
      <template #footer>
        <div class="flex justify-end gap-2">
          <button class="btn-secondary" @click="showModal = false">Cancel</button>
          <button class="btn-primary" :disabled="saving" @click="handleSave">
            <AppIcon v-if="saving" icon="loader" class="w-4 h-4 animate-spin" />
            {{ saving ? 'Saving…' : editingId ? 'Save changes' : 'Create category' }}
          </button>
        </div>
      </template>
    </VuexyModal>

    <ConfirmDialog v-model:visible="showDeleteModal" title="Delete category" confirm-label="Delete" tone="danger" :loading="deleting" :error="deleteError" @confirm="handleDelete">
      Delete <strong class="text-ink">{{ deleteTarget?.emoji }} {{ deleteTarget?.name }}</strong>? This can't be undone.
    </ConfirmDialog>
  </div>
</template>

<script setup lang="ts">
import { FormField, TextInput, SwitchInput, SegmentedControl } from '@/components/forms'
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useCategoriesStore, type Category } from '@/stores/categories'
import AppIcon from '@/components/ui/AppIcon.vue'
import VuexyModal from '@/components/ui/VuexyModal.vue'
import DataToolbar from '@/components/admin/DataToolbar.vue'
import ConfirmDialog from '@/components/admin/ConfirmDialog.vue'
import SortTh from '@/components/dashboard/SortTh.vue'
import { formatDate } from '@/lib/format'

const store = useCategoriesStore()
const search = ref('')

const statusFilter = ref<'' | 'active' | 'inactive'>('')
const sortKey = ref('name')
const sortDir = ref<'asc' | 'desc'>('asc')
function toggleSort(f: string) {
  if (sortKey.value === f) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortKey.value = f; sortDir.value = 'asc' }
}

const filteredCategories = computed(() => {
  const q = search.value.toLowerCase()
  const rows = store.categories.filter(c => {
    if (statusFilter.value === 'active' && !c.is_active) return false
    if (statusFilter.value === 'inactive' && c.is_active) return false
    return !q || c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q)
  })
  const dir = sortDir.value === 'asc' ? 1 : -1
  return [...rows].sort((a: any, b: any) => {
    const av = a[sortKey.value], bv = b[sortKey.value]
    return (typeof av === 'string' ? av.localeCompare(String(bv ?? '')) : Number(av) - Number(bv)) * dir
  })
})

const showModal = ref(false)
const showDeleteModal = ref(false)
const editingId = ref<number | null>(null)
const saving = ref(false)
const formError = ref('')
const deleteTarget = ref<Category | null>(null)
const deleting = ref(false)
const deleteError = ref('')

const form = reactive({
  name: '',
  slug: '',
  emoji: '',
  is_active: true,
})

watch(() => form.name, (name) => {
  if (!editingId.value) {
    form.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
  }
})

function openCreate() {
  editingId.value = null
  form.name = ''
  form.slug = ''
  form.emoji = ''
  form.is_active = true
  formError.value = ''
  showModal.value = true
}

function openEdit(cat: Category) {
  editingId.value = cat.id
  form.name = cat.name
  form.slug = cat.slug
  form.emoji = cat.emoji
  form.is_active = cat.is_active
  formError.value = ''
  showModal.value = true
}

async function handleSave() {
  if (!form.name || !form.slug) {
    formError.value = 'Name and slug are required.'
    return
  }
  saving.value = true
  formError.value = ''
  try {
    if (editingId.value) {
      await store.updateCategory(editingId.value, { ...form })
    } else {
      await store.createCategory({ ...form })
    }
    showModal.value = false
  } catch (e: any) {
    formError.value = e.response?.data?.message || 'Failed to save category.'
  } finally {
    saving.value = false
  }
}

function confirmDelete(cat: Category) {
  deleteTarget.value = cat
  deleteError.value = ''
  showDeleteModal.value = true
}

async function handleDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await store.deleteCategory(deleteTarget.value.id)
    deleteTarget.value = null
    showDeleteModal.value = false
  } catch (e: any) {
    // Keep modal open and say why
    deleteError.value = e?.response?.data?.message || 'Could not delete this category.'
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  store.fetchCategories()
})
</script>
