/**
 * 类型守卫工具函数
 * 用于处理 API 响应的类型安全
 */

// 通用的 API 响应类型守卫
export function isValidApiResponse<T>(data: unknown): data is T {
  return data !== null && data !== undefined && typeof data === 'object'
}

// 数组类型守卫
export function isValidArray<T>(data: unknown): data is T[] {
  return Array.isArray(data)
}

// 对象类型守卫
export function isValidObject(data: unknown): data is Record<string, any> {
  return data !== null && data !== undefined && typeof data === 'object' && !Array.isArray(data)
}

// 安全获取对象属性
export function safeGet<T>(obj: unknown, key: string, defaultValue: T): T {
  if (isValidObject(obj) && key in obj) {
    return obj[key] as T
  }
  return defaultValue
}

// 安全获取数组
export function safeGetArray<T>(obj: unknown, key: string): T[] {
  const value = isValidObject(obj) ? obj[key] : undefined
  return isValidArray(value) ? value : []
}

// 安全获取数字
export function safeGetNumber(obj: unknown, key: string, defaultValue = 0): number {
  const value = isValidObject(obj) ? obj[key] : undefined
  return typeof value === 'number' ? value : defaultValue
}

// 安全获取字符串
export function safeGetString(obj: unknown, key: string, defaultValue = ''): string {
  const value = isValidObject(obj) ? obj[key] : undefined
  return typeof value === 'string' ? value : defaultValue
}

// 安全获取布尔值
export function safeGetBoolean(obj: unknown, key: string, defaultValue = false): boolean {
  const value = isValidObject(obj) ? obj[key] : undefined
  return typeof value === 'boolean' ? value : defaultValue
}