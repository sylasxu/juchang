import { type ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import { statusStyles, membershipStyles, genderLabels } from '../data/data'
import { type User } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'

export const usersColumns: ColumnDef<User>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Select all'
        className='translate-y-[2px]'
      />
    ),
    meta: {
      className: cn('max-md:sticky start-0 z-10 rounded-tl-[inherit]'),
    },
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Select row'
        className='translate-y-[2px]'
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'nickname',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='用户' />
    ),
    cell: ({ row }) => {
      const { nickname, avatarUrl } = row.original
      return (
        <div className='flex items-center gap-2 ps-2'>
          <Avatar className='h-8 w-8'>
            <AvatarImage src={avatarUrl || undefined} alt={nickname || ''} />
            <AvatarFallback>{(nickname || '?')[0]}</AvatarFallback>
          </Avatar>
          <LongText className='max-w-24'>{nickname || '未设置'}</LongText>
        </div>
      )
    },
    meta: {
      className: cn(
        'drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:drop-shadow-[0_1px_2px_rgb(255_255_255_/_0.1)]',
        'ps-0.5 max-md:sticky start-6 @4xl/content:table-cell @4xl/content:drop-shadow-none'
      ),
    },
    enableHiding: false,
  },
  {
    accessorKey: 'phoneNumber',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='手机号' />
    ),
    cell: ({ row }) => (
      <div className='text-nowrap'>{row.getValue('phoneNumber') || '-'}</div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'gender',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='性别' />
    ),
    cell: ({ row }) => {
      const gender = row.getValue('gender') as keyof typeof genderLabels
      return <div>{genderLabels[gender] || '-'}</div>
    },
    enableSorting: false,
  },
  {
    accessorKey: 'membershipType',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='会员' />
    ),
    cell: ({ row }) => {
      const membershipType = row.original.membershipType
      const badgeColor = membershipStyles.get(membershipType)
      return (
        <Badge variant='outline' className={cn('capitalize', badgeColor)}>
          {membershipType === 'pro' ? 'Pro' : '免费'}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    enableSorting: false,
  },
  {
    id: 'reliability',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='履约率' />
    ),
    cell: ({ row }) => {
      const { participationCount, fulfillmentCount } = row.original
      const rate = participationCount > 0
        ? Math.round((fulfillmentCount / participationCount) * 100)
        : 0
      return (
        <div className='text-nowrap'>
          {rate}% ({fulfillmentCount}/{participationCount})
        </div>
      )
    },
    enableSorting: false,
  },
  {
    accessorKey: 'isBlocked',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='状态' />
    ),
    cell: ({ row }) => {
      const isBlocked = row.original.isBlocked
      const status = isBlocked ? 'blocked' : 'active'
      const badgeColor = statusStyles.get(status)
      return (
        <Badge variant='outline' className={cn('capitalize', badgeColor)}>
          {isBlocked ? '封禁' : '正常'}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      const isBlocked = row.original.isBlocked
      const status = isBlocked ? 'blocked' : 'active'
      return value.includes(status)
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='注册时间' />
    ),
    cell: ({ row }) => {
      const createdAt = row.getValue('createdAt') as string
      return (
        <div className='text-nowrap text-muted-foreground'>
          {format(new Date(createdAt), 'yyyy-MM-dd')}
        </div>
      )
    },
  },
  {
    id: 'actions',
    cell: DataTableRowActions,
  },
]
