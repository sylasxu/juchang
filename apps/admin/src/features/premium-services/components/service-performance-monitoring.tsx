import { useState } from 'react'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { useServicePerformance } from '@/hooks/use-premium-services'
import { 
  Activity, 
  TrendingUp, 
  TrendingDown,
  Clock,
  Users,
  DollarSign,
  Zap,
  Crown,
  Rocket,
  Bot,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ServicePerformanceData {
  serviceType: string
  serviceName: string
  metrics: {
    availability: number
    responseTime: number
    errorRate: number
    throughput: number
    activeUsers: number
    revenue: number
    satisfaction: number
  }
  trends: {
    availability: number
    responseTime: number
    errorRate: number
    throughput: number
    activeUsers: number
    revenue: number
  }
  alerts: Array<{
    type: 'warning' | 'error' | 'info'
    message: string
    timestamp: string
  }>
  sla: {
    availability: number
    responseTime: number
    errorRate: number
  }
}

export function ServicePerformanceMonitoring() {
  const [selectedService, setSelectedService] = useState('boost')
  const [timeRange, setTimeRange] = useState('24h')
  
  const { data: performanceData, isLoading } = useServicePerformance(selectedService, timeRange)

  const serviceOptions = [
    { value: 'boost', label: '活动推广', icon: Zap },
    { value: 'pin_plus', label: '置顶加强', icon: Crown },
    { value: 'fast_pass', label: '快速通道', icon: Rocket },
    { value: 'ai_services', label: 'AI服务', icon: Bot },
  ]

  const timeRangeOptions = [
    { value: '1h', label: '最近1小时' },
    { value: '24h', label: '最近24小时' },
    { value: '7d', label: '最近7天' },
    { value: '30d', label: '最近30天' },
  ]

  // Mock data for demonstration
  const mockData: ServicePerformanceData = {
    serviceType: selectedService,
    serviceName: serviceOptions.find(s => s.value === selectedService)?.label || '',
    metrics: {
      availability: 99.8,
      responseTime: 120,
      errorRate: 0.2,
      throughput: 1250,
      activeUsers: 8420,
      revenue: 15680,
      satisfaction: 4.6,
    },
    trends: {
      availability: 0.1,
      responseTime: -5.2,
      errorRate: -0.1,
      throughput: 8.5,
      activeUsers: 12.3,
      revenue: 18.7,
    },
    alerts: [
      {
        type: 'warning',
        message: '响应时间略高于正常水平',
        timestamp: '2024-01-15T10:30:00Z',
      },
      {
        type: 'info',
        message: '用户活跃度显著提升',
        timestamp: '2024-01-15T09:15:00Z',
      },
    ],
    sla: {
      availability: 99.9,
      responseTime: 100,
      errorRate: 0.1,
    },
  }

  const data = performanceData || mockData

  const getMetricStatus = (current: number, sla: number, isLowerBetter = false) => {
    const threshold = isLowerBetter ? sla * 1.2 : sla * 0.95
    if (isLowerBetter) {
      return current <= sla ? 'good' : current <= threshold ? 'warning' : 'error'
    } else {
      return current >= sla ? 'good' : current >= threshold ? 'warning' : 'error'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'error': return 'text-red-600'
      default: return 'text-muted-foreground'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return CheckCircle
      case 'warning': return AlertTriangle
      case 'error': return XCircle
      default: return Activity
    }
  }

  const getTrendIcon = (trend: number) => {
    return trend > 0 ? TrendingUp : TrendingDown
  }

  const getTrendColor = (trend: number, isLowerBetter = false) => {
    const isGood = isLowerBetter ? trend < 0 : trend > 0
    return isGood ? 'text-green-500' : 'text-red-500'
  }

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

  return (
    <div className="space-y-6">
      {/* 服务选择和时间范围 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">服务性能监控</h3>
        <div className="flex items-center gap-2">
          <Select value={selectedService} onValueChange={setSelectedService}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {serviceOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <option.icon className="h-4 w-4" />
                    {option.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
      </div>

      {/* 核心性能指标 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* 可用性 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">可用性</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.metrics.availability.toFixed(2)}%
            </div>
            <div className="flex items-center space-x-1 text-xs">
              {(() => {
                const TrendIcon = getTrendIcon(data.trends.availability)
                return (
                  <>
                    <TrendIcon className={cn("h-3 w-3", getTrendColor(data.trends.availability))} />
                    <span className={getTrendColor(data.trends.availability)}>
                      {data.trends.availability > 0 ? '+' : ''}{data.trends.availability.toFixed(1)}%
                    </span>
                    <span className="text-muted-foreground">vs 上期</span>
                  </>
                )
              })()}
            </div>
            <div className="mt-2">
              <Progress 
                value={data.metrics.availability} 
                className="h-2"
              />
              <div className="text-xs text-muted-foreground mt-1">
                SLA: {data.sla.availability}%
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 响应时间 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">响应时间</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.metrics.responseTime}ms
            </div>
            <div className="flex items-center space-x-1 text-xs">
              {(() => {
                const TrendIcon = getTrendIcon(data.trends.responseTime)
                return (
                  <>
                    <TrendIcon className={cn("h-3 w-3", getTrendColor(data.trends.responseTime, true))} />
                    <span className={getTrendColor(data.trends.responseTime, true)}>
                      {data.trends.responseTime > 0 ? '+' : ''}{data.trends.responseTime.toFixed(1)}%
                    </span>
                    <span className="text-muted-foreground">vs 上期</span>
                  </>
                )
              })()}
            </div>
            <div className="mt-2">
              <div className="text-xs text-muted-foreground">
                SLA: ≤{data.sla.responseTime}ms
              </div>
              <Badge 
                variant={
                  getMetricStatus(data.metrics.responseTime, data.sla.responseTime, true) === 'good' ? 'default' :
                  getMetricStatus(data.metrics.responseTime, data.sla.responseTime, true) === 'warning' ? 'secondary' : 'destructive'
                }
                className="mt-1"
              >
                {getMetricStatus(data.metrics.responseTime, data.sla.responseTime, true) === 'good' ? '正常' :
                 getMetricStatus(data.metrics.responseTime, data.sla.responseTime, true) === 'warning' ? '警告' : '异常'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* 错误率 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">错误率</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.metrics.errorRate.toFixed(2)}%
            </div>
            <div className="flex items-center space-x-1 text-xs">
              {(() => {
                const TrendIcon = getTrendIcon(data.trends.errorRate)
                return (
                  <>
                    <TrendIcon className={cn("h-3 w-3", getTrendColor(data.trends.errorRate, true))} />
                    <span className={getTrendColor(data.trends.errorRate, true)}>
                      {data.trends.errorRate > 0 ? '+' : ''}{data.trends.errorRate.toFixed(2)}%
                    </span>
                    <span className="text-muted-foreground">vs 上期</span>
                  </>
                )
              })()}
            </div>
            <div className="mt-2">
              <div className="text-xs text-muted-foreground">
                SLA: ≤{data.sla.errorRate}%
              </div>
              <Badge 
                variant={
                  getMetricStatus(data.metrics.errorRate, data.sla.errorRate, true) === 'good' ? 'default' :
                  getMetricStatus(data.metrics.errorRate, data.sla.errorRate, true) === 'warning' ? 'secondary' : 'destructive'
                }
                className="mt-1"
              >
                {getMetricStatus(data.metrics.errorRate, data.sla.errorRate, true) === 'good' ? '正常' :
                 getMetricStatus(data.metrics.errorRate, data.sla.errorRate, true) === 'warning' ? '警告' : '异常'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* 吞吐量 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">吞吐量</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.metrics.throughput.toLocaleString()}
            </div>
            <div className="flex items-center space-x-1 text-xs">
              {(() => {
                const TrendIcon = getTrendIcon(data.trends.throughput)
                return (
                  <>
                    <TrendIcon className={cn("h-3 w-3", getTrendColor(data.trends.throughput))} />
                    <span className={getTrendColor(data.trends.throughput)}>
                      {data.trends.throughput > 0 ? '+' : ''}{data.trends.throughput.toFixed(1)}%
                    </span>
                    <span className="text-muted-foreground">vs 上期</span>
                  </>
                )
              })()}
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              请求/小时
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 业务指标 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃用户</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.metrics.activeUsers.toLocaleString()}
            </div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              {(() => {
                const TrendIcon = getTrendIcon(data.trends.activeUsers)
                return (
                  <>
                    <TrendIcon className={cn("h-3 w-3", getTrendColor(data.trends.activeUsers))} />
                    <span className={getTrendColor(data.trends.activeUsers)}>
                      {data.trends.activeUsers > 0 ? '+' : ''}{data.trends.activeUsers.toFixed(1)}%
                    </span>
                    <span>vs 上期</span>
                  </>
                )
              })()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">收入</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ¥{data.metrics.revenue.toLocaleString()}
            </div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              {(() => {
                const TrendIcon = getTrendIcon(data.trends.revenue)
                return (
                  <>
                    <TrendIcon className={cn("h-3 w-3", getTrendColor(data.trends.revenue))} />
                    <span className={getTrendColor(data.trends.revenue)}>
                      {data.trends.revenue > 0 ? '+' : ''}{data.trends.revenue.toFixed(1)}%
                    </span>
                    <span>vs 上期</span>
                  </>
                )
              })()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">用户满意度</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.metrics.satisfaction.toFixed(1)}/5.0
            </div>
            <div className="mt-2">
              <Progress value={(data.metrics.satisfaction / 5) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 告警信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            实时告警
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.alerts.length > 0 ? (
            <div className="space-y-3">
              {data.alerts.map((alert, index) => (
                <div key={index} className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border",
                  alert.type === 'error' ? 'bg-red-50 border-red-200' :
                  alert.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-blue-50 border-blue-200'
                )}>
                  {(() => {
                    const IconComponent = alert.type === 'error' ? XCircle :
                                        alert.type === 'warning' ? AlertTriangle : CheckCircle
                    return (
                      <IconComponent className={cn(
                        "h-5 w-5",
                        alert.type === 'error' ? 'text-red-600' :
                        alert.type === 'warning' ? 'text-yellow-600' :
                        'text-blue-600'
                      )} />
                    )
                  })()}
                  <div className="flex-1">
                    <div className="font-medium">{alert.message}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(alert.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <Badge variant={
                    alert.type === 'error' ? 'destructive' :
                    alert.type === 'warning' ? 'secondary' : 'default'
                  }>
                    {alert.type === 'error' ? '错误' :
                     alert.type === 'warning' ? '警告' : '信息'}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p>系统运行正常，暂无告警</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}