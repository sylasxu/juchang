// ConversationsList - 对话列表组件
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Search, 
  AlertCircle, 
  User, 
  Bot, 
  ChevronLeft, 
  ChevronRight,
  ExternalLink,
  RefreshCw,
} from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { queryKeys } from '@/lib/query-client'
import { api } from '@/lib/eden'
import { InspectorRenderer } from '@/features/ai-playground/components/inspectors'
import { cn } from '@/lib/utils'
import { useDebouncedSearch } from '@/hooks/use-debounced-search'

// 消息类型标签
const messageTypeLabels: Record<string, string> = {
  text: '文本',
  widget_dashboard: '欢迎卡片',
  widget_launcher: '发射台',
  widget_action: '快捷操作',
  widget_draft: '活动草稿',
  widget_share: '分享卡片',
  widget_explore: '探索卡片',
  widget_error: '错误',
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
}

interface ConversationItem {
  id: string
  userId: string
  userNickname: string | null
  role: 'user' | 'assistant'
  type: string
  content: string | Record<string, unknown>
  activityId: string | null
  createdAt: string
}

export function ConversationsList() {
  const [cursor, setCursor] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string>('all')
  const [selectedConversation, setSelectedConversation] = useState<ConversationItem | null>(null)

  // 使用防抖搜索 hook
  const { inputProps, debouncedValue: searchUserId } = useDebouncedSearch({
    delay: 300,
    onSearch: () => setCursor(null), // 搜索时重置分页
  })

  // 获取对话列表
  const { data, isLoading, refetch } = useQuery({
    queryKey: queryKeys.ai.conversationsList({ cursor, filterType, searchUserId }),
    queryFn: async () => {
      const response = await api.ai.conversations.get({
        query: {
          limit: 20,
          cursor: cursor || undefined,
          userId: searchUserId || undefined,
          messageType: filterType !== 'all' ? filterType : undefined,
        },
      })
      
      if (response.error) {
        throw new Error('获取对话列表失败')
      }
      
      return response.data
    },
  })

  const conversations = (data?.items || []) as ConversationItem[]
  const total = data?.total || 0
  const hasMore = data?.hasMore || false
  const nextCursor = data?.cursor

  return (
    <div className='space-y-4'>
      {/* 筛选栏 */}
      <Card>
        <CardContent className='flex flex-wrap items-center gap-4 p-4'>
          <div className='flex items-center gap-2'>
            <Search className='h-4 w-4 text-muted-foreground' />
            <Input
              placeholder='按用户 ID 搜索...'
              {...inputProps}
              className='w-48'
            />
          </div>
          
          <Select value={filterType} onValueChange={(v) => {
            setFilterType(v)
            setCursor(null)
          }}>
            <SelectTrigger className='w-36'>
              <SelectValue placeholder='消息类型' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>全部类型</SelectItem>
              <SelectItem value='text'>文本</SelectItem>
              <SelectItem value='widget_draft'>活动草稿</SelectItem>
              <SelectItem value='widget_explore'>探索卡片</SelectItem>
              <SelectItem value='widget_error'>错误</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant='outline' size='sm' onClick={() => refetch()}>
            <RefreshCw className='mr-1 h-4 w-4' />
            刷新
          </Button>
          
          <div className='ml-auto text-sm text-muted-foreground'>
            共 {total} 条记录
          </div>
        </CardContent>
      </Card>

      {/* 对话列表 */}
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-base font-medium'>对话记录</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='flex h-40 items-center justify-center text-muted-foreground'>
              加载中...
            </div>
          ) : conversations.length === 0 ? (
            <div className='flex h-40 items-center justify-center text-muted-foreground'>
              暂无对话记录
            </div>
          ) : (
            <ScrollArea className='h-[500px]'>
              <div className='space-y-2 pr-4'>
                {conversations.map((conv) => (
                  <ConversationRow
                    key={conv.id}
                    conversation={conv}
                    onClick={() => setSelectedConversation(conv)}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* 分页 */}
      <div className='flex items-center justify-center gap-2'>
        <Button
          variant='outline'
          size='sm'
          onClick={() => setCursor(null)}
          disabled={!cursor}
        >
          <ChevronLeft className='h-4 w-4' />
          首页
        </Button>
        <Button
          variant='outline'
          size='sm'
          onClick={() => setCursor(nextCursor || null)}
          disabled={!hasMore}
        >
          下一页
          <ChevronRight className='h-4 w-4' />
        </Button>
      </div>

      {/* 对话详情弹窗 */}
      <ConversationDetailDialog
        conversation={selectedConversation}
        open={!!selectedConversation}
        onClose={() => setSelectedConversation(null)}
      />
    </div>
  )
}

// 对话行组件
function ConversationRow({
  conversation,
  onClick,
}: {
  conversation: ConversationItem
  onClick: () => void
}) {
  const isUser = conversation.role === 'user'
  const typeLabel = messageTypeLabels[conversation.type] || conversation.type
  const typeColor = messageTypeColors[conversation.type] || 'bg-gray-100 text-gray-800'

  // 获取内容预览
  const getContentPreview = (): string => {
    const content = conversation.content
    if (typeof content === 'string') {
      return content.slice(0, 100)
    }
    if (content && typeof content === 'object') {
      const obj = content as Record<string, unknown>
      if ('text' in obj && typeof obj.text === 'string') {
        return obj.text.slice(0, 100)
      }
      if ('title' in obj && typeof obj.title === 'string') {
        return obj.title
      }
    }
    return JSON.stringify(content).slice(0, 100)
  }

  return (
    <div
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50',
        conversation.type === 'widget_error' && 'border-red-200 bg-red-50/50'
      )}
      onClick={onClick}
    >
      {/* 角色图标 */}
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
        )}
      >
        {isUser ? <User className='h-4 w-4' /> : <Bot className='h-4 w-4' />}
      </div>

      {/* 内容 */}
      <div className='min-w-0 flex-1'>
        <div className='flex items-center gap-2'>
          <span className='text-sm font-medium'>
            {isUser ? (conversation.userNickname || '用户') : 'AI'}
          </span>
          <Badge variant='secondary' className={cn('text-xs', typeColor)}>
            {typeLabel}
          </Badge>
          {conversation.type === 'widget_error' && (
            <Badge variant='destructive' className='text-xs'>
              <AlertCircle className='mr-1 h-3 w-3' />
              错误
            </Badge>
          )}
          <span className='ml-auto text-xs text-muted-foreground'>
            {format(new Date(conversation.createdAt), 'MM-dd HH:mm', { locale: zhCN })}
          </span>
        </div>
        <p className='mt-1 truncate text-sm text-muted-foreground'>
          {getContentPreview()}
        </p>
      </div>
    </div>
  )
}

// 对话详情弹窗
function ConversationDetailDialog({
  conversation,
  open,
  onClose,
}: {
  conversation: ConversationItem | null
  open: boolean
  onClose: () => void
}) {
  if (!conversation) return null

  const isUser = conversation.role === 'user'

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            {isUser ? <User className='h-5 w-5' /> : <Bot className='h-5 w-5' />}
            {isUser ? '用户消息' : 'AI 响应'}
            <Badge variant='secondary' className='ml-2'>
              {messageTypeLabels[conversation.type] || conversation.type}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          {/* 元信息 */}
          <div className='grid grid-cols-2 gap-4 text-sm'>
            <div>
              <span className='text-muted-foreground'>用户:</span>
              <span className='ml-2'>{conversation.userNickname || conversation.userId}</span>
            </div>
            <div>
              <span className='text-muted-foreground'>时间:</span>
              <span className='ml-2'>
                {format(new Date(conversation.createdAt), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })}
              </span>
            </div>
            {conversation.activityId && (
              <div className='col-span-2'>
                <span className='text-muted-foreground'>关联活动:</span>
                <span className='ml-2 font-mono text-xs'>{conversation.activityId}</span>
              </div>
            )}
          </div>

          {/* Inspector */}
          <div className='rounded-lg border p-4'>
            <InspectorRenderer
              type={conversation.type}
              content={conversation.content}
              showRawJson={true}
            />
          </div>

          {/* 操作按钮 */}
          <div className='flex justify-end gap-2'>
            <Button variant='outline' asChild>
              <a href={`/playground?import=${conversation.id}`}>
                <ExternalLink className='mr-1 h-4 w-4' />
                在 Playground 中测试
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
