import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { usePremiumServiceStats } from '@/hooks/use-premium-services'
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Zap,
  Crown,
  Rocket,
  Bot
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PremiumStatsProps {
  timeRange?: string
}

export function PremiumStats({ timeRange = '30d' }: PremiumStatsProps) {
  const { data: stats, isLoading } = usePremiumServiceStats(timeRange)

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) return null

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`
  }

  const getTrendIcon = (change?: number) => {
    if (!change) return null
    return change > 0 ? (
      <TrendingUp className="h-3 w-3 text-green-500" />
    ) : (
      <TrendingDown className="h-3 w-3 text-red-500" />
    )
  }

  const getTrendColor = (change?: number) => {
    if (!change) return 'text-muted-foreground'
    return change > 0 ? 'text-green-500' : 'text-red-500'
  }

  const serviceIcons = {
    boost: Zap,
    pinPlus: Crown,
    fastPass: Rocket,
    aiServices: Bot,
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* 总收入 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">总收入</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(stats.totalRevenue)}
          </div>
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            {getTrendIcon(stats.trends.revenue[0]?.change)}
            <span className={getTrendColor(stats.trends.revenue[0]?.change)}>
              {stats.trends.revenue[0]?.change ? 
                `${stats.trends.revenue[0].change > 0 ? '+' : ''}${(stats.trends.revenue[0].change * 100).toFixed(1)}%` : 
                '无变化'
              }
            </span>
            <span>vs 上期</span>
          </div>
        </CardContent>
      </Card>

      {/* 付费用户数 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">付费用户</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.totalUsers.toLocaleString()}
          </div>
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            {getTrendIcon(stats.trends.users[0]?.change)}
            <span className={getTrendColor(stats.trends.users[0]?.change)}>
              {stats.trends.users[0]?.change ? 
                `${stats.trends.users[0].change > 0 ? '+' : ''}${(stats.trends.users[0].change * 100).toFixed(1)}%` : 
                '无变化'
              }
            </span>
            <span>vs 上期</span>
          </div>
        </CardContent>
      </Card>

      {/* 活跃订阅 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">活跃订阅</CardTitle>
          <Crown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.activeSubscriptions.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground">
            订阅率 {formatPercentage(stats.activeSubscriptions / stats.totalUsers)}
          </div>
        </CardContent>
      </Card>

      {/* 转化率 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">转化率</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatPercentage(stats.conversionRate)}
          </div>
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            {getTrendIcon(stats.trends.conversions[0]?.change)}
            <span className={getTrendColor(stats.trends.conversions[0]?.change)}>
              {stats.trends.conversions[0]?.change ? 
                `${stats.trends.conversions[0].change > 0 ? '+' : ''}${(stats.trends.conversions[0].change * 100).toFixed(1)}%` : 
                '无变化'
              }
            </span>
            <span>vs 上期</span>
          </div>
        </CardContent>
      </Card>

      {/* 各项服务统计 */}
      {Object.entries(stats.services).map(([key, service]) => {
        const IconComponent = serviceIcons[key as keyof typeof serviceIcons]
        
        return (
          <Card key={key}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{service.name}</CardTitle>
              <IconComponent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {service.totalUsers.toLocaleString()}
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>活跃: {service.activeUsers.toLocaleString()}</span>
                <Badge variant="secondary" className="text-xs">
                  {formatPercentage(service.conversionRate)}
                </Badge>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                收入: {formatCurrency(service.revenue)}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}