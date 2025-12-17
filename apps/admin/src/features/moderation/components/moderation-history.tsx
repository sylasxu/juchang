import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  History, 
  CheckCircle, 
  XCircle, 
  Flag, 
  ArrowUp,
  Clock,
  User
} from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useModerationHistory } from '@/hooks/use-moderation'

interface ModerationHistoryProps {
  targetId: string
  targetType: string
}

export function ModerationHistory({ 
  targetId, 
  targetType 
}: ModerationHistoryProps) {
  const { data: history, isLoading, error } = useModerationHistory(targetId, targetType)

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'approve': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'reject': return <XCircle className="h-4 w-4 text-red-600" />
      case 'escalate': return <ArrowUp className="h-4 w-4 text-orange-600" />
      case 'flag': return <Flag className="h-4 w-4 text-yellow-600" />
      case 'assign': return <User className="h-4 w-4 text-blue-600" />
      default: return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getActionLabel = (action: string) => {
    const labels = {
      approve: '批准',
      reject: '拒绝',
      escalate: '升级',
      flag: '标记',
      assign: '分配',
      create: '创建',
      update: '更新'
    }
    return labels[action as keyof typeof labels] || action
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'approve': return 'bg-green-100 text-green-800'
      case 'reject': return 'bg-red-100 text-red-800'
      case 'escalate': return 'bg-orange-100 text-orange-800'
      case 'flag': return 'bg-yellow-100 text-yellow-800'
      case 'assign': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          审核历史
        </CardTitle>
        <CardDescription>
          该项目的所有审核记录
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-6">
            <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              加载历史记录失败
            </p>
          </div>
        ) : !history || history.length === 0 ? (
          <div className="text-center py-6">
            <History className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              暂无审核历史记录
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {history.map((record: any, index: number) => (
              <div key={index} className="flex gap-3 pb-4 border-b border-border last:border-0">
                <div className="flex-shrink-0">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={record.moderator?.avatarUrl} />
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
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${getActionColor(record.action)}`}
                    >
                      <span className="flex items-center gap-1">
                        {getActionIcon(record.action)}
                        {getActionLabel(record.action)}
                      </span>
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-1">
                    {record.reason}
                  </p>
                  
                  {record.notes && (
                    <p className="text-xs text-muted-foreground mb-1 p-2 bg-muted rounded">
                      备注: {record.notes}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(record.createdAt), 'MM-dd HH:mm', { locale: zhCN })}
                    </span>
                    
                    {record.metadata && (
                      <div className="flex items-center gap-1">
                        {record.metadata.previousStatus && record.metadata.newStatus && (
                          <span className="text-xs text-muted-foreground">
                            {record.metadata.previousStatus} → {record.metadata.newStatus}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* 显示风险评分变化 */}
                  {record.metadata?.previousRiskScore !== undefined && 
                   record.metadata?.newRiskScore !== undefined && 
                   record.metadata.previousRiskScore !== record.metadata.newRiskScore && (
                    <div className="mt-1">
                      <span className="text-xs text-muted-foreground">
                        风险评分: {record.metadata.previousRiskScore} → {record.metadata.newRiskScore}
                      </span>
                    </div>
                  )}
                  
                  {/* 显示分配信息 */}
                  {record.action === 'assign' && record.metadata?.assignedTo && (
                    <div className="mt-1">
                      <span className="text-xs text-muted-foreground">
                        分配给: {record.metadata.assignedTo}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}