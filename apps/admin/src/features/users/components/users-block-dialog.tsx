import { useState } from 'react'
import { Ban, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useBlockUser, useUnblockUser } from '../hooks/use-users'
import { type User } from '../data/schema'

interface Props {
  open: boolean
  onOpenChange: () => void
  currentRow: User
  action: 'block' | 'unblock'
}

export function UsersBlockDialog({ open, onOpenChange, currentRow, action }: Props) {
  const blockMutation = useBlockUser()
  const unblockMutation = useUnblockUser()
  const [isLoading, setIsLoading] = useState(false)

  const isBlock = action === 'block'
  const mutation = isBlock ? blockMutation : unblockMutation

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await mutation.mutateAsync(currentRow.id)
      onOpenChange()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            {isBlock ? (
              <>
                <Ban className='h-5 w-5 text-orange-500' />
                封禁用户
              </>
            ) : (
              <>
                <CheckCircle className='h-5 w-5 text-green-500' />
                解封用户
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isBlock
              ? `确定要封禁用户 "${currentRow.nickname || '未知用户'}" 吗？封禁后该用户将无法使用平台功能。`
              : `确定要解封用户 "${currentRow.nickname || '未知用户'}" 吗？解封后该用户可以正常使用平台。`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant='outline' onClick={onOpenChange} disabled={isLoading}>
            取消
          </Button>
          <Button
            variant={isBlock ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? '处理中...' : isBlock ? '确认封禁' : '确认解封'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
