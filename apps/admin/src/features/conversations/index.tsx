import { useState } from 'react'
import { MessageSquare, Trash2 } from 'lucide-react'
import { getRouteApi } from '@tanstack/react-router'
import { ListPage, DataTable, ListProvider, useListContext } from '@/components/list-page'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/date-picker'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSessionsList, useSessionsStats, type ConversationSession } from '@/hooks/use-conversations'
import {
  conversationsColumns,
  type ConversationDialogType,
} from './components/conversations-columns'
import { ConversationsDialogs } from './components/conversations-dialogs'

const route = getRouteApi('/_authenticated/ai-ops/conversations')

// v4.6: 评估筛选 Tab 类型
type EvaluationFilter = 'all' | 'unreviewed' | 'bad' | 'hasError'

// 默认日期范围：最近 30 天
function getDefaultDateRange() {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 30)
  return { start, end }
}

// 统计信息组件
function StatsBar() {
  const { data: stats, isLoading } = useSessionsStats()

  if (isLoading) {
    return (
      <div className='flex items-center gap-6 text-sm'>
        <Skeleton className='h-5 w-20' />
        <Skeleton className='h-5 w-20' />
        <Skeleton className='h-5 w-20' />
        <Skeleton className='h-5 w-20' />
      </div>
    )
  }

  return (
    <div className='flex items-center gap-6 text-sm'>
      <div>
        <span className='text-muted-foreground'>总会话数</span>
        <span className='ml-2 font-medium'>{stats?.total || 0}</span>
      </div>
      <div>
        <span className='text-muted-foreground'>今日新增</span>
        <span className='ml-2 font-medium'>{stats?.todayNew || 0}</span>
      </div>
      <div>
        <span className='text-muted-foreground'>平均消息数</span>
        <span className='ml-2 font-medium'>{stats?.avgMessages?.toFixed(1) || '0'}</span>
      </div>
      <div>
        <span className='text-muted-foreground'>错误会话</span>
        <span className='ml-2 font-medium'>{stats?.errorCount || 0}</span>
      </div>
    </div>
  )
}

// 批量操作按钮
function BatchActions() {
  const { selectedRows, setOpen } = useListContext<ConversationSession, ConversationDialogType>()
  
  if (!selectedRows || selectedRows.length === 0) return null

  return (
    <Button
      variant='destructive'
      size='sm'
      onClick={() => setOpen('batch-delete')}
    >
      <Trash2 className='mr-2 h-4 w-4' />
      删除选中 ({selectedRows.length})
    </Button>
  )
}

// 内部组件，可以访问 ListContext
function ConversationsContent() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const pageSize = search.pageSize ?? 20
  const { setSelectedRows } = useListContext<ConversationSession, ConversationDialogType>()

  // 日期筛选状态
  const defaultRange = getDefaultDateRange()
  const [startDate, setStartDate] = useState<Date | undefined>(defaultRange.start)
  const [endDate, setEndDate] = useState<Date | undefined>(defaultRange.end)
  
  // v4.6: 评估筛选状态
  const [evaluationFilter, setEvaluationFilter] = useState<EvaluationFilter>('all')

  // 根据筛选 Tab 计算 API 参数
  const getFilterParams = () => {
    switch (evaluationFilter) {
      case 'unreviewed':
        return { evaluationStatus: 'unreviewed' as const }
      case 'bad':
        return { evaluationStatus: 'bad' as const }
      case 'hasError':
        return { hasError: true }
      default:
        return {}
    }
  }

  const { data, isLoading, error } = useSessionsList({
    page: search.page ?? 1,
    limit: pageSize,
    userId: search.search || undefined,
    startDate: startDate?.toISOString().split('T')[0],
    endDate: endDate?.toISOString().split('T')[0],
    ...getFilterParams(),
  })

  const sessions = data?.data ?? []
  const total = data?.total ?? 0

  return (
    <ListPage
      title='对话审计'
      description='审核 AI 对话质量，标记 Bad Case'
      icon={MessageSquare}
      isLoading={isLoading}
      error={error ?? undefined}
      dialogs={<ConversationsDialogs />}
      headerActions={<BatchActions />}
    >
      {/* 统计信息 */}
      <StatsBar />

      {/* v4.6: 评估筛选 Tab */}
      <Tabs value={evaluationFilter} onValueChange={(v) => setEvaluationFilter(v as EvaluationFilter)}>
        <TabsList>
          <TabsTrigger value='all'>全部</TabsTrigger>
          <TabsTrigger value='unreviewed'>⚪ 未评估</TabsTrigger>
          <TabsTrigger value='bad'>🔴 Bad Case</TabsTrigger>
          <TabsTrigger value='hasError'>⚠️ 有错误</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* 日期筛选 */}
      <div className='flex items-center gap-4'>
        <div className='flex items-center gap-2'>
          <Label className='text-sm text-muted-foreground'>从</Label>
          <DatePicker
            selected={startDate}
            onSelect={setStartDate}
            placeholder='开始日期'
          />
        </div>
        <div className='flex items-center gap-2'>
          <Label className='text-sm text-muted-foreground'>至</Label>
          <DatePicker
            selected={endDate}
            onSelect={setEndDate}
            placeholder='结束日期'
          />
        </div>
      </div>

      <DataTable
        data={sessions}
        columns={conversationsColumns}
        pageCount={Math.ceil(total / pageSize)}
        search={search}
        navigate={navigate}
        searchPlaceholder='按用户昵称搜索...'
        emptyMessage='暂无会话记录'
        onSelectedRowsChange={setSelectedRows}
      />
    </ListPage>
  )
}

export function Conversations() {
  return (
    <ListProvider<ConversationSession, ConversationDialogType>>
      <ConversationsContent />
    </ListProvider>
  )
}
