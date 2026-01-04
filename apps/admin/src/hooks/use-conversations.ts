import { useQuery } from '@tanstack/react-query'
import { api, unwrap } from '@/lib/eden'

// 会话列表项类型
export interface ConversationSession {
  id: string
  userId: string
  userNickname: string | null
  title: string | null
  messageCount: number
  lastMessageAt: string
  createdAt: string
}

// 消息类型
export interface ConversationMessage {
  id: string
  role: 'user' | 'assistant'
  messageType: string
  content: unknown
  activityId: string | null
  createdAt: string
}

interface SessionsListParams {
  page?: number
  limit?: number
  userId?: string
}

// 获取会话列表
export function useSessionsList(params: SessionsListParams = {}) {
  const { page = 1, limit = 20, userId } = params

  return useQuery({
    queryKey: ['conversations', 'sessions', { page, limit, userId }],
    queryFn: async () => {
      const result = await unwrap(
        api.ai.sessions.get({
          query: {
            page,
            limit,
            userId: userId || undefined,
          },
        })
      )

      return {
        data: (result?.items || []) as ConversationSession[],
        total: result?.total || 0,
      }
    },
  })
}

// 获取会话详情（消息列表）
export function useConversationDetail(
  conversationId: string | null,
  enabled: boolean
) {
  return useQuery({
    queryKey: ['conversations', 'detail', conversationId],
    queryFn: async () => {
      if (!conversationId) return null

      const result = await unwrap(
        api.ai.sessions({ id: conversationId }).get()
      )

      return result as {
        conversation: ConversationSession
        messages: ConversationMessage[]
      }
    },
    enabled: !!conversationId && enabled,
  })
}

// 获取内容预览
export function getContentPreview(content: unknown): string {
  if (typeof content === 'string') {
    return content.slice(0, 50)
  }
  if (content && typeof content === 'object') {
    const obj = content as Record<string, unknown>
    if ('text' in obj && typeof obj.text === 'string') {
      return obj.text.slice(0, 50)
    }
    if ('title' in obj && typeof obj.title === 'string') {
      return obj.title
    }
  }
  return '[Widget]'
}
