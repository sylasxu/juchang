// 地理管理相关 Hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, apiCall } from '@/lib/eden'
import { queryKeys } from '@/lib/query-client'
import { toast } from 'sonner'

// 地理位置数据类型
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

// 活动热力图数据
export interface HeatmapData {
  latitude: number
  longitude: number
  intensity: number
  activityCount: number
  userCount: number
  region: string
}

// 用户分布数据
export interface UserDistribution {
  region: string
  city: string
  userCount: number
  activeUsers: number
  newUsers: number
  coordinates: {
    latitude: number
    longitude: number
  }
  growthRate: number
}

// 区域性能数据
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
  trends: {
    activityGrowth: number
    userGrowth: number
    engagementChange: number
  }
  coordinates: {
    latitude: number
    longitude: number
  }
  lastUpdated: string
}

// 位置验证结果
export interface LocationVerification {
  id: string
  originalLocation: LocationData
  verifiedLocation?: LocationData
  status: 'pending' | 'verified' | 'rejected' | 'suspicious'
  confidence: number
  issues: string[]
  verifiedBy?: string
  verifiedAt?: string
}

// 隐私控制设置
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

// 查询参数类型
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

// 获取活动热力图数据
export function useActivityHeatmap(filters: GeographyFilters = {}) {
  return useQuery({
    queryKey: queryKeys.geography.heatmap(filters),
    queryFn: async () => {
      return apiCall(() => 
        api.admin.geography.heatmap.get({
          query: filters
        })
      )
    },
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  })
}

// 获取用户分布数据
export function useUserDistribution(filters: GeographyFilters = {}) {
  return useQuery({
    queryKey: queryKeys.geography.userDistribution(filters),
    queryFn: async () => {
      return apiCall(() => 
        api.admin.geography.users.distribution.get({
          query: filters
        })
      )
    },
    staleTime: 10 * 60 * 1000, // 10分钟缓存
  })
}

// 获取区域性能数据
export function useRegionPerformance(filters: GeographyFilters = {}) {
  return useQuery({
    queryKey: queryKeys.geography.regionPerformance(filters),
    queryFn: async () => {
      return apiCall(() => 
        api.admin.geography.regions.performance.get({
          query: filters
        })
      )
    },
    staleTime: 15 * 60 * 1000, // 15分钟缓存
  })
}

// 获取位置数据列表
export function useLocationData(filters: LocationFilters = {}) {
  return useQuery({
    queryKey: queryKeys.geography.locations(filters),
    queryFn: async () => {
      return apiCall(() => 
        api.admin.geography.locations.get({
          query: filters
        })
      )
    },
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  })
}

// 获取位置验证列表
export function useLocationVerifications(filters: LocationFilters = {}) {
  return useQuery({
    queryKey: queryKeys.geography.verifications(filters),
    queryFn: async () => {
      return apiCall(() => 
        api.admin.geography.verifications.get({
          query: filters
        })
      )
    },
    staleTime: 2 * 60 * 1000, // 2分钟缓存
  })
}

// 获取隐私控制设置
export function usePrivacyControls() {
  return useQuery({
    queryKey: queryKeys.geography.privacyControls(),
    queryFn: async () => {
      return apiCall(() => api.admin.geography.privacy.controls.get())
    },
    staleTime: 10 * 60 * 1000, // 10分钟缓存
  })
}

// 验证位置数据
export function useVerifyLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      id, 
      verification 
    }: { 
      id: string
      verification: {
        status: 'verified' | 'rejected'
        verifiedLocation?: LocationData
        issues?: string[]
      }
    }) => {
      return apiCall(() => 
        api.admin.geography.verifications({ id }).patch(verification)
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.geography.verifications() })
      
      toast.success('位置验证更新成功')
    },
    onError: (error) => {
      console.error('位置验证失败:', error)
      toast.error('位置验证失败，请重试')
    },
  })
}

// 更新隐私控制设置
export function useUpdatePrivacyControl() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      userId, 
      settings 
    }: { 
      userId: string
      settings: Partial<PrivacyControl>
    }) => {
      return apiCall(() => 
        api.admin.geography.privacy.controls({ userId }).patch(settings)
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.geography.privacyControls() })
      
      toast.success('隐私设置更新成功')
    },
    onError: (error) => {
      console.error('更新隐私设置失败:', error)
      toast.error('更新隐私设置失败，请重试')
    },
  })
}

// 批量处理位置验证
export function useBatchVerifyLocations() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      locationIds, 
      action 
    }: { 
      locationIds: string[]
      action: 'verify' | 'reject'
    }) => {
      return apiCall(() => 
        api.admin.geography.verifications.batch.post({
          locationIds,
          action
        })
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.geography.verifications() })
      
      toast.success('批量处理完成')
    },
    onError: (error) => {
      console.error('批量处理失败:', error)
      toast.error('批量处理失败，请重试')
    },
  })
}

// 导出地理数据
export function useExportGeographyData() {
  return useMutation({
    mutationFn: async ({ 
      type, 
      filters 
    }: { 
      type: 'heatmap' | 'distribution' | 'performance' | 'locations'
      filters: any
    }) => {
      return apiCall(() => 
        api.admin.geography.export.post({
          type,
          filters
        })
      )
    },
    onSuccess: () => {
      toast.success('数据导出请求已提交')
    },
    onError: (error) => {
      console.error('数据导出失败:', error)
      toast.error('数据导出失败，请重试')
    },
  })
}