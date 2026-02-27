import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/lib/axios'

export interface Category {
  id: number
  name: string
  slug: string
  emoji: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export const useCategoriesStore = defineStore('categories', () => {
  const categories = ref<Category[]>([])
  const loading = ref(false)

  async function fetchCategories() {
    loading.value = true
    try {
      const { data } = await api.get('/categories')
      categories.value = data.data || data || []
    } catch {
      categories.value = []
    } finally {
      loading.value = false
    }
  }

  async function createCategory(payload: Partial<Category>) {
    const { data } = await api.post('/admin/categories', payload)
    categories.value.push(data.data || data)
    return data.data || data
  }

  async function updateCategory(id: number, payload: Partial<Category>) {
    const { data } = await api.put(`/admin/categories/${id}`, payload)
    const idx = categories.value.findIndex(c => c.id === id)
    if (idx >= 0) categories.value[idx] = data.data || data
    return data.data || data
  }

  async function deleteCategory(id: number) {
    await api.delete(`/admin/categories/${id}`)
    categories.value = categories.value.filter(c => c.id !== id)
  }

  return { categories, loading, fetchCategories, createCategory, updateCategory, deleteCategory }
})
