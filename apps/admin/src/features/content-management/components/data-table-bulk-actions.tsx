import { useState } from 'react'
import { type Table } from '@tanstack/react-table'
import { Trash2, CircleArrowUp, Download } from 'lucide-react'
import { toast } from 'sonner'
import { sleep } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { DataTableBulkActions as BulkActionsToolbar } from '@/components/data-table'
import { statuses } from '../data/data'
import { type Content } from '../data/schema'
import { ContentMultiDeleteDialog } from './content-multi-delete-dialog'

type DataTableBulkActionsProps<TData> = {
  table: Table<TData>
}

export function DataTableBulkActions<TData>({
  table,
}: DataTableBulkActionsProps<TData>) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const selectedRows = table.getFilteredSelectedRowModel().rows

  const handleBulkStatusChange = (status: string) => {
    const selectedContents = selectedRows.map((row) => row.original as Content)
    toast.promise(sleep(2000), {
      loading: '更新状态中...',
      success: () => {
        table.resetRowSelection()
        return `已将 ${selectedContents.length} 个内容的状态更新为"${statuses.find(s => s.value === status)?.label}"`
      },
      error: '操作失败',
    })
  }

  const handleBulkExport = () => {
    const selectedContents = selectedRows.map((row) => row.original as Content)
    toast.promise(sleep(2000), {
      loading: '导出内容数据中...',
      success: () => {
        table.resetRowSelection()
        return `已导出 ${selectedContents.length} 个内容数据到文件`
      },
      error: '导出失败',
    })
  }

  return (
    <>
      <BulkActionsToolbar table={table} entityName='内容'>
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='outline'
                  size='icon'
                  className='size-8'
                  aria-label='更新状态'
                  title='更新状态'
                >
                  <CircleArrowUp />
                  <span className='sr-only'>更新状态</span>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>更新状态</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent sideOffset={14}>
            {statuses.map((status) => (
              <DropdownMenuItem
                key={status.value}
                onClick={() => handleBulkStatusChange(status.value)}
              >
                {status.icon && (
                  <status.icon className='text-muted-foreground size-4' />
                )}
                {status.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='outline'
              size='icon'
              onClick={handleBulkExport}
              className='size-8'
              aria-label='导出内容'
              title='导出内容'
            >
              <Download />
              <span className='sr-only'>导出内容</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>导出内容</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='destructive'
              size='icon'
              onClick={() => setShowDeleteConfirm(true)}
              className='size-8'
              aria-label='删除选中内容'
              title='删除选中内容'
            >
              <Trash2 />
              <span className='sr-only'>删除选中内容</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>删除选中内容</p>
          </TooltipContent>
        </Tooltip>
      </BulkActionsToolbar>

      <ContentMultiDeleteDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        table={table}
      />
    </>
  )
}