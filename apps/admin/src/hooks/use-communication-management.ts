// 沟通管理相关 Hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, apiCall } from '@/lib/eden'
import { queryKeys } from '@/lib/query-client'
import { toast } from 'sonner'

// 聊天消息数据类型
export interface ChatMessage {
  id: string
  activityId: string
  senderId: string
  senderInfo: {
    id: string
    nickname: string
    avatarUrl?: string
    membershipLevel: string
  }
  content: string
  messageType: 'text' | 'image' | 'location' | 'system'
  status: 'normal' | 'flagged' | 'hidden' | 'deleted'
  riskScore: number
  flagReasons: string[]
  moderatedBy?: string
  moderatedAt?: string
  createdAt: string
  updatedAt: string
}

// 消息审核记录
export interface MessageModeration {
  id: string
  messageId: string
  moderatorId: string
  moderatorInfo: {
    id: string
    nickname: string
    role: string
  }
  action: 'approve' | 'hide' | 'delete' | 'flag'
  reason: string
  notes?: string
  createdAt: string
}

// 通知消息
export interface NotificationMessage {
  id: string
  title: string
  content: string
  type: 'system' | 'announcement' | 'promotion' | 'warning'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  targetAudience: 'all' | 'premium' | 'region' | 'custom'
  targetCriteria?: {
    regions?: string[]
    membershipLevels?: string[]
    userIds?: string[]
    activityTypes?: string[]
  }
  scheduledAt?: string
  sentAt?: string
  status: 'draft' | 'scheduled' | 'sent' | 'cancelled'
  stats: {
    totalSent: number
    delivered: number
    opened: number
    clicked: number
  }
  createdBy: string
  createdAt: string
  updatedAt: string
}

// 反馈和支持请求
export interface SupportRequest {
  id: string
  userId: string
  userInfo: {
    id: string
    nickname: string
    phoneNumber: string
    membershipLevel: string
  }
  category: 'bug_report' | 'feature_request' | 'account_issue' | 'payment_issue' | 'other'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  subject: string
  description: string
  attachments?: string[]
  assignedTo?: string
  assigneeInfo?: {
    id: string
    nickname: string
    role: string
  }
  responses: SupportResponse[]
  tags: string[]
  createdAt: string
  updatedAt: string
  resolvedAt?: string
}

// 支持回复
export interface SupportResponse {
  id: string
  requestId: string
  responderId: string
  responderInfo: {
    id: string
    nickname: string
    role: string
  }
  content: string
  isInternal: boolean
  attachments?: string[]
  createdAt: string
}

// 查询参数类型
export interface ChatFilters {
  activityId?: string
  senderId?: string
  status?: string
  riskScore?: number
  dateRange?: [string, string]
  page?: number
  limit?: number
}

export interface NotificationFilters {
  type?: string
  status?: string
  targetAudience?: string
  dateRange?: [string, string]
  page?: number
  limit?: number
}

export interface SupportFilters {
  category?: string
  status?: string
  priority?: string
  assignedTo?: string
  dateRange?: [string, string]
  page?: number
  limit?: number
}

// 获取聊天消息列表
export function useChatMessages(filters: ChatFilters = {}) {
  return useQuery({
    queryKey: ['communication', 'chat', 'messages', filters],
    queryFn: async () => {
      return apiCall(() => 
        api.admin.communication.chat.messages.get({
          query: filters
        })
      )
    },
    staleTime: 2 * 60 * 1000, // 2分钟缓存
  })
}

// 获取消息审核记录
export function useMessageModerations(messageId: string) {
  return useQuery({
    queryKey: ['communication', 'chat', 'moderations', messageId],
    queryFn: async () => {
      return apiCall(() => 
        api.admin.communication.chat.messages({ messageId }).moderations.get()
      )
    },
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  })
}

// 获取通知消息列表
export function useNotifications(filters: NotificationFilters = {}) {
  return useQuery({
    queryKey: ['communication', 'notifications', filters],
    queryFn: async () => {
      return apiCall(() => 
        api.admin.communication.notifications.get({
          query: filters
        })
      )
    },
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  })
}

// 获取支持请求列表
export function useSupportRequests(filters: SupportFilters = {}) {
  return useQuery({
    queryKey: ['communication', 'support', 'requests', filters],
    queryFn: async () => {
      return apiCall(() => 
        api.admin.communication.support.requests.get({
          query: filters
        })
      )
    },
    staleTime: 2 * 60 * 1000, // 2分钟缓存
  })
}

// 获取支持请求详情
export function useSupportRequest(id: string) {
  return useQuery({
    queryKey: ['communication', 'support', 'request', id],
    queryFn: async () => {
      return apiCall(() => 
        api.admin.communication.support.requests({ id }).get()
      )
    },
    staleTime: 2 * 60 * 1000, // 2分钟缓存
  })
}

// 审核聊天消息
export function useModerateMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      messageId, 
      action, 
      reason, 
      notes 
    }: { 
      messageId: string
      action: 'approve' | 'hide' | 'delete' | 'flag'
      reason: string
      notes?: string
    }) => {
      return apiCall(() => 
        api.admin.communication.chat.messages({ messageId }).moderate.post({
          action,
          reason,
          notes
        })
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication', 'chat'] })
      
      toast.success('消息审核完成')
    },
    onError: (error) => {
      console.error('消息审核失败:', error)
      toast.error('消息审核失败，请重试')
    },
  })
}

// 批量审核消息
export function useBatchModerateMessages() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      messageIds, 
      action, 
      reason 
    }: { 
      messageIds: string[]
      action: 'approve' | 'hide' | 'delete' | 'flag'
      reason: string
    }) => {
      return apiCall(() => 
        api.admin.communication.chat.messages.batch.moderate.post({
          messageIds,
          action,
          reason
        })
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication', 'chat'] })
      
      toast.success('批量审核完成')
    },
    onError: (error) => {
      console.error('批量审核失败:', error)
      toast.error('批量审核失败，请重试')
    },
  })
}

// 创建通知消息
export function useCreateNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notification: Omit<NotificationMessage, 'id' | 'stats' | 'createdAt' | 'updatedAt'>) => {
      return apiCall(() => 
        api.admin.communication.notifications.post(notification)
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication', 'notifications'] })
      
      toast.success('通知创建成功')
    },
    onError: (error) => {
      console.error('创建通知失败:', error)
      toast.error('创建通知失败，请重试')
    },
  })
}

// 发送通知消息
export function useSendNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      return apiCall(() => 
        api.admin.communication.notifications({ id }).send.post()
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication', 'notifications'] })
      
      toast.success('通知发送成功')
    },
    onError: (error) => {
      console.error('发送通知失败:', error)
      toast.error('发送通知失败，请重试')
    },
  })
}

// 更新支持请求状态
export function useUpdateSupportRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string
      updates: Partial<SupportRequest>
    }) => {
      return apiCall(() => 
        api.admin.communication.support.requests({ id }).patch(updates)
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication', 'support'] })
      
      toast.success('支持请求更新成功')
    },
    onError: (error) => {
      console.error('更新支持请求失败:', error)
      toast.error('更新支持请求失败，请重试')
    },
  })
}

// 回复支持请求
export function useRespondToSupport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      requestId, 
      content, 
      isInternal, 
      attachments 
    }: { 
      requestId: string
      content: string
      isInternal: boolean
      attachments?: string[]
    }) => {
      return apiCall(() => 
        api.admin.communication.support.requests({ requestId }).responses.post({
          content,
          isInternal,
          attachments
        })
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication', 'support'] })
      
      toast.success('回复发送成功')
    },
    onError: (error) => {
      console.error('发送回复失败:', error)
      toast.error('发送回复失败，请重试')
    },
  })
}

// 获取沟通统计数据
export function useCommunicationStats() {
  return useQuery({
    queryKey: ['communication', 'stats'],
    queryFn: async () => {
      return apiCall(() => api.admin.communication.stats.get())
    },
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  })
}