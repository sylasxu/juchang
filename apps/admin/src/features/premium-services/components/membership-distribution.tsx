import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { useMembershipDistribution } from '@/hooks/use-premium-services'
import { 
  Users, 
  Crown, 
  Star, 
  Diamond,
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertTriangle
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function MembershipDistribution() {
  const { data: distribution, isLoading } = useMembershipDistribution()

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!distribution) return null

  const formatPercentage = (value: number, total: number) => {
    return `${((value / total) * 100).toFixed(1)}%`
  }

  const membershipTypes = [
    { 
      key: 'free', 
      name: '免费用户', 
      icon: Users, 
      color: 'bg-gray-500',
      count: distribution.byType.free 
    },
    { 
      key: 'basic', 
      name: '基础会员', 
      icon: Star, 
      color: 'bg-blue-500',
      count: distribution.byType.basic 
    },
    { 
      key: 'premium', 
      name: '高级会员', 
      icon: Crown, 
      color: 'bg-purple-500',
      count: distribution.byType.premium 
    },
    { 
      key: 'vip', 
      name: 'VIP会员', 
      icon: Diamond, 
      color: 'bg-yellow-500',
      count: distribution.byType.vip 
    },
  ]

  const durationTypes = [
    { key: 'monthly', name: '月度订阅', count: distribution.byDuration.monthly },
    { key: 'quarterly', name: '季度订阅', count: distribution.byDuration.quarterly },
    { key: 'yearly', name: '年度订阅', count: distribution.byDuration.yearly },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* 会员类型分布 */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            会员类型分布
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {membershipTypes.map((type) => {
              const IconComponent = type.icon
              const percentage = (type.count / distribution.total) * 100
              
              return (
                <div key={type.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-3 h-3 rounded-full", type.color)} />
                      <IconComponent className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{type.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {type.count.toLocaleString()}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {percentage.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              )
            })}
          </div>
          
          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">总用户数</span>
              <span className="font-medium">{distribution.total.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 订阅时长分布 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            订阅时长分布
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {durationTypes.map((duration) => {
              const percentage = (duration.count / (distribution.byDuration.monthly + distribution.byDuration.quarterly + distribution.byDuration.yearly)) * 100
              
              return (
                <div key={duration.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{duration.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {duration.count.toLocaleString()}
                    </Badge>
                  </div>
                  <Progress value={percentage} className="h-2" />
                  <div className="text-xs text-muted-foreground text-right">
                    {percentage.toFixed(1)}%
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* 续费率分析 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            续费率分析
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {(distribution.renewalRates.overall * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">整体续费率</div>
            </div>
            
            <div className="space-y-3">
              <div className="text-sm font-medium">按会员类型</div>
              {Object.entries(distribution.renewalRates.byType).map(([type, rate]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground capitalize">
                    {type === 'basic' ? '基础' : type === 'premium' ? '高级' : type === 'vip' ? 'VIP' : type}
                  </span>
                  <Badge 
                    variant={rate > 0.7 ? 'default' : rate > 0.5 ? 'secondary' : 'destructive'}
                    className="text-xs"
                  >
                    {(rate * 100).toFixed(1)}%
                  </Badge>
                </div>
              ))}
            </div>
            
            <div className="space-y-3">
              <div className="text-sm font-medium">按订阅时长</div>
              {Object.entries(distribution.renewalRates.byDuration).map(([duration, rate]) => (
                <div key={duration} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {duration === 'monthly' ? '月度' : duration === 'quarterly' ? '季度' : '年度'}
                  </span>
                  <Badge 
                    variant={rate > 0.8 ? 'default' : rate > 0.6 ? 'secondary' : 'destructive'}
                    className="text-xs"
                  >
                    {(rate * 100).toFixed(1)}%
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 流失分析 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            流失分析
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">
                {(distribution.churnAnalysis.churnRate * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">流失率</div>
            </div>
            
            <div className="space-y-3">
              <div className="text-sm font-medium">主要流失原因</div>
              {distribution.churnAnalysis.churnReasons.slice(0, 5).map((reason, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {reason.reason}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {reason.count}
                    </Badge>
                  </div>
                  <Progress value={reason.percentage} className="h-1" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}