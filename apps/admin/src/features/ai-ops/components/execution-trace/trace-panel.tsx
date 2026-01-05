/**
 * ExecutionTracePanel Component
 * 
 * 执行追踪面板容器。
 * 参考 Requirements R8
 */

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
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
  const [requestInfoOpen, setRequestInfoOpen] = useState(false)

  // 空状态
  if (!trace) {
    return (
      <div className='h-full flex flex-col'>
        <div className='flex-shrink-0 border-b px-4 py-3'>
          <h3 className='text-sm font-medium'>执行追踪</h3>
        </div>
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
    <div className='h-full flex flex-col'>
      {/* Header - 固定 */}
      <div className='flex-shrink-0 border-b px-4 py-3'>
        <div className='flex items-center justify-between'>
          <h3 className='text-sm font-medium'>执行追踪</h3>
          {isStreaming && (
            <Badge variant='secondary' className='text-xs'>
              执行中
            </Badge>
          )}
        </div>
      </div>

      {/* 可滚动内容区 */}
      <div className='flex-1 overflow-y-auto p-4 space-y-4'>
        {/* 统计信息 */}
        <div className='grid grid-cols-2 gap-2 text-xs'>
          <div>
            <div className='text-muted-foreground'>Request ID</div>
            <code className='font-mono'>{trace.requestId.slice(0, 8)}</code>
          </div>
          <div>
            <div className='text-muted-foreground'>状态</div>
            <div>
              {trace.status === 'completed' ? '完成' :
               trace.status === 'error' ? '错误' :
               '执行中'}
            </div>
          </div>
          {totalDuration !== undefined && (
            <div>
              <div className='text-muted-foreground'>总耗时</div>
              <div>{formatDuration(totalDuration)}</div>
            </div>
          )}
          {trace.totalCost !== undefined && (
            <div>
              <div className='text-muted-foreground'>成本</div>
              <div>${trace.totalCost.toFixed(4)}</div>
            </div>
          )}
        </div>

        {/* 请求信息（可折叠） */}
        {(trace.systemPrompt || trace.tools) && (
          <Collapsible open={requestInfoOpen} onOpenChange={setRequestInfoOpen}>
            <CollapsibleTrigger className='flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground'>
              {requestInfoOpen ? (
                <ChevronDown className='h-3 w-3' />
              ) : (
                <ChevronRight className='h-3 w-3' />
              )}
              请求信息
            </CollapsibleTrigger>
            <CollapsibleContent className='mt-2 space-y-3'>
              {/* System Prompt */}
              {trace.systemPrompt && (
                <div className='space-y-1'>
                  <div className='text-xs text-muted-foreground'>System Prompt</div>
                  <pre className='text-xs bg-muted p-2 rounded overflow-auto max-h-40 whitespace-pre-wrap'>
                    {trace.systemPrompt}
                  </pre>
                </div>
              )}

              {/* Available Tools */}
              {trace.tools && trace.tools.length > 0 && (
                <div className='space-y-1'>
                  <div className='text-xs text-muted-foreground'>
                    可用工具 ({trace.tools.length})
                  </div>
                  <div className='space-y-1'>
                    {trace.tools.map((tool) => (
                      <details key={tool.name} className='text-xs'>
                        <summary className='cursor-pointer hover:bg-muted p-1.5 rounded'>
                          <code className='font-mono'>{tool.name}</code>
                          {tool.description && (
                            <span className='ml-2 text-muted-foreground'>
                              {tool.description}
                            </span>
                          )}
                        </summary>
                        <pre className='bg-muted p-2 rounded mt-1 overflow-auto max-h-32 text-xs'>
                          {JSON.stringify(tool.schema, null, 2)}
                        </pre>
                      </details>
                    ))}
                  </div>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Timeline */}
        <div className='border-t pt-4'>
          <TraceTimeline
            steps={trace.steps}
            selectedStepId={selectedStepId}
            onStepClick={onStepClick}
            startedAt={trace.startedAt}
            isStreaming={isStreaming}
          />
        </div>
      </div>
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
    <div className='h-full p-4 space-y-3'>
      <Skeleton className='h-5 w-24' />
      <div className='flex gap-2'>
        <Skeleton className='h-4 w-16' />
        <Skeleton className='h-4 w-12' />
      </div>
      <Skeleton className='h-12 w-full' />
      <Skeleton className='h-12 w-full' />
      <Skeleton className='h-12 w-full' />
    </div>
  )
}
