import { type ColumnDef } from '@tanstack/react-table'
import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { Edit } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DataTableColumnHeader } from '@/components/data-table'
import { useListContext } from '@/components/list-page'
import { type UserQuota, DAILY_QUOTA_LIMIT } from '@/hooks/use-quota'

// 弹窗类型
export type QuotaDialogType = 'edit' | 'batch-edit'

// 行操作组件
function QuotaRowActions({ user }: { user: UserQuota }) {
  const { setOpen, setCurrentRow } = useListContext<UserQuota, QuotaDialogType>()

  const handleEdit = () => {
    setCurrentRow(user)
    setOpen('edit')
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='data-[state=open]:bg-muted flex h-8 w-8 p-0'>
          <DotsHorizontalIcon className='h-4 w-4' />
          <span className='sr-only'>打开菜单</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-[160px]'>
        <DropdownMenuItem onClick={handleEdit}>
          调整额度
          <DropdownMenuShortcut>
            <Edit size={16} />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// 列定义
export const quotaColumns: ColumnDef<UserQuota>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='全选'
        className='translate-y-[2px]'
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='选择行'
        className='translate-y-[2px]'
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'nickname',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='昵称' />
    ),
    cell: ({ row }) => (
      <span className='font-medium'>
        {(row.getValue('nickname') as string) || '未设置昵称'}
      </span>
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'phoneNumber',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='手机号' />
    ),
    cell: ({ row }) => {
      const phoneNumber = row.getValue('phoneNumber') as string | null
      return phoneNumber ? (
        <span>{phoneNumber}</span>
      ) : (
        <span className='text-muted-foreground'>未绑定</span>
      )
    },
    enableSorting: false,
  },
  {
    accessorKey: 'aiCreateQuotaToday',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='剩余额度' />
    ),
    cell: ({ row }) => {
      const quotaRemaining =
        (row.getValue('aiCreateQuotaToday') as number | null) ?? DAILY_QUOTA_LIMIT
      const isAdmin = quotaRemaining > DAILY_QUOTA_LIMIT
      const isExhausted = quotaRemaining <= 0

      return (
        <span className={isExhausted ? 'font-medium text-red-500' : ''}>
          {isAdmin ? '∞' : quotaRemaining}
        </span>
      )
    },
    enableSorting: false,
  },
  {
    id: 'dailyLimit',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='每日上限' />
    ),
    cell: ({ row }) => {
      const quotaRemaining =
        (row.original.aiCreateQuotaToday as number | null) ?? DAILY_QUOTA_LIMIT
      const isAdmin = quotaRemaining > DAILY_QUOTA_LIMIT
      return <span>{isAdmin ? '∞' : DAILY_QUOTA_LIMIT}</span>
    },
    enableSorting: false,
  },
  {
    id: 'status',
    accessorFn: (row) => {
      const quotaRemaining = row.aiCreateQuotaToday ?? DAILY_QUOTA_LIMIT
      const isAdmin = quotaRemaining > DAILY_QUOTA_LIMIT
      const isExhausted = quotaRemaining <= 0
      if (isAdmin) return 'admin'
      if (isExhausted) return 'exhausted'
      if (quotaRemaining < DAILY_QUOTA_LIMIT) return 'used'
      return 'unused'
    },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='状态' />
    ),
    cell: ({ row }) => {
      const quotaRemaining =
        (row.original.aiCreateQuotaToday as number | null) ?? DAILY_QUOTA_LIMIT
      const isAdmin = quotaRemaining > DAILY_QUOTA_LIMIT
      const isExhausted = quotaRemaining <= 0

      if (isAdmin) {
        return <Badge variant='outline'>管理员</Badge>
      }
      if (isExhausted) {
        return <Badge variant='destructive'>已用完</Badge>
      }
      if (quotaRemaining < DAILY_QUOTA_LIMIT) {
        return <Badge variant='secondary'>已使用</Badge>
      }
      return <Badge variant='outline'>未使用</Badge>
    },
    filterFn: (row, id, value: string[]) => {
      if (!value || value.length === 0) return true
      const status = row.getValue(id) as string
      return value.includes(status)
    },
    enableSorting: false,
  },
  {
    id: 'actions',
    cell: ({ row }) => <QuotaRowActions user={row.original} />,
  },
]

// 筛选器配置
export const quotaFilters = [
  {
    columnId: 'status',
    title: '使用状态',
    options: [
      { label: '已使用', value: 'used' },
      { label: '未使用', value: 'unused' },
    ],
  },
]
