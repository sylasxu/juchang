// Eden Treaty 客户端 - 类型安全的 API 调用
import { treaty } from '@elysiajs/eden'
import type { App } from '@juchang/api'
import { toast } from 'sonner'

// 使用根目录 .env 中的 API_BASE_URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

// 创建 Eden Treaty 客户端实例
export const api = treaty<App>(API_BASE_URL, {
  // 全局请求配置
  headers: {
    'Content-Type': 'application/json',
  },
  // 请求拦截器 - 添加认证 token
  onRequest: (options) => {
    const token = localStorage.getItem('admin_token')
    if (token) {
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      }
    }
    return options
  },
  // 响应拦截器 - 统一错误处理
  onResponse: (response) => {
    // 处理认证失败
    if (response.status === 401) {
      localStorage.removeItem('admin_token')
      window.location.href = '/login'
      return
    }
    
    // 处理其他错误
    if (!response.ok && response.status >= 400) {
      handleApiError(response)
    }
    
    return response
  },
})

// API 错误处理函数
export function handleApiError(response: Response) {
  let errorMessage = '请求失败，请稍后重试'
  
  switch (response.status) {
    case 400:
      errorMessage = '请求参数错误'
      break
    case 401:
      errorMessage = '未授权访问，请重新登录'
      break
    case 403:
      errorMessage = '权限不足，无法执行此操作'
      break
    case 404:
      errorMessage = '请求的资源不存在'
      break
    case 409:
      errorMessage = '操作冲突，请检查数据状态'
      break
    case 422:
      errorMessage = '数据验证失败，请检查输入'
      break
    case 429:
      errorMessage = '请求过于频繁，请稍后再试'
      break
    case 500:
      errorMessage = '服务器内部错误'
      break
    case 502:
      errorMessage = '网关错误，服务暂时不可用'
      break
    case 503:
      errorMessage = '服务暂时不可用，请稍后重试'
      break
    default:
      errorMessage = `请求失败 (${response.status})`
  }
  
  // 显示错误提示
  toast.error(errorMessage)
  
  // 记录错误日志（开发环境）
  if (import.meta.env.DEV) {
    console.error('API Error:', {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
    })
  }
}

// 认证相关工具函数
export const auth = {
  // 设置认证 token
  setToken: (token: string) => {
    localStorage.setItem('admin_token', token)
  },
  
  // 获取认证 token
  getToken: () => {
    return localStorage.getItem('admin_token')
  },
  
  // 清除认证 token
  clearToken: () => {
    localStorage.removeItem('admin_token')
  },
  
  // 检查是否已认证
  isAuthenticated: () => {
    return !!localStorage.getItem('admin_token')
  },
}

// 类型安全的 API 调用包装器
export async function apiCall<T>(
  apiFunction: () => Promise<any>
): Promise<T> {
  try {
    const response = await apiFunction()
    
    // Eden Treaty 返回的是 { data, error, status } 格式
    if (response.error) {
      throw new Error(response.error.message || '请求失败')
    }
    
    return response.data
  } catch (error) {
    // 重新抛出错误，让调用方处理
    throw error
  }
}

// 使用示例：
// const users = await apiCall(() => api.users.get({ query: { page: 1, limit: 20 } }))
// const user = await apiCall(() => api.users({ id: 'xxx' }).get())
