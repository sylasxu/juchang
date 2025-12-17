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
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { Slider } from '@/components/ui/slider'
import { 
  useChatMessages, 
  useModerateMessage, 
  useBatchModerateMessages,
  useCommunicationStats
} from '@/hooks/use-communication-management'
import { 
  MessageSquare, 
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Flag,
  Trash2,
  AlertTriangle,
  User,
  Calendar,
  Activity,
  Shield,
  Image,
  MapPin
} from 'lucide-react'

interface ChatFilters {
  activityId?: string
  senderId?: string
  status?: string
  riskScore?: number
  dateRange?: [string, string]
  page?: number
  limit?: number
}

export function ChatModeration() {
  const [filters, setFilters] = useState<ChatFilters>({
    page: 1,
    limit: 20,
  })
  const [selectedMessages, setSelectedMessages] = useState<string[]>([])
  const [moderationAction, setModerationAction] = useState<'approve' | 'hide' | 'delete' | 'flag'>('approve')
  const [moderationReason, setModerationReason] = useState('')
  const [moderationNotes, setModerationNotes] = useState('')
  
  const { data: messages, isLoading } = useChatMessages(filters)
  const { data: stats } = useCommunicationStats()
  const moderateMessage = useModerateMessage()
  const batchModerate = useBatchModerateMessages()
  
  // Mock data for demonstration
  const mockMessages = [
    {
      id: '1',
      activityId: 'activity_001',
      senderId: 'user_001',
      senderInfo: {
        id: 'user_001',
        nickname: '张三',
        avatarUrl: '/avatars/user1.jpg',
        membershipLevel: 'premium'
      },
      content: '大家好，这个活动什么时候开始？',
      messageType: 'text' as const,
      status: 'normal' as const,
      riskScore: 15,
      flagReasons: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      activityId: 'activity_001',
      senderId: 'user_002',
      senderInfo: {
        id: 'user_002',
        nickname: '李四',
        avatarUrl: '/avatars/user2.jpg',
        membershipLevel: 'basic'
      },
      content: '这里有我的联系方式，加我微信：abc123456',
      messageType: 'text' as const,
      status: 'flagged' as const,
      riskScore: 85,
      flagReasons: ['包含联系方式', '可能的私下交易'],
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '3',
      activityId: 'activity_002',
      senderId: 'user_003',
      senderInfo: {
        id: 'user_003',
        nickname: '王五',
        avatarUrl: '/avatars/user3.jpg',
        membershipLevel: 'basic'
      },
      content: '活动地点在这里',
      messageType: 'location' as const,
      status: 'normal' as const,
      riskScore: 25,
      flagReasons: [],
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      updatedAt: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: '4',
      activityId: 'activity_002',
      senderId: 'user_004',
      senderInfo: {
        id: 'user_004',
        nickname: '赵六',
        avatarUrl: '/avatars/user4.jpg',
        membershipLevel: 'premium'
      },
      content: '垃圾活动，浪费时间！',
      messageType: 'text' as const,
      status: 'flagged' as const,
      riskScore: 75,
      flagReasons: ['负面情绪', '可能影响活动氛围'],
      moderatedBy: 'admin_001',
      moderatedAt: new Date(Date.now() - 1800000).toISOString(),
      createdAt: new Date(Date.now() - 10800000).toISOString(),
      updatedAt: new Date(Date.now() - 1800000).toISOString(),
    }
  ]

  const mockStats = {
    totalMessages: 15678,
    flaggedMessages: 234,
    hiddenMessages: 89,
    deletedMessages: 45,
    averageRiskScore: 32.5,
  }

  const messageList = (messages && Array.isArray(messages)) ? messages : mockMessages
  const communicationStats = stats || mockStats

  const statusOptions = [
    { value: '', label: '全部状态' },
    { value: 'normal', label: '正常' },
    { value: 'flagged', label: '已标记' },
    { value: 'hidden', label: '已隐藏' },
    { value: 'deleted', label: '已删除' },
  ]

  const actionOptions = [
    { value: 'approve', label: '批准', icon: CheckCircle, color: 'text-green-600' },
    { value: 'hide', label: '隐藏', icon: Eye, color: 'text-yellow-600' },
    { value: 'delete', label: '删除', icon: Trash2, color: 'text-red-600' },
    { value: 'flag', label: '标记', icon: Flag, color: 'text-orange-600' },
  ]

  const reasonOptions = [
    '包含不当内容',
    '垃圾信息',
    '包含联系方式',
    '可能的私下交易',
    '负面情绪',
    '违反社区规范',
    '其他原因',
  ]

  const handleFilterChange = (key: keyof ChatFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
  }

  const handleModerateMessage = async (messageId: string, action: 'approve' | 'hide' | 'delete' | 'flag', reason: string, notes?: string) => {
    try {
      await moderateMessage.mutateAsync({
        messageId,
        action,
        reason,
        notes
      })
    } catch (error) {
      console.error('审核消息失败:', error)
    }
  }

  const handleBatchModerate = async () => {
    if (selectedMessages.length === 0 || !moderationReason) return
    
    try {
      await batchModerate.mutateAsync({
        messageIds: selectedMessages,
        action: moderationAction,
        reason: moderationReason
      })
      setSelectedMessages([])
      setModerationReason('')
      setModerationNotes('')
    } catch (error) {
      console.error('批量审核失败:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'normal': return CheckCircle
      case 'flagged': return Flag
      case 'hidden': return Eye
      case 'deleted': return Trash2
      default: return MessageSquare
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'text-green-600'
      case 'flagged': return 'text-orange-600'
      case 'hidden': return 'text-yellow-600'
      case 'deleted': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return MessageSquare
      case 'image': return Image
      case 'location': return MapPin
      default: return MessageSquare
    }
  }

  const getRiskLevel = (score: number) => {
    if (score >= 80) return { label: '高风险', color: 'bg-red-500' }
    if (score >= 60) return { label: '中风险', color: 'bg-orange-500' }
    if (score >= 40) return { label: '低风险', color: 'bg-yellow-500' }
    return { label: '安全', color: 'bg-green-500' }
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
      {/* 聊天审核统计概览 */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总消息数</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{communicationStats.totalMessages?.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              聊天消息总数
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待审核</CardTitle>
            <Flag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{communicationStats.flaggedMessages}</div>
            <p className="text-xs text-muted-foreground">
              标记待审核消息
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已隐藏</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{communicationStats.hiddenMessages}</div>
            <p className="text-xs text-muted-foreground">
              隐藏的消息数
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已删除</CardTitle>
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{communicationStats.deletedMessages}</div>
            <p className="text-xs text-muted-foreground">
              删除的消息数
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均风险</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{communicationStats.averageRiskScore?.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              风险评分平均值
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
              <Label htmlFor="activity-filter">活动ID</Label>
              <Input
                id="activity-filter"
                placeholder="输入活动ID"
                value={filters.activityId || ''}
                onChange={(e) => handleFilterChange('activityId', e.target.value || undefined)}
              />
            </div>

            <div>
              <Label htmlFor="sender-filter">发送者ID</Label>
              <Input
                id="sender-filter"
                placeholder="输入用户ID"
                value={filters.senderId || ''}
                onChange={(e) => handleFilterChange('senderId', e.target.value || undefined)}
              />
            </div>

            <div>
              <Label htmlFor="status-filter">消息状态</Label>
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
              <Label htmlFor="date-filter">日期筛选</Label>
              <Input
                id="date-filter"
                type="date"
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

          <div className="mt-4 space-y-4">
            <div>
              <Label>风险评分范围</Label>
              <div className="mt-2 px-3">
                <Slider
                  value={[filters.riskScore || 0, 100]}
                  onValueChange={([min]) => handleFilterChange('riskScore', min)}
                  max={100}
                  min={0}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground mt-1">
                  <span>{filters.riskScore || 0}</span>
                  <span>100</span>
                </div>
              </div>
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
            {selectedMessages.length > 0 && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm">
                    批量审核 ({selectedMessages.length})
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>批量审核消息</DialogTitle>
                    <DialogDescription>
                      对选中的 {selectedMessages.length} 条消息执行批量审核操作
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="batch-action">审核操作</Label>
                      <Select
                        value={moderationAction}
                        onValueChange={(value: any) => setModerationAction(value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {actionOptions.map((action) => (
                            <SelectItem key={action.value} value={action.value}>
                              <div className={`flex items-center gap-2 ${action.color}`}>
                                <action.icon className="h-4 w-4" />
                                {action.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="batch-reason">审核原因</Label>
                      <Select
                        value={moderationReason}
                        onValueChange={setModerationReason}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择审核原因" />
                        </SelectTrigger>
                        <SelectContent>
                          {reasonOptions.map((reason) => (
                            <SelectItem key={reason} value={reason}>
                              {reason}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="batch-notes">备注说明</Label>
                      <Textarea
                        id="batch-notes"
                        placeholder="输入审核备注（可选）"
                        value={moderationNotes}
                        onChange={(e) => setModerationNotes(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button
                      onClick={handleBatchModerate}
                      disabled={!moderationReason || batchModerate.isPending}
                    >
                      确认批量审核
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 消息列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            聊天消息审核
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedMessages.length === messageList.length}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedMessages(messageList.map(m => m.id))
                      } else {
                        setSelectedMessages([])
                      }
                    }}
                  />
                </TableHead>
                <TableHead>消息内容</TableHead>
                <TableHead>发送者</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>风险评分</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>发送时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messageList.map((message) => {
                const StatusIcon = getStatusIcon(message.status)
                const TypeIcon = getMessageTypeIcon(message.messageType)
                const riskLevel = getRiskLevel(message.riskScore)
                
                return (
                  <TableRow key={message.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedMessages.includes(message.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedMessages([...selectedMessages, message.id])
                          } else {
                            setSelectedMessages(selectedMessages.filter(id => id !== message.id))
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <div className="font-medium truncate">{message.content}</div>
                        {message.flagReasons.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {message.flagReasons.map((reason, index) => (
                              <Badge key={index} variant="destructive" className="text-xs">
                                {reason}
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
                          <div className="font-medium">{message.senderInfo.nickname}</div>
                          <div className="text-sm text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              {message.senderInfo.membershipLevel === 'premium' ? '高级会员' : '普通会员'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <TypeIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm capitalize">{message.messageType}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`${riskLevel.color} text-white border-0`}>
                          {riskLevel.label}
                        </Badge>
                        <span className="text-sm">{message.riskScore}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`flex items-center gap-1 ${getStatusColor(message.status)}`}>
                        <StatusIcon className="h-4 w-4" />
                        <span className="text-sm capitalize">{message.status}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(message.createdAt).toLocaleDateString()}</span>
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
                              <DialogTitle>消息详情</DialogTitle>
                              <DialogDescription>
                                查看消息的详细信息和审核历史
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-medium">消息内容</Label>
                                  <div className="text-sm text-muted-foreground p-2 bg-muted rounded">
                                    {message.content}
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">发送者信息</Label>
                                  <div className="text-sm text-muted-foreground">
                                    {message.senderInfo.nickname} ({message.senderInfo.membershipLevel})
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">风险评分</Label>
                                  <div className="text-sm text-muted-foreground">
                                    {message.riskScore} ({riskLevel.label})
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">消息状态</Label>
                                  <div className="text-sm text-muted-foreground">
                                    {message.status}
                                  </div>
                                </div>
                              </div>
                              
                              {message.flagReasons.length > 0 && (
                                <div>
                                  <Label className="text-sm font-medium">标记原因</Label>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {message.flagReasons.map((reason, index) => (
                                      <Badge key={index} variant="destructive" className="text-xs">
                                        {reason}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {message.moderatedBy && (
                                <div>
                                  <Label className="text-sm font-medium">审核信息</Label>
                                  <div className="text-sm text-muted-foreground">
                                    审核人: {message.moderatedBy}<br />
                                    审核时间: {message.moderatedAt ? new Date(message.moderatedAt).toLocaleString() : ''}
                                  </div>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        {message.status === 'flagged' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleModerateMessage(message.id, 'approve', '内容正常')}
                              disabled={moderateMessage.isPending}
                            >
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleModerateMessage(message.id, 'hide', '内容不当')}
                              disabled={moderateMessage.isPending}
                            >
                              <Eye className="h-4 w-4 text-yellow-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleModerateMessage(message.id, 'delete', '严重违规')}
                              disabled={moderateMessage.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
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