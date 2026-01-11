/**
 * TraceStep Component
 * 
 * 单个执行步骤的卡片组件。
 * 参考 Requirements R9, R21
 */

import { Loader2, Check, X, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { TraceStep as TraceStepType, StepStatus } from '../../types/trace'
import { STEP_LABELS } from '../../types/trace'

interface TraceStepProps {
  /** 步骤数据 */
  step: TraceStepType
  /** 是否展开 */
  isExpanded: boolean
  /** 切换展开状态 */
  onToggle: () => void
  /** 是否选中 */
  isSelected?: boolean
  /** 相对于请求开始的时间偏移 (毫秒) */
  timeOffset?: number
  /** 子内容 (展开时显示) */
  children?: React.ReactNode
}

export function TraceStep({
  step,
  isExpanded,
  onToggle,
  isSelected,
  timeOffset = 0,
  children,
}: TraceStepProps) {
  return (
    <div
      className={cn(
        'relative rounded-lg border bg-card transition-colors',
        isSelected && 'ring-2 ring-primary',
        step.status === 'error' && 'border-destructive/50',
        step.status === 'running' && 'border-primary/50',
      )}
    >
      {/* Header - 可点击展开/收起 */}
      <button
        onClick={onToggle}
        className='flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors rounded-lg'
      >
        {/* 时间戳 */}
        <span className='w-14 shrink-0 font-mono text-xs text-muted-foreground'>
          {formatTimeOffset(timeOffset)}
        </span>

        {/* 状态指示器 */}
        <StatusIndicator status={step.status} />

        {/* 名称 */}
        <div className='flex items-center gap-2 flex-1 min-w-0'>
          <span className='font-medium text-sm truncate'>
            {step.name || STEP_LABELS[step.type]}
          </span>
        </div>

        {/* 耗时 */}
        {step.duration !== undefined && (
          <Badge variant='secondary' className='shrink-0 font-mono text-xs'>
            {formatDuration(step.duration)}
          </Badge>
        )}
      </button>

      {/* 展开内容 */}
      {isExpanded && children && (
        <div className='border-t px-3 py-3'>
          {children}
        </div>
      )}
    </div>
  )
}

/** 状态指示器 */
function StatusIndicator({ status }: { status: StepStatus }) {
  switch (status) {
    case 'pending':
      return (
        <div className='flex h-5 w-5 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/30'>
          <Clock className='h-3 w-3 text-muted-foreground/50' />
        </div>
      )
    case 'running':
      return (
        <div className='flex h-5 w-5 items-center justify-center'>
          <Loader2 className='h-4 w-4 animate-spin text-primary' />
        </div>
      )
    case 'success':
      return (
        <div className='flex h-5 w-5 items-center justify-center rounded-full bg-green-500/10'>
          <Check className='h-3 w-3 text-green-500' />
        </div>
      )
    case 'error':
      return (
        <div className='flex h-5 w-5 items-center justify-center rounded-full bg-destructive/10'>
          <X className='h-3 w-3 text-destructive' />
        </div>
      )
  }
}

/** 格式化时间偏移 */
function formatTimeOffset(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`
  }
  return `${(ms / 1000).toFixed(1)}s`
}

/** 格式化耗时 */
function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`
  }
  if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`
  }
  return `${(ms / 60000).toFixed(1)}m`
}
