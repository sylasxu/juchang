import { useFraudContext } from './fraud-provider'
import { FraudDetailDialog } from './fraud-detail-dialog'
import { FraudConfirmDialog } from './fraud-confirm-dialog'

export function FraudDialogs() {
  const {
    detailDialogOpen,
    setDetailDialogOpen,
    confirmDialogOpen,
    setConfirmDialogOpen,
    selectedFraud,
  } = useFraudContext()

  return (
    <>
      {selectedFraud && (
        <>
          <FraudDetailDialog
            open={detailDialogOpen}
            onOpenChange={setDetailDialogOpen}
            fraud={selectedFraud}
          />
          <FraudConfirmDialog
            open={confirmDialogOpen}
            onOpenChange={setConfirmDialogOpen}
            fraud={selectedFraud}
          />
        </>
      )}
    </>
  )
}