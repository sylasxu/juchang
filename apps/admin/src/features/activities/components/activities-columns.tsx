import { type ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { statuses, categories } from '../data/data'
import { type Activity } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'

export const activitiesColumns: ColumnDef<Activity>[] = [
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
    accessorKey: 'title',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='活动信息' />
    ),
    meta: { className: 'ps-1', tdClassName: 'ps-4' },
    cell: ({ row }) => {
      const activity = row.original
      const category = categories.find(
        (cat) => cat.value === activity.category
      )

      return (
        <div className='flex flex-col space-y-1'>
          <div className='flex items-center space-x-2'>
            <span className='font-medium max-w-48 truncate'>{activity.title}</span>
            {category && (
              <Badge variant='outline'>{category.label}</Badge>
            )}
          </div>
          <div className='text-xs text-muted-foreground'>
            {activity.location}
          </div>
          {activity.description && (
            <div className='text-xs text-muted-foreground max-w-64 truncate'>
              {activity.description}
            </div>
          )}
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
    accessorKey: 'participants',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='参与人数' />
    ),
    cell: ({ row }) => {
      const activity = row.original
      const percentage = (activity.currentParticipants / activity.maxParticipants) * 100
      
      return (
        <div className='flex flex-col space-y-1'>
          <div className='text-sm'>
            {activity.currentParticipants}/{activity.maxParticipants}
          </div>
          <div className='w-16 bg-muted rounded-full h-1.5'>
            <div 
              className='bg-primary h-1.5 rounded-full transition-all'
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>
      )
    },
    enableSorting: false,
  },
  {
    accessorKey: 'startTime',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='开始时间' />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue('startTime'))
      return (
        <div className='text-sm'>
          {date.toLocaleDateString('zh-CN')} {date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
        </div>
      )
    },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='创建时间' />
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