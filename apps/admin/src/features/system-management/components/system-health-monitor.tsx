import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useSystemHealth } from '@/hooks/use-system-management'
import { 
  Activity, 
  Server, 
  Database, 
  Zap, 
  HardDrive,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Cpu,
  MemoryStick,
  Wifi
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SystemHealthData, SystemService } from '@/types/api'

export function SystemHealthMonitor() {
  const { data: health, isLoading, refetch } = useSystemHealth()

  // Mock data for demonstration
  const mockHealth = {
    overall: 'healthy' as const,
    services: {
      api: {
        status: 'healthy' as const,
        responseTime: 120,
        errorRate: 0.2,
        uptime: 2592000, // 30 days in seconds
        lastCheck: new Date().toISOString(),
        message: ''
      },
      database: {
        status: 'healthy' as const,
        responseTime: 45,
        errorRate: 0.1,
        uptime: 2592000,
        lastCheck: new Date().toISOString(),
        message: ''
      },
      redis: {
        status: 'warning' as const,
        responseTime: 200,
        errorRate: 0.5,
        uptime: 2500000,
        lastCheck: new Date().toISOString(),
        message: '响应时间略高'
      },
      storage: {
        status: 'healthy' as const,
        responseTime: 80,
        errorRate: 0.0,
        uptime: 2592000,
        lastCheck: new Date().toISOString(),
        message: ''
      },
      payment: {
        status: 'healthy' as const,
        responseTime: 150,
        errorRate: 0.3,
        uptime: 2580000,
        lastCheck: new Date().toISOString(),
        message: ''
      }
    },
    metrics: {
      cpu: 45.2,
      memory: 68.5,
      disk: 72.1,
      network: 35.8
    },
    uptime: 2592000,
    lastCheck: new Date().toISOString()
  }

  const healthData = (health && Object.keys(health).length > 0) ? health : mockHealth
  
  // 类型保护：确保 metrics 存在
  const metrics = healthData.metrics || {
    cpu: 0,
    memory: 0,
    disk: 0,
    network: 0,
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'critical': return 'text-red-600'
      case 'down': return 'text-gray-600'
      default: return 'text-muted-foreground'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return CheckCircle
      case 'warning': return AlertTriangle
      case 'critical': 
      case 'down': return XCircle
      default: return Activity
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy': return 'default'
      case 'warning': return 'secondary'
      case 'critical': 
      case 'down': return 'destructive'
      default: return 'outline'
    }
  }

  const formatUptime = (uptime: number) => {
    const days = Math.floor(uptime / (24 * 60 * 60))
    const hours = Math.floor((uptime % (24 * 60 * 60)) / (60 * 60))
    const minutes = Math.floor((uptime % (60 * 60)) / 60)
    
    if (days > 0) {
      return `${days}天 ${hours}小时`
    } else if (hours > 0) {
      return `${hours}小时 ${minutes}分钟`
    } else {
      return `${minutes}分钟`
    }
  }

  const serviceIcons = {
    api: Server,
    database: Database,
    redis: Zap,
    storage: HardDrive,
    payment: CreditCard,
  }

  const serviceNames = {
    api: 'API服务',
    database: '数据库',
    redis: 'Redis缓存',
    storage: '文件存储',
    payment: '支付服务',
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 8 }).map((_, i) => (
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
      {/* 系统总体状态 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              系统总体状态
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              刷新
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              {(() => {
                const StatusIcon = getStatusIcon(healthData.overall)
                return (
                  <StatusIcon className={cn("h-16 w-16 mx-auto mb-4", getStatusColor(healthData.overall))} />
                )
              })()}
              <div className="text-3xl font-bold mb-2">
                <Badge variant={getStatusBadge(healthData.overall)} className="text-lg px-4 py-2">
                  {healthData.overall === 'healthy' ? '系统正常' :
                   healthData.overall === 'warning' ? '系统警告' : '系统异常'}
                </Badge>
              </div>
              <div className="text-muted-foreground">
                系统运行时间: {formatUptime(healthData.uptime)}
              </div>
              <div className="text-sm text-muted-foreground">
                最后检查: {new Date(healthData.lastCheck).toLocaleString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 各服务状态 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(healthData.services || {}).map(([serviceKey, serviceData]) => {
          // 类型保护：确保 service 对象有必要的属性
          const service: SystemService = serviceData || {
            status: 'offline' as const,
            responseTime: 0,
            errorRate: 0,
            uptime: 0,
            lastCheck: new Date().toISOString(),
            message: ''
          }
          
          const IconComponent = serviceIcons[serviceKey as keyof typeof serviceIcons]
          const serviceName = serviceNames[serviceKey as keyof typeof serviceNames]
          const StatusIcon = getStatusIcon(service.status)
          
          return (
            <Card key={serviceKey}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <IconComponent className="h-4 w-4" />
                  {serviceName}
                </CardTitle>
                <StatusIcon className={cn("h-4 w-4", getStatusColor(service.status))} />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Badge variant={getStatusBadge(service.status)}>
                    {service.status === 'healthy' ? '正常' :
                     service.status === 'warning' ? '警告' :
                     service.status === 'critical' ? '严重' : '离线'}
                  </Badge>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-muted-foreground">响应时间</div>
                      <div className="font-medium">{service.responseTime}ms</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">错误率</div>
                      <div className="font-medium">{service.errorRate.toFixed(2)}%</div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">
                      运行时间: {formatUptime(service.uptime)}
                    </div>
                    <Progress 
                      value={Math.min((service.uptime / (30 * 24 * 60 * 60)) * 100, 100)} 
                      className="h-2" 
                    />
                  </div>
                  
                  {service.message && (
                    <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
                      {service.message}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 系统资源使用情况 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU使用率</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.cpu.toFixed(1)}%</div>
            <Progress value={metrics.cpu} className="mt-2 h-2" />
            <div className="text-xs text-muted-foreground mt-1">
              {metrics.cpu > 80 ? '使用率较高' : 
               metrics.cpu > 60 ? '使用率正常' : '使用率较低'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">内存使用率</CardTitle>
            <MemoryStick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.memory.toFixed(1)}%</div>
            <Progress value={metrics.memory} className="mt-2 h-2" />
            <div className="text-xs text-muted-foreground mt-1">
              {metrics.memory > 85 ? '使用率较高' : 
               metrics.memory > 70 ? '使用率正常' : '使用率较低'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">磁盘使用率</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.disk.toFixed(1)}%</div>
            <Progress value={metrics.disk} className="mt-2 h-2" />
            <div className="text-xs text-muted-foreground mt-1">
              {metrics.disk > 90 ? '空间不足' : 
               metrics.disk > 75 ? '空间充足' : '空间充裕'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">网络流量</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.network.toFixed(1)}%</div>
            <Progress value={metrics.network} className="mt-2 h-2" />
            <div className="text-xs text-muted-foreground mt-1">
              {metrics.network > 80 ? '流量较高' : 
               metrics.network > 50 ? '流量正常' : '流量较低'}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}