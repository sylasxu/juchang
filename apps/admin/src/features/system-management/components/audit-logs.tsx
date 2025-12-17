import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuditLogs } from '@/hooks/use-system-management'
import { 
  FileText, 
  Filter,
  Eye,
  Download,
  Calendar,
  User,
  Activity,
  Shield,
  Settings,
  Users,
  CreditCard
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AuditLogFilters {
  action?: string
  resource?: string
  userId?: string
  dateRange?: [string, string]
  page?: number
  limit?: number
}

export function AuditLogs() {
  const [filters, setFilters] = useState<AuditLogFilters>({
    page: 1,
    limit: 20,
  })
  
  const { data: logs, isLoading } = useAuditLogs(filters)
  
  // Mock data for demonstration
  const mockLogs = [
    {
      id: '1',
      action: 'user.create',
      resource: 'users',
      resourceId: 'user_123',
      userId: 'admin_001',
      userInfo: {
        id: 'admin_001',
        nickname: '系统管理员',
        role: 'admin'
      },
      details: {
        operation: '创建用户',
        changes: {
          nickname: '新用户',
          phoneNumber: '138****1234',
          status: 'active'
        }
      },
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      timestamp: new Date().toISOString(),
    },
    {
      id: '2',
      action: 'activity.moderate',
      resource: 'activities',
      resourceId: 'activity_456',
      userId: 'admin_002',
      userInfo: {
        id: 'admin_002',
        nickname: '内容审核员',
        role: 'moderator'
      },
      details: {
        operation: '审核活动',
        changes: {
          status: 'approved',
          reason: '内容符合规范'
        }
      },
      ipAddress: '192.168.1.101',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '3',
      action: 'system.config.update',
      resource: 'system_config',
      resourceId: 'config_789',
      userId: 'admin_001',
      userInfo: {
        id: 'admin_001',
        nickname: '系统管理员',
        role: 'admin'
      },
      details: {
        operation: '更新系统配置',
        changes: {
          key: 'max_activity_participants',
          oldValue: 50,
          newValue: 100
        }
      },
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
    }
  ]

  const logsData = (logs && Array.isArray(logs)) ? logs : mockLogs

  const actionTypes = [
    { value: '', label: '全部操作' },
    { value: 'user.create', label: '创建用户' },
    { value: 'user.update', label: '更新用户' },
    { value: 'user.delete', label: '删除用户' },
    { value: 'activity.create', label: '创建活动' },
    { value: 'activity.moderate', label: '审核活动' },
    { value: 'transaction.process', label: '处理交易' },
    { value: 'system.config.update', label: '更新配置' },
  ]

  const resourceTypes = [
    { value: '', label: '全部资源' },
    { value: 'users', label: '用户管理' },
    { value: 'activities', label: '活动管理' },
    { value: 'transactions', label: '交易管理' },
    { value: 'system_config', label: '系统配置' },
  ]

  const getActionIcon = (action: string) => {
    if (action.includes('user')) return Users
    if (action.includes('activity')) return Activity
    if (action.includes('transaction')) return CreditCard
    if (action.includes('system')) return Settings
    return Shield
  }

  const getActionColor = (action: string) => {
    if (action.includes('create')) return 'text-green-600'
    if (action.includes('update')) return 'text-blue-600'
    if (action.includes('delete')) return 'text-red-600'
    if (action.includes('moderate')) return 'text-yellow-600'
    return 'text-gray-600'
  }

  const handleFilterChange = (key: keyof AuditLogFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
  }

  const handleExport = () => {
    // 实现导出功能
    console.log('导出审计日志', filters)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 筛选器 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            筛选条件
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label htmlFor="action-filter">操作类型</Label>
              <Select
                value={filters.action || ''}
                onValueChange={(value) => handleFilterChange('action', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择操作类型" />
                </SelectTrigger>
                <SelectContent>
                  {actionTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="resource-filter">资源类型</Label>
              <Select
                value={filters.resource || ''}
                onValueChange={(value) => handleFilterChange('resource', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择资源类型" />
                </SelectTrigger>
                <SelectContent>
                  {resourceTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="user-filter">操作用户</Label>
              <Input
                id="user-filter"
                placeholder="输入用户ID或昵称"
                value={filters.userId || ''}
                onChange={(e) => handleFilterChange('userId', e.target.value || undefined)}
              />
            </div>

            <div>
              <Label htmlFor="date-filter">日期范围</Label>
              <Input
                id="date-filter"
                type="date"
                placeholder="选择日期"
                onChange={(e) => {
                  if (e.target.value) {
                    const startDate = e.target.value + 'T00:00:00'
                    const endDate = e.target.value + 'T23:59:59'
                    handleFilterChange('dateRange', [startDate, endDate])
                  } else {
                    handleFilterChange('dateRange', undefined)
                  }
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters({ page: 1, limit: 20 })}
            >
              重置筛选
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
            >
              <Download className="h-4 w-4 mr-2" />
              导出日志
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 审计日志表格 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              操作审计日志
            </CardTitle>
            <Badge variant="secondary">
              共 {logsData.length} 条记录
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>操作时间</TableHead>
                <TableHead>操作类型</TableHead>
                <TableHead>操作用户</TableHead>
                <TableHead>资源信息</TableHead>
                <TableHead>IP地址</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logsData.map((log) => {
                const ActionIcon = getActionIcon(log.action)
                
                return (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {new Date(log.timestamp).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ActionIcon className={cn("h-4 w-4", getActionColor(log.action))} />
                        <div>
                          <div className="font-medium">{log.details.operation}</div>
                          <div className="text-sm text-muted-foreground">{log.action}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{log.userInfo.nickname}</div>
                          <div className="text-sm text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              {log.userInfo.role}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{log.resource}</div>
                        {log.resourceId && (
                          <div className="text-sm text-muted-foreground">
                            ID: {log.resourceId}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-mono">{log.ipAddress}</div>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>审计日志详情</DialogTitle>
                            <DialogDescription>
                              查看操作的详细信息和变更内容
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm font-medium">操作时间</Label>
                                <div className="text-sm text-muted-foreground">
                                  {new Date(log.timestamp).toLocaleString()}
                                </div>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">操作类型</Label>
                                <div className="text-sm text-muted-foreground">
                                  {log.action}
                                </div>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">操作用户</Label>
                                <div className="text-sm text-muted-foreground">
                                  {log.userInfo.nickname} ({log.userInfo.role})
                                </div>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">IP地址</Label>
                                <div className="text-sm text-muted-foreground font-mono">
                                  {log.ipAddress}
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <Label className="text-sm font-medium">用户代理</Label>
                              <div className="text-sm text-muted-foreground font-mono break-all">
                                {log.userAgent}
                              </div>
                            </div>
                            
                            <div>
                              <Label className="text-sm font-medium">变更详情</Label>
                              <div className="mt-2 p-3 bg-muted rounded-lg">
                                <pre className="text-sm whitespace-pre-wrap">
                                  {JSON.stringify(log.details.changes, null, 2)}
                                </pre>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}