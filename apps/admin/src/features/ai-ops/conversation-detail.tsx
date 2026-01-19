// 对话详情页 - 显示会话消息和 Trace 信息
import { useState } from 'react'
import { useParams, Link } from '@tanstack/react-router'
import { ArrowLeft, User, Bot, ChevronDown, ChevronRight, ThumbsUp, ThumbsDown } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useConversationDetail, useEvaluateSession } from '@/hooks/use-conversations'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

// Bad Case 标签选项
const BAD_CASE_TAGS = [
  { value: 'wrong_intent', label: '意图识别错误' },
  { value: 'hallucination', label: 'AI 幻觉' },
  { value: 'tool_error', label: 'Tool 调用错误' },
  { value: 'bad_tone', label: '语气不当' },
  { value: 'incomplete', label: '回复不完整' },
]

// 消息类型映射
const MESSAGE_TYPES: Record<string, string> = {
  text: '文本',
  widget_dashboard: '欢迎卡片',
  widget_launcher: '发射台',
  widget_action: '快捷操作',
  widget_draft: '活动草稿',
  widget_share: '分享卡片',
  widget_explore: '探索卡片',
  widget_error: '错误',
  widget_ask_preference: '偏好询问',
}

// 消息类型颜色
const messageTypeColors: Record<string, string> = {
  text: 'bg-gray-100 text-gray-800',
  widget_dashboard: 'bg-blue-100 text-blue-800',
  widget_launcher: 'bg-purple-100 text-purple-800',
  widget_action: 'bg-cyan-100 text-cyan-800',
  widget_draft: 'bg-green-100 text-green-800',
  widget_share: 'bg-indigo-100 text-indigo-800',
  widget_explore: 'bg-orange-100 text-orange-800',
  widget_error: 'bg-red-100 text-red-800',
  widget_ask_preference: 'bg-yellow-100 text-yellow-800',
}

// v4.6: 解析 <thinking> 标签
function parseThinking(content: string): { thinking: string | null; output: string } {
  const thinkingMatch = content.match(/<thinking>([\s\S]*?)<\/thinking>/i)
  if (thinkingMatch) {
    const thinking = thinkingMatch[1].trim()
    const output = content.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '').trim()
    return { thinking, output }
  }
  return { thinking: null, output: content }
}

// v4.6: AI 思维链展示组件
function ThinkingBlock({ thinking }: { thinking: string }) {
  const [expanded, setExpanded] = useState(false)
  
  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <CollapsibleTrigger className='flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-2'>
        {expanded ? <ChevronDown className='h-4 w-4' /> : <ChevronRight className='h-4 w-4' />}
        <span>💭 AI 思考过程</span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className='rounded-md border border-dashed bg-muted/30 p-3 text-sm text-muted-foreground whitespace-pre-wrap mb-2'>
          {thinking}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

// 获取内容显示
function getContentDisplay(content: unknown): string {
  if (typeof content === 'string') {
    return content
  }
  if (content && typeof content === 'object') {
    const obj = content as Record<string, unknown>
    if ('text' in obj && typeof obj.text === 'string') {
      return obj.text
    }
    if ('title' in obj && typeof obj.title === 'string') {
      return obj.title
    }
  }
  return JSON.stringify(content, null, 2)
}

// Trace 详情组件
function TraceDetail({ trace }: { trace: unknown }) {
  const [expanded, setExpanded] = useState(false)

  if (!trace) return null

  const traceObj = trace as Record<string, unknown>
  const intent = traceObj.intent ? String(traceObj.intent) : null
  const intentMethod = traceObj.intentMethod ? String(traceObj.intentMethod) : null
  const hasMemory = !!traceObj.memory
  const hasRag = !!traceObj.rag
  const hasTools = !!traceObj.tools
  const toolsArray = hasTools ? (Array.isArray(traceObj.tools) ? traceObj.tools : [traceObj.tools]) : []

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <CollapsibleTrigger className='flex items-center gap-1 text-xs text-primary hover:underline'>
        {expanded ? <ChevronDown className='h-3 w-3' /> : <ChevronRight className='h-3 w-3' />}
        查看 Trace
      </CollapsibleTrigger>
      <CollapsibleContent className='mt-2 rounded-md border bg-muted/50 p-3'>
        <div className='space-y-3 text-xs'>
          {/* 执行步骤流程 */}
          <div className='flex items-center gap-2 text-muted-foreground'>
            <span className={intent ? 'text-foreground font-medium' : ''}>Intent</span>
            <span>→</span>
            <span className={hasMemory ? 'text-foreground font-medium' : ''}>Memory</span>
            <span>→</span>
            <span className={hasRag ? 'text-foreground font-medium' : ''}>RAG</span>
            <span>→</span>
            <span className={hasTools ? 'text-foreground font-medium' : ''}>Tools</span>
            <span>→</span>
            <span className='text-foreground font-medium'>Output</span>
          </div>

          {/* Intent */}
          {intent && (
            <div className='border-l-2 border-primary/30 pl-3'>
              <div className='font-medium text-foreground mb-1'>Intent 识别</div>
              <div className='flex items-center gap-2'>
                <Badge variant='outline' className='text-xs'>{intent}</Badge>
                {intentMethod && (
                  <span className='text-muted-foreground'>via {intentMethod}</span>
                )}
              </div>
            </div>
          )}
          
          {/* Memory */}
          {hasMemory && (
            <div className='border-l-2 border-blue-300 pl-3'>
              <div className='font-medium text-foreground mb-1'>Memory 上下文</div>
              <pre className='rounded bg-background p-2 text-xs overflow-auto max-h-32'>
                {JSON.stringify(traceObj.memory, null, 2)}
              </pre>
            </div>
          )}
          
          {/* RAG */}
          {hasRag && (
            <div className='border-l-2 border-green-300 pl-3'>
              <div className='font-medium text-foreground mb-1'>RAG 搜索</div>
              <pre className='rounded bg-background p-2 text-xs overflow-auto max-h-32'>
                {JSON.stringify(traceObj.rag, null, 2)}
              </pre>
            </div>
          )}
          
          {/* Tools */}
          {hasTools && toolsArray.length > 0 && (
            <div className='border-l-2 border-orange-300 pl-3'>
              <div className='font-medium text-foreground mb-1'>Tool 调用</div>
              <div className='space-y-2'>
                {toolsArray.map((tool, index) => {
                  const toolObj = tool as Record<string, unknown>
                  const toolName = toolObj.name ? String(toolObj.name) : `Tool ${index + 1}`
                  const toolInput = toolObj.input
                  const toolOutput = toolObj.output
                  const evalScore = toolObj.evalScore !== undefined ? Number(toolObj.evalScore) : null
                  const hasToolInput = !!toolInput
                  const hasToolOutput = !!toolOutput
                  
                  return (
                    <details key={index} className='rounded bg-background p-2'>
                      <summary className='cursor-pointer flex items-center gap-2'>
                        <Badge variant='secondary' className='text-xs'>{toolName}</Badge>
                        {evalScore !== null && (
                          <span className={`text-xs ${evalScore >= 0.8 ? 'text-green-600' : evalScore >= 0.5 ? 'text-yellow-600' : 'text-red-600'}`}>
                            评分: {(evalScore * 100).toFixed(0)}%
                          </span>
                        )}
                      </summary>
                      <div className='mt-2 space-y-2'>
                        {hasToolInput && (
                          <div>
                            <span className='text-muted-foreground'>Input:</span>
                            <pre className='mt-1 rounded bg-muted p-2 text-xs overflow-auto max-h-24'>
                              {JSON.stringify(toolInput, null, 2)}
                            </pre>
                          </div>
                        )}
                        {hasToolOutput && (
                          <div>
                            <span className='text-muted-foreground'>Output:</span>
                            <pre className='mt-1 rounded bg-muted p-2 text-xs overflow-auto max-h-24'>
                              {JSON.stringify(toolOutput, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </details>
                  )
                })}
              </div>
            </div>
          )}
          
          {/* 完整 Trace */}
          <details className='mt-2'>
            <summary className='cursor-pointer text-muted-foreground hover:text-foreground'>
              完整 Trace 数据
            </summary>
            <pre className='mt-1 rounded bg-background p-2 text-xs overflow-auto max-h-48'>
              {JSON.stringify(trace, null, 2)}
            </pre>
          </details>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

// 消息项组件
function MessageItem({ message }: { message: Record<string, unknown> }) {
  const isUser = message.role === 'user'
  const messageType = String(message.messageType || 'text')
  const typeLabel = MESSAGE_TYPES[messageType] || messageType
  const typeColor = messageTypeColors[messageType] || 'bg-gray-100 text-gray-800'
  const content = message.content
  const hasTrace = !isUser && !!message.trace
  
  // v4.6: 解析 thinking 标签
  const contentStr = getContentDisplay(content)
  const { thinking, output } = !isUser ? parseThinking(contentStr) : { thinking: null, output: contentStr }

  return (
    <div
      className={cn(
        'flex gap-3 rounded-lg p-3',
        messageType === 'widget_error' && 'bg-red-50/50 ring-1 ring-red-200'
      )}
    >
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
        )}
      >
        {isUser ? <User className='h-4 w-4' /> : <Bot className='h-4 w-4' />}
      </div>

      <div className='min-w-0 flex-1'>
        <div className='flex items-center gap-2 mb-2'>
          <span className='text-sm font-medium'>
            {isUser ? '用户' : 'AI'}
          </span>
          <Badge variant='secondary' className={cn('text-xs', typeColor)}>
            {typeLabel}
          </Badge>
          <span className='ml-auto text-xs text-muted-foreground'>
            {format(new Date(String(message.createdAt)), 'HH:mm:ss', { locale: zhCN })}
          </span>
        </div>
        
        {/* v4.6: 显示 AI 思维链 */}
        {thinking && <ThinkingBlock thinking={thinking} />}
        
        <div className='rounded-md border bg-background p-3 text-sm whitespace-pre-wrap break-words'>
          {output}
        </div>

        {/* Trace 详情（仅 assistant 消息） */}
        {hasTrace && (
          <div className='mt-2'>
            <TraceDetail trace={message.trace} />
          </div>
        )}
      </div>
    </div>
  )
}

export function ConversationDetail() {
  const params = useParams({ strict: false })
  const id = params.id as string
  const { data, isLoading, error } = useConversationDetail(id, true)
  const evaluateMutation = useEvaluateSession()
  
  // v4.6: Bad Case 弹窗状态
  const [badCaseOpen, setBadCaseOpen] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [note, setNote] = useState('')

  const conversation = data?.conversation
  const messages = data?.messages || []
  
  // v4.6: 评估操作
  const handleGood = () => {
    evaluateMutation.mutate({
      conversationId: id,
      status: 'good',
    })
  }
  
  const handleBadSubmit = () => {
    evaluateMutation.mutate({
      conversationId: id,
      status: 'bad',
      tags: selectedTags,
      note: note || undefined,
    })
    setBadCaseOpen(false)
    setSelectedTags([])
    setNote('')
  }
  
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  return (
    <>
      <Header fixed>
        <div className='flex items-center gap-2'>
          <Link to='/ai-ops/conversations'>
            <Button variant='ghost' size='icon' className='h-8 w-8'>
              <ArrowLeft className='h-4 w-4' />
            </Button>
          </Link>
          <h1 className='text-lg font-semibold'>对话详情</h1>
          {/* v4.6: 显示当前评估状态 */}
          {conversation && (
            <Badge variant={
              conversation.evaluationStatus === 'good' ? 'default' :
              conversation.evaluationStatus === 'bad' ? 'destructive' : 'secondary'
            }>
              {conversation.evaluationStatus === 'good' ? '✅ Good' :
               conversation.evaluationStatus === 'bad' ? '🔴 Bad' : '⚪ 未评估'}
            </Badge>
          )}
        </div>
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-4 pb-20'>
        {isLoading ? (
          <div className='space-y-4'>
            <Skeleton className='h-8 w-64' />
            <Skeleton className='h-32 w-full' />
            <Skeleton className='h-32 w-full' />
          </div>
        ) : error ? (
          <div className='text-center py-8 text-muted-foreground'>
            加载失败：{error.message}
          </div>
        ) : !conversation ? (
          <div className='text-center py-8 text-muted-foreground'>
            会话不存在
          </div>
        ) : (
          <>
            {/* 会话元信息 */}
            <div className='flex flex-wrap items-center gap-6 text-sm'>
              <div>
                <span className='text-muted-foreground'>用户</span>
                <span className='ml-2 font-medium'>{conversation.userNickname || '匿名用户'}</span>
              </div>
              <div>
                <span className='text-muted-foreground'>创建时间</span>
                <span className='ml-2'>{format(new Date(conversation.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}</span>
              </div>
              <div>
                <span className='text-muted-foreground'>消息数</span>
                <span className='ml-2 font-medium'>{conversation.messageCount}</span>
              </div>
              {conversation.title && (
                <div>
                  <span className='text-muted-foreground'>标题</span>
                  <span className='ml-2'>{conversation.title}</span>
                </div>
              )}
              {/* v4.6: 显示评估标签 */}
              {conversation.evaluationTags && conversation.evaluationTags.length > 0 && (
                <div className='flex items-center gap-1'>
                  <span className='text-muted-foreground'>标签</span>
                  {conversation.evaluationTags.map(tag => (
                    <Badge key={tag} variant='outline' className='text-xs'>
                      {BAD_CASE_TAGS.find(t => t.value === tag)?.label || tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* 消息列表 */}
            <div className='space-y-4'>
              {messages.length === 0 ? (
                <div className='text-center py-8 text-muted-foreground'>
                  暂无消息
                </div>
              ) : (
                messages.map((msg) => (
                  <MessageItem key={String(msg.id)} message={msg as Record<string, unknown>} />
                ))
              )}
            </div>
          </>
        )}
      </Main>
      
      {/* v4.6: 底部评估操作栏 */}
      {conversation && (
        <div className='fixed bottom-0 left-0 right-0 border-t bg-background p-4 flex items-center justify-center gap-4'>
          <Button
            variant='outline'
            size='lg'
            onClick={handleGood}
            disabled={evaluateMutation.isPending}
            className='gap-2'
          >
            <ThumbsUp className='h-5 w-5' />
            👍 Good
          </Button>
          <Button
            variant='outline'
            size='lg'
            onClick={() => setBadCaseOpen(true)}
            disabled={evaluateMutation.isPending}
            className='gap-2 text-destructive hover:text-destructive'
          >
            <ThumbsDown className='h-5 w-5' />
            👎 Bad
          </Button>
        </div>
      )}
      
      {/* v4.6: Bad Case 标记弹窗 */}
      <Dialog open={badCaseOpen} onOpenChange={setBadCaseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>标记为 Bad Case</DialogTitle>
            <DialogDescription>
              选择问题类型并添加备注，帮助后续优化 AI
            </DialogDescription>
          </DialogHeader>
          
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label>问题类型（可多选）</Label>
              <div className='grid grid-cols-2 gap-2'>
                {BAD_CASE_TAGS.map(tag => (
                  <div key={tag.value} className='flex items-center space-x-2'>
                    <Checkbox
                      id={tag.value}
                      checked={selectedTags.includes(tag.value)}
                      onCheckedChange={() => toggleTag(tag.value)}
                    />
                    <label
                      htmlFor={tag.value}
                      className='text-sm cursor-pointer'
                    >
                      {tag.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className='space-y-2'>
              <Label htmlFor='note'>备注（可选）</Label>
              <Textarea
                id='note'
                placeholder='描述具体问题...'
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant='outline' onClick={() => setBadCaseOpen(false)}>
              取消
            </Button>
            <Button 
              variant='destructive' 
              onClick={handleBadSubmit}
              disabled={evaluateMutation.isPending}
            >
              确认标记
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
