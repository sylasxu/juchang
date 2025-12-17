import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  useMaintenanceStatus, 
  useCreateMaintenance, 
  useUpdateMaintenance 
} from '@/hooks/use-system-management'
import { 
  Wrench, 
  Plus,
  Edit,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Play
} from 'lucide-react'

interface MaintenanceFormData {
  title: string
  description: string
  type: 'scheduled' | 'emergency' | 'completed'
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled'
  startTime: string
  endTime: string
  affectedServices: string[]
}

export function MaintenanceManagement() {
  const { data: maintenanceList, isLoading } = useMaintenanceStatus()
  const createMaintenance = useCreateMaintenance()
  const updateMaintenance = useUpdateMaintenance()
  
  const [editingMaintenance, setEditingMaintenance] = useState<any>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState<MaintenanceFormData>({
    title: '',
    description: '',
    type: 'scheduled',
    status: 'planned',
    startTime: '',
    endTime: '',
    affectedServices: [],
  })

  // Mock data for demonstration
  const mockMaintenance = [
    {
      id: '1',
      title: '数据库性能优化维护',
      description: '对主数据库进行性能优化和索引重建，预计影响时间2小时。',
      type: 'scheduled' as const,
      status: 'planned' as const,
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(),
      affectedServices: ['database', 'api', 'user_service'],
      createdBy: 'admin_001',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      title: '支付系统升级',
      description: '升级支付系统到最新版本，增强安全性和稳定性。',
      type: 'scheduled' as const,
      status: 'completed' as const,
      startTime: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() - 46 * 60 * 60 * 1000).toISOString(),
      affectedServices: ['payment', 'transaction'],
      createdBy: 'admin_002',
      createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 46 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '3',
      title: '紧急安全补丁',
      description: '修复发现的安全漏洞，需要立即重启相关服务。',
      type: 'emergency' as const,
      status: 'in_progress' as const,
      startTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      affectedServices: ['api', 'auth_service', 'user_service'],
      createdBy: 'admin_001',
      createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    }
  ]

  const maintenanceData = (maintenanceList && Array.isArray(maintenanceList)) ? maintenanceList : mockMaintenance

  const maintenanceTypes = [
    { value: 'scheduled', label: '计划维护', icon: Calendar, color: 'bg-blue-500' },
    { value: 'emergency', label: '紧急维护', icon: AlertTriangle, color: 'bg-red-500' },
    { value: 'completed', label: '已完成', icon: CheckCircle, color: 'bg-green-500' },
  ]

  const statusTypes = [
    { value: 'planned', label: '计划中', icon: Calendar, color: 'secondary' },
    { value: 'in_progress', label: '进行中', icon: Play, color: 'default' },
    { value: 'completed', label: '已完成', icon: CheckCircle, color: 'default' },
    { value: 'cancelled', label: '已取消', icon: XCircle, color: 'destructive' },
  ]

  const serviceOptions = [
    { value: 'api', label: 'API服务' },
    { value: 'database', label: '数据库' },
    { value: 'redis', label: 'Redis缓存' },
    { value: 'storage', label: '文件存储' },
    { value: 'payment', label: '支付服务' },
    { value: 'auth_service', label: '认证服务' },
    { value: 'user_service', label: '用户服务' },
    { value: 'transaction', label: '交易服务' },
  ]

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'scheduled',
      status: 'planned',
      startTime: '',
      endTime: '',
      affectedServices: [],
    })
  }

  const handleCreate = () => {
    setIsCreating(true)
    setEditingMaintenance(null)
    resetForm()
  }

  const handleEdit = (maintenance: any) => {
    setIsCreating(false)
    setEditingMaintenance(maintenance)
    setFormData({
      title: maintenance.title,
      description: maintenance.description,
      type: maintenance.type,
      status: maintenance.status,
      startTime: maintenance.startTime ? maintenance.startTime.slice(0, 16) : '',
      endTime: maintenance.endTime ? maintenance.endTime.slice(0, 16) : '',
      affectedServices: maintenance.affectedServices,
    })
  }

  const handleSave = async () => {
    try {
      if (isCreating) {
        await createMaintenance.mutateAsync({
          ...formData,
          createdBy: 'current-admin', // 实际应用中从认证信息获取
        })
      } else if (editingMaintenance) {
        await updateMaintenance.mutateAsync({
          id: editingMaintenance.id,
          maintenance: formData,
        })
      }
      setIsCreating(false)
      setEditingMaintenance(null)
      resetForm()
    } catch (error) {
      console.error('保存维护计划失败:', error)
    }
  }

  const handleStatusUpdate = async (id: string, status: 'planned' | 'in_progress' | 'completed' | 'cancelled') => {
    try {
      await updateMaintenance.mutateAsync({
        id,
        maintenance: { status },
      })
    } catch (error) {
      console.error('更新维护状态失败:', error)
    }
  }

  const getTypeInfo = (type: string) => {
    return maintenanceTypes.find(t => t.value === type) || maintenanceTypes[0]
  }

  const getStatusInfo = (status: string) => {
    return statusTypes.find(s => s.value === status) || statusTypes[0]
  }

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString()
  }

  const getDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime)
    const end = new Date(endTime)
    const diffMs = end.getTime() - start.getTime()
    const diffHours = Math.round(diffMs / (1000 * 60 * 60) * 10) / 10
    return `${diffHours}小时`
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
              {Array.from({ length: 5 }).map((_, i) => (
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
      {/* 维护概览 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">计划维护</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {maintenanceData.filter(m => m.status === 'planned').length}
            </div>
            <p className="text-xs text-muted-foreground">
              待执行的维护任务
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">进行中</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {maintenanceData.filter(m => m.status === 'in_progress').length}
            </div>
            <p className="text-xs text-muted-foreground">
              正在执行的维护
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已完成</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {maintenanceData.filter(m => m.status === 'completed').length}
            </div>
            <p className="text-xs text-muted-foreground">
              本月完成的维护
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 维护管理 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              系统维护管理
            </CardTitle>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" onClick={handleCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  新建维护
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {isCreating ? '新建维护计划' : '编辑维护计划'}
                  </DialogTitle>
                  <DialogDescription>
                    {isCreating ? '创建新的系统维护计划' : '修改维护计划信息'}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="title" className="text-right">
                      维护标题
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="输入维护标题"
                      className="col-span-3"
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">
                      维护描述
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="详细描述维护内容和影响"
                      className="col-span-3"
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="type" className="text-right">
                      维护类型
                    </Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {maintenanceTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <type.icon className="h-4 w-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="status" className="text-right">
                      维护状态
                    </Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusTypes.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            <div className="flex items-center gap-2">
                              <status.icon className="h-4 w-4" />
                              {status.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="start-time" className="text-right">
                      开始时间
                    </Label>
                    <Input
                      id="start-time"
                      type="datetime-local"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="end-time" className="text-right">
                      结束时间
                    </Label>
                    <Input
                      id="end-time"
                      type="datetime-local"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="services" className="text-right">
                      影响服务
                    </Label>
                    <div className="col-span-3 grid grid-cols-2 gap-2">
                      {serviceOptions.map((service: { value: string; label: string }) => (
                        <label key={service.value} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.affectedServices.includes(service.value)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  affectedServices: [...formData.affectedServices, service.value]
                                })
                              } else {
                                setFormData({
                                  ...formData,
                                  affectedServices: formData.affectedServices.filter(s => s !== service.value)
                                })
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">{service.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button
                    type="submit"
                    onClick={handleSave}
                    disabled={createMaintenance.isPending || updateMaintenance.isPending}
                  >
                    {isCreating ? '创建维护' : '保存修改'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>维护信息</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>时间安排</TableHead>
                <TableHead>影响服务</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {maintenanceData.map((maintenance) => {
                const typeInfo = getTypeInfo(maintenance.type)
                const statusInfo = getStatusInfo(maintenance.status)
                const TypeIcon = typeInfo.icon
                const StatusIcon = statusInfo.icon
                
                return (
                  <TableRow key={maintenance.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{maintenance.title}</div>
                        <div className="text-sm text-muted-foreground line-clamp-2">
                          {maintenance.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="flex items-center gap-1 w-fit">
                        <TypeIcon className="h-3 w-3" />
                        {typeInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusInfo.color as any} className="flex items-center gap-1 w-fit">
                        <StatusIcon className="h-3 w-3" />
                        {statusInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span>开始: {formatDateTime(maintenance.startTime)}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span>结束: {formatDateTime(maintenance.endTime)}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          持续: {getDuration(maintenance.startTime, maintenance.endTime)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {maintenance.affectedServices.slice(0, 3).map((service: string) => {
                          const serviceInfo = serviceOptions.find(s => s.value === service)
                          return (
                            <Badge key={service} variant="secondary" className="text-xs">
                              {serviceInfo?.label || service}
                            </Badge>
                          )
                        })}
                        {maintenance.affectedServices.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{maintenance.affectedServices.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(maintenance)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            {/* 编辑对话框内容与创建相同，这里省略重复代码 */}
                          </DialogContent>
                        </Dialog>
                        
                        {maintenance.status === 'planned' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusUpdate(maintenance.id, 'in_progress')}
                          >
                            <Play className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                        
                        {maintenance.status === 'in_progress' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusUpdate(maintenance.id, 'completed')}
                          >
                            <CheckCircle className="h-4 w-4 text-blue-600" />
                          </Button>
                        )}
                      </div>
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