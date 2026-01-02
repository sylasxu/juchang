// 举报管理相关 Hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, unwrap } from '@/lib/eden'
import { toast } from 'sonner'

// 举报类型
export interface Report {
  id: string
  type: string
  reason: string
  description: string | null
  targetId: string
  targetContent: string
  reporterId: string
  status: string
  adminNote: string | null
  createdAt: string
  resolvedAt: string | null
  resolvedBy: string | null
  reporter: {
    id: string
    nickname: string | null
    avatarUrl: string | null
  } | null
}

// 举报列表响应类型
interface ReportListResponse {
  data: Report[]
  total: number
  page: number
  limit: number
}

// 举报筛选参数类型
export interface ReportFilters {
  page?: number
  limit?: number
  status?: 'pending' | 'resolved' | 'ignored'
  type?: 'activity' | 'message' | 'user'
}

// 更新举报请求类型
export interface UpdateReportRequest {
  status: 'resolved' | 'ignored'
  adminNote?: string
}

// Query keys
const reportKeys = {
  all: ['reports'] as const,
  lists: () => [...reportKeys.all, 'list'] as const,
  list: (filters: ReportFilters) => [...reportKeys.lists(), filters] as const,
  details: () => [...reportKeys.all, 'detail'] as const,
  detail: (id: string) => [...reportKeys.details(), id] as const,
}

// 获取举报列表
export function useReportsList(filters: ReportFilters = {}) {
  const { page = 1, limit = 10, status, type } = filters

  return useQuery({
    queryKey: reportKeys.list({ page, limit, status, type }),
    queryFn: async () => {
      const query: Record<string, unknown> = { page, limit }
      if (status) query.status = status
      if (type) query.type = type
      const result = await unwrap(api.reports.get({ query }))
      return result as ReportListResponse
    },
    staleTime: 2 * 60 * 1000,
  })
}

// 更新举报状态
export function useUpdateReport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      status,
      adminNote,
    }: {
      id: string
      status: 'resolved' | 'ignored'
      adminNote?: string
    }) => {
      return unwrap(api.reports({ id }).patch({ status, adminNote }))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.all })
      toast.success('举报状态已更新')
    },
    onError: (error: Error) => {
      toast.error(`更新失败: ${error.message}`)
    },
  })
}
