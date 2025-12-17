import { type ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { statuses, contentTypes } from '../data/data'
import { type Content } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'

export const contentColumns: ColumnDef<Content>[] = [
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
      <DataTableColumnHeader column={column} title='内容信息' />
    ),
    meta: { className: 'ps-1', tdClassName: 'ps-4' },
    cell: ({ row }) => {
      const content = row.original
      const contentType = contentTypes.find(
        (type) => type.value === content.type
      )

      return (
        <div className='flex flex-col space-y-1'>
          <div className='flex items-center space-x-2'>
            <span className='font-medium max-w-48 truncate'>{content.title}</span>
            {contentType && (
              <Badge variant='outline'>{contentType.label}</Badge>
            )}
          </div>
          {content.url && (
            <div className='text-xs text-muted-foreground'>
              {content.url}
            </div>
          )}
          {content.content && (
            <div className='text-xs text-muted-foreground max-w-64 truncate'>
              {content.content}
            </div>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: 'type',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='类型' />
    ),
    cell: ({ row }) => {
      const contentType = contentTypes.find(
        (type) => type.value === row.getValue('type')
      )

      return contentType ? (
        <Badge variant='secondary'>{contentType.label}</Badge>
      ) : null
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
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

      const getStatusVariant = (statusValue: string) => {
        switch (statusValue) {
          case 'published':
            return 'default'
          case 'draft':
            return 'secondary'
          case 'pending':
            return 'outline'
          case 'archived':
            return 'destructive'
          default:
            return 'secondary'
        }
      }

      return (
        <div className='flex w-[100px] items-center gap-2'>
          {status.icon && (
            <status.icon className='text-muted-foreground size-4' />
          )}
          <Badge variant={getStatusVariant(status.value)}>
            {status.label}
          </Badge>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: 'order',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='排序' />
    ),
    cell: ({ row }) => {
      return (
        <div className='text-center w-16'>
          {row.getValue('order')}
        </div>
      )
    },
  },
  {
    accessorKey: 'updatedAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='更新时间' />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue('updatedAt'))
      return (
        <div className='text-sm'>
          {date.toLocaleDateString('zh-CN')}
        </div>
      )
    },
  },
  {
    accessorKey: 'publishedAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='发布时间' />
    ),
    cell: ({ row }) => {
      const publishedAt = row.getValue('publishedAt') as string | undefined
      if (!publishedAt) {
        return <span className='text-muted-foreground text-sm'>未发布</span>
      }
      const date = new Date(publishedAt)
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