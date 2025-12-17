import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  AlertTriangle, 
  Shield, 
  TrendingUp, 
  TrendingDown,
  Users,
  Activity,
  DollarSign,
  Clock
} from 'lucide-react'
import { useRiskStats } from '@/hooks/use-risk-management'

export function RiskAssessmentStats() {
  const { data: stats, isLoading } = useRiskStats()

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

  if (!stats) {
    return null
  }

  const statCards = [
    {
      title: '高风险项目',
      value: stats.highRiskCount || 0,
      change: stats.highRiskChange || 0,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      description: '需要立即关注的高风险项目'
    },
    {
      title: '活跃风险评估',
      value: stats.activeAssessments || 0,
      change: stats.activeAssessmentsChange || 0,
      icon: Shield,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: '正在监控的风险评估'
    },
    {
      title: '用户可靠性',
      value: `${stats.averageReliabilityScore || 0}%`,
      change: stats.reliabilityScoreChange || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: '平均用户可靠性评分'
    },
    {
      title: '风险趋势',
      value: stats.riskTrend === 'up' ? '上升' : stats.riskTrend === 'down' ? '下降' : '稳定',
      change: stats.riskTrendChange || 0,
      icon: stats.riskTrend === 'up' ? TrendingUp : TrendingDown,
      color: stats.riskTrend === 'up' ? 'text-red-600' : stats.riskTrend === 'down' ? 'text-green-600' : 'text-gray-600',
      bgColor: stats.riskTrend === 'up' ? 'bg-red-50' : stats.riskTrend === 'down' ? 'bg-green-50' : 'bg-gray-50',
      description: '过去7天的风险变化趋势'
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon
        const isPositiveChange = stat.change > 0
        const changeColor = isPositiveChange ? 'text-red-600' : 'text-green-600'
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