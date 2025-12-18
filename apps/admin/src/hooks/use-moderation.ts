// 内容审核相关 Hooks - 使用 Mock 数据
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'
import { toast } from 'sonner'
import { 
  mockModerationQueue, 
  mockModerationStats, 
  mockModerators 
} from '@/lib/mock-data'

// 审核队列项目类型
export interface ModerationQueueItem {
  id: string
  type: 'user' | 'activity' | 'message' | 'report'
  targetId: string
  targetType: string
  title: string
  description?: string
  reportReason?: string
  riskScore: number
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'escalated'
  reportedBy?: { id: string; nickname: string }
  reportedAt: string
  assignedTo?: { id: string; nickname: string } | null
  metadata?: Record<string, unknown>
}

export interface ModerationQueueFilters {
  type?: string
  status?: string
  priority?: string
  assignedTo?: string
  search?: string
  page?: number
  limit?: number
}

export interface ModerationQueueResponse {
  data: ModerationQueueItem[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface ModerationAction {
  action: 'approve' | 'reject' | 'escalate' | 'assign' | 'flag'
  reason: string
  notes?: string
  assignTo?: string
  severity?: 'low' | 'medium' | 'high'
}


// 获取审核队列列表 (Mock)
export function useModerationQueue(_filters: ModerationQueueFilters = {}) {
  return useQuery({
    queryKey: queryKeys.moderation.queue(_filters),
    queryFn: async (): Promise<ModerationQueueResponse> => {
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 300))
      return mockModerationQueue as ModerationQueueResponse
    },
    staleTime: 30 * 1000,
  })
}

// 获取审核队列统计 (Mock)
export function useModerationStats() {
  return useQuery({
    queryKey: queryKeys.moderation.stats(),
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 200))
      return mockModerationStats
    },
    staleTime: 2 * 60 * 1000,
  })
}

// 获取单个审核项目详情 (Mock)
export function useModerationItem(id: string) {
  return useQuery({
    queryKey: queryKeys.moderation.item(id),
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 200))
      return mockModerationQueue.data.find(item => item.id === id) || null
    },
    enabled: !!id,
    staleTime: 60 * 1000,
  })
}

// 执行审核操作 (Mock)
export function useModerationAction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ itemId, action }: { itemId: string; action: ModerationAction }) => {
      await new Promise(resolve => setTimeout(resolve, 500))
      return { success: true, itemId, action: action.action }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.moderation.queue() })
      queryClient.invalidateQueries({ queryKey: queryKeys.moderation.stats() })
      toast.success('审核操作执行成功')
    },
    onError: () => {
      toast.error('审核操作失败，请重试')
    },
  })
}

// 批量审核操作 (Mock)
export function useBulkModerationAction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ itemIds, action }: { itemIds: string[]; action: ModerationAction }) => {
      await new Promise(resolve => setTimeout(resolve, 500))
      return { success: true, processed: itemIds.length }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.moderation.queue() })
      queryClient.invalidateQueries({ queryKey: queryKeys.moderation.stats() })
      toast.success('批量审核操作执行成功')
    },
    onError: () => {
      toast.error('批量审核操作失败，请重试')
    },
  })
}

// 分配审核任务 (Mock)
export function useAssignModerationTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ itemIds, assignTo }: { itemIds: string[]; assignTo: string }) => {
      await new Promise(resolve => setTimeout(resolve, 300))
      return { success: true, itemIds, assignTo }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.moderation.queue() })
      toast.success('任务分配成功')
    },
    onError: () => {
      toast.error('任务分配失败，请重试')
    },
  })
}

// 获取审核员列表 (Mock)
export function useModerators() {
  return useQuery({
    queryKey: queryKeys.moderation.moderators(),
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 200))
      return mockModerators
    },
    staleTime: 10 * 60 * 1000,
  })
}

// 获取审核历史 (Mock)
export function useModerationHistory(targetId: string, targetType: string) {
  return useQuery({
    queryKey: queryKeys.moderation.history(targetId, targetType),
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 200))
      return { data: [], total: 0 }
    },
    enabled: !!(targetId && targetType),
    staleTime: 5 * 60 * 1000,
  })
}

// 实时更新 Hook
export function useRealTimeModerationUpdates() {
  const queryClient = useQueryClient()
  const refreshQueue = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.moderation.queue() })
    queryClient.invalidateQueries({ queryKey: queryKeys.moderation.stats() })
  }
  return { refreshQueue }
}