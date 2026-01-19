// Growth Hooks - 增长工具
import { useMutation, useQuery } from '@tanstack/react-query'
import { api, unwrap } from '@/lib/eden'
import { toast } from 'sonner'

interface GeneratePosterParams {
  text: string
  style: 'minimal' | 'cyberpunk' | 'handwritten'
}

/**
 * 生成海报文案
 */
export function useGeneratePoster() {
  return useMutation({
    mutationFn: (params: GeneratePosterParams) =>
      unwrap(api.growth.poster.generate.post(params)),
    onError: (error: Error) => toast.error(`生成失败: ${error.message}`),
  })
}

/**
 * 获取热门洞察
 */
export function useTrendInsights(period: '7d' | '30d' = '7d') {
  return useQuery({
    queryKey: ['trends', period],
    queryFn: () => unwrap(api.growth.trends.get({ query: { period } })),
  })
}
