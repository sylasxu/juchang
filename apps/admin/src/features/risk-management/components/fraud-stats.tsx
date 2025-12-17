import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  AlertTriangle, 
  Shield, 
  TrendingUp, 
  TrendingDown,
  Eye,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'
import { useFraudDetections } from '@/hooks/use-risk-management'

export function FraudStats() {
  const { data: fraudData, isLoading } = useFraudDetections({ 
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

  const stats = fraudData?.stats || {
    totalDetections: 0,
    confirmedFraud: 0,
    falsePositives: 0,
    investigating: 0,
    detectionAccuracy: 0,
    accuracyChange: 0,
    detectionChange: 0,
    investigatingChange: 0
  }

  const statCards = [
    {
      title: '检测到欺诈',
      value: stats.totalDetections || 0,
      change: stats.detectionChange || 0,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      description: '系统检测到的潜在欺诈行为'
    },
    {
      title: '已确认欺诈',
      value: stats.confirmedFraud || 0,
      change: stats.confirmedChange || 0,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      description: '经人工确认的真实欺诈'
    },
    {
      title: '调查中',
      value: stats.investigating || 0,
      change: stats.investigatingChange || 0,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: '正在调查的可疑案例'
    },
    {
      title: '检测准确率',
      value: `${stats.detectionAccuracy || 0}%`,
      change: stats.accuracyChange || 0,
      icon: Shield,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: '欺诈检测系统的准确率'
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon
        const isPositiveChange = stat.change > 0
        const changeColor = stat.title === '检测准确率' 
          ? (isPositiveChange ? 'text-green-600' : 'text-red-600')
          : (isPositiveChange ? 'text-red-600' : 'text-green-600')
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