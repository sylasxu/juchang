import { useModerationContext } from './moderation-provider'
import { ModerationActionDialog } from './moderation-action-dialog'
import { ModerationDetailDialog } from './moderation-detail-dialog'
import { ModerationStatsDialog } from './moderation-stats-dialog'

export function ModerationDialogs() {
  const {
    actionDialogOpen,
    setActionDialogOpen,
    detailDialogOpen,
    setDetailDialogOpen,
    statsDialogOpen,
    setStatsDialogOpen,
    selectedItem,
  } = useModerationContext()

  return (
    <>
      {selectedItem && (
        <>
          <ModerationActionDialog
            open={actionDialogOpen}
            onOpenChange={setActionDialogOpen}
            item={selectedItem}
          />
          <ModerationDetailDialog
            open={detailDialogOpen}
            onOpenChange={setDetailDialogOpen}
            item={selectedItem}
          />
        </>
      )}
      
      <ModerationStatsDialog
        open={statsDialogOpen}
        onOpenChange={setStatsDialogOpen}
      />
    </>
  )
}