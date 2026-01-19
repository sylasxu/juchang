/**
 * Tool Success Panel
 * 
 * 显示 Tool 调用成功率的柱状图
 */

import { useQuery } from '@tanstack/react-query'
import { api, unwrap } from '@/lib/eden'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from 'recharts'

export function ToolSuccessPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ['ai', 'ops', 'playground-stats'],
    queryFn: () => unwrap(api.ai.ops.metrics['playground-stats'].get()),
    refetchInterval: 30000, // 30秒刷新
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm font-medium'>Tool 成功率</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className='h-48 w-full' />
        </CardContent>
      </Card>
    )
  }

  const toolStats = data?.toolStats || []
  
  if (toolStats.length === 0 || toolStats[0]?.totalCalls === 0) {
    return (
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm font-medium'>Tool 成功率</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='h-48 flex items-center justify-center text-muted-foreground text-sm'>
            暂无数据
          </div>
        </CardContent>
      </Card>
    )
  }

  // 转换为柱状图数据
  const chartData = [
    {
      name: '成功',
      value: toolStats[0]?.successCount || 0,
      fill: '#22c55e',
    },
    {
      name: '失败',
      value: toolStats[0]?.failureCount || 0,
      fill: '#ef4444',
    },
  ]

  const successRate = toolStats[0]?.successRate || 0

  return (
    <Card>
      <CardHeader className='pb-2'>
        <CardTitle className='text-sm font-medium'>
          Tool 成功率 (近7天)
          <span className='ml-2 text-xs font-normal text-muted-foreground'>
            {(successRate * 100).toFixed(1)}%
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='h-48'>
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart data={chartData} layout='vertical'>
              <XAxis type='number' tick={{ fontSize: 10 }} />
              <YAxis 
                type='category' 
                dataKey='name' 
                tick={{ fontSize: 10 }}
                width={40}
              />
              <Tooltip
                formatter={(value: number) => [`${value} 次`]}
              />
              <Bar dataKey='value' radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className='mt-2 text-xs text-muted-foreground text-center'>
          总调用: {toolStats[0]?.totalCalls || 0} 次
        </div>
      </CardContent>
    </Card>
  )
}
