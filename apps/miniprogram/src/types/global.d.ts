/**
 * 全局类型定义
 */

// 扩展微信小程序全局类型
declare global {
  interface WechatMiniprogram {
    // 扩展 Page 类型支持泛型
    Page<TData = Record<string, any>, TCustom = {}>(
      options: WechatMiniprogram.Page.Options<TData, TCustom>
    ): void
    
    // 扩展 Component 类型
    Component<TData = Record<string, any>, TProperty = Record<string, any>, TMethod = Record<string, any>>(
      options: WechatMiniprogram.Component.Options<TData, TProperty, TMethod>
    ): void
  }
}

// 应用全局类型
export interface AppGlobalData {
  userInfo?: User
  token?: string
  systemInfo?: WechatMiniprogram.SystemInfo
}

// 用户类型
export interface User {
  id: string
  wxOpenId: string
  phoneNumber: string | null
  nickname: string | null
  avatarUrl: string | null
  bio: string | null
  gender: 'male' | 'female' | 'unknown'
  participationCount: number
  fulfillmentCount: number
  disputeCount: number
  activitiesCreatedCount: number
  membershipType: 'free' | 'pro'
  isRegistered: boolean
  isBlocked: boolean
  createdAt: string
  updatedAt: string
}

// API 响应类型
export interface ApiResponse<T = any> {
  code: number
  msg: string
  data?: T
}

// 分页响应类型
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  totalPages: number
}

// 登录参数
export interface LoginParams {
  code: string
  phoneNumber?: string
  nickname?: string
  avatarUrl?: string
}

// 登录响应
export interface LoginResponse {
  user: User
  token: string
}

// 更新用户参数
export interface UpdateUserParams {
  nickname?: string
  bio?: string
  gender?: 'male' | 'female' | 'unknown'
  avatarUrl?: string
}

export {}