import { useState } from 'react'
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
import { useTransactions } from './transactions-provider'

export function TransactionsImportDialog() {
  const { open, setOpen } = useTransactions()
  const [isImporting, setIsImporting] = useState(false)

  const handleImport = async () => {
    setIsImporting(true)
    
    try {
      await sleep(2000)
      toast.success('交易数据导入成功')
      setOpen(null)
    } catch (error) {
      toast.error('导入失败')
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <Dialog open={open === 'import'} onOpenChange={() => setOpen(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>导入交易</DialogTitle>
          <DialogDescription>
            从 CSV 文件导入交易数据
          </DialogDescription>
        </DialogHeader>
        <div className='py-4'>
          <div className='border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center'>
            <p className='text-muted-foreground'>点击或拖拽 CSV 文件到此处</p>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => setOpen(null)}
            disabled={isImporting}
          >
            取消
          </Button>
          <Button
            onClick={handleImport}
            disabled={isImporting}
          >
            {isImporting ? '导入中...' : '开始导入'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}