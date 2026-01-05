import { type ColumnDef } from '@tanstack/react-table'
import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { Eye, CheckCircle, Circle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DataTableColumnHeader } from '@/components/data-table'
import { TruncatedCell } from '@/components/truncated-cell'
import { useListContext } from '@/components/list-page'
import { type Notification } from '@/hooks/use-notifications'

// 通知类型映射
export const NOTIFICATION_TYPES: Record<string, string> = {
  activity_join: '活动报名',
  activity_quit: '退出活动',
  activity_update: '活动更新',
  activity_cancel: '活动取消',
  system: '系统通知',
}

// 通知弹窗类型
export type NotificationDialogType = 'view'

// 行操作组件
function NotificationRowActions({ notification }: { notification: Notification }) {
  const { setOpen, setCurrentRow } =
    useListContext<Notification, NotificationDialogType>()

  const handleView = () => {
    setCurrentRow(notification)
    setOpen('view')
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          className='data-[state=open]:bg-muted flex h-8 w-8 p-0'
        >
          <DotsHorizontalIcon className='h-4 w-4' />
          <span className='sr-only'>打开菜单</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-[160px]'>
        <DropdownMenuItem onClick={handleView}>
          查看详情
          <DropdownMenuShortcut>
            <Eye size={16} />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// 列定义
export const notificationsColumns: ColumnDef<Notification>[] = [
  {
    accessorKey: 'isRead',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='状态' />
    ),
    cell: ({ row }) => {
      const isRead = row.getValue('isRead') as boolean
      return isRead ? (
        <CheckCircle className='h-4 w-4 text-green-500' />
      ) : (
        <Circle className='h-4 w-4 text-orange-500' />
      )
    },
    enableSorting: false,
  },
  {
    accessorKey: 'title',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='标题' />
    ),
    cell: ({ row }) => (
      <TruncatedCell
        value={row.getValue('title') as string}
        maxLength={25}
        className='font-medium'
      />
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'type',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='类型' />
    ),
    cell: ({ row }) => (
      <Badge variant='outline'>
        {NOTIFICATION_TYPES[row.getValue('type') as string] ||
          row.getValue('type')}
      </Badge>
    ),
    filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
    enableSorting: false,
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='时间' />
    ),
    cell: ({ row }) => (
      <div className='text-sm text-muted-foreground'>
        {new Date(row.getValue('createdAt') as string).toLocaleString('zh-CN')}
      </div>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => <NotificationRowActions notification={row.original} />,
  },
]

// 筛选器配置
export const notificationFilters = [
  {
    columnId: 'type',
    title: '类型',
    options: [
      { label: '活动报名', value: 'activity_join' },
      { label: '退出活动', value: 'activity_quit' },
      { label: '活动更新', value: 'activity_update' },
      { label: '活动取消', value: 'activity_cancel' },
      { label: '系统通知', value: 'system' },
    ],
  },
]
