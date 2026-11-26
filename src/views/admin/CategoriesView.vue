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
      <DataToolbar v-model:search="search" placeholder="Search name or slug" :count="firstLoad ? undefined : filteredCategories.length" noun="categories">
        <SegmentedControl v-model="statusFilter" aria-label="Status" :options="[{ value: '', label: 'All' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]" />
      </DataToolbar>

      <div v-if="firstLoad" class="p-4 space-y-3" aria-busy="true"><div v-for="i in 6" :key="i" class="skeleton h-10 w-full" /></div>

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
            <button type="button" class="status-toggle" :class="cat.is_active ? 'badge-confirmed' : 'badge-cancelled'" :disabled="isBusy(cat)" :aria-pressed="cat.is_active" :aria-label="`${cat.name}: ${cat.is_active ? 'active' : 'inactive'}. Select to ${cat.is_active ? 'deactivate' : 'activate'}`" @click="toggleActive(cat)">{{ cat.is_active ? 'Active' : 'Inactive' }}</button>
            <button @click="openEdit(cat)" class="btn-icon btn-icon-sm" :disabled="isBusy(cat)" :aria-label="`Edit ${cat.name}`"><AppIcon icon="edit" class="w-4 h-4" /></button>
            <button @click="confirmDelete(cat)" class="btn-icon btn-icon-sm hover:!text-danger-text" :disabled="isBusy(cat)" :aria-label="`Delete ${cat.name}`"><AppIcon icon="trash" class="w-4 h-4" /></button>
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
                <td><button type="button" class="status-toggle" :class="cat.is_active ? 'badge-confirmed' : 'badge-cancelled'" :disabled="isBusy(cat)" :aria-pressed="cat.is_active" :title="cat.is_active ? 'Select to deactivate' : 'Select to activate'" :aria-label="`${cat.name}: ${cat.is_active ? 'active' : 'inactive'}. Select to ${cat.is_active ? 'deactivate' : 'activate'}`" @click="toggleActive(cat)">{{ cat.is_active ? 'Active' : 'Inactive' }}</button></td>
                <td class="whitespace-nowrap">{{ formatDate((cat as any).created_at) || '—' }}</td>
                <td class="cell-actions">
                  <div class="inline-flex items-center gap-1">
                    <button @click="openEdit(cat)" class="btn-ghost btn-sm" :disabled="isBusy(cat)"><AppIcon :icon="actions.isPending(cat.id, 'save') ? 'loader' : 'edit'" :class="actions.isPending(cat.id, 'save') ? 'w-4 h-4 animate-spin' : 'w-4 h-4'" />Edit</button>
                    <button @click="confirmDelete(cat)" :disabled="isBusy(cat)" class="btn-icon btn-icon-sm hover:!text-danger-text" :aria-label="`Delete ${cat.name}`" title="Delete"><AppIcon icon="trash" class="w-4 h-4" /></button>
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
          <button class="btn-primary" @click="handleSave">
            {{ editingId ? 'Save changes' : 'Create category' }}
          </button>
        </div>
      </template>
    </VuexyModal>

    <ConfirmDialog v-model:visible="showDeleteModal" title="Delete category" confirm-label="Delete" tone="danger" @confirm="handleDelete">
      Delete <strong class="text-ink">{{ deleteTarget?.emoji }} {{ deleteTarget?.name }}</strong>? This can't be undone.
    </ConfirmDialog>
  </div>
</template>

<script setup lang="ts">
import { FormField, TextInput, SwitchInput, SegmentedControl } from '@/components/forms'
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { toast } from 'vue-sonner'
import api from '@/lib/axios'
import { useCategoriesStore, type Category } from '@/stores/categories'
import AppIcon from '@/components/ui/AppIcon.vue'
import VuexyModal from '@/components/ui/VuexyModal.vue'
import DataToolbar from '@/components/admin/DataToolbar.vue'
import ConfirmDialog from '@/components/admin/ConfirmDialog.vue'
import SortTh from '@/components/dashboard/SortTh.vue'
import { formatDate } from '@/lib/format'
import { useRowActions } from '@/composables/useRowActions'

const store = useCategoriesStore()
const actions = useRowActions()
const search = ref('')
// Skeleton only while nothing has been loaded yet; later fetches keep the table on screen.
const firstLoad = computed(() => store.loading && !store.categories.length)

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
const formError = ref('')
const deleteTarget = ref<Category | null>(null)

const form = reactive({
  name: '',
  slug: '',
  emoji: '',
  is_active: true,
})

// Rows created on screen before the server answers get a temporary negative id.
let tempId = -1
function isBusy(cat: Category) { return cat.id < 0 || actions.isPending(cat.id) }

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

function indexOf(id: number) { return store.categories.findIndex(c => c.id === id) }
function replaceRow(id: number, row: Category) {
  const i = indexOf(id)
  if (i >= 0) store.categories[i] = row
}
/** Merge what the server sent back into the row (it may send only some fields). */
function mergeServer(id: number, res: any) {
  const row = res?.data?.data ?? (res?.data?.id ? res.data : null)
  const i = indexOf(id)
  if (i < 0 || !row || typeof row !== 'object') return
  // A row created on screen takes the real id from the server; existing rows keep theirs.
  store.categories[i] = { ...store.categories[i], ...row, id: id < 0 ? (row.id ?? id) : id }
}

/** Remember the server's reason so the re-opened form can show it. */
function keepError<R>(p: Promise<R>): Promise<R> {
  return p.catch((e: any) => {
    lastSaveError = e?.response?.data?.message || ''
    throw e
  })
}

/** Re-open the form with what was typed and the server's reason, so nothing is lost. */
function reopenForm(id: number | null, payload: typeof form, message: string) {
  editingId.value = id
  Object.assign(form, payload)
  formError.value = message
  showModal.value = true
}

function handleSave() {
  if (!form.name || !form.slug) {
    formError.value = 'Name and slug are required.'
    return
  }
  const payload = { ...form }
  const id = editingId.value
  formError.value = ''
  showModal.value = false

  if (id) {
    const before = store.categories[indexOf(id)]
    if (!before) return
    actions.run(id, {
      apply: () => replaceRow(id, { ...before, ...payload }),
      request: () => keepError(api.put(`/admin/categories/${id}`, payload)),
      onSuccess: (res: any) => mergeServer(id, res),
      rollback: () => replaceRow(id, before),
      success: `${payload.name} saved`,
      error: false,
    }, 'save').then(ok => { if (!ok) failSave(id, payload, 'Could not save this category.') })
    return
  }

  const tmp = tempId--
  actions.run(tmp, {
    apply: () => { store.categories.push({ id: tmp, ...payload } as Category) },
    request: () => keepError(api.post('/admin/categories', payload)),
    onSuccess: (res: any) => mergeServer(tmp, res),
    rollback: () => { store.categories = store.categories.filter(c => c.id !== tmp) },
    success: `${payload.name} added`,
    error: false,
  }, 'save').then(ok => { if (!ok) failSave(null, payload, 'Could not create this category.') })
}

let lastSaveError = ''
function failSave(id: number | null, payload: typeof form, fallback: string) {
  const message = lastSaveError || fallback
  lastSaveError = ''
  // Another dialog is open by now: don't stack a second one, just say what happened.
  if (showModal.value || showDeleteModal.value) toast.error(message)
  else reopenForm(id, payload, message)
}
function toggleActive(cat: Category) {
  const was = cat.is_active
  const id = cat.id
  actions.run(id, {
    apply: () => { cat.is_active = !was },
    request: () => api.put(`/admin/categories/${id}`, { name: cat.name, slug: cat.slug, emoji: cat.emoji, is_active: !was }),
    onSuccess: (res: any) => mergeServer(id, res),
    rollback: () => { const row = store.categories[indexOf(id)]; if (row) row.is_active = was },
    success: `${cat.name} ${was ? 'deactivated' : 'activated'}`,
    error: 'Could not update this category.',
  }, 'toggle')
}

function confirmDelete(cat: Category) {
  deleteTarget.value = cat
  showDeleteModal.value = true
}

function handleDelete() {
  const cat = deleteTarget.value
  if (!cat) return
  showDeleteModal.value = false
  let idx = -1
  actions.run(cat.id, {
    apply: () => {
      idx = indexOf(cat.id)
      store.categories = store.categories.filter(c => c.id !== cat.id)
    },
    request: () => api.delete(`/admin/categories/${cat.id}`),
    rollback: () => {
      if (indexOf(cat.id) >= 0) return
      const next = [...store.categories]
      next.splice(idx < 0 ? next.length : Math.min(idx, next.length), 0, cat)
      store.categories = next
    },
    success: `${cat.name} deleted`,
    error: 'Could not delete this category.',
  }, 'delete')
}

/** Re-sync quietly: keep the table if the request fails, and keep rows that are mid-change. */
async function quietRefresh() {
  try {
    const { data } = await api.get('/categories')
    const fresh: Category[] = data.data || data || []
    const local = new Map(store.categories.map(c => [c.id, c]))
    const pendingNew = store.categories.filter(c => c.id < 0)
    store.categories = [...fresh.map(c => (actions.isPending(c.id) ? local.get(c.id) ?? c : c)), ...pendingNew]
  } catch { /* keep what is on screen */ }
}

onMounted(() => {
  if (store.categories.length) quietRefresh()
  else store.fetchCategories()
})
</script>

<style scoped>
.status-toggle { cursor: pointer; transition: filter 120ms ease; }
.status-toggle:hover:not(:disabled) { filter: brightness(0.95); }
.status-toggle:focus-visible { outline: 2px solid var(--brand); outline-offset: 2px; }
.status-toggle:disabled { cursor: default; opacity: 0.7; }
</style>
