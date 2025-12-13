'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { useDeleteUser } from '../hooks/use-users'
import { type User } from '../data/schema'

type UserDeleteDialogProps = {
  open: boolean
  onOpenChange: () => void
  currentRow: User
}

export function UsersDeleteDialog({
  open,
  onOpenChange,
  currentRow,
}: UserDeleteDialogProps) {
  const [value, setValue] = useState('')
  const deleteMutation = useDeleteUser()
  const displayName = currentRow.nickname || currentRow.phoneNumber || '未知用户'

  const handleDelete = async () => {
    if (value.trim() !== 'DELETE') return

    await deleteMutation.mutateAsync(currentRow.id)
    setValue('')
    onOpenChange()
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleDelete}
      disabled={value.trim() !== 'DELETE' || deleteMutation.isPending}
      title={
        <span className='text-destructive'>
          <AlertTriangle
            className='stroke-destructive me-1 inline-block'
            size={18}
          />{' '}
          删除用户
        </span>
      }
      desc={
        <div className='space-y-4'>
          <p className='mb-2'>
            确定要删除用户 <span className='font-bold'>{displayName}</span> 吗？
            <br />
            此操作将永久删除该用户的所有数据，且无法恢复。
          </p>

          <Label className='my-2'>
            请输入 DELETE 确认删除:
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder='输入 DELETE 确认'
            />
          </Label>

          <Alert variant='destructive'>
            <AlertTitle>警告！</AlertTitle>
            <AlertDescription>
              此操作不可逆，请谨慎操作。
            </AlertDescription>
          </Alert>
        </div>
      }
      confirmText={deleteMutation.isPending ? '删除中...' : '确认删除'}
      destructive
    />
  )
}
