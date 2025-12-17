import { type Table } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, ArrowUp } from 'lucide-react'
import { useBulkModerationAction } from '@/hooks/use-moderation'
import { useModerationContext } from './moderation-provider'
import type { ModerationQueueItem } from '@/hooks/use-moderation'

interface ModerationBulkActionsProps {
  table: Table<ModerationQueueItem>
}

export function ModerationBulkActions({ table }: ModerationBulkActionsProps) {
  const { selectedItems, setSelectedItems } = useModerationContext()
  const bulkModerationAction = useBulkModerationAction()

  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedCount = selectedRows.length

  if (selectedCount === 0) {
    return null
  }

  const handleBulkAction = (action: 'approve' | 'reject') => {
    const itemIds = selectedRows.map(row => row.original.id)
    
    bulkModerationAction.mutate({
      itemIds,
      action: {
        action,
        reason: action === 'approve' ? '批量批准' : '批量拒绝'
      }
    }, {
      onSuccess: () => {
        table.resetRowSelection()
        setSelectedItems([])
      }
    })
  }

  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg border bg-background p-4 shadow-lg">
      <span className="text-sm font-medium">
        已选择 {selectedCount} 个项目
      </span>
      
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleBulkAction('approve')}
          disabled={bulkModerationAction.isPending}
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          批量批准
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleBulkAction('reject')}
          disabled={bulkModerationAction.isPending}
        >
          <XCircle className="h-4 w-4 mr-2" />
          批量拒绝
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            table.resetRowSelection()
            setSelectedItems([])
          }}
        >
          取消选择
        </Button>
      </div>
    </div>
  )
}