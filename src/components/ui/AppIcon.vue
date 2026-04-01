<template>
  <component :is="iconComponent" :size="iconSize" :class="iconClass" :stroke-width="1.75" />
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'
import {
  Menu,
  Sun,
  Moon,
  Monitor,
  Bell,
  MailOpen,
  BellOff,
  X,
  User,
  LayoutGrid,
  LogOut,
  Search,
  Users,
  Store,
  MapPin,
  CalendarDays,
  Tags,
  MessageSquare,
  Settings,
  ShieldCheck,
  CalendarCheck,
  Building2,
  Star,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  AlertTriangle,
  KeyRound,
  Key,
  Check,
  CheckCheck,
  Plus,
  Facebook,
  Instagram,
  Twitter,
  Kanban,
  LayoutDashboard,
  CircleHelp,
  Upload,
  Trash2,
  CloudUpload,
  AlertCircle,
  RefreshCw,
  BellRing,
  MapPinOff,
  Image,
  MessageCircle,
  Phone,
  Lock,
  Clock,
  CircleCheck,
  CreditCard,
  FileText,
  Info,
  Loader2,
  Pencil,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Calendar,
  DollarSign,
  Shield,
  UserPlus,
  Bookmark,
  Heart,
  Share2,
  Filter,
  SlidersHorizontal,
  MoreVertical,
  Copy,
  Download,
  Printer,
  Mail,
  Globe,
  Link,
  Hash,
  Smile,
  Paperclip,
  Mic,
  Send,
  Reply,
  Forward,
  Play,
  Pause,
  Square,
  Video,
  File,
  Camera,
  Ruler,
  MessageSquareOff,
  Zap,
  Ban,
} from 'lucide-vue-next'

const iconMap: Record<string, Component> = {
  // Navigation
  'menu-2': Menu,
  'menu': Menu,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'chevron-down': ChevronDown,
  'chevron-up': ChevronUp,
  'arrow-right': ArrowRight,
  'arrow-left': ArrowLeft,
  'external-link': ExternalLink,

  // Theme
  'sun': Sun,
  'moon': Moon,
  'device-desktop': Monitor,

  // Layout
  'layout-grid': LayoutGrid,
  'layout-dashboard': LayoutDashboard,
  'layout-kanban': Kanban,

  // User
  'user': User,
  'users': Users,
  'user-plus': UserPlus,
  'logout': LogOut,

  // Communication
  'bell': Bell,
  'bell-off': BellOff,
  'bell-ringing': BellRing,
  'mail-opened': MailOpen,
  'mail': Mail,
  'message': MessageSquare,
  'message-circle': MessageCircle,
  'message-2': MessageCircle,
  'message-star': MessageSquare,
  'message-off': MessageSquareOff,
  'phone': Phone,

  // Actions
  'search': Search,
  'x': X,
  'check': Check,
  'checks': CheckCheck,
  'plus': Plus,
  'edit': Pencil,
  'pencil': Pencil,
  'trash': Trash2,
  'upload': Upload,
  'cloud-upload': CloudUpload,
  'download': Download,
  'copy': Copy,
  'filter': Filter,
  'sliders': SlidersHorizontal,
  'refresh': RefreshCw,
  'more-vertical': MoreVertical,
  'printer': Printer,

  // Content
  'calendar-event': CalendarDays,
  'calendar-check': CalendarCheck,
  'calendar': Calendar,
  'map-pin': MapPin,
  'map-pin-off': MapPinOff,
  'building': Building2,
  'building-store': Store,
  'star-filled': Star,
  'star': Star,
  'sparkles': Sparkles,
  'tags': Tags,
  'settings': Settings,
  'shield-lock': ShieldCheck,
  'shield': Shield,
  'image': Image,
  'photo': Image,
  'bookmark': Bookmark,
  'heart': Heart,
  'share': Share2,
  'hash': Hash,
  'link': Link,
  'globe': Globe,

  // Status
  'alert-triangle': AlertTriangle,
  'alert-circle': AlertCircle,
  'circle-check': CircleCheck,
  'info': Info,
  'info-circle': Info,

  // Security
  'lock': Lock,
  'lock-question': CircleHelp,
  'key': Key,
  'key-round': KeyRound,
  'eye': Eye,
  'eye-off': EyeOff,

  // Finance
  'credit-card': CreditCard,
  'currency-dollar': DollarSign,
  'dollar-sign': DollarSign,

  // Documents
  'file-text': FileText,
  'file': File,
  'notes': FileText,

  // Measurement
  'ruler': Ruler,
  'ruler-2': Ruler,

  // Time
  'clock': Clock,
  'loader': Loader2,

  // Social
  'brand-facebook': Facebook,
  'brand-instagram': Instagram,
  'brand-x': Twitter,

  // Chat specific
  'smile': Smile,
  'mood-smile': Smile,
  'paperclip': Paperclip,
  'mic': Mic,
  'microphone': Mic,
  'send': Send,
  'send-2': Send,
  'reply': Reply,
  'arrow-back-up': Reply,
  'forward': Forward,
  'arrow-forward-up': Forward,
  'play': Play,
  'player-play': Play,
  'pause': Pause,
  'player-pause': Pause,
  'square': Square,
  'video': Video,
  'camera': Camera,
  'bolt': Zap,
  'ban': Ban,
}

const props = withDefaults(
  defineProps<{
    icon: string
    class?: string
    size?: number
  }>(),
  { class: '', size: 0 }
)

const iconComponent = computed(() => {
  const key = props.icon.includes(':') ? props.icon.split(':').pop()! : props.icon
  return iconMap[key] || CircleHelp
})

const iconSize = computed(() => {
  if (props.size > 0) return props.size
  // Extract size from class (e.g. 'w-5 h-5' → 20)
  const match = props.class?.match(/w-(\d+(?:\.\d+)?)/)
  if (match) {
    const val = parseFloat(match[1])
    return val * 4 // Tailwind: w-5 = 20px
  }
  return 20 // default
})

const iconClass = computed(() => props.class || 'w-5 h-5')
</script>
