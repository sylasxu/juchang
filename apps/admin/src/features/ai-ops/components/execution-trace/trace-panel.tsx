/**
 * ExecutionTracePanel Component
 * 
 * 执行追踪面板容器。
 * 参考 Requirements R8
 */

import { Clock, Hash, DollarSign, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { TraceTimeline } from './trace-timeline'
import type { ExecutionTrace } from '../../types/trace'

interface ExecutionTracePanelProps {
  /** 执行追踪数据 */
  trace: ExecutionTrace | null
  /** 是否正在流式输出 */
  isStreaming: boolean
  /** 选中的步骤 ID */
  selectedStepId?: string
  /** 步骤点击回调 */
  onStepClick?: (stepId: string) => void
}

export function ExecutionTracePanel({
  trace,
  isStreaming,
  selectedStepId,
  onStepClick,
}: ExecutionTracePanelProps) {
  // 空状态
  if (!trace) {
    return (
      <div className='flex h-full flex-col'>
        <PanelHeader />
        <div className='flex flex-1 items-center justify-center'>
          <p className='text-sm text-muted-foreground'>
            发送消息后查看执行追踪
          </p>
        </div>
      </div>
    )
  }

  // 计算总耗时
  const totalDuration = trace.completedAt
    ? new Date(trace.completedAt).getTime() - new Date(trace.startedAt).getTime()
    : undefined

  return (
    <div className='flex h-full flex-col'>
      {/* Header */}
      <PanelHeader
        requestId={trace.requestId}
        status={trace.status}
        duration={totalDuration}
        cost={trace.totalCost}
        isStreaming={isStreaming}
      />

      {/* Timeline */}
      <ScrollArea className='flex-1'>
        <div className='p-4'>
          <TraceTimeline
            steps={trace.steps}
            selectedStepId={selectedStepId}
            onStepClick={onStepClick}
            startedAt={trace.startedAt}
            isStreaming={isStreaming}
          />
        </div>
      </ScrollArea>
    </div>
  )
}

/** 面板头部 */
function PanelHeader({
  requestId,
  status,
  duration,
  cost,
  isStreaming,
}: {
  requestId?: string
  status?: 'running' | 'completed' | 'error'
  duration?: number
  cost?: number
  isStreaming?: boolean
}) {
  return (
    <div className='flex-shrink-0 border-b px-4 py-3'>
      <div className='flex items-center justify-between'>
        <h3 className='font-semibold'>执行追踪</h3>
        {isStreaming && (
          <div className='flex items-center gap-1.5 text-xs text-primary'>
            <Loader2 className='h-3 w-3 animate-spin' />
            执行中...
          </div>
        )}
      </div>

      {requestId && (
        <div className='mt-2 flex flex-wrap items-center gap-2 text-xs'>
          {/* Request ID */}
          <div className='flex items-center gap-1 text-muted-foreground'>
            <Hash className='h-3 w-3' />
            <code className='font-mono'>{requestId.slice(0, 8)}</code>
          </div>

          {/* 状态 */}
          {status && (
            <Badge
              variant={
                status === 'completed' ? 'default' :
                status === 'error' ? 'destructive' :
                'secondary'
              }
              className='text-xs'
            >
              {status === 'completed' ? '完成' :
               status === 'error' ? '错误' :
               '执行中'}
            </Badge>
          )}

          {/* 总耗时 */}
          {duration !== undefined && (
            <div className='flex items-center gap-1 text-muted-foreground'>
              <Clock className='h-3 w-3' />
              {formatDuration(duration)}
            </div>
          )}

          {/* 成本 */}
          {cost !== undefined && (
            <div className='flex items-center gap-1 text-muted-foreground'>
              <DollarSign className='h-3 w-3' />
              ${cost.toFixed(4)}
            </div>
          )}
        </div>
      )}
    </div>
  )
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

/** 加载骨架 */
export function TracePanelSkeleton() {
  return (
    <div className='flex h-full flex-col'>
      <div className='flex-shrink-0 border-b px-4 py-3'>
        <Skeleton className='h-5 w-24' />
        <div className='mt-2 flex gap-2'>
          <Skeleton className='h-4 w-16' />
          <Skeleton className='h-4 w-12' />
        </div>
      </div>
      <div className='flex-1 p-4 space-y-3'>
        <Skeleton className='h-12 w-full' />
        <Skeleton className='h-12 w-full' />
        <Skeleton className='h-12 w-full' />
      </div>
    </div>
  )
}
