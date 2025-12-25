// API 响应类型定义 (MVP 简化版)

export interface ApiResponse<T = unknown> {
  data: T
  total?: number
  page?: number
  limit?: number
  hasMore?: boolean
  success?: boolean
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// 统计数据类型 (MVP 简化版 - 移除 revenue)
export interface StatsResponse {
  totalUsers?: number
  activeUsers?: number
  totalActivities?: number
  growthRate?: number
  activeGrowthRate?: number
  activityGrowthRate?: number
  [key: string]: number | undefined
}

// 系统健康数据
export interface SystemHealthMetrics {
  cpu: number
  memory: number
  disk: number
  network: number
}

export interface SystemService {
  status: 'healthy' | 'warning' | 'critical' | 'offline'
  responseTime: number
  errorRate: number
  uptime: number
  lastCheck: string
  message: string
}

export interface SystemHealthData {
  overall: 'healthy' | 'warning' | 'critical'
  services: Record<string, SystemService>
  metrics: SystemHealthMetrics
}

// 地理数据类型
export interface HeatmapPoint {
  lat: number
  lng: number
  intensity: number
}

export interface RegionData {
  name: string
  users: number
  activities: number
  engagement?: number
}

// 图表数据类型
export interface ChartDataPoint {
  date: string
  value: number
  label?: string
}

// MVP 分析数据类型 (移除 revenue)
export interface AnalyticsData {
  userGrowth: ChartDataPoint[]
  activityStats: Record<string, number>
  geographicDistribution: RegionData[]
}

// MVP 活动类型
export type ActivityType = 'food' | 'sports' | 'entertainment' | 'boardgame' | 'other'

// MVP 活动状态
export type ActivityStatus = 'active' | 'completed' | 'cancelled'

// MVP 参与者状态
export type ParticipantStatus = 'joined' | 'quit'

// MVP 消息类型
export type MessageType = 'text' | 'system'

// MVP 通知类型
export type NotificationType = 'join' | 'quit' | 'activity_start' | 'completed' | 'cancelled'
