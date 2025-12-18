// 全局类型声明文件
// 用于处理 API 响应和组件 props 的类型问题

declare global {
  // 扩展 Window 接口
  interface Window {
    // 性能监控相关
    performance: Performance & {
      memory?: {
        usedJSHeapSize: number
        totalJSHeapSize: number
        jsHeapSizeLimit: number
      }
    }
  }

  // 扩展 Navigator 接口
  interface Navigator {
    connection?: {
      type?: string
      effectiveType?: string
      downlink?: number
      rtt?: number
    }
    mozConnection?: any
    webkitConnection?: any
  }
}

// API 响应类型
export interface ApiResponse<T = any> {
  data?: T
  total?: number
  page?: number
  limit?: number
  hasMore?: boolean
  [key: string]: any
}

// 通用统计数据类型
export interface StatsData {
  [key: string]: number | string | boolean | undefined
}

// 通用列表项类型
export interface ListItem {
  id: string
  [key: string]: any
}

// 通用过滤器类型
export interface FilterOptions {
  [key: string]: any
}

export {}