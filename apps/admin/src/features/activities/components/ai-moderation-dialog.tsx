/**
 * AI Moderation Dialog - AI 内容审核对话框
 * 
 * 调用 AI 审核 API 分析活动内容风险
 */
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Brain, AlertTriangle, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { api, unwrap } from '@/lib/eden'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface AIModerationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activity?: {
    id: string
    title: string
    description?: string | null
  }
}

// 风险等级配置
const riskLevelConfig = {
  low: {
    label: '低风险',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
    iconColor: 'text-green-600',
    progressColor: 'bg-green-500',
  },
  medium: {
    label: '中风险',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: AlertCircle,
    iconColor: 'text-yellow-600',
    progressColor: 'bg-yellow-500',
  },
  high: {
    label: '高风险',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: AlertTriangle,
    iconColor: 'text-red-600',
    progressColor: 'bg-red-500',
  },
}

// 建议操作配置
const actionConfig = {
  approve: { label: '建议通过', color: 'text-green-600' },
  review: { label: '建议人工复核', color: 'text-yellow-600' },
  reject: { label: '建议拒绝', color: 'text-red-600' },
}

export function AIModerationDialog({ open, onOpenChange, activity }: AIModerationDialogProps) {
  const [result, setResult] = useState<{
    riskScore: number
    riskLevel: 'low' | 'medium' | 'high'
    reasons: string[]
    suggestedAction: 'approve' | 'review' | 'reject'
  } | null>(null)

  const analyzeMutation = useMutation({
    mutationFn: (activityId: string) => 
      unwrap(api.ai.moderation.analyze.post({ activityId })),
    onSuccess: (data) => {
      setResult(data)
    },
  })

  const handleAnalyze = () => {
    if (activity?.id) {
      analyzeMutation.mutate(activity.id)
    }
  }

  const handleClose = () => {
    setResult(null)
    analyzeMutation.reset()
    onOpenChange(false)
  }

  const levelConfig = result ? riskLevelConfig[result.riskLevel] : null
  const LevelIcon = levelConfig?.icon

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI 内容审核
          </DialogTitle>
          <DialogDescription>
            使用 AI 分析活动内容的风险等级
          </DialogDescription>
        </DialogHeader>

        {activity && (
          <div className="space-y-4">
            {/* 活动信息 */}
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-1">{activity.title}</h4>
              {activity.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {activity.description}
                </p>
              )}
            </div>

            {/* 分析结果 */}
            {result ? (
              <div className="space-y-4">
                {/* 风险评分 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">风险评分</span>
                    <span className="text-2xl font-bold">{result.riskScore}</span>
                  </div>
                  <Progress 
                    value={result.riskScore} 
                    className="h-2"
                  />
                </div>

                {/* 风险等级 */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">风险等级</span>
                  <Badge className={cn("gap-1", levelConfig?.color)}>
                    {LevelIcon && <LevelIcon className="h-3 w-3" />}
                    {levelConfig?.label}
                  </Badge>
                </div>

                {/* 建议操作 */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">建议操作</span>
                  <span className={cn("font-medium", actionConfig[result.suggestedAction].color)}>
                    {actionConfig[result.suggestedAction].label}
                  </span>
                </div>

                {/* 风险原因 */}
                {result.reasons.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium">风险原因</span>
                    <ul className="space-y-1">
                      {result.reasons.map((reason, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <AlertTriangle className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.reasons.length === 0 && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    未检测到风险内容
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center">
                {analyzeMutation.isPending ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">正在分析...</p>
                  </div>
                ) : analyzeMutation.isError ? (
                  <div className="flex flex-col items-center gap-2">
                    <AlertTriangle className="h-8 w-8 text-destructive" />
                    <p className="text-sm text-destructive">
                      分析失败: {analyzeMutation.error?.message || '未知错误'}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Brain className="h-8 w-8 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
                      点击下方按钮开始 AI 分析
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            关闭
          </Button>
          {!result && (
            <Button 
              onClick={handleAnalyze}
              disabled={analyzeMutation.isPending}
            >
              {analyzeMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  分析中...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  开始分析
                </>
              )}
            </Button>
          )}
          {result && (
            <Button onClick={handleAnalyze} variant="outline">
              重新分析
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
