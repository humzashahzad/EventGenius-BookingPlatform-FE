import { useChatStore } from '@/stores/chat'

export function useChat() {
  const chatStore = useChatStore()

  async function startConversation(otherUserId: number) {
    const conversationId = await chatStore.getOrCreateConversation(otherUserId)
    if (conversationId) {
      await chatStore.fetchMessages(conversationId)
      return true
    }
    return false
  }

  return {
    startConversation,
    chatStore,
  }
}
