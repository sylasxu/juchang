// 沟通管理相关 Hooks - 使用 Mock 数据
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { mockCommunicationStats, mockChatMessages, mockNotifications, mockSupportRequests } from '@/lib/mock-data'

// 类型定义
export interface ChatMessage {
  id: string
  activityId: string
  senderId: string
  senderInfo: { id: string; nickname: string; avatarUrl?: string; membershipLevel: string }
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

export interface NotificationMessage {
  id: string
  title: string
  content: string
  type: 'system' | 'announcement' | 'promotion' | 'warning'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  targetAudience: 'all' | 'premium' | 'region' | 'custom'
  targetCriteria?: { regions?: string[]; membershipLevels?: string[]; userIds?: string[] }
  scheduledAt?: string
  sentAt?: string
  status: 'draft' | 'scheduled' | 'sent' | 'cancelled'
  stats: { totalSent: number; delivered: number; opened: number; clicked: number }
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface SupportRequest {
  id: string
  userId: string
  userInfo: { id: string; nickname: string; phoneNumber: string; membershipLevel: string }
  category: 'bug_report' | 'feature_request' | 'account_issue' | 'payment_issue' | 'other'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  subject: string
  description: string
  attachments?: string[]
  assignedTo?: string
  responses: SupportResponse[]
  tags: string[]
  createdAt: string
  updatedAt: string
  resolvedAt?: string
}

export interface SupportResponse {
  id: string
  requestId: string
  responderId: string
  responderInfo: { id: string; nickname: string; role: string }
  content: string
  isInternal: boolean
  attachments?: string[]
  createdAt: string
}

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

// ==================== Query Keys ====================
const communicationKeys = {
  stats: ['communication', 'stats'] as const,
  messages: (filters: ChatFilters) => ['communication', 'messages', filters] as const,
  notifications: (filters: NotificationFilters) => ['communication', 'notifications', filters] as const,
  supportRequests: (filters: SupportFilters) => ['communication', 'support', filters] as const,
}

// ==================== 统计数据 ====================
export function useCommunicationStats() {
  return useQuery({
    queryKey: communicationKeys.stats,
    queryFn: async () => mockCommunicationStats,
    staleTime: 5 * 60 * 1000,
  })
}

// ==================== 聊天消息管理 ====================
export function useChatMessages(filters: ChatFilters = {}) {
  return useQuery({
    queryKey: communicationKeys.messages(filters),
    queryFn: async () => mockChatMessages,
    staleTime: 2 * 60 * 1000,
  })
}

export function useModerateMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ messageId, action, reason }: { messageId: string; action: 'approve' | 'hide' | 'delete'; reason?: string }) => {
      // Mock: 模拟 API 调用
      await new Promise(resolve => setTimeout(resolve, 500))
      return { success: true, messageId, action, reason }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication', 'messages'] })
      toast.success('消息处理成功')
    },
    onError: () => {
      toast.error('消息处理失败')
    },
  })
}

// ==================== 通知管理 ====================
export function useNotifications(filters: NotificationFilters = {}) {
  return useQuery({
    queryKey: communicationKeys.notifications(filters),
    queryFn: async () => mockNotifications,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notification: Omit<NotificationMessage, 'id' | 'createdAt' | 'updatedAt' | 'stats'>) => {
      await new Promise(resolve => setTimeout(resolve, 500))
      return { success: true, id: `notif-${Date.now()}`, ...notification }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication', 'notifications'] })
      toast.success('通知创建成功')
    },
    onError: () => {
      toast.error('通知创建失败')
    },
  })
}

export function useSendNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notificationId: string) => {
      await new Promise(resolve => setTimeout(resolve, 500))
      return { success: true, notificationId }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication', 'notifications'] })
      toast.success('通知发送成功')
    },
    onError: () => {
      toast.error('通知发送失败')
    },
  })
}

export function useCancelNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notificationId: string) => {
      await new Promise(resolve => setTimeout(resolve, 500))
      return { success: true, notificationId }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication', 'notifications'] })
      toast.success('通知已取消')
    },
    onError: () => {
      toast.error('取消通知失败')
    },
  })
}

// ==================== 客服支持 ====================
export function useSupportRequests(filters: SupportFilters = {}) {
  return useQuery({
    queryKey: communicationKeys.supportRequests(filters),
    queryFn: async () => mockSupportRequests,
    staleTime: 2 * 60 * 1000,
  })
}

export function useAssignSupportRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ requestId, assigneeId }: { requestId: string; assigneeId: string }) => {
      await new Promise(resolve => setTimeout(resolve, 500))
      return { success: true, requestId, assigneeId }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication', 'support'] })
      toast.success('工单分配成功')
    },
    onError: () => {
      toast.error('工单分配失败')
    },
  })
}

export function useRespondToSupport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ requestId, content, isInternal }: { requestId: string; content: string; isInternal: boolean }) => {
      await new Promise(resolve => setTimeout(resolve, 500))
      return { success: true, requestId, content, isInternal }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication', 'support'] })
      toast.success('回复发送成功')
    },
    onError: () => {
      toast.error('回复发送失败')
    },
  })
}

export function useCloseSupportRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ requestId, resolution }: { requestId: string; resolution: string }) => {
      await new Promise(resolve => setTimeout(resolve, 500))
      return { success: true, requestId, resolution }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication', 'support'] })
      toast.success('工单已关闭')
    },
    onError: () => {
      toast.error('关闭工单失败')
    },
  })
}