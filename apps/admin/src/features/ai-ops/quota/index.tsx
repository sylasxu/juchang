import { Gauge } from 'lucide-react'
import { getRouteApi } from '@tanstack/react-router'
import { ListPage, DataTable } from '@/components/list-page'
import { useQuotaList } from '@/hooks/use-quota'
import { quotaColumns, quotaFilters } from './components/quota-columns'

const route = getRouteApi('/_authenticated/ai-ops/quota')

export function QuotaManagement() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const pageSize = search.pageSize ?? 10

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
      description='查看用户 AI 创建额度使用情况'
      icon={Gauge}
      isLoading={isLoading}
      error={error ?? undefined}
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
      />
    </ListPage>
  )
}
