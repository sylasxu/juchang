import { AxiosError } from 'axios'
import { toast } from 'sonner'
import type { ErrorResponse } from './typebox'

// Eden Treaty 错误类型
interface EdenError {
  status: number
  value: any
}

// 统一错误处理函数
export function handleServerError(error: unknown) {
  // eslint-disable-next-line no-console
  console.error('Server Error:', error)

  let errMsg = '操作失败，请稍后重试'

  // 处理 Eden Treaty 错误
  if (isEdenError(error)) {
    errMsg = getEdenErrorMessage(error)
  }
  // 处理 Axios 错误（向后兼容）
  else if (error instanceof AxiosError) {
    errMsg = getAxiosErrorMessage(error)
  }
  // 处理标准 Error
  else if (error instanceof Error) {
    errMsg = error.message || errMsg
  }
  // 处理 204 状态码
  else if (
    error &&
    typeof error === 'object' &&
    'status' in error &&
    Number(error.status) === 204
  ) {
    errMsg = '内容未找到'
  }

  toast.error(errMsg)
}

// 检查是否为 Eden Treaty 错误
function isEdenError(error: unknown): error is EdenError {
  return (
    error !== null &&
    typeof error === 'object' &&
    'status' in error &&
    'value' in error &&
    typeof (error as any).status === 'number'
  )
}

// 获取 Eden Treaty 错误消息
function getEdenErrorMessage(error: EdenError): string {
  const { status, value } = error

  // 尝试解析标准错误响应格式
  if (value && typeof value === 'object') {
    // 检查是否为标准 API 错误响应
    if ('error' in value && value.error && typeof value.error === 'object') {
      const errorResponse = value as ErrorResponse
      return errorResponse.error.message || '请求失败'
    }
    
    // 检查是否有 message 字段
    if ('message' in value && typeof value.message === 'string') {
      return value.message
    }
    
    // 检查是否有 msg 字段
    if ('msg' in value && typeof value.msg === 'string') {
      return value.msg
    }
  }

  // 根据状态码返回默认消息
  switch (status) {
    case 400:
      return '请求参数错误'
    case 401:
      return '未授权访问，请重新登录'
    case 403:
      return '权限不足，无法执行此操作'
    case 404:
      return '请求的资源不存在'
    case 409:
      return '操作冲突，请检查数据状态'
    case 422:
      return '数据验证失败，请检查输入'
    case 429:
      return '请求过于频繁，请稍后再试'
    case 500:
      return '服务器内部错误'
    case 502:
      return '网关错误，服务暂时不可用'
    case 503:
      return '服务暂时不可用，请稍后重试'
    default:
      return `请求失败 (${status})`
  }
}

// 获取 Axios 错误消息（向后兼容）
function getAxiosErrorMessage(error: AxiosError): string {
  if (error.response?.data) {
    const data = error.response.data as any
    
    if (typeof data === 'string') {
      return data
    }
    
    if (data.title) {
      return data.title
    }
    
    if (data.message) {
      return data.message
    }
    
    if (data.msg) {
      return data.msg
    }
  }
  
  return error.message || '网络请求失败'
}

// 业务错误处理函数
export function handleBusinessError(error: {
  code: string
  message: string
  details?: any
}) {
  console.error('Business Error:', error)
  
  // 根据错误代码显示不同的提示
  switch (error.code) {
    case 'VALIDATION_ERROR':
      toast.error(`数据验证失败: ${error.message}`)
      break
    case 'PERMISSION_DENIED':
      toast.error('权限不足，无法执行此操作')
      break
    case 'RESOURCE_NOT_FOUND':
      toast.error('请求的资源不存在')
      break
    case 'DUPLICATE_RESOURCE':
      toast.error('资源已存在，请检查后重试')
      break
    case 'OPERATION_CONFLICT':
      toast.error('操作冲突，请刷新页面后重试')
      break
    default:
      toast.error(error.message || '操作失败')
  }
}

// 网络错误处理函数
export function handleNetworkError(error: Error) {
  console.error('Network Error:', error)
  
  if (error.name === 'NetworkError' || error.message.includes('fetch')) {
    toast.error('网络连接失败，请检查网络设置')
  } else if (error.name === 'TimeoutError') {
    toast.error('请求超时，请稍后重试')
  } else {
    toast.error('网络请求失败，请稍后重试')
  }
}
