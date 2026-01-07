/**
 * PlaygroundChat Component (v3.11)
 * 
 * 对话区组件，集成执行追踪。
 * 模型参数已移至 ExecutionTracePanel 统一管理。
 */

import { useState, useRef, useEffect, useCallback, useMemo, useImperativeHandle, forwardRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useChat, type UIMessage } from '@ai-sdk/react'
import { DefaultChatTransport, isToolUIPart, getToolName } from 'ai'
import { api, unwrap } from '@/lib/eden'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { 
  Trash2, Bot, User, Loader2, Copy, Check,
  RotateCcw, Square, ChevronRight, PanelRightOpen, PanelRightClose,
  Send, Settings2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { StreamingText } from '../shared/streaming-text'
import type { TraceStep, TraceStatus, ModelParams, IntentType } from '../../types/trace'
import { getToolDisplayName, DEFAULT_MODEL_PARAMS } from '../../types/trace'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

/** 暴露给父组件的方法 */
export interface PlaygroundChatRef {
  /** 获取最后一条用户消息 */
  getLastUserMessage: () => string | null
  /** 重跑最后一条消息 */
  rerun: () => void
}

interface PlaygroundChatProps {
  /** 模型参数（从父组件传入，只读展示） */
  modelParams?: ModelParams
  /** 是否启用 trace 模式 */
  traceEnabled?: boolean
  /** trace 模式变更回调 */
  onTraceEnabledChange?: (enabled: boolean) => void
  /** 追踪开始回调 */
  onTraceStart?: (requestId: string, startedAt: string, systemPrompt?: string, tools?: Array<{ name: string; description: string; schema: Record<string, unknown> }>, intent?: IntentType, intentMethod?: 'regex' | 'llm') => void
  /** 追踪步骤回调 */
  onTraceStep?: (step: TraceStep) => void
  /** 更新追踪步骤回调 */
  onUpdateTraceStep?: (stepId: string, updates: Partial<TraceStep>) => void
  /** 追踪结束回调 */
  onTraceEnd?: (completedAt: string, status: TraceStatus, totalCost?: number, output?: { text: string | null; toolCalls: Array<{ name: string; displayName: string; input: unknown; output: unknown }> }) => void
  /** 清空追踪回调 */
  onClearTrace?: () => void
  /** 选中消息回调 */
  onMessageSelect?: (messageId: string) => void
  /** 追踪面板是否可见 */
  tracePanelVisible?: boolean
  /** 切换追踪面板 */
  onToggleTracePanel?: () => void
}

export const PlaygroundChat = forwardRef<PlaygroundChatRef, PlaygroundChatProps>(function PlaygroundChat({
  modelParams = DEFAULT_MODEL_PARAMS,
  traceEnabled = true,
  onTraceEnabledChange,
  onTraceStart,
  onTraceStep,
  onUpdateTraceStep,
  onTraceEnd,
  onClearTrace,
  onMessageSelect,
  tracePanelVisible,
  onToggleTracePanel,
}, ref) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [inputValue, setInputValue] = useState('')
  const [autoScroll, setAutoScroll] = useState(true)

  // 创建 transport（依赖模型参数和 trace 开关）
  const transport = useMemo(() => {
    const token = localStorage.getItem('admin_token')
    return new DefaultChatTransport({
      api: `${API_BASE_URL}/ai/chat`,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: { 
        source: 'admin',
        trace: traceEnabled,
        modelParams: {
          model: modelParams.model,
          temperature: modelParams.temperature,
          maxTokens: modelParams.maxTokens,
        },
      },
    })
  }, [modelParams, traceEnabled])

  // 使用 useChat hook
  const { 
    messages, 
    sendMessage,
    setMessages,
    status,
    error,
    stop,
    regenerate,
  } = useChat({
    transport,
    onData: (dataPart) => {
      if (dataPart && typeof dataPart === 'object' && 'type' in dataPart) {
        const part = dataPart as { type: string; data?: unknown }
        
        if (part.type === 'data-trace-start') {
          const data = part.data as { requestId: string; startedAt: string; systemPrompt?: string; tools?: Array<{ name: string; description: string; schema: Record<string, unknown> }>; intent?: IntentType; intentMethod?: 'regex' | 'llm' }
          onTraceStart?.(data.requestId, data.startedAt, data.systemPrompt, data.tools, data.intent, data.intentMethod)
        } else if (part.type === 'data-trace-step') {
          onTraceStep?.(part.data as TraceStep)
        } else if (part.type === 'data-trace-step-update') {
          const data = part.data as { stepId: string; [key: string]: unknown }
          onUpdateTraceStep?.(data.stepId, data as Partial<TraceStep>)
        } else if (part.type === 'data-trace-end') {
          const data = part.data as { completedAt: string; status: TraceStatus; totalCost?: number; output?: { text: string | null; toolCalls: Array<{ name: string; displayName: string; input: unknown; output: unknown }> } }
          onTraceEnd?.(data.completedAt, data.status, data.totalCost, data.output)
        }
      }
    },
    onError: (err) => {
      console.error('AI Chat 错误:', err)
      onTraceEnd?.(new Date().toISOString(), 'error')
    },
  })

  const isLoading = status === 'submitted' || status === 'streaming'

  // 获取最后一条用户消息
  const getLastUserMessage = useCallback((): string | null => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        const textPart = messages[i].parts?.find(
          (p): p is { type: 'text'; text: string } => p.type === 'text'
        )
        return textPart?.text || null
      }
    }
    return null
  }, [messages])

  // 发送消息的核心逻辑
  const doSendMessage = useCallback((text: string) => {
    if (!text.trim() || isLoading) return
    
    sendMessage({ text: text.trim() })
    setAutoScroll(true)
  }, [isLoading, sendMessage])

  // 重跑最后一条消息
  const rerun = useCallback(() => {
    const lastMessage = getLastUserMessage()
    if (lastMessage) {
      doSendMessage(lastMessage)
    }
  }, [getLastUserMessage, doSendMessage])

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    getLastUserMessage,
    rerun,
  }), [getLastUserMessage, rerun])

  // 自动滚动
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight
      }
    }
  }, [messages, autoScroll])

  // 检测用户滚动
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement
    const isAtBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 50
    setAutoScroll(isAtBottom)
  }, [])

  // 清空对话
  const handleClear = useCallback(() => {
    setMessages([])
    onClearTrace?.()
  }, [setMessages, onClearTrace])

  // 发送消息
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading) return
    
    doSendMessage(inputValue.trim())
    setInputValue('')
    inputRef.current?.focus()
  }, [inputValue, isLoading, doSendMessage])

  // 发送消息（供按钮点击使用）
  const handleSendMessage = useCallback((text: string) => {
    doSendMessage(text)
  }, [doSendMessage])

  return (
    <div className='flex h-full flex-col p-4 pt-2 overflow-hidden'>
      {/* 顶部工具栏 */}
      <div className='mb-4 flex items-center justify-between flex-shrink-0'>
        <h2 className='text-lg font-medium'>对话测试</h2>
        <div className='flex items-center gap-1'>
          <Button variant='ghost' size='sm' onClick={handleClear} disabled={messages.length === 0}>
            <Trash2 className='mr-1 h-4 w-4' />
            清空
          </Button>
          {onToggleTracePanel && (
            <Button variant='ghost' size='icon' className='h-8 w-8' onClick={onToggleTracePanel}>
              {tracePanelVisible ? (
                <PanelRightClose className='h-4 w-4' />
              ) : (
                <PanelRightOpen className='h-4 w-4' />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* 消息列表 */}
      <ScrollArea className='flex-1 min-h-0' ref={scrollRef} onScrollCapture={handleScroll}>
        <div className='space-y-6 pb-4 pr-4'>
          {messages.length === 0 && (
            <EmptyState onQuickAction={(prompt) => {
              handleSendMessage(prompt)
            }} />
          )}
          {messages.map((message, index) => {
            const isLastAssistant = message.role === 'assistant' && 
              index === messages.length - 1
            return (
              <MessageItem 
                key={message.id} 
                message={message}
                isStreaming={isLoading && isLastAssistant}
                onClick={() => onMessageSelect?.(message.id)}
                onSendMessage={handleSendMessage}
              />
            )
          })}
          {/* 已提交但还没收到 assistant 消息时，显示 loading */}
          {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
            <div className='flex gap-3'>
              <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted'>
                <Bot className='h-4 w-4' />
              </div>
              <div className='rounded-lg rounded-tl-none bg-muted px-3 py-2'>
                <Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* 输入区 - AI Studio 风格 */}
      <div className='mt-4 flex-shrink-0'>
        {error && (
          <div className='mb-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive flex items-center justify-between'>
            <span>{error.message}</span>
            <Button variant='ghost' size='sm' className='h-6 px-2' onClick={() => regenerate()}>
              <RotateCcw className='mr-1 h-3 w-3' />
              重试
            </Button>
          </div>
        )}
        
        <div className='rounded-xl border bg-muted/30 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-shadow'>
          {/* 输入框 */}
          <form onSubmit={handleSubmit}>
            <textarea
              ref={inputRef as unknown as React.RefObject<HTMLTextAreaElement>}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
              placeholder='输入测试文本...'
              disabled={isLoading}
              rows={1}
              className='w-full resize-none bg-transparent px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'
              style={{ minHeight: '44px', maxHeight: '120px' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement
                target.style.height = 'auto'
                target.style.height = Math.min(target.scrollHeight, 120) + 'px'
              }}
            />
          </form>
          
          {/* 底部工具栏 */}
          <div className='flex items-center justify-between border-t px-3 py-2'>
            <div className='flex items-center gap-1.5'>
              {/* 功能设置 Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <div 
                    className={cn(
                      'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs cursor-pointer transition-colors',
                      traceEnabled 
                        ? 'bg-primary/10 text-primary hover:bg-primary/20' 
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    )}
                  >
                    <Settings2 className='h-3 w-3' />
                    <span>功能</span>
                    {traceEnabled && (
                      <span className='h-1.5 w-1.5 rounded-full bg-primary' />
                    )}
                  </div>
                </PopoverTrigger>
                <PopoverContent className='w-64' align='start' side='top'>
                  <div className='space-y-1'>
                    {/* Trace 模式 */}
                    <div className='flex items-center justify-between rounded-lg px-2 py-2 hover:bg-muted transition-colors'>
                      <div className='flex items-center gap-2'>
                        <span className='text-sm'>Trace 模式</span>
                      </div>
                      <Switch
                        checked={traceEnabled}
                        onCheckedChange={onTraceEnabledChange}
                      />
                    </div>
                    <p className='px-2 text-xs text-muted-foreground'>
                      开启后显示完整执行追踪，关闭为生产模式
                    </p>
                  </div>
                </PopoverContent>
              </Popover>
              
              {/* 模型信息标签（只读展示） */}
              <div className='flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground'>
                <Bot className='h-3 w-3' />
                DeepSeek
              </div>
              {modelParams.temperature !== 0 && (
                <div className='rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground'>
                  T={modelParams.temperature}
                </div>
              )}
            </div>
            
            <div className='flex items-center gap-1'>
              {isLoading ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      type='button' 
                      variant='ghost' 
                      size='icon'
                      className='h-8 w-8'
                      onClick={stop}
                    >
                      <Square className='h-4 w-4 fill-current' />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side='top'>
                    <p>停止生成</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      type='submit' 
                      size='icon'
                      className='h-8 w-8'
                      disabled={!inputValue.trim()}
                      onClick={handleSubmit}
                    >
                      <Send className='h-4 w-4' />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side='top'>
                    <p>发送 <kbd className='ml-1 rounded border bg-muted px-1 font-mono text-xs'>⏎</kbd></p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})


// 空状态组件 - 分层信息架构（基于 API 返回的 sections）
function EmptyState({ onQuickAction }: { onQuickAction: (prompt: string) => void }) {
  const { data: welcomeData, isLoading } = useQuery({
    queryKey: ['ai', 'welcome', 'playground'],
    queryFn: () => unwrap(api.ai.welcome.get({})),
  })

  if (isLoading) {
    return (
      <div className='space-y-4'>
        <Skeleton className='h-12 w-48' />
        <Skeleton className='h-24 w-full' />
        <Skeleton className='h-20 w-full' />
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-xl font-semibold'>
          {welcomeData?.greeting || 'Hello ✨'}
        </h2>
        {welcomeData?.subGreeting && (
          <p className='text-muted-foreground'>{welcomeData.subGreeting}</p>
        )}
      </div>

      {welcomeData?.sections?.map((section) => (
        <WelcomeSection 
          key={section.id} 
          section={section} 
          onQuickAction={onQuickAction} 
        />
      ))}
    </div>
  )
}

function WelcomeSection({ 
  section, 
  onQuickAction 
}: { 
  section: { id: string; icon: string; title: string; items: Array<{ type: string; icon?: string; label: string; prompt: string }> }
  onQuickAction: (prompt: string) => void 
}) {
  return (
    <div className='space-y-2'>
      <div className='flex items-center gap-2 text-sm font-medium'>
        <span>{section.icon}</span>
        <span>{section.title}</span>
      </div>
      <div className='space-y-1 pl-6'>
        {section.items.map((item, i) => (
          <QuickItem 
            key={i} 
            item={item} 
            onClick={() => onQuickAction(item.prompt)} 
          />
        ))}
      </div>
    </div>
  )
}

function QuickItem({ 
  item, 
  onClick 
}: { 
  item: { type: string; icon?: string; label: string }
  onClick: () => void 
}) {
  return (
    <div
      className='flex items-center justify-between rounded-lg border bg-background px-3 py-2 text-sm cursor-pointer hover:bg-muted transition-colors'
      onClick={onClick}
    >
      <div className='flex items-center gap-2'>
        {item.icon && <span>{item.icon}</span>}
        {item.type === 'suggestion' && <span className='text-primary font-medium'>#</span>}
        <span>{item.label}</span>
      </div>
      <ChevronRight className='h-4 w-4 text-muted-foreground' />
    </div>
  )
}

interface ToolPartData {
  type: string
  toolCallId: string
  toolName?: string
  state: 'input-streaming' | 'input-available' | 'output-available' | 'output-error'
  input?: unknown
  output?: unknown
  errorText?: string
}

function MessageItem({ 
  message, 
  isStreaming,
  onClick,
  onSendMessage,
}: { 
  message: UIMessage
  isStreaming?: boolean
  onClick?: () => void
  onSendMessage?: (text: string) => void
}) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'

  const textContent = message.parts
    ?.filter((part): part is { type: 'text'; text: string } => part.type === 'text')
    .map(part => part.text)
    .join('') || ''

  const toolParts = (message.parts?.filter(part => isToolUIPart(part)) || []) as ToolPartData[]

  const handleCopy = async () => {
    await navigator.clipboard.writeText(textContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div 
      className={cn('flex gap-3 group', isUser && 'flex-row-reverse')}
      onClick={onClick}
    >
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
        )}
      >
        {isUser ? <User className='h-4 w-4' /> : <Bot className='h-4 w-4' />}
      </div>

      <div className={cn('flex max-w-[85%] flex-col gap-2', isUser && 'items-end')}>
        {/* AI 消息：正在流式输出但还没有文字时，显示 loading */}
        {!isUser && isStreaming && !textContent && toolParts.length === 0 && (
          <div className='rounded-lg rounded-tl-none bg-muted px-3 py-2'>
            <Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />
          </div>
        )}
        
        {textContent && (
          <div
            className={cn(
              'px-3 py-2 text-sm',
              isUser 
                ? 'rounded-lg rounded-tr-none bg-primary text-primary-foreground' 
                : 'rounded-lg rounded-tl-none bg-muted'
            )}
          >
            {isStreaming ? (
              <StreamingText content={textContent} isStreaming={true} />
            ) : (
              <p className='whitespace-pre-wrap'>{textContent}</p>
            )}
          </div>
        )}

        {/* Tool 调用：流式输出时也显示（有输出的 tool） */}
        {toolParts.length > 0 && (
          <div className='w-full space-y-2'>
            {toolParts.map((part) => (
              <ToolCallCard key={part.toolCallId} toolPart={part} onSendMessage={onSendMessage} />
            ))}
          </div>
        )}

        {!isUser && textContent && (
          <Button
            variant='ghost'
            size='sm'
            className='h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity'
            onClick={handleCopy}
          >
            {copied ? (
              <Check className='h-3 w-3 text-green-500' />
            ) : (
              <Copy className='h-3 w-3' />
            )}
          </Button>
        )}
      </div>
    </div>
  )
}

function ToolCallCard({ toolPart, onSendMessage }: { toolPart: ToolPartData; onSendMessage?: (text: string) => void }) {
  const toolName = toolPart.type === 'dynamic-tool' 
    ? (toolPart.toolName || 'unknown')
    : getToolName(toolPart as Parameters<typeof getToolName>[0])

  if (toolPart.state === 'input-streaming' || toolPart.state === 'input-available') {
    return (
      <div className='flex items-center gap-2 text-sm text-muted-foreground'>
        <Loader2 className='h-3.5 w-3.5 animate-spin' />
        <span>{getToolDisplayName(toolName)}...</span>
      </div>
    )
  }

  if (toolPart.state === 'output-error') {
    return (
      <div className='rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive'>
        {toolPart.errorText || '操作失败，请重试'}
      </div>
    )
  }

  return <ToolPreview toolPart={toolPart} onSendMessage={onSendMessage} />
}

function ToolPreview({ toolPart, onSendMessage }: { toolPart: ToolPartData; onSendMessage?: (text: string) => void }) {
  const toolName = toolPart.type === 'dynamic-tool' 
    ? (toolPart.toolName || 'unknown')
    : getToolName(toolPart as Parameters<typeof getToolName>[0])

  const input = toolPart.input as Record<string, unknown> | undefined
  const output = toolPart.output as Record<string, unknown> | undefined
  const str = (val: unknown): string => String(val ?? '')

  // askPreference: 渲染选项按钮（所有交互按钮统一由此 tool 提供）
  if (toolName === 'askPreference') {
    const options = (output?.options || input?.options || []) as Array<{ label: string; value: string }>
    const allowSkip = output?.allowSkip !== false && input?.allowSkip !== false
    const isComplete = toolPart.state === 'output-available'

    if (!isComplete) {
      return null
    }

    return (
      <div className='flex flex-wrap gap-2'>
        {options.map((option, i) => (
          <div
            key={i}
            className='rounded-full border bg-background px-3 py-1.5 text-xs hover:bg-muted cursor-pointer transition-colors'
            onClick={() => onSendMessage?.(option.label)}
          >
            {option.label}
          </div>
        ))}
        {allowSkip && (
          <div 
            className='rounded-full border border-dashed bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground cursor-pointer hover:bg-muted transition-colors'
            onClick={() => onSendMessage?.('都可以，你随便推荐')}
          >
            都可以，你随便推荐
          </div>
        )}
      </div>
    )
  }

  // exploreNearby: 只展示活动列表，按钮由后续 askPreference 提供
  if (toolName === 'exploreNearby') {
    const activities = (output?.activities || []) as Array<Record<string, unknown>>

    if (toolPart.state !== 'output-available' || activities.length === 0) {
      return null
    }

    return (
      <div className='space-y-1'>
        {activities.slice(0, 3).map((activity, i) => {
          const actTitle = str(activity.title || '未命名')
          const distance = activity.distance ? Number(activity.distance).toFixed(1) : null
          return (
            <div key={i} className='flex items-center gap-2 rounded bg-muted p-1.5 text-xs'>
              <span className='truncate'>{actTitle}</span>
              {distance && (
                <span className='ml-auto shrink-0 text-muted-foreground'>
                  {distance}km
                </span>
              )}
            </div>
          )
        })}
        {activities.length > 3 && (
          <div className='text-xs text-muted-foreground'>
            还有 {activities.length - 3} 个活动...
          </div>
        )}
      </div>
    )
  }

  // publishActivity: 成功提示
  if (toolName === 'publishActivity') {
    return (
      <div className='rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-300'>
        ✓ 活动已发布，快去分享给朋友吧！
      </div>
    )
  }

  // 其他 tool: 不渲染任何 UI，按钮由 askPreference 统一提供
  return null
}
