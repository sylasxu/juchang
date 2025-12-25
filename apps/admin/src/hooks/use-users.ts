// 用户管理相关 Hooks (MVP 简化版)
import { useQuery } from '@tanstack/react-query'
import { api, apiCall } from '@/lib/eden'
import { queryKeys } from '@/lib/query-client'
import { useApiList, useApiDetail, useApiUpdate } from './use-api'
import type { PaginationQuery } from '@/lib/typebox'

// MVP 用户筛选参数类型 (简化版)
export interface UserFilters extends PaginationQuery {
  search?: string
  hasPhone?: boolean
}

// 获取用户列表
export function useUsersList(filters: UserFilters = { page: 1, limit: 20 }) {
  return useApiList(
    [...queryKeys.users.lists(), filters],
    (params) => api.users.get({ query: params }),
    filters,
    {
      staleTime: 2 * 60 * 1000, // 2 分钟
    }
  )
}

// 获取用户详情 (Admin 视图)
export function useAdminUser(userId: string) {
  return useQuery({
    queryKey: [...queryKeys.users.details(), userId],
    queryFn: async () => {
      const result = await apiCall<any>(() => api.users({ id: userId }).get())
      return result
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 分钟
  })
}

// 获取用户详情 (兼容旧接口)
export function useUserDetail(userId: string) {
  return useAdminUser(userId)
}

// 更新用户信息
export function useUpdateUser() {
  return useApiUpdate(
    (id, data: any) => api.users({ id }).put(data),
    {
      invalidateKeys: [
        queryKeys.users.all,
        queryKeys.dashboard.all,
      ],
    }
  )
}

// 获取用户活动历史
export function useUserActivities(userId: string, filters: PaginationQuery = { page: 1, limit: 10 }) {
  return useQuery({
    queryKey: ['users', userId, 'activities', filters],
    queryFn: async () => {
      // TODO: 实现 API 端点
      return {
        data: [],
        total: 0,
        page: filters.page || 1,
        limit: filters.limit || 10
      }
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })
}

// 获取用户参与记录
export function useUserParticipations(userId: string, filters: PaginationQuery = { page: 1, limit: 10 }) {
  return useQuery({
    queryKey: ['users', userId, 'participations', filters],
    queryFn: async () => {
      // TODO: 实现 API 端点
      return {
        data: [],
        total: 0,
        page: filters.page || 1,
        limit: filters.limit || 10
      }
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })
}
