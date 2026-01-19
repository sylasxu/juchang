// AI Metrics Hooks - Token 使用统计
import { useQuery } from '@tanstack/react-query'
import { api, unwrap } from '@/lib/eden'

interface MetricsQuery {
  startDate?: string
  endDate?: string
}

/**
 * 获取 Token 使用统计
 */
export function useTokenUsageStats(query: MetricsQuery = {}) {
  return useQuery({
    queryKey: ['ai', 'metrics', 'usage', query],
    queryFn: () => unwrap(api.ai.metrics.usage.get({ query })),
  })
}

/**
 * 获取当前 Prompt 信息
 */
export function useCurrentPrompt() {
  return useQuery({
    queryKey: ['ai', 'prompts', 'current'],
    queryFn: () => unwrap(api.ai.prompts.current.get()),
  })
}

// ==========================================
// v4.6: AI 健康度指标 (Dashboard)
// ==========================================

/**
 * 获取 AI 健康度指标
 */
export function useAIHealthMetrics() {
  return useQuery({
    queryKey: ['ai', 'ops', 'metrics', 'health'],
    queryFn: () => unwrap(api.ai.ops.metrics.health.get()),
    // 每 5 分钟刷新一次
    staleTime: 5 * 60 * 1000,
  })
}
