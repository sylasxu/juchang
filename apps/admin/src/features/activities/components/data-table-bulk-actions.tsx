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
import { type Activity } from '../data/schema'
import { ActivitiesMultiDeleteDialog } from './activities-multi-delete-dialog'

type DataTableBulkActionsProps<TData> = {
  table: Table<TData>
}

export function DataTableBulkActions<TData>({
  table,
}: DataTableBulkActionsProps<TData>) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const selectedRows = table.getFilteredSelectedRowModel().rows

  const handleBulkStatusChange = (status: string) => {
    const selectedActivities = selectedRows.map((row) => row.original as Activity)
    toast.promise(sleep(2000), {
      loading: '更新状态中...',
      success: () => {
        table.resetRowSelection()
        return `已将 ${selectedActivities.length} 个活动的状态更新为"${statuses.find(s => s.value === status)?.label}"`
      },
      error: '操作失败',
    })
  }

  const handleBulkExport = () => {
    const selectedActivities = selectedRows.map((row) => row.original as Activity)
    toast.promise(sleep(2000), {
      loading: '导出活动数据中...',
      success: () => {
        table.resetRowSelection()
        return `已导出 ${selectedActivities.length} 个活动数据到 CSV`
      },
      error: '导出失败',
    })
  }

  return (
    <>
      <BulkActionsToolbar table={table} entityName='活动'>
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
              aria-label='导出活动'
              title='导出活动'
            >
              <Download />
              <span className='sr-only'>导出活动</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>导出活动</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='destructive'
              size='icon'
              onClick={() => setShowDeleteConfirm(true)}
              className='size-8'
              aria-label='删除选中活动'
              title='删除选中活动'
            >
              <Trash2 />
              <span className='sr-only'>删除选中活动</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>删除选中活动</p>
          </TooltipContent>
        </Tooltip>
      </BulkActionsToolbar>

      <ActivitiesMultiDeleteDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        table={table}
      />
    </>
  )
}