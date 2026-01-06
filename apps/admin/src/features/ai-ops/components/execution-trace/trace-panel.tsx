/**
 * ExecutionTracePanel Component (v3.10)
 * 
 * 重构版执行追踪面板：
 * 1. 概览区 - 状态、耗时、Token 统计
 * 2. 执行流程 - 精简时间线
 * 3. 工具调用 - 只展示实际调用的 Tool
 * 4. 评估结果 - 新增评估面板
 */

import { useState } from 'react'
import { 
  ChevronDown, 
  ChevronRight, 
  Clock, 
  Zap, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Wrench,
  FileText,
  Bot,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import type { ExecutionTrace, TraceStep, ToolStepData, LLMStepData, EvaluationResult } from '../../types/trace'
import { isToolStepData, isLLMStepData } from '../../types/trace'

interface ExecutionTracePanelProps {
  trace: ExecutionTrace | null
  isStreaming: boolean
}

export function ExecutionTracePanel({ trace, isStreaming }: ExecutionTracePanelProps) {
  const [promptOpen, setPromptOpen] = useState(false)

  if (!trace) {
    return (
      <div className='h-full flex flex-col'>
        <PanelHeader />
        <div className='flex flex-1 items-center justify-center'>
          <p className='text-sm text-muted-foreground'>发送消息后查看执行追踪</p>
        </div>
      </div>
    )
  }

  // 提取关键数据
  const llmStep = trace.steps.find(s => isLLMStepData(s.data))
  const toolSteps = trace.steps.filter(s => isToolStepData(s.data))
  const llmData = llmStep?.data as LLMStepData | undefined
  const totalDuration = trace.completedAt
    ? new Date(trace.completedAt).getTime() - new Date(trace.startedAt).getTime()
    : undefined

  return (
    <div className='h-full flex flex-col'>
      <PanelHeader isStreaming={isStreaming} status={trace.status} />
      
      <div className='flex-1 overflow-y-auto'>
        {/* 概览统计 */}
        <div className='px-4 py-3 border-b'>
          <div className='grid grid-cols-3 gap-3 text-xs'>
            <StatItem 
              icon={<Clock className='h-3.5 w-3.5' />} 
              label='耗时' 
              value={totalDuration ? formatDuration(totalDuration) : '-'} 
            />
            <StatItem 
              icon={<Zap className='h-3.5 w-3.5' />} 
              label='Tokens' 
              value={llmData?.totalTokens?.toLocaleString() || '-'} 
            />
            <StatItem 
              icon={<Wrench className='h-3.5 w-3.5' />} 
              label='Tool 调用' 
              value={`${toolSteps.length} 次`} 
            />
          </div>
        </div>

        {/* 执行流程 */}
        <div className='px-4 py-3 space-y-3'>
          {/* LLM 推理 */}
          {llmStep && llmData && (
            <FlowStep 
              icon={<Bot className='h-4 w-4' />}
              title='LLM 推理'
              status={llmStep.status}
              duration={llmStep.duration}
            >
              <div className='text-xs text-muted-foreground space-y-1'>
                <div>模型: {llmData.model}</div>
                <div>输入: {llmData.inputTokens} / 输出: {llmData.outputTokens}</div>
              </div>
            </FlowStep>
          )}

          {/* Tool 调用列表 */}
          {toolSteps.map((step, idx) => {
            const toolData = step.data as ToolStepData
            return (
              <ToolCallStep 
                key={step.id} 
                step={step} 
                data={toolData}
                index={idx + 1}
              />
            )
          })}
        </div>

        {/* System Prompt（折叠） */}
        {trace.systemPrompt && (
          <div className='px-4 py-2 border-t'>
            <Collapsible open={promptOpen} onOpenChange={setPromptOpen}>
              <CollapsibleTrigger className='flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground w-full'>
                {promptOpen ? <ChevronDown className='h-3 w-3' /> : <ChevronRight className='h-3 w-3' />}
                <FileText className='h-3 w-3' />
                System Prompt
              </CollapsibleTrigger>
              <CollapsibleContent className='mt-2'>
                <pre className='text-xs bg-muted p-2 rounded overflow-auto max-h-60 whitespace-pre-wrap'>
                  {trace.systemPrompt}
                </pre>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
      </div>
    </div>
  )
}

/** 面板头部 */
function PanelHeader({ isStreaming, status }: { isStreaming?: boolean; status?: string }) {
  return (
    <div className='flex-shrink-0 border-b px-4 py-3'>
      <div className='flex items-center justify-between'>
        <h3 className='text-sm font-medium'>执行追踪</h3>
        {isStreaming && <Badge variant='secondary' className='text-xs'>执行中</Badge>}
        {status === 'completed' && <Badge variant='outline' className='text-xs text-green-600'>完成</Badge>}
        {status === 'error' && <Badge variant='destructive' className='text-xs'>错误</Badge>}
      </div>
    </div>
  )
}

/** 统计项 */
function StatItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className='flex items-center gap-1.5'>
      <span className='text-muted-foreground'>{icon}</span>
      <div>
        <div className='text-muted-foreground'>{label}</div>
        <div className='font-medium'>{value}</div>
      </div>
    </div>
  )
}

/** 流程步骤 */
function FlowStep({ 
  icon, 
  title, 
  status, 
  duration, 
  children 
}: { 
  icon: React.ReactNode
  title: string
  status: string
  duration?: number
  children?: React.ReactNode 
}) {
  return (
    <div className='flex gap-3'>
      <div className='flex-shrink-0 mt-0.5'>
        <div className={cn(
          'w-6 h-6 rounded-full flex items-center justify-center',
          status === 'success' ? 'bg-green-100 text-green-600' :
          status === 'error' ? 'bg-red-100 text-red-600' :
          'bg-muted text-muted-foreground'
        )}>
          {icon}
        </div>
      </div>
      <div className='flex-1 min-w-0'>
        <div className='flex items-center justify-between'>
          <span className='text-sm font-medium'>{title}</span>
          {duration !== undefined && (
            <span className='text-xs text-muted-foreground'>{formatDuration(duration)}</span>
          )}
        </div>
        {children}
      </div>
    </div>
  )
}

/** Tool 调用步骤（含评估） */
function ToolCallStep({ step, data, index }: { step: TraceStep; data: ToolStepData; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const evaluation = data.evaluation

  return (
    <div className='flex gap-3'>
      <div className='flex-shrink-0 mt-0.5'>
        <div className={cn(
          'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
          step.status === 'success' ? 'bg-blue-100 text-blue-600' :
          step.status === 'error' ? 'bg-red-100 text-red-600' :
          'bg-muted text-muted-foreground'
        )}>
          {index}
        </div>
      </div>
      <div className='flex-1 min-w-0'>
        <Collapsible open={expanded} onOpenChange={setExpanded}>
          <CollapsibleTrigger className='flex items-center justify-between w-full text-left'>
            <div className='flex items-center gap-2'>
              <span className='text-sm font-medium'>{data.toolDisplayName}</span>
              <code className='text-xs text-muted-foreground'>{data.toolName}</code>
            </div>
            <div className='flex items-center gap-2'>
              {/* 评估徽章 */}
              {evaluation && (
                <EvaluationBadge evaluation={evaluation} />
              )}
              {step.duration !== undefined && (
                <span className='text-xs text-muted-foreground'>{formatDuration(step.duration)}</span>
              )}
              {expanded ? <ChevronDown className='h-3 w-3' /> : <ChevronRight className='h-3 w-3' />}
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className='mt-2 space-y-2'>
            {/* 输入参数 */}
            <div>
              <div className='text-xs text-muted-foreground mb-1'>输入</div>
              <pre className='text-xs bg-muted p-2 rounded overflow-auto max-h-32'>
                {JSON.stringify(data.input, null, 2)}
              </pre>
            </div>
            {/* 输出结果 */}
            {data.output && (
              <div>
                <div className='text-xs text-muted-foreground mb-1'>输出</div>
                <pre className='text-xs bg-muted p-2 rounded overflow-auto max-h-32'>
                  {JSON.stringify(data.output, null, 2)}
                </pre>
              </div>
            )}
            {/* 评估详情 */}
            {evaluation && (
              <EvaluationDetail evaluation={evaluation} />
            )}
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  )
}

/** 评估徽章 */
function EvaluationBadge({ evaluation }: { evaluation: EvaluationResult }) {
  if (evaluation.passed) {
    return (
      <Badge variant='outline' className='text-xs text-green-600 gap-1'>
        <CheckCircle2 className='h-3 w-3' />
        {evaluation.score}/10
      </Badge>
    )
  }
  return (
    <Badge variant='outline' className='text-xs text-amber-600 gap-1'>
      <AlertCircle className='h-3 w-3' />
      {evaluation.score}/10
    </Badge>
  )
}

/** 评估详情 */
function EvaluationDetail({ evaluation }: { evaluation: EvaluationResult }) {
  return (
    <div className='bg-muted/50 rounded p-2 space-y-2'>
      <div className='flex items-center justify-between'>
        <span className='text-xs font-medium'>质量评估</span>
        <span className={cn(
          'text-xs font-medium',
          evaluation.passed ? 'text-green-600' : 'text-amber-600'
        )}>
          {evaluation.passed ? '通过' : '需改进'} ({evaluation.score}/10)
        </span>
      </div>
      
      {/* 字段完整性 */}
      {evaluation.fieldCompleteness && (
        <div className='grid grid-cols-2 gap-1 text-xs'>
          <FieldCheck label='标题' checked={evaluation.fieldCompleteness.hasTitle} />
          <FieldCheck label='类型' checked={evaluation.fieldCompleteness.hasType} />
          <FieldCheck label='位置提示' checked={evaluation.fieldCompleteness.hasLocationHint} />
          <FieldCheck label='时间' checked={evaluation.fieldCompleteness.hasValidTime} />
        </div>
      )}
      
      {/* 问题列表 */}
      {evaluation.issues.length > 0 && (
        <div>
          <div className='text-xs text-muted-foreground mb-1'>问题</div>
          <ul className='text-xs space-y-0.5'>
            {evaluation.issues.map((issue, i) => (
              <li key={i} className='flex items-start gap-1'>
                <XCircle className='h-3 w-3 text-red-500 mt-0.5 flex-shrink-0' />
                {issue}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* 改进建议 */}
      {evaluation.suggestions && evaluation.suggestions.length > 0 && (
        <div>
          <div className='text-xs text-muted-foreground mb-1'>建议</div>
          <ul className='text-xs space-y-0.5'>
            {evaluation.suggestions.map((suggestion, i) => (
              <li key={i} className='text-muted-foreground'>• {suggestion}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/** 字段检查项 */
function FieldCheck({ label, checked }: { label: string; checked: boolean }) {
  return (
    <div className='flex items-center gap-1'>
      {checked ? (
        <CheckCircle2 className='h-3 w-3 text-green-500' />
      ) : (
        <XCircle className='h-3 w-3 text-red-500' />
      )}
      <span className={checked ? '' : 'text-red-600'}>{label}</span>
    </div>
  )
}

/** 格式化耗时 */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
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
    </div>
  )
}
