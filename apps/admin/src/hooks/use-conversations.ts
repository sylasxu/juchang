import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, unwrap } from '@/lib/eden'
import { toast } from 'sonner'

// 从 Eden Treaty 推导类型
type ApiResponse<T> = T extends { get: (args?: infer _A) => Promise<{ data: infer R }> } ? R : never
type SessionsResponse = ApiResponse<typeof api.ai.sessions>
type SessionDetailResponse = ApiResponse<ReturnType<typeof api.ai.sessions>>

// 导出推导的类型
export type SessionsListResponse = NonNullable<SessionsResponse>
export type ConversationSession = SessionsListResponse['items'] extends (infer T)[] ? T : never
export type SessionDetail = NonNullable<SessionDetailResponse>
export type ConversationMessage = SessionDetail['messages'] extends (infer T)[] ? T : never

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
        data: (result?.items || []),
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

      return result
    },
    enabled: !!conversationId && enabled,
  })
}

// 删除单个会话
export function useDeleteSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      return await unwrap(api.ai.sessions({ id }).delete())
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', 'sessions'] })
      toast.success('会话已删除')
    },
    onError: (error: Error) => {
      toast.error(`删除失败: ${error.message}`)
    },
  })
}

// 批量删除会话
export function useDeleteSessionsBatch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ids: string[]) => {
      return await unwrap(
        api.ai.sessions['batch-delete'].post({ ids })
      )
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conversations', 'sessions'] })
      toast.success(`已删除 ${data?.deletedCount || 0} 个会话`)
    },
    onError: (error: Error) => {
      toast.error(`批量删除失败: ${error.message}`)
    },
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
