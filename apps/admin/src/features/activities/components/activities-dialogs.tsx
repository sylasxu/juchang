import { ActivitiesMutateDrawer } from './activities-mutate-drawer'
import { ActivitiesDeleteDialog } from './activities-delete-dialog'
import { ActivityPromptDialog } from './activity-prompt-dialog'
import { ActivitiesCreateDialog } from './activities-create-dialog'
import { useActivities } from './activities-provider'

export function ActivitiesDialogs() {
  const { open, setOpen, currentRow } = useActivities()

  return (
    <>
      <ActivitiesMutateDrawer />
      {open === 'create' && <ActivitiesCreateDialog />}
      {open === 'prompt' && <ActivityPromptDialog />}
      {open === 'delete' && currentRow && (
        <ActivitiesDeleteDialog
          open={true}
          onOpenChange={() => setOpen(null)}
          currentRow={currentRow}
        />
      )}
    </>
  )
}