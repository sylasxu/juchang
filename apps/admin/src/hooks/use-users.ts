// 用户管理相关 Hooks
import { api } from '@/lib/eden'
import { queryKeys } from '@/lib/query-client'
import { useApiList, useApiDetail, useApiUpdate } from './use-api'
import type { PaginationQuery } from '@/lib/typebox'

// 用户筛选参数类型
export interface UserFilters extends PaginationQuery {
  search?: string
  membershipType?: string[]
  isBlocked?: boolean
  isRealNameVerified?: boolean
  registrationDateRange?: [string, string]
  locationRadius?: {
    center: [number, number]
    radius: number
  }
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

// 获取用户详情
export function useUserDetail(userId: string) {
  return useApiDetail(
    [...queryKeys.users.details(), userId],
    (id) => api.users({ id }).get(),
    userId,
    {
      staleTime: 5 * 60 * 1000, // 5 分钟
    }
  )
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

// 封禁用户
export function useBlockUser() {
  return useApiUpdate(
    (id, _data) => api.users({ id }).block.post(),
    {
      invalidateKeys: [
        queryKeys.users.all,
        queryKeys.dashboard.all,
      ],
    }
  )
}

// 解封用户
export function useUnblockUser() {
  return useApiUpdate(
    (id, _data) => api.users({ id }).unblock.post(),
    {
      invalidateKeys: [
        queryKeys.users.all,
        queryKeys.dashboard.all,
      ],
    }
  )
}

// 获取用户可靠性信息
export function useUserReliability(userId: string) {
  return useApiDetail(
    ['users', userId, 'reliability'],
    (id) => api.users({ id }).reliability.get(),
    userId,
    {
      staleTime: 10 * 60 * 1000, // 10 分钟
    }
  )
}

// 获取用户活动历史
export function useUserActivities(userId: string, filters: PaginationQuery = { page: 1, limit: 10 }) {
  return useApiList(
    ['users', userId, 'activities', filters],
    (params) => api.users({ id: userId }).activities.get({ query: params }),
    filters,
    {
      enabled: !!userId,
      staleTime: 5 * 60 * 1000,
    }
  )
}

// 获取用户参与记录
export function useUserParticipations(userId: string, filters: PaginationQuery = { page: 1, limit: 10 }) {
  return useApiList(
    ['users', userId, 'participations', filters],
    (params) => api.users({ id: userId }).participations.get({ query: params }),
    filters,
    {
      enabled: !!userId,
      staleTime: 5 * 60 * 1000,
    }
  )
}