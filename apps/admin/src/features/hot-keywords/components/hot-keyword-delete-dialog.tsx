import { useListContext } from '@/components/list-page'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { type GlobalKeyword } from '../data/schema'
import { type HotKeywordDialogType } from './hot-keywords-columns'
import { useDeleteHotKeyword } from '../hooks/use-hot-keywords'

export function HotKeywordDeleteDialog() {
  const { currentRow, setOpen } = useListContext<GlobalKeyword, HotKeywordDialogType>()
  const deleteMutation = useDeleteHotKeyword()

  if (!currentRow) return null

  return (
    <ConfirmDialog
      open={true}
      onOpenChange={(open) => !open && setOpen(null)}
      title='删除热词'
      desc={`确定要删除热词 "${currentRow.keyword}" 吗？此操作将软删除该热词，保留统计数据。`}
      confirmText='删除'
      handleConfirm={async () => {
        await deleteMutation.mutateAsync(currentRow.id)
        setOpen(null)
      }}
      destructive={true}
    />
  )
}
