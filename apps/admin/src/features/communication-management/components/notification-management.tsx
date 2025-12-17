import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  useNotifications, 
  useCreateNotification, 
  useSendNotification 
} from '@/hooks/use-communication-management'
import { 
  Bell, 
  Plus,
  Send,
  Eye,
  Edit,
  Calendar,
  Users,
  Target,
  BarChart3,
  AlertTriangle,
  Megaphone,
  Gift
} from 'lucide-react'

interface NotificationFormData {
  title: string
  content: string
  type: 'system' | 'announcement' | 'promotion' | 'warning'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  targetAudience: 'all' | 'premium' | 'region' | 'custom'
  targetCriteria?: {
    regions?: string[]
    membershipLevels?: string[]
    userIds?: string[]
    activityTypes?: string[]
  }
  scheduledAt?: string
}

export function NotificationManagement() {
  const { data: notifications, isLoading } = useNotifications()
  const createNotification = useCreateNotification()
  const sendNotification = useSendNotification()
  

  const [formData, setFormData] = useState<NotificationFormData>({
    title: '',
    content: '',
    type: 'system',
    priority: 'medium',
    targetAudience: 'all',
  })

  // Mock data for demonstration
  const mockNotifications = [
    {
      id: '1',
      title: '系统维护通知',
      content: '系统将于今晚23:00-01:00进行维护升级，期间可能影响部分功能使用。',
      type: 'system' as const,
      priority: 'high' as const,
      targetAudience: 'all' as const,
      status: 'sent' as const,
      stats: {
        totalSent: 15678,
        delivered: 15234,
        opened: 12456,
        clicked: 3456,
      },
      createdBy: 'admin_001',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sentAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '2',
      title: '新功能上线公告',
      content: '聚场平台新增AI智能推荐功能，为您推荐更精准的活动和伙伴！',
      type: 'announcement' as const,
      priority: 'medium' as const,
      targetAudience: 'premium' as const,
      status: 'scheduled' as const,
      stats: {
        totalSent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
      },
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      createdBy: 'admin_002',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      updatedAt: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: '3',
      title: '限时优惠活动',
      content: '高级会员限时7折优惠，更多精彩功能等你体验！',
      type: 'promotion' as const,
      priority: 'medium' as const,
      targetAudience: 'all' as const,
      status: 'draft' as const,
      stats: {
        totalSent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
      },
      createdBy: 'admin_001',
      createdAt: new Date(Date.now() - 10800000).toISOString(),
      updatedAt: new Date(Date.now() - 10800000).toISOString(),
    }
  ]

  const notificationList = (notifications && Array.isArray(notifications)) ? notifications : mockNotifications

  const typeOptions = [
    { value: 'system', label: '系统通知', icon: AlertTriangle, color: 'bg-blue-500' },
    { value: 'announcement', label: '公告通知', icon: Megaphone, color: 'bg-green-500' },
    { value: 'promotion', label: '推广通知', icon: Gift, color: 'bg-purple-500' },
    { value: 'warning', label: '警告通知', icon: AlertTriangle, color: 'bg-red-500' },
  ]

  const priorityOptions = [
    { value: 'low', label: '低优先级', color: 'text-gray-600' },
    { value: 'medium', label: '中优先级', color: 'text-blue-600' },
    { value: 'high', label: '高优先级', color: 'text-orange-600' },
    { value: 'urgent', label: '紧急', color: 'text-red-600' },
  ]

  const audienceOptions = [
    { value: 'all', label: '全部用户', icon: Users },
    { value: 'premium', label: '高级会员', icon: Target },
    { value: 'region', label: '指定地区', icon: Target },
    { value: 'custom', label: '自定义', icon: Target },
  ]

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      type: 'system',
      priority: 'medium',
      targetAudience: 'all',
    })
  }

  const handleCreate = () => {
    resetForm()
  }

  const handleSave = async () => {
    try {
      await createNotification.mutateAsync({
        ...formData,
        status: 'draft',
        createdBy: 'current-admin',
      })
      resetForm()
    } catch (error) {
      console.error('创建通知失败:', error)
    }
  }

  const handleSend = async (id: string) => {
    try {
      await sendNotification.mutateAsync(id)
    } catch (error) {
      console.error('发送通知失败:', error)
    }
  }

  const getTypeInfo = (type: string) => {
    return typeOptions.find(t => t.value === type) || typeOptions[0]
  }

  const getPriorityInfo = (priority: string) => {
    return priorityOptions.find(p => p.value === priority) || priorityOptions[1]
  }

  const getAudienceInfo = (audience: string) => {
    return audienceOptions.find(a => a.value === audience) || audienceOptions[0]
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'text-gray-600'
      case 'scheduled': return 'text-blue-600'
      case 'sent': return 'text-green-600'
      case 'cancelled': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return '草稿'
      case 'scheduled': return '已安排'
      case 'sent': return '已发送'
      case 'cancelled': return '已取消'
      default: return '未知'
    }
  }

  const getDeliveryRate = (stats: any) => {
    if (stats.totalSent === 0) return 0
    return ((stats.delivered / stats.totalSent) * 100).toFixed(1)
  }

  const getOpenRate = (stats: any) => {
    if (stats.delivered === 0) return 0
    return ((stats.opened / stats.delivered) * 100).toFixed(1)
  }

  const getClickRate = (stats: any) => {
    if (stats.opened === 0) return 0
    return ((stats.clicked / stats.opened) * 100).toFixed(1)
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
              {Array.from({ length: 6 }).map((_, i) => (
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
      {/* 通知统计概览 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总通知数</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notificationList.length}</div>
            <p className="text-xs text-muted-foreground">
              创建的通知总数
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已发送</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notificationList.filter(n => n.status === 'sent').length}
            </div>
            <p className="text-xs text-muted-foreground">
              成功发送的通知
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待发送</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notificationList.filter(n => n.status === 'scheduled').length}
            </div>
            <p className="text-xs text-muted-foreground">
              计划发送的通知
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均打开率</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notificationList.filter(n => n.status === 'sent').length > 0 
                ? (notificationList
                    .filter(n => n.status === 'sent')
                    .reduce((sum, n) => sum + Number(getOpenRate(n.stats)), 0) / 
                    notificationList.filter(n => n.status === 'sent').length)
                    .toFixed(1)
                : '0'}%
            </div>
            <p className="text-xs text-muted-foreground">
              通知打开率平均值
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 通知管理 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              通知消息管理
            </CardTitle>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" onClick={handleCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  创建通知
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>创建通知消息</DialogTitle>
                  <DialogDescription>
                    创建新的通知消息并设置发送目标
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="title" className="text-right">
                      通知标题
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="输入通知标题"
                      className="col-span-3"
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="content" className="text-right">
                      通知内容
                    </Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="输入通知内容"
                      className="col-span-3"
                      rows={4}
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="type" className="text-right">
                      通知类型
                    </Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {typeOptions.map((type) => (
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
                    <Label htmlFor="priority" className="text-right">
                      优先级
                    </Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorityOptions.map((priority) => (
                          <SelectItem key={priority.value} value={priority.value}>
                            <span className={priority.color}>{priority.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="audience" className="text-right">
                      目标受众
                    </Label>
                    <Select
                      value={formData.targetAudience}
                      onValueChange={(value: any) => setFormData({ ...formData, targetAudience: value })}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {audienceOptions.map((audience) => (
                          <SelectItem key={audience.value} value={audience.value}>
                            <div className="flex items-center gap-2">
                              <audience.icon className="h-4 w-4" />
                              {audience.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="scheduled-at" className="text-right">
                      定时发送
                    </Label>
                    <Input
                      id="scheduled-at"
                      type="datetime-local"
                      value={formData.scheduledAt || ''}
                      onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value || undefined })}
                      className="col-span-3"
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button
                    type="submit"
                    onClick={handleSave}
                    disabled={!formData.title || !formData.content || createNotification.isPending}
                  >
                    创建通知
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
                <TableHead>通知信息</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>优先级</TableHead>
                <TableHead>目标受众</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>发送统计</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notificationList.map((notification) => {
                const typeInfo = getTypeInfo(notification.type)
                const priorityInfo = getPriorityInfo(notification.priority)
                const audienceInfo = getAudienceInfo(notification.targetAudience)
                const TypeIcon = typeInfo.icon
                const AudienceIcon = audienceInfo.icon
                
                return (
                  <TableRow key={notification.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{notification.title}</div>
                        <div className="text-sm text-muted-foreground line-clamp-2">
                          {notification.content}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${typeInfo.color} text-white border-0`}>
                        <TypeIcon className="h-3 w-3 mr-1" />
                        {typeInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`text-sm font-medium ${priorityInfo.color}`}>
                        {priorityInfo.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <AudienceIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{audienceInfo.label}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(notification.status)}>
                        {getStatusLabel(notification.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {notification.status === 'sent' ? (
                        <div className="text-sm space-y-1">
                          <div>发送: {notification.stats.totalSent.toLocaleString()}</div>
                          <div>送达: {getDeliveryRate(notification.stats)}%</div>
                          <div>打开: {getOpenRate(notification.stats)}%</div>
                          <div>点击: {getClickRate(notification.stats)}%</div>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">未发送</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(notification.createdAt).toLocaleDateString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>通知详情</DialogTitle>
                              <DialogDescription>
                                查看通知的详细信息和发送统计
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-4">
                              <div>
                                <Label className="text-sm font-medium">通知标题</Label>
                                <div className="text-sm text-muted-foreground">
                                  {notification.title}
                                </div>
                              </div>
                              
                              <div>
                                <Label className="text-sm font-medium">通知内容</Label>
                                <div className="text-sm text-muted-foreground p-2 bg-muted rounded">
                                  {notification.content}
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-medium">通知类型</Label>
                                  <div className="text-sm text-muted-foreground">
                                    {typeInfo.label}
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">优先级</Label>
                                  <div className="text-sm text-muted-foreground">
                                    {priorityInfo.label}
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">目标受众</Label>
                                  <div className="text-sm text-muted-foreground">
                                    {audienceInfo.label}
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">状态</Label>
                                  <div className="text-sm text-muted-foreground">
                                    {getStatusLabel(notification.status)}
                                  </div>
                                </div>
                              </div>
                              
                              {notification.status === 'sent' && (
                                <div>
                                  <Label className="text-sm font-medium">发送统计</Label>
                                  <div className="grid grid-cols-2 gap-4 mt-2">
                                    <div className="text-sm">
                                      <div>总发送: {notification.stats.totalSent.toLocaleString()}</div>
                                      <div>成功送达: {notification.stats.delivered.toLocaleString()} ({getDeliveryRate(notification.stats)}%)</div>
                                    </div>
                                    <div className="text-sm">
                                      <div>打开数: {notification.stats.opened.toLocaleString()} ({getOpenRate(notification.stats)}%)</div>
                                      <div>点击数: {notification.stats.clicked.toLocaleString()} ({getClickRate(notification.stats)}%)</div>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {notification.scheduledAt && (
                                <div>
                                  <Label className="text-sm font-medium">计划发送时间</Label>
                                  <div className="text-sm text-muted-foreground">
                                    {new Date(notification.scheduledAt).toLocaleString()}
                                  </div>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        {(notification.status === 'draft' || notification.status === 'scheduled') && (
                          <>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSend(notification.id)}
                              disabled={sendNotification.isPending}
                            >
                              <Send className="h-4 w-4 text-blue-600" />
                            </Button>
                          </>
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