// Playground Chat - v3.4 使用 useChat + Data Stream Protocol
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
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { DraftInspector } from './inspectors/draft-inspector'
import { ExploreInspector } from './inspectors/explore-inspector'
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
  FlaskConical,
  Sparkles,
  Search,
  MessageSquare,
} from 'lucide-react'
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
  const [showSettings, setShowSettings] = useState(false)
  const [sandboxMode, setSandboxMode] = useState(true) // 默认沙盒模式
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [inputValue, setInputValue] = useState('')
  
  // 余额状态
  const [balance, setBalance] = useState<BalanceResponse | null>(null)
  const [balanceLoading, setBalanceLoading] = useState(false)

  // 创建 transport（v3 新 API）- 传递 sandboxMode
  const transport = useMemo(() => new DefaultChatTransport({
    api: `${API_BASE_URL}/ai/chat`,
    body: { 
      source: 'admin',
      sandboxMode, // 沙盒模式：使用完整 prompt 但不写数据库
    },
  }), [sandboxMode])

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

  // 切换沙盒模式时清空对话
  const handleSandboxToggle = useCallback((checked: boolean) => {
    setSandboxMode(checked)
    setMessages([]) // 切换模式时清空对话
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
            {/* 沙盒模式标识 */}
            <Badge variant={sandboxMode ? 'secondary' : 'destructive'} className='text-xs'>
              <FlaskConical className='mr-1 h-3 w-3' />
              {sandboxMode ? '沙盒模式' : '生产模式'}
            </Badge>
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
            {messages.length === 0 && (
              <EmptyState onQuickAction={(prompt) => {
                setInputValue(prompt)
                inputRef.current?.focus()
              }} />
            )}
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
          <h3 className='mb-4 text-sm font-medium'>运行模式</h3>
          
          {/* 沙盒模式开关 */}
          <div className='flex items-center justify-between rounded-lg border p-3'>
            <div className='space-y-0.5'>
              <Label htmlFor='sandbox-mode' className='text-sm font-medium'>
                沙盒模式
              </Label>
              <p className='text-xs text-muted-foreground'>
                {sandboxMode 
                  ? 'Tool 调用不写入数据库' 
                  : '⚠️ Tool 调用会写入生产数据库'}
              </p>
            </div>
            <Switch
              id='sandbox-mode'
              checked={sandboxMode}
              onCheckedChange={handleSandboxToggle}
            />
          </div>
          
          <div className='mt-4 rounded-lg bg-muted/50 p-3'>
            <p className='text-xs text-muted-foreground'>
              <strong>沙盒模式</strong>：使用完整的 System Prompt 和 Tools，但 Tool 执行结果不会写入数据库。适合测试 AI 解析能力。
            </p>
            <p className='mt-2 text-xs text-muted-foreground'>
              <strong>生产模式</strong>：与小程序完全一致，Tool 调用会真实写入数据库。适合端到端测试。
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

// 空状态 - 显示欢迎卡片
function EmptyState({ onQuickAction }: { onQuickAction: (prompt: string) => void }) {
  // 获取欢迎卡片数据
  const { data: welcomeData, isLoading } = useQuery({
    queryKey: ['ai', 'welcome', 'playground'],
    queryFn: () => unwrap(api.ai.welcome.get({ query: { lat: 29.5630, lng: 106.5516 } })),
  })

  if (isLoading) {
    return (
      <div className='space-y-4 p-4'>
        <Skeleton className='h-8 w-48' />
        <Skeleton className='h-12 w-full' />
        <Skeleton className='h-12 w-full' />
        <Skeleton className='h-4 w-64' />
      </div>
    )
  }

  return (
    <Card className='mx-auto max-w-md border-primary/20 bg-gradient-to-br from-primary/5 to-transparent'>
      <CardContent className='p-6'>
        {/* 问候语 */}
        <div className='mb-4 flex items-start gap-3'>
          <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10'>
            <Sparkles className='h-5 w-5 text-primary' />
          </div>
          <div>
            <h3 className='text-lg font-semibold'>
              {welcomeData?.greeting || 'Hi，我是小聚，你的 AI 活动助理。'}
            </h3>
          </div>
        </div>

        {/* 快捷按钮 */}
        {welcomeData?.quickActions && welcomeData.quickActions.length > 0 && (
          <div className='mb-4 space-y-2'>
            {welcomeData.quickActions.map((action, index) => (
              <Button
                key={index}
                variant='outline'
                className='w-full justify-start gap-2 text-left'
                onClick={() => {
                  // 根据按钮类型生成对应的 prompt
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
                {action.type === 'explore_nearby' && <Search className='h-4 w-4 text-green-500' />}
                {action.type === 'continue_draft' && <FileEdit className='h-4 w-4 text-blue-500' />}
                {action.type === 'find_partner' && <MessageSquare className='h-4 w-4 text-purple-500' />}
                <span>{action.label}</span>
              </Button>
            ))}
          </div>
        )}

        {/* 兜底提示 */}
        <p className='text-sm text-muted-foreground'>
          {welcomeData?.fallbackPrompt || '或者还有什么想法，今天想玩点什么，告诉我！～'}
        </p>

        {/* 示例提示 */}
        <div className='mt-4 rounded-lg bg-muted/50 p-3'>
          <p className='text-xs font-medium text-muted-foreground'>💡 试试这些：</p>
          <div className='mt-2 flex flex-wrap gap-2'>
            {['明晚观音桥打麻将，3缺1', '周末想吃火锅', '附近有什么活动'].map((example) => (
              <Button
                key={example}
                variant='ghost'
                size='sm'
                className='h-auto px-2 py-1 text-xs'
                onClick={() => onQuickAction(example)}
              >
                {example}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
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
