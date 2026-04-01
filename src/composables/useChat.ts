import { useChatStore } from '@/stores/chat'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

export function useChat() {
  const chatStore = useChatStore()
  const authStore = useAuthStore()
  const router = useRouter()

  async function startConversation(otherUserId: number) {
    const chat = await chatStore.getOrCreateChat(otherUserId)
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
