<template>
  <!--
    ╔══════════════════════════════════════════════════╗
    ║  Payment Cancelled Page — SANDBOX MODE           ║
    ║  User is redirected here if they cancel payment  ║
    ╚══════════════════════════════════════════════════╝
  -->
  <div class="p-6 max-w-2xl">
    <!-- Cancel Card -->
    <div class="card text-center py-10">
      <!-- X Icon -->
      <div class="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
        <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>

      <h1 class="text-2xl font-bold text-gray-900 mb-2">Payment Cancelled</h1>
      <p class="text-gray-500 mb-6">
        Your payment was cancelled. No charges were made.
        <br />
        You can try again from your booking details page.
      </p>

      <!-- Booking Reference -->
      <div v-if="bookingId" class="bg-gray-50 rounded-lg p-4 max-w-sm mx-auto mb-6">
        <p class="text-sm text-gray-500">
          Booking ID: <span class="font-mono text-gray-700">#{{ bookingId }}</span>
        </p>
      </div>

      <!-- Actions -->
      <div class="flex gap-3 justify-center">
        <RouterLink
          v-if="bookingId"
          :to="`/client/bookings/${bookingId}`"
          class="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-5 rounded-lg transition-colors text-sm"
        >
          Back to Booking
        </RouterLink>
        <RouterLink
          to="/client/bookings"
          class="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-5 rounded-lg transition-colors text-sm"
        >
          All Bookings
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

// ── Query params from PayFast redirect ───────────────────────────────────────
const route = useRoute()
const bookingId = ref(route.query.booking_id as string || '')
</script>
