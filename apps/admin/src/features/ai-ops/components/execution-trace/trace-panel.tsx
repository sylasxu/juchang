/**
 * ExecutionTracePanel Component (v3.11)
 * 
 * 多轮对话执行追踪面板：
 * 1. 顶部工具栏 - 模型选择 + 参数调节 + 重跑按钮
 * 2. 会话统计 - 总轮次、Token、耗时、费用
 * 3. 轮次列表 - 按时间倒序，可展开查看详情
 */

import { useState, useMemo } from 'react'
import { 
  ChevronDown, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  FileText,
  Bot,
  RotateCcw,
  Settings2,
  Loader2,
  Wallet,
  RefreshCw,
  Target,
  Wrench,
  MessageSquare,
  Brain,
  Search,
  Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { 
  ExecutionTrace, 
  TraceStep, 
  ToolStepData, 
  LLMStepData, 
  EvaluationResult,
  ModelParams,
  InputStepData,
  TraceOutput,
  MemoryContext,
  RAGSearchResult,
} from '../../types/trace'
import { 
  calculateSessionStats,
  formatCost,
  formatDuration,
  DEFAULT_MODEL_PARAMS,
  INTENT_DISPLAY_NAMES,
  INTENT_METHOD_NAMES,
  TONE_SCORE_LABELS,
  RELEVANCE_SCORE_LABELS,
  CONTEXT_SCORE_LABELS,
} from '../../types/trace'

interface ExecutionTracePanelProps {
  /** 所有轮次的追踪记录 */
  traces: ExecutionTrace[]
  /** 当前是否正在流式输出 */
  isStreaming: boolean
  /** 模型参数 */
  modelParams?: ModelParams
  /** 模型参数变更回调 */
  onModelParamsChange?: (params: ModelParams) => void
  /** 重跑回调 */
  onRerun?: () => void
  /** 是否可以重跑 */
  canRerun?: boolean
  /** 余额信息 */
  balance?: { total: number; isAvailable: boolean } | null
  /** 余额加载中 */
  balanceLoading?: boolean
  /** 刷新余额 */
  onRefreshBalance?: () => void
  /** 是否启用 trace 模式（用于控制显示内容） */
  traceEnabled?: boolean
  /** trace 模式变更回调 */
  onTraceEnabledChange?: (enabled: boolean) => void
}

export function ExecutionTracePanel({ 
  traces,
  isStreaming,
  modelParams = DEFAULT_MODEL_PARAMS,
  onModelParamsChange,
  onRerun,
  canRerun = false,
  balance,
  balanceLoading,
  onRefreshBalance,
  traceEnabled = true,
  onTraceEnabledChange,
}: ExecutionTracePanelProps) {
  const [promptDialogOpen, setPromptDialogOpen] = useState(false)
  const [selectedPrompt, setSelectedPrompt] = useState<string>('')
  
  // 计算会话统计
  const stats = useMemo(() => calculateSessionStats(traces), [traces])
  
  // 获取最新轮次的 System Prompt
  const latestPrompt = traces[0]?.systemPrompt

  const handleViewPrompt = (prompt: string) => {
    setSelectedPrompt(prompt)
    setPromptDialogOpen(true)
  }

  // 导出功能
  const handleExport = () => {
    const data = JSON.stringify(traces, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `trace-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className='h-full flex flex-col'>
      {/* 顶部工具栏 */}
      <PanelHeader 
        modelParams={modelParams}
        onModelParamsChange={onModelParamsChange}
        onRerun={onRerun}
        canRerun={canRerun && !isStreaming && traces.length > 0}
        hasPrompt={!!latestPrompt}
        onViewPrompt={() => latestPrompt && handleViewPrompt(latestPrompt)}
        balance={balance}
        balanceLoading={balanceLoading}
        onRefreshBalance={onRefreshBalance}
        traceEnabled={traceEnabled}
        onTraceEnabledChange={onTraceEnabledChange}
        onExport={traces.length > 0 ? handleExport : undefined}
      />
      
      {traces.length === 0 ? (
        <div className='flex flex-1 items-center justify-center'>
          <p className='text-sm text-muted-foreground'>发送消息后查看执行追踪</p>
        </div>
      ) : (
        <>
          {/* 会话统计 - 固定 */}
          <SessionStatsBar stats={stats} />
          
          {/* 轮次列表 - 可滚动 */}
          <div className='flex-1 overflow-y-auto min-h-0'>
            <div className='px-4 py-3 space-y-2'>
              {[...traces].reverse().map((trace, index, arr) => (
                <RoundItem 
                  key={trace.requestId} 
                  trace={trace}
                  index={index + 1}
                  isLatest={index === arr.length - 1}
                  onViewPrompt={handleViewPrompt}
                  traceEnabled={traceEnabled}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {/* System Prompt Modal */}
      <Dialog open={promptDialogOpen} onOpenChange={setPromptDialogOpen}>
        <DialogContent className='max-w-3xl max-h-[80vh]'>
          <DialogHeader>
            <DialogTitle>System Prompt</DialogTitle>
          </DialogHeader>
          <pre className='text-xs bg-muted p-4 rounded overflow-auto max-h-[60vh] whitespace-pre-wrap'>
            {selectedPrompt || '无 System Prompt'}
          </pre>
        </DialogContent>
      </Dialog>
    </div>
  )
}


/** 面板头部 - 紧凑单行布局 */
function PanelHeader({ 
  modelParams,
  onModelParamsChange,
  onRerun,
  canRerun,
  hasPrompt,
  onViewPrompt,
  balance,
  balanceLoading,
  onRefreshBalance,
  traceEnabled,
  onTraceEnabledChange,
  onExport,
}: { 
  modelParams: ModelParams
  onModelParamsChange?: (params: ModelParams) => void
  onRerun?: () => void
  canRerun?: boolean
  hasPrompt?: boolean
  onViewPrompt?: () => void
  balance?: { total: number; isAvailable: boolean } | null
  balanceLoading?: boolean
  onRefreshBalance?: () => void
  traceEnabled?: boolean
  onTraceEnabledChange?: (enabled: boolean) => void
  onExport?: () => void
}) {
  return (
    <div className='flex-shrink-0 border-b px-4 py-2'>
      <div className='flex items-center justify-between gap-2'>
        {/* 左侧：标题 + 模式切换 */}
        <div className='flex items-center gap-2'>
          <h2 className='text-lg font-medium'>执行追踪</h2>
          {onTraceEnabledChange && (
            <Select 
              value={traceEnabled ? 'trace' : 'production'} 
              onValueChange={(v) => onTraceEnabledChange(v === 'trace')}
            >
              <SelectTrigger className='h-7 w-24 text-xs'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='trace'>Trace</SelectItem>
                <SelectItem value='production'>生产</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
        
        {/* 右侧：余额 + 工具按钮组 */}
        <div className='flex items-center gap-2'>
          {/* 余额显示 */}
          <div className='flex items-center gap-1'>
            <Wallet className='h-3.5 w-3.5 text-muted-foreground' />
            {balanceLoading ? (
              <Loader2 className='h-3 w-3 animate-spin' />
            ) : balance ? (
              <Badge 
                variant={balance.total <= 0 ? 'destructive' : 'secondary'}
                className='font-mono text-xs'
              >
                ¥{balance.total.toFixed(2)}
              </Badge>
            ) : (
              <span className='text-xs text-muted-foreground'>--</span>
            )}
            {onRefreshBalance && (
              <Button
                variant='ghost'
                size='icon'
                className='h-6 w-6'
                onClick={onRefreshBalance}
                disabled={balanceLoading}
              >
                <RefreshCw className={`h-3 w-3 ${balanceLoading ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>

          {/* 模型参数 Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant='ghost' size='icon' className='h-7 w-7'>
                <Settings2 className='h-3.5 w-3.5' />
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-72' align='end'>
              <div className='space-y-4'>
                <div className='text-sm font-medium'>模型参数</div>
                
                {/* 模型选择 */}
                <div className='space-y-2'>
                  <Label className='text-xs text-muted-foreground'>模型</Label>
                  <Select 
                    value={modelParams.model} 
                    onValueChange={(v) => onModelParamsChange?.({ ...modelParams, model: v as 'deepseek' })}
                  >
                    <SelectTrigger className='h-8 text-xs'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='deepseek'>DeepSeek V3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Temperature */}
                <div className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <Label className='text-xs text-muted-foreground'>Temperature</Label>
                    <span className='text-xs font-mono'>{modelParams.temperature}</span>
                  </div>
                  <Slider
                    value={[modelParams.temperature]}
                    onValueChange={([v]) => onModelParamsChange?.({ ...modelParams, temperature: v })}
                    min={0}
                    max={2}
                    step={0.1}
                    className='w-full'
                  />
                  <p className='text-xs text-muted-foreground'>
                    越低越确定，越高越随机
                  </p>
                </div>
                
                {/* Max Tokens */}
                <div className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <Label className='text-xs text-muted-foreground'>Max Tokens</Label>
                    <span className='text-xs font-mono'>{modelParams.maxTokens}</span>
                  </div>
                  <Slider
                    value={[modelParams.maxTokens]}
                    onValueChange={([v]) => onModelParamsChange?.({ ...modelParams, maxTokens: v })}
                    min={256}
                    max={8192}
                    step={256}
                    className='w-full'
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* 查看 Prompt */}
          {hasPrompt && (
            <Button variant='ghost' size='icon' className='h-7 w-7' onClick={onViewPrompt}>
              <FileText className='h-3.5 w-3.5' />
            </Button>
          )}

          {/* 导出按钮 */}
          {onExport && (
            <Button variant='ghost' size='icon' className='h-7 w-7' onClick={onExport}>
              <Download className='h-3.5 w-3.5' />
            </Button>
          )}

          {/* 重跑按钮 */}
          {canRerun && (
            <Button variant='ghost' size='icon' className='h-7 w-7' onClick={onRerun}>
              <RotateCcw className='h-3.5 w-3.5' />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

/** 会话统计栏 - 紧凑水平布局 */
function SessionStatsBar({ stats }: { stats: ReturnType<typeof calculateSessionStats> }) {
  return (
    <div className='px-3 py-1.5 border-b text-xs text-muted-foreground'>
      <div className='flex items-center gap-3'>
        <span>{stats.totalRounds} 轮</span>
        <span className='text-muted-foreground/50'>·</span>
        <span>{stats.totalTokens.toLocaleString()} tokens</span>
        <span className='text-muted-foreground/50'>·</span>
        <span>{formatDuration(stats.totalDuration)}</span>
        <span className='text-muted-foreground/50'>·</span>
        <span>${formatCost(stats.estimatedCost)}</span>
      </div>
    </div>
  )
}


/** 单轮追踪项 - 简洁卡片 */
function RoundItem({ 
  trace, 
  index, 
  isLatest,
  onViewPrompt,
  traceEnabled = true,
}: { 
  trace: ExecutionTrace
  index: number
  isLatest: boolean
  onViewPrompt: (prompt: string) => void
  traceEnabled?: boolean
}) {
  const [expanded, setExpanded] = useState(isLatest)
  
  // 提取关键数据
  const inputStep = trace.steps.find(s => s.type === 'input')
  const llmStep = trace.steps.find(s => s.type === 'llm')
  const toolSteps = trace.steps.filter(s => s.type === 'tool')
  const llmData = llmStep?.data as LLMStepData | undefined
  const inputData = inputStep?.data as InputStepData | undefined
  
  const duration = trace.completedAt
    ? new Date(trace.completedAt).getTime() - new Date(trace.startedAt).getTime()
    : undefined

  // 用户输入摘要
  const inputSummary = inputData?.text 
    ? (inputData.text.length > 40 ? inputData.text.slice(0, 40) + '...' : inputData.text)
    : '(无输入)'

  // 状态图标
  const StatusIcon = trace.status === 'running' 
    ? () => <Loader2 className='h-3 w-3 animate-spin text-muted-foreground' />
    : trace.status === 'error'
    ? () => <XCircle className='h-3 w-3 text-destructive' />
    : () => <CheckCircle2 className='h-3 w-3 text-green-500' />

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <CollapsibleTrigger className='flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-muted/50 rounded-md transition-colors'>
        {/* 状态图标 */}
        <StatusIcon />
        {/* 轮次号 */}
        <span className='text-xs text-muted-foreground w-5'>#{index}</span>
        {/* 输入摘要 */}
        <span className='flex-1 text-sm truncate'>{inputSummary}</span>
        {/* 耗时 */}
        {duration !== undefined && (
          <span className='text-xs text-muted-foreground'>{formatDuration(duration)}</span>
        )}
        {/* 展开图标 */}
        {expanded ? <ChevronDown className='h-3.5 w-3.5 text-muted-foreground' /> : <ChevronRight className='h-3.5 w-3.5 text-muted-foreground' />}
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className='ml-5 pl-3 border-l space-y-1.5 py-2'>
          {/* LLM 推理信息 */}
          {llmStep && llmData && (
            <div className='flex items-center gap-2 text-xs text-muted-foreground'>
              <Bot className='h-3 w-3' />
              <span>{llmData.model}</span>
              <span className='text-muted-foreground/50'>·</span>
              <span>{llmData.inputTokens}+{llmData.outputTokens} tokens</span>
              {llmStep.duration && (
                <>
                  <span className='text-muted-foreground/50'>·</span>
                  <span>{formatDuration(llmStep.duration)}</span>
                </>
              )}
            </div>
          )}

          {/* 意图分类（仅 trace 模式） */}
          {traceEnabled && trace.intent && (
            <IntentSection intent={trace.intent} intentMethod={trace.intentMethod} />
          )}

          {/* Memory 上下文（仅 trace 模式） */}
          {traceEnabled && trace.memory && (
            <MemorySection memory={trace.memory} />
          )}

          {/* RAG 搜索结果（仅 trace 模式且有 RAG 调用时） */}
          {traceEnabled && trace.rag && trace.rag.resultCount > 0 && (
            <RAGSection rag={trace.rag} />
          )}

          {/* Tool 调用（可展开查看详情） */}
          {toolSteps.length > 0 && (
            <ToolCallSection toolSteps={toolSteps} traceEnabled={traceEnabled} />
          )}

          {/* AI 输出（可展开查看详情） */}
          {trace.output && (
            <OutputSection output={trace.output} />
          )}

          {/* 查看该轮 Prompt（仅 trace 模式） */}
          {traceEnabled && trace.systemPrompt && (
            <button 
              className='flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors'
              onClick={() => onViewPrompt(trace.systemPrompt!)}
            >
              <FileText className='h-3 w-3' />
              查看 Prompt
            </button>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}


/** 意图分类区块 */
function IntentSection({ intent, intentMethod }: { intent: string; intentMethod?: 'regex' | 'llm' }) {
  const [expanded, setExpanded] = useState(true)
  const displayName = INTENT_DISPLAY_NAMES[intent as keyof typeof INTENT_DISPLAY_NAMES] || intent
  const methodName = intentMethod ? INTENT_METHOD_NAMES[intentMethod] : null

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <CollapsibleTrigger className='flex items-center gap-2 w-full text-left text-xs'>
        <Target className='h-3 w-3 text-muted-foreground' />
        <span className='text-muted-foreground'>意图分类</span>
        {expanded 
          ? <ChevronDown className='h-3 w-3 ml-auto text-muted-foreground' /> 
          : <ChevronRight className='h-3 w-3 ml-auto text-muted-foreground' />
        }
      </CollapsibleTrigger>
      <CollapsibleContent className='mt-1.5 ml-5 pl-3 border-l'>
        <div className='text-xs'>
          {displayName}
          {methodName && (
            <span className='text-muted-foreground ml-1'>({methodName})</span>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

/** Memory 上下文区块 */
function MemorySection({ memory }: { memory: MemoryContext }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <CollapsibleTrigger className='flex items-center gap-2 w-full text-left text-xs'>
        <Brain className='h-3 w-3 text-muted-foreground' />
        <span className='text-muted-foreground'>Memory</span>
        <span className='text-muted-foreground/50'>·</span>
        <span className='text-muted-foreground/70'>
          {memory.profileFieldCount} 画像 · {memory.historyMessageCount} 历史
        </span>
        {expanded 
          ? <ChevronDown className='h-3 w-3 ml-auto text-muted-foreground' /> 
          : <ChevronRight className='h-3 w-3 ml-auto text-muted-foreground' />
        }
      </CollapsibleTrigger>
      <CollapsibleContent className='mt-1.5 ml-5 pl-3 border-l text-xs space-y-1'>
        <div>画像字段: {memory.profileFieldCount}</div>
        <div>历史消息: {memory.historyMessageCount}</div>
        {memory.workingMemorySummary && (
          <div className='text-muted-foreground'>{memory.workingMemorySummary}</div>
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}

/** RAG 搜索结果区块 */
function RAGSection({ rag }: { rag: RAGSearchResult }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <CollapsibleTrigger className='flex items-center gap-2 w-full text-left text-xs'>
        <Search className='h-3 w-3 text-muted-foreground' />
        <span className='text-muted-foreground'>RAG 搜索</span>
        <span className='text-muted-foreground/50'>·</span>
        <span className='text-muted-foreground/70'>{rag.resultCount} 结果</span>
        {expanded 
          ? <ChevronDown className='h-3 w-3 ml-auto text-muted-foreground' /> 
          : <ChevronRight className='h-3 w-3 ml-auto text-muted-foreground' />
        }
      </CollapsibleTrigger>
      <CollapsibleContent className='mt-1.5 ml-5 pl-3 border-l text-xs space-y-1'>
        <div>查询: {rag.query}</div>
        <div>最高分: {rag.topScore.toFixed(2)}</div>
        {rag.results.map(r => (
          <div key={r.activityId} className='text-muted-foreground'>
            {r.title} ({r.score.toFixed(2)})
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
}

/** Tool 调用区块 */
function ToolCallSection({ toolSteps, traceEnabled = true }: { toolSteps: TraceStep[]; traceEnabled?: boolean }) {
  const [expanded, setExpanded] = useState(true)
  const totalDuration = toolSteps.reduce((sum, s) => sum + (s.duration || 0), 0)

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <CollapsibleTrigger className='flex items-center gap-2 w-full text-left text-xs'>
        <Wrench className='h-3 w-3 text-muted-foreground' />
        <span className='text-muted-foreground'>Tool 调用</span>
        <span className='text-muted-foreground/50'>·</span>
        <span className='text-muted-foreground/70'>{formatDuration(totalDuration)}</span>
        {expanded 
          ? <ChevronDown className='h-3 w-3 ml-auto text-muted-foreground' /> 
          : <ChevronRight className='h-3 w-3 ml-auto text-muted-foreground' />
        }
      </CollapsibleTrigger>
      
      <CollapsibleContent className='mt-1.5 ml-5 space-y-2'>
        {toolSteps.map((step) => {
          const toolData = step.data as ToolStepData
          return (
            <ToolCallDetail 
              key={step.id} 
              step={step} 
              data={toolData}
              traceEnabled={traceEnabled}
            />
          )
        })}
      </CollapsibleContent>
    </Collapsible>
  )
}

/** Tool 调用详情 - 展开后显示 */
function ToolCallDetail({ step, data, traceEnabled = true }: { step: TraceStep; data: ToolStepData; traceEnabled?: boolean }) {
  const evaluation = data.evaluation
  const hasInput = data.input && Object.keys(data.input).length > 0
  const hasOutput = data.output && Object.keys(data.output).length > 0

  return (
    <div className='space-y-1.5 border-l pl-3'>
      {/* Tool 名称 + 评分（评分仅 trace 模式） */}
      <div className='flex items-center gap-2 text-xs'>
        <span className='font-medium'>{data.toolDisplayName}</span>
        {traceEnabled && evaluation && (
          <span className={cn(
            'text-xs',
            evaluation.passed ? 'text-green-600' : 'text-amber-600'
          )}>
            {evaluation.score}/10
          </span>
        )}
        {step.duration !== undefined && (
          <span className='text-muted-foreground/70'>{formatDuration(step.duration)}</span>
        )}
      </div>
      
      {/* 输入参数（仅 trace 模式） */}
      {traceEnabled && (
        hasInput ? (
          <div>
            <div className='text-xs text-muted-foreground mb-0.5'>输入</div>
            <pre className='text-xs bg-muted p-2 rounded overflow-auto max-h-24 font-mono'>
              {JSON.stringify(data.input, null, 2)}
            </pre>
          </div>
        ) : (
          <div className='text-xs text-muted-foreground'>无输入参数</div>
        )
      )}
      
      {/* 输出结果 */}
      {hasOutput ? (
        <div>
          <div className='text-xs text-muted-foreground mb-0.5'>输出</div>
          <pre className='text-xs bg-muted p-2 rounded overflow-auto max-h-24 font-mono'>
            {JSON.stringify(data.output, null, 2)}
          </pre>
        </div>
      ) : (
        <div className='text-xs text-muted-foreground'>无输出结果</div>
      )}
      
      {/* 评估详情（仅 trace 模式） */}
      {traceEnabled && evaluation && (
        <EvaluationDetail evaluation={evaluation} />
      )}
    </div>
  )
}

/** 评估详情 */
function EvaluationDetail({ evaluation }: { evaluation: EvaluationResult }) {
  const [showThinking, setShowThinking] = useState(false)
  
  return (
    <div className='bg-muted/50 rounded p-2 space-y-2'>
      {/* 头部：通过状态 + 总分 */}
      <div className='flex items-center justify-between'>
        <span className='text-xs font-medium'>质量评估</span>
        <span className={cn(
          'text-xs font-medium',
          evaluation.passed ? 'text-green-600' : 'text-amber-600'
        )}>
          {evaluation.passed ? '通过' : '需改进'} ({evaluation.score}/10)
        </span>
      </div>
      
      {/* 多维度评分条 */}
      <div className='space-y-1.5'>
        {/* 语气评分 */}
        {evaluation.toneScore !== undefined && (
          <ScoreBar 
            label='语气' 
            score={evaluation.toneScore} 
            maxScore={5}
            description={TONE_SCORE_LABELS[evaluation.toneScore]}
          />
        )}
        
        {/* 相关性评分 */}
        {evaluation.relevanceScore !== undefined && (
          <ScoreBar 
            label='相关性' 
            score={evaluation.relevanceScore} 
            maxScore={5}
            description={RELEVANCE_SCORE_LABELS[evaluation.relevanceScore]}
          />
        )}
        
        {/* 上下文利用度评分 */}
        {evaluation.contextScore !== undefined && (
          <ScoreBar 
            label='上下文' 
            score={evaluation.contextScore} 
            maxScore={5}
            description={CONTEXT_SCORE_LABELS[evaluation.contextScore]}
          />
        )}
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
      
      {/* 评估推理过程（可折叠） */}
      {evaluation.thinking && (
        <Collapsible open={showThinking} onOpenChange={setShowThinking}>
          <CollapsibleTrigger className='flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors'>
            {showThinking ? <ChevronDown className='h-3 w-3' /> : <ChevronRight className='h-3 w-3' />}
            查看评估推理
          </CollapsibleTrigger>
          <CollapsibleContent className='mt-1'>
            <pre className='text-xs bg-muted p-2 rounded overflow-auto max-h-32 whitespace-pre-wrap text-muted-foreground'>
              {evaluation.thinking}
            </pre>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  )
}

/** 评分条组件 */
function ScoreBar({ 
  label, 
  score, 
  maxScore,
  description,
}: { 
  label: string
  score: number
  maxScore: number
  description?: string
}) {
  const percentage = (score / maxScore) * 100
  const colorClass = score >= 4 ? 'bg-green-500' : score >= 3 ? 'bg-amber-500' : 'bg-red-500'
  
  return (
    <div className='flex items-center gap-2 text-xs'>
      <span className='w-12 text-muted-foreground'>{label}</span>
      <div className='flex-1 h-1.5 bg-muted rounded-full overflow-hidden'>
        <div 
          className={cn('h-full rounded-full transition-all', colorClass)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className='w-6 text-right font-mono'>{score}/{maxScore}</span>
      {description && (
        <span className='text-muted-foreground/70 truncate max-w-20'>{description}</span>
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

/** AI 输出区块 - 展示完整 JSON */
function OutputSection({ output }: { output: TraceOutput }) {
  const [expanded, setExpanded] = useState(true)
  const hasText = output.text && output.text.length > 0
  const hasToolCalls = output.toolCalls.length > 0

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <CollapsibleTrigger className='flex items-center gap-2 w-full text-left text-xs'>
        <MessageSquare className='h-3 w-3 text-muted-foreground' />
        <span className='text-muted-foreground'>AI 输出</span>
        <span className='text-muted-foreground/50'>·</span>
        <span className={hasText ? 'text-muted-foreground/70' : 'text-amber-600'}>
          {hasText ? '有文字' : '无文字'}
        </span>
        {hasToolCalls && (
          <>
            <span className='text-muted-foreground/50'>·</span>
            <span className='text-muted-foreground/70'>{output.toolCalls.length} tool</span>
          </>
        )}
        {expanded 
          ? <ChevronDown className='h-3 w-3 ml-auto text-muted-foreground' /> 
          : <ChevronRight className='h-3 w-3 ml-auto text-muted-foreground' />
        }
      </CollapsibleTrigger>
      
      <CollapsibleContent className='mt-1.5 ml-5 pl-3 border-l'>
        <pre className='text-xs bg-muted p-2 rounded overflow-auto max-h-64 font-mono'>
          {JSON.stringify(output, null, 2)}
        </pre>
      </CollapsibleContent>
    </Collapsible>
  )
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

