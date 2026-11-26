import { watchEffect, onBeforeUnmount } from 'vue'

/**
 * Browser tab titles: always "EventGenius | {Page Title}".
 * Static titles come from this map (by route name); pages whose title depends on their
 * content (a venue, a shop) call usePageTitle() with their own name once it loads.
 */
const APP = 'EventGenius'

const TITLES: Record<string, string> = {
  home: 'Home',
  venues: 'Venues',
  'venue-detail': 'Venue',
  ask: 'Ask EventGenius',
  'venue-booking': 'Book a venue',
  shops: 'Shops',
  'store-profile': 'Shop',
  'forgot-password': 'Forgot password',
  'reset-password': 'Reset password',
  'not-found': 'Page not found',

  'customer-login': 'Sign in',
  'customer-register': 'Create account',
  'customer-dashboard': 'Dashboard',
  'customer-bookings': 'My bookings',
  'customer-booking-detail': 'Booking details',
  'customer-profile': 'Profile',
  'customer-messages': 'Messages',
  'customer-notifications': 'Notifications',
  'customer-payment': 'Payment',
  'customer-payment-success': 'Payment successful',
  'customer-payment-cancel': 'Payment cancelled',

  'shop-login': 'Shop sign in',
  'shop-register': 'Register your shop',
  'shop-dashboard': 'Dashboard',
  'shop-venues': 'My venues',
  'shop-venue-create': 'Add venue',
  'shop-venue-edit': 'Edit venue',
  'shop-venue-gallery': 'Venue gallery',
  'shop-bookings': 'Bookings',
  'shop-booking-detail': 'Booking details',
  'shop-reviews': 'Reviews',
  'shop-landing': 'Public page',
  'shop-profile': 'Shop profile',
  'shop-messages': 'Messages',
  'shop-notifications': 'Notifications',

  'support-login': 'Support sign in',
  'support-dashboard': 'Dashboard',
  'support-users': 'Users',
  'support-stores': 'Stores',
  'support-venues': 'Venues',
  'support-bookings': 'Bookings',
  'support-sessions': 'Sessions',
  'support-settings': 'Settings',
  'support-messages': 'Messages',
  'support-notifications': 'Notifications',
  'support-categories': 'Categories',
  'support-reviews': 'Reviews',
  'support-search': 'Search & ranking',
  'support-dev-forms': 'Form components',
}

export function formatTitle(pageTitle?: string | null): string {
  const t = (pageTitle ?? '').trim()
  return t ? `${APP} | ${t}` : APP
}

export function setPageTitle(pageTitle?: string | null): void {
  document.title = formatTitle(pageTitle)
}

/** Title for a route by its name (falls back to the app name alone). */
export function titleForRoute(name: unknown): string | null {
  return typeof name === 'string' ? TITLES[name] ?? null : null
}

/**
 * For pages whose title comes from loaded data, e.g.
 *   usePageTitle(() => venue.value?.name)
 * The route's static title shows until the value is available.
 */
export function usePageTitle(getter: () => string | null | undefined): void {
  const stop = watchEffect(() => {
    const t = getter()
    if (t) setPageTitle(t)
  })
  onBeforeUnmount(stop)
}
