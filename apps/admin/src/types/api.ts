// API 响应类型定义

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

// 统计数据类型
export interface StatsResponse {
  totalUsers?: number
  activeUsers?: number
  totalActivities?: number
  totalRevenue?: number
  growthRate?: number
  activeGrowthRate?: number
  activityGrowthRate?: number
  revenueGrowthRate?: number
  [key: string]: number | undefined
}

// 沟通管理统计
export interface CommunicationStats {
  totalMessages: number
  flaggedMessages: number
  hiddenMessages: number
  deletedMessages: number
  averageRiskScore: number
  notifications: number
  supportRequests: number
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

// 审核相关类型
export interface ModerationQueueItem {
  id: string
  type: string
  targetId: string
  targetType: string
  status: 'pending' | 'approved' | 'rejected'
  priority: 'low' | 'medium' | 'high'
  createdAt: string
  assignee?: string
  content?: string
  reason?: string
}

export interface ModerationQueueFilters {
  status?: string
  type?: string
  priority?: string
  assignee?: string
  search?: string
}

export interface ModerationStats {
  pending: number
  approved: number
  rejected: number
  total: number
}

export interface Moderator {
  id: string
  name: string
  workload: number
}

export interface ModerationHistory {
  id: string
  action: string
  moderator: string
  timestamp: string
  reason?: string
}

// 增值服务类型
export interface AIQuotaData {
  usedQuota: number
  totalQuota: number
  remainingQuota: number
  usageByService: Record<string, number>
  usagePatterns: Array<{
    date: string
    usage: number
  }>
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

export interface AnalyticsData {
  userGrowth: ChartDataPoint[]
  activityStats: Record<string, number>
  revenueData: ChartDataPoint[]
  geographicDistribution: RegionData[]
}