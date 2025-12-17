// 仪表板数据 Hooks
import { useQuery } from '@tanstack/react-query'
import { api, apiCall } from '@/lib/eden'
import { queryKeys } from '@/lib/query-client'

// 仪表板 KPI 数据类型
export interface DashboardKPIs {
  totalUsers: number
  activeUsers: number
  totalActivities: number
  totalRevenue: number
  userGrowthRate: number
  activeUserGrowthRate: number
  activityGrowthRate: number
  revenueGrowthRate: number
}

// 用户增长趋势数据类型
export interface UserGrowthData {
  date: string
  totalUsers: number
  newUsers: number
  activeUsers: number
}

// 最新活动数据类型
export interface RecentActivity {
  id: string
  title: string
  type: string
  creatorName: string
  participantCount: number
  status: string
  createdAt: string
  location?: string
}

// 获取仪表板 KPI 数据
export function useDashboardKPIs() {
  return useQuery({
    queryKey: queryKeys.dashboard.kpis(),
    queryFn: async (): Promise<DashboardKPIs> => {
      // 并行获取各项统计数据
      const [userStats, activityStats, transactionStats] = await Promise.all([
        apiCall(() => api.admin.users.stats.get()),
        apiCall(() => api.admin.activities.stats.get()),
        apiCall(() => api.admin.transactions.stats.get()),
      ])

      return {
        totalUsers: userStats.totalUsers || 0,
        activeUsers: userStats.activeUsers || 0,
        totalActivities: activityStats.totalActivities || 0,
        totalRevenue: transactionStats.totalRevenue || 0,
        userGrowthRate: userStats.growthRate || 0,
        activeUserGrowthRate: userStats.activeGrowthRate || 0,
        activityGrowthRate: activityStats.growthRate || 0,
        revenueGrowthRate: transactionStats.growthRate || 0,
      }
    },
    staleTime: 5 * 60 * 1000, // 5分钟缓存
    refetchInterval: 5 * 60 * 1000, // 每5分钟自动刷新
  })
}

// 获取用户增长趋势数据
export function useUserGrowthTrend(days: number = 30) {
  return useQuery({
    queryKey: queryKeys.dashboard.userGrowth(days),
    queryFn: async (): Promise<UserGrowthData[]> => {
      return apiCall(() => 
        api.admin.analytics.users.growth.get({
          query: { days }
        })
      )
    },
    staleTime: 10 * 60 * 1000, // 10分钟缓存
  })
}

// 获取最新活动列表
export function useRecentActivities(limit: number = 10) {
  return useQuery({
    queryKey: queryKeys.dashboard.recentActivities(limit),
    queryFn: async (): Promise<RecentActivity[]> => {
      const response = await apiCall(() => 
        api.admin.activities.get({
          query: {
            page: 1,
            limit,
            sortBy: 'createdAt',
            sortOrder: 'desc'
          }
        })
      )
      
      // 转换数据格式
      return response.data.map((activity: any) => ({
        id: activity.id,
        title: activity.title,
        type: activity.type,
        creatorName: activity.creatorInfo?.nickname || '未知用户',
        participantCount: activity.participantCount || 0,
        status: activity.status,
        createdAt: activity.createdAt,
        location: activity.locationName,
      }))
    },
    staleTime: 2 * 60 * 1000, // 2分钟缓存
    refetchInterval: 2 * 60 * 1000, // 每2分钟自动刷新
  })
}

// 获取活动类型分布数据
export function useActivityTypeDistribution() {
  return useQuery({
    queryKey: queryKeys.dashboard.activityTypes(),
    queryFn: async () => {
      const stats = await apiCall(() => api.admin.activities.stats.get())
      return stats.typeStats || {}
    },
    staleTime: 10 * 60 * 1000, // 10分钟缓存
  })
}

// 获取收入趋势数据
export function useRevenueTrend(days: number = 30) {
  return useQuery({
    queryKey: queryKeys.dashboard.revenue(days),
    queryFn: async () => {
      return apiCall(() => 
        api.admin.analytics.transactions.revenue.get({
          query: { days }
        })
      )
    },
    staleTime: 10 * 60 * 1000, // 10分钟缓存
  })
}

// 获取地理分布数据
export function useGeographicDistribution() {
  return useQuery({
    queryKey: queryKeys.dashboard.geographic(),
    queryFn: async () => {
      return apiCall(() => api.admin.analytics.geographic.distribution.get())
    },
    staleTime: 30 * 60 * 1000, // 30分钟缓存
  })
}

// 实时数据刷新 Hook
export function useRealTimeUpdates() {
  const { refetch: refetchKPIs } = useDashboardKPIs()
  const { refetch: refetchActivities } = useRecentActivities()

  const refreshAll = () => {
    refetchKPIs()
    refetchActivities()
  }

  return { refreshAll }
}