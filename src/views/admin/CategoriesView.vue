<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h1 class="page-title">Event Categories</h1>
        <p class="page-subtitle">Manage event categories used across the platform</p>
      </div>
      <button @click="openCreate" class="btn-primary gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        Add Category
      </button>
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="card card-body">
      <div class="flex items-center justify-center py-12">
        <svg class="w-6 h-6 animate-spin" style="color: var(--color-primary)" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      </div>
    </div>

    <!-- Table -->
    <div v-else class="card">
      <div v-if="store.categories.length === 0" class="card-body text-center py-12">
        <div class="empty-state">
          <div class="empty-state-icon">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
            </svg>
          </div>
          <p class="empty-state-title">No categories yet</p>
          <p class="empty-state-desc">Create your first event category to get started</p>
          <button @click="openCreate" class="btn-primary mt-4">Add Category</button>
        </div>
      </div>

      <table v-else class="table">
        <thead>
          <tr>
            <th>Emoji</th>
            <th>Name</th>
            <th>Slug</th>
            <th>Status</th>
            <th class="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="cat in store.categories" :key="cat.id">
            <td class="text-xl">{{ cat.emoji }}</td>
            <td class="font-medium" style="color: var(--color-text)">{{ cat.name }}</td>
            <td>
              <code class="text-xs px-2 py-0.5 rounded" style="background: var(--color-bg-elevated); color: var(--color-text-secondary)">{{ cat.slug }}</code>
            </td>
            <td>
              <span class="badge" :class="cat.is_active ? 'badge-success' : 'badge-surface'">
                {{ cat.is_active ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td class="text-right">
              <div class="flex items-center justify-end gap-1">
                <button @click="openEdit(cat)" class="btn-ghost btn-sm btn-icon" title="Edit">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </button>
                <button @click="confirmDelete(cat)" class="btn-ghost btn-sm btn-icon" title="Delete" style="color: var(--danger-text)">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal max-w-md">
        <div class="modal-header">
          <h3 class="modal-title">{{ editingId ? 'Edit Category' : 'Add Category' }}</h3>
          <button @click="showModal = false" class="btn-ghost btn-icon">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <form @submit.prevent="handleSave" class="modal-body space-y-4">
          <div>
            <label class="form-label">Name *</label>
            <input v-model="form.name" type="text" required class="form-input" placeholder="e.g. Wedding" />
          </div>
          <div>
            <label class="form-label">Slug *</label>
            <input v-model="form.slug" type="text" required class="form-input" placeholder="e.g. wedding" />
            <p class="text-xs mt-1" style="color: var(--color-text-muted)">URL-friendly identifier (auto-generated from name if left empty)</p>
          </div>
          <div>
            <label class="form-label">Emoji</label>
            <input v-model="form.emoji" type="text" class="form-input" placeholder="e.g. 💍" maxlength="4" />
          </div>
          <div class="flex items-center gap-2">
            <input v-model="form.is_active" type="checkbox" id="cat-active" class="form-checkbox" />
            <label for="cat-active" class="text-sm" style="color: var(--color-text)">Active</label>
          </div>

          <div v-if="formError" class="text-sm rounded-lg p-3" style="color: var(--danger-text); background: var(--danger-bg);">
            {{ formError }}
          </div>
        </form>
        <div class="modal-footer">
          <button @click="showModal = false" class="btn-ghost">Cancel</button>
          <button @click="handleSave" :disabled="saving" class="btn-primary">
            {{ saving ? 'Saving...' : editingId ? 'Update' : 'Create' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirm Modal -->
    <div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget = null">
      <div class="modal max-w-sm">
        <div class="modal-header">
          <h3 class="modal-title">Delete Category</h3>
          <button @click="deleteTarget = null" class="btn-ghost btn-icon">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <p class="text-sm" style="color: var(--color-text-secondary)">
            Are you sure you want to delete <strong style="color: var(--color-text)">{{ deleteTarget.emoji }} {{ deleteTarget.name }}</strong>? This cannot be undone.
          </p>
        </div>
        <div class="modal-footer">
          <button @click="deleteTarget = null" class="btn-ghost">Cancel</button>
          <button @click="handleDelete" :disabled="deleting" class="btn-danger">
            {{ deleting ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue'
import { useCategoriesStore, type Category } from '@/stores/categories'

const store = useCategoriesStore()

const showModal = ref(false)
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

// Auto-generate slug from name
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
}

async function handleDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await store.deleteCategory(deleteTarget.value.id)
    deleteTarget.value = null
  } catch {
    // Keep modal open
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  store.fetchCategories()
})
</script>
