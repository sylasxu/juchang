import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useBusinessMetrics, type BenchmarkStatus } from '@/hooks/use-dashboard'
import { TrendingUp, Calendar, Target, Repeat, Users, CheckCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// 基准指示器颜色
const benchmarkColors: Record<BenchmarkStatus, string> = {
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500',
}

// 单个指标卡片
function MetricCard({
  title,
  value,
  benchmark,
  comparison,
  suffix = '%',
  icon: Icon,
}: {
  title: string
  value: number
  benchmark: BenchmarkStatus
  comparison?: string
  suffix?: string
  icon: LucideIcon
}) {
  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium'>{title}</CardTitle>
        <Icon className='text-muted-foreground h-4 w-4' />
      </CardHeader>
      <CardContent>
        <div className='flex items-center gap-2'>
          <div className={`h-2 w-2 rounded-full ${benchmarkColors[benchmark]}`} />
          <div className='text-2xl font-bold'>
            {value.toFixed(1)}{suffix}
          </div>
        </div>
        {comparison && (
          <p className='text-xs text-muted-foreground mt-1'>{comparison}</p>
        )}
      </CardContent>
    </Card>
  )
}

export function BusinessMetrics() {
  const { data: metrics, isLoading, error } = useBusinessMetrics()

  if (isLoading) {
    return (
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader className='pb-2'>
              <Skeleton className='h-4 w-24' />
            </CardHeader>
            <CardContent>
              <Skeleton className='h-8 w-20' />
              <Skeleton className='h-4 w-16 mt-1' />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error || !metrics) {
    return (
      <div className='text-sm text-red-500'>加载核心指标失败</div>
    )
  }

  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
      <MetricCard
        title='J2C 转化率'
        value={metrics.j2cRate.value}
        benchmark={metrics.j2cRate.benchmark}
        comparison={metrics.j2cRate.comparison}
        icon={TrendingUp}
      />
      <MetricCard
        title='本周成局'
        value={metrics.weeklyCompletedCount.value}
        benchmark={metrics.weeklyCompletedCount.benchmark}
        comparison={metrics.weeklyCompletedCount.comparison}
        suffix='个'
        icon={Calendar}
      />
      <MetricCard
        title='草稿发布率'
        value={metrics.draftPublishRate.value}
        benchmark={metrics.draftPublishRate.benchmark}
        comparison={metrics.draftPublishRate.comparison}
        icon={Target}
      />
      <MetricCard
        title='活动成局率'
        value={metrics.activitySuccessRate.value}
        benchmark={metrics.activitySuccessRate.benchmark}
        comparison={metrics.activitySuccessRate.comparison}
        icon={CheckCircle}
      />
      <MetricCard
        title='周留存率'
        value={metrics.weeklyRetention.value}
        benchmark={metrics.weeklyRetention.benchmark}
        comparison={metrics.weeklyRetention.comparison}
        icon={Repeat}
      />
      <MetricCard
        title='一次性群主'
        value={metrics.oneTimeCreatorRate.value}
        benchmark={metrics.oneTimeCreatorRate.benchmark}
        comparison={metrics.oneTimeCreatorRate.comparison}
        icon={Users}
      />
    </div>
  )
}
