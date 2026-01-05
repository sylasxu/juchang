import { Gauge, Edit } from 'lucide-react'
import { getRouteApi } from '@tanstack/react-router'
import { ListPage, DataTable, ListProvider, useListContext } from '@/components/list-page'
import { Button } from '@/components/ui/button'
import { useQuotaList, type UserQuota } from '@/hooks/use-quota'
import { quotaColumns, quotaFilters, type QuotaDialogType } from './components/quota-columns'
import { QuotaDialogs } from './components/quota-dialogs'

const route = getRouteApi('/_authenticated/ai-ops/quota')

// 批量操作按钮
function BatchActions() {
  const { selectedRows, setOpen } = useListContext<UserQuota, QuotaDialogType>()
  
  if (!selectedRows || selectedRows.length === 0) return null

  return (
    <Button
      variant='outline'
      size='sm'
      onClick={() => setOpen('batch-edit')}
    >
      <Edit className='mr-2 h-4 w-4' />
      批量调整 ({selectedRows.length})
    </Button>
  )
}

// 内部组件
function QuotaContent() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const pageSize = search.pageSize ?? 10
  const { setSelectedRows } = useListContext<UserQuota, QuotaDialogType>()

  // 从 URL 获取筛选参数
  const statusFilter = search.status?.[0] as 'used' | 'unused' | undefined

  const { data, isLoading, error } = useQuotaList({
    page: search.page ?? 1,
    limit: pageSize,
    search: search.filter,
    usageStatus: statusFilter || 'all',
  })

  const users = data?.data ?? []
  const total = data?.total ?? 0

  return (
    <ListPage
      title='AI 额度管理'
      description='查看和调整用户 AI 创建额度'
      icon={Gauge}
      isLoading={isLoading}
      error={error ?? undefined}
      dialogs={<QuotaDialogs />}
      headerActions={<BatchActions />}
    >
      <DataTable
        data={users}
        columns={quotaColumns}
        pageCount={Math.ceil(total / pageSize)}
        search={search}
        navigate={navigate}
        searchPlaceholder='搜索用户昵称或手机号...'
        facetedFilters={quotaFilters}
        emptyMessage='暂无数据'
        onSelectedRowsChange={setSelectedRows}
      />
    </ListPage>
  )
}

export function QuotaManagement() {
  return (
    <ListProvider<UserQuota, QuotaDialogType>>
      <QuotaContent />
    </ListProvider>
  )
}
