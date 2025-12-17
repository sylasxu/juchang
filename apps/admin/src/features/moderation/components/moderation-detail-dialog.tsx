import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  User, 
  MapPin, 
  MessageSquare, 
  Flag, 
  Calendar,
  AlertTriangle,
  ExternalLink
} from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useModerationHistory } from '@/hooks/use-moderation'
import type { ModerationQueueItem } from '@/hooks/use-moderation'

interface ModerationDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: ModerationQueueItem
}

export function ModerationDetailDialog({ 
  open, 
  onOpenChange, 
  item 
}: ModerationDetailDialogProps) {
  const { data: history, isLoading: historyLoading } = useModerationHistory(
    item.targetId, 
    item.targetType
  )

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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600'
      case 'high': return 'text-orange-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-600'
    if (score >= 60) return 'text-orange-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-green-600'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getTypeIcon(item.type)}
            审核详情 - {getTypeLabel(item.type)}
          </DialogTitle>
          <DialogDescription>
            查看详细信息和审核历史
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 基本信息 */}
          <div className="space-y-4">
            <h3 className="font-medium">基本信息</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">标题:</span>
                <p className="font-medium">{item.title}</p>
              </div>
              <div>
                <span className="text-muted-foreground">类型:</span>
                <p>{getTypeLabel(item.type)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">优先级:</span>
                <p className={getPriorityColor(item.priority)}>
                  {item.priority.toUpperCase()}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">风险评分:</span>
                <p className={`font-medium ${getRiskScoreColor(item.riskScore)}`}>
                  {item.riskScore}/100
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">状态:</span>
                <Badge variant="outline">{item.status}</Badge>
              </div>
              <div>
                <span className="text-muted-foreground">举报时间:</span>
                <p>{format(new Date(item.reportedAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}</p>
              </div>
            </div>
          </div>

          {/* 描述信息 */}
          {item.description && (
            <div className="space-y-2">
              <h3 className="font-medium">描述</h3>
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                {item.description}
              </p>
            </div>
          )}

          {/* 举报信息 */}
          {(item.reportReason || item.reportedBy) && (
            <div className="space-y-4">
              <h3 className="font-medium">举报信息</h3>
              {item.reportReason && (
                <div>
                  <span className="text-sm text-muted-foreground">举报原因:</span>
                  <p className="text-sm font-medium text-red-600">{item.reportReason}</p>
                </div>
              )}
              {item.reportedBy && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">举报人:</span>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {item.reportedBy.nickname.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{item.reportedBy.nickname}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 分配信息 */}
          {item.assignedTo && (
            <div className="space-y-2">
              <h3 className="font-medium">分配信息</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">当前审核员:</span>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {item.assignedTo.nickname.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{item.assignedTo.nickname}</span>
                </div>
              </div>
            </div>
          )}

          {/* 元数据 */}
          {item.metadata && Object.keys(item.metadata).length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium">附加信息</h3>
              <div className="bg-muted p-3 rounded-md">
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                  {JSON.stringify(item.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}

          <Separator />

          {/* 审核历史 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">审核历史</h3>
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                查看原始内容
              </Button>
            </div>
            
            {historyLoading ? (
              <p className="text-sm text-muted-foreground">加载历史记录...</p>
            ) : history && history.length > 0 ? (
              <div className="space-y-3">
                {history.map((record: any, index: number) => (
                  <div key={index} className="flex gap-3 p-3 bg-muted rounded-md">
                    <div className="flex-shrink-0">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {record.moderator?.nickname?.charAt(0) || 'S'}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">
                          {record.moderator?.nickname || '系统'}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {record.action}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(record.createdAt), 'MM-dd HH:mm', { locale: zhCN })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {record.reason}
                      </p>
                      {record.notes && (
                        <p className="text-xs text-muted-foreground mt-1">
                          备注: {record.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">暂无审核历史</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}