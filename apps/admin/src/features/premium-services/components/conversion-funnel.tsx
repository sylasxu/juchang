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
import { useConversionFunnel } from '@/hooks/use-premium-services'
import { 
  TrendingDown, 
  Users, 
  ArrowDown,
  AlertTriangle,
  Target,
  Zap,
  Crown,
  Rocket,
  Bot
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export function ConversionFunnel() {
  const [selectedService, setSelectedService] = useState<string>('')
  const { data: funnelData, isLoading } = useConversionFunnel(selectedService)

  const serviceOptions = [
    { value: '', label: '全部服务' },
    { value: 'boost', label: '活动推广', icon: Zap },
    { value: 'pin_plus', label: '置顶加强', icon: Crown },
    { value: 'fast_pass', label: '快速通道', icon: Rocket },
    { value: 'ai_services', label: 'AI服务', icon: Bot },
  ]

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!funnelData) return null

  const getStageColor = (conversionRate: number) => {
    if (conversionRate >= 0.7) return 'bg-green-500'
    if (conversionRate >= 0.5) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getDropoffSeverity = (dropoffRate: number) => {
    if (dropoffRate >= 0.5) return 'high'
    if (dropoffRate >= 0.3) return 'medium'
    return 'low'
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* 转化漏斗主视图 */}
      <Card className="md:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              转化漏斗分析
            </CardTitle>
            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="选择服务类型" />
              </SelectTrigger>
              <SelectContent>
                {serviceOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      {option.icon && <option.icon className="h-4 w-4" />}
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* 总体转化率 */}
            <div className="text-center p-6 bg-muted/50 rounded-lg">
              <div className="text-3xl font-bold text-primary">
                {(funnelData.overallConversionRate * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">
                总转化率 ({funnelData.finalConversions.toLocaleString()} / {funnelData.totalUsers.toLocaleString()})
              </div>
            </div>

            {/* 漏斗阶段 */}
            <div className="space-y-4">
              {funnelData.stages.map((stage, index) => {
                const isLast = index === funnelData.stages.length - 1
                const prevStage = index > 0 ? funnelData.stages[index - 1] : null
                const userLoss = prevStage ? prevStage.users - stage.users : 0
                
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{stage.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {stage.users.toLocaleString()} 用户
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={stage.conversionRate >= 0.7 ? 'default' : stage.conversionRate >= 0.5 ? 'secondary' : 'destructive'}
                          className="mb-1"
                        >
                          {(stage.conversionRate * 100).toFixed(1)}% 转化
                        </Badge>
                        {stage.dropoffRate > 0 && (
                          <div className="text-xs text-red-500">
                            -{(stage.dropoffRate * 100).toFixed(1)}% 流失
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* 进度条 */}
                    <div className="relative">
                      <Progress 
                        value={(stage.users / funnelData.totalUsers) * 100} 
                        className="h-3"
                      />
                      <div 
                        className={cn(
                          "absolute top-0 right-0 h-3 rounded-r",
                          getStageColor(stage.conversionRate)
                        )}
                        style={{ width: `${stage.conversionRate * 100}%` }}
                      />
                    </div>
                    
                    {/* 用户流失指示 */}
                    {!isLast && userLoss > 0 && (
                      <div className="flex items-center justify-center py-2">
                        <div className="flex items-center gap-2 text-sm text-red-500">
                          <ArrowDown className="h-4 w-4" />
                          <span>流失 {userLoss.toLocaleString()} 用户</span>
                          <TrendingDown className="h-4 w-4" />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 瓶颈分析 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            转化瓶颈
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {funnelData.bottlenecks.length > 0 ? (
              funnelData.bottlenecks.map((bottleneck, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{bottleneck.stage}</span>
                    <Badge 
                      variant={
                        bottleneck.impact >= 0.3 ? 'destructive' : 
                        bottleneck.impact >= 0.2 ? 'secondary' : 'outline'
                      }
                    >
                      影响 {(bottleneck.impact * 100).toFixed(1)}%
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {bottleneck.issue}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>暂无明显转化瓶颈</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 优化建议 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            优化建议
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {funnelData.stages.map((stage, index) => {
              if (stage.dropoffRate < 0.3) return null
              
              return (
                <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="font-medium text-yellow-800 mb-1">
                    {stage.name}
                  </div>
                  <div className="text-sm text-yellow-700">
                    流失率过高 ({(stage.dropoffRate * 100).toFixed(1)}%)，建议：
                  </div>
                  <ul className="text-xs text-yellow-600 mt-1 ml-4 list-disc">
                    <li>优化用户体验流程</li>
                    <li>简化操作步骤</li>
                    <li>增加引导提示</li>
                    <li>提供更多激励措施</li>
                  </ul>
                </div>
              )
            })}
            
            {funnelData.stages.every(stage => stage.dropoffRate < 0.3) && (
              <div className="text-center py-6 text-muted-foreground">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Target className="h-6 w-6 text-green-600" />
                </div>
                <p className="font-medium">转化表现良好</p>
                <p className="text-sm">各阶段流失率均在合理范围内</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}