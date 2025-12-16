import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  fetchUsers,
  fetchUserById,
  fetchAdminUsers,
  fetchAdminUserById,
  updateUser,
  deleteUser,
  blockUser,
  unblockUser,
  type UserQueryParams,
  type AdminUserQueryParams,
} from '../data/users'

// Query Keys
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (params: UserQueryParams) => [...userKeys.lists(), params] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
}

/**
 * 获取用户列表
 */
export function useUsers(params: UserQueryParams = {}) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => fetchUsers(params),
  })
}

/**
 * 管理员获取用户列表（增强版）
 */
export function useAdminUsers(params: AdminUserQueryParams = {}) {
  return useQuery({
    queryKey: [...userKeys.lists(), 'admin', params],
    queryFn: () => fetchAdminUsers(params),
  })
}

/**
 * 获取用户详情
 */
export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => fetchUserById(id),
    enabled: !!id,
  })
}

/**
 * 管理员获取用户详情（增强版）
 */
export function useAdminUser(id: string) {
  return useQuery({
    queryKey: [...userKeys.details(), 'admin', id],
    queryFn: () => fetchAdminUserById(id),
    enabled: !!id,
  })
}

/**
 * 更新用户
 */
export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateUser>[1] }) =>
      updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all })
      toast.success('用户更新成功')
    },
    onError: (error: Error) => {
      toast.error(error.message || '更新失败')
    },
  })
}

/**
 * 删除用户
 */
export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all })
      toast.success('用户删除成功')
    },
    onError: (error: Error) => {
      toast.error(error.message || '删除失败')
    },
  })
}

/**
 * 封禁用户
 */
export function useBlockUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: blockUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all })
      toast.success('用户已封禁')
    },
    onError: (error: Error) => {
      toast.error(error.message || '封禁失败')
    },
  })
}

/**
 * 解封用户
 */
export function useUnblockUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: unblockUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all })
      toast.success('用户已解封')
    },
    onError: (error: Error) => {
      toast.error(error.message || '解封失败')
    },
  })
}
