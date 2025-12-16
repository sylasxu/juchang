import { type Table } from '@tanstack/react-table'
import { Trash2, CircleArrowUp, Download, RotateCcw } from 'lucide-react'
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

// 交易状态选项
const statuses = [
  { label: '待支付', value: 'pending' },
  { label: '已支付', value: 'paid' },
  { label: '支付失败', value: 'failed' },
  { label: '已退款', value: 'refunded' },
]



type TransactionBulkActionsProps<TData> = {
  table: Table<TData>
}

export function TransactionBulkActions<TData>({
  table,
}: TransactionBulkActionsProps<TData>) {
  const selectedRows = table.getFilteredSelectedRowModel().rows

  const handleBulkStatusChange = (status: string) => {
    const selectedTransactions = selectedRows.map((row) => row.original)
    toast.promise(sleep(2000), {
      loading: '更新状态中...',
      success: () => {
        table.resetRowSelection()
        return `已将 ${selectedTransactions.length} 笔交易状态更新为"${statuses.find(s => s.value === status)?.label}"`
      },
      error: '更新失败',
    })
  }

  const handleBulkRefund = () => {
    const selectedTransactions = selectedRows.map((row) => row.original)
    toast.promise(sleep(2000), {
      loading: '处理退款中...',
      success: () => {
        table.resetRowSelection()
        return `已为 ${selectedTransactions.length} 笔交易处理退款`
      },
      error: '退款处理失败',
    })
  }

  const handleBulkExport = () => {
    const selectedTransactions = selectedRows.map((row) => row.original)
    toast.promise(sleep(2000), {
      loading: '导出交易记录中...',
      success: () => {
        table.resetRowSelection()
        return `已导出 ${selectedTransactions.length} 笔交易记录到 CSV`
      },
      error: '导出失败',
    })
  }

  const handleBulkDelete = () => {
    const selectedTransactions = selectedRows.map((row) => row.original)
    toast.promise(sleep(2000), {
      loading: '删除交易记录中...',
      success: () => {
        table.resetRowSelection()
        return `已删除 ${selectedTransactions.length} 笔交易记录`
      },
      error: '删除失败',
    })
  }

  return (
    <BulkActionsToolbar table={table} entityName='transaction'>
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
            onClick={handleBulkRefund}
            className='size-8'
            aria-label='批量退款'
            title='批量退款'
          >
            <RotateCcw />
            <span className='sr-only'>批量退款</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>批量退款</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='outline'
            size='icon'
            onClick={handleBulkExport}
            className='size-8'
            aria-label='导出交易记录'
            title='导出交易记录'
          >
            <Download />
            <span className='sr-only'>导出交易记录</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>导出交易记录</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='destructive'
            size='icon'
            onClick={handleBulkDelete}
            className='size-8'
            aria-label='删除选中交易'
            title='删除选中交易'
          >
            <Trash2 />
            <span className='sr-only'>删除选中交易</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>删除选中交易</p>
        </TooltipContent>
      </Tooltip>
    </BulkActionsToolbar>
  )
}