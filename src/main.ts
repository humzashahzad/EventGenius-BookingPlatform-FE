import './assets/main.css'
import 'vue-sonner/style.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { migrateOldToken } from '@/lib/portalToken'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// Migrate old single auth_token to portal-specific keys (one-time)
migrateOldToken().finally(() => {
  app.mount('#app')
})
