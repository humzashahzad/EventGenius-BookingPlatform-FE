import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory('/'),
  routes: [
    // ── Public ───────────────────────────────────────────────────────────
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/public/HomeView.vue'),
      meta: { layout: 'public' },
    },
    {
      path: '/venues',
      name: 'venues',
      component: () => import('@/views/public/VenuesView.vue'),
      meta: { layout: 'public' },
    },
    {
      path: '/venues/:id',
      name: 'venue-detail',
      component: () => import('@/views/public/VenueDetailView.vue'),
      meta: { layout: 'public' },
    },

    // ── Client ────────────────────────────────────────────────────────────
    {
      path: '/client/sign-in',
      name: 'client-login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { layout: 'auth', guestOnly: true, portal: 'client' },
    },
    {
      path: '/client/sign-up',
      name: 'client-register',
      component: () => import('@/views/auth/RegisterView.vue'),
      meta: { layout: 'auth', guestOnly: true, portal: 'client' },
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('@/views/auth/ForgotPasswordView.vue'),
      meta: { layout: 'auth', guestOnly: true, portal: 'client' },
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: () => import('@/views/auth/ResetPasswordView.vue'),
      meta: { layout: 'auth', guestOnly: true, portal: 'client' },
    },
    {
      path: '/client/dashboard',
      name: 'client-dashboard',
      component: () => import('@/views/client/DashboardViewEnhanced.vue'),
      meta: { layout: 'client', requiresAuth: true, role: 'client' },
    },
    {
      path: '/client/bookings',
      name: 'client-bookings',
      component: () => import('@/views/client/BookingsViewEnhanced.vue'),
      meta: { layout: 'client', requiresAuth: true, role: 'client' },
    },
    {
      path: '/client/bookings/:id',
      name: 'client-booking-detail',
      component: () => import('@/views/client/BookingDetailView.vue'),
      meta: { layout: 'client', requiresAuth: true, role: 'client' },
    },
    {
      path: '/client/profile',
      name: 'client-profile',
      component: () => import('@/views/client/ProfileView.vue'),
      meta: { layout: 'client', requiresAuth: true, role: 'client' },
    },
    {
      path: '/client/messages',
      name: 'client-messages',
      component: () => import('@/views/MessagesView.vue'),
      meta: { layout: 'client', requiresAuth: true, role: 'client' },
    },

    // ── PayFast Payment (SANDBOX) ─────────────────────────────────────────
    {
      path: '/client/bookings/:id/pay',
      name: 'client-payment',
      component: () => import('@/views/client/PaymentView.vue'),
      meta: { layout: 'client', requiresAuth: true, role: 'client' },
    },
    {
      path: '/client/payment-success',
      name: 'client-payment-success',
      component: () => import('@/views/client/PaymentSuccessView.vue'),
      meta: { layout: 'client', requiresAuth: true, role: 'client' },
    },
    {
      path: '/client/payment-cancel',
      name: 'client-payment-cancel',
      component: () => import('@/views/client/PaymentCancelView.vue'),
      meta: { layout: 'client', requiresAuth: true, role: 'client' },
    },

    // ── Store Owner ───────────────────────────────────────────────────────
    {
      path: '/store/sign-in',
      name: 'store-login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { layout: 'auth', guestOnly: true, portal: 'store' },
    },
    {
      path: '/store/sign-up',
      name: 'store-register',
      component: () => import('@/views/auth/RegisterView.vue'),
      meta: { layout: 'auth', guestOnly: true, portal: 'store' },
    },
    {
      path: '/store/dashboard',
      name: 'store-dashboard',
      component: () => import('@/views/store/DashboardViewEnhanced.vue'),
      meta: { layout: 'store', requiresAuth: true, role: 'store_owner' },
    },
    {
      path: '/store/venues',
      name: 'store-venues',
      component: () => import('@/views/store/VenuesView.vue'),
      meta: { layout: 'store', requiresAuth: true, role: 'store_owner' },
    },
    {
      path: '/store/venues/create',
      name: 'store-venue-create',
      component: () => import('@/views/store/VenueFormView.vue'),
      meta: { layout: 'store', requiresAuth: true, role: 'store_owner' },
    },
    {
      path: '/store/venues/:id/edit',
      name: 'store-venue-edit',
      component: () => import('@/views/store/VenueFormView.vue'),
      meta: { layout: 'store', requiresAuth: true, role: 'store_owner' },
    },
    {
      path: '/store/venues/:id/gallery',
      name: 'store-venue-gallery',
      component: () => import('@/views/store/VenueGalleryView.vue'),
      meta: { layout: 'store', requiresAuth: true, role: 'store_owner' },
    },
    {
      path: '/store/bookings',
      name: 'store-bookings',
      component: () => import('@/views/store/BookingsView.vue'),
      meta: { layout: 'store', requiresAuth: true, role: 'store_owner' },
    },
    {
      path: '/store/profile',
      name: 'store-profile',
      component: () => import('@/views/store/ProfileView.vue'),
      meta: { layout: 'store', requiresAuth: true, role: 'store_owner' },
    },
    {
      path: '/store/messages',
      name: 'store-messages',
      component: () => import('@/views/MessagesView.vue'),
      meta: { layout: 'store', requiresAuth: true, role: 'store_owner' },
    },

    // ── Admin Panel ───────────────────────────────────────────────────────
    {
      path: '/admin-panel/sign-in',
      name: 'admin-login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { layout: 'auth', guestOnly: true, portal: 'admin' },
    },
    {
      path: '/admin-panel/dashboard',
      name: 'admin-dashboard',
      component: () => import('@/views/admin/DashboardViewNew.vue'),
      meta: { layout: 'admin', requiresAuth: true, role: 'admin' },
    },
    {
      path: '/admin-panel/users',
      name: 'admin-users',
      component: () => import('@/views/admin/UsersView.vue'),
      meta: { layout: 'admin', requiresAuth: true, role: 'admin' },
    },
    {
      path: '/admin-panel/stores',
      name: 'admin-stores',
      component: () => import('@/views/admin/StoresView.vue'),
      meta: { layout: 'admin', requiresAuth: true, role: 'admin' },
    },
    {
      path: '/admin-panel/venues',
      name: 'admin-venues',
      component: () => import('@/views/admin/VenuesView.vue'),
      meta: { layout: 'admin', requiresAuth: true, role: 'admin' },
    },
    {
      path: '/admin-panel/bookings',
      name: 'admin-bookings',
      component: () => import('@/views/admin/BookingsView.vue'),
      meta: { layout: 'admin', requiresAuth: true, role: 'admin' },
    },
    {
      path: '/admin-panel/sessions',
      name: 'admin-sessions',
      component: () => import('@/views/admin/SessionsView.vue'),
      meta: { layout: 'admin', requiresAuth: true, role: 'admin' },
    },
    {
      path: '/admin-panel/settings',
      name: 'admin-settings',
      component: () => import('@/views/admin/SettingsView.vue'),
      meta: { layout: 'admin', requiresAuth: true, role: 'admin' },
    },
    {
      path: '/admin-panel/messages',
      name: 'admin-messages',
      component: () => import('@/views/MessagesView.vue'),
      meta: { layout: 'admin', requiresAuth: true, role: 'admin' },
    },

    // ── Catch-all ─────────────────────────────────────────────────────────
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
    },
  ],
})

// Determine the correct login route based on the path being accessed
function loginRouteForPath(path: string): { name: string } {
  if (path.startsWith('/admin-panel')) return { name: 'admin-login' }
  if (path.startsWith('/store'))       return { name: 'store-login' }
  return { name: 'client-login' }
}

// ── Navigation Guard ───────────────────────────────────────────────────────────
router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  if (!authStore.initialized) {
    await authStore.initPromise
  }

  // Not logged in trying to access a protected route → send to the right login page
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    return loginRouteForPath(to.path)
  }

  // Already logged in trying to access a guest-only page → go to dashboard
  if (to.meta.guestOnly && authStore.isLoggedIn) {
    return authStore.defaultRoute
  }

  // Logged in but wrong role for this route → redirect to own dashboard
  if (to.meta.role && authStore.isLoggedIn && authStore.user?.role !== to.meta.role) {
    return authStore.defaultRoute
  }
})

export default router
