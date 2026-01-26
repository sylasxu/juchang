import { type Table } from '@tanstack/react-table'
import { Power, PowerOff, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { type GlobalKeyword } from '../data/schema'
import { useBatchUpdateStatus, useBatchDeleteHotKeywords } from '../hooks/use-hot-keywords'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/confirm-dialog'

interface HotKeywordsBulkActionsProps {
  table: Table<GlobalKeyword>
}

export function HotKeywordsBulkActions({ table }: HotKeywordsBulkActionsProps) {
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedIds = selectedRows.map(row => row.original.id)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showEnableConfirm, setShowEnableConfirm] = useState(false)
  const [showDisableConfirm, setShowDisableConfirm] = useState(false)

  const batchUpdateStatus = useBatchUpdateStatus()
  const batchDelete = useBatchDeleteHotKeywords()

  if (selectedIds.length === 0) return null

  const handleBatchEnable = async () => {
    await batchUpdateStatus.mutateAsync({ ids: selectedIds, isActive: true })
    table.resetRowSelection()
    setShowEnableConfirm(false)
  }

  const handleBatchDisable = async () => {
    await batchUpdateStatus.mutateAsync({ ids: selectedIds, isActive: false })
    table.resetRowSelection()
    setShowDisableConfirm(false)
  }

  const handleBatchDelete = async () => {
    await batchDelete.mutateAsync(selectedIds)
    table.resetRowSelection()
    setShowDeleteConfirm(false)
  }

  return (
    <>
      <div className='flex items-center gap-2'>
        <span className='text-sm text-muted-foreground'>
          已选择 {selectedIds.length} 项
        </span>
        <Button
          variant='outline'
          size='sm'
          onClick={() => setShowEnableConfirm(true)}
        >
          <Power className='mr-2 h-4 w-4' />
          批量启用
        </Button>
        <Button
          variant='outline'
          size='sm'
          onClick={() => setShowDisableConfirm(true)}
        >
          <PowerOff className='mr-2 h-4 w-4' />
          批量停用
        </Button>
        <Button
          variant='destructive'
          size='sm'
          onClick={() => setShowDeleteConfirm(true)}
        >
          <Trash2 className='mr-2 h-4 w-4' />
          批量删除
        </Button>
      </div>

      <ConfirmDialog
        open={showEnableConfirm}
        onOpenChange={setShowEnableConfirm}
        title='批量启用热词'
        desc={`确定要启用选中的 ${selectedIds.length} 个热词吗？`}
        confirmText='启用'
        handleConfirm={handleBatchEnable}
      />

      <ConfirmDialog
        open={showDisableConfirm}
        onOpenChange={setShowDisableConfirm}
        title='批量停用热词'
        desc={`确定要停用选中的 ${selectedIds.length} 个热词吗？`}
        confirmText='停用'
        handleConfirm={handleBatchDisable}
      />

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title='批量删除热词'
        desc={`确定要删除选中的 ${selectedIds.length} 个热词吗？此操作将软删除这些热词，保留统计数据。`}
        confirmText='删除'
        handleConfirm={handleBatchDelete}
        destructive={true}
      />
    </>
  )
}
