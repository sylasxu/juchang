/**
 * useExecutionTrace Hook
 * 
 * 执行追踪状态管理 Hook。
 * 参考 Requirements R8, R21
 */

import { useState, useCallback } from 'react'
import type { 
  ExecutionTrace, 
  TraceStep, 
  TraceStatus,
  TraceEvent,
} from '../types/trace'

interface UseExecutionTraceReturn {
  /** 当前追踪数据 */
  trace: ExecutionTrace | null
  /** 处理追踪事件 */
  handleTraceEvent: (event: TraceEvent) => void
  /** 处理追踪开始 */
  handleTraceStart: (requestId: string, startedAt: string) => void
  /** 处理追踪步骤 */
  handleTraceStep: (step: TraceStep) => void
  /** 更新追踪步骤 */
  updateTraceStep: (stepId: string, updates: Partial<TraceStep>) => void
  /** 处理追踪结束 */
  handleTraceEnd: (completedAt: string, status: TraceStatus, totalCost?: number) => void
  /** 清空追踪 */
  clearTrace: () => void
}

export function useExecutionTrace(): UseExecutionTraceReturn {
  const [trace, setTrace] = useState<ExecutionTrace | null>(null)

  /** 处理追踪开始 */
  const handleTraceStart = useCallback((requestId: string, startedAt: string, systemPrompt?: string, tools?: Array<{ name: string; description: string; schema: Record<string, unknown> }>) => {
    setTrace({
      requestId,
      startedAt,
      status: 'running',
      steps: [],
      systemPrompt,
      tools,
    })
  }, [])

  /** 处理追踪步骤 */
  const handleTraceStep = useCallback((step: TraceStep) => {
    setTrace(prev => {
      if (!prev) return null
      
      // 检查是否已存在该步骤（更新）
      const existingIndex = prev.steps.findIndex(s => s.id === step.id)
      if (existingIndex >= 0) {
        const newSteps = [...prev.steps]
        newSteps[existingIndex] = step
        return { ...prev, steps: newSteps }
      }
      
      // 新增步骤
      return {
        ...prev,
        steps: [...prev.steps, step],
      }
    })
  }, [])

  /** 更新追踪步骤 */
  const updateTraceStep = useCallback((stepId: string, updates: Partial<TraceStep>) => {
    setTrace(prev => {
      if (!prev) return null
      
      const stepIndex = prev.steps.findIndex(s => s.id === stepId)
      if (stepIndex < 0) return prev
      
      const newSteps = [...prev.steps]
      newSteps[stepIndex] = { ...newSteps[stepIndex], ...updates }
      
      return { ...prev, steps: newSteps }
    })
  }, [])

  /** 处理追踪结束 */
  const handleTraceEnd = useCallback((
    completedAt: string, 
    status: TraceStatus,
    totalCost?: number
  ) => {
    setTrace(prev => {
      if (!prev) return null
      return {
        ...prev,
        completedAt,
        status,
        totalCost,
      }
    })
  }, [])

  /** 处理追踪事件 (统一入口) */
  const handleTraceEvent = useCallback((event: TraceEvent) => {
    switch (event.type) {
      case 'trace-start':
        handleTraceStart(event.data.requestId, event.data.startedAt, event.data.systemPrompt, event.data.tools)
        break
      case 'trace-step':
        handleTraceStep(event.data)
        break
      case 'trace-end':
        handleTraceEnd(event.data.completedAt, event.data.status, event.data.totalCost)
        break
    }
  }, [handleTraceStart, handleTraceStep, handleTraceEnd])

  /** 清空追踪 */
  const clearTrace = useCallback(() => {
    setTrace(null)
  }, [])

  return {
    trace,
    handleTraceEvent,
    handleTraceStart,
    handleTraceStep,
    updateTraceStep,
    handleTraceEnd,
    clearTrace,
  }
}
