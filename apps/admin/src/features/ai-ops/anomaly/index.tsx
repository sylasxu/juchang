/**
 * Anomaly Detection Page - 异常检测页面
 * 
 * 显示异常用户列表，支持处理操作
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Users, RefreshCw, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { api, unwrap } from '@/lib/eden'
import { toast } from 'sonner'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

// 异常类型配置
const anomalyTypeConfig = {
  bulk_create: {
    label: '批量创建',
    description: '24小时内创建超过10个活动',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
  },
  frequent_cancel: {
    label: '频繁取消',
    description: '7天内取消报名超过5次',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
}

// 严重程度配置
const severityConfig = {
  low: {
    label: '低',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  medium: {
    label: '中',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  high: {
    label: '高',
    color: 'bg-red-100 text-red-800 border-red-200',
  },
}

export function AnomalyDetectionPage() {
  const queryClient = useQueryClient()

  // 获取异常用户列表
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['ai', 'anomaly', 'users'],
    queryFn: () => unwrap(api.ai.anomaly.users.get({ query: { page: 1, limit: 50 } })),
  })

  // 获取统计数据
  const { data: stats } = useQuery({
    queryKey: ['ai', 'anomaly', 'stats'],
    queryFn: () => unwrap(api.ai.anomaly.stats.get()),
  })

  // 处理异常
  const actionMutation = useMutation({
    mutationFn: ({ anomalyId, action }: { anomalyId: string; action: 'handled' | 'ignored' }) =>
      unwrap(api.ai.anomaly.users({ anomalyId }).action.post({ action })),
    onSuccess: (data) => {
      toast.success(data?.msg || '操作成功')
      queryClient.invalidateQueries({ queryKey: ['ai', 'anomaly'] })
    },
    onError: (error: Error) => {
      toast.error(`操作失败: ${error.message}`)
    },
  })

  return (
    <>
      <Header fixed>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          <h1 className="text-lg font-semibold">异常检测</h1>
        </div>
        <div className="ms-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className="flex flex-1 flex-col gap-6">
        {/* 统计卡片 */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">异常总数</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total ?? '-'}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">高风险</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats?.bySeverity?.high ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">批量创建</CardTitle>
              <Users className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.byType?.bulk_create ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">频繁取消</CardTitle>
              <XCircle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.byType?.frequent_cancel ?? 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* 异常列表 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>异常用户列表</CardTitle>
              <CardDescription>实时检测的异常用户行为</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isRefetching && "animate-spin")} />
              刷新
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : error ? (
              <div className="py-8 text-center text-destructive">
                加载失败: {error.message}
              </div>
            ) : !data?.items?.length ? (
              <div className="py-12 text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <p className="text-muted-foreground">暂无异常用户</p>
                <p className="text-sm text-muted-foreground mt-1">
                  系统运行正常，未检测到异常行为
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>用户</TableHead>
                    <TableHead>异常类型</TableHead>
                    <TableHead>严重程度</TableHead>
                    <TableHead>触发次数</TableHead>
                    <TableHead>检测时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((item) => {
                    const typeConfig = anomalyTypeConfig[item.anomalyType as keyof typeof anomalyTypeConfig]
                    const sevConfig = severityConfig[item.severity as keyof typeof severityConfig]
                    
                    return (
                      <TableRow key={item.anomalyId}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.userNickname || '匿名用户'}</p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {item.userId.slice(0, 8)}...
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("gap-1", typeConfig?.color)}>
                            {typeConfig?.label || item.anomalyType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn(sevConfig?.color)}>
                            {sevConfig?.label || item.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{item.count}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {new Date(item.detectedAt).toLocaleString('zh-CN')}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => actionMutation.mutate({ 
                                anomalyId: item.anomalyId, 
                                action: 'handled' 
                              })}
                              disabled={actionMutation.isPending}
                            >
                              {actionMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle className="h-4 w-4 mr-1" />
                              )}
                              已处理
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => actionMutation.mutate({ 
                                anomalyId: item.anomalyId, 
                                action: 'ignored' 
                              })}
                              disabled={actionMutation.isPending}
                            >
                              忽略
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </Main>
    </>
  )
}
