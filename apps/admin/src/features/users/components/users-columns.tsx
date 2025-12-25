import { type ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DataTableColumnHeader } from '@/components/data-table'
import { statuses } from '../data/data'
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
    cell: ({ row }) => <div className='w-[80px] font-mono text-xs'>{(row.getValue('id') as string).slice(0, 8)}...</div>,
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

      return (
        <div className='flex items-center space-x-3'>
          <Avatar className='h-8 w-8'>
            <AvatarImage src={user.avatarUrl || undefined} alt={user.nickname || '匿名'} />
            <AvatarFallback>{(user.nickname || '匿')[0]}</AvatarFallback>
          </Avatar>
          <div className='flex flex-col'>
            <div className='flex items-center space-x-2'>
              <span className='font-medium'>{user.nickname || '匿名搭子'}</span>
              {user.phoneNumber && (
                <Badge variant='outline' className='text-green-600'>
                  已绑定
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
    accessorKey: 'phoneNumber',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='手机号' />
    ),
    meta: { className: 'ps-1', tdClassName: 'ps-4' },
    cell: ({ row }) => {
      const phoneNumber = row.getValue('phoneNumber') as string | undefined
      return (
        <span className={phoneNumber ? '' : 'text-muted-foreground'}>
          {phoneNumber || '未绑定'}
        </span>
      )
    },
  },
  {
    accessorKey: 'activitiesCreatedCount',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='创建活动' />
    ),
    cell: ({ row }) => {
      const count = row.getValue('activitiesCreatedCount') as number
      return <span className='font-medium'>{count || 0}</span>
    },
  },
  {
    accessorKey: 'participationCount',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='参与活动' />
    ),
    cell: ({ row }) => {
      const count = row.getValue('participationCount') as number
      return <span className='font-medium'>{count || 0}</span>
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
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
]

// Suppress unused variable warning
void statuses
