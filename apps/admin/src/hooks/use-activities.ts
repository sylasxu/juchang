// 活动管理相关 Hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, unwrap } from '@/lib/eden'
import { toast } from 'sonner'

// 从 Eden Treaty 推导类型
type ApiResponse<T> = T extends { get: (args?: infer _A) => Promise<{ data: infer R }> } ? R : never
type ActivitiesResponse = ApiResponse<typeof api.activities>

// 导出推导的类型
export type Activity = NonNullable<ActivitiesResponse>['data'] extends (infer T)[] ? T : never

// 活动筛选参数类型 (前端特有，允许手动定义)
export interface ActivityFilters {
  page?: number
  limit?: number
  status?: string
  type?: string
  search?: string
}

// 获取活动列表
export function useActivities(filters: ActivityFilters = {}) {
  const { page = 1, limit = 20, status, type, search } = filters

  return useQuery({
    queryKey: ['activities', { page, limit, status, type, search }],
    queryFn: async () => {
      const result = await unwrap(
        api.activities.get({ 
          query: { page, limit, status, type, search } 
        })
      )
      return {
        data: result?.data ?? [],
        total: result?.total ?? 0,
        page: result?.page ?? page,
        limit: result?.pageSize ?? limit,
      }
    },
  })
}

// 获取活动详情
export function useActivityDetail(activityId: string) {
  return useQuery({
    queryKey: ['activities', activityId],
    queryFn: () => unwrap(api.activities({ id: activityId }).get()),
    enabled: !!activityId,
  })
}

// 更新活动状态
export function useUpdateActivityStatus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'completed' | 'cancelled' }) => {
      return unwrap(api.activities({ id }).status.patch({ status }))
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      const statusText = variables.status === 'completed' ? '已确认成局' : '已取消'
      toast.success(`活动${statusText}`)
    },
    onError: (error: Error) => {
      toast.error(`状态更新失败: ${error.message}`)
    },
  })
}

// 删除活动
export function useDeleteActivity() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      return unwrap(api.activities({ id }).delete())
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      toast.success('活动已删除')
    },
    onError: (error: Error) => {
      toast.error(`删除失败: ${error.message}`)
    },
  })
}
