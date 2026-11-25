<template>
  <aside
    class="fixed inset-y-0 left-0 z-40 flex flex-col bg-surface border-r border-line transition-[width,transform] duration-200 ease-out lg:translate-x-0 overflow-hidden"
    :class="[
      collapsed ? 'w-[4.5rem] -translate-x-full shadow-none' : 'w-64 translate-x-0 max-lg:shadow-xl',
    ]"
    :aria-label="`${portalLabel} navigation`"
  >
    <!-- Brand -->
    <div class="flex items-center h-16 px-4 border-b border-line shrink-0" :class="collapsed ? 'justify-center px-0' : ''">
      <RouterLink :to="homeTo" class="flex items-center gap-2.5 min-w-0 rounded-md" :title="collapsed ? 'EventGenius' : undefined">
        <AppLogo class="w-8 h-8 shrink-0" />
        <span v-show="!collapsed" class="min-w-0">
          <span class="block font-display font-bold text-[0.9375rem] text-ink leading-tight truncate">EventGenius</span>
          <span class="block text-[11px] font-semibold uppercase tracking-wider text-brand-text leading-tight">{{ portalLabel }}</span>
        </span>
      </RouterLink>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin py-4" :class="collapsed ? 'px-3' : 'px-3'">
      <template v-for="(section, si) in sections" :key="si">
        <p
          v-if="section.title && !collapsed"
          class="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-muted"
          :class="si > 0 ? 'mt-6' : ''"
        >
          {{ section.title }}
        </p>
        <div v-else-if="si > 0" class="my-3 mx-2 border-t border-line" />
        <RouterLink
          v-for="item in section.items"
          :key="item.to"
          :to="item.to"
          :title="collapsed ? item.label : undefined"
          class="group relative flex items-center gap-3 h-10 max-lg:h-11 mb-0.5 rounded-md text-sm transition-colors duration-150"
          :class="[
            collapsed ? 'justify-center px-0' : 'px-3',
            isActive(item)
              ? 'bg-brand-soft text-brand-text font-semibold'
              : item.accent
                ? 'text-brand-text font-medium hover:bg-brand-soft'
                : 'text-ink-secondary font-medium hover:bg-surface-hover hover:text-ink',
          ]"
          :aria-current="isActive(item) ? 'page' : undefined"
          @click="onNavigate"
        >
          <span
            v-if="isActive(item)"
            class="absolute -left-3 top-2 bottom-2 w-[3px] rounded-r bg-brand-strong dark:bg-brand"
            aria-hidden="true"
          />
          <span class="relative shrink-0">
            <AppIcon :icon="item.icon" class="w-[18px] h-[18px]" />
            <span
              v-if="item.badge && collapsed"
              class="count-badge absolute -top-2 -right-2.5 !min-w-[1rem] !h-4 !px-1 !text-[10px]"
            >{{ item.badge > 99 ? '99+' : item.badge }}</span>
          </span>
          <span v-show="!collapsed" class="flex-1 truncate">{{ item.label }}</span>
          <span v-if="item.badge && !collapsed" class="count-badge">{{ item.badge > 99 ? '99+' : item.badge }}</span>
        </RouterLink>
      </template>
    </nav>

    <!-- User + sign out -->
    <div class="border-t border-line p-3 shrink-0">
      <div class="flex items-center gap-2.5" :class="collapsed ? 'justify-center' : 'px-1'">
        <img v-if="avatarUrl" :src="avatarUrl" alt="" class="w-9 h-9 rounded-full object-cover shrink-0 border border-line" />
        <span v-else class="avatar">{{ initials }}</span>
        <span v-show="!collapsed" class="min-w-0 flex-1">
          <span class="block text-sm font-semibold text-ink truncate">{{ authStore.user?.name }}</span>
          <span class="block text-xs text-ink-muted truncate">{{ authStore.user?.email }}</span>
        </span>
        <button
          v-show="!collapsed"
          type="button"
          class="btn-icon btn-icon-sm hover:!text-danger-text hover:!bg-danger-soft"
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
import AppLogo from '@/components/brand/AppLogo.vue'
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
