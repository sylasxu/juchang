// 用户管理相关 Hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, unwrap } from '@/lib/eden'
import { queryKeys } from '@/lib/query-client'
import { toast } from 'sonner'

// 每日默认额度
export const DAILY_QUOTA_LIMIT = 3

// 用户列表响应类型
interface UserListResponse {
  data: any[]
  total: number
  page: number
  limit: number
}

// 用户筛选参数类型
export interface UserFilters {
  page?: number
  limit?: number
  search?: string
}

// 更新用户请求类型
export interface UpdateUserRequest {
  nickname?: string
  avatarUrl?: string
}

// 获取用户列表
export function useUsersList(filters: UserFilters = {}) {
  const { page = 1, limit = 20, search } = filters
  
  return useQuery({
    queryKey: [...queryKeys.users.lists(), { page, limit, search }],
    queryFn: async () => {
      const result = await unwrap(api.users.get({ query: { page, limit, search } }))
      return result as UserListResponse
    },
    staleTime: 2 * 60 * 1000,
  })
}

// 获取用户详情
export function useUserDetail(userId: string) {
  return useQuery({
    queryKey: [...queryKeys.users.details(), userId],
    queryFn: () => unwrap(api.users({ id: userId }).get()),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })
}

// 更新用户
export function useUpdateUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateUserRequest }) => {
      return unwrap(api.users({ id }).put(data))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
      toast.success('用户信息已更新')
    },
    onError: (error: Error) => {
      toast.error(`更新失败: ${error.message}`)
    },
  })
}

// 删除用户
export function useDeleteUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      return unwrap(api.users({ id }).delete())
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
      toast.success('用户已删除')
    },
    onError: (error: Error) => {
      toast.error(`删除失败: ${error.message}`)
    },
  })
}

// 设置单个用户额度
export function useSetUserQuota() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, quota }: { userId: string; quota: number }) => {
      return await unwrap(api.users({ id: userId }).quota.put({ quota }))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
      toast.success('额度已更新')
    },
    onError: (error: Error) => {
      toast.error(`更新失败: ${error.message}`)
    },
  })
}

// 批量设置用户额度
export function useSetUserQuotaBatch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userIds, quota }: { userIds: string[]; quota: number }) => {
      return await unwrap(api.users.quota.batch.post({ userIds, quota }))
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
      toast.success(`已更新 ${data?.updatedCount || 0} 个用户的额度`)
    },
    onError: (error: Error) => {
      toast.error(`批量更新失败: ${error.message}`)
    },
  })
}
