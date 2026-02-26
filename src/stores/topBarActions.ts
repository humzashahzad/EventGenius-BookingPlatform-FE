import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'

export interface FilterOption {
  value: string
  label: string
}

export interface FilterConfig {
  key: string
  label: string
  options: FilterOption[]
}

export interface TopBarActionsConfig {
  searchPlaceholder?: string
  searchValue?: string
  filterOptions?: FilterConfig[]
  initialFilterValues?: Record<string, string>
  onSearch?: (q: string) => void
  onFilter?: (key: string, value: string) => void
}

export const useTopBarActionsStore = defineStore('topBarActions', () => {
  const visible = ref(false)
  const searchPlaceholder = ref('Search…')
  const searchValue = ref('')
  const filterOptions = ref<FilterConfig[]>([])
  const filterValues = reactive<Record<string, string>>({})
  let onSearchCb: ((q: string) => void) | undefined
  let onFilterCb: ((key: string, value: string) => void) | undefined

  function set(config: TopBarActionsConfig) {
    visible.value = true
    searchPlaceholder.value = config.searchPlaceholder ?? 'Search…'
    searchValue.value = config.searchValue ?? ''
    filterOptions.value = config.filterOptions ?? []
    onSearchCb = config.onSearch
    onFilterCb = config.onFilter
    for (const k of Object.keys(filterValues)) delete filterValues[k]
    for (const f of filterOptions.value) {
      filterValues[f.key] = config.initialFilterValues?.[f.key] ?? ''
    }
  }

  function clear() {
    visible.value = false
    searchValue.value = ''
    filterOptions.value = []
    onSearchCb = undefined
    onFilterCb = undefined
    for (const k of Object.keys(filterValues)) delete filterValues[k]
  }

  function triggerSearch(q: string) {
    searchValue.value = q
    onSearchCb?.(q)
  }

  function triggerFilter(key: string, value: string) {
    filterValues[key] = value
    onFilterCb?.(key, value)
  }

  return {
    visible,
    searchPlaceholder,
    searchValue,
    filterOptions,
    filterValues,
    set,
    clear,
    triggerSearch,
    triggerFilter,
  }
})
