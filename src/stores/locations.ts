import { ref } from 'vue'
import { defineStore } from 'pinia'
import api from '@/lib/axios'

export interface LocationNode {
  id: number
  parent_id: number | null
  name: string
  level: 'country' | 'city' | 'area'
  boundary: any | null
  is_active: boolean
  children?: LocationNode[]
  parent?: { id: number; name: string; level: string }
}

export const useLocationsStore = defineStore('locations', () => {
  const tree = ref<LocationNode[]>([])
  const flat = ref<LocationNode[]>([])
  const loading = ref(false)

  async function fetchTree() {
    loading.value = true
    try {
      const { data } = await api.get('/admin/locations/tree')
      tree.value = data.data
    } catch {
      tree.value = []
    } finally {
      loading.value = false
    }
  }

  async function fetchAll(params?: Record<string, any>) {
    loading.value = true
    try {
      const { data } = await api.get('/admin/locations', { params })
      flat.value = data.data
    } catch {
      flat.value = []
    } finally {
      loading.value = false
    }
  }

  async function fetchAllowedTree() {
    loading.value = true
    try {
      const { data } = await api.get('/locations/allowed')
      tree.value = data.data
    } catch {
      tree.value = []
    } finally {
      loading.value = false
    }
  }

  async function createLocation(payload: Partial<LocationNode>) {
    const { data } = await api.post('/admin/locations', payload)
    return data.data as LocationNode
  }

  async function updateLocation(id: number, payload: Partial<LocationNode>) {
    const { data } = await api.put(`/admin/locations/${id}`, payload)
    return data.data as LocationNode
  }

  async function deleteLocation(id: number) {
    await api.delete(`/admin/locations/${id}`)
  }

  async function toggleLocation(id: number) {
    const { data } = await api.patch(`/admin/locations/${id}/toggle`)
    return data.data as LocationNode
  }

  return {
    tree,
    flat,
    loading,
    fetchTree,
    fetchAll,
    fetchAllowedTree,
    createLocation,
    updateLocation,
    deleteLocation,
    toggleLocation,
  }
})
