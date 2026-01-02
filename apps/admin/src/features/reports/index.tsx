import { Shield } from 'lucide-react'
import { getRouteApi } from '@tanstack/react-router'
import { ListPage, DataTable, ListProvider } from '@/components/list-page'
import { useReportsList, type Report } from '@/hooks/use-reports'
import {
  reportsColumns,
  reportFilters,
  type ReportDialogType,
} from './components/reports-columns'
import { ReportsDialogs } from './components/reports-dialogs'

const route = getRouteApi('/_authenticated/reports/')

export function Reports() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const pageSize = search.pageSize ?? 10

  // 从 URL 获取筛选参数
  const statusFilter = search.status?.[0]
  const typeFilter = search.type?.[0]

  const { data, isLoading, error } = useReportsList({
    page: search.page ?? 1,
    limit: pageSize,
    status: statusFilter as 'pending' | 'resolved' | 'ignored' | undefined,
    type: typeFilter as 'activity' | 'message' | 'user' | undefined,
  })

  const reports = data?.data ?? []
  const total = data?.total ?? 0

  return (
    <ListProvider<Report, ReportDialogType>>
      <ListPage
        title='内容审核'
        description='管理用户举报，审核违规内容'
        icon={Shield}
        isLoading={isLoading}
        error={error ?? undefined}
        dialogs={<ReportsDialogs />}
      >
        <DataTable
          data={reports}
          columns={reportsColumns}
          pageCount={Math.ceil(total / pageSize)}
          search={search}
          navigate={navigate}
          searchPlaceholder='搜索举报内容...'
          facetedFilters={reportFilters}
          emptyMessage='暂无举报'
        />
      </ListPage>
    </ListProvider>
  )
}
