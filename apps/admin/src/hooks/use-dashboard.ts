// 仪表板数据 Hooks - 混合使用真实 API 和 Mock 数据
import { useQuery } from '@tanstack/react-query'
import { api, apiCall } from '@/lib/eden'
import { queryKeys } from '@/lib/query-client'
import { mockUserGrowth, mockRevenueData, mockGeographicDistribution } from '@/lib/mock-data'

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

// 获取仪表板 KPI 数据 - 使用真实 API
export function useDashboardKPIs() {
  return useQuery({
    queryKey: queryKeys.dashboard.kpis(),
    queryFn: async (): Promise<DashboardKPIs> => {
      try {
        const stats = await apiCall(() => api.dashboard.stats.get())
        const statsData = stats as {
          totalUsers?: number
          activeUsers?: number
          totalActivities?: number
          totalRevenue?: number
          userGrowthRate?: number
          activeUserGrowthRate?: number
          activityGrowthRate?: number
          revenueGrowthRate?: number
        }

        return {
          totalUsers: statsData.totalUsers || 0,
          activeUsers: statsData.activeUsers || 0,
          totalActivities: statsData.totalActivities || 0,
          totalRevenue: statsData.totalRevenue || 0,
          userGrowthRate: statsData.userGrowthRate || 0,
          activeUserGrowthRate: statsData.activeUserGrowthRate || 0,
          activityGrowthRate: statsData.activityGrowthRate || 0,
          revenueGrowthRate: statsData.revenueGrowthRate || 0,
        }
      } catch {
        // 如果 API 失败，返回默认值
        return {
          totalUsers: 0,
          activeUsers: 0,
          totalActivities: 0,
          totalRevenue: 0,
          userGrowthRate: 0,
          activeUserGrowthRate: 0,
          activityGrowthRate: 0,
          revenueGrowthRate: 0,
        }
      }
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  })
}

// 获取用户增长趋势数据 - 使用 Mock 数据
export function useUserGrowthTrend(_days: number = 30) {
  return useQuery({
    queryKey: queryKeys.dashboard.userGrowth(_days),
    queryFn: async (): Promise<UserGrowthData[]> => {
      // 使用 mock 数据
      return mockUserGrowth.data.map(item => ({
        date: item.date,
        totalUsers: item.users,
        newUsers: Math.floor(item.users * 0.1),
        activeUsers: item.activeUsers,
      }))
    },
    staleTime: 10 * 60 * 1000,
  })
}


// 获取最新活动列表 - 使用真实 API
export function useRecentActivities(limit: number = 10) {
  return useQuery({
    queryKey: queryKeys.dashboard.recentActivities(limit),
    queryFn: async (): Promise<RecentActivity[]> => {
      try {
        const response = await apiCall(() => api.dashboard.activities.get())
        const responseData = response as Array<{
          id: string
          title: string
          type: string
          creatorInfo?: { nickname: string }
          participantCount?: number
          status: string
          createdAt: string
          locationName?: string
        }>

        return responseData.map((activity) => ({
          id: activity.id,
          title: activity.title,
          type: activity.type,
          creatorName: activity.creatorInfo?.nickname || '未知用户',
          participantCount: activity.participantCount || 0,
          status: activity.status,
          createdAt: activity.createdAt,
          location: activity.locationName,
        }))
      } catch {
        return []
      }
    },
    staleTime: 2 * 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
  })
}

// 获取活动类型分布数据 - 使用 Mock 数据
export function useActivityTypeDistribution() {
  return useQuery({
    queryKey: queryKeys.dashboard.activityTypes(),
    queryFn: async () => {
      // Mock 数据
      return {
        outdoor: 45,
        sports: 30,
        social: 25,
        learning: 20,
        entertainment: 15,
      }
    },
    staleTime: 10 * 60 * 1000,
  })
}

// 获取收入趋势数据 - 使用 Mock 数据
export function useRevenueTrend(_days: number = 30) {
  return useQuery({
    queryKey: queryKeys.dashboard.revenue(_days),
    queryFn: async () => mockRevenueData.data,
    staleTime: 10 * 60 * 1000,
  })
}

// 获取地理分布数据 - 使用 Mock 数据
export function useGeographicDistribution() {
  return useQuery({
    queryKey: queryKeys.dashboard.geographic(),
    queryFn: async () => mockGeographicDistribution.regions,
    staleTime: 30 * 60 * 1000,
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
