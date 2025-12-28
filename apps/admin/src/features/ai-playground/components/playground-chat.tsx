// Playground Chat Component - 使用 Vercel AI SDK
import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible'
import { 
  Send, 
  Trash2, 
  Settings2, 
  ChevronUp,
  Bot,
  User,
  Loader2,
  Copy,
  Check,
  Eye,
} from 'lucide-react'
import { usePlayground } from './playground-provider'
import { InspectorRenderer } from './inspectors'
import { cn } from '@/lib/utils'

// 消息类型定义
interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  messageType?: string // widget_draft, widget_explore, text, etc.
  data?: any // 解析结果
}

// API 基础 URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export function PlaygroundChat() {
  const { settings, updateSettings, resetSettings } = usePlayground()
  const [showSettings, setShowSettings] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 使用自定义状态管理（因为我们的 API 是自定义 SSE 格式）
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // 发送消息
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setError(null)

    try {
      // 调用 AI 解析 API (SSE)
      const response = await fetch(`${API_BASE_URL}/ai/parse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 注意：实际使用时需要添加 JWT token
          // 'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ text: input.trim() }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      // 处理 SSE 流
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantContent = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))
                
                if (data.type === 'chunk') {
                  assistantContent += data.content
                  // 更新消息（流式）
                  setMessages((prev) => {
                    const lastMsg = prev[prev.length - 1]
                    if (lastMsg?.role === 'assistant') {
                      return [
                        ...prev.slice(0, -1),
                        { ...lastMsg, content: assistantContent },
                      ]
                    }
                    return [
                      ...prev,
                      {
                        id: `assistant-${Date.now()}`,
                        role: 'assistant',
                        content: assistantContent,
                      },
                    ]
                  })
                } else if (data.type === 'done') {
                  // 完成，添加解析结果
                  if (data.result) {
                    setMessages((prev) => {
                      const lastMsg = prev[prev.length - 1]
                      if (lastMsg?.role === 'assistant') {
                        return [
                          ...prev.slice(0, -1),
                          { 
                            ...lastMsg, 
                            content: assistantContent,
                            data: data.result, // 存储解析结果
                          },
                        ]
                      }
                      return prev
                    })
                  }
                } else if (data.type === 'error') {
                  setError(data.msg || 'AI 解析失败')
                }
              } catch {
                // 忽略解析错误
              }
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '请求失败')
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  // 清空对话
  const handleClear = () => {
    setMessages([])
    setError(null)
  }

  return (
    <div className='flex h-[calc(100vh-8rem)] gap-4'>
      {/* 主聊天区域 */}
      <Card className='flex flex-1 flex-col'>
        <CardHeader className='flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-base font-medium'>对话测试</CardTitle>
          <div className='flex items-center gap-2'>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings2 className='mr-1 h-4 w-4' />
              设置
            </Button>
            <Button
              variant='ghost'
              size='sm'
              onClick={handleClear}
              disabled={messages.length === 0}
            >
              <Trash2 className='mr-1 h-4 w-4' />
              清空
            </Button>
          </div>
        </CardHeader>

        <CardContent className='flex flex-1 flex-col gap-4 overflow-hidden p-4'>
          {/* 消息列表 */}
          <ScrollArea className='flex-1 pr-4' ref={scrollRef}>
            <div className='space-y-4'>
              {messages.length === 0 && (
                <div className='flex h-32 items-center justify-center text-muted-foreground'>
                  发送消息开始测试 AI 解析
                </div>
              )}
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {isLoading && (
                <div className='flex items-center gap-2 text-muted-foreground'>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  <span>AI 正在思考...</span>
                </div>
              )}
              {error && (
                <div className='rounded-md bg-destructive/10 p-3 text-sm text-destructive'>
                  {error}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* 输入框 */}
          <form onSubmit={handleSubmit} className='flex gap-2'>
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='输入测试文本，如：明晚观音桥打麻将，3缺1'
              disabled={isLoading}
              className='flex-1'
            />
            <Button type='submit' disabled={!input.trim() || isLoading}>
              <Send className='h-4 w-4' />
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 设置面板 */}
      {showSettings && (
        <Card className='w-80 shrink-0'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-base font-medium'>System Prompt</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <Textarea
              value={settings.systemPrompt}
              onChange={(e) => updateSettings({ systemPrompt: e.target.value })}
              placeholder='输入系统提示词...'
              className='min-h-[200px] text-sm'
            />
            <div className='flex justify-end gap-2'>
              <Button variant='outline' size='sm' onClick={resetSettings}>
                重置
              </Button>
            </div>
            <p className='text-xs text-muted-foreground'>
              注意：System Prompt 修改仅在本地生效，不会影响生产环境。
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// 消息气泡组件
function MessageBubble({ message }: { message: ChatMessage }) {
  const [copied, setCopied] = useState(false)
  const [showInspector, setShowInspector] = useState(false)
  const isUser = message.role === 'user'

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // 判断是否有可检查的数据
  const hasInspectableData = !isUser && (message.data || message.messageType)

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

      {/* 消息内容 */}
      <div className={cn('flex max-w-[80%] flex-col gap-1', isUser && 'items-end')}>
        <div
          className={cn(
            'rounded-lg px-3 py-2 text-sm',
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted'
          )}
        >
          <p className='whitespace-pre-wrap'>{message.content}</p>
        </div>

        {/* Inspector 面板（仅 AI 消息且有数据时显示） */}
        {hasInspectableData && (
          <Collapsible open={showInspector} onOpenChange={setShowInspector}>
            <CollapsibleTrigger asChild>
              <Button variant='ghost' size='sm' className='h-6 px-2 text-xs'>
                {showInspector ? (
                  <>
                    <ChevronUp className='mr-1 h-3 w-3' />
                    收起 Inspector
                  </>
                ) : (
                  <>
                    <Eye className='mr-1 h-3 w-3' />
                    查看 Inspector
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className='mt-2 w-full min-w-[300px]'>
                <InspectorRenderer
                  type={message.messageType || 'text'}
                  content={message.data || { text: message.content }}
                  showRawJson={true}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* 操作按钮 */}
        <div className='flex gap-1'>
          <Button
            variant='ghost'
            size='sm'
            className='h-6 w-6 p-0'
            onClick={handleCopy}
          >
            {copied ? (
              <Check className='h-3 w-3 text-green-500' />
            ) : (
              <Copy className='h-3 w-3' />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
