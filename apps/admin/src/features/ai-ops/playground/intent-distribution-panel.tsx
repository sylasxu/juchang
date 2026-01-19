/**
 * Intent Distribution Panel
 * 
 * 显示 AI 对话意图分布的饼图
 */

import { useQuery } from '@tanstack/react-query'
import { api, unwrap } from '@/lib/eden'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00C49F']

const INTENT_LABELS: Record<string, string> = {
  create: '创建活动',
  explore: '探索活动',
  partner: '找搭子',
  chitchat: '闲聊',
  unknown: '未识别',
}

export function IntentDistributionPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ['ai', 'ops', 'playground-stats'],
    queryFn: () => unwrap(api.ai.ops.metrics['playground-stats'].get()),
    refetchInterval: 30000, // 30秒刷新
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm font-medium'>意图分布</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className='h-48 w-full' />
        </CardContent>
      </Card>
    )
  }

  const chartData = data?.intentDistribution?.map(item => ({
    name: INTENT_LABELS[item.intent] || item.intent,
    value: item.count,
    percentage: item.percentage,
  })) || []

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm font-medium'>意图分布</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='h-48 flex items-center justify-center text-muted-foreground text-sm'>
            暂无数据
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className='pb-2'>
        <CardTitle className='text-sm font-medium'>意图分布 (近7天)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='h-48'>
          <ResponsiveContainer width='100%' height='100%'>
            <PieChart>
              <Pie
                data={chartData}
                dataKey='value'
                nameKey='name'
                cx='50%'
                cy='50%'
                outerRadius={60}
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [`${value} 次`, name]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
