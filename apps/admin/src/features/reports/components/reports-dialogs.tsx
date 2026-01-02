import { useState, useEffect } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import { useListContext } from '@/components/list-page'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { type Report, useUpdateReport } from '@/hooks/use-reports'
import {
  type ReportDialogType,
  REPORT_TYPES,
  REPORT_REASONS,
  REPORT_STATUSES,
} from './reports-columns'

export function ReportsDialogs() {
  const { open, setOpen, currentRow } = useListContext<Report, ReportDialogType>()
  const [adminNote, setAdminNote] = useState('')
  const updateReport = useUpdateReport()

  // 当 currentRow 变化时重置 adminNote
  useEffect(() => {
    if (currentRow) {
      setAdminNote(currentRow.adminNote || '')
    }
  }, [currentRow])

  const handleClose = () => {
    setOpen(null)
    setAdminNote('')
  }

  const handleResolve = (status: 'resolved' | 'ignored') => {
    if (!currentRow) return
    updateReport.mutate(
      { id: currentRow.id, status, adminNote: adminNote || undefined },
      { onSuccess: handleClose }
    )
  }

  if (!currentRow) return null

  return (
    <>
      {/* 查看详情弹窗 */}
      <Dialog open={open === 'view'} onOpenChange={(isOpen) => !isOpen && handleClose()}>
        <DialogContent className='max-w-lg'>
          <DialogHeader>
            <DialogTitle>举报详情</DialogTitle>
            <DialogDescription>
              {REPORT_TYPES[currentRow.type] || currentRow.type} ·{' '}
              {REPORT_REASONS[currentRow.reason] || currentRow.reason}
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            <div>
              <Label className='text-muted-foreground'>被举报内容</Label>
              <div className='mt-1 rounded-lg border bg-muted/50 p-3 text-sm'>
                {currentRow.targetContent}
              </div>
            </div>

            {currentRow.description && (
              <div>
                <Label className='text-muted-foreground'>举报说明</Label>
                <div className='mt-1 text-sm'>{currentRow.description}</div>
              </div>
            )}

            <div>
              <Label htmlFor='adminNote'>处理备注</Label>
              <Textarea
                id='adminNote'
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder='输入处理备注（可选）'
                className='mt-1'
                disabled={currentRow.status !== 'pending'}
              />
            </div>

            <div className='flex gap-4 text-sm'>
              <div>
                <span className='text-muted-foreground'>当前状态：</span>
                <Badge variant={REPORT_STATUSES[currentRow.status]?.variant || 'outline'}>
                  {REPORT_STATUSES[currentRow.status]?.label || currentRow.status}
                </Badge>
              </div>
              <div>
                <span className='text-muted-foreground'>举报时间：</span>
                {new Date(currentRow.createdAt).toLocaleString('zh-CN')}
              </div>
            </div>
          </div>

          {currentRow.status === 'pending' && (
            <DialogFooter className='gap-2 sm:gap-0'>
              <Button
                variant='outline'
                onClick={() => handleResolve('ignored')}
                disabled={updateReport.isPending}
              >
                <XCircle className='mr-2 h-4 w-4' />
                忽略
              </Button>
              <Button
                onClick={() => handleResolve('resolved')}
                disabled={updateReport.isPending}
              >
                <CheckCircle className='mr-2 h-4 w-4' />
                处理完成
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* 处理完成确认弹窗 */}
      <Dialog open={open === 'resolve'} onOpenChange={(isOpen) => !isOpen && handleClose()}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>确认处理</DialogTitle>
            <DialogDescription>
              将此举报标记为已处理
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            <div>
              <Label htmlFor='resolveNote'>处理备注（可选）</Label>
              <Textarea
                id='resolveNote'
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder='输入处理备注'
                className='mt-1'
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={handleClose}>
              取消
            </Button>
            <Button
              onClick={() => handleResolve('resolved')}
              disabled={updateReport.isPending}
            >
              <CheckCircle className='mr-2 h-4 w-4' />
              确认处理
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 忽略确认弹窗 */}
      <Dialog open={open === 'ignore'} onOpenChange={(isOpen) => !isOpen && handleClose()}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>确认忽略</DialogTitle>
            <DialogDescription>
              将此举报标记为已忽略
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            <div>
              <Label htmlFor='ignoreNote'>忽略原因（可选）</Label>
              <Textarea
                id='ignoreNote'
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder='输入忽略原因'
                className='mt-1'
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={handleClose}>
              取消
            </Button>
            <Button
              variant='secondary'
              onClick={() => handleResolve('ignored')}
              disabled={updateReport.isPending}
            >
              <XCircle className='mr-2 h-4 w-4' />
              确认忽略
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
