import { useListContext } from '@/components/list-page'
import { ActivitiesMutateDrawer } from './activities-mutate-drawer'
import { ActivitiesDeleteDialog } from './activities-delete-dialog'
import { ActivityPromptDialog } from './activity-prompt-dialog'
import { ActivitiesCreateDialog } from './activities-create-dialog'
import { type Activity } from '../data/schema'
import { type ActivityDialogType } from './activities-columns'

export function ActivitiesDialogs() {
  const { open, setOpen, currentRow } = useListContext<Activity, ActivityDialogType>()

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