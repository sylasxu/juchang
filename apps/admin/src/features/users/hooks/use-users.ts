// 用户管理 Hooks - 使用 Eden Treaty
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api, unwrap } from '@/lib/eden'
import { toast } from 'sonner'

// 更新用户
export function useUpdateUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { nickname?: string } }) => {
      return unwrap(api.users({ id }).put(data))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
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
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('用户已删除')
    },
    onError: (error: Error) => {
      toast.error(`删除失败: ${error.message}`)
    },
  })
}

// 封禁/解封用户 (MVP 暂不实现，预留接口)
export function useBlockUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id: _id, blocked }: { id: string; blocked: boolean }) => {
      // MVP 暂不实现封禁功能
      console.warn('Block user not implemented in MVP')
      return { success: true, blocked }
    },
    onSuccess: (_, { blocked }) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success(blocked ? '用户已封禁' : '用户已解封')
    },
    onError: (error: Error) => {
      toast.error(`操作失败: ${error.message}`)
    },
  })
}
