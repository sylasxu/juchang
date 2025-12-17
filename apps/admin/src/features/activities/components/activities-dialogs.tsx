import { ActivitiesImportDialog } from './activities-import-dialog'
import { ActivitiesMutateDrawer } from './activities-mutate-drawer'
import { useActivities } from './activities-provider'

export function ActivitiesDialogs() {
  const { open } = useActivities()

  return (
    <>
      <ActivitiesMutateDrawer />
      {open === 'import' && <ActivitiesImportDialog />}
    </>
  )
}