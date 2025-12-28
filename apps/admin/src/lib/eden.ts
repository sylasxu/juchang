// Eden Treaty 客户端 - 类型安全的 API 调用
import { treaty } from '@elysiajs/eden'
import type { App } from '@juchang/api'
import { toast } from 'sonner'

// 使用根目录 .env 中的 API_BASE_URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

// 创建 Eden Treaty 客户端实例
export const api = treaty<App>(API_BASE_URL, {
  headers: {
    'Content-Type': 'application/json',
  },
  onRequest: (_path, options) => {
    const token = localStorage.getItem('admin_token')
    if (token) {
      return {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${token}`,
        },
      }
    }
    return options
  },
})

// 认证相关工具函数
export const auth = {
  setToken: (token: string) => localStorage.setItem('admin_token', token),
  getToken: () => localStorage.getItem('admin_token'),
  clearToken: () => localStorage.removeItem('admin_token'),
  isAuthenticated: () => !!localStorage.getItem('admin_token'),
}

/**
 * 统一的 API 响应处理器
 * Eden Treaty 返回 { data, error, status } 格式
 * 
 * 使用方式：
 * const result = await unwrap(api.users.get({ query: { page: 1 } }))
 */
export async function unwrap<T>(
  promise: Promise<{ data: T; error: any; status: number }>
): Promise<T> {
  const response = await promise
  
  // 处理错误
  if (response.error) {
    const status = response.status
    
    // 401 未授权 - 跳转登录
    if (status === 401) {
      auth.clearToken()
      window.location.href = '/sign-in'
      throw new Error('未授权访问，请重新登录')
    }
    
    // 提取错误信息
    const errorMsg = 
      response.error?.msg || 
      response.error?.message || 
      response.error?.value ||
      getErrorMessage(status)
    
    // 显示错误提示
    toast.error(errorMsg)
    
    throw new Error(errorMsg)
  }
  
  return response.data
}

function getErrorMessage(status: number): string {
  const messages: Record<number, string> = {
    400: '请求参数错误',
    401: '未授权访问',
    403: '权限不足',
    404: '资源不存在',
    409: '操作冲突',
    422: '数据验证失败',
    429: '请求过于频繁',
    500: '服务器内部错误',
    502: '网关错误',
    503: '服务暂时不可用',
  }
  return messages[status] || `请求失败 (${status})`
}

// 兼容旧代码的别名
export const apiCall = unwrap
