import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useUserJourney } from '@/hooks/use-premium-services'
import { 
  Route, 
  Users, 
  Clock,
  MousePointer,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  Target,
  Zap
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export function UserJourneyAnalysis() {
  const [timeRange, setTimeRange] = useState('30d')
  const { data: journeyData, isLoading } = useUserJourney(timeRange)

  const timeRangeOptions = [
    { value: '7d', label: '最近7天' },
    { value: '30d', label: '最近30天' },
    { value: '90d', label: '最近90天' },
  ]

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} className="h-4 w-full" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!journeyData) return null

  const formatDuration = (hours: number) => {
    if (hours < 24) {
      return `${hours.toFixed(1)}小时`
    }
    return `${(hours / 24).toFixed(1)}天`
  }

  const getConversionColor = (rate: number) => {
    if (rate >= 0.3) return 'text-green-600'
    if (rate >= 0.2) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      {/* 时间范围选择 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">用户旅程分析</h3>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {timeRangeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 用户细分分析 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {journeyData.segments.map((segment, index) => (
          <Card key={index}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                {segment.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">用户数量</div>
                  <div className="font-semibold">{segment.users.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">转化率</div>
                  <div className={cn("font-semibold", getConversionColor(segment.conversionRate))}>
                    {(segment.conversionRate * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
              
              <div>
                <div className="text-sm text-muted-foreground mb-1">平均转化时间</div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {formatDuration(segment.averageTimeToConvert)}
                  </span>
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-2">常见路径</div>
                <div className="space-y-1">
                  {segment.commonPaths.slice(0, 3).map((path, pathIndex) => (
                    <div key={pathIndex} className="text-xs bg-muted p-2 rounded flex items-center gap-1">
                      <Route className="h-3 w-3 text-muted-foreground" />
                      <span className="truncate">{path}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Progress value={segment.conversionRate * 100} className="h-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 触点分析 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MousePointer className="h-5 w-5" />
            关键触点分析
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {journeyData.touchpoints.map((touchpoint, index) => {
              const impactLevel = touchpoint.conversionImpact >= 0.3 ? 'high' : 
                                touchpoint.conversionImpact >= 0.2 ? 'medium' : 'low'
              
              return (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">{touchpoint.name}</h4>
                    <Badge 
                      variant={
                        impactLevel === 'high' ? 'default' : 
                        impactLevel === 'medium' ? 'secondary' : 'outline'
                      }
                    >
                      {impactLevel === 'high' ? '高影响' : 
                       impactLevel === 'medium' ? '中影响' : '低影响'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">交互次数</span>
                      <span className="font-medium">{touchpoint.interactions.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">转化影响</span>
                      <span className={cn("font-medium", getConversionColor(touchpoint.conversionImpact))}>
                        {(touchpoint.conversionImpact * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  
                  <Progress 
                    value={touchpoint.conversionImpact * 100} 
                    className="mt-3 h-2" 
                  />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* 流失点分析 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            关键流失点
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {journeyData.dropoffPoints.map((dropoff, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">{dropoff.point}</h4>
                  <Badge 
                    variant={
                      dropoff.dropoffRate >= 0.5 ? 'destructive' : 
                      dropoff.dropoffRate >= 0.3 ? 'secondary' : 'outline'
                    }
                  >
                    流失率 {(dropoff.dropoffRate * 100).toFixed(1)}%
                  </Badge>
                </div>
                
                <div className="mb-3">
                  <Progress 
                    value={dropoff.dropoffRate * 100} 
                    className="h-2"
                  />
                </div>
                
                <div>
                  <div className="text-sm text-muted-foreground mb-2">主要流失原因</div>
                  <div className="grid gap-2 md:grid-cols-2">
                    {dropoff.reasons.map((reason, reasonIndex) => (
                      <div key={reasonIndex} className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-red-500 rounded-full" />
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {dropoff.dropoffRate >= 0.3 && (
                  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <Zap className="h-4 w-4" />
                      <span className="font-medium">优化建议</span>
                    </div>
                    <ul className="mt-1 ml-6 text-yellow-700 text-xs list-disc">
                      <li>简化该步骤的操作流程</li>
                      <li>增加用户引导和帮助信息</li>
                      <li>优化页面加载速度</li>
                      <li>提供更清晰的价值说明</li>
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 旅程优化建议 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            旅程优化建议
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-medium text-green-700">表现良好的环节</h4>
              {journeyData.touchpoints
                .filter(tp => tp.conversionImpact >= 0.3)
                .slice(0, 3)
                .map((touchpoint, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm">{touchpoint.name}</span>
                    <Badge variant="outline" className="ml-auto text-xs">
                      +{(touchpoint.conversionImpact * 100).toFixed(1)}%
                    </Badge>
                  </div>
                ))}
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-red-700">需要改进的环节</h4>
              {journeyData.dropoffPoints
                .filter(dp => dp.dropoffRate >= 0.3)
                .slice(0, 3)
                .map((dropoff, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-red-50 rounded">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm">{dropoff.point}</span>
                    <Badge variant="outline" className="ml-auto text-xs">
                      -{(dropoff.dropoffRate * 100).toFixed(1)}%
                    </Badge>
                  </div>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}