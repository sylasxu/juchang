// 系统管理相关 Hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, apiCall } from '@/lib/eden'
import { queryKeys } from '@/lib/query-client'
import { toast } from 'sonner'

// 系统配置数据类型
export interface SystemConfig {
  id: string
  category: 'business_rules' | 'feature_flags' | 'system_params'
  key: string
  value: any
  type: 'string' | 'number' | 'boolean' | 'json'
  description: string
  isEditable: boolean
  updatedAt: string
  updatedBy: string
}

// 业务规则配置
export interface BusinessRule {
  id: string
  name: string
  category: string
  rule: {
    conditions: any[]
    actions: any[]
  }
  isActive: boolean
  priority: number
  description: string
  createdAt: string
  updatedAt: string
}

// 功能开关配置
export interface FeatureFlag {
  id: string
  name: string
  key: string
  isEnabled: boolean
  rolloutPercentage: number
  targetUsers?: string[]
  targetGroups?: string[]
  description: string
  createdAt: string
  updatedAt: string
}

// 系统健康状态
export interface SystemHealth {
  overall: 'healthy' | 'warning' | 'critical'
  services: {
    api: ServiceHealth
    database: ServiceHealth
    redis: ServiceHealth
    storage: ServiceHealth
    payment: ServiceHealth
  }
  metrics: {
    cpu: number
    memory: number
    disk: number
    network: number
  }
  uptime: number
  lastCheck: string
}

// 单个服务健康状态
export interface ServiceHealth {
  status: 'healthy' | 'warning' | 'critical' | 'down'
  responseTime: number
  errorRate: number
  uptime: number
  lastCheck: string
  message?: string
}

// 平台公告
export interface PlatformAnnouncement {
  id: string
  title: string
  content: string
  type: 'info' | 'warning' | 'maintenance' | 'feature'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  targetAudience: 'all' | 'admins' | 'users' | 'premium_users'
  isActive: boolean
  startTime?: string
  endTime?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

// 审计日志
export interface AuditLog {
  id: string
  action: string
  resource: string
  resourceId?: string
  userId: string
  userInfo: {
    id: string
    nickname: string
    role: string
  }
  details: any
  ipAddress: string
  userAgent: string
  timestamp: string
}

// 系统维护状态
export interface MaintenanceStatus {
  id: string
  title: string
  description: string
  type: 'scheduled' | 'emergency' | 'completed'
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled'
  startTime: string
  endTime: string
  affectedServices: string[]
  createdBy: string
  createdAt: string
  updatedAt: string
}

// 查询参数类型
export interface SystemConfigFilters {
  category?: string
  search?: string
  page?: number
  limit?: number
}

export interface AuditLogFilters {
  action?: string
  resource?: string
  userId?: string
  dateRange?: [string, string]
  page?: number
  limit?: number
}

// 获取系统配置列表
export function useSystemConfigs(filters: SystemConfigFilters = {}) {
  return useQuery({
    queryKey: queryKeys.system.configs(filters),
    queryFn: async () => {
      return apiCall(() => 
        api.admin.system.configs.get({
          query: filters
        })
      )
    },
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  })
}

// 获取业务规则列表
export function useBusinessRules() {
  return useQuery({
    queryKey: queryKeys.system.businessRules(),
    queryFn: async () => {
      return apiCall(() => api.admin.system.business.rules.get())
    },
    staleTime: 10 * 60 * 1000, // 10分钟缓存
  })
}

// 获取功能开关列表
export function useFeatureFlags() {
  return useQuery({
    queryKey: queryKeys.system.featureFlags(),
    queryFn: async () => {
      return apiCall(() => api.admin.system.features.flags.get())
    },
    staleTime: 2 * 60 * 1000, // 2分钟缓存
  })
}

// 获取系统健康状态
export function useSystemHealth() {
  return useQuery({
    queryKey: queryKeys.system.health(),
    queryFn: async () => {
      return apiCall(() => api.admin.system.health.get())
    },
    staleTime: 30 * 1000, // 30秒缓存
    refetchInterval: 60 * 1000, // 每分钟自动刷新
  })
}

// 获取平台公告列表
export function usePlatformAnnouncements() {
  return useQuery({
    queryKey: queryKeys.system.announcements(),
    queryFn: async () => {
      return apiCall(() => api.admin.system.announcements.get())
    },
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  })
}

// 获取审计日志
export function useAuditLogs(filters: AuditLogFilters = {}) {
  return useQuery({
    queryKey: queryKeys.system.auditLogs(filters),
    queryFn: async () => {
      return apiCall(() => 
        api.admin.system.audit.logs.get({
          query: filters
        })
      )
    },
    staleTime: 2 * 60 * 1000, // 2分钟缓存
  })
}

// 获取维护状态列表
export function useMaintenanceStatus() {
  return useQuery({
    queryKey: queryKeys.system.maintenance(),
    queryFn: async () => {
      return apiCall(() => api.admin.system.maintenance.get())
    },
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  })
}

// 更新系统配置
export function useUpdateSystemConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      id, 
      value 
    }: { 
      id: string
      value: any
    }) => {
      return apiCall(() => 
        api.admin.system.configs({ id }).patch({ value })
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.system.configs() })
      
      toast.success('系统配置更新成功')
    },
    onError: (error) => {
      console.error('更新系统配置失败:', error)
      toast.error('更新系统配置失败，请重试')
    },
  })
}

// 更新业务规则
export function useUpdateBusinessRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      id, 
      rule 
    }: { 
      id: string
      rule: Partial<BusinessRule>
    }) => {
      return apiCall(() => 
        api.admin.system.business.rules({ id }).patch(rule)
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.system.businessRules() })
      
      toast.success('业务规则更新成功')
    },
    onError: (error) => {
      console.error('更新业务规则失败:', error)
      toast.error('更新业务规则失败，请重试')
    },
  })
}

// 更新功能开关
export function useUpdateFeatureFlag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      id, 
      flag 
    }: { 
      id: string
      flag: Partial<FeatureFlag>
    }) => {
      return apiCall(() => 
        api.admin.system.features.flags({ id }).patch(flag)
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.system.featureFlags() })
      
      toast.success('功能开关更新成功')
    },
    onError: (error) => {
      console.error('更新功能开关失败:', error)
      toast.error('更新功能开关失败，请重试')
    },
  })
}

// 创建平台公告
export function useCreateAnnouncement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (announcement: Omit<PlatformAnnouncement, 'id' | 'createdAt' | 'updatedAt'>) => {
      return apiCall(() => 
        api.admin.system.announcements.post(announcement)
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.system.announcements() })
      
      toast.success('平台公告创建成功')
    },
    onError: (error) => {
      console.error('创建平台公告失败:', error)
      toast.error('创建平台公告失败，请重试')
    },
  })
}

// 更新平台公告
export function useUpdateAnnouncement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      id, 
      announcement 
    }: { 
      id: string
      announcement: Partial<PlatformAnnouncement>
    }) => {
      return apiCall(() => 
        api.admin.system.announcements({ id }).patch(announcement)
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.system.announcements() })
      
      toast.success('平台公告更新成功')
    },
    onError: (error) => {
      console.error('更新平台公告失败:', error)
      toast.error('更新平台公告失败，请重试')
    },
  })
}

// 删除平台公告
export function useDeleteAnnouncement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      return apiCall(() => 
        api.admin.system.announcements({ id }).delete()
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.system.announcements() })
      
      toast.success('平台公告删除成功')
    },
    onError: (error) => {
      console.error('删除平台公告失败:', error)
      toast.error('删除平台公告失败，请重试')
    },
  })
}

// 创建维护计划
export function useCreateMaintenance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (maintenance: Omit<MaintenanceStatus, 'id' | 'createdAt' | 'updatedAt'>) => {
      return apiCall(() => 
        api.admin.system.maintenance.post(maintenance)
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.system.maintenance() })
      
      toast.success('维护计划创建成功')
    },
    onError: (error) => {
      console.error('创建维护计划失败:', error)
      toast.error('创建维护计划失败，请重试')
    },
  })
}

// 更新维护状态
export function useUpdateMaintenance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      id, 
      maintenance 
    }: { 
      id: string
      maintenance: Partial<MaintenanceStatus>
    }) => {
      return apiCall(() => 
        api.admin.system.maintenance({ id }).patch(maintenance)
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.system.maintenance() })
      
      toast.success('维护状态更新成功')
    },
    onError: (error) => {
      console.error('更新维护状态失败:', error)
      toast.error('更新维护状态失败，请重试')
    },
  })
}