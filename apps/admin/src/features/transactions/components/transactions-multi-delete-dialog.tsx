import { useState } from 'react'
import { type Table } from '@tanstack/react-table'
import { toast } from 'sonner'
import { sleep } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { type Transaction } from '../data/schema'

type TransactionsMultiDeleteDialogProps<TData> = {
  open: boolean
  onOpenChange: (open: boolean) => void
  table: Table<TData>
}

export function TransactionsMultiDeleteDialog<TData>({
  open,
  onOpenChange,
  table,
}: TransactionsMultiDeleteDialogProps<TData>) {
  const [isDeleting, setIsDeleting] = useState(false)
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedTransactions = selectedRows.map((row) => row.original as Transaction)

  const handleDelete = async () => {
    setIsDeleting(true)
    
    try {
      await sleep(2000)
      toast.success(`已删除 ${selectedTransactions.length} 个交易记录`)
      table.resetRowSelection()
      onOpenChange(false)
    } catch (error) {
      toast.error('删除失败')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>确认删除</DialogTitle>
          <DialogDescription>
            您确定要删除选中的 {selectedTransactions.length} 个交易记录吗？此操作无法撤销。
          </DialogDescription>
        </DialogHeader>
        <div className='py-4'>
          <div className='space-y-2'>
            {selectedTransactions.slice(0, 5).map((transaction) => (
              <div key={transaction.id} className='flex items-center space-x-2 text-sm'>
                <span className='font-medium'>{transaction.id}</span>
                <span className='text-muted-foreground'>¥{transaction.amount.toFixed(2)}</span>
              </div>
            ))}
            {selectedTransactions.length > 5 && (
              <div className='text-sm text-muted-foreground'>
                还有 {selectedTransactions.length - 5} 个交易记录...
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            取消
          </Button>
          <Button
            variant='destructive'
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? '删除中...' : '确认删除'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}