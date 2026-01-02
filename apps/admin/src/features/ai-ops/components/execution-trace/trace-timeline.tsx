/**
 * TraceTimeline Component
 * 
 * 时间线容器组件，管理步骤列表。
 * 参考 Requirements R9
 */

import { useState, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { TraceStep } from './trace-step'
import { TraceStepInput } from './trace-step-input'
import { TraceStepPrompt } from './trace-step-prompt'
import { TraceStepLLM } from './trace-step-llm'
import { TraceStepTool } from './trace-step-tool'
import { TraceStepOutput } from './trace-step-output'
import type { 
  TraceStep as TraceStepType,
  InputStepData,
  PromptStepData,
  LLMStepData,
  ToolStepData,
  OutputStepData,
} from '../../types/trace'
import {
  isInputStepData,
  isPromptStepData,
  isLLMStepData,
  isToolStepData,
  isOutputStepData,
} from '../../types/trace'

interface TraceTimelineProps {
  /** 步骤列表 */
  steps: TraceStepType[]
  /** 选中的步骤 ID */
  selectedStepId?: string
  /** 步骤点击回调 */
  onStepClick?: (stepId: string) => void
  /** 请求开始时间 (用于计算时间偏移) */
  startedAt?: string
  /** 是否正在流式输出 */
  isStreaming?: boolean
}

export function TraceTimeline({
  steps,
  selectedStepId,
  onStepClick,
  startedAt,
  isStreaming,
}: TraceTimelineProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set())

  const toggleStep = useCallback((stepId: string) => {
    setExpandedSteps(prev => {
      const next = new Set(prev)
      if (next.has(stepId)) {
        next.delete(stepId)
      } else {
        next.add(stepId)
      }
      return next
    })
  }, [])

  // 计算时间偏移
  const startTime = useMemo(() => {
    return startedAt ? new Date(startedAt).getTime() : 0
  }, [startedAt])

  const getTimeOffset = useCallback((stepStartedAt: string) => {
    if (!startTime) return 0
    return new Date(stepStartedAt).getTime() - startTime
  }, [startTime])

  if (steps.length === 0) {
    return (
      <div className='flex h-32 items-center justify-center text-sm text-muted-foreground'>
        等待执行...
      </div>
    )
  }

  return (
    <div className='relative space-y-2'>
      {/* 连接线 */}
      <div 
        className={cn(
          'absolute left-[1.875rem] top-4 bottom-4 w-0.5 bg-border',
          isStreaming && 'bg-gradient-to-b from-primary/50 to-border animate-pulse'
        )}
      />

      {/* 步骤列表 */}
      {steps.map((step) => {
        const isExpanded = expandedSteps.has(step.id)
        const isSelected = selectedStepId === step.id
        const timeOffset = getTimeOffset(step.startedAt)

        return (
          <div key={step.id} className='relative pl-10'>
            {/* 时间线节点 */}
            <div 
              className={cn(
                'absolute left-5 top-3 h-3 w-3 rounded-full border-2 bg-background',
                step.status === 'running' && 'border-primary',
                step.status === 'success' && 'border-green-500',
                step.status === 'error' && 'border-destructive',
                step.status === 'pending' && 'border-muted-foreground/30',
              )}
            />

            <TraceStep
              step={step}
              isExpanded={isExpanded}
              onToggle={() => {
                toggleStep(step.id)
                onStepClick?.(step.id)
              }}
              isSelected={isSelected}
              timeOffset={timeOffset}
            >
              <StepContent step={step} />
            </TraceStep>
          </div>
        )
      })}
    </div>
  )
}

/** 根据步骤类型渲染对应的内容 */
function StepContent({ step }: { step: TraceStepType }) {
  const { data, error } = step

  if (isInputStepData(data)) {
    return <TraceStepInput data={data as InputStepData} />
  }

  if (isPromptStepData(data)) {
    return <TraceStepPrompt data={data as PromptStepData} />
  }

  if (isLLMStepData(data)) {
    return <TraceStepLLM data={data as LLMStepData} />
  }

  if (isToolStepData(data)) {
    return <TraceStepTool data={data as ToolStepData} error={error} />
  }

  if (isOutputStepData(data)) {
    return <TraceStepOutput data={data as OutputStepData} />
  }

  // Fallback: 显示原始 JSON
  return (
    <pre className='overflow-auto rounded bg-muted p-2 text-xs'>
      {JSON.stringify(data, null, 2)}
    </pre>
  )
}
