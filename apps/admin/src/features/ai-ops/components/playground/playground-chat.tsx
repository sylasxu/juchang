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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Send, Trash2, Settings2, Bot, User, Loader2, Copy, Check,
  Wrench, ChevronDown, ChevronRight, MapPin, FileEdit,
  RotateCcw, StopCircle, Search, MessageSquare,
  Calendar, Users, Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { StreamingText } from '../shared/streaming-text'
import type { TraceStep, TraceStatus } from '../../types/trace'
import { getToolDisplayName } from '../../types/trace'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'


interface PlaygroundChatProps {
  /** 追踪开始回调 */
  onTraceStart?: (requestId: string, startedAt: string) => void
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

  // 创建 transport
  // 默认使用观音桥位置进行测试
  const transport = useMemo(() => new DefaultChatTransport({
    api: `${API_BASE_URL}/ai/chat`,
    body: { 
      source: 'admin',
      trace: true, // v3.5: 启用执行追踪
      location: [106.5516, 29.5630], // 观音桥坐标 [lng, lat]
    },
  }), [])

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
          const data = part.data as { requestId: string; startedAt: string }
          onTraceStart?.(data.requestId, data.startedAt)
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

  // 键盘快捷键
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }, [handleSubmit])


  return (
    <div className='flex h-full gap-6 p-4'>
      {/* 主聊天区 */}
      <div className='flex flex-1 flex-col'>
        {/* 顶部工具栏 */}
        <div className='mb-4 flex items-center justify-between'>
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
        <ScrollArea className='flex-1' ref={scrollRef} onScrollCapture={handleScroll}>
          <div className='space-y-6 pb-4 pr-4'>
            {messages.length === 0 && (
              <EmptyState onQuickAction={(prompt) => {
                setInputValue(prompt)
                inputRef.current?.focus()
              }} />
            )}
            {messages.map((message) => (
              <MessageItem 
                key={message.id} 
                message={message}
                isStreaming={isLoading && message.role === 'assistant'}
                onClick={() => onMessageSelect?.(message.id)}
              />
            ))}
          </div>
        </ScrollArea>

        {/* 输入区 */}
        <div className='mt-4 space-y-2'>
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
          <h3 className='mb-4 text-sm font-medium'>设置</h3>
          
          <div className='rounded-lg bg-muted/50 p-3'>
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
    queryFn: () => unwrap(api.ai.welcome.get({ query: { lat: 29.5630, lng: 106.5516 } })),
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
}: { 
  message: UIMessage
  isStreaming?: boolean
  onClick?: () => void
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

        {toolParts.length > 0 && (
          <div className='w-full space-y-2'>
            {toolParts.map((part) => (
              <ToolCallCard key={part.toolCallId} toolPart={part} />
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


// Tool Call 卡片
function ToolCallCard({ toolPart }: { toolPart: ToolPartData }) {
  const [expanded, setExpanded] = useState(true)
  const [copiedTab, setCopiedTab] = useState<string | null>(null)
  
  const toolName = toolPart.type === 'dynamic-tool' 
    ? (toolPart.toolName || 'unknown')
    : getToolName(toolPart as Parameters<typeof getToolName>[0])

  const handleCopyJson = async (data: unknown, tab: string) => {
    await navigator.clipboard.writeText(JSON.stringify(data, null, 2))
    setCopiedTab(tab)
    setTimeout(() => setCopiedTab(null), 2000)
  }

  const getToolIcon = () => {
    switch (toolName) {
      case 'createActivityDraft':
        return <FileEdit className='h-4 w-4 text-blue-500' />
      case 'exploreNearby':
        return <MapPin className='h-4 w-4 text-green-500' />
      default:
        return <Wrench className='h-4 w-4 text-muted-foreground' />
    }
  }

  const getStateLabel = () => {
    switch (toolPart.state) {
      case 'input-streaming':
        return <Badge variant='outline' className='text-xs text-yellow-600'>解析中...</Badge>
      case 'input-available':
        return <Badge variant='outline' className='text-xs text-blue-600'>调用中...</Badge>
      case 'output-available':
        return <Badge variant='outline' className='text-xs text-green-600'>✓ 完成</Badge>
      case 'output-error':
        return <Badge variant='outline' className='text-xs text-red-600'>✗ 错误</Badge>
      default:
        return null
    }
  }

  const hasOutput = toolPart.state === 'output-available' || toolPart.state === 'output-error'

  return (
    <div className='rounded-lg border bg-background'>
      <button
        onClick={() => setExpanded(!expanded)}
        className='flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/50'
      >
        {expanded ? (
          <ChevronDown className='h-3 w-3 text-muted-foreground' />
        ) : (
          <ChevronRight className='h-3 w-3 text-muted-foreground' />
        )}
        {getToolIcon()}
        <span className='font-medium'>{getToolDisplayName(toolName)}</span>
        <span className='ml-auto'>{getStateLabel()}</span>
      </button>

      {expanded && (
        <div className='border-t px-3 py-2'>
          <Tabs defaultValue='preview' className='w-full'>
            <TabsList className='h-7 w-full justify-start bg-transparent p-0'>
              <TabsTrigger value='preview' className='h-6 text-xs'>预览</TabsTrigger>
              <TabsTrigger value='input' className='h-6 text-xs'>参数</TabsTrigger>
              {hasOutput && <TabsTrigger value='output' className='h-6 text-xs'>结果</TabsTrigger>}
            </TabsList>

            <TabsContent value='preview' className='mt-2'>
              <ToolPreview toolPart={toolPart} />
            </TabsContent>

            <TabsContent value='input' className='mt-2'>
              <div className='relative'>
                <pre className='overflow-auto rounded bg-muted p-2 text-xs'>
                  {JSON.stringify(toolPart.input, null, 2)}
                </pre>
                <Button
                  variant='ghost'
                  size='sm'
                  className='absolute right-1 top-1 h-6 w-6 p-0'
                  onClick={() => handleCopyJson(toolPart.input, 'input')}
                >
                  {copiedTab === 'input' ? <Check className='h-3 w-3 text-green-500' /> : <Copy className='h-3 w-3' />}
                </Button>
              </div>
            </TabsContent>

            {hasOutput && (
              <TabsContent value='output' className='mt-2'>
                <div className='relative'>
                  {toolPart.state === 'output-error' ? (
                    <div className='rounded bg-red-50 p-2 text-xs text-red-600'>
                      {toolPart.errorText || '未知错误'}
                    </div>
                  ) : (
                    <pre className='overflow-auto rounded bg-muted p-2 text-xs'>
                      {JSON.stringify(toolPart.output, null, 2)}
                    </pre>
                  )}
                  {toolPart.state === 'output-available' && (
                    <Button
                      variant='ghost'
                      size='sm'
                      className='absolute right-1 top-1 h-6 w-6 p-0'
                      onClick={() => handleCopyJson(toolPart.output, 'output')}
                    >
                      {copiedTab === 'output' ? <Check className='h-3 w-3 text-green-500' /> : <Copy className='h-3 w-3' />}
                    </Button>
                  )}
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      )}
    </div>
  )
}


// Tool 预览组件 - 友好展示 Tool 调用结果
function ToolPreview({ toolPart }: { toolPart: ToolPartData }) {
  const toolName = toolPart.type === 'dynamic-tool' 
    ? (toolPart.toolName || 'unknown')
    : getToolName(toolPart as Parameters<typeof getToolName>[0])

  const input = toolPart.input as Record<string, unknown> | undefined
  const output = toolPart.output as Record<string, unknown> | undefined

  // 辅助函数：安全转换为字符串
  const str = (val: unknown): string => String(val ?? '')
  const truncateId = (val: unknown): string => str(val).slice(0, 8)

  // askPreference 预览 - 显示问题和选项按钮
  if (toolName === 'askPreference') {
    const question = str(input?.question || '请选择你的偏好')
    const questionType = input?.questionType as string | undefined
    const options = (input?.options || []) as Array<{ label: string; value: string }>
    const allowSkip = input?.allowSkip !== false

    return (
      <div className='space-y-3 text-sm'>
        <div className='flex items-center gap-2'>
          <MessageSquare className='h-4 w-4 text-purple-500' />
          <span className='font-medium'>
            {questionType === 'location' ? '询问位置偏好' : '询问类型偏好'}
          </span>
        </div>
        
        {/* 问题文本 */}
        <div className='rounded-lg bg-purple-50 p-3 text-purple-900 dark:bg-purple-950 dark:text-purple-100'>
          {question}
        </div>
        
        {/* 选项按钮 */}
        {options.length > 0 && (
          <div className='flex flex-wrap gap-2'>
            {options.map((option, i) => (
              <div
                key={i}
                className='rounded-full border bg-background px-3 py-1 text-xs'
              >
                {option.label}
              </div>
            ))}
          </div>
        )}
        
        {/* 跳过按钮 */}
        {allowSkip && (
          <div className='text-xs text-muted-foreground'>
            + "都可以，你随便推荐" 按钮
          </div>
        )}
        
        {toolPart.state === 'output-available' && (
          <div className='mt-2 rounded bg-green-50 p-2 text-xs text-green-700 dark:bg-green-950 dark:text-green-300'>
            ✓ 已发送询问
          </div>
        )}
      </div>
    )
  }

  // createActivityDraft 预览
  if (toolName === 'createActivityDraft') {
    const title = str(input?.title || '未命名活动')
    const type = input?.type ? str(input.type) : null
    const startAt = input?.startAt ? new Date(str(input.startAt)).toLocaleString('zh-CN') : null
    const location = input?.location ? str(input.location) : null
    const maxParticipants = input?.maxParticipants ? str(input.maxParticipants) : null
    const activityId = output?.activityId ? truncateId(output.activityId) : null

    return (
      <div className='space-y-2 text-sm'>
        <div className='flex items-center gap-2'>
          <FileEdit className='h-4 w-4 text-blue-500' />
          <span className='font-medium'>{title}</span>
        </div>
        {type && (
          <div className='flex items-center gap-2 text-muted-foreground'>
            <Badge variant='secondary' className='text-xs'>{type}</Badge>
          </div>
        )}
        {startAt && (
          <div className='flex items-center gap-2 text-muted-foreground'>
            <Calendar className='h-3.5 w-3.5' />
            <span className='text-xs'>{startAt}</span>
          </div>
        )}
        {location && (
          <div className='flex items-center gap-2 text-muted-foreground'>
            <MapPin className='h-3.5 w-3.5' />
            <span className='text-xs'>{location}</span>
          </div>
        )}
        {maxParticipants && (
          <div className='flex items-center gap-2 text-muted-foreground'>
            <Users className='h-3.5 w-3.5' />
            <span className='text-xs'>最多 {maxParticipants} 人</span>
          </div>
        )}
        {toolPart.state === 'output-available' && activityId && (
          <div className='mt-2 rounded bg-green-50 p-2 text-xs text-green-700'>
            ✓ 草稿已创建 (ID: {activityId}...)
          </div>
        )}
      </div>
    )
  }

  // exploreNearby 预览
  if (toolName === 'exploreNearby') {
    const activities = (output?.activities || []) as Array<Record<string, unknown>>
    const radius = input?.radius ? str(input.radius) : null

    return (
      <div className='space-y-2 text-sm'>
        <div className='flex items-center gap-2'>
          <MapPin className='h-4 w-4 text-green-500' />
          <span className='font-medium'>探索附近活动</span>
        </div>
        {radius && (
          <div className='text-xs text-muted-foreground'>
            搜索范围: {radius}km
          </div>
        )}
        {toolPart.state === 'output-available' && (
          <div className='mt-2 space-y-1'>
            {activities.length > 0 ? (
              activities.slice(0, 3).map((activity, i) => {
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
              })
            ) : (
              <div className='text-xs text-muted-foreground'>附近暂无活动</div>
            )}
            {activities.length > 3 && (
              <div className='text-xs text-muted-foreground'>
                还有 {activities.length - 3} 个活动...
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // refineDraft 预览
  if (toolName === 'refineDraft') {
    const activityId = input?.activityId ? truncateId(input.activityId) : null
    const updateFields = input?.updates ? Object.keys(input.updates as object).join(', ') : null

    return (
      <div className='space-y-2 text-sm'>
        <div className='flex items-center gap-2'>
          <FileEdit className='h-4 w-4 text-orange-500' />
          <span className='font-medium'>修改草稿</span>
        </div>
        {activityId && (
          <div className='text-xs text-muted-foreground'>
            活动 ID: {activityId}...
          </div>
        )}
        {updateFields && (
          <div className='text-xs text-muted-foreground'>
            更新字段: {updateFields}
          </div>
        )}
        {toolPart.state === 'output-available' && (
          <div className='mt-2 rounded bg-green-50 p-2 text-xs text-green-700'>
            ✓ 草稿已更新
          </div>
        )}
      </div>
    )
  }

  // publishActivity 预览
  if (toolName === 'publishActivity') {
    const activityId = input?.activityId ? truncateId(input.activityId) : null
    const errorText = toolPart.errorText || '未知错误'

    return (
      <div className='space-y-2 text-sm'>
        <div className='flex items-center gap-2'>
          <Clock className='h-4 w-4 text-purple-500' />
          <span className='font-medium'>发布活动</span>
        </div>
        {activityId && (
          <div className='text-xs text-muted-foreground'>
            活动 ID: {activityId}...
          </div>
        )}
        {toolPart.state === 'output-available' && (
          <div className='mt-2 rounded bg-green-50 p-2 text-xs text-green-700'>
            ✓ 活动已发布
          </div>
        )}
        {toolPart.state === 'output-error' && (
          <div className='mt-2 rounded bg-red-50 p-2 text-xs text-red-600'>
            发布失败: {errorText}
          </div>
        )}
      </div>
    )
  }

  // 默认预览 - 显示简化的 JSON
  const paramKeys = input && Object.keys(input).length > 0 ? Object.keys(input).join(', ') : null

  return (
    <div className='space-y-2 text-sm'>
      <div className='flex items-center gap-2'>
        <Wrench className='h-4 w-4 text-muted-foreground' />
        <span className='font-medium'>{getToolDisplayName(toolName)}</span>
      </div>
      {paramKeys && (
        <div className='text-xs text-muted-foreground'>
          参数: {paramKeys}
        </div>
      )}
      {toolPart.state === 'output-available' && (
        <div className='mt-2 rounded bg-green-50 p-2 text-xs text-green-700'>
          ✓ 执行完成
        </div>
      )}
    </div>
  )
}
