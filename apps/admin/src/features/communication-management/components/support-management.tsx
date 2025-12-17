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
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  useSupportRequests, 
  useUpdateSupportRequest, 
  useRespondToSupport 
} from '@/hooks/use-communication-management'
import { 
  HeadphonesIcon, 
  Filter,
  Eye,
  MessageSquare,
  User,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Bug,
  Lightbulb,
  CreditCard,
  HelpCircle,
  UserCheck,
  Send
} from 'lucide-react'

interface SupportFilters {
  category?: string
  status?: string
  priority?: string
  assignedTo?: string
  dateRange?: [string, string]
  page?: number
  limit?: number
}

export function SupportManagement() {
  const [filters, setFilters] = useState<SupportFilters>({
    page: 1,
    limit: 20,
  })
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [responseContent, setResponseContent] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  
  const { data: requests, isLoading } = useSupportRequests(filters)
  const updateRequest = useUpdateSupportRequest()
  const respondToSupport = useRespondToSupport()
  
  // Mock data for demonstration
  const mockRequests = [
    {
      id: '1',
      userId: 'user_001',
      userInfo: {
        id: 'user_001',
        nickname: '张三',
        phoneNumber: '138****1234',
        membershipLevel: 'premium'
      },
      category: 'bug_report' as const,
      priority: 'high' as const,
      status: 'open' as const,
      subject: '活动创建失败',
      description: '在创建新活动时，点击提交按钮后页面一直加载，无法成功创建活动。',
      attachments: ['screenshot1.png'],
      assignedTo: 'support_001',
      assigneeInfo: {
        id: 'support_001',
        nickname: '客服小王',
        role: 'support'
      },
      responses: [
        {
          id: 'resp_1',
          requestId: '1',
          responderId: 'support_001',
          responderInfo: {
            id: 'support_001',
            nickname: '客服小王',
            role: 'support'
          },
          content: '您好，我们已经收到您的反馈，正在调查这个问题。请问您使用的是什么浏览器？',
          isInternal: false,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        }
      ],
      tags: ['UI问题', '紧急'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '2',
      userId: 'user_002',
      userInfo: {
        id: 'user_002',
        nickname: '李四',
        phoneNumber: '139****5678',
        membershipLevel: 'basic'
      },
      category: 'feature_request' as const,
      priority: 'medium' as const,
      status: 'in_progress' as const,
      subject: '希望增加活动评价功能',
      description: '建议在活动结束后增加评价功能，让参与者可以对活动进行评分和评论。',
      responses: [],
      tags: ['功能建议'],
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      updatedAt: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: '3',
      userId: 'user_003',
      userInfo: {
        id: 'user_003',
        nickname: '王五',
        phoneNumber: '137****9012',
        membershipLevel: 'basic'
      },
      category: 'payment_issue' as const,
      priority: 'urgent' as const,
      status: 'resolved' as const,
      subject: '会员续费失败',
      description: '尝试续费高级会员时支付失败，但是钱已经扣了，请帮忙处理。',
      assignedTo: 'support_002',
      assigneeInfo: {
        id: 'support_002',
        nickname: '客服小李',
        role: 'support'
      },
      responses: [
        {
          id: 'resp_2',
          requestId: '3',
          responderId: 'support_002',
          responderInfo: {
            id: 'support_002',
            nickname: '客服小李',
            role: 'support'
          },
          content: '您好，我们已经为您处理了会员续费问题，您的高级会员已经生效。',
          isInternal: false,
          createdAt: new Date(Date.now() - 1800000).toISOString(),
        }
      ],
      tags: ['支付问题', '已解决'],
      createdAt: new Date(Date.now() - 10800000).toISOString(),
      updatedAt: new Date(Date.now() - 1800000).toISOString(),
      resolvedAt: new Date(Date.now() - 1800000).toISOString(),
    }
  ]

  const requestList = (requests && Array.isArray(requests)) ? requests : mockRequests

  const categoryOptions = [
    { value: '', label: '全部类别' },
    { value: 'bug_report', label: 'Bug报告', icon: Bug, color: 'text-red-600' },
    { value: 'feature_request', label: '功能建议', icon: Lightbulb, color: 'text-blue-600' },
    { value: 'account_issue', label: '账户问题', icon: User, color: 'text-orange-600' },
    { value: 'payment_issue', label: '支付问题', icon: CreditCard, color: 'text-green-600' },
    { value: 'other', label: '其他问题', icon: HelpCircle, color: 'text-gray-600' },
  ]

  const statusOptions = [
    { value: '', label: '全部状态' },
    { value: 'open', label: '待处理', color: 'text-orange-600' },
    { value: 'in_progress', label: '处理中', color: 'text-blue-600' },
    { value: 'resolved', label: '已解决', color: 'text-green-600' },
    { value: 'closed', label: '已关闭', color: 'text-gray-600' },
  ]

  const priorityOptions = [
    { value: '', label: '全部优先级' },
    { value: 'low', label: '低优先级', color: 'text-gray-600' },
    { value: 'medium', label: '中优先级', color: 'text-blue-600' },
    { value: 'high', label: '高优先级', color: 'text-orange-600' },
    { value: 'urgent', label: '紧急', color: 'text-red-600' },
  ]

  const handleFilterChange = (key: keyof SupportFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
  }

  const handleUpdateStatus = async (id: string, status: 'open' | 'in_progress' | 'resolved' | 'closed') => {
    try {
      await updateRequest.mutateAsync({
        id,
        updates: { status }
      })
    } catch (error) {
      console.error('更新状态失败:', error)
    }
  }

  const handleRespond = async () => {
    if (!selectedRequest || !responseContent.trim()) return
    
    try {
      await respondToSupport.mutateAsync({
        requestId: selectedRequest.id,
        content: responseContent,
        isInternal,
      })
      setResponseContent('')
      setIsInternal(false)
      setSelectedRequest(null)
    } catch (error) {
      console.error('回复失败:', error)
    }
  }

  const getCategoryInfo = (category: string) => {
    return categoryOptions.find(c => c.value === category) || categoryOptions[0]
  }

  const getStatusInfo = (status: string) => {
    return statusOptions.find(s => s.value === status) || statusOptions[0]
  }

  const getPriorityInfo = (priority: string) => {
    return priorityOptions.find(p => p.value === priority) || priorityOptions[0]
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return AlertCircle
      case 'in_progress': return Clock
      case 'resolved': return CheckCircle
      case 'closed': return XCircle
      default: return HelpCircle
    }
  }

  // 统计数据
  const totalRequests = requestList.length
  const openRequests = requestList.filter(r => r.status === 'open').length
  const inProgressRequests = requestList.filter(r => r.status === 'in_progress').length
  const resolvedRequests = requestList.filter(r => r.status === 'resolved').length

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
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
      {/* 支持统计概览 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总请求数</CardTitle>
            <HeadphonesIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRequests}</div>
            <p className="text-xs text-muted-foreground">
              支持请求总数
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待处理</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openRequests}</div>
            <p className="text-xs text-muted-foreground">
              等待处理的请求
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">处理中</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressRequests}</div>
            <p className="text-xs text-muted-foreground">
              正在处理的请求
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已解决</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resolvedRequests}</div>
            <p className="text-xs text-muted-foreground">
              已解决的请求
            </p>
          </CardContent>
        </Card>
      </div>

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
              <Label htmlFor="category-filter">问题类别</Label>
              <Select
                value={filters.category || ''}
                onValueChange={(value) => handleFilterChange('category', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择类别" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status-filter">处理状态</Label>
              <Select
                value={filters.status || ''}
                onValueChange={(value) => handleFilterChange('status', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority-filter">优先级</Label>
              <Select
                value={filters.priority || ''}
                onValueChange={(value) => handleFilterChange('priority', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择优先级" />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="assignee-filter">负责人</Label>
              <Input
                id="assignee-filter"
                placeholder="输入负责人ID"
                value={filters.assignedTo || ''}
                onChange={(e) => handleFilterChange('assignedTo', e.target.value || undefined)}
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
          </div>
        </CardContent>
      </Card>

      {/* 支持请求列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HeadphonesIcon className="h-5 w-5" />
            支持请求管理
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>请求信息</TableHead>
                <TableHead>用户</TableHead>
                <TableHead>类别</TableHead>
                <TableHead>优先级</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>负责人</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requestList.map((request) => {
                const categoryInfo = getCategoryInfo(request.category)
                const statusInfo = getStatusInfo(request.status)
                const priorityInfo = getPriorityInfo(request.priority)
                const StatusIcon = getStatusIcon(request.status)
                const CategoryIcon = categoryInfo.icon || HelpCircle
                
                return (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{request.subject}</div>
                        <div className="text-sm text-muted-foreground line-clamp-2">
                          {request.description}
                        </div>
                        {request.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {request.tags.map((tag: string, index: number) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{request.userInfo.nickname}</div>
                          <div className="text-sm text-muted-foreground">
                            {request.userInfo.phoneNumber}
                          </div>
                          <Badge variant="outline" className="text-xs mt-1">
                            {request.userInfo.membershipLevel === 'premium' ? '高级会员' : '普通会员'}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`flex items-center gap-1 ${categoryInfo.color}`}>
                        <CategoryIcon className="h-4 w-4" />
                        <span className="text-sm">{categoryInfo.label}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`text-sm font-medium ${priorityInfo.color}`}>
                        {priorityInfo.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className={`flex items-center gap-1 ${statusInfo.color}`}>
                        <StatusIcon className="h-4 w-4" />
                        <span className="text-sm">{statusInfo.label}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {request.assigneeInfo ? (
                        <div className="flex items-center gap-1">
                          <UserCheck className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{request.assigneeInfo.nickname}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">未分配</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(request.createdAt).toLocaleDateString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedRequest(request)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>支持请求详情</DialogTitle>
                              <DialogDescription>
                                查看和处理支持请求 #{request.id}
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="grid grid-cols-3 gap-6">
                              {/* 左侧：请求信息 */}
                              <div className="col-span-2 space-y-4">
                                <div>
                                  <Label className="text-sm font-medium">请求标题</Label>
                                  <div className="text-sm text-muted-foreground">
                                    {request.subject}
                                  </div>
                                </div>
                                
                                <div>
                                  <Label className="text-sm font-medium">问题描述</Label>
                                  <div className="text-sm text-muted-foreground p-2 bg-muted rounded">
                                    {request.description}
                                  </div>
                                </div>
                                
                                {/* 对话记录 */}
                                <div>
                                  <Label className="text-sm font-medium">对话记录</Label>
                                  <div className="space-y-3 mt-2 max-h-60 overflow-y-auto">
                                    {request.responses.map((response: any) => (
                                      <div key={response.id} className="p-3 bg-muted rounded">
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center gap-2">
                                            <User className="h-4 w-4" />
                                            <span className="text-sm font-medium">
                                              {response.responderInfo.nickname}
                                            </span>
                                            {response.isInternal && (
                                              <Badge variant="secondary" className="text-xs">
                                                内部备注
                                              </Badge>
                                            )}
                                          </div>
                                          <span className="text-xs text-muted-foreground">
                                            {new Date(response.createdAt).toLocaleString()}
                                          </span>
                                        </div>
                                        <div className="text-sm">{response.content}</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                
                                {/* 回复区域 */}
                                <div className="space-y-3">
                                  <Label className="text-sm font-medium">添加回复</Label>
                                  <Textarea
                                    placeholder="输入回复内容..."
                                    value={responseContent}
                                    onChange={(e) => setResponseContent(e.target.value)}
                                    rows={4}
                                  />
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <Switch
                                        id="internal"
                                        checked={isInternal}
                                        onCheckedChange={setIsInternal}
                                      />
                                      <Label htmlFor="internal" className="text-sm">
                                        内部备注
                                      </Label>
                                    </div>
                                    <Button
                                      onClick={handleRespond}
                                      disabled={!responseContent.trim() || respondToSupport.isPending}
                                    >
                                      <Send className="h-4 w-4 mr-2" />
                                      发送回复
                                    </Button>
                                  </div>
                                </div>
                              </div>
                              
                              {/* 右侧：请求详情 */}
                              <div className="space-y-4">
                                <div>
                                  <Label className="text-sm font-medium">用户信息</Label>
                                  <div className="text-sm text-muted-foreground">
                                    {request.userInfo.nickname}<br />
                                    {request.userInfo.phoneNumber}<br />
                                    {request.userInfo.membershipLevel === 'premium' ? '高级会员' : '普通会员'}
                                  </div>
                                </div>
                                
                                <div>
                                  <Label className="text-sm font-medium">问题类别</Label>
                                  <div className="text-sm text-muted-foreground">
                                    {categoryInfo.label}
                                  </div>
                                </div>
                                
                                <div>
                                  <Label className="text-sm font-medium">优先级</Label>
                                  <div className="text-sm text-muted-foreground">
                                    {priorityInfo.label}
                                  </div>
                                </div>
                                
                                <div>
                                  <Label className="text-sm font-medium">当前状态</Label>
                                  <Select
                                    value={request.status}
                                    onValueChange={(value: 'open' | 'in_progress' | 'resolved' | 'closed') => handleUpdateStatus(request.id, value)}
                                  >
                                    <SelectTrigger className="mt-1">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {statusOptions.slice(1).map((status) => (
                                        <SelectItem key={status.value} value={status.value}>
                                          {status.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                <div>
                                  <Label className="text-sm font-medium">负责人</Label>
                                  <div className="text-sm text-muted-foreground">
                                    {request.assigneeInfo?.nickname || '未分配'}
                                  </div>
                                </div>
                                
                                <div>
                                  <Label className="text-sm font-medium">创建时间</Label>
                                  <div className="text-sm text-muted-foreground">
                                    {new Date(request.createdAt).toLocaleString()}
                                  </div>
                                </div>
                                
                                {request.resolvedAt && (
                                  <div>
                                    <Label className="text-sm font-medium">解决时间</Label>
                                    <div className="text-sm text-muted-foreground">
                                      {new Date(request.resolvedAt).toLocaleString()}
                                    </div>
                                  </div>
                                )}
                                
                                {request.tags.length > 0 && (
                                  <div>
                                    <Label className="text-sm font-medium">标签</Label>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {request.tags.map((tag: string, index: number) => (
                                        <Badge key={index} variant="secondary" className="text-xs">
                                          {tag}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>快速回复</DialogTitle>
                              <DialogDescription>
                                对支持请求 #{request.id} 进行快速回复
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-4">
                              <Textarea
                                placeholder="输入回复内容..."
                                value={responseContent}
                                onChange={(e) => setResponseContent(e.target.value)}
                                rows={4}
                              />
                              <div className="flex items-center space-x-2">
                                <Switch
                                  id="quick-internal"
                                  checked={isInternal}
                                  onCheckedChange={setIsInternal}
                                />
                                <Label htmlFor="quick-internal" className="text-sm">
                                  内部备注
                                </Label>
                              </div>
                            </div>
                            
                            <DialogFooter>
                              <Button
                                onClick={() => {
                                  setSelectedRequest(request)
                                  handleRespond()
                                }}
                                disabled={!responseContent.trim() || respondToSupport.isPending}
                              >
                                发送回复
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
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