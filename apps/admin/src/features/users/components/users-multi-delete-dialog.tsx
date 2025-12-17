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
import { type User } from '../data/schema'

type UsersMultiDeleteDialogProps<TData> = {
  open: boolean
  onOpenChange: (open: boolean) => void
  table: Table<TData>
}

export function UsersMultiDeleteDialog<TData>({
  open,
  onOpenChange,
  table,
}: UsersMultiDeleteDialogProps<TData>) {
  const [isDeleting, setIsDeleting] = useState(false)
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedUsers = selectedRows.map((row) => row.original as User)

  const handleDelete = async () => {
    setIsDeleting(true)
    
    try {
      await sleep(2000) // 模拟 API 调用
      
      toast.success(`已删除 ${selectedUsers.length} 个用户`)
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
            您确定要删除选中的 {selectedUsers.length} 个用户吗？此操作无法撤销。
          </DialogDescription>
        </DialogHeader>
        <div className='py-4'>
          <div className='space-y-2'>
            {selectedUsers.slice(0, 5).map((user) => (
              <div key={user.id} className='flex items-center space-x-2 text-sm'>
                <span className='font-medium'>{user.nickname}</span>
                <span className='text-muted-foreground'>({user.id})</span>
              </div>
            ))}
            {selectedUsers.length > 5 && (
              <div className='text-sm text-muted-foreground'>
                还有 {selectedUsers.length - 5} 个用户...
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