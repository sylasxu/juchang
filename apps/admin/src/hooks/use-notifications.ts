// 通知管理相关 Hooks
import { useQuery } from '@tanstack/react-query'
import { api, unwrap } from '@/lib/eden'

// 通知类型
export interface Notification {
  id: string
  userId: string
  type: string
  title: string
  content: string | null
  isRead: boolean
  activityId: string | null
  createdAt: string | Date
}

// 通知列表响应类型
interface NotificationListResponse {
  data: Notification[]
  total: number
  page: number
  totalPages: number
}

// 通知筛选参数类型
export interface NotificationFilters {
  page?: number
  limit?: number
  type?: string
}

// Query keys
const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (filters: NotificationFilters) =>
    [...notificationKeys.lists(), filters] as const,
}

// 获取通知列表
export function useNotificationsList(filters: NotificationFilters = {}) {
  const { page = 1, limit = 10, type } = filters

  return useQuery({
    queryKey: notificationKeys.list({ page, limit, type }),
    queryFn: async () => {
      const query: Record<string, unknown> = { scope: 'all', page, limit }
      if (type && type !== 'all') query.type = type
      const result = await unwrap(api.notifications.get({ query }))
      return result as NotificationListResponse
    },
    staleTime: 2 * 60 * 1000,
  })
}
