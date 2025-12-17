import { useDisputeContext } from './dispute-provider'
import { DisputeDetailDialog } from './dispute-detail-dialog'
import { DisputeResolutionDialog } from './dispute-resolution-dialog'
import { DisputeEscalationDialog } from './dispute-escalation-dialog'

export function DisputeDialogs() {
  const {
    detailDialogOpen,
    setDetailDialogOpen,
    resolutionDialogOpen,
    setResolutionDialogOpen,
    escalationDialogOpen,
    setEscalationDialogOpen,
    selectedDispute,
  } = useDisputeContext()

  return (
    <>
      {selectedDispute && (
        <>
          <DisputeDetailDialog
            open={detailDialogOpen}
            onOpenChange={setDetailDialogOpen}
            dispute={selectedDispute}
          />
          <DisputeResolutionDialog
            open={resolutionDialogOpen}
            onOpenChange={setResolutionDialogOpen}
            dispute={selectedDispute}
          />
          <DisputeEscalationDialog
            open={escalationDialogOpen}
            onOpenChange={setEscalationDialogOpen}
            dispute={selectedDispute}
          />
        </>
      )}
    </>
  )
}