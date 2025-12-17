// 增值服务管理相关 Hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, apiCall } from '@/lib/eden'
import { queryKeys } from '@/lib/query-client'
import { toast } from 'sonner'

// 增值服务统计数据类型
export interface PremiumServiceStats {
  totalRevenue: number
  totalUsers: number
  activeSubscriptions: number
  conversionRate: number
  services: {
    boost: ServiceStats
    pinPlus: ServiceStats
    fastPass: ServiceStats
    aiServices: ServiceStats
  }
  trends: {
    revenue: TrendData[]
    users: TrendData[]
    conversions: TrendData[]
  }
}

// 单项服务统计
export interface ServiceStats {
  name: string
  totalUsers: number
  activeUsers: number
  revenue: number
  usageCount: number
  conversionRate: number
  averageUsage: number
  popularFeatures: string[]
}

// 趋势数据
export interface TrendData {
  date: string
  value: number
  change?: number
}

// 会员分布数据
export interface MembershipDistribution {
  total: number
  byType: {
    free: number
    basic: number
    premium: number
    vip: number
  }
  byDuration: {
    monthly: number
    quarterly: number
    yearly: number
  }
  renewalRates: {
    overall: number
    byType: Record<string, number>
    byDuration: Record<string, number>
  }
  churnAnalysis: {
    churnRate: number
    churnReasons: Array<{
      reason: string
      count: number
      percentage: number
    }>
  }
}

// AI 配额使用数据
export interface AIQuotaUsage {
  totalQuota: number
  usedQuota: number
  remainingQuota: number
  usageByService: {
    chatbot: number
    recommendation: number
    translation: number
    moderation: number
  }
  usagePatterns: {
    hourly: Array<{ hour: number; usage: number }>
    daily: Array<{ date: string; usage: number }>
    weekly: Array<{ week: string; usage: number }>
  }
  topUsers: Array<{
    userId: string
    nickname: string
    usage: number
    percentage: number
  }>
}

// 服务参数配置
export interface ServiceConfig {
  id: string
  name: string
  type: 'boost' | 'pin_plus' | 'fast_pass' | 'ai_services'
  pricing: {
    monthly: number
    quarterly: number
    yearly: number
  }
  quotas: {
    daily?: number
    monthly?: number
    total?: number
  }
  features: string[]
  isActive: boolean
  description: string
  updatedAt: string
  updatedBy: string
}

// 转化漏斗数据
export interface ConversionFunnel {
  stages: Array<{
    name: string
    users: number
    conversionRate: number
    dropoffRate: number
  }>
  totalUsers: number
  finalConversions: number
  overallConversionRate: number
  bottlenecks: Array<{
    stage: string
    issue: string
    impact: number
  }>
}

// 用户旅程分析
export interface UserJourney {
  segments: Array<{
    name: string
    users: number
    averageTimeToConvert: number
    commonPaths: string[]
    conversionRate: number
  }>
  touchpoints: Array<{
    name: string
    interactions: number
    conversionImpact: number
  }>
  dropoffPoints: Array<{
    point: string
    dropoffRate: number
    reasons: string[]
  }>
}

// 查询参数类型
export interface PremiumServiceFilters {
  serviceType?: string[]
  dateRange?: [string, string]
  userSegment?: string
  page?: number
  limit?: number
}

// 获取增值服务统计
export function usePremiumServiceStats(timeRange: string = '30d') {
  return useQuery({
    queryKey: queryKeys.premiumServices.stats(timeRange),
    queryFn: async () => {
      return apiCall(() => 
        api.admin.premium.stats.get({
          query: { timeRange }
        })
      )
    },
    staleTime: 5 * 60 * 1000, // 5分钟缓存
    refetchInterval: 10 * 60 * 1000, // 每10分钟自动刷新
  })
}

// 获取会员分布数据
export function useMembershipDistribution() {
  return useQuery({
    queryKey: queryKeys.premiumServices.membership(),
    queryFn: async () => {
      return apiCall(() => api.admin.premium.membership.get())
    },
    staleTime: 10 * 60 * 1000, // 10分钟缓存
    refetchInterval: 15 * 60 * 1000, // 每15分钟自动刷新
  })
}

// 获取AI配额使用情况
export function useAIQuotaUsage(timeRange: string = '7d') {
  return useQuery({
    queryKey: queryKeys.premiumServices.aiQuota(timeRange),
    queryFn: async () => {
      return apiCall(() => 
        api.admin.premium.ai.quota.get({
          query: { timeRange }
        })
      )
    },
    staleTime: 2 * 60 * 1000, // 2分钟缓存
    refetchInterval: 5 * 60 * 1000, // 每5分钟自动刷新
  })
}

// 获取服务配置列表
export function useServiceConfigs() {
  return useQuery({
    queryKey: queryKeys.premiumServices.configs(),
    queryFn: async () => {
      return apiCall(() => api.admin.premium.configs.get())
    },
    staleTime: 30 * 60 * 1000, // 30分钟缓存
  })
}

// 获取转化漏斗数据
export function useConversionFunnel(serviceType?: string) {
  return useQuery({
    queryKey: queryKeys.premiumServices.conversionFunnel(serviceType),
    queryFn: async () => {
      return apiCall(() => 
        api.admin.premium.conversion.funnel.get({
          query: serviceType ? { serviceType } : {}
        })
      )
    },
    staleTime: 15 * 60 * 1000, // 15分钟缓存
  })
}

// 获取用户旅程分析
export function useUserJourney(timeRange: string = '30d') {
  return useQuery({
    queryKey: queryKeys.premiumServices.userJourney(timeRange),
    queryFn: async () => {
      return apiCall(() => 
        api.admin.premium.journey.get({
          query: { timeRange }
        })
      )
    },
    staleTime: 20 * 60 * 1000, // 20分钟缓存
  })
}

// 更新服务配置
export function useUpdateServiceConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      id, 
      config 
    }: { 
      id: string
      config: Partial<ServiceConfig>
    }) => {
      return apiCall(() => 
        api.admin.premium.configs({ id }).patch(config)
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.premiumServices.configs() })
      queryClient.invalidateQueries({ queryKey: queryKeys.premiumServices.stats() })
      
      toast.success('服务配置更新成功')
    },
    onError: (error) => {
      console.error('更新服务配置失败:', error)
      toast.error('更新服务配置失败，请重试')
    },
  })
}

// 调整AI配额
export function useAdjustAIQuota() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      userId?: string
      serviceType: string
      quotaChange: number
      reason: string
    }) => {
      return apiCall(() => 
        api.admin.premium.ai.quota.adjust.post(data)
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.premiumServices.aiQuota() })
      
      toast.success('AI配额调整成功')
    },
    onError: (error) => {
      console.error('调整AI配额失败:', error)
      toast.error('调整AI配额失败，请重试')
    },
  })
}

// 重置用户配额
export function useResetUserQuota() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      userId: string
      serviceType: string
      reason: string
    }) => {
      return apiCall(() => 
        api.admin.premium.quota.reset.post(data)
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.premiumServices.aiQuota() })
      
      toast.success('用户配额重置成功')
    },
    onError: (error) => {
      console.error('重置用户配额失败:', error)
      toast.error('重置用户配额失败，请重试')
    },
  })
}

// 批量更新服务状态
export function useBatchUpdateServiceStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      serviceIds: string[]
      isActive: boolean
      reason: string
    }) => {
      return apiCall(() => 
        api.admin.premium.configs.batch.status.post(data)
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.premiumServices.configs() })
      queryClient.invalidateQueries({ queryKey: queryKeys.premiumServices.stats() })
      
      toast.success('服务状态批量更新成功')
    },
    onError: (error) => {
      console.error('批量更新服务状态失败:', error)
      toast.error('批量更新服务状态失败，请重试')
    },
  })
}

// 获取服务性能指标
export function useServicePerformance(serviceType: string, timeRange: string = '30d') {
  return useQuery({
    queryKey: queryKeys.premiumServices.performance(serviceType, timeRange),
    queryFn: async () => {
      return apiCall(() => 
        api.admin.premium.performance.get({
          query: { serviceType, timeRange }
        })
      )
    },
    enabled: !!serviceType,
    staleTime: 10 * 60 * 1000, // 10分钟缓存
  })
}