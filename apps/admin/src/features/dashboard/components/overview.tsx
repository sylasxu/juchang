import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import { useUserGrowthTrend } from '@/hooks/use-dashboard'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Skeleton } from '@/components/ui/skeleton'

export function Overview() {
  const { data: growthData, isLoading, error } = useUserGrowthTrend(30)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-[350px] w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[350px]">
        <p className="text-sm text-muted-foreground">加载图表数据失败</p>
      </div>
    )
  }

  // 转换数据格式用于图表显示
  const chartData = growthData?.map((item) => ({
    date: format(new Date(item.date), 'MM/dd', { locale: zhCN }),
    totalUsers: item.totalUsers,
    newUsers: item.newUsers,
    activeUsers: item.activeUsers,
  })) || []

  // 如果没有数据，显示占位符
  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[350px]">
        <p className="text-sm text-muted-foreground">暂无用户增长数据</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width='100%' height={350}>
      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <XAxis
          dataKey='date'
          stroke='#888888'
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke='#888888'
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              return (
                <div className="rounded-lg border bg-background p-2 shadow-md">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">
                        日期
                      </span>
                      <span className="font-bold text-muted-foreground">
                        {label}
                      </span>
                    </div>
                    {payload.map((entry, index) => (
                      <div key={index} className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          {entry.dataKey === 'totalUsers' && '总用户数'}
                          {entry.dataKey === 'newUsers' && '新增用户'}
                          {entry.dataKey === 'activeUsers' && '活跃用户'}
                        </span>
                        <span className="font-bold" style={{ color: entry.color }}>
                          {entry.value?.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            }
            return null
          }}
        />
        <Legend />
        <Bar
          dataKey='newUsers'
          name='新增用户'
          fill='hsl(var(--primary))'
          radius={[2, 2, 0, 0]}
        />
        <Bar
          dataKey='activeUsers'
          name='活跃用户'
          fill='hsl(var(--primary) / 0.6)'
          radius={[2, 2, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}