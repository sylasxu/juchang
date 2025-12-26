// 通用 API Hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiCall } from '@/lib/eden'
import { handleServerError } from '@/lib/handle-server-error'
import { toast } from 'sonner'
import type { PaginationQuery } from '@/lib/typebox'

// 通用列表查询 Hook
export function useApiList<T>(
  queryKey: readonly unknown[],
  apiFunction: (params?: any) => Promise<any>,
  params?: any,
  options?: {
    enabled?: boolean
    staleTime?: number
    refetchInterval?: number
  }
) {
  return useQuery({
    queryKey: [...queryKey, params],
    queryFn: async () => {
      const result = await apiCall<T>(() => apiFunction(params))
      return result
    },
    enabled: options?.enabled ?? true,
    staleTime: options?.staleTime,
    refetchInterval: options?.refetchInterval,
  })
}

// 通用详情查询 Hook
export function useApiDetail<T>(
  queryKey: readonly unknown[],
  apiFunction: (id: string) => Promise<any>,
  id: string,
  options?: {
    enabled?: boolean
    staleTime?: number
  }
) {
  return useQuery({
    queryKey: [...queryKey, id],
    queryFn: async () => {
      const result = await apiCall<T>(() => apiFunction(id))
      return result
    },
    enabled: (options?.enabled ?? true) && !!id,
    staleTime: options?.staleTime,
  })
}

// 通用创建 Mutation Hook
export function useApiCreate<TData, TVariables>(
  apiFunction: (data: TVariables) => Promise<any>,
  options?: {
    onSuccess?: (data: TData) => void
    onError?: (error: any) => void
    invalidateKeys?: unknown[][]
  }
) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (variables: TVariables) => {
      const result = await apiCall<TData>(() => apiFunction(variables))
      return result
    },
    onSuccess: (data) => {
      toast.success('创建成功')
      options?.onSuccess?.(data)
      
      // 失效相关缓存
      if (options?.invalidateKeys) {
        options.invalidateKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: key })
        })
      }
    },
    onError: (error) => {
      handleServerError(error)
      options?.onError?.(error)
    },
  })
}

// 通用更新 Mutation Hook
export function useApiUpdate<TData, TVariables>(
  apiFunction: (id: string, data: TVariables) => Promise<any>,
  options?: {
    onSuccess?: (data: TData) => void
    onError?: (error: any) => void
    invalidateKeys?: unknown[][]
  }
) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TVariables }) => {
      const result = await apiCall<TData>(() => apiFunction(id, data))
      return result
    },
    onSuccess: (data) => {
      toast.success('更新成功')
      options?.onSuccess?.(data)
      
      // 失效相关缓存
      if (options?.invalidateKeys) {
        options.invalidateKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: key })
        })
      }
    },
    onError: (error) => {
      handleServerError(error)
      options?.onError?.(error)
    },
  })
}

// 通用删除 Mutation Hook
export function useApiDelete<TData = void>(
  apiFunction: (id: string) => Promise<any>,
  options?: {
    onSuccess?: (data: TData) => void
    onError?: (error: any) => void
    invalidateKeys?: unknown[][]
  }
) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await apiCall<TData>(() => apiFunction(id))
      return result
    },
    onSuccess: (data) => {
      toast.success('删除成功')
      options?.onSuccess?.(data)
      
      // 失效相关缓存
      if (options?.invalidateKeys) {
        options.invalidateKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: key })
        })
      }
    },
    onError: (error) => {
      handleServerError(error)
      options?.onError?.(error)
    },
  })
}

// 通用批量操作 Mutation Hook
export function useApiBulkAction<TData, TVariables>(
  apiFunction: (data: TVariables) => Promise<any>,
  options?: {
    onSuccess?: (data: TData) => void
    onError?: (error: any) => void
    invalidateKeys?: unknown[][]
    successMessage?: string
  }
) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (variables: TVariables) => {
      const result = await apiCall<TData>(() => apiFunction(variables))
      return result
    },
    onSuccess: (data) => {
      toast.success(options?.successMessage || '批量操作成功')
      options?.onSuccess?.(data)
      
      // 失效相关缓存
      if (options?.invalidateKeys) {
        options.invalidateKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: key })
        })
      }
    },
    onError: (error) => {
      handleServerError(error)
      options?.onError?.(error)
    },
  })
}

// 分页查询 Hook
export function useApiPagination<T>(
  queryKey: readonly unknown[],
  apiFunction: (params: PaginationQuery & Record<string, any>) => Promise<any>,
  initialParams: PaginationQuery & Record<string, any> = { page: 1, limit: 20 },
  options?: {
    enabled?: boolean
    keepPreviousData?: boolean
  }
) {
  return useQuery({
    queryKey: [...queryKey, initialParams],
    queryFn: async () => {
      const result = await apiCall<{ data: T[]; pagination: any }>(() => apiFunction(initialParams))
      return result
    },
    enabled: options?.enabled ?? true,
    placeholderData: options?.keepPreviousData ? (previousData) => previousData : undefined,
  })
}

// 实时数据查询 Hook（带自动刷新）
export function useApiRealtime<T>(
  queryKey: readonly unknown[],
  apiFunction: () => Promise<any>,
  options?: {
    enabled?: boolean
    refetchInterval?: number
  }
) {
  return useQuery({
    queryKey,
    queryFn: async () => {
      const result = await apiCall<T>(() => apiFunction())
      return result
    },
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval ?? 30000, // 默认 30 秒刷新
    refetchIntervalInBackground: true,
  })
}