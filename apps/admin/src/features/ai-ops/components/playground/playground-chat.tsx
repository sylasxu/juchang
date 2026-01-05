/**
 * PlaygroundChat Component
 * 
 * 对话区组件，集成执行追踪。
 * 参考 Requirements R1, R2, R3, R16, R17, R19, R20
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useChat, type UIMessage } from '@ai-sdk/react'
import { DefaultChatTransport, isToolUIPart, getToolName } from 'ai'
import { api, unwrap } from '@/lib/eden'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { 
  Send, Trash2, Settings2, Bot, User, Loader2, Copy, Check,
  FileEdit, RotateCcw, StopCircle, Search, MessageSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { StreamingText } from '../shared/streaming-text'
import type { TraceStep, TraceStatus } from '../../types/trace'
import { getToolDisplayName } from '../../types/trace'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'


interface PlaygroundChatProps {
  /** 追踪开始回调 */
  onTraceStart?: (requestId: string, startedAt: string, systemPrompt?: string, tools?: Array<{ name: string; description: string; schema: Record<string, unknown> }>) => void
  /** 追踪步骤回调 */
  onTraceStep?: (step: TraceStep) => void
  /** 更新追踪步骤回调 */
  onUpdateTraceStep?: (stepId: string, updates: Partial<TraceStep>) => void
  /** 追踪结束回调 */
  onTraceEnd?: (completedAt: string, status: TraceStatus, totalCost?: number) => void
  /** 清空追踪回调 */
  onClearTrace?: () => void
  /** 选中消息回调 */
  onMessageSelect?: (messageId: string) => void
}

export function PlaygroundChat({
  onTraceStart,
  onTraceStep,
  onUpdateTraceStep,
  onTraceEnd,
  onClearTrace,
  onMessageSelect,
}: PlaygroundChatProps) {
  const [showSettings, setShowSettings] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [inputValue, setInputValue] = useState('')
  const [autoScroll, setAutoScroll] = useState(true)
  
  // 模型参数状态
  const [temperature, setTemperature] = useState(0)
  const [maxTokens, setMaxTokens] = useState(2048)

  // 创建 transport（依赖模型参数）
  const transport = useMemo(() => {
    const token = localStorage.getItem('admin_token')
    return new DefaultChatTransport({
      api: `${API_BASE_URL}/ai/chat`,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: { 
        source: 'admin',
        trace: true,
        modelParams: {
          temperature,
          maxTokens,
        },
      },
    })
  }, [temperature, maxTokens])

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
      // AI SDK v6 的 onData 接收单个 data part 对象
      // dataPart 结构: { type: 'data-xxx', data: {...} }
      if (dataPart && typeof dataPart === 'object' && 'type' in dataPart) {
        const part = dataPart as { type: string; data?: unknown }
        
        if (part.type === 'data-trace-start') {
          const data = part.data as { requestId: string; startedAt: string; systemPrompt?: string; tools?: Array<{ name: string; description: string; schema: Record<string, unknown> }> }
          onTraceStart?.(data.requestId, data.startedAt, data.systemPrompt, data.tools)
        } else if (part.type === 'data-trace-step') {
          onTraceStep?.(part.data as TraceStep)
        } else if (part.type === 'data-trace-step-update') {
          const data = part.data as { stepId: string; [key: string]: unknown }
          onUpdateTraceStep?.(data.stepId, data as Partial<TraceStep>)
        } else if (part.type === 'data-trace-end') {
          const data = part.data as { completedAt: string; status: TraceStatus; totalCost?: number }
          onTraceEnd?.(data.completedAt, data.status, data.totalCost)
        }
      }
    },
    onError: (err) => {
      console.error('AI Chat 错误:', err)
      onTraceEnd?.(new Date().toISOString(), 'error')
    },
  })

  const isLoading = status === 'submitted' || status === 'streaming'


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
    
    const requestId = crypto.randomUUID()
    const startedAt = new Date().toISOString()
    
    // 开始追踪
    onTraceStart?.(requestId, startedAt)
    
    // 添加用户输入步骤
    onTraceStep?.({
      id: `${requestId}-input`,
      type: 'input',
      name: '用户输入',
      startedAt,
      status: 'success',
      duration: 0,
      data: { text: inputValue.trim() },
    })
    
    // 使用 sendMessage 发送消息
    // API 已更新支持 text 和 content 两种格式
    sendMessage({ text: inputValue.trim() })
    setInputValue('')
    setAutoScroll(true)
    inputRef.current?.focus()
  }, [inputValue, isLoading, sendMessage, onTraceStart, onTraceStep])

  // 发送消息（供按钮点击使用）
  const handleSendMessage = useCallback((text: string) => {
    if (!text.trim() || isLoading) return
    
    const requestId = crypto.randomUUID()
    const startedAt = new Date().toISOString()
    
    // 开始追踪
    onTraceStart?.(requestId, startedAt)
    
    // 添加用户输入步骤
    onTraceStep?.({
      id: `${requestId}-input`,
      type: 'input',
      name: '用户输入',
      startedAt,
      status: 'success',
      duration: 0,
      data: { text: text.trim() },
    })
    
    sendMessage({ text: text.trim() })
    setAutoScroll(true)
  }, [isLoading, sendMessage, onTraceStart, onTraceStep])

  // 键盘快捷键
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }, [handleSubmit])


  return (
    <div className='flex h-full gap-6 p-4 overflow-hidden'>
      {/* 主聊天区 */}
      <div className='flex flex-1 flex-col min-h-0'>
        {/* 顶部工具栏 */}
        <div className='mb-4 flex items-center justify-between flex-shrink-0'>
          <div className='flex items-center gap-3'>
            <h2 className='text-lg font-medium'>对话测试</h2>
          </div>
          <div className='flex items-center gap-1'>
            <Button variant='ghost' size='sm' onClick={() => setShowSettings(!showSettings)}>
              <Settings2 className='mr-1 h-4 w-4' />
              设置
            </Button>
            <Button variant='ghost' size='sm' onClick={handleClear} disabled={messages.length === 0}>
              <Trash2 className='mr-1 h-4 w-4' />
              清空
            </Button>
          </div>
        </div>

        {/* 消息列表 */}
        <ScrollArea className='flex-1 min-h-0' ref={scrollRef} onScrollCapture={handleScroll}>
          <div className='space-y-6 pb-4 pr-4'>
            {messages.length === 0 && (
              <EmptyState onQuickAction={(prompt) => {
                setInputValue(prompt)
                inputRef.current?.focus()
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
          </div>
        </ScrollArea>

        {/* 输入区 */}
        <div className='mt-4 space-y-2 flex-shrink-0'>
          {error && (
            <div className='rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive'>
              {error.message}
            </div>
          )}
          
          {isLoading && (
            <div className='flex justify-center'>
              <Button variant='outline' size='sm' onClick={stop}>
                <StopCircle className='mr-1 h-4 w-4' />
                停止生成
              </Button>
            </div>
          )}
          {!isLoading && error && (
            <div className='flex justify-center'>
              <Button variant='outline' size='sm' onClick={() => regenerate()}>
                <RotateCcw className='mr-1 h-4 w-4' />
                重试
              </Button>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className='flex gap-2'>
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='输入测试文本，如：明晚观音桥打麻将，3缺1'
              disabled={isLoading}
              className='flex-1'
            />
            <Button type='submit' disabled={!inputValue.trim() || isLoading}>
              {isLoading ? <Loader2 className='h-4 w-4 animate-spin' /> : <Send className='h-4 w-4' />}
            </Button>
          </form>
        </div>
      </div>


      {/* 设置面板 */}
      {showSettings && (
        <div className='w-80 shrink-0 border-l pl-6'>
          <h3 className='mb-4 text-sm font-medium'>模型参数</h3>
          
          {/* Temperature */}
          <div className='space-y-3'>
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <Label className='text-xs'>Temperature</Label>
                <span className='text-xs text-muted-foreground'>{temperature}</span>
              </div>
              <Slider
                value={[temperature]}
                onValueChange={([v]) => setTemperature(v)}
                min={0}
                max={2}
                step={0.1}
                className='w-full'
              />
              <p className='text-xs text-muted-foreground'>
                越低越确定，越高越随机。Tool 调用建议 0。
              </p>
            </div>
            
            {/* Max Tokens */}
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <Label className='text-xs'>Max Tokens</Label>
                <span className='text-xs text-muted-foreground'>{maxTokens}</span>
              </div>
              <Slider
                value={[maxTokens]}
                onValueChange={([v]) => setMaxTokens(v)}
                min={256}
                max={8192}
                step={256}
                className='w-full'
              />
              <p className='text-xs text-muted-foreground'>
                最大输出 Token 数。
              </p>
            </div>
          </div>
          
          <div className='mt-6 rounded-lg bg-muted/50 p-3'>
            <p className='text-xs text-muted-foreground'>
              <strong>注意</strong>：Tool 调用会写入数据库。测试产生的活动可以在活动管理页面删除。
            </p>
          </div>
          
          <div className='mt-4'>
            <p className='text-xs text-muted-foreground'>
              查看当前 System Prompt：
              <a href='/ai-ops/prompt-viewer' className='ml-1 text-primary hover:underline'>
                Prompt 查看器 →
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}


// 空状态组件 - 像 AI 消息一样左对齐
function EmptyState({ onQuickAction }: { onQuickAction: (prompt: string) => void }) {
  const { data: welcomeData, isLoading } = useQuery({
    queryKey: ['ai', 'welcome', 'playground'],
    queryFn: () => unwrap(api.ai.welcome.get({})), // 不传位置，让 AI 主动询问
  })

  if (isLoading) {
    return (
      <div className='flex gap-3'>
        <Skeleton className='h-8 w-8 rounded-full' />
        <div className='space-y-2'>
          <Skeleton className='h-4 w-48' />
          <Skeleton className='h-20 w-80' />
        </div>
      </div>
    )
  }

  return (
    <div className='flex gap-3'>
      {/* AI 头像 */}
      <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted'>
        <Bot className='h-4 w-4' />
      </div>

      {/* 欢迎消息内容 */}
      <div className='flex max-w-[85%] flex-col gap-3'>
        {/* 问候语 */}
        <div className='rounded-lg bg-muted px-3 py-2 text-sm'>
          <p>{welcomeData?.greeting || 'Hi，我是小聚，你的 AI 活动助理。'}</p>
          <p className='mt-1 text-muted-foreground'>
            {welcomeData?.fallbackPrompt || '今天想玩点什么，告诉我！～'}
          </p>
        </div>

        {/* 快捷操作 */}
        {welcomeData?.quickActions && welcomeData.quickActions.length > 0 && (
          <div className='space-y-1.5'>
            {welcomeData.quickActions.map((action, index) => (
              <Button
                key={index}
                variant='outline'
                size='sm'
                className='justify-start gap-2 text-left'
                onClick={() => {
                  const context = action.context as Record<string, unknown>
                  if (action.type === 'explore_nearby') {
                    onQuickAction(`看看${context.locationName || '附近'}有什么活动`)
                  } else if (action.type === 'continue_draft') {
                    onQuickAction(`继续编辑「${context.activityTitle || '草稿'}」`)
                  } else if (action.type === 'find_partner') {
                    onQuickAction(String(context.suggestedPrompt || '想找人一起玩'))
                  }
                }}
              >
                {action.type === 'explore_nearby' && <Search className='h-3.5 w-3.5 text-green-500' />}
                {action.type === 'continue_draft' && <FileEdit className='h-3.5 w-3.5 text-blue-500' />}
                {action.type === 'find_partner' && <MessageSquare className='h-3.5 w-3.5 text-purple-500' />}
                <span className='text-xs'>{action.label}</span>
              </Button>
            ))}
          </div>
        )}

        {/* 示例提示 */}
        <div className='flex flex-wrap gap-1.5'>
          {['明晚观音桥打麻将，3缺1', '周末想吃火锅', '附近有什么活动'].map((example) => (
            <Button
              key={example}
              variant='ghost'
              size='sm'
              className='h-auto rounded-full border bg-background px-2.5 py-1 text-xs hover:bg-muted'
              onClick={() => onQuickAction(example)}
            >
              {example}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}


// Tool Part 类型
interface ToolPartData {
  type: string
  toolCallId: string
  toolName?: string
  state: 'input-streaming' | 'input-available' | 'output-available' | 'output-error'
  input?: unknown
  output?: unknown
  errorText?: string
}

// 消息项组件
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

  // Debug: 打印消息结构
  console.log('MessageItem:', { 
    role: message.role, 
    parts: message.parts,
    content: (message as any).content,
  })

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
        {textContent && (
          <div
            className={cn(
              'rounded-lg px-3 py-2 text-sm',
              isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
            )}
          >
            {isStreaming ? (
              <StreamingText content={textContent} isStreaming={true} />
            ) : (
              <p className='whitespace-pre-wrap'>{textContent}</p>
            )}
          </div>
        )}

        {/* 流式结束后才展示 widget */}
        {!isStreaming && toolParts.length > 0 && (
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


// Tool Call 卡片 - 简化版，只显示 widget 预览（调试信息在执行追踪面板）
function ToolCallCard({ toolPart, onSendMessage }: { toolPart: ToolPartData; onSendMessage?: (text: string) => void }) {
  const toolName = toolPart.type === 'dynamic-tool' 
    ? (toolPart.toolName || 'unknown')
    : getToolName(toolPart as Parameters<typeof getToolName>[0])

  // 加载中状态
  if (toolPart.state === 'input-streaming' || toolPart.state === 'input-available') {
    return (
      <div className='flex items-center gap-2 text-sm text-muted-foreground'>
        <Loader2 className='h-3.5 w-3.5 animate-spin' />
        <span>{getToolDisplayName(toolName)}...</span>
      </div>
    )
  }

  // 错误状态
  if (toolPart.state === 'output-error') {
    return (
      <div className='rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive'>
        {toolPart.errorText || '操作失败，请重试'}
      </div>
    )
  }

  // 成功状态 - 只渲染 widget 预览
  return <ToolPreview toolPart={toolPart} onSendMessage={onSendMessage} />
}


// Tool 预览组件 - 友好展示 Tool 调用结果
function ToolPreview({ toolPart, onSendMessage }: { toolPart: ToolPartData; onSendMessage?: (text: string) => void }) {
  const toolName = toolPart.type === 'dynamic-tool' 
    ? (toolPart.toolName || 'unknown')
    : getToolName(toolPart as Parameters<typeof getToolName>[0])

  const input = toolPart.input as Record<string, unknown> | undefined
  const output = toolPart.output as Record<string, unknown> | undefined

  // 辅助函数：安全转换为字符串
  const str = (val: unknown): string => String(val ?? '')

  // askPreference 预览 - 只显示选项按钮（问题文字由 AI 文本输出）
  if (toolName === 'askPreference') {
    const options = (input?.options || []) as Array<{ label: string; value: string }>
    const allowSkip = input?.allowSkip !== false

    return (
      <div className='space-y-3 text-sm'>
        {/* 选项按钮 */}
        {options.length > 0 && (
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
          </div>
        )}
        
        {/* 跳过按钮 */}
        {allowSkip && (
          <div 
            className='rounded-full border border-dashed bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground cursor-pointer hover:bg-muted transition-colors inline-block'
            onClick={() => onSendMessage?.('都可以，你随便推荐')}
          >
            都可以，你随便推荐
          </div>
        )}
      </div>
    )
  }

  // createActivityDraft 预览 - 简化为确认按钮（详情在执行追踪面板）
  if (toolName === 'createActivityDraft') {
    return (
      <div className='space-y-3 text-sm'>
        {/* 确认按钮 */}
        {toolPart.state === 'output-available' && (
          <div className='flex flex-wrap gap-2'>
            <div 
              className='rounded-full border bg-primary/10 px-3 py-1.5 text-xs text-primary hover:bg-primary/20 cursor-pointer transition-colors'
              onClick={() => onSendMessage?.('没问题，就这样发布吧')}
            >
              没问题，就这样！
            </div>
            <div 
              className='rounded-full border border-dashed bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted cursor-pointer transition-colors'
              onClick={() => onSendMessage?.('不对，帮我修改')}
            >
              不对，帮我修改
            </div>
          </div>
        )}
      </div>
    )
  }

  // refineDraft 预览 - 简化为确认按钮
  if (toolName === 'refineDraft') {
    return (
      <div className='space-y-3 text-sm'>
        {/* 确认按钮 */}
        {toolPart.state === 'output-available' && (
          <div className='flex flex-wrap gap-2'>
            <div 
              className='rounded-full border bg-primary/10 px-3 py-1.5 text-xs text-primary hover:bg-primary/20 cursor-pointer transition-colors'
              onClick={() => onSendMessage?.('没问题，就这样发布吧')}
            >
              没问题，就这样！
            </div>
            <div 
              className='rounded-full border border-dashed bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted cursor-pointer transition-colors'
              onClick={() => onSendMessage?.('还要改')}
            >
              还要改
            </div>
          </div>
        )}
      </div>
    )
  }

  // exploreNearby 预览
  if (toolName === 'exploreNearby') {
    const activities = (output?.activities || []) as Array<Record<string, unknown>>
    const searchType = input?.type ? str(input.type) : null
    const locationName = input?.center && typeof input.center === 'object' 
      ? str((input.center as Record<string, unknown>).name || '') 
      : ''

    // 根据类型生成创建提示
    const getCreatePrompt = () => {
      const typeMap: Record<string, string> = {
        food: '美食局',
        entertainment: '娱乐局', 
        sports: '运动局',
        boardgame: '桌游局',
      }
      const typeName = searchType ? typeMap[searchType] || '活动' : '活动'
      const location = locationName ? `在${locationName}` : ''
      return `帮我${location}组一个${typeName}`
    }

    return (
      <div className='space-y-3 text-sm'>
        {toolPart.state === 'output-available' && (
          <>
            {activities.length > 0 ? (
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
            ) : (
              /* 无结果时显示创建按钮 */
              <div 
                className='rounded-full border bg-primary/10 px-3 py-1.5 text-xs text-primary hover:bg-primary/20 cursor-pointer transition-colors inline-block'
                onClick={() => onSendMessage?.(getCreatePrompt())}
              >
                帮我组一个 ✨
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  // publishActivity 预览
  if (toolName === 'publishActivity') {
    return (
      <div className='rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-300'>
        ✓ 活动已发布，快去分享给朋友吧！
      </div>
    )
  }

  // 默认预览 - 简洁显示
  return (
    <div className='text-xs text-muted-foreground'>
      {toolPart.state === 'output-available' ? '✓ 完成' : '处理中...'}
    </div>
  )
}
