// Shapes returned by POST /api/assistant/message (see the backend docs/search-assistant.md).

export interface AssistantVenue {
  id: number
  name: string
  city: string
  area: string | null
  address?: string
  thumbnail: string | null
  price_per_head: number | null
  capacity_min: number | null
  capacity_max: number | null
  avg_rating: number
  total_reviews: number
  url: string
  match?: { score: number | null; reasons: string[] }
  availability?: { date: string; bookings: number }
}

export interface AssistantAction {
  type: 'open_venue' | 'open_search'
  url: string
}

export interface AssistantReply {
  conversation_id: string | null
  reply: string
  quick_replies: string[]
  venues: AssistantVenue[]
  state: Record<string, unknown>
  action: AssistantAction | null
  search_id?: string | null
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  venues?: AssistantVenue[]
  action?: AssistantAction | null
  searchId?: string | null
  /** A user message that could not be sent (shows Retry). */
  failed?: boolean
  error?: string
}
