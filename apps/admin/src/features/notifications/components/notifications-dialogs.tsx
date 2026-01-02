import { useListContext } from '@/components/list-page'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { type Notification } from '@/hooks/use-notifications'
import {
  type NotificationDialogType,
  NOTIFICATION_TYPES,
} from './notifications-columns'

export function NotificationsDialogs() {
  const { open, setOpen, currentRow } =
    useListContext<Notification, NotificationDialogType>()

  const handleClose = () => {
    setOpen(null)
  }

  if (!currentRow) return null

  return (
    <Dialog open={open === 'view'} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className='max-w-lg'>
        <DialogHeader>
          <DialogTitle>{currentRow.title}</DialogTitle>
          <DialogDescription>
            {NOTIFICATION_TYPES[currentRow.type] || currentRow.type}
            {' · '}
            {new Date(currentRow.createdAt).toLocaleString('zh-CN')}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div>
            <Label className='text-muted-foreground'>内容</Label>
            <div className='mt-1 rounded-lg border bg-muted/50 p-3 text-sm'>
              {currentRow.content || '无内容'}
            </div>
          </div>

          <div className='flex gap-4 text-sm'>
            <div>
              <span className='text-muted-foreground'>状态：</span>
              {currentRow.isRead ? (
                <Badge variant='secondary'>已读</Badge>
              ) : (
                <Badge variant='outline'>未读</Badge>
              )}
            </div>
            {currentRow.activityId && (
              <div>
                <span className='text-muted-foreground'>关联活动：</span>
                <span className='font-mono text-xs'>
                  {currentRow.activityId.slice(0, 8)}...
                </span>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
