<template>
  <div class="space-y-3" :class="$attrs.class">
    <FormField :label="addressLabel" :required="required" :error="errors?.address">
      <TextInput v-model="address" prefix-icon="map-pin" :placeholder="placeholder" autocomplete="street-address" :disabled="disabled" />
    </FormField>
    <FormField v-if="cities" label="City" :required="required" :error="errors?.city">
      <Combobox v-model="city" :options="cities" placeholder="Choose a city" allow-custom :disabled="disabled" />
    </FormField>
    <div v-if="coordinates" class="grid grid-cols-1 min-[420px]:grid-cols-[1fr_1fr_auto] gap-3 items-end">
      <FormField label="Latitude" :error="errors?.latitude">
        <NumberInput v-model="lat" :min="-90" :max="90" :step="0.000001" :decimals="6" :stepper="false" placeholder="31.520400" :disabled="disabled" />
      </FormField>
      <FormField label="Longitude" :error="errors?.longitude">
        <NumberInput v-model="lng" :min="-180" :max="180" :step="0.000001" :decimals="6" :stepper="false" placeholder="74.358700" :disabled="disabled" />
      </FormField>
      <button type="button" class="btn-secondary" :disabled="disabled || locating" @click="locate">
        <AppIcon :icon="locating ? 'loader' : 'locate'" :class="['w-4 h-4', locating && 'animate-spin']" />Use my location
      </button>
    </div>
    <p v-if="geoError" class="form-error" role="alert">{{ geoError }}</p>
  </div>
</template>

<script setup lang="ts">
/**
 * Address + optional city + optional latitude/longitude, without a map
 * library. "Use my location" fills the coordinates from the browser.
 * v-model: { address, city?, latitude, longitude } (numbers or null).
 */
import { computed, ref } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import Combobox from './Combobox.vue'
import FormField from './FormField.vue'
import NumberInput from './NumberInput.vue'
import TextInput from './TextInput.vue'

export interface LocationValue { address: string; city?: string; latitude: number | null; longitude: number | null }
defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<{
  addressLabel?: string
  placeholder?: string
  /** Pass a list to show a city picker. */
  cities?: string[]
  coordinates?: boolean
  required?: boolean
  disabled?: boolean
  errors?: Partial<Record<keyof LocationValue, string>>
}>(), { addressLabel: 'Address', placeholder: 'Street, area, landmark', cities: undefined, coordinates: true, errors: undefined })
const model = defineModel<LocationValue>({ default: () => ({ address: '', city: '', latitude: null, longitude: null }) })

const patch = (p: Partial<LocationValue>) => { model.value = { ...model.value, ...p } }
const address = computed({ get: () => model.value.address ?? '', set: v => patch({ address: v ?? '' }) })
const city = computed({ get: () => model.value.city ?? '', set: v => patch({ city: v ?? '' }) })
const lat = computed({ get: () => model.value.latitude, set: v => patch({ latitude: v }) })
const lng = computed({ get: () => model.value.longitude, set: v => patch({ longitude: v }) })

const locating = ref(false)
const geoError = ref('')
function locate() {
  geoError.value = ''
  if (!('geolocation' in navigator)) { geoError.value = 'Location is not available in this browser.'; return }
  locating.value = true
  navigator.geolocation.getCurrentPosition(
    pos => { patch({ latitude: Number(pos.coords.latitude.toFixed(6)), longitude: Number(pos.coords.longitude.toFixed(6)) }); locating.value = false },
    () => { geoError.value = 'Could not get your location. Allow location access or type the coordinates.'; locating.value = false },
    { enableHighAccuracy: true, timeout: 10000 },
  )
}
void props
</script>
