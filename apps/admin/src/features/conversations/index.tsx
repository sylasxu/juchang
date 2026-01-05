import { MessageSquare, Trash2 } from 'lucide-react'
import { getRouteApi } from '@tanstack/react-router'
import { ListPage, DataTable, ListProvider, useListContext } from '@/components/list-page'
import { Button } from '@/components/ui/button'
import { useSessionsList, type ConversationSession } from '@/hooks/use-conversations'
import {
  conversationsColumns,
  type ConversationDialogType,
} from './components/conversations-columns'
import { ConversationsDialogs } from './components/conversations-dialogs'

const route = getRouteApi('/_authenticated/ai-ops/conversations')

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

  const { data, isLoading, error } = useSessionsList({
    page: search.page ?? 1,
    limit: pageSize,
    userId: search.search || undefined,
  })

  const sessions = data?.data ?? []
  const total = data?.total ?? 0

  return (
    <ListPage
      title='对话审计'
      description='查看所有 AI 会话记录'
      icon={MessageSquare}
      isLoading={isLoading}
      error={error ?? undefined}
      dialogs={<ConversationsDialogs />}
      headerActions={<BatchActions />}
    >
      <DataTable
        data={sessions}
        columns={conversationsColumns}
        pageCount={Math.ceil(total / pageSize)}
        search={search}
        navigate={navigate}
        searchPlaceholder='按用户 ID 搜索...'
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
