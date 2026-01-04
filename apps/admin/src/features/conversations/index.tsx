import { MessageSquare } from 'lucide-react'
import { getRouteApi } from '@tanstack/react-router'
import { ListPage, DataTable, ListProvider } from '@/components/list-page'
import { useSessionsList, type ConversationSession } from '@/hooks/use-conversations'
import {
  conversationsColumns,
  type ConversationDialogType,
} from './components/conversations-columns'
import { ConversationsDialogs } from './components/conversations-dialogs'

const route = getRouteApi('/_authenticated/ai-ops/conversations')

export function Conversations() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const pageSize = search.pageSize ?? 20

  const { data, isLoading, error } = useSessionsList({
    page: search.page ?? 1,
    limit: pageSize,
    userId: search.search || undefined,
  })

  const sessions = data?.data ?? []
  const total = data?.total ?? 0

  return (
    <ListProvider<ConversationSession, ConversationDialogType>>
      <ListPage
        title='对话审计'
        description='查看所有 AI 会话记录'
        icon={MessageSquare}
        isLoading={isLoading}
        error={error ?? undefined}
        dialogs={<ConversationsDialogs />}
      >
        <DataTable
          data={sessions}
          columns={conversationsColumns}
          pageCount={Math.ceil(total / pageSize)}
          search={search}
          navigate={navigate}
          searchPlaceholder='按用户 ID 搜索...'
          emptyMessage='暂无会话记录'
        />
      </ListPage>
    </ListProvider>
  )
}
