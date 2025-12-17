import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  AlertTriangle, 
  Clock, 
  User, 
  MessageSquare, 
  MapPin, 
  Flag,
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  ArrowUp
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useModerationQueue, useModerationAction, useBulkModerationAction } from '@/hooks/use-moderation'
import { ModerationActionDialog } from './moderation-action-dialog'
import { ModerationDetailDialog } from './moderation-detail-dialog'
import type { ModerationQueueFilters, ModerationQueueItem } from '@/hooks/use-moderation'

interface ModerationQueueProps {
  filters: ModerationQueueFilters
  onFiltersChange: (filters: Partial<ModerationQueueFilters>) => void
}

export function ModerationQueue({ filters, onFiltersChange }: ModerationQueueProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [actionDialogOpen, setActionDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ModerationQueueItem | null>(null)

  const { data: queueData, isLoading, error } = useModerationQueue(filters)
  const moderationAction = useModerationAction()
  const bulkModerationAction = useBulkModerationAction()

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(queueData?.data?.map(item => item.id) || [])
    } else {
      setSelectedItems([])
    }
  }

  const handleSelectItem = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, itemId])
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId))
    }
  }

  const handleViewDetail = (item: ModerationQueueItem) => {
    setSelectedItem(item)
    setDetailDialogOpen(true)
  }

  const handleQuickAction = (item: ModerationQueueItem, action: 'approve' | 'reject') => {
    setSelectedItem(item)
    moderationAction.mutate({
      itemId: item.id,
      action: {
        action,
        reason: action === 'approve' ? '内容符合平台规范' : '内容违反平台规范',
      }
    })
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'user': return <User className="h-4 w-4" />
      case 'activity': return <MapPin className="h-4 w-4" />
      case 'message': return <MessageSquare className="h-4 w-4" />
      case 'report': return <Flag className="h-4 w-4" />
      default: return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getTypeLabel = (type: string) => {
    const labels = {
      user: '用户',
      activity: '活动',
      message: '消息',
      report: '举报'
    }
    return labels[type as keyof typeof labels] || type
  }

  const getPriorityBadge = (priority: string) => {
    const variants = {
      urgent: 'destructive',
      high: 'destructive',
      medium: 'default',
      low: 'secondary'
    } as const

    const labels = {
      urgent: '紧急',
      high: '高',
      medium: '中',
      low: '低'
    }

    return (
      <Badge variant={variants[priority as keyof typeof variants] || 'secondary'}>
        {labels[priority as keyof typeof labels] || priority}
      </Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      in_review: 'default',
      approved: 'default',
      rejected: 'destructive',
      escalated: 'destructive'
    } as const

    const labels = {
      pending: '待审核',
      in_review: '审核中',
      approved: '已批准',
      rejected: '已拒绝',
      escalated: '已升级'
    }

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    )
  }

  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-600'
    if (score >= 60) return 'text-orange-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-green-600'
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-sm text-muted-foreground">加载审核队列失败</p>
      </div>
    )
  }

  if (!queueData?.data?.length) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-sm text-muted-foreground">暂无待审核项目</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 批量操作栏 */}
      {selectedItems.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <span className="text-sm font-medium">
            已选择 {selectedItems.length} 个项目
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                bulkModerationAction.mutate({
                  itemIds: selectedItems,
                  action: {
                    action: 'approve',
                    reason: '批量批准'
                  }
                })
                setSelectedItems([])
              }}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              批量批准
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                bulkModerationAction.mutate({
                  itemIds: selectedItems,
                  action: {
                    action: 'reject',
                    reason: '批量拒绝'
                  }
                })
                setSelectedItems([])
              }}
            >
              <XCircle className="h-4 w-4 mr-2" />
              批量拒绝
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedItems([])}
            >
              取消选择
            </Button>
          </div>
        </div>
      )}

      {/* 队列表格 */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedItems.length === queueData.data.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>内容</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>优先级</TableHead>
              <TableHead>风险评分</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>举报时间</TableHead>
              <TableHead>分配给</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {queueData.data.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedItems.includes(item.id)}
                    onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getTypeIcon(item.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate" title={item.title}>
                        {item.title}
                      </p>
                      {item.description && (
                        <p className="text-sm text-muted-foreground truncate" title={item.description}>
                          {item.description}
                        </p>
                      )}
                      {item.reportReason && (
                        <p className="text-xs text-red-600 truncate">
                          举报原因: {item.reportReason}
                        </p>
                      )}
                      {item.reportedBy && (
                        <p className="text-xs text-muted-foreground">
                          举报人: {item.reportedBy.nickname}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {getTypeLabel(item.type)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {getPriorityBadge(item.priority)}
                </TableCell>
                <TableCell>
                  <span className={`font-medium ${getRiskScoreColor(item.riskScore)}`}>
                    {item.riskScore}
                  </span>
                </TableCell>
                <TableCell>
                  {getStatusBadge(item.status)}
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(item.reportedAt), {
                      addSuffix: true,
                      locale: zhCN,
                    })}
                  </span>
                </TableCell>
                <TableCell>
                  {item.assignedTo ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {item.assignedTo.nickname.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{item.assignedTo.nickname}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">未分配</span>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewDetail(item)}>
                        <Eye className="h-4 w-4 mr-2" />
                        查看详情
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleQuickAction(item, 'approve')}
                        disabled={item.status !== 'pending'}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        快速批准
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleQuickAction(item, 'reject')}
                        disabled={item.status !== 'pending'}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        快速拒绝
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => {
                        setSelectedItem(item)
                        setActionDialogOpen(true)
                      }}>
                        <ArrowUp className="h-4 w-4 mr-2" />
                        更多操作
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 分页 */}
      {queueData.total > (filters.limit || 20) && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            显示 {((filters.page || 1) - 1) * (filters.limit || 20) + 1} - {Math.min((filters.page || 1) * (filters.limit || 20), queueData.total)} 
            ，共 {queueData.total} 个项目
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={(filters.page || 1) <= 1}
              onClick={() => onFiltersChange({ page: (filters.page || 1) - 1 })}
            >
              上一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!queueData.hasMore}
              onClick={() => onFiltersChange({ page: (filters.page || 1) + 1 })}
            >
              下一页
            </Button>
          </div>
        </div>
      )}

      {/* 对话框 */}
      {selectedItem && (
        <>
          <ModerationActionDialog
            open={actionDialogOpen}
            onOpenChange={setActionDialogOpen}
            item={selectedItem}
          />
          <ModerationDetailDialog
            open={detailDialogOpen}
            onOpenChange={setDetailDialogOpen}
            item={selectedItem}
          />
        </>
      )}
    </div>
  )
}