import { Bell } from 'lucide-react'
import { getRouteApi } from '@tanstack/react-router'
import { ListPage, DataTable, ListProvider } from '@/components/list-page'
import { useNotificationsList, type Notification } from '@/hooks/use-notifications'
import {
  notificationsColumns,
  notificationFilters,
  type NotificationDialogType,
} from './components/notifications-columns'
import { NotificationsDialogs } from './components/notifications-dialogs'

const route = getRouteApi('/_authenticated/notifications/')

export function NotificationsManagement() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const pageSize = search.pageSize ?? 10

  // 从 URL 获取筛选参数
  const typeFilter = search.type?.[0]

  const { data, isLoading, error } = useNotificationsList({
    page: search.page ?? 1,
    limit: pageSize,
    type: typeFilter,
  })

  const notifications = data?.data ?? []
  const total = data?.total ?? 0

  return (
    <ListProvider<Notification, NotificationDialogType>>
      <ListPage
        title='通知管理'
        description='查看系统通知记录'
        icon={Bell}
        isLoading={isLoading}
        error={error ?? undefined}
        dialogs={<NotificationsDialogs />}
      >
        <DataTable
          data={notifications}
          columns={notificationsColumns}
          pageCount={Math.ceil(total / pageSize)}
          search={search}
          navigate={navigate}
          searchPlaceholder='搜索通知标题...'
          facetedFilters={notificationFilters}
          emptyMessage='暂无通知'
        />
      </ListPage>
    </ListProvider>
  )
}
