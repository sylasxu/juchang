import { useState } from 'react'
import { type Table } from '@tanstack/react-table'
import { Trash2, Ban, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { DataTableBulkActions as BulkActionsToolbar } from '@/components/data-table'
import { blockUser, unblockUser } from '../data/users'
import { useQueryClient } from '@tanstack/react-query'
import { userKeys } from '../hooks/use-users'
import { type User } from '../data/schema'
import { UsersMultiDeleteDialog } from './users-multi-delete-dialog'

type DataTableBulkActionsProps<TData> = {
  table: Table<TData>
}

export function DataTableBulkActions<TData>({
  table,
}: DataTableBulkActionsProps<TData>) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const queryClient = useQueryClient()
  const selectedRows = table.getFilteredSelectedRowModel().rows

  const handleBulkBlock = async () => {
    const selectedUsers = selectedRows.map((row) => row.original as User)
    const toBlock = selectedUsers.filter((u) => !u.isBlocked)

    if (toBlock.length === 0) {
      toast.info('所选用户已全部封禁')
      return
    }

    toast.promise(
      Promise.all(toBlock.map((u) => blockUser(u.id))),
      {
        loading: '正在封禁用户...',
        success: () => {
          queryClient.invalidateQueries({ queryKey: userKeys.all })
          table.resetRowSelection()
          return `已封禁 ${toBlock.length} 个用户`
        },
        error: '封禁用户失败',
      }
    )
  }

  const handleBulkUnblock = async () => {
    const selectedUsers = selectedRows.map((row) => row.original as User)
    const toUnblock = selectedUsers.filter((u) => u.isBlocked)

    if (toUnblock.length === 0) {
      toast.info('所选用户均未被封禁')
      return
    }

    toast.promise(
      Promise.all(toUnblock.map((u) => unblockUser(u.id))),
      {
        loading: '正在解封用户...',
        success: () => {
          queryClient.invalidateQueries({ queryKey: userKeys.all })
          table.resetRowSelection()
          return `已解封 ${toUnblock.length} 个用户`
        },
        error: '解封用户失败',
      }
    )
  }

  return (
    <>
      <BulkActionsToolbar table={table} entityName='用户'>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='outline'
              size='icon'
              onClick={handleBulkUnblock}
              className='size-8'
              aria-label='解封所选用户'
            >
              <CheckCircle />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>解封所选用户</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='outline'
              size='icon'
              onClick={handleBulkBlock}
              className='size-8'
              aria-label='封禁所选用户'
            >
              <Ban />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>封禁所选用户</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='destructive'
              size='icon'
              onClick={() => setShowDeleteConfirm(true)}
              className='size-8'
              aria-label='删除所选用户'
            >
              <Trash2 />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>删除所选用户</p>
          </TooltipContent>
        </Tooltip>
      </BulkActionsToolbar>

      <UsersMultiDeleteDialog
        table={table}
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
      />
    </>
  )
}
