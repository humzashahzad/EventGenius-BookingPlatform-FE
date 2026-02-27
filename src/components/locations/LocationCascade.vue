<template>
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
    <!-- Country -->
    <div class="form-group">
      <label class="form-label">Country <span v-if="required" class="text-danger-500">*</span></label>
      <select v-model="selectedCountry" :required="required" class="form-input" @change="onCountryChange">
        <option value="">Select country</option>
        <option v-for="c in countries" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>
    </div>

    <!-- City -->
    <div class="form-group">
      <label class="form-label">City <span v-if="required" class="text-danger-500">*</span></label>
      <select v-model="selectedCity" :required="required" :disabled="!selectedCountry" class="form-input" @change="onCityChange">
        <option value="">Select city</option>
        <option v-for="c in cities" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>
    </div>

    <!-- Area -->
    <div class="form-group">
      <label class="form-label">Area</label>
      <select v-model="selectedArea" :disabled="!selectedCity" class="form-input" @change="onAreaChange">
        <option value="">Select area (optional)</option>
        <option v-for="a in areas" :key="a.id" :value="a.id">{{ a.name }}</option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useLocationsStore, type LocationNode } from '@/stores/locations'

const props = defineProps<{
  modelValue?: number | null
  required?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
}>()

const locationsStore = useLocationsStore()

const selectedCountry = ref<number | ''>('')
const selectedCity = ref<number | ''>('')
const selectedArea = ref<number | ''>('')

const countries = computed(() => locationsStore.tree)

const cities = computed(() => {
  if (!selectedCountry.value) return []
  const country = locationsStore.tree.find(c => c.id === selectedCountry.value)
  return country?.children || []
})

const areas = computed(() => {
  if (!selectedCity.value) return []
  const country = locationsStore.tree.find(c => c.id === selectedCountry.value)
  const city = country?.children?.find(c => c.id === selectedCity.value)
  return city?.children || []
})

function onCountryChange() {
  selectedCity.value = ''
  selectedArea.value = ''
  emit('update:modelValue', null)
}

function onCityChange() {
  selectedArea.value = ''
  emitValue()
}

function onAreaChange() {
  emitValue()
}

function emitValue() {
  // Prefer the most specific selection
  const value = selectedArea.value || selectedCity.value || selectedCountry.value || null
  emit('update:modelValue', value ? Number(value) : null)
}

// Set initial values from modelValue by walking up the tree
watch(() => props.modelValue, (id) => {
  if (!id || !locationsStore.tree.length) return
  for (const country of locationsStore.tree) {
    if (country.id === id) {
      selectedCountry.value = country.id
      return
    }
    for (const city of (country.children || [])) {
      if (city.id === id) {
        selectedCountry.value = country.id
        selectedCity.value = city.id
        return
      }
      for (const area of (city.children || [])) {
        if (area.id === id) {
          selectedCountry.value = country.id
          selectedCity.value = city.id
          selectedArea.value = area.id
          return
        }
      }
    }
  }
}, { immediate: true })

onMounted(() => {
  if (!locationsStore.tree.length) {
    locationsStore.fetchAllowedTree()
  }
})
</script>
