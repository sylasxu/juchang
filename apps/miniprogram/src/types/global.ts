/**
 * 全局类型定义
 */

// API 响应格式
export interface ApiResponse<T = any> {
  code: number
  msg: string
  data?: T
}

// 用户类型定义
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

// 登录参数
export interface LoginParams {
  code: string
  phoneNumber?: string | null
  nickname?: string | null
  avatarUrl?: string | null
}

// 更新用户参数
export interface UpdateUserParams {
  nickname?: string
  bio?: string
  gender?: 'male' | 'female' | 'unknown'
  avatarUrl?: string
}

// 登录响应
export interface LoginResponse {
  user: User
  token: string
}