<template>
  <footer class="site-footer">
    <div class="site-footer-inner">
      <div class="site-footer-grid">
        <!-- Brand -->
        <div class="site-footer-brand">
          <RouterLink to="/" class="flex items-center gap-2 no-underline mb-3">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background: linear-gradient(135deg, #d97706, #f59e0b);">
              <span class="text-xs font-bold" style="color: #1a1a00;">EG</span>
            </div>
            <span class="font-bold" style="color: var(--color-text);">EventGenius</span>
          </RouterLink>
          <p class="text-sm leading-relaxed" style="color: var(--color-text-muted);">
            The easiest way to discover and book event venues. From weddings to conferences, we've got you covered.
          </p>
        </div>

        <!-- Quick Links -->
        <div>
          <h4 class="site-footer-heading">Platform</h4>
          <div class="site-footer-links">
            <RouterLink to="/venues">Browse Venues</RouterLink>
            <RouterLink to="/customer/sign-up">Create Account</RouterLink>
            <RouterLink to="/shop/sign-up">List Your Venue</RouterLink>
          </div>
        </div>

        <!-- Support -->
        <div>
          <h4 class="site-footer-heading">Support</h4>
          <div class="site-footer-links">
            <RouterLink to="/customer/messages">Contact Us</RouterLink>
            <span class="text-sm" style="color: var(--color-text-muted)">help@eventgenius.com</span>
          </div>
        </div>
      </div>

      <!-- Bottom -->
      <div class="site-footer-bottom">
        <p>&copy; {{ year }} EventGenius. All rights reserved.</p>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
const year = new Date().getFullYear()
</script>

<style scoped>
.site-footer {
  background: var(--color-bg-elevated);
  border-top: 1px solid var(--color-border);
  margin-top: auto;
}

.site-footer-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem 1.5rem;
}

.site-footer-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 2rem;
}

@media (max-width: 768px) {
  .site-footer-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}

.site-footer-brand {
  max-width: 320px;
}

.site-footer-heading {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
  margin-bottom: 0.75rem;
}

.site-footer-links {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.site-footer-links a {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  text-decoration: none;
  transition: color 0.15s;
}

.site-footer-links a:hover {
  color: var(--color-primary);
}

.site-footer-bottom {
  margin-top: 2rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--color-border);
  text-align: center;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}
</style>
