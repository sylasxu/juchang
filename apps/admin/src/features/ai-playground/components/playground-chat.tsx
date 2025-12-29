// Playground Chat - v3.4 使用 useChat + Data Stream Protocol
import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useChat, type UIMessage } from '@ai-sdk/react'
import { DefaultChatTransport, isToolUIPart, getToolName } from 'ai'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  Send, 
  Trash2, 
  Settings2, 
  Bot,
  User,
  Loader2,
  Copy,
  Check,
  Wrench,
  ChevronDown,
  ChevronRight,
  MapPin,
  FileEdit,
  Wallet,
  RefreshCw,
  RotateCcw,
  StopCircle,
} from 'lucide-react'
import { usePlayground } from './playground-provider'
import { cn } from '@/lib/utils'

// 余额类型
interface BalanceInfo {
  currency: string
  total_balance: string
  granted_balance: string
  topped_up_balance: string
}

interface BalanceResponse {
  is_available: boolean
  balance_infos: BalanceInfo[]
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

export function PlaygroundChat() {
  const { settings, updateSettings, resetSettings } = usePlayground()
  const [showSettings, setShowSettings] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [inputValue, setInputValue] = useState('')
  
  // 余额状态
  const [balance, setBalance] = useState<BalanceResponse | null>(null)
  const [balanceLoading, setBalanceLoading] = useState(false)

  // 创建 transport（v3 新 API）
  const transport = useMemo(() => new DefaultChatTransport({
    api: `${API_BASE_URL}/ai/chat`,
    body: { 
      source: 'admin',
    },
  }), [])

  // 使用 useChat hook（v3 新 API）
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
    onError: (err) => {
      console.error('AI Chat 错误:', err)
    },
  })

  const isLoading = status === 'submitted' || status === 'streaming'

  // 获取余额
  const fetchBalance = useCallback(async () => {
    setBalanceLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/ai/balance`)
      if (response.ok) {
        const data = await response.json()
        setBalance(data)
      }
    } catch (err) {
      console.error('获取余额失败:', err)
    } finally {
      setBalanceLoading(false)
    }
  }, [])

  // 初始加载余额
  useEffect(() => {
    fetchBalance()
  }, [fetchBalance])

  // 自动滚动
  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight
      }
    }
  }, [messages])

  // 清空对话
  const handleClear = useCallback(() => {
    setMessages([])
  }, [setMessages])

  // 发送消息
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading) return
    
    sendMessage({ text: inputValue.trim() })
    setInputValue('')
    inputRef.current?.focus()
  }, [inputValue, isLoading, sendMessage])

  // 键盘快捷键
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }, [handleSubmit])

  return (
    <div className='flex h-[calc(100vh-8rem)] gap-6'>
      {/* 主聊天区 */}
      <div className='flex flex-1 flex-col'>
        {/* 顶部工具栏 */}
        <div className='mb-4 flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <h2 className='text-lg font-medium'>对话测试</h2>
            {/* 余额显示 */}
            <div className='flex items-center gap-2'>
              <Wallet className='h-4 w-4 text-muted-foreground' />
              {balanceLoading ? (
                <Loader2 className='h-3 w-3 animate-spin' />
              ) : balance ? (
                <div className='flex items-center gap-1'>
                  <Badge variant={balance.is_available ? 'default' : 'destructive'} className='text-xs'>
                    ¥{balance.balance_infos?.[0]?.total_balance || '0'}
                  </Badge>
                  <Button variant='ghost' size='sm' className='h-6 w-6 p-0' onClick={fetchBalance}>
                    <RefreshCw className='h-3 w-3' />
                  </Button>
                </div>
              ) : (
                <span className='text-xs text-muted-foreground'>--</span>
              )}
            </div>
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
        <ScrollArea className='flex-1' ref={scrollRef}>
          <div className='space-y-6 pb-4 pr-4'>
            {messages.length === 0 && <EmptyState />}
            {messages.map((message) => (
              <MessageItem key={message.id} message={message} />
            ))}
          </div>
        </ScrollArea>

        {/* 输入区 */}
        <div className='mt-4 space-y-2'>
          {/* 错误提示 */}
          {error && (
            <div className='rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive'>
              {error.message}
            </div>
          )}
          
          {/* 操作按钮 */}
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
          
          {/* 输入框 */}
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
          <h3 className='mb-3 text-sm font-medium'>System Prompt</h3>
          <Textarea
            value={settings.systemPrompt}
            onChange={(e) => updateSettings({ systemPrompt: e.target.value })}
            placeholder='输入系统提示词...'
            className='min-h-[200px] text-sm'
          />
          <div className='mt-3 flex justify-end'>
            <Button variant='outline' size='sm' onClick={resetSettings}>
              重置
            </Button>
          </div>
          <p className='mt-3 text-xs text-muted-foreground'>
            注意：修改仅本地生效（MVP 阶段不支持覆盖服务端 Prompt）
          </p>
        </div>
      )}
    </div>
  )
}

// 空状态
function EmptyState() {
  return (
    <div className='flex h-40 items-center justify-center text-muted-foreground'>
      <div className='text-center'>
        <Bot className='mx-auto mb-2 h-8 w-8 opacity-50' />
        <p>发送消息测试 AI 解析</p>
        <p className='mt-1 text-xs'>试试：明晚观音桥打麻将，3缺1</p>
      </div>
    </div>
  )
}

// Tool Part 类型 (v6 API - 使用 SDK 提供的类型)
// ToolUIPart: type='tool-${name}', 有 toolCallId, state, input, output
// DynamicToolUIPart: type='dynamic-tool', 有 toolName, toolCallId, state, input, output
interface ToolPartData {
  type: string
  toolCallId: string
  toolName?: string // DynamicToolUIPart 才有
  state: 'input-streaming' | 'input-available' | 'output-available' | 'output-error'
  input?: unknown
  output?: unknown
  errorText?: string
}

// 消息项组件 - 使用 UIMessage 类型
function MessageItem({ message }: { message: UIMessage }) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'

  // 提取文本内容
  const textContent = message.parts
    ?.filter((part): part is { type: 'text'; text: string } => part.type === 'text')
    .map(part => part.text)
    .join('') || ''

  // 提取 tool 调用 (v6 API: 使用 isToolUIPart 辅助函数)
  const toolParts = (message.parts?.filter(part => isToolUIPart(part)) || []) as ToolPartData[]

  const handleCopy = async () => {
    await navigator.clipboard.writeText(textContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      {/* 头像 */}
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
        )}
      >
        {isUser ? <User className='h-4 w-4' /> : <Bot className='h-4 w-4' />}
      </div>

      {/* 内容 */}
      <div className={cn('flex max-w-[85%] flex-col gap-2', isUser && 'items-end')}>
        {/* 文本内容 */}
        {textContent && (
          <div
            className={cn(
              'rounded-lg px-3 py-2 text-sm',
              isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
            )}
          >
            <p className='whitespace-pre-wrap'>{textContent}</p>
          </div>
        )}

        {/* Tool Invocations */}
        {toolParts.length > 0 && (
          <div className='w-full space-y-2'>
            {toolParts.map((part) => (
              <ToolCallCard key={part.toolCallId} toolPart={part} />
            ))}
          </div>
        )}

        {/* 操作按钮 */}
        {!isUser && textContent && (
          <Button
            variant='ghost'
            size='sm'
            className='h-6 w-6 p-0 opacity-50 hover:opacity-100'
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

// Tool Call 卡片 (v6 API - 使用 SDK 辅助函数)
function ToolCallCard({ toolPart }: { toolPart: ToolPartData }) {
  const [expanded, setExpanded] = useState(true)
  const [copiedTab, setCopiedTab] = useState<string | null>(null)
  
  // 使用 SDK 的 getToolName 函数获取工具名
  // 对于 ToolUIPart: type='tool-xxx' → 返回 'xxx'
  // 对于 DynamicToolUIPart: type='dynamic-tool' → 返回 toolName 属性
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

  const getToolLabel = (): string => {
    switch (toolName) {
      case 'createActivityDraft':
        return '创建活动草稿'
      case 'exploreNearby':
        return '探索附近'
      default:
        return toolName
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
      {/* Header */}
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
        <span className='font-medium'>{getToolLabel()}</span>
        <span className='ml-auto'>{getStateLabel()}</span>
      </button>

      {/* Content */}
      {expanded && (
        <div className='border-t px-3 py-2'>
          <Tabs defaultValue='preview' className='w-full'>
            <TabsList className='h-7 w-full justify-start bg-transparent p-0'>
              <TabsTrigger value='preview' className='h-6 text-xs'>
                预览
              </TabsTrigger>
              <TabsTrigger value='input' className='h-6 text-xs'>
                参数
              </TabsTrigger>
              {hasOutput && (
                <TabsTrigger value='output' className='h-6 text-xs'>
                  结果
                </TabsTrigger>
              )}
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
                  {copiedTab === 'input' ? (
                    <Check className='h-3 w-3 text-green-500' />
                  ) : (
                    <Copy className='h-3 w-3' />
                  )}
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
                      {copiedTab === 'output' ? (
                        <Check className='h-3 w-3 text-green-500' />
                      ) : (
                        <Copy className='h-3 w-3' />
                      )}
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

// Tool 预览组件 (v6 API)
function ToolPreview({ toolPart }: { toolPart: ToolPartData }) {
  // 获取工具名
  const toolName = toolPart.type === 'dynamic-tool' 
    ? (toolPart.toolName || 'unknown')
    : getToolName(toolPart as Parameters<typeof getToolName>[0])
  
  if (toolName === 'createActivityDraft') {
    const draft = toolPart.input as {
      title?: string
      type?: string
      startAt?: string
      locationName?: string
      locationHint?: string
      maxParticipants?: number
    }
    
    const result = toolPart.output as { activityId?: string; success?: boolean } | undefined
    
    return (
      <div className='space-y-2 text-sm'>
        {result?.activityId && (
          <div className='flex items-center gap-2'>
            <span className='text-muted-foreground'>活动 ID</span>
            <code className='rounded bg-muted px-1 text-xs'>{result.activityId}</code>
          </div>
        )}
        {draft.title && (
          <div className='flex items-center gap-2'>
            <span className='text-muted-foreground'>标题</span>
            <span className='font-medium'>{draft.title}</span>
          </div>
        )}
        {draft.type && (
          <div className='flex items-center gap-2'>
            <span className='text-muted-foreground'>类型</span>
            <TypeBadge type={draft.type} />
          </div>
        )}
        {draft.startAt && (
          <div className='flex items-center gap-2'>
            <span className='text-muted-foreground'>时间</span>
            <span>{new Date(draft.startAt).toLocaleString('zh-CN')}</span>
          </div>
        )}
        {draft.locationName && (
          <div className='flex items-center gap-2'>
            <span className='text-muted-foreground'>地点</span>
            <span>{draft.locationName}</span>
            {draft.locationHint && (
              <span className='text-orange-500'>({draft.locationHint})</span>
            )}
          </div>
        )}
        {draft.maxParticipants && (
          <div className='flex items-center gap-2'>
            <span className='text-muted-foreground'>人数</span>
            <span>{draft.maxParticipants} 人</span>
          </div>
        )}
      </div>
    )
  }

  if (toolName === 'exploreNearby') {
    const input = toolPart.input as { center?: { name?: string; lat?: number; lng?: number }; type?: string; radius?: number }
    const result = toolPart.output as { explore?: { center?: { name?: string }; results?: unknown[]; title?: string } } | undefined
    
    return (
      <div className='space-y-2 text-sm'>
        {input.center?.name && (
          <div className='flex items-center gap-2'>
            <span className='text-muted-foreground'>搜索中心</span>
            <span>{input.center.name}</span>
          </div>
        )}
        {input.type && (
          <div className='flex items-center gap-2'>
            <span className='text-muted-foreground'>类型筛选</span>
            <TypeBadge type={input.type} />
          </div>
        )}
        {input.radius && (
          <div className='flex items-center gap-2'>
            <span className='text-muted-foreground'>搜索半径</span>
            <span>{input.radius / 1000} km</span>
          </div>
        )}
        {result?.explore?.results && (
          <div className='flex items-center gap-2'>
            <span className='text-muted-foreground'>找到</span>
            <Badge variant='secondary'>{result.explore.results.length} 个活动</Badge>
          </div>
        )}
        {result?.explore?.title && (
          <div className='mt-2 rounded bg-muted/50 p-2 text-xs'>
            {result.explore.title}
          </div>
        )}
      </div>
    )
  }

  return (
    <pre className='overflow-auto rounded bg-muted p-2 text-xs'>
      {JSON.stringify(toolPart.input, null, 2)}
    </pre>
  )
}

// 类型标签
function TypeBadge({ type }: { type: string }) {
  const config: Record<string, { label: string; className: string }> = {
    food: { label: '🍜 美食', className: 'bg-orange-100 text-orange-700' },
    entertainment: { label: '🎮 娱乐', className: 'bg-purple-100 text-purple-700' },
    sports: { label: '⚽ 运动', className: 'bg-green-100 text-green-700' },
    boardgame: { label: '🎲 桌游', className: 'bg-blue-100 text-blue-700' },
    other: { label: '📌 其他', className: 'bg-gray-100 text-gray-700' },
  }
  
  const { label, className } = config[type] || { label: type, className: 'bg-muted' }
  
  return (
    <span className={cn('inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium', className)}>
      {label}
    </span>
  )
}
