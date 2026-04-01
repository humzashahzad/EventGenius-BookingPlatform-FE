<template>
  <div class="content-container">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-warm-900 dark:text-warm-50">Event Categories</h1>
        <p class="text-warm-500 dark:text-warm-400 mt-1">Manage event categories used across the platform</p>
      </div>
      <button @click="openCreate" class="btn-primary inline-flex items-center gap-1.5">
        <AppIcon icon="plus" class="w-4 h-4" />
        Add Category
      </button>
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="card">
      <div class="p-5 text-center py-12">
        <div class="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
      </div>
    </div>

    <!-- Table Card -->
    <div v-else class="card">
      <!-- Empty -->
      <div v-if="filteredCategories.length === 0" class="p-5 text-center py-12">
        <div class="w-14 h-14 rounded-2xl bg-warm-100 dark:bg-warm-800 flex items-center justify-center mx-auto mb-4">
          <AppIcon icon="tags" class="w-7 h-7 text-warm-400" />
        </div>
        <p class="font-medium text-warm-700 dark:text-warm-300 mb-1">No categories yet</p>
        <p class="text-warm-500 dark:text-warm-400 text-sm mb-4">Create your first event category to get started</p>
        <button @click="openCreate" class="btn-primary text-sm inline-flex items-center gap-1.5">
          <AppIcon icon="plus" class="w-4 h-4" />
          Add Category
        </button>
      </div>

      <!-- Table -->
      <div v-else class="table-wrapper overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="table-header">
              <th class="text-left px-5 py-3 text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">Emoji</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">Name</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">Slug</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">Status</th>
              <th class="text-right px-5 py-3 text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cat in filteredCategories" :key="cat.id" class="table-row">
              <td class="px-5 py-3 text-xl">{{ cat.emoji }}</td>
              <td class="px-5 py-3 text-sm font-medium text-warm-800 dark:text-warm-200">{{ cat.name }}</td>
              <td class="px-5 py-3">
                <code class="text-xs px-2 py-1 rounded-lg bg-warm-100 dark:bg-warm-800 text-warm-600 dark:text-warm-400 font-mono">{{ cat.slug }}</code>
              </td>
              <td class="px-5 py-3">
                <span :class="cat.is_active ? 'badge-primary' : 'badge-warm'">
                  {{ cat.is_active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="px-5 py-3 text-right">
                <div class="flex items-center justify-end gap-1">
                  <button @click="openEdit(cat)" class="w-8 h-8 rounded-xl flex items-center justify-center text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors" title="Edit">
                    <AppIcon icon="edit" class="w-4 h-4" />
                  </button>
                  <button @click="confirmDelete(cat)" class="w-8 h-8 rounded-xl flex items-center justify-center text-coral hover:bg-coral/10 dark:hover:bg-coral/20 transition-colors" title="Delete">
                    <AppIcon icon="trash" class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <VuexyModal v-model:visible="showModal" :title="editingId ? 'Edit Category' : 'Add Category'" width="28rem">
      <form @submit.prevent="handleSave" class="space-y-4">
        <div>
          <label class="form-label">Name *</label>
          <input v-model="form.name" type="text" required class="form-input" placeholder="e.g. Wedding" />
        </div>
        <div>
          <label class="form-label">Slug *</label>
          <input v-model="form.slug" type="text" required class="form-input" placeholder="e.g. wedding" />
          <p class="text-xs text-warm-400 dark:text-warm-500 mt-1.5">URL-friendly identifier (auto-generated from name if left empty)</p>
        </div>
        <div>
          <label class="form-label">Emoji</label>
          <input v-model="form.emoji" type="text" class="form-input" placeholder="e.g. ring" maxlength="4" />
        </div>
        <div class="flex items-center gap-2.5">
          <input v-model="form.is_active" type="checkbox" id="cat-active" class="w-4 h-4 rounded-md border-warm-300 dark:border-warm-600 text-primary-600 focus:ring-primary-500 dark:bg-warm-800" />
          <label for="cat-active" class="text-sm text-warm-700 dark:text-warm-300">Active</label>
        </div>
        <div v-if="formError" class="rounded-xl bg-coral/5 dark:bg-coral/10 border border-coral/20 px-4 py-3 text-sm text-coral">{{ formError }}</div>
      </form>
      <template #footer>
        <button class="btn-secondary" @click="showModal = false">Cancel</button>
        <button class="btn-primary inline-flex items-center" :disabled="saving" @click="handleSave">
          <AppIcon v-if="saving" icon="loader" class="w-4 h-4 animate-spin mr-1.5" />
          {{ saving ? 'Saving...' : editingId ? 'Update' : 'Create' }}
        </button>
      </template>
    </VuexyModal>

    <!-- Delete Confirm Modal -->
    <VuexyModal v-model:visible="showDeleteModal" title="Delete Category" width="24rem">
      <p class="text-warm-500 dark:text-warm-400">
        Are you sure you want to delete <strong class="text-warm-800 dark:text-warm-200">{{ deleteTarget?.emoji }} {{ deleteTarget?.name }}</strong>? This cannot be undone.
      </p>
      <template #footer>
        <button class="btn-secondary" @click="showDeleteModal = false">Cancel</button>
        <button class="btn-danger inline-flex items-center" :disabled="deleting" @click="handleDelete">
          <AppIcon v-if="deleting" icon="loader" class="w-4 h-4 animate-spin mr-1.5" />
          {{ deleting ? 'Deleting...' : 'Delete' }}
        </button>
      </template>
    </VuexyModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { useCategoriesStore, type Category } from '@/stores/categories'
import { useTopBarActionsStore } from '@/stores/topBarActions'
import AppIcon from '@/components/ui/AppIcon.vue'
import VuexyModal from '@/components/ui/VuexyModal.vue'

const store = useCategoriesStore()
const topBarActions = useTopBarActionsStore()
const search = ref('')

const filteredCategories = computed(() => {
  if (!search.value) return store.categories
  const q = search.value.toLowerCase()
  return store.categories.filter(c => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q))
})

const showModal = ref(false)
const showDeleteModal = ref(false)
const editingId = ref<number | null>(null)
const saving = ref(false)
const formError = ref('')
const deleteTarget = ref<Category | null>(null)
const deleting = ref(false)

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
  showDeleteModal.value = true
}

async function handleDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await store.deleteCategory(deleteTarget.value.id)
    deleteTarget.value = null
    showDeleteModal.value = false
  } catch {
    // Keep modal open
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  store.fetchCategories()
  topBarActions.set({
    searchPlaceholder: 'Search categories...',
    searchValue: search.value,
    onSearch(q: string) {
      search.value = q
    },
  })
})

onUnmounted(() => {
  topBarActions.clear()
})
</script>
