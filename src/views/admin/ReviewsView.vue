<template>
  <div class="content-container">
    <div class="flex flex-wrap items-center justify-between gap-4 mb-8">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-warm-900 dark:text-warm-50">Reviews</h1>
        <p class="text-warm-500 dark:text-warm-400 mt-1">Moderate customer reviews. Hidden reviews are excluded from venue ratings.</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <input v-model="search" @keyup.enter="load(1)" class="form-input w-56" placeholder="Search venue, customer, text" />
        <select v-model="approved" @change="load(1)" class="form-select w-auto">
          <option value="">All</option>
          <option value="1">Visible</option>
          <option value="0">Hidden</option>
        </select>
        <button class="btn-outline" @click="load(1)"><AppIcon icon="search" class="w-4 h-4" /></button>
      </div>
    </div>

    <div class="card">
      <div v-if="loading" class="p-12 text-center">
        <div class="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
      </div>
      <div v-else-if="!reviews.length" class="p-12 text-center">
        <AppIcon icon="message-star" class="w-8 h-8 text-warm-400 mx-auto mb-2" />
        <p class="text-warm-500 dark:text-warm-400">No reviews found.</p>
      </div>
      <div v-else class="table-wrapper overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="table-header">
              <th class="text-left px-5 py-3 text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">Venue / Store</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">Customer</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">Rating</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">Review</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">Status</th>
              <th class="text-right px-5 py-3 text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in reviews" :key="r.id" class="table-row align-top">
              <td class="px-5 py-3 text-sm">
                <p class="font-medium text-warm-800 dark:text-warm-200">{{ r.venue?.name || '—' }}</p>
                <p class="text-xs text-warm-400">{{ r.venue?.store?.name }}</p>
              </td>
              <td class="px-5 py-3 text-sm">
                <p class="text-warm-800 dark:text-warm-200">{{ r.client?.name }}</p>
                <p class="text-xs text-warm-400">{{ r.client?.email }}</p>
              </td>
              <td class="px-5 py-3"><StarRating :model-value="r.rating" readonly size="sm" /></td>
              <td class="px-5 py-3 text-sm max-w-md">
                <p v-if="r.title" class="font-medium text-warm-800 dark:text-warm-200">{{ r.title }}</p>
                <p class="text-warm-600 dark:text-warm-400 line-clamp-3">{{ r.comment || '—' }}</p>
                <p v-if="r.store_reply" class="text-xs text-primary-600 dark:text-primary-400 mt-1 line-clamp-2">Reply: {{ r.store_reply }}</p>
                <p class="text-xs text-warm-400 mt-1">{{ formatDate(r.created_at) }}</p>
              </td>
              <td class="px-5 py-3">
                <span :class="r.is_approved ? 'badge-primary' : 'badge-warm'">{{ r.is_approved ? 'Visible' : 'Hidden' }}</span>
              </td>
              <td class="px-5 py-3 text-right whitespace-nowrap">
                <button @click="toggle(r)" :disabled="busyId === r.id" class="w-8 h-8 rounded-xl inline-flex items-center justify-center text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30" :title="r.is_approved ? 'Hide' : 'Approve'">
                  <AppIcon :icon="r.is_approved ? 'eye-off' : 'eye'" class="w-4 h-4" />
                </button>
                <button @click="remove(r)" :disabled="busyId === r.id" class="w-8 h-8 rounded-xl inline-flex items-center justify-center text-coral hover:bg-coral/10" title="Delete">
                  <AppIcon icon="trash" class="w-4 h-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="lastPage > 1" class="flex items-center justify-center gap-3 p-4 border-t border-warm-100 dark:border-warm-800">
        <button class="btn-outline text-sm" :disabled="page <= 1" @click="load(page - 1)">Previous</button>
        <span class="text-sm text-warm-500">Page {{ page }} of {{ lastPage }}</span>
        <button class="btn-outline text-sm" :disabled="page >= lastPage" @click="load(page + 1)">Next</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/lib/axios'
import AppIcon from '@/components/ui/AppIcon.vue'
import StarRating from '@/components/reviews/StarRating.vue'

const reviews = ref<any[]>([])
const loading = ref(true)
const page = ref(1)
const lastPage = ref(1)
const search = ref('')
const approved = ref('')
const busyId = ref<number | null>(null)

async function load(p = 1) {
  loading.value = true
  try {
    const { data } = await api.get('/admin/reviews', {
      params: { page: p, search: search.value || undefined, approved: approved.value || undefined },
    })
    reviews.value = data.data.data
    page.value = data.data.current_page
    lastPage.value = data.data.last_page
  } catch {
    reviews.value = []
  } finally {
    loading.value = false
  }
}

async function toggle(r: any) {
  busyId.value = r.id
  try {
    const { data } = await api.patch(`/admin/reviews/${r.id}/toggle-approval`)
    r.is_approved = data.data.is_approved
  } finally {
    busyId.value = null
  }
}

async function remove(r: any) {
  if (!confirm('Delete this review permanently from public view?')) return
  busyId.value = r.id
  try {
    await api.delete(`/admin/reviews/${r.id}`)
    reviews.value = reviews.value.filter(x => x.id !== r.id)
  } finally {
    busyId.value = null
  }
}

function formatDate(d: string) {
  return d ? new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
}

onMounted(() => load(1))
</script>
