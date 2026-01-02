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
