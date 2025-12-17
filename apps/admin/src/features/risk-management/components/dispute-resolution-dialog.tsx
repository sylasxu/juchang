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
import { Checkbox } from '@/components/ui/checkbox'
import { 
  CheckCircle, 
  XCircle, 
  ArrowUp,
  Clock
} from 'lucide-react'
import { useResolveDispute } from '@/hooks/use-risk-management'
import type { DisputeRecord } from '@/hooks/use-risk-management'

interface DisputeResolutionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dispute: DisputeRecord
}

export function DisputeResolutionDialog({
  open,
  onOpenChange,
  dispute
}: DisputeResolutionDialogProps) {
  const [resolutionType, setResolutionType] = useState<'resolved' | 'escalated' | 'closed'>('resolved')
  const [resolution, setResolution] = useState('')
  const [notes, setNotes] = useState('')
  const [notifyParties, setNotifyParties] = useState(true)
  const [followUpRequired, setFollowUpRequired] = useState(false)

  const resolveDispute = useResolveDispute()

  const handleSubmit = () => {
    if (!resolution.trim()) {
      return
    }

    resolveDispute.mutate(
      {
        id: dispute.id,
        resolution: {
          status: resolutionType,
          resolution: resolution.trim(),
          notes: notes.trim() || undefined,
        }
      },
      {
        onSuccess: () => {
          onOpenChange(false)
          // 重置表单
          setResolutionType('resolved')
          setResolution('')
          setNotes('')
          setNotifyParties(true)
          setFollowUpRequired(false)
        }
      }
    )
  }

  const getResolutionConfig = (type: string) => {
    const configs = {
      resolved: {
        label: '解决争议',
        icon: <CheckCircle className="h-4 w-4" />,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      },
      escalated: {
        label: '升级处理',
        icon: <ArrowUp className="h-4 w-4" />,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200'
      },
      closed: {
        label: '关闭争议',
        icon: <XCircle className="h-4 w-4" />,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200'
      }
    }
    return configs[type as keyof typeof configs] || configs.resolved
  }

  const getResolutionTemplates = (type: string) => {
    const templates = {
      resolved: [
        '经调查核实，争议已妥善解决，相关问题已处理完毕。',
        '双方已达成一致，争议得到圆满解决。',
        '根据平台规则，已对相关问题进行处理，争议解决。',
        '经协调沟通，争议各方已达成和解协议。'
      ],
      escalated: [
        '争议情况复杂，需要上级部门进一步调查处理。',
        '涉及重要政策问题，已提交给专业团队处理。',
        '争议金额较大，需要更高权限的审批处理。',
        '涉及法律问题，已转交法务部门处理。'
      ],
      closed: [
        '举报内容不实，争议无效，予以关闭。',
        '超出处理时限且无法联系相关方，争议关闭。',
        '重复举报，已在其他争议中处理，关闭此争议。',
        '不符合争议处理条件，争议关闭。'
      ]
    }
    return templates[type as keyof typeof templates] || []
  }

  const resolutionConfig = getResolutionConfig(resolutionType)
  const templates = getResolutionTemplates(resolutionType)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            处理争议 #{dispute.id.slice(0, 8)}
          </DialogTitle>
          <DialogDescription>
            选择处理方式并填写处理结果
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 处理方式选择 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">处理方式 *</Label>
            <RadioGroup 
              value={resolutionType} 
              onValueChange={(value) => {
                setResolutionType(value as any)
                setResolution('') // 清空之前的内容
              }}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="resolved" id="resolved" />
                <Label htmlFor="resolved" className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  解决争议
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="escalated" id="escalated" />
                <Label htmlFor="escalated" className="flex items-center gap-2">
                  <ArrowUp className="h-4 w-4 text-orange-600" />
                  升级处理
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="closed" id="closed" />
                <Label htmlFor="closed" className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-gray-600" />
                  关闭争议
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* 快速模板 */}
          {templates.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">快速模板</Label>
              <Select onValueChange={setResolution}>
                <SelectTrigger>
                  <SelectValue placeholder="选择处理模板" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template, index) => (
                    <SelectItem key={index} value={template}>
                      {template.slice(0, 30)}...
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 处理结果 */}
          <div className={`space-y-3 p-4 rounded-lg border-2 ${resolutionConfig.bgColor} ${resolutionConfig.borderColor}`}>
            <Label className={`text-sm font-medium flex items-center gap-2 ${resolutionConfig.color}`}>
              {resolutionConfig.icon}
              处理结果 *
            </Label>
            <Textarea
              placeholder={`请详细说明${resolutionConfig.label}的具体情况...`}
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* 备注说明 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">备注说明</Label>
            <Textarea
              placeholder="添加额外的处理说明或注意事项..."
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
                  id="notify-parties"
                  checked={notifyParties}
                  onCheckedChange={(checked) => setNotifyParties(checked as boolean)}
                />
                <Label htmlFor="notify-parties" className="text-sm">
                  通知相关当事人处理结果
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="follow-up"
                  checked={followUpRequired}
                  onCheckedChange={(checked) => setFollowUpRequired(checked as boolean)}
                />
                <Label htmlFor="follow-up" className="text-sm">
                  需要后续跟进
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
            disabled={!resolution.trim() || resolveDispute.isPending}
            className={`${resolutionConfig.color}`}
          >
            {resolveDispute.isPending ? (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 animate-spin" />
                处理中...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {resolutionConfig.icon}
                确认{resolutionConfig.label}
              </div>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}