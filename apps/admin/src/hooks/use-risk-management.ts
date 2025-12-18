// 风险管理相关 Hooks - 使用 Mock 数据
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'
import { toast } from 'sonner'
import { mockRiskStats, mockRiskAssessments, mockRiskTrends } from '@/lib/mock-data'

// 类型定义
export interface RiskAssessment {
  id: string
  targetId: string
  targetType: 'user' | 'activity' | 'transaction'
  riskScore: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  riskFactors: RiskFactor[]
  assessmentDate: string
  lastUpdated: string
  status: 'active' | 'resolved' | 'monitoring'
  assignedTo?: { id: string; nickname: string }
  notes?: string
}

export interface RiskFactor {
  id: string
  type: 'behavioral' | 'financial' | 'social' | 'technical'
  category: string
  description: string
  severity: 'low' | 'medium' | 'high'
  weight: number
  detected: boolean
  detectedAt?: string
  evidence?: unknown
}

export interface UserReliability {
  userId: string
  reliabilityScore: number
  participationRate: number
  fulfillmentRate: number
  disputeCount: number
  positiveReviews: number
  negativeReviews: number
  accountAge: number
  verificationLevel: 'none' | 'phone' | 'id' | 'full'
  trustLevel: 'new' | 'bronze' | 'silver' | 'gold' | 'platinum'
  lastActivity: string
  riskFlags: string[]
}

export interface RiskAssessmentFilters {
  targetType?: string[]
  riskLevel?: string[]
  status?: string[]
  page?: number
  limit?: number
}


// 获取风险评估列表 (Mock)
export function useRiskAssessments(_filters: RiskAssessmentFilters = {}) {
  return useQuery({
    queryKey: queryKeys.risk.assessments(_filters),
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 300))
      return mockRiskAssessments
    },
    staleTime: 2 * 60 * 1000,
  })
}

// 获取风险评估统计 (Mock)
export function useRiskStats() {
  return useQuery({
    queryKey: queryKeys.risk.stats(),
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 200))
      return mockRiskStats
    },
    staleTime: 5 * 60 * 1000,
  })
}

// 获取单个风险评估详情 (Mock)
export function useRiskAssessment(id: string) {
  return useQuery({
    queryKey: queryKeys.risk.assessment(id),
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 200))
      return null
    },
    enabled: !!id,
    staleTime: 60 * 1000,
  })
}

// 获取用户可靠性指标 (Mock)
export function useUserReliability(userId: string) {
  return useQuery({
    queryKey: queryKeys.risk.userReliability(userId),
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 200))
      return {
        userId,
        reliabilityScore: 85,
        participationRate: 0.92,
        fulfillmentRate: 0.95,
        disputeCount: 0,
        positiveReviews: 12,
        negativeReviews: 1,
        accountAge: 180,
        verificationLevel: 'phone' as const,
        trustLevel: 'silver' as const,
        lastActivity: new Date().toISOString(),
        riskFlags: [],
      }
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000,
  })
}

// 获取争议处理列表 (Mock)
export function useDisputeRecords(_filters: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: queryKeys.risk.disputes(_filters),
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 300))
      return { data: [], total: 0, page: 1, limit: 20 }
    },
    staleTime: 2 * 60 * 1000,
  })
}

// 获取欺诈检测结果 (Mock)
export function useFraudDetections(_filters: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: queryKeys.risk.fraudDetections(_filters),
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 300))
      return { data: [], total: 0, page: 1, limit: 20 }
    },
    staleTime: 2 * 60 * 1000,
  })
}

// 创建风险评估 (Mock)
export function useCreateRiskAssessment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { targetId: string; targetType: string; riskFactors: string[]; notes?: string }) => {
      await new Promise(resolve => setTimeout(resolve, 500))
      return { success: true, id: 'new-assessment-id', ...data }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.risk.assessments() })
      queryClient.invalidateQueries({ queryKey: queryKeys.risk.stats() })
      toast.success('风险评估创建成功')
    },
    onError: () => toast.error('创建风险评估失败，请重试'),
  })
}

// 更新风险评估 (Mock)
export function useUpdateRiskAssessment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      await new Promise(resolve => setTimeout(resolve, 500))
      return { success: true, id, ...data }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.risk.assessments() })
      toast.success('风险评估更新成功')
    },
    onError: () => toast.error('更新风险评估失败，请重试'),
  })
}

// 处理争议 (Mock)
export function useResolveDispute() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, resolution }: { id: string; resolution: Record<string, unknown> }) => {
      await new Promise(resolve => setTimeout(resolve, 500))
      return { success: true, id, ...resolution }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.risk.disputes() })
      toast.success('争议处理成功')
    },
    onError: () => toast.error('争议处理失败，请重试'),
  })
}

// 确认欺诈检测结果 (Mock)
export function useConfirmFraud() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, confirmed, notes }: { id: string; confirmed: boolean; notes?: string }) => {
      await new Promise(resolve => setTimeout(resolve, 500))
      return { success: true, id, confirmed, notes }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.risk.fraudDetections() })
      toast.success('欺诈检测结果确认成功')
    },
    onError: () => toast.error('确认欺诈检测结果失败，请重试'),
  })
}

// 应用风险缓解措施 (Mock)
export function useApplyRiskMitigation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { targetId: string; targetType: string; measures: string[]; reason: string }) => {
      await new Promise(resolve => setTimeout(resolve, 500))
      return { success: true, ...data }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.risk.assessments() })
      toast.success('风险缓解措施应用成功')
    },
    onError: () => toast.error('应用风险缓解措施失败，请重试'),
  })
}

// 获取风险趋势数据 (Mock)
export function useRiskTrends(_timeRange: string = '30d') {
  return useQuery({
    queryKey: queryKeys.risk.trends(_timeRange),
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 300))
      return mockRiskTrends
    },
    staleTime: 10 * 60 * 1000,
  })
}