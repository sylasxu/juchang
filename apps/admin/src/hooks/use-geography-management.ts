// 地理管理相关 Hooks - 使用 Mock 数据
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'
import { toast } from 'sonner'
import { mockHeatmapData, mockUserDistribution, mockRegionPerformance } from '@/lib/mock-data'

// 类型定义
export interface LocationData {
  id: string
  latitude: number
  longitude: number
  address: string
  city: string
  district: string
  province: string
  country: string
  isVerified: boolean
  accuracy: number
  source: 'gps' | 'ip' | 'manual'
  createdAt: string
  updatedAt: string
}

export interface HeatmapData {
  latitude: number
  longitude: number
  intensity: number
  activityCount: number
  userCount: number
  region: string
}

export interface UserDistribution {
  region: string
  city: string
  userCount: number
  activeUsers: number
  newUsers: number
  coordinates: { latitude: number; longitude: number }
  growthRate: number
}

export interface RegionPerformance {
  id: string
  region: string
  city: string
  metrics: {
    totalActivities: number
    completedActivities: number
    averageParticipants: number
    completionRate: number
    userEngagement: number
    revenuePerUser: number
  }
  trends: { activityGrowth: number; userGrowth: number; engagementChange: number }
  coordinates: { latitude: number; longitude: number }
  lastUpdated: string
}

export interface PrivacyControl {
  id: string
  userId: string
  locationSharing: 'public' | 'friends' | 'private'
  precisionLevel: 'exact' | 'approximate' | 'city_only'
  allowAnalytics: boolean
  allowHeatmap: boolean
  dataRetentionDays: number
  updatedAt: string
}

export interface GeographyFilters {
  region?: string
  city?: string
  dateRange?: [string, string]
  minIntensity?: number
  maxIntensity?: number
  page?: number
  limit?: number
}

export interface LocationFilters {
  status?: string
  source?: string
  accuracy?: number
  region?: string
  page?: number
  limit?: number
}


// 获取活动热力图数据 (Mock)
export function useActivityHeatmap(_filters: GeographyFilters = {}) {
  return useQuery({
    queryKey: queryKeys.geography.heatmap(_filters),
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 300))
      return mockHeatmapData
    },
    staleTime: 5 * 60 * 1000,
  })
}

// 获取用户分布数据 (Mock)
export function useUserDistribution(_filters: GeographyFilters = {}) {
  return useQuery({
    queryKey: queryKeys.geography.userDistribution(_filters),
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 300))
      return mockUserDistribution
    },
    staleTime: 10 * 60 * 1000,
  })
}

// 获取区域性能数据 (Mock)
export function useRegionPerformance(_filters: GeographyFilters = {}) {
  return useQuery({
    queryKey: queryKeys.geography.regionPerformance(_filters),
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 300))
      return mockRegionPerformance
    },
    staleTime: 15 * 60 * 1000,
  })
}

// 获取位置数据列表 (Mock)
export function useLocationData(_filters: LocationFilters = {}) {
  return useQuery({
    queryKey: queryKeys.geography.locations(_filters),
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 300))
      return { data: [], total: 0, page: 1, limit: 20 }
    },
    staleTime: 5 * 60 * 1000,
  })
}

// 获取位置验证列表 (Mock)
export function useLocationVerifications(_filters: LocationFilters = {}) {
  return useQuery({
    queryKey: queryKeys.geography.verifications(_filters),
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 300))
      return { data: [], total: 0, page: 1, limit: 20 }
    },
    staleTime: 2 * 60 * 1000,
  })
}

// 获取隐私控制设置 (Mock)
export function usePrivacyControls() {
  return useQuery({
    queryKey: queryKeys.geography.privacyControls(),
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 200))
      return {
        data: [
          { id: '1', name: '位置模糊化', key: 'location_blur', enabled: true, level: 'medium' },
          { id: '2', name: '精确位置', key: 'exact_location', enabled: false, level: 'high' },
        ]
      }
    },
    staleTime: 10 * 60 * 1000,
  })
}

// 验证位置数据 (Mock)
export function useVerifyLocation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, verification }: { id: string; verification: Record<string, unknown> }) => {
      await new Promise(resolve => setTimeout(resolve, 500))
      return { success: true, id, ...verification }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.geography.verifications() })
      toast.success('位置验证更新成功')
    },
    onError: () => toast.error('位置验证失败，请重试'),
  })
}

// 更新隐私控制设置 (Mock)
export function useUpdatePrivacyControl() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, settings }: { userId: string; settings: Partial<PrivacyControl> }) => {
      await new Promise(resolve => setTimeout(resolve, 500))
      return { success: true, userId, ...settings }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.geography.privacyControls() })
      toast.success('隐私设置更新成功')
    },
    onError: () => toast.error('更新隐私设置失败，请重试'),
  })
}

// 批量处理位置验证 (Mock)
export function useBatchVerifyLocations() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ locationIds, action }: { locationIds: string[]; action: 'verify' | 'reject' }) => {
      await new Promise(resolve => setTimeout(resolve, 500))
      return { success: true, processed: locationIds.length, action }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.geography.verifications() })
      toast.success('批量处理完成')
    },
    onError: () => toast.error('批量处理失败，请重试'),
  })
}

// 导出地理数据 (Mock)
export function useExportGeographyData() {
  return useMutation({
    mutationFn: async ({ type, filters }: { type: string; filters: Record<string, unknown> }) => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      return { success: true, exportId: 'export-' + Date.now(), type, filters }
    },
    onSuccess: () => toast.success('数据导出请求已提交'),
    onError: () => toast.error('数据导出失败，请重试'),
  })
}