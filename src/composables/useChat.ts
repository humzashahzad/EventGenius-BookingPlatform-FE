import { useChatStore } from '@/stores/chat'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { useChatWidgetStore } from '@/stores/chatWidget'

export function useChat() {
  const chatStore = useChatStore()
  const authStore = useAuthStore()
  const router = useRouter()

  async function startConversation(otherUserId: number) {
    const chat = await chatStore.getOrCreateChat(otherUserId)
    // The chat widget is on this page: open the conversation there instead of leaving.
    const widget = useChatWidgetStore()
    if (chat && widget.available) {
      widget.openChat(chat.id)
      return true
    }
    if (chat) {
      await chatStore.selectChat(chat.id)
      const role = authStore.user?.role
      if (role === 'admin') {
        await router.push('/support/messages')
      } else if (role === 'store_owner') {
        await router.push('/shop/messages')
      } else {
        await router.push('/customer/messages')
      }
      return true
    }
    return false
  }

  return {
    startConversation,
    chatStore,
  }
}
