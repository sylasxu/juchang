import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  ArrowUp, 
  Flag,
  Clock,
  User,
  MessageSquare,
  MapPin,
  Bell
} from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useModerationAction, useModerators } from '@/hooks/use-moderation'
import type { ModerationQueueItem, ModerationAction } from '@/hooks/use-moderation'

interface ModerationDecisionPanelProps {
  item: ModerationQueueItem
  onDecisionComplete?: () => void
}

export function ModerationDecisionPanel({ 
  item, 
  onDecisionComplete 
}: ModerationDecisionPanelProps) {
  const [selectedAction, setSelectedAction] = useState<ModerationAction['action']>('approve')
  const [selectedReason, setSelectedReason] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [notes, setNotes] = useState('')
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high'>('medium')
  const [assignTo, setAssignTo] = useState('')
  const [notifyUser, setNotifyUser] = useState(true)
  const [escalateToSupervisor, setEscalateToSupervisor] = useState(false)

  const moderationAction = useModerationAction()
  const { data: moderators } = useModerators()

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'user': return <User className="h-5 w-5" />
      case 'activity': return <MapPin className="h-5 w-5" />
      case 'message': return <MessageSquare className="h-5 w-5" />
      case 'report': return <Flag className="h-5 w-5" />
      default: return <AlertTriangle className="h-5 w-5" />
    }
  }

  const getActionConfig = (action: string) => {
    const configs = {
      approve: {
        label: '批准',
        icon: <CheckCircle className="h-4 w-4" />,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      },
      reject: {
        label: '拒绝',
        icon: <XCircle className="h-4 w-4" />,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      },
      escalate: {
        label: '升级处理',
        icon: <ArrowUp className="h-4 w-4" />,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200'
      },
      flag: {
        label: '标记监控',
        icon: <Flag className="h-4 w-4" />,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200'
      }
    }
    return configs[action as keyof typeof configs] || configs.approve
  }

  const getReasonOptions = (action: string) => {
    const reasonSets = {
      approve: [
        { value: 'compliant', label: '内容符合平台规范', required: false },
        { value: 'verified_safe', label: '经核实无违规行为', required: false },
        { value: 'false_report', label: '误报，内容正常', required: false },
        { value: 'corrected', label: '用户已整改完成', required: false },
        { value: 'minor_issue', label: '轻微问题，可接受', required: false }
      ],
      reject: [
        { value: 'community_violation', label: '违反社区准则', required: true },
        { value: 'inappropriate_content', label: '包含不当内容', required: true },
        { value: 'fraud_suspected', label: '涉嫌欺诈行为', required: true },
        { value: 'spam', label: '垃圾信息', required: true },
        { value: 'rights_violation', label: '侵犯他人权益', required: true },
        { value: 'illegal_content', label: '违法违规内容', required: true },
        { value: 'harassment', label: '骚扰或恶意行为', required: true }
      ],
      escalate: [
        { value: 'complex_case', label: '复杂案例需高级审核', required: true },
        { value: 'legal_concern', label: '涉及法律问题', required: true },
        { value: 'policy_unclear', label: '政策不明确需确认', required: false },
        { value: 'technical_issue', label: '需要技术团队介入', required: false },
        { value: 'repeat_offender', label: '重复违规用户', required: true }
      ],
      flag: [
        { value: 'monitor_required', label: '需要持续监控', required: false },
        { value: 'potential_risk', label: '存在潜在风险', required: false },
        { value: 'behavior_pattern', label: '用户行为异常', required: false },
        { value: 'quality_concern', label: '内容质量问题', required: false },
        { value: 'borderline_case', label: '边界案例', required: false }
      ]
    }
    return reasonSets[action as keyof typeof reasonSets] || []
  }

  const handleSubmitDecision = () => {
    const finalReason = selectedReason === 'custom' ? customReason : selectedReason
    
    if (!finalReason.trim()) {
      return
    }

    const actionData: ModerationAction = {
      action: selectedAction,
      reason: finalReason.trim(),
      notes: notes.trim() || undefined,
      assignTo: assignTo || undefined,
      severity: selectedAction === 'flag' ? severity : undefined,
    }

    moderationAction.mutate(
      { itemId: item.id, action: actionData },
      {
        onSuccess: () => {
          onDecisionComplete?.()
        }
      }
    )
  }

  const isFormValid = () => {
    const finalReason = selectedReason === 'custom' ? customReason : selectedReason
    return finalReason.trim().length > 0
  }

  const actionConfig = getActionConfig(selectedAction)
  const reasonOptions = getReasonOptions(selectedAction)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 左侧：内容详情 */}
      <div className="lg:col-span-2 space-y-6">
        {/* 内容信息卡片 */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {getTypeIcon(item.type)}
                <div>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <CardDescription>
                    {item.type} • 风险评分: {item.riskScore}/100 • 
                    {format(new Date(item.reportedAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                  </CardDescription>
                </div>
              </div>
              <Badge variant={item.priority === 'urgent' ? 'destructive' : 'secondary'}>
                {item.priority.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {item.description && (
              <div>
                <Label className="text-sm font-medium">内容描述</Label>
                <p className="text-sm text-muted-foreground mt-1 p-3 bg-muted rounded-md">
                  {item.description}
                </p>
              </div>
            )}

            {item.reportReason && (
              <div>
                <Label className="text-sm font-medium text-red-600">举报原因</Label>
                <p className="text-sm text-red-600 mt-1 p-3 bg-red-50 rounded-md border border-red-200">
                  {item.reportReason}
                </p>
              </div>
            )}

            {item.reportedBy && (
              <div>
                <Label className="text-sm font-medium">举报人</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {item.reportedBy.nickname.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{item.reportedBy.nickname}</span>
                </div>
              </div>
            )}

            {item.metadata && Object.keys(item.metadata).length > 0 && (
              <div>
                <Label className="text-sm font-medium">附加信息</Label>
                <div className="mt-1 p-3 bg-muted rounded-md">
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                    {JSON.stringify(item.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 右侧：决策面板 */}
      <div className="space-y-6">
        {/* 决策操作卡片 */}
        <Card className={`${actionConfig.bgColor} ${actionConfig.borderColor} border-2`}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${actionConfig.color}`}>
              {actionConfig.icon}
              审核决策
            </CardTitle>
            <CardDescription>
              选择审核操作并填写必要信息
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 操作选择 */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">审核操作 *</Label>
              <RadioGroup 
                value={selectedAction} 
                onValueChange={(value) => {
                  setSelectedAction(value as any)
                  setSelectedReason('')
                  setCustomReason('')
                }}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="approve" id="approve" />
                  <Label htmlFor="approve" className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    批准通过
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="reject" id="reject" />
                  <Label htmlFor="reject" className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    拒绝处理
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="escalate" id="escalate" />
                  <Label htmlFor="escalate" className="flex items-center gap-2">
                    <ArrowUp className="h-4 w-4 text-orange-600" />
                    升级处理
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="flag" id="flag" />
                  <Label htmlFor="flag" className="flex items-center gap-2">
                    <Flag className="h-4 w-4 text-yellow-600" />
                    标记监控
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Separator />

            {/* 原因选择 */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                操作原因 * 
                {reasonOptions.some(r => r.required) && (
                  <span className="text-red-500 ml-1">(必填)</span>
                )}
              </Label>
              <Select value={selectedReason} onValueChange={setSelectedReason}>
                <SelectTrigger>
                  <SelectValue placeholder="选择原因" />
                </SelectTrigger>
                <SelectContent>
                  {reasonOptions.map((reason) => (
                    <SelectItem key={reason.value} value={reason.label}>
                      <div className="flex items-center gap-2">
                        {reason.required && <span className="text-red-500">*</span>}
                        {reason.label}
                      </div>
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">自定义原因</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 自定义原因 */}
            {selectedReason === 'custom' && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">自定义原因 *</Label>
                <Textarea
                  placeholder="请详细说明原因..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  rows={3}
                />
              </div>
            )}

            {/* 严重程度（仅标记时显示） */}
            {selectedAction === 'flag' && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">严重程度</Label>
                <RadioGroup value={severity} onValueChange={(value) => setSeverity(value as any)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="low" id="low" />
                    <Label htmlFor="low">低风险</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="medium" id="medium" />
                    <Label htmlFor="medium">中风险</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="high" id="high" />
                    <Label htmlFor="high">高风险</Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* 分配审核员（仅升级时显示） */}
            {selectedAction === 'escalate' && moderators && moderators.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">分配给高级审核员</Label>
                <Select value={assignTo} onValueChange={setAssignTo}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择审核员" />
                  </SelectTrigger>
                  <SelectContent>
                    {moderators
                      .filter(m => m.level === 'senior' || m.level === 'supervisor')
                      .map((moderator) => (
                      <SelectItem key={moderator.id} value={moderator.id}>
                        {moderator.nickname} ({moderator.level})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 备注 */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">备注说明</Label>
              <Textarea
                placeholder="添加额外说明或处理建议..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            <Separator />

            {/* 后续操作选项 */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">后续操作</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="notify-user"
                    checked={notifyUser}
                    onCheckedChange={(checked) => setNotifyUser(checked as boolean)}
                  />
                  <Label htmlFor="notify-user" className="text-sm flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    通知相关用户
                  </Label>
                </div>
                {selectedAction === 'reject' && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="escalate-supervisor"
                      checked={escalateToSupervisor}
                      onCheckedChange={(checked) => setEscalateToSupervisor(checked as boolean)}
                    />
                    <Label htmlFor="escalate-supervisor" className="text-sm">
                      同时通知主管审核员
                    </Label>
                  </div>
                )}
              </div>
            </div>

            {/* 提交按钮 */}
            <div className="pt-4">
              <Button
                onClick={handleSubmitDecision}
                disabled={!isFormValid() || moderationAction.isPending}
                className="w-full"
                size="lg"
              >
                {moderationAction.isPending ? (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 animate-spin" />
                    处理中...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {actionConfig.icon}
                    确认{actionConfig.label}
                  </div>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 快速操作卡片 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">快速操作</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                setSelectedAction('approve')
                setSelectedReason('内容符合平台规范')
              }}
            >
              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
              快速批准
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                setSelectedAction('reject')
                setSelectedReason('违反社区准则')
              }}
            >
              <XCircle className="h-4 w-4 mr-2 text-red-600" />
              快速拒绝
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}