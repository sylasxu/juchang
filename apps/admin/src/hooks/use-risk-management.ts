// 风险管理相关 Hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, apiCall } from '@/lib/eden'
import { queryKeys } from '@/lib/query-client'
import { toast } from 'sonner'

// 风险评估数据类型
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
  assignedTo?: {
    id: string
    nickname: string
  }
  notes?: string
}

// 风险因子类型
export interface RiskFactor {
  id: string
  type: 'behavioral' | 'financial' | 'social' | 'technical'
  category: string
  description: string
  severity: 'low' | 'medium' | 'high'
  weight: number
  detected: boolean
  detectedAt?: string
  evidence?: any
}

// 用户可靠性指标
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

// 争议处理记录
export interface DisputeRecord {
  id: string
  type: 'payment' | 'activity' | 'behavior' | 'content'
  status: 'open' | 'investigating' | 'resolved' | 'escalated' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  reporterId: string
  reporterInfo: {
    id: string
    nickname: string
  }
  targetId: string
  targetType: 'user' | 'activity' | 'transaction'
  targetInfo: any
  description: string
  evidence?: any[]
  resolution?: string
  resolutionDate?: string
  assignedTo?: {
    id: string
    nickname: string
  }
  createdAt: string
  updatedAt: string
}

// 欺诈检测结果
export interface FraudDetection {
  id: string
  targetId: string
  targetType: 'user' | 'activity' | 'transaction'
  fraudType: 'fake_profile' | 'payment_fraud' | 'activity_manipulation' | 'review_fraud'
  confidence: number
  detectionMethod: 'rule_based' | 'ml_model' | 'manual_review'
  indicators: FraudIndicator[]
  status: 'detected' | 'confirmed' | 'false_positive' | 'investigating'
  detectedAt: string
  investigatedBy?: string
  resolution?: string
  resolutionDate?: string
}

// 欺诈指标
export interface FraudIndicator {
  type: string
  description: string
  severity: 'low' | 'medium' | 'high'
  evidence: any
}

// 风险评估查询参数
export interface RiskAssessmentFilters {
  targetType?: string[]
  riskLevel?: string[]
  status?: string[]
  assignedTo?: string
  dateRange?: [string, string]
  riskScoreRange?: [number, number]
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// 获取风险评估列表
export function useRiskAssessments(filters: RiskAssessmentFilters = {}) {
  return useQuery({
    queryKey: queryKeys.risk.assessments(filters),
    queryFn: async () => {
      return apiCall(() => 
        api.admin.risk.assessments.get({
          query: filters
        })
      )
    },
    staleTime: 2 * 60 * 1000, // 2分钟缓存
    refetchInterval: 5 * 60 * 1000, // 每5分钟自动刷新
  })
}

// 获取风险评估统计
export function useRiskStats() {
  return useQuery({
    queryKey: queryKeys.risk.stats(),
    queryFn: async () => {
      return apiCall(() => api.admin.risk.stats.get())
    },
    staleTime: 5 * 60 * 1000, // 5分钟缓存
    refetchInterval: 5 * 60 * 1000, // 每5分钟自动刷新
  })
}

// 获取单个风险评估详情
export function useRiskAssessment(id: string) {
  return useQuery({
    queryKey: queryKeys.risk.assessment(id),
    queryFn: async () => {
      return apiCall(() => api.admin.risk.assessments({ id }).get())
    },
    enabled: !!id,
    staleTime: 60 * 1000, // 1分钟缓存
  })
}

// 获取用户可靠性指标
export function useUserReliability(userId: string) {
  return useQuery({
    queryKey: queryKeys.risk.userReliability(userId),
    queryFn: async () => {
      return apiCall(() => 
        api.admin.risk.users({ id: userId }).reliability.get()
      )
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10分钟缓存
  })
}

// 获取争议处理列表
export function useDisputeRecords(filters: any = {}) {
  return useQuery({
    queryKey: queryKeys.risk.disputes(filters),
    queryFn: async () => {
      return apiCall(() => 
        api.admin.risk.disputes.get({
          query: filters
        })
      )
    },
    staleTime: 2 * 60 * 1000, // 2分钟缓存
    refetchInterval: 3 * 60 * 1000, // 每3分钟自动刷新
  })
}

// 获取欺诈检测结果
export function useFraudDetections(filters: any = {}) {
  return useQuery({
    queryKey: queryKeys.risk.fraudDetections(filters),
    queryFn: async () => {
      return apiCall(() => 
        api.admin.risk.fraud.get({
          query: filters
        })
      )
    },
    staleTime: 2 * 60 * 1000, // 2分钟缓存
    refetchInterval: 5 * 60 * 1000, // 每5分钟自动刷新
  })
}

// 创建风险评估
export function useCreateRiskAssessment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      targetId: string
      targetType: 'user' | 'activity' | 'transaction'
      riskFactors: string[]
      notes?: string
    }) => {
      return apiCall(() => 
        api.admin.risk.assessments.post(data)
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.risk.assessments() })
      queryClient.invalidateQueries({ queryKey: queryKeys.risk.stats() })
      
      toast.success('风险评估创建成功')
    },
    onError: (error) => {
      console.error('创建风险评估失败:', error)
      toast.error('创建风险评估失败，请重试')
    },
  })
}

// 更新风险评估
export function useUpdateRiskAssessment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      id, 
      data 
    }: { 
      id: string
      data: {
        status?: 'active' | 'resolved' | 'monitoring'
        assignedTo?: string
        notes?: string
      }
    }) => {
      return apiCall(() => 
        api.admin.risk.assessments({ id }).patch(data)
      )
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.risk.assessments() })
      queryClient.invalidateQueries({ queryKey: queryKeys.risk.assessment(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.risk.stats() })
      
      toast.success('风险评估更新成功')
    },
    onError: (error) => {
      console.error('更新风险评估失败:', error)
      toast.error('更新风险评估失败，请重试')
    },
  })
}

// 处理争议
export function useResolveDispute() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      id, 
      resolution 
    }: { 
      id: string
      resolution: {
        status: 'resolved' | 'escalated' | 'closed'
        resolution: string
        notes?: string
      }
    }) => {
      return apiCall(() => 
        api.admin.risk.disputes({ id }).resolve.post(resolution)
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.risk.disputes() })
      
      toast.success('争议处理成功')
    },
    onError: (error) => {
      console.error('争议处理失败:', error)
      toast.error('争议处理失败，请重试')
    },
  })
}

// 确认欺诈检测结果
export function useConfirmFraud() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      id, 
      confirmed,
      notes 
    }: { 
      id: string
      confirmed: boolean
      notes?: string
    }) => {
      return apiCall(() => 
        api.admin.risk.fraud({ id }).confirm.post({
          confirmed,
          notes
        })
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.risk.fraudDetections() })
      
      toast.success('欺诈检测结果确认成功')
    },
    onError: (error) => {
      console.error('确认欺诈检测结果失败:', error)
      toast.error('确认欺诈检测结果失败，请重试')
    },
  })
}

// 应用风险缓解措施
export function useApplyRiskMitigation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      targetId: string
      targetType: 'user' | 'activity'
      measures: string[]
      duration?: number
      reason: string
    }) => {
      return apiCall(() => 
        api.admin.risk.mitigation.post(data)
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.risk.assessments() })
      
      toast.success('风险缓解措施应用成功')
    },
    onError: (error) => {
      console.error('应用风险缓解措施失败:', error)
      toast.error('应用风险缓解措施失败，请重试')
    },
  })
}

// 获取风险趋势数据
export function useRiskTrends(timeRange: string = '30d') {
  return useQuery({
    queryKey: queryKeys.risk.trends(timeRange),
    queryFn: async () => {
      return apiCall(() => 
        api.admin.risk.trends.get({
          query: { timeRange }
        })
      )
    },
    staleTime: 10 * 60 * 1000, // 10分钟缓存
  })
}