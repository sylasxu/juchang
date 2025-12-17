import { type ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DataTableColumnHeader } from '@/components/data-table'
import { statuses, membershipTypes } from '../data/data'
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
    accessorKey: 'id',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='ID' />
    ),
    cell: ({ row }) => <div className='w-[80px] font-mono text-xs'>{row.getValue('id')}</div>,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'nickname',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='用户信息' />
    ),
    meta: { className: 'ps-1', tdClassName: 'ps-4' },
    cell: ({ row }) => {
      const user = row.original
      const membershipType = membershipTypes.find(
        (type) => type.value === user.membershipType
      )

      return (
        <div className='flex items-center space-x-3'>
          <Avatar className='h-8 w-8'>
            <AvatarImage src={user.avatarUrl} alt={user.nickname} />
            <AvatarFallback>{user.nickname.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className='flex flex-col'>
            <div className='flex items-center space-x-2'>
              <span className='font-medium'>{user.nickname}</span>
              {membershipType && (
                <Badge variant={user.membershipType === 'pro' ? 'default' : 'secondary'}>
                  {membershipType.label}
                </Badge>
              )}
              {user.isRealNameVerified && (
                <Badge variant='outline' className='text-green-600'>
                  已认证
                </Badge>
              )}
            </div>
            {user.phoneNumber && (
              <span className='text-xs text-muted-foreground'>{user.phoneNumber}</span>
            )}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='状态' />
    ),
    meta: { className: 'ps-1', tdClassName: 'ps-4' },
    cell: ({ row }) => {
      const status = statuses.find(
        (status) => status.value === row.getValue('status')
      )

      if (!status) {
        return null
      }

      return (
        <div className='flex w-[100px] items-center gap-2'>
          {status.icon && (
            <status.icon className='text-muted-foreground size-4' />
          )}
          <span>{status.label}</span>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: 'membershipType',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='会员类型' />
    ),
    meta: { className: 'ps-1', tdClassName: 'ps-3' },
    cell: ({ row }) => {
      const membershipType = membershipTypes.find(
        (type) => type.value === row.getValue('membershipType')
      )

      if (!membershipType) {
        return null
      }

      return (
        <Badge variant={row.getValue('membershipType') === 'pro' ? 'default' : 'secondary'}>
          {membershipType.label}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='注册时间' />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue('createdAt'))
      return (
        <div className='text-sm'>
          {date.toLocaleDateString('zh-CN')}
        </div>
      )
    },
  },
  {
    accessorKey: 'lastActiveAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='最后活跃' />
    ),
    cell: ({ row }) => {
      const lastActiveAt = row.getValue('lastActiveAt') as string | undefined
      if (!lastActiveAt) {
        return <span className='text-muted-foreground text-sm'>从未活跃</span>
      }
      const date = new Date(lastActiveAt)
      return (
        <div className='text-sm'>
          {date.toLocaleDateString('zh-CN')}
        </div>
      )
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
]