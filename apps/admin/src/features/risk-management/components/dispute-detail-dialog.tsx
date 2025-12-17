import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  User, 
  Calendar, 
  FileText, 
  AlertTriangle,
  Clock,
  CheckCircle,
  ArrowUp
} from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import type { DisputeRecord } from '@/hooks/use-risk-management'

interface DisputeDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dispute: DisputeRecord
}

export function DisputeDetailDialog({
  open,
  onOpenChange,
  dispute
}: DisputeDetailDialogProps) {
  const getStatusConfig = (status: string) => {
    const configs = {
      open: { label: '待处理', variant: 'destructive' as const, icon: AlertTriangle },
      investigating: { label: '调查中', variant: 'secondary' as const, icon: Clock },
      resolved: { label: '已解决', variant: 'default' as const, icon: CheckCircle },
      escalated: { label: '已升级', variant: 'outline' as const, icon: ArrowUp },
      closed: { label: '已关闭', variant: 'secondary' as const, icon: CheckCircle }
    }
    return configs[status as keyof typeof configs] || configs.open
  }

  const getPriorityConfig = (priority: string) => {
    const configs = {
      low: { label: '低', color: 'text-green-600' },
      medium: { label: '中', color: 'text-yellow-600' },
      high: { label: '高', color: 'text-orange-600' },
      urgent: { label: '紧急', color: 'text-red-600' }
    }
    return configs[priority as keyof typeof configs] || configs.low
  }

  const getTypeLabel = (type: string) => {
    const labels = {
      payment: '支付争议',
      activity: '活动争议',
      behavior: '行为争议',
      content: '内容争议'
    }
    return labels[type as keyof typeof labels] || type
  }

  const statusConfig = getStatusConfig(dispute.status)
  const priorityConfig = getPriorityConfig(dispute.priority)
  const StatusIcon = statusConfig.icon

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            争议详情 #{dispute.id.slice(0, 8)}
          </DialogTitle>
          <DialogDescription>
            查看争议的详细信息和处理历史
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* 基本信息 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">基本信息</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">争议类型</div>
                  <div className="text-sm">{getTypeLabel(dispute.type)}</div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">当前状态</div>
                  <Badge variant={statusConfig.variant} className="flex items-center gap-1 w-fit">
                    <StatusIcon className="h-3 w-3" />
                    {statusConfig.label}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">优先级</div>
                  <Badge variant="outline" className={`${priorityConfig.color} w-fit`}>
                    {priorityConfig.label}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">创建时间</div>
                  <div className="text-sm flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(dispute.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* 举报人信息 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">举报人信息</h3>
              
              {dispute.reporterInfo ? (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium">{dispute.reporterInfo.nickname}</div>
                    <div className="text-sm text-muted-foreground">ID: {dispute.reporterInfo.id}</div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">匿名举报</div>
              )}
            </div>

            <Separator />

            {/* 争议描述 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">争议描述</h3>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{dispute.description}</p>
              </div>
            </div>

            {/* 目标信息 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">争议目标</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">目标类型</div>
                  <div className="text-sm">{dispute.targetType}</div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">目标ID</div>
                  <div className="text-sm font-mono">{dispute.targetId}</div>
                </div>
              </div>

              {dispute.targetInfo && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-sm font-medium mb-2">目标详情</div>
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                    {JSON.stringify(dispute.targetInfo, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* 证据材料 */}
            {dispute.evidence && dispute.evidence.length > 0 && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">证据材料</h3>
                  <div className="space-y-2">
                    {dispute.evidence.map((evidence, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="text-sm font-medium mb-1">证据 {index + 1}</div>
                        <div className="text-xs text-muted-foreground">
                          {typeof evidence === 'string' ? evidence : JSON.stringify(evidence)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* 处理信息 */}
            {dispute.assignedTo && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">处理信息</h3>
                  
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-medium">{dispute.assignedTo.nickname}</div>
                      <div className="text-sm text-muted-foreground">处理员</div>
                    </div>
                  </div>

                  {dispute.resolution && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">处理结果</div>
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm">{dispute.resolution}</p>
                        {dispute.resolutionDate && (
                          <div className="text-xs text-muted-foreground mt-2">
                            处理时间: {format(new Date(dispute.resolutionDate), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
          {dispute.status === 'open' && (
            <Button>
              开始处理
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}