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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useModerationAction, useModerators } from '@/hooks/use-moderation'
import type { ModerationQueueItem, ModerationAction } from '@/hooks/use-moderation'

interface ModerationActionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: ModerationQueueItem
}

export function ModerationActionDialog({ 
  open, 
  onOpenChange, 
  item 
}: ModerationActionDialogProps) {
  const [action, setAction] = useState<ModerationAction['action']>('approve')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [assignTo, setAssignTo] = useState('')
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high'>('medium')

  const moderationAction = useModerationAction()
  const { data: moderators } = useModerators()

  const handleSubmit = () => {
    if (!reason.trim()) {
      return
    }

    const actionData: ModerationAction = {
      action,
      reason: reason.trim(),
      notes: notes.trim() || undefined,
      assignTo: assignTo || undefined,
      severity: action === 'flag' ? severity : undefined,
    }

    moderationAction.mutate(
      { itemId: item.id, action: actionData },
      {
        onSuccess: () => {
          onOpenChange(false)
          // 重置表单
          setAction('approve')
          setReason('')
          setNotes('')
          setAssignTo('')
          setSeverity('medium')
        }
      }
    )
  }

  const getActionLabel = (actionType: string) => {
    const labels = {
      approve: '批准',
      reject: '拒绝',
      escalate: '升级',
      assign: '分配',
      flag: '标记'
    }
    return labels[actionType as keyof typeof labels] || actionType
  }

  const getReasonOptions = (actionType: string) => {
    const reasons = {
      approve: [
        '内容符合平台规范',
        '经核实无违规行为',
        '误报，内容正常',
        '已整改完成'
      ],
      reject: [
        '违反社区准则',
        '包含不当内容',
        '涉嫌欺诈行为',
        '垃圾信息',
        '侵犯他人权益',
        '其他违规行为'
      ],
      escalate: [
        '需要高级审核员处理',
        '涉及法律问题',
        '复杂争议案例',
        '需要技术团队介入'
      ],
      flag: [
        '需要持续监控',
        '存在潜在风险',
        '用户行为异常',
        '内容质量问题'
      ]
    }
    return reasons[actionType as keyof typeof reasons] || []
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>审核操作</DialogTitle>
          <DialogDescription>
            对项目 "{item.title}" 执行审核操作
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 操作类型 */}
          <div className="space-y-2">
            <Label>操作类型</Label>
            <RadioGroup value={action} onValueChange={(value) => setAction(value as any)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="approve" id="approve" />
                <Label htmlFor="approve">批准</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="reject" id="reject" />
                <Label htmlFor="reject">拒绝</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="escalate" id="escalate" />
                <Label htmlFor="escalate">升级处理</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="flag" id="flag" />
                <Label htmlFor="flag">标记监控</Label>
              </div>
              {moderators && moderators.length > 0 && (
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="assign" id="assign" />
                  <Label htmlFor="assign">重新分配</Label>
                </div>
              )}
            </RadioGroup>
          </div>

          {/* 原因选择 */}
          <div className="space-y-2">
            <Label>操作原因 *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="选择原因" />
              </SelectTrigger>
              <SelectContent>
                {getReasonOptions(action).map((reasonOption) => (
                  <SelectItem key={reasonOption} value={reasonOption}>
                    {reasonOption}
                  </SelectItem>
                ))}
                <SelectItem value="custom">自定义原因</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 自定义原因输入 */}
          {reason === 'custom' && (
            <div className="space-y-2">
              <Label>自定义原因 *</Label>
              <Textarea
                placeholder="请输入具体原因..."
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value)
                  setReason(e.target.value) // 将自定义原因作为主要原因
                }}
              />
            </div>
          )}

          {/* 分配给（仅在选择分配时显示） */}
          {action === 'assign' && moderators && (
            <div className="space-y-2">
              <Label>分配给</Label>
              <Select value={assignTo} onValueChange={setAssignTo}>
                <SelectTrigger>
                  <SelectValue placeholder="选择审核员" />
                </SelectTrigger>
                <SelectContent>
                  {moderators.map((moderator) => (
                    <SelectItem key={moderator.id} value={moderator.id}>
                      {moderator.nickname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 严重程度（仅在标记时显示） */}
          {action === 'flag' && (
            <div className="space-y-2">
              <Label>严重程度</Label>
              <RadioGroup value={severity} onValueChange={(value) => setSeverity(value as any)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="low" id="low" />
                  <Label htmlFor="low">低</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="medium" id="medium" />
                  <Label htmlFor="medium">中</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="high" id="high" />
                  <Label htmlFor="high">高</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* 备注 */}
          {reason !== 'custom' && (
            <div className="space-y-2">
              <Label>备注（可选）</Label>
              <Textarea
                placeholder="添加额外说明..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!reason.trim() || moderationAction.isPending}
          >
            {moderationAction.isPending ? '处理中...' : `确认${getActionLabel(action)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}