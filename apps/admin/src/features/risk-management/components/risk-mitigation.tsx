import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  AlertTriangle,
  Clock,
  Ban,
  Eye,
  Flag,
  UserX,
  Activity
} from 'lucide-react'
import { useApplyRiskMitigation } from '@/hooks/use-risk-management'

interface RiskMitigationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  targetId: string
  targetType: 'user' | 'activity'
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
}

export function RiskMitigationDialog({
  open,
  onOpenChange,
  targetId,
  targetType,
  riskLevel
}: RiskMitigationDialogProps) {
  const [selectedMeasures, setSelectedMeasures] = useState<string[]>([])
  const [duration, setDuration] = useState<number>(24)
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [notifyTarget, setNotifyTarget] = useState(true)
  const [escalateIfViolated, setEscalateIfViolated] = useState(false)

  const applyMitigation = useApplyRiskMitigation()

  const mitigationMeasures = {
    user: [
      {
        id: 'account_restriction',
        label: '账户限制',
        description: '限制用户的某些功能使用',
        icon: <UserX className="h-4 w-4" />,
        severity: 'medium',
        options: [
          { id: 'limit_activity_creation', label: '限制创建活动' },
          { id: 'limit_messaging', label: '限制发送消息' },
          { id: 'limit_payments', label: '限制支付功能' },
          { id: 'limit_reviews', label: '限制评价功能' }
        ]
      },
      {
        id: 'enhanced_monitoring',
        label: '加强监控',
        description: '对用户行为进行更严密的监控',
        icon: <Eye className="h-4 w-4" />,
        severity: 'low',
        options: [
          { id: 'monitor_activities', label: '监控活动创建' },
          { id: 'monitor_transactions', label: '监控交易行为' },
          { id: 'monitor_communications', label: '监控通信内容' }
        ]
      },
      {
        id: 'verification_required',
        label: '强制验证',
        description: '要求用户完成额外的身份验证',
        icon: <Shield className="h-4 w-4" />,
        severity: 'medium',
        options: [
          { id: 'phone_verification', label: '手机号验证' },
          { id: 'id_verification', label: '身份证验证' },
          { id: 'face_verification', label: '人脸识别验证' }
        ]
      },
      {
        id: 'account_suspension',
        label: '账户暂停',
        description: '暂时冻结用户账户',
        icon: <Ban className="h-4 w-4" />,
        severity: 'high',
        options: [
          { id: 'temporary_suspension', label: '临时暂停' },
          { id: 'permanent_suspension', label: '永久暂停' }
        ]
      }
    ],
    activity: [
      {
        id: 'activity_restriction',
        label: '活动限制',
        description: '对活动进行访问或功能限制',
        icon: <Activity className="h-4 w-4" />,
        severity: 'medium',
        options: [
          { id: 'hide_activity', label: '隐藏活动' },
          { id: 'limit_participants', label: '限制参与人数' },
          { id: 'disable_chat', label: '禁用聊天功能' },
          { id: 'require_approval', label: '需要审批参与' }
        ]
      },
      {
        id: 'content_moderation',
        label: '内容审核',
        description: '对活动内容进行审核和过滤',
        icon: <Flag className="h-4 w-4" />,
        severity: 'low',
        options: [
          { id: 'content_review', label: '内容人工审核' },
          { id: 'auto_filter', label: '自动内容过滤' },
          { id: 'keyword_monitoring', label: '关键词监控' }
        ]
      },
      {
        id: 'activity_suspension',
        label: '活动暂停',
        description: '暂停或取消活动',
        icon: <Ban className="h-4 w-4" />,
        severity: 'high',
        options: [
          { id: 'temporary_pause', label: '临时暂停' },
          { id: 'permanent_cancel', label: '永久取消' }
        ]
      }
    ]
  }

  const availableMeasures = mitigationMeasures[targetType] || []

  const handleMeasureToggle = (measureId: string) => {
    setSelectedMeasures(prev => 
      prev.includes(measureId) 
        ? prev.filter(id => id !== measureId)
        : [...prev, measureId]
    )
  }

  const handleSubmit = () => {
    if (selectedMeasures.length === 0 || !reason.trim()) {
      return
    }

    applyMitigation.mutate(
      {
        targetId,
        targetType,
        measures: selectedMeasures,
        duration,
        reason: reason.trim()
      },
      {
        onSuccess: () => {
          onOpenChange(false)
          // 重置表单
          setSelectedMeasures([])
          setDuration(24)
          setReason('')
          setNotes('')
          setNotifyTarget(true)
          setEscalateIfViolated(false)
        }
      }
    )
  }

  const getRiskLevelConfig = (level: string) => {
    const configs = {
      low: { color: 'text-green-600', bg: 'bg-green-50', label: '低风险' },
      medium: { color: 'text-yellow-600', bg: 'bg-yellow-50', label: '中风险' },
      high: { color: 'text-orange-600', bg: 'bg-orange-50', label: '高风险' },
      critical: { color: 'text-red-600', bg: 'bg-red-50', label: '严重风险' }
    }
    return configs[level as keyof typeof configs] || configs.low
  }

  const riskConfig = getRiskLevelConfig(riskLevel)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            风险缓解措施
          </DialogTitle>
          <DialogDescription>
            为 {targetType === 'user' ? '用户' : '活动'} {targetId.slice(0, 8)} 应用风险缓解措施
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-4">
          {/* 风险等级显示 */}
          <div className={`p-4 rounded-lg ${riskConfig.bg} border`}>
            <div className="flex items-center gap-2">
              <AlertTriangle className={`h-5 w-5 ${riskConfig.color}`} />
              <span className={`font-medium ${riskConfig.color}`}>
                当前风险等级: {riskConfig.label}
              </span>
            </div>
          </div>

          {/* 缓解措施选择 */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">选择缓解措施 *</Label>
            
            <div className="grid gap-4">
              {availableMeasures.map((measure) => {
                const isSelected = selectedMeasures.includes(measure.id)
                const severityColor = {
                  low: 'border-blue-200 bg-blue-50',
                  medium: 'border-yellow-200 bg-yellow-50',
                  high: 'border-red-200 bg-red-50'
                }[measure.severity]

                return (
                  <div
                    key={measure.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-primary bg-primary/5' 
                        : `border-gray-200 hover:${severityColor}`
                    }`}
                    onClick={() => handleMeasureToggle(measure.id)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={isSelected}
                        onChange={() => handleMeasureToggle(measure.id)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {measure.icon}
                          <span className="font-medium">{measure.label}</span>
                          <Badge variant="outline" className={
                            measure.severity === 'high' ? 'text-red-600' :
                            measure.severity === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                          }>
                            {measure.severity === 'high' ? '高影响' :
                             measure.severity === 'medium' ? '中影响' : '低影响'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {measure.description}
                        </p>
                        
                        {/* 具体选项 */}
                        {isSelected && measure.options && (
                          <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                            <Label className="text-sm font-medium">具体措施:</Label>
                            {measure.options.map((option) => (
                              <div key={option.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={option.id}
                                  checked={selectedMeasures.includes(option.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedMeasures(prev => [...prev, option.id])
                                    } else {
                                      setSelectedMeasures(prev => prev.filter(id => id !== option.id))
                                    }
                                  }}
                                />
                                <Label htmlFor={option.id} className="text-sm">
                                  {option.label}
                                </Label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 持续时间 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">持续时间 *</Label>
            <div className="flex items-center gap-4">
              <Input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                min={1}
                max={8760}
                className="w-32"
              />
              <Select
                value="hours"
                onValueChange={(value) => {
                  if (value === 'days') setDuration(duration * 24)
                  if (value === 'hours' && duration > 24) setDuration(Math.floor(duration / 24))
                }}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hours">小时</SelectItem>
                  <SelectItem value="days">天</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-sm text-muted-foreground">
                {duration < 24 ? `${duration} 小时` : `${Math.floor(duration / 24)} 天`}
              </div>
            </div>
          </div>

          {/* 应用原因 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">应用原因 *</Label>
            <Textarea
              placeholder="请详细说明应用这些缓解措施的原因..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* 补充说明 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">补充说明</Label>
            <Textarea
              placeholder="添加其他需要说明的情况或特殊要求..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>

          {/* 后续操作 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">后续操作</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notify-target"
                  checked={notifyTarget}
                  onCheckedChange={(checked) => setNotifyTarget(checked as boolean)}
                />
                <Label htmlFor="notify-target" className="text-sm">
                  通知目标对象缓解措施的应用
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="escalate-violation"
                  checked={escalateIfViolated}
                  onCheckedChange={(checked) => setEscalateIfViolated(checked as boolean)}
                />
                <Label htmlFor="escalate-violation" className="text-sm">
                  如果违反缓解措施，自动升级处理
                </Label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selectedMeasures.length === 0 || !reason.trim() || applyMitigation.isPending}
          >
            {applyMitigation.isPending ? (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 animate-spin" />
                应用中...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                应用缓解措施
              </div>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}