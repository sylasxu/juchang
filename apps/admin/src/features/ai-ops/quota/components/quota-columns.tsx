import { type ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { DataTableColumnHeader } from '@/components/data-table'
import { type UserQuota, DAILY_QUOTA_LIMIT } from '@/hooks/use-quota'

// 列定义
export const quotaColumns: ColumnDef<UserQuota>[] = [
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
