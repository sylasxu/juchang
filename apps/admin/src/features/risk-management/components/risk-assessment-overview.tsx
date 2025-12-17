import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { 
  AlertTriangle, 
  Shield, 
  Eye,
  TrendingUp,
  Users,
  Activity,
  Clock,
  ArrowRight
} from 'lucide-react'
import { useRiskTrends, useRiskStats } from '@/hooks/use-risk-management'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export function RiskAssessmentOverview() {
  const { data: stats, isLoading: statsLoading } = useRiskStats()
  const { data: trends, isLoading: trendsLoading } = useRiskTrends('7d')

  if (statsLoading || trendsLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const riskLevelDistribution = stats?.riskLevelDistribution || {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0
  }

  const totalRisks = Object.values(riskLevelDistribution).reduce((sum, count) => sum + count, 0)

  const recentAlerts = stats?.recentAlerts || []
  const topRiskFactors = stats?.topRiskFactors || []

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* 风险等级分布 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            风险等级分布
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(riskLevelDistribution).map(([level, count]) => {
            const percentage = totalRisks > 0 ? (count / totalRisks) * 100 : 0
            const levelConfig = {
              low: { label: '低风险', color: 'bg-green-500', textColor: 'text-green-700' },
              medium: { label: '中风险', color: 'bg-yellow-500', textColor: 'text-yellow-700' },
              high: { label: '高风险', color: 'bg-orange-500', textColor: 'text-orange-700' },
              critical: { label: '严重风险', color: 'bg-red-500', textColor: 'text-red-700' }
            }[level] || { label: level, color: 'bg-gray-500', textColor: 'text-gray-700' }

            return (
              <div key={level} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${levelConfig.textColor}`}>
                    {levelConfig.label}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {count} ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <Progress 
                  value={percentage} 
                  className="h-2"
                  style={{
                    '--progress-background': levelConfig.color
                  } as any}
                />
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* 最新风险警报 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            最新风险警报
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentAlerts.length > 0 ? (
            <div className="space-y-3">
              {recentAlerts.slice(0, 5).map((alert: any, index: number) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className={`p-1 rounded-full ${
                    alert.severity === 'high' ? 'bg-red-100' :
                    alert.severity === 'medium' ? 'bg-yellow-100' : 'bg-blue-100'
                  }`}>
                    <AlertTriangle className={`h-3 w-3 ${
                      alert.severity === 'high' ? 'text-red-600' :
                      alert.severity === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {alert.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(alert.createdAt), 'MM-dd HH:mm', { locale: zhCN })}
                    </p>
                  </div>
                  <Badge variant={
                    alert.severity === 'high' ? 'destructive' :
                    alert.severity === 'medium' ? 'secondary' : 'outline'
                  }>
                    {alert.severity}
                  </Badge>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full">
                查看全部警报
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          ) : (
            <div className="text-center py-6">
              <Shield className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">暂无风险警报</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 主要风险因子 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            主要风险因子
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topRiskFactors.length > 0 ? (
            <div className="space-y-3">
              {topRiskFactors.slice(0, 5).map((factor: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      factor.severity === 'high' ? 'bg-red-500' :
                      factor.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`} />
                    <span className="text-sm font-medium">{factor.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {factor.count}
                    </span>
                    <Badge variant="outline" size="sm">
                      {factor.percentage}%
                    </Badge>
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full">
                查看详细分析
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          ) : (
            <div className="text-center py-6">
              <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">暂无风险因子数据</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}