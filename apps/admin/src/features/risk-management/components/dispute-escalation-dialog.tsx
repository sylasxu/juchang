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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { 
  ArrowUp, 
  AlertTriangle,
  Clock,
  Users
} from 'lucide-react'
import type { DisputeRecord } from '@/hooks/use-risk-management'

interface DisputeEscalationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dispute: DisputeRecord
}

export function DisputeEscalationDialog({
  open,
  onOpenChange,
  dispute
}: DisputeEscalationDialogProps) {
  const [escalationType, setEscalationType] = useState<'supervisor' | 'legal' | 'management'>('supervisor')
  const [reason, setReason] = useState('')
  const [urgency, setUrgency] = useState<'normal' | 'urgent' | 'critical'>('normal')
  const [assignTo, setAssignTo] = useState('')
  const [notes, setNotes] = useState('')

  const handleSubmit = () => {
    if (!reason.trim()) {
      return
    }

    // 这里会调用升级处理的API
    console.log('Escalating dispute:', {
      disputeId: dispute.id,
      escalationType,
      reason: reason.trim(),
      urgency,
      assignTo,
      notes: notes.trim()
    })

    onOpenChange(false)
  }

  const getEscalationConfig = (type: string) => {
    const configs = {
      supervisor: {
        label: '上级主管',
        description: '提交给上级主管进行审核处理',
        icon: <Users className="h-4 w-4" />,
        color: 'text-blue-600'
      },
      legal: {
        label: '法务部门',
        description: '涉及法律问题，需要法务部门介入',
        icon: <AlertTriangle className="h-4 w-4" />,
        color: 'text-orange-600'
      },
      management: {
        label: '高级管理层',
        description: '重大争议，需要高级管理层决策',
        icon: <ArrowUp className="h-4 w-4" />,
        color: 'text-red-600'
      }
    }
    return configs[type as keyof typeof configs] || configs.supervisor
  }

  const getReasonTemplates = (type: string) => {
    const templates = {
      supervisor: [
        '争议涉及金额超出处理权限，需要上级审批',
        '争议情况复杂，需要更有经验的主管处理',
        '涉及多方利益冲突，需要上级协调',
        '处理方案存在争议，需要上级决策'
      ],
      legal: [
        '争议涉及合同条款解释，需要法务意见',
        '可能涉及法律责任，需要法务评估',
        '争议方威胁采取法律行动',
        '涉及知识产权或隐私问题'
      ],
      management: [
        '争议可能影响公司声誉，需要高层关注',
        '涉及重要合作伙伴，需要高层协调',
        '争议金额巨大，需要高层决策',
        '可能引发媒体关注，需要高层处理'
      ]
    }
    return templates[type as keyof typeof templates] || []
  }

  const escalationConfig = getEscalationConfig(escalationType)
  const reasonTemplates = getReasonTemplates(escalationType)

  const urgencyConfig = {
    normal: { label: '正常', color: 'text-green-600' },
    urgent: { label: '紧急', color: 'text-orange-600' },
    critical: { label: '严重', color: 'text-red-600' }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUp className="h-5 w-5" />
            升级争议 #{dispute.id.slice(0, 8)}
          </DialogTitle>
          <DialogDescription>
            将争议升级到更高级别进行处理
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 升级类型选择 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">升级到 *</Label>
            <RadioGroup 
              value={escalationType} 
              onValueChange={(value) => {
                setEscalationType(value as any)
                setReason('') // 清空之前的原因
              }}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="supervisor" id="supervisor" />
                <Label htmlFor="supervisor" className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <div>
                    <div className="font-medium">上级主管</div>
                    <div className="text-xs text-muted-foreground">提交给上级主管进行审核处理</div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="legal" id="legal" />
                <Label htmlFor="legal" className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <div>
                    <div className="font-medium">法务部门</div>
                    <div className="text-xs text-muted-foreground">涉及法律问题，需要法务部门介入</div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="management" id="management" />
                <Label htmlFor="management" className="flex items-center gap-2">
                  <ArrowUp className="h-4 w-4 text-red-600" />
                  <div>
                    <div className="font-medium">高级管理层</div>
                    <div className="text-xs text-muted-foreground">重大争议，需要高级管理层决策</div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* 紧急程度 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">紧急程度 *</Label>
            <RadioGroup value={urgency} onValueChange={(value) => setUrgency(value as any)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="normal" id="normal" />
                <Label htmlFor="normal" className="text-green-600">正常 - 按常规流程处理</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="urgent" id="urgent" />
                <Label htmlFor="urgent" className="text-orange-600">紧急 - 需要优先处理</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="critical" id="critical" />
                <Label htmlFor="critical" className="text-red-600">严重 - 需要立即处理</Label>
              </div>
            </RadioGroup>
          </div>

          {/* 升级原因模板 */}
          {reasonTemplates.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">常用原因</Label>
              <Select onValueChange={setReason}>
                <SelectTrigger>
                  <SelectValue placeholder="选择升级原因模板" />
                </SelectTrigger>
                <SelectContent>
                  {reasonTemplates.map((template, index) => (
                    <SelectItem key={index} value={template}>
                      {template}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 升级原因 */}
          <div className="space-y-3">
            <Label className={`text-sm font-medium flex items-center gap-2 ${escalationConfig.color}`}>
              {escalationConfig.icon}
              升级原因 *
            </Label>
            <Textarea
              placeholder={`请详细说明需要升级到${escalationConfig.label}的原因...`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* 指定处理人 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">指定处理人</Label>
            <Select value={assignTo} onValueChange={setAssignTo}>
              <SelectTrigger>
                <SelectValue placeholder="选择具体的处理人（可选）" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="supervisor-1">张主管 - 客服部门</SelectItem>
                <SelectItem value="supervisor-2">李主管 - 运营部门</SelectItem>
                <SelectItem value="legal-1">王律师 - 法务部门</SelectItem>
                <SelectItem value="legal-2">赵律师 - 法务部门</SelectItem>
                <SelectItem value="manager-1">陈总监 - 高级管理层</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 补充说明 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">补充说明</Label>
            <Textarea
              placeholder="添加其他需要说明的情况或建议的处理方向..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>

          {/* 升级提醒 */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-yellow-800">升级提醒</div>
                <div className="text-yellow-700 mt-1">
                  升级后的争议将由{escalationConfig.label}接手处理，当前处理权限将被转移。
                  请确保已充分调查并记录相关信息。
                </div>
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
            disabled={!reason.trim()}
            className={escalationConfig.color}
          >
            <div className="flex items-center gap-2">
              {escalationConfig.icon}
              确认升级
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}