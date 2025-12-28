import { useState } from 'react'
import { Ban, CheckCircle, Shield, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { type User } from '../data/schema'

interface UserModerationActionsProps {
  user: User & { isBlocked?: boolean }
  onBlock: () => void
  onUnblock: () => void
  isLoading?: boolean
}

export function UserModerationActions({ 
  user, 
  onBlock, 
  onUnblock, 
  isLoading = false 
}: UserModerationActionsProps) {
  const [showBlockDialog, setShowBlockDialog] = useState(false)
  const [showUnblockDialog, setShowUnblockDialog] = useState(false)

  const handleBlock = () => {
    onBlock()
    setShowBlockDialog(false)
  }

  const handleUnblock = () => {
    onUnblock()
    setShowUnblockDialog(false)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='outline' size='sm' disabled={isLoading}>
            <Shield className='h-4 w-4 mr-2' />
            审核操作
            <MoreHorizontal className='h-4 w-4 ml-2' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-48'>
          {user.isBlocked ? (
            <DropdownMenuItem 
              onClick={() => setShowUnblockDialog(true)}
              className='text-green-600'
            >
              <CheckCircle className='h-4 w-4 mr-2' />
              解封用户
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem 
              onClick={() => setShowBlockDialog(true)}
              className='text-red-600'
            >
              <Ban className='h-4 w-4 mr-2' />
              封禁用户
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled>
            <Shield className='h-4 w-4 mr-2' />
            实名认证审核
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            <Shield className='h-4 w-4 mr-2' />
            风险等级调整
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 封禁确认对话框 */}
      <AlertDialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认封禁用户</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要封禁用户 "{user.nickname || user.id}" 吗？
              封禁后，该用户将无法登录和使用平台功能。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBlock}
              className='bg-red-600 hover:bg-red-700'
            >
              确认封禁
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 解封确认对话框 */}
      <AlertDialog open={showUnblockDialog} onOpenChange={setShowUnblockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认解封用户</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要解封用户 "{user.nickname || user.id}" 吗？
              解封后，该用户将恢复正常使用平台功能。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleUnblock}
              className='bg-green-600 hover:bg-green-700'
            >
              确认解封
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}