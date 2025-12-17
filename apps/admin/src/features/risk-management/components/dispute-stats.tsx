import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  Timer
} from 'lucide-react'
import { useDisputeRecords } from '@/hooks/use-risk-management'

export function DisputeStats() {
  const { data: disputesData, isLoading } = useDisputeRecords({ 
    limit: 1000, // 获取所有数据用于统计
    includeStats: true 
  })

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const stats = disputesData?.stats || {
    totalDisputes: 0,
    openDisputes: 0,
    resolvedDisputes: 0,
    averageResolutionTime: 0,
    disputeChange: 0,
    resolutionTimeChange: 0
  }

  const statCards = [
    {
      title: '待处理争议',
      value: stats.openDisputes || 0,
      change: stats.disputeChange || 0,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      description: '需要处理的争议数量'
    },
    {
      title: '处理中争议',
      value: stats.investigatingDisputes || 0,
      change: stats.investigatingChange || 0,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: '正在调查处理的争议'
    },
    {
      title: '已解决争议',
      value: stats.resolvedDisputes || 0,
      change: stats.resolvedChange || 0,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: '本月已解决的争议'
    },
    {
      title: '平均处理时间',
      value: `${stats.averageResolutionTime || 0}h`,
      change: stats.resolutionTimeChange || 0,
      icon: Timer,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: '争议平均处理时长'
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon
        const isPositiveChange = stat.change > 0
        const changeColor = stat.title === '平均处理时间' 
          ? (isPositiveChange ? 'text-red-600' : 'text-green-600')
          : (isPositiveChange ? 'text-green-600' : 'text-red-600')
        const changeIcon = isPositiveChange ? TrendingUp : TrendingDown

        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-md ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{stat.value}</div>
                {stat.change !== 0 && (
                  <Badge variant="outline" className={`${changeColor} border-current`}>
                    <changeIcon className="h-3 w-3 mr-1" />
                    {Math.abs(stat.change)}%
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}