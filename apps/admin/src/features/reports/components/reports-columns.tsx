import { type ColumnDef } from '@tanstack/react-table'
import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { Eye, CheckCircle, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DataTableColumnHeader } from '@/components/data-table'
import { useListContext } from '@/components/list-page'
import { type Report } from '@/hooks/use-reports'

// 举报类型映射
export const REPORT_TYPES: Record<string, string> = {
  activity: '活动',
  message: '消息',
  user: '用户',
}

// 举报原因映射
export const REPORT_REASONS: Record<string, string> = {
  inappropriate: '违规内容',
  fake: '虚假信息',
  harassment: '骚扰行为',
  other: '其他',
}

// 举报状态映射
export const REPORT_STATUSES: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  pending: { label: '待处理', variant: 'default' },
  resolved: { label: '已处理', variant: 'secondary' },
  ignored: { label: '已忽略', variant: 'outline' },
}

// 举报弹窗类型
export type ReportDialogType = 'view' | 'resolve' | 'ignore'

// 行操作组件
function ReportRowActions({ report }: { report: Report }) {
  const { setOpen, setCurrentRow } = useListContext<Report, ReportDialogType>()

  const handleAction = (action: ReportDialogType) => {
    setCurrentRow(report)
    setOpen(action)
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
        <DropdownMenuItem onClick={() => handleAction('view')}>
          查看详情
          <DropdownMenuShortcut>
            <Eye size={16} />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
        {report.status === 'pending' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleAction('resolve')}>
              处理完成
              <DropdownMenuShortcut>
                <CheckCircle size={16} />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAction('ignore')}>
              忽略
              <DropdownMenuShortcut>
                <XCircle size={16} />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// 列定义
export const reportsColumns: ColumnDef<Report>[] = [
  {
    accessorKey: 'type',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='类型' />
    ),
    cell: ({ row }) => (
      <Badge variant='outline'>
        {REPORT_TYPES[row.getValue('type') as string] || row.getValue('type')}
      </Badge>
    ),
    filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
    enableSorting: false,
  },
  {
    accessorKey: 'reason',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='原因' />
    ),
    cell: ({ row }) => (
      <Badge variant='secondary'>
        {REPORT_REASONS[row.getValue('reason') as string] ||
          row.getValue('reason')}
      </Badge>
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'targetContent',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='被举报内容' />
    ),
    cell: ({ row }) => (
      <div className='max-w-xs truncate text-sm'>
        {row.getValue('targetContent') as string}
      </div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='状态' />
    ),
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      const statusConfig = REPORT_STATUSES[status]
      return (
        <Badge variant={statusConfig?.variant || 'outline'}>
          {statusConfig?.label || status}
        </Badge>
      )
    },
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
    cell: ({ row }) => <ReportRowActions report={row.original} />,
  },
]

// 筛选器配置
export const reportFilters = [
  {
    columnId: 'status',
    title: '状态',
    options: [
      { label: '待处理', value: 'pending' },
      { label: '已处理', value: 'resolved' },
      { label: '已忽略', value: 'ignored' },
    ],
  },
  {
    columnId: 'type',
    title: '类型',
    options: [
      { label: '活动', value: 'activity' },
      { label: '消息', value: 'message' },
      { label: '用户', value: 'user' },
    ],
  },
]
