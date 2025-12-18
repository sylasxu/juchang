// 系统管理相关 Hooks - 使用 Mock 数据
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  mockSystemHealth,
  mockSystemConfigs,
  mockBusinessRules,
  mockFeatureFlags,
  mockAnnouncements,
  mockAuditLogs,
  mockMaintenanceStatus,
} from '@/lib/mock-data'

// 系统配置数据类型
export interface SystemConfig {
  id: string
  category: 'business_rules' | 'feature_flags' | 'system_params'
  key: string
  value: string
  type: 'string' | 'number' | 'boolean' | 'json'
  description?: string
  isEditable?: boolean
  updatedAt?: string
  updatedBy?: string
}

// 业务规则配置
export interface BusinessRule {
  id: string
  name: string
  key: string
  enabled: boolean
  category?: string
  rule?: {
    conditions: unknown[]
    actions: unknown[]
  }
  priority?: number
  description?: string
  createdAt?: string
  updatedAt?: string
}

// 功能开关配置
export interface FeatureFlag {
  id: string
  name: string
  displayName: string
  enabled: boolean
  rolloutPercentage?: number
  targetUsers?: string[]
  targetGroups?: string[]
  description?: string
  createdAt?: string
  updatedAt?: string
}

// 系统健康状态
export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical'
  services: ServiceHealth[]
  metrics: {
    cpu: number
    memory: number
    disk: number
    network: number
  }
}

// 单个服务健康状态
export interface ServiceHealth {
  name: string
  status: 'healthy' | 'warning' | 'critical' | 'down'
  responseTime: number
  uptime: number
  message?: string
}

// 平台公告
export interface PlatformAnnouncement {
  id: string
  title: string
  content: string
  type: 'info' | 'warning' | 'maintenance' | 'feature'
  status: 'active' | 'inactive' | 'scheduled'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  targetAudience?: 'all' | 'admins' | 'users' | 'premium_users'
  isActive?: boolean
  startTime?: string
  endTime?: string
  createdBy?: string
  createdAt: string
  updatedAt?: string
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
  details: unknown
  ipAddress: string
  userAgent: string
  timestamp: string
}

// 系统维护状态
export interface MaintenanceStatus {
  id: string
  title: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  startTime: string
  duration: number
  description?: string
  type?: 'scheduled' | 'emergency' | 'completed'
  endTime?: string
  affectedServices?: string[]
  createdBy?: string
  createdAt?: string
  updatedAt?: string
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

// ==================== Query Keys ====================
const systemKeys = {
  health: ['system', 'health'] as const,
  configs: (filters?: SystemConfigFilters) => ['system', 'configs', filters] as const,
  businessRules: ['system', 'businessRules'] as const,
  featureFlags: ['system', 'featureFlags'] as const,
  announcements: ['system', 'announcements'] as const,
  auditLogs: (filters?: AuditLogFilters) => ['system', 'auditLogs', filters] as const,
  maintenance: ['system', 'maintenance'] as const,
}


// ==================== 系统健康状态 ====================
export function useSystemHealth() {
  return useQuery({
    queryKey: systemKeys.health,
    queryFn: async () => mockSystemHealth,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  })
}

// ==================== 系统配置 ====================
export function useSystemConfigs(filters: SystemConfigFilters = {}) {
  return useQuery({
    queryKey: systemKeys.configs(filters),
    queryFn: async () => mockSystemConfigs,
    staleTime: 5 * 60 * 1000,
  })
}

export function useUpdateSystemConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, value }: { id: string; value: string }) => {
      await new Promise(resolve => setTimeout(resolve, 500))
      return { success: true, id, value }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system', 'configs'] })
      toast.success('系统配置更新成功')
    },
    onError: () => {
      toast.error('更新系统配置失败')
    },
  })
}

// ==================== 业务规则 ====================
export function useBusinessRules() {
  return useQuery({
    queryKey: systemKeys.businessRules,
    queryFn: async () => mockBusinessRules,
    staleTime: 10 * 60 * 1000,
  })
}

export function useUpdateBusinessRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, rule }: { id: string; rule: Partial<BusinessRule> }) => {
      await new Promise(resolve => setTimeout(resolve, 500))
      return { success: true, id, rule }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemKeys.businessRules })
      toast.success('业务规则更新成功')
    },
    onError: () => {
      toast.error('更新业务规则失败')
    },
  })
}

// ==================== 功能开关 ====================
export function useFeatureFlags() {
  return useQuery({
    queryKey: systemKeys.featureFlags,
    queryFn: async () => mockFeatureFlags,
    staleTime: 2 * 60 * 1000,
  })
}

export function useUpdateFeatureFlag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, flag }: { id: string; flag: Partial<FeatureFlag> }) => {
      await new Promise(resolve => setTimeout(resolve, 500))
      return { success: true, id, flag }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemKeys.featureFlags })
      toast.success('功能开关更新成功')
    },
    onError: () => {
      toast.error('更新功能开关失败')
    },
  })
}

// ==================== 平台公告 ====================
export function usePlatformAnnouncements() {
  return useQuery({
    queryKey: systemKeys.announcements,
    queryFn: async () => mockAnnouncements,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (announcement: Omit<PlatformAnnouncement, 'id' | 'createdAt' | 'updatedAt'>) => {
      await new Promise(resolve => setTimeout(resolve, 500))
      return { success: true, id: `ann-${Date.now()}`, ...announcement }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemKeys.announcements })
      toast.success('平台公告创建成功')
    },
    onError: () => {
      toast.error('创建平台公告失败')
    },
  })
}

export function useUpdateAnnouncement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, announcement }: { id: string; announcement: Partial<PlatformAnnouncement> }) => {
      await new Promise(resolve => setTimeout(resolve, 500))
      return { success: true, id, announcement }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemKeys.announcements })
      toast.success('平台公告更新成功')
    },
    onError: () => {
      toast.error('更新平台公告失败')
    },
  })
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await new Promise(resolve => setTimeout(resolve, 500))
      return { success: true, id }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemKeys.announcements })
      toast.success('平台公告删除成功')
    },
    onError: () => {
      toast.error('删除平台公告失败')
    },
  })
}

// ==================== 审计日志 ====================
export function useAuditLogs(filters: AuditLogFilters = {}) {
  return useQuery({
    queryKey: systemKeys.auditLogs(filters),
    queryFn: async () => mockAuditLogs,
    staleTime: 2 * 60 * 1000,
  })
}

// ==================== 维护状态 ====================
export function useMaintenanceStatus() {
  return useQuery({
    queryKey: systemKeys.maintenance,
    queryFn: async () => mockMaintenanceStatus,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateMaintenance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (maintenance: Omit<MaintenanceStatus, 'id' | 'createdAt' | 'updatedAt'>) => {
      await new Promise(resolve => setTimeout(resolve, 500))
      return { success: true, id: `maint-${Date.now()}`, ...maintenance }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemKeys.maintenance })
      toast.success('维护计划创建成功')
    },
    onError: () => {
      toast.error('创建维护计划失败')
    },
  })
}

export function useUpdateMaintenance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, maintenance }: { id: string; maintenance: Partial<MaintenanceStatus> }) => {
      await new Promise(resolve => setTimeout(resolve, 500))
      return { success: true, id, maintenance }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemKeys.maintenance })
      toast.success('维护状态更新成功')
    },
    onError: () => {
      toast.error('更新维护状态失败')
    },
  })
}
