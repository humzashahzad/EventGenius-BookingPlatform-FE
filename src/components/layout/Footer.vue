<template>
  <footer class="site-footer" aria-labelledby="footer-heading">
    <h2 id="footer-heading" class="sr-only">Site footer</h2>

    <!-- Call to action -->
    <div class="content-container">
      <div class="footer-cta">
        <div class="min-w-0">
          <p class="footer-eyebrow">Planning an event?</p>
          <p class="footer-cta-title">Find the right venue, or fill more dates at yours.</p>
          <p class="footer-cta-text">Compare halls, marquees and conference venues across Pakistan with real reviews and clear per-head prices.</p>
        </div>
        <div class="footer-cta-actions">
          <RouterLink to="/venues" class="footer-btn footer-btn-primary">
            <AppIcon icon="search" class="w-4 h-4" /> Browse venues
          </RouterLink>
          <RouterLink to="/shop/sign-up" class="footer-btn footer-btn-secondary">
            <AppIcon icon="building-store" class="w-4 h-4" /> List your venue
          </RouterLink>
        </div>
      </div>
    </div>

    <!-- Link columns -->
    <div class="content-container footer-main">
      <div class="footer-brand">
        <RouterLink to="/" class="inline-flex items-center gap-2.5 rounded-md" aria-label="EventGenius home">
          <AppLogo class="w-9 h-9" />
          <span class="footer-wordmark">EventGenius</span>
        </RouterLink>
        <p class="footer-about">
          Discover, compare and book event venues across Pakistan — weddings, mehndi and walima, birthdays, conferences and more — with secure online payment.
        </p>
        <ul class="footer-trust">
          <li><AppIcon icon="shield-check" class="w-4 h-4" /> Verified venues and owners</li>
          <li><AppIcon icon="credit-card" class="w-4 h-4" /> Secure PayFast checkout</li>
          <li><AppIcon icon="message" class="w-4 h-4" /> Chat with venues before you book</li>
          <li><AppIcon icon="star" class="w-4 h-4" /> Reviews only from real bookings</li>
        </ul>
      </div>

      <nav class="footer-col" aria-label="Occasions">
        <h3 class="footer-heading">Occasions</h3>
        <ul>
          <li v-for="o in occasions" :key="o.slug">
            <RouterLink :to="{ path: '/venues', query: { event_type: o.slug } }" class="footer-link">{{ o.label }}</RouterLink>
          </li>
        </ul>
      </nav>

      <nav class="footer-col" aria-label="Cities">
        <h3 class="footer-heading">Cities</h3>
        <ul>
          <li v-for="c in cities" :key="c">
            <RouterLink :to="{ path: '/venues', query: { city: c } }" class="footer-link">Venues in {{ c }}</RouterLink>
          </li>
        </ul>
      </nav>

      <nav class="footer-col" aria-label="Customers">
        <h3 class="footer-heading">Customers</h3>
        <ul>
          <li><RouterLink to="/customer/sign-up" class="footer-link">Create an account</RouterLink></li>
          <li><RouterLink to="/customer/sign-in" class="footer-link">Sign in</RouterLink></li>
          <li><RouterLink to="/customer/bookings" class="footer-link">My bookings</RouterLink></li>
          <li><RouterLink to="/customer/messages" class="footer-link">Messages</RouterLink></li>
        </ul>
      </nav>

      <nav class="footer-col" aria-label="Venue owners and help">
        <h3 class="footer-heading">Venue owners</h3>
        <ul>
          <li><RouterLink to="/shop/sign-up" class="footer-link">List your venue</RouterLink></li>
          <li><RouterLink to="/shop/sign-in" class="footer-link">Owner sign in</RouterLink></li>
        </ul>
        <h3 class="footer-heading footer-heading-gap">Help</h3>
        <ul>
          <li><RouterLink to="/customer/messages" class="footer-link">Message support</RouterLink></li>
          <li><RouterLink to="/forgot-password" class="footer-link">Reset your password</RouterLink></li>
        </ul>
      </nav>
    </div>

    <!-- Bottom bar -->
    <div class="footer-bottom">
      <div class="content-container footer-bottom-inner">
        <p>&copy; {{ year }} EventGenius. All rights reserved.</p>
        <button type="button" class="footer-top" @click="toTop">
          <AppIcon icon="chevron-up" class="w-4 h-4" /> Back to top
        </button>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import AppLogo from '@/components/brand/AppLogo.vue'
import AppIcon from '@/components/ui/AppIcon.vue'

const year = new Date().getFullYear()

// Slugs match the categories table; links open the filtered venue search.
const occasions = [
  { slug: 'weddings', label: 'Weddings' },
  { slug: 'engagement_parties', label: 'Engagements' },
  { slug: 'bridal_showers', label: 'Mehndi & bridal showers' },
  { slug: 'birthday_parties', label: 'Birthday parties' },
  { slug: 'corporate_events', label: 'Corporate events' },
  { slug: 'conferences', label: 'Conferences' },
]
const cities = ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Peshawar']

function toTop() {
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
}
</script>

<style scoped>
/* Light footer built on the theme tokens (follows dark mode automatically where enabled). */
.site-footer { background: var(--surface-sunken); color: var(--ink-secondary); border-top: 1px solid var(--line); }

.footer-cta {
  display: flex; flex-direction: column; gap: 20px;
  margin-top: 48px; padding: 28px; border-radius: 16px;
  background: var(--surface); border: 1px solid var(--line); box-shadow: var(--shadow-sm);
}
.footer-eyebrow { margin: 0 0 6px; font-size: 12px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--brand-text); }
.footer-cta-title { margin: 0; font-family: var(--font-display, inherit); font-size: 22px; line-height: 1.25; font-weight: 700; color: var(--ink); letter-spacing: -0.01em; }
.footer-cta-text { margin: 8px 0 0; font-size: 14px; line-height: 1.6; color: var(--ink-muted); max-width: 46ch; }
.footer-cta-actions { display: flex; flex-wrap: wrap; gap: 12px; }
.footer-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  height: 44px; padding: 0 20px; border-radius: 10px;
  font-size: 15px; font-weight: 600; white-space: nowrap; transition: background-color .15s ease, border-color .15s ease;
}
.footer-btn-primary { background: var(--brand-strong); color: var(--on-brand); border: 1px solid var(--brand-strong); }
.footer-btn-primary:hover { background: var(--brand-hover, var(--brand-strong)); border-color: var(--brand-hover, var(--brand-strong)); }
.footer-btn-secondary { background: var(--surface); color: var(--ink); border: 1px solid var(--line-strong); }
.footer-btn-secondary:hover { background: var(--surface-hover); }

.footer-main {
  display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 40px 24px;
  padding-top: 48px; padding-bottom: 40px;
}
.footer-brand { grid-column: 1 / -1; }
.footer-wordmark { font-family: var(--font-display, inherit); font-weight: 700; font-size: 20px; letter-spacing: -0.01em; color: var(--ink); }
.footer-about { margin: 16px 0 0; max-width: 40ch; font-size: 14px; line-height: 1.65; color: var(--ink-muted); }
.footer-trust { margin: 20px 0 0; padding: 0; list-style: none; display: grid; gap: 10px; font-size: 14px; color: var(--ink-secondary); }
.footer-trust li { display: flex; align-items: center; gap: 10px; }
.footer-trust :deep(svg) { color: var(--brand-text); flex-shrink: 0; }

.footer-heading { margin: 0 0 10px; font-size: 12px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--ink); }
.footer-col ul { margin: 0; padding: 0; list-style: none; }
.footer-heading-gap { margin-top: 24px; }
.footer-link {
  display: inline-flex; align-items: center; min-height: 32px;
  font-size: 14px; color: var(--ink-secondary); border-radius: 4px; transition: color .15s ease;
}
.footer-link:hover { color: var(--brand-text); text-decoration: underline; text-underline-offset: 3px; }

.footer-bottom { border-top: 1px solid var(--line); }
.footer-bottom-inner {
  display: flex; flex-direction: column; gap: 12px; padding-top: 20px; padding-bottom: 24px;
  font-size: 13px; color: var(--ink-muted);
}
.footer-bottom-inner p { margin: 0; }
.footer-top {
  display: inline-flex; align-items: center; gap: 6px; align-self: flex-start;
  height: 32px; padding: 0 12px; border-radius: 8px; border: 1px solid var(--line-strong);
  background: var(--surface); color: var(--ink-secondary); font-size: 13px; font-weight: 500; cursor: pointer;
}
.footer-top:hover { background: var(--surface-hover); color: var(--ink); }

.site-footer a:focus-visible, .site-footer button:focus-visible { outline: 2px solid var(--brand-strong); outline-offset: 2px; }

@media (min-width: 640px) {
  .footer-main { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@media (min-width: 768px) {
  .footer-cta { flex-direction: row; align-items: center; justify-content: space-between; padding: 32px 36px; }
  .footer-cta-actions { flex-shrink: 0; }
  .footer-bottom-inner { flex-direction: row; align-items: center; justify-content: space-between; }
  .footer-top { align-self: auto; }
}
@media (min-width: 1024px) {
  .footer-main { grid-template-columns: minmax(0, 1.6fr) repeat(4, minmax(0, 1fr)); gap: 32px; padding-top: 56px; }
  .footer-brand { grid-column: auto; padding-right: 24px; }
}
</style>
