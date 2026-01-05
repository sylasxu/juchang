import { type ColumnDef } from '@tanstack/react-table'
import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { Eye, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import type { ConversationSession } from '@/hooks/use-conversations'

// 弹窗类型
export type ConversationDialogType = 'view' | 'delete' | 'batch-delete'

// 行操作组件
function SessionRowActions({ session }: { session: ConversationSession }) {
  const { setOpen, setCurrentRow } = useListContext<ConversationSession, ConversationDialogType>()

  const handleView = () => {
    setCurrentRow(session)
    setOpen('view')
  }

  const handleDelete = () => {
    setCurrentRow(session)
    setOpen('delete')
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
        <DropdownMenuItem onClick={handleView}>
          查看对话
          <DropdownMenuShortcut>
            <Eye size={16} />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDelete} className='text-destructive focus:text-destructive'>
          删除
          <DropdownMenuShortcut>
            <Trash2 size={16} />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// 列定义
export const conversationsColumns: ColumnDef<ConversationSession>[] = [
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
    accessorKey: 'userNickname',
    header: ({ column }) => <DataTableColumnHeader column={column} title='用户' />,
    cell: ({ row }) => (
      <span className='font-medium'>{row.getValue('userNickname') || '匿名用户'}</span>
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'title',
    header: ({ column }) => <DataTableColumnHeader column={column} title='会话标题' />,
    cell: ({ row }) => (
      <div className='max-w-[200px] truncate text-sm'>
        {row.getValue('title') || '无标题'}
      </div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'messageCount',
    header: ({ column }) => <DataTableColumnHeader column={column} title='消息数' />,
    cell: ({ row }) => (
      <Badge variant='secondary'>{row.getValue('messageCount')}</Badge>
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'lastMessageAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title='最后活跃' />,
    cell: ({ row }) => (
      <div className='text-sm text-muted-foreground whitespace-nowrap'>
        {new Date(row.getValue('lastMessageAt') as string).toLocaleString('zh-CN')}
      </div>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title='创建时间' />,
    cell: ({ row }) => (
      <div className='text-sm text-muted-foreground whitespace-nowrap'>
        {new Date(row.getValue('createdAt') as string).toLocaleString('zh-CN')}
      </div>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => <SessionRowActions session={row.original} />,
  },
]
