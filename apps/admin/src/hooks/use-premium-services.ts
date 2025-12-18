// 增值服务管理相关 Hooks - 使用 Mock 数据
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'
import { toast } from 'sonner'
import { mockPremiumStats, mockMembershipDistribution, mockAIQuotaUsage } from '@/lib/mock-data'

// 类型定义
export interface ServiceConfig {
  id: string
  name: string
  type: 'boost' | 'pin_plus' | 'fast_pass' | 'ai_services'
  pricing: { monthly: number; quarterly: number; yearly: number }
  quotas: { daily?: number; monthly?: number; total?: number }
  features: string[]
  isActive: boolean
  description: string
  updatedAt: string
  updatedBy: string
}

// 获取增值服务统计 (Mock)
export function usePremiumServiceStats(_timeRange: string = '30d') {
  return useQuery({
    queryKey: queryKeys.premiumServices.stats(_timeRange),
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 300))
      return mockPremiumStats
    },
    staleTime: 5 * 60 * 1000,
  })
}

// 获取会员分布数据 (Mock)
export function useMembershipDistribution() {
  return useQuery({
    queryKey: queryKeys.premiumServices.membership(),
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 200))
      return mockMembershipDistribution
    },
    staleTime: 10 * 60 * 1000,
  })
}

// 获取AI配额使用情况 (Mock)
export function useAIQuotaUsage(_timeRange: string = '7d') {
  return useQuery({
    queryKey: queryKeys.premiumServices.aiQuota(_timeRange),
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 300))
      return mockAIQuotaUsage
    },
    staleTime: 2 * 60 * 1000,
  })
}

// 获取服务配置列表 (Mock)
export function useServiceConfigs() {
  return useQuery({
    queryKey: queryKeys.premiumServices.configs(),
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 200))
      return {
        data: [
          { id: '1', name: 'AI 配额', key: 'ai_quota', value: '100', type: 'number', enabled: true },
          { id: '2', name: '高级搜索', key: 'advanced_search', value: 'true', type: 'boolean', enabled: true },
        ]
      }
    },
    staleTime: 30 * 60 * 1000,
  })
}

// 获取转化漏斗数据 (Mock)
export function useConversionFunnel(_serviceType?: string) {
  return useQuery({
    queryKey: queryKeys.premiumServices.conversionFunnel(_serviceType),
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 300))
      return {
        stages: [
          { name: '访问', count: 10000, rate: 100 },
          { name: '注册', count: 3500, rate: 35 },
          { name: '试用', count: 1200, rate: 12 },
          { name: '付费', count: 450, rate: 4.5 },
          { name: '续费', count: 320, rate: 3.2 },
        ]
      }
    },
    staleTime: 15 * 60 * 1000,
  })
}

// 获取用户旅程分析 (Mock)
export function useUserJourney(_timeRange: string = '30d') {
  return useQuery({
    queryKey: queryKeys.premiumServices.userJourney(_timeRange),
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 300))
      return {
        data: [
          { stage: '发现', avgDays: 0, users: 10000 },
          { stage: '注册', avgDays: 1, users: 3500 },
          { stage: '首次活动', avgDays: 3, users: 2800 },
          { stage: '付费转化', avgDays: 14, users: 450 },
        ]
      }
    },
    staleTime: 20 * 60 * 1000,
  })
}

// 更新服务配置 (Mock)
export function useUpdateServiceConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, config }: { id: string; config: Partial<ServiceConfig> }) => {
      await new Promise(resolve => setTimeout(resolve, 500))
      return { success: true, id, ...config }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.premiumServices.configs() })
      toast.success('服务配置更新成功')
    },
    onError: () => toast.error('更新服务配置失败，请重试'),
  })
}

// 调整AI配额 (Mock)
export function useAdjustAIQuota() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { userId?: string; serviceType: string; quotaChange: number; reason: string }) => {
      await new Promise(resolve => setTimeout(resolve, 500))
      return { success: true, ...data }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.premiumServices.aiQuota() })
      toast.success('AI配额调整成功')
    },
    onError: () => toast.error('调整AI配额失败，请重试'),
  })
}

// 重置用户配额 (Mock)
export function useResetUserQuota() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { userId: string; serviceType: string; reason: string }) => {
      await new Promise(resolve => setTimeout(resolve, 500))
      return { success: true, ...data }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.premiumServices.aiQuota() })
      toast.success('用户配额重置成功')
    },
    onError: () => toast.error('重置用户配额失败，请重试'),
  })
}

// 批量更新服务状态 (Mock)
export function useBatchUpdateServiceStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { serviceIds: string[]; isActive: boolean; reason: string }) => {
      await new Promise(resolve => setTimeout(resolve, 500))
      return { success: true, ...data }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.premiumServices.configs() })
      toast.success('服务状态批量更新成功')
    },
    onError: () => toast.error('批量更新服务状态失败，请重试'),
  })
}

// 获取服务性能指标 (Mock)
export function useServicePerformance(serviceType: string, _timeRange: string = '30d') {
  return useQuery({
    queryKey: queryKeys.premiumServices.performance(serviceType, _timeRange),
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 300))
      return {
        data: { responseTime: 125, successRate: 99.2, errorRate: 0.8, throughput: 1500 }
      }
    },
    enabled: !!serviceType,
    staleTime: 10 * 60 * 1000,
  })
}