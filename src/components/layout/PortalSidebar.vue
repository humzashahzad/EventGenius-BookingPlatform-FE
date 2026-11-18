<template>
  <aside
    class="fixed top-3 left-3 bottom-3 z-40 flex flex-col bg-white dark:bg-warm-800 border border-warm-200 dark:border-warm-700 rounded-2xl shadow-float transition-all duration-300 ease-out lg:translate-x-0 overflow-hidden"
    :class="[
      collapsed ? 'w-[4.5rem]' : 'w-64',
      collapsed ? '-translate-x-[calc(100%+1rem)]' : 'translate-x-0',
    ]"
    :aria-label="`${portalLabel} navigation`"
  >
    <!-- Brand -->
    <div class="flex items-center h-14 px-3 border-b border-warm-200 dark:border-warm-700 shrink-0">
      <RouterLink :to="homeTo" class="flex items-center gap-2.5 min-w-0 flex-1" :title="collapsed ? 'EventGenius' : undefined">
        <span class="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-md shadow-primary-500/20 shrink-0">
          <span class="text-white font-extrabold text-xs">EG</span>
        </span>
        <span v-show="!collapsed" class="min-w-0">
          <span class="block font-bold text-sm text-warm-900 dark:text-white leading-tight truncate">EventGenius</span>
          <span class="block text-[11px] font-medium uppercase tracking-wider text-primary-600 dark:text-primary-400 leading-tight">{{ portalLabel }}</span>
        </span>
      </RouterLink>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto scrollbar-thin py-3">
      <template v-for="(section, si) in sections" :key="si">
        <p
          v-if="section.title"
          v-show="!collapsed"
          class="px-4 text-[11px] font-semibold uppercase tracking-wider text-warm-400 dark:text-warm-500 mb-1"
          :class="si > 0 ? 'mt-5' : ''"
        >
          {{ section.title }}
        </p>
        <div v-else-if="si > 0" class="my-3 mx-4 border-t border-warm-100 dark:border-warm-700" />
        <RouterLink
          v-for="item in section.items"
          :key="item.to"
          :to="item.to"
          :title="collapsed ? item.label : undefined"
          class="group relative flex items-center gap-3 px-3 py-2.5 mx-2 rounded-xl text-sm transition-colors duration-150"
          :class="isActive(item)
            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-semibold'
            : item.accent
              ? 'text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 font-medium'
              : 'text-warm-600 dark:text-warm-300 hover:bg-warm-50 dark:hover:bg-warm-700/60 hover:text-warm-900 dark:hover:text-white'"
          :aria-current="isActive(item) ? 'page' : undefined"
          @click="onNavigate"
        >
          <span
            v-if="isActive(item)"
            class="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-primary-500"
            aria-hidden="true"
          />
          <span class="relative shrink-0">
            <AppIcon :icon="item.icon" class="w-5 h-5" />
            <span
              v-if="item.badge && collapsed"
              class="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-bold rounded-full bg-coral text-white"
            >{{ item.badge > 99 ? '99+' : item.badge }}</span>
          </span>
          <span v-show="!collapsed" class="flex-1 truncate">{{ item.label }}</span>
          <span
            v-if="item.badge && !collapsed"
            class="min-w-[20px] px-1.5 py-0.5 text-[11px] font-bold text-center rounded-full bg-coral text-white"
          >{{ item.badge > 99 ? '99+' : item.badge }}</span>
        </RouterLink>
      </template>
    </nav>

    <!-- User + sign out -->
    <div class="border-t border-warm-200 dark:border-warm-700 p-2 shrink-0">
      <div class="flex items-center gap-2.5 px-2 py-2" :class="collapsed ? 'justify-center' : ''">
        <img v-if="avatarUrl" :src="avatarUrl" alt="" class="w-8 h-8 rounded-full object-cover shrink-0" />
        <span v-else class="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 flex items-center justify-center text-xs font-semibold shrink-0">{{ initials }}</span>
        <span v-show="!collapsed" class="min-w-0 flex-1">
          <span class="block text-sm font-medium text-warm-900 dark:text-white truncate">{{ authStore.user?.name }}</span>
          <span class="block text-xs text-warm-500 dark:text-warm-400 truncate">{{ authStore.user?.email }}</span>
        </span>
        <button
          v-show="!collapsed"
          type="button"
          class="p-2 rounded-lg text-warm-400 hover:text-coral hover:bg-red-50 dark:hover:bg-red-900/20"
          title="Sign out"
          aria-label="Sign out"
          @click="signOut"
        >
          <AppIcon icon="logout" class="w-4 h-4" />
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getStorageUrl } from '@/lib/storageUrl'
import AppIcon from '@/components/ui/AppIcon.vue'

export interface NavItem {
  to: string
  label: string
  icon: string
  badge?: number
  /** Highlight as a call-to-action (e.g. "Add venue"). */
  accent?: boolean
  /** Match only this exact path (otherwise any sub-path matches). */
  exact?: boolean
}
export interface NavSection {
  title?: string
  items: NavItem[]
}

const props = defineProps<{
  collapsed?: boolean
  sections: NavSection[]
  portalLabel: string
  homeTo: string
  signInTo: string
}>()
const emit = defineEmits<{ 'update:collapsed': [value: boolean] }>()

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const avatarUrl = computed(() => (authStore.user?.avatar ? getStorageUrl(authStore.user.avatar) : ''))
const initials = computed(() =>
  (authStore.user?.name || 'EG').split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase(),
)

// The most specific matching item wins, so "/shop/venues/create" highlights
// "Add venue" rather than "My venues".
const activeTo = computed(() => {
  const all = props.sections.flatMap(s => s.items)
  const matches = all.filter(i => (i.exact ? route.path === i.to : route.path === i.to || route.path.startsWith(i.to + '/')))
  return matches.sort((a, b) => b.to.length - a.to.length)[0]?.to
})
function isActive(item: NavItem) {
  return item.to === activeTo.value
}

function onNavigate() {
  // On small screens the sidebar is an overlay — close it after navigating.
  if (window.innerWidth < 1024) emit('update:collapsed', true)
}

async function signOut() {
  await authStore.logout()
  router.push(props.signInTo)
}
</script>
