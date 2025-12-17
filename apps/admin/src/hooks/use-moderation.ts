// 内容审核相关 Hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, apiCall } from '@/lib/eden'
import { queryKeys } from '@/lib/query-client'
import { toast } from 'sonner'

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
  reportedBy?: {
    id: string
    nickname: string
  }
  reportedAt: string
  assignedTo?: {
    id: string
    nickname: string
  }
  metadata?: Record<string, any>
}

// 审核队列查询参数
export interface ModerationQueueFilters {
  type?: string[]
  status?: string[]
  priority?: string[]
  assignedTo?: string
  dateRange?: [string, string]
  riskScoreRange?: [number, number]
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// 审核操作类型
export interface ModerationAction {
  action: 'approve' | 'reject' | 'escalate' | 'assign' | 'flag'
  reason: string
  notes?: string
  assignTo?: string
  severity?: 'low' | 'medium' | 'high'
}

// 获取审核队列列表
export function useModerationQueue(filters: ModerationQueueFilters = {}) {
  return useQuery({
    queryKey: queryKeys.moderation.queue(filters),
    queryFn: async () => {
      return apiCall(() => 
        api.admin.moderation.queue.get({
          query: filters
        })
      )
    },
    staleTime: 30 * 1000, // 30秒缓存
    refetchInterval: 60 * 1000, // 每分钟自动刷新
  })
}

// 获取审核队列统计
export function useModerationStats() {
  return useQuery({
    queryKey: queryKeys.moderation.stats(),
    queryFn: async () => {
      return apiCall(() => api.admin.moderation.stats.get())
    },
    staleTime: 2 * 60 * 1000, // 2分钟缓存
    refetchInterval: 2 * 60 * 1000, // 每2分钟自动刷新
  })
}

// 获取单个审核项目详情
export function useModerationItem(id: string) {
  return useQuery({
    queryKey: queryKeys.moderation.item(id),
    queryFn: async () => {
      return apiCall(() => api.admin.moderation.queue({ id }).get())
    },
    enabled: !!id,
    staleTime: 60 * 1000, // 1分钟缓存
  })
}

// 执行审核操作
export function useModerationAction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ itemId, action }: { itemId: string; action: ModerationAction }) => {
      return apiCall(() => 
        api.admin.moderation.queue({ id: itemId }).action.post(action)
      )
    },
    onSuccess: (_, { itemId }) => {
      // 刷新相关查询
      queryClient.invalidateQueries({ queryKey: queryKeys.moderation.queue() })
      queryClient.invalidateQueries({ queryKey: queryKeys.moderation.stats() })
      queryClient.invalidateQueries({ queryKey: queryKeys.moderation.item(itemId) })
      
      toast.success('审核操作执行成功')
    },
    onError: (error) => {
      console.error('审核操作失败:', error)
      toast.error('审核操作失败，请重试')
    },
  })
}

// 批量审核操作
export function useBulkModerationAction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      itemIds, 
      action 
    }: { 
      itemIds: string[]
      action: ModerationAction 
    }) => {
      return apiCall(() => 
        api.admin.moderation.queue.bulk.post({
          itemIds,
          ...action
        })
      )
    },
    onSuccess: () => {
      // 刷新相关查询
      queryClient.invalidateQueries({ queryKey: queryKeys.moderation.queue() })
      queryClient.invalidateQueries({ queryKey: queryKeys.moderation.stats() })
      
      toast.success('批量审核操作执行成功')
    },
    onError: (error) => {
      console.error('批量审核操作失败:', error)
      toast.error('批量审核操作失败，请重试')
    },
  })
}

// 分配审核任务
export function useAssignModerationTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      itemIds, 
      assignTo 
    }: { 
      itemIds: string[]
      assignTo: string 
    }) => {
      return apiCall(() => 
        api.admin.moderation.assign.post({
          itemIds,
          assignTo
        })
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.moderation.queue() })
      queryClient.invalidateQueries({ queryKey: queryKeys.moderation.stats() })
      
      toast.success('任务分配成功')
    },
    onError: (error) => {
      console.error('任务分配失败:', error)
      toast.error('任务分配失败，请重试')
    },
  })
}

// 获取审核员列表
export function useModerators() {
  return useQuery({
    queryKey: queryKeys.moderation.moderators(),
    queryFn: async () => {
      return apiCall(() => api.admin.moderators.get())
    },
    staleTime: 10 * 60 * 1000, // 10分钟缓存
  })
}

// 获取审核历史
export function useModerationHistory(targetId: string, targetType: string) {
  return useQuery({
    queryKey: queryKeys.moderation.history(targetId, targetType),
    queryFn: async () => {
      return apiCall(() => 
        api.admin.moderation.history.get({
          query: { targetId, targetType }
        })
      )
    },
    enabled: !!(targetId && targetType),
    staleTime: 5 * 60 * 1000, // 5分钟缓存
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