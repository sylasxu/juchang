import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { EyeOff, Flag, Trash2, CheckCircle } from 'lucide-react'

interface ModerationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activity?: {
    id: string
    title: string
    status: string
    riskLevel: string
    riskScore: number
  }
  onConfirm: (action: string, reason: string, notes?: string) => Promise<void>
}

const moderationActions = [
  {
    value: 'approve',
    label: '批准发布',
    description: '活动内容正常，批准发布',
    icon: CheckCircle,
    color: 'text-green-600'
  },
  {
    value: 'hide',
    label: '隐藏活动',
    description: '暂时隐藏活动，不在列表中显示',
    icon: EyeOff,
    color: 'text-yellow-600'
  },
  {
    value: 'flag',
    label: '标记风险',
    description: '标记为风险活动，增加风险评分',
    icon: Flag,
    color: 'text-orange-600'
  },
  {
    value: 'remove',
    label: '删除活动',
    description: '违规内容，永久删除活动',
    icon: Trash2,
    color: 'text-red-600'
  }
]

const reasonOptions = {
  approve: [
    '内容正常',
    '信息完整',
    '符合平台规范'
  ],
  hide: [
    '信息不完整',
    '时间已过期',
    '地点信息有误',
    '临时隐藏处理'
  ],
  flag: [
    '内容存疑',
    '用户举报',
    '风险较高',
    '需要进一步审核'
  ],
  remove: [
    '违反社区规范',
    '涉及违法内容',
    '恶意刷屏',
    '虚假信息',
    '其他严重违规'
  ]
}

export function ModerationDialog({ 
  open, 
  onOpenChange, 
  activity, 
  onConfirm 
}: ModerationDialogProps) {
  const [selectedAction, setSelectedAction] = useState('')
  const [selectedReason, setSelectedReason] = useState('')
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirm = async () => {
    if (!selectedAction || !selectedReason) {
      return
    }

    setIsLoading(true)
    try {
      await onConfirm(selectedAction, selectedReason, notes)
      // 重置表单
      setSelectedAction('')
      setSelectedReason('')
      setNotes('')
      onOpenChange(false)
    } catch (error) {
      console.error('审核操作失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const selectedActionData = moderationActions.find(a => a.value === selectedAction)
  const availableReasons = selectedAction ? reasonOptions[selectedAction as keyof typeof reasonOptions] : []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>活动审核</DialogTitle>
          <DialogDescription>
            对活动进行审核操作，请选择合适的操作类型和原因
          </DialogDescription>
        </DialogHeader>

        {activity && (
          <div className="space-y-4">
            {/* 活动信息 */}
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">{activity.title}</h4>
              <div className="flex items-center gap-2">
                <Badge variant={activity.status === 'published' ? 'default' : 'secondary'}>
                  {activity.status === 'published' ? '已发布' : activity.status}
                </Badge>
                <Badge variant={activity.riskLevel === 'high' ? 'destructive' : 'default'}>
                  {activity.riskLevel} 风险 ({activity.riskScore})
                </Badge>
              </div>
            </div>

            {/* 操作选择 */}
            <div className="space-y-2">
              <Label>审核操作</Label>
              <Select value={selectedAction} onValueChange={setSelectedAction}>
                <SelectTrigger>
                  <SelectValue placeholder="选择审核操作" />
                </SelectTrigger>
                <SelectContent>
                  {moderationActions.map((action) => {
                    const Icon = action.icon
                    return (
                      <SelectItem key={action.value} value={action.value}>
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${action.color}`} />
                          <div>
                            <div className="font-medium">{action.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {action.description}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* 原因选择 */}
            {selectedAction && (
              <div className="space-y-2">
                <Label>操作原因</Label>
                <Select value={selectedReason} onValueChange={setSelectedReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择操作原因" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableReasons.map((reason) => (
                      <SelectItem key={reason} value={reason}>
                        {reason}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 备注 */}
            <div className="space-y-2">
              <Label>备注说明（可选）</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="添加详细说明..."
                rows={3}
              />
            </div>

            {/* 操作预览 */}
            {selectedActionData && (
              <div className="p-3 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <selectedActionData.icon className={`h-4 w-4 ${selectedActionData.color}`} />
                  <span className="font-medium">操作预览</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  将对活动「{activity.title}」执行「{selectedActionData.label}」操作
                  {selectedReason && `，原因：${selectedReason}`}
                </p>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!selectedAction || !selectedReason || isLoading}
          >
            {isLoading ? '处理中...' : '确认操作'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}