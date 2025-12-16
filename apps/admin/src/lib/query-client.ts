// React Query 客户端配置
import { QueryClient } from '@tanstack/react-query'

// 创建 Query Client 实例
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 数据缓存时间 (5 分钟)
      staleTime: 5 * 60 * 1000,
      // 缓存保持时间 (10 分钟)
      gcTime: 10 * 60 * 1000,
      // 重试配置
      retry: (failureCount, error) => {
        // 对于 4xx 错误不重试
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as any).status
          if (status >= 400 && status < 500) {
            return false
          }
        }
        // 最多重试 2 次
        return failureCount < 2
      },
      // 重试延迟
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // 错误处理在全局 QueryCache 中处理
    },
    mutations: {
      // 重试配置（变更操作通常不重试）
      retry: false,
    },
  },
})

// Query Keys 工厂函数
export const queryKeys = {
  // 用户相关
  users: {
    all: ['users'],
    lists: () => [...queryKeys.users.all, 'list'],
    list: (filters: Record<string, any>) => [...queryKeys.users.lists(), filters],
    details: () => [...queryKeys.users.all, 'detail'],
    detail: (id: string) => [...queryKeys.users.details(), id],
  },
  
  // 活动相关
  activities: {
    all: ['activities'],
    lists: () => [...queryKeys.activities.all, 'list'],
    list: (filters: Record<string, any>) => [...queryKeys.activities.lists(), filters],
    details: () => [...queryKeys.activities.all, 'detail'],
    detail: (id: string) => [...queryKeys.activities.details(), id],
    moderation: () => [...queryKeys.activities.all, 'moderation'],
  },
  
  // 交易相关
  transactions: {
    all: ['transactions'],
    lists: () => [...queryKeys.transactions.all, 'list'],
    list: (filters: Record<string, any>) => [...queryKeys.transactions.lists(), filters],
    details: () => [...queryKeys.transactions.all, 'detail'],
    detail: (id: string) => [...queryKeys.transactions.details(), id],
    analytics: () => [...queryKeys.transactions.all, 'analytics'],
  },
  
  // 仪表板相关
  dashboard: {
    all: ['dashboard'],
    metrics: () => [...queryKeys.dashboard.all, 'metrics'],
    analytics: () => [...queryKeys.dashboard.all, 'analytics'],
  },
  
  // 审核相关
  moderation: {
    all: ['moderation'],
    queue: () => [...queryKeys.moderation.all, 'queue'],
    reports: () => [...queryKeys.moderation.all, 'reports'],
  },
  
  // 系统相关
  system: {
    all: ['system'],
    config: () => [...queryKeys.system.all, 'config'],
    logs: () => [...queryKeys.system.all, 'logs'],
    health: () => [...queryKeys.system.all, 'health'],
  },
}

// 缓存失效工具函数
export const invalidateQueries = {
  // 用户相关缓存失效
  users: {
    all: () => queryClient.invalidateQueries({ queryKey: queryKeys.users.all }),
    lists: () => queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() }),
    detail: (id: string) => queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(id) }),
  },
  
  // 活动相关缓存失效
  activities: {
    all: () => queryClient.invalidateQueries({ queryKey: queryKeys.activities.all }),
    lists: () => queryClient.invalidateQueries({ queryKey: queryKeys.activities.lists() }),
    detail: (id: string) => queryClient.invalidateQueries({ queryKey: queryKeys.activities.detail(id) }),
    moderation: () => queryClient.invalidateQueries({ queryKey: queryKeys.activities.moderation() }),
  },
  
  // 交易相关缓存失效
  transactions: {
    all: () => queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all }),
    lists: () => queryClient.invalidateQueries({ queryKey: queryKeys.transactions.lists() }),
    detail: (id: string) => queryClient.invalidateQueries({ queryKey: queryKeys.transactions.detail(id) }),
    analytics: () => queryClient.invalidateQueries({ queryKey: queryKeys.transactions.analytics() }),
  },
  
  // 仪表板相关缓存失效
  dashboard: {
    all: () => queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all }),
    metrics: () => queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.metrics() }),
    analytics: () => queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.analytics() }),
  },
  
  // 审核相关缓存失效
  moderation: {
    all: () => queryClient.invalidateQueries({ queryKey: queryKeys.moderation.all }),
    queue: () => queryClient.invalidateQueries({ queryKey: queryKeys.moderation.queue() }),
    reports: () => queryClient.invalidateQueries({ queryKey: queryKeys.moderation.reports() }),
  },
  
  // 系统相关缓存失效
  system: {
    all: () => queryClient.invalidateQueries({ queryKey: queryKeys.system.all }),
    config: () => queryClient.invalidateQueries({ queryKey: queryKeys.system.config() }),
    logs: () => queryClient.invalidateQueries({ queryKey: queryKeys.system.logs() }),
    health: () => queryClient.invalidateQueries({ queryKey: queryKeys.system.health() }),
  },
}

// 预取数据工具函数
export const prefetchQueries = {
  // 预取用户列表
  usersList: (filters: Record<string, any> = {}) => {
    return queryClient.prefetchQuery({
      queryKey: queryKeys.users.list(filters),
      queryFn: async () => {
        // 这里会在具体的 hook 中实现
        return null
      },
    })
  },
  
  // 预取活动列表
  activitiesList: (filters: Record<string, any> = {}) => {
    return queryClient.prefetchQuery({
      queryKey: queryKeys.activities.list(filters),
      queryFn: async () => {
        // 这里会在具体的 hook 中实现
        return null
      },
    })
  },
}

// 乐观更新工具函数
export const optimisticUpdates = {
  // 用户状态更新
  updateUserStatus: (userId: string, status: string) => {
    queryClient.setQueryData(
      queryKeys.users.detail(userId),
      (oldData: any) => {
        if (!oldData) return oldData
        return { ...oldData, status }
      }
    )
  },
  
  // 活动状态更新
  updateActivityStatus: (activityId: string, status: string) => {
    queryClient.setQueryData(
      queryKeys.activities.detail(activityId),
      (oldData: any) => {
        if (!oldData) return oldData
        return { ...oldData, status }
      }
    )
  },
}