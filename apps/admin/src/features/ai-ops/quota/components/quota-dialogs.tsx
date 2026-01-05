import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useListContext } from '@/components/list-page'
import {
  useSetUserQuota,
  useSetUserQuotaBatch,
  type UserQuota,
  DAILY_QUOTA_LIMIT,
} from '@/hooks/use-quota'
import { type QuotaDialogType } from './quota-columns'

export function QuotaDialogs() {
  const { open, setOpen, currentRow, selectedRows, setSelectedRows } = useListContext<UserQuota, QuotaDialogType>()
  const setUserQuota = useSetUserQuota()
  const setUserQuotaBatch = useSetUserQuotaBatch()

  const [quotaValue, setQuotaValue] = useState<string>('')
  const [batchQuotaType, setBatchQuotaType] = useState<'reset' | 'unlimited'>('reset')

  const handleEditSubmit = () => {
    if (!currentRow) return
    const quota = parseInt(quotaValue, 10)
    if (isNaN(quota) || quota < 0 || quota > 999) return

    setUserQuota.mutate(
      { userId: currentRow.id, quota },
      { onSuccess: () => setOpen(null) }
    )
  }

  const handleBatchSubmit = () => {
    if (!selectedRows || selectedRows.length === 0) return
    const userIds = selectedRows.map(row => row.id)
    const quota = batchQuotaType === 'unlimited' ? 999 : DAILY_QUOTA_LIMIT

    setUserQuotaBatch.mutate(
      { userIds, quota },
      {
        onSuccess: () => {
          setOpen(null)
          setSelectedRows?.([])
        },
      }
    )
  }

  return (
    <>
      {/* 单个用户额度调整 */}
      <Dialog open={open === 'edit'} onOpenChange={() => setOpen(null)}>
        <DialogContent className='sm:max-w-[400px]'>
          <DialogHeader>
            <DialogTitle>调整额度</DialogTitle>
            <DialogDescription>
              为「{currentRow?.nickname || '未设置昵称'}」设置新的 AI 创建额度
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid gap-2'>
              <Label htmlFor='quota'>新额度值</Label>
              <Input
                id='quota'
                type='number'
                min={0}
                max={999}
                placeholder={`当前: ${currentRow?.aiCreateQuotaToday ?? DAILY_QUOTA_LIMIT}`}
                value={quotaValue}
                onChange={(e) => setQuotaValue(e.target.value)}
              />
              <p className='text-xs text-muted-foreground'>
                设置为 999 表示无限额度（管理员）
              </p>
            </div>
            <div className='flex gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setQuotaValue(String(DAILY_QUOTA_LIMIT))}
              >
                重置为默认 ({DAILY_QUOTA_LIMIT})
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setQuotaValue('999')}
              >
                设为无限
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setOpen(null)}>
              取消
            </Button>
            <Button
              onClick={handleEditSubmit}
              disabled={setUserQuota.isPending || !quotaValue}
            >
              {setUserQuota.isPending ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 批量调整额度 */}
      <Dialog open={open === 'batch-edit'} onOpenChange={() => setOpen(null)}>
        <DialogContent className='sm:max-w-[400px]'>
          <DialogHeader>
            <DialogTitle>批量调整额度</DialogTitle>
            <DialogDescription>
              为选中的 {selectedRows?.length || 0} 个用户批量设置额度
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid gap-2'>
              <Label>额度类型</Label>
              <Select
                value={batchQuotaType}
                onValueChange={(v) => setBatchQuotaType(v as 'reset' | 'unlimited')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='reset'>
                    重置为默认 ({DAILY_QUOTA_LIMIT} 次/天)
                  </SelectItem>
                  <SelectItem value='unlimited'>
                    设为无限（管理员）
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setOpen(null)}>
              取消
            </Button>
            <Button
              onClick={handleBatchSubmit}
              disabled={setUserQuotaBatch.isPending}
            >
              {setUserQuotaBatch.isPending ? '更新中...' : '确认更新'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
