import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { detectPortalFromPath } from '@/lib/portalToken'

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
    {
      path: '/venues/:id/book',
      name: 'venue-booking',
      component: () => import('@/views/public/VenueBookingView.vue'),
      meta: { layout: 'customer', requiresAuth: true, role: 'client' },
    },

    // ── Customer (was Client) ────────────────────────────────────────────
    {
      path: '/customer/sign-in',
      name: 'customer-login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { layout: 'auth', guestOnly: true, portal: 'customer' },
    },
    {
      path: '/customer/sign-up',
      name: 'customer-register',
      component: () => import('@/views/auth/RegisterView.vue'),
      meta: { layout: 'auth', guestOnly: true, portal: 'customer' },
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('@/views/auth/ForgotPasswordView.vue'),
      meta: { layout: 'auth', guestOnly: true, portal: 'customer' },
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: () => import('@/views/auth/ResetPasswordView.vue'),
      meta: { layout: 'auth', guestOnly: true, portal: 'customer' },
    },
    {
      path: '/customer/bookings',
      name: 'customer-bookings',
      component: () => import('@/views/client/BookingsViewEnhanced.vue'),
      meta: { layout: 'customer', requiresAuth: true, role: 'client' },
    },
    {
      path: '/customer/bookings/:id',
      name: 'customer-booking-detail',
      component: () => import('@/views/client/BookingDetailView.vue'),
      meta: { layout: 'customer', requiresAuth: true, role: 'client' },
    },
    {
      path: '/customer/profile',
      name: 'customer-profile',
      component: () => import('@/views/client/ProfileView.vue'),
      meta: { layout: 'customer', requiresAuth: true, role: 'client' },
    },
    {
      path: '/customer/messages',
      name: 'customer-messages',
      component: () => import('@/views/MessagesView.vue'),
      meta: { layout: 'customer', requiresAuth: true, role: 'client' },
    },
    {
      path: '/customer/notifications',
      name: 'customer-notifications',
      component: () => import('@/views/NotificationsView.vue'),
      meta: { layout: 'customer', requiresAuth: true, role: 'client' },
    },

    // ── PayFast Payment (SANDBOX) ─────────────────────────────────────────
    {
      path: '/customer/bookings/:id/pay',
      name: 'customer-payment',
      component: () => import('@/views/client/PaymentView.vue'),
      meta: { layout: 'customer', requiresAuth: true, role: 'client' },
    },
    {
      path: '/customer/payment-success',
      name: 'customer-payment-success',
      component: () => import('@/views/client/PaymentSuccessView.vue'),
      meta: { layout: 'customer', requiresAuth: true, role: 'client' },
    },
    {
      path: '/customer/payment-cancel',
      name: 'customer-payment-cancel',
      component: () => import('@/views/client/PaymentCancelView.vue'),
      meta: { layout: 'customer', requiresAuth: true, role: 'client' },
    },

    // ── Shop (was Store Owner) ───────────────────────────────────────────
    {
      path: '/shop/sign-in',
      name: 'shop-login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { layout: 'auth', guestOnly: true, portal: 'shop' },
    },
    {
      path: '/shop/sign-up',
      name: 'shop-register',
      component: () => import('@/views/auth/RegisterView.vue'),
      meta: { layout: 'auth', guestOnly: true, portal: 'shop' },
    },
    {
      path: '/shop/dashboard',
      name: 'shop-dashboard',
      component: () => import('@/views/store/DashboardViewEnhanced.vue'),
      meta: { layout: 'shop', requiresAuth: true, role: 'store_owner' },
    },
    {
      path: '/shop/venues',
      name: 'shop-venues',
      component: () => import('@/views/store/VenuesView.vue'),
      meta: { layout: 'shop', requiresAuth: true, role: 'store_owner' },
    },
    {
      path: '/shop/venues/create',
      name: 'shop-venue-create',
      component: () => import('@/views/store/VenueFormView.vue'),
      meta: { layout: 'shop', requiresAuth: true, role: 'store_owner' },
    },
    {
      path: '/shop/venues/:id/edit',
      name: 'shop-venue-edit',
      component: () => import('@/views/store/VenueFormView.vue'),
      meta: { layout: 'shop', requiresAuth: true, role: 'store_owner' },
    },
    {
      path: '/shop/venues/:id/gallery',
      name: 'shop-venue-gallery',
      component: () => import('@/views/store/VenueGalleryView.vue'),
      meta: { layout: 'shop', requiresAuth: true, role: 'store_owner' },
    },
    {
      path: '/shop/bookings',
      name: 'shop-bookings',
      component: () => import('@/views/store/BookingsView.vue'),
      meta: { layout: 'shop', requiresAuth: true, role: 'store_owner' },
    },
    {
      path: '/shop/landing',
      name: 'shop-landing',
      component: () => import('@/views/store/ShopLandingEditor.vue'),
      meta: { layout: 'shop', requiresAuth: true, role: 'store_owner' },
    },
    {
      path: '/shop/profile',
      name: 'shop-profile',
      component: () => import('@/views/store/ProfileView.vue'),
      meta: { layout: 'shop', requiresAuth: true, role: 'store_owner' },
    },
    {
      path: '/shop/messages',
      name: 'shop-messages',
      component: () => import('@/views/MessagesView.vue'),
      meta: { layout: 'shop', requiresAuth: true, role: 'store_owner' },
    },
    {
      path: '/shop/notifications',
      name: 'shop-notifications',
      component: () => import('@/views/NotificationsView.vue'),
      meta: { layout: 'shop', requiresAuth: true, role: 'store_owner' },
    },

    // ── Support (was Admin Panel) ────────────────────────────────────────
    {
      path: '/support/sign-in',
      name: 'support-login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { layout: 'auth', guestOnly: true, portal: 'support' },
    },
    {
      path: '/support/dashboard',
      name: 'support-dashboard',
      component: () => import('@/views/admin/DashboardViewNew.vue'),
      meta: { layout: 'support', requiresAuth: true, role: 'admin' },
    },
    {
      path: '/support/users',
      name: 'support-users',
      component: () => import('@/views/admin/UsersView.vue'),
      meta: { layout: 'support', requiresAuth: true, role: 'admin' },
    },
    {
      path: '/support/stores',
      name: 'support-stores',
      component: () => import('@/views/admin/StoresView.vue'),
      meta: { layout: 'support', requiresAuth: true, role: 'admin' },
    },
    {
      path: '/support/venues',
      name: 'support-venues',
      component: () => import('@/views/admin/VenuesView.vue'),
      meta: { layout: 'support', requiresAuth: true, role: 'admin' },
    },
    {
      path: '/support/bookings',
      name: 'support-bookings',
      component: () => import('@/views/admin/BookingsView.vue'),
      meta: { layout: 'support', requiresAuth: true, role: 'admin' },
    },
    {
      path: '/support/sessions',
      name: 'support-sessions',
      component: () => import('@/views/admin/SessionsView.vue'),
      meta: { layout: 'support', requiresAuth: true, role: 'admin' },
    },
    {
      path: '/support/settings',
      name: 'support-settings',
      component: () => import('@/views/admin/SettingsView.vue'),
      meta: { layout: 'support', requiresAuth: true, role: 'admin' },
    },
    {
      path: '/support/messages',
      name: 'support-messages',
      component: () => import('@/views/MessagesView.vue'),
      meta: { layout: 'support', requiresAuth: true, role: 'admin' },
    },
    {
      path: '/support/notifications',
      name: 'support-notifications',
      component: () => import('@/views/NotificationsView.vue'),
      meta: { layout: 'support', requiresAuth: true, role: 'admin' },
    },
    {
      path: '/support/categories',
      name: 'support-categories',
      component: () => import('@/views/admin/CategoriesView.vue'),
      meta: { layout: 'support', requiresAuth: true, role: 'admin' },
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
  if (path.startsWith('/support')) return { name: 'support-login' }
  if (path.startsWith('/shop'))    return { name: 'shop-login' }
  return { name: 'customer-login' }
}

// ── Navigation Guard ───────────────────────────────────────────────────────────
router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  // Wait for initial auth check to complete
  if (!authStore.initialized) {
    await authStore.initPromise
  }

  // Switch to the target portal — this loads the correct token/user for the destination
  const targetPortal = detectPortalFromPath(to.path)
  await authStore.switchPortal(targetPortal)

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
