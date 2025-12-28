import { UsersImportDialog } from './users-import-dialog'
import { UsersMutateDrawer } from './users-mutate-drawer'
import { UsersDeleteDialog } from './users-delete-dialog'
import { useUsers } from './users-provider'

export function UsersDialogs() {
  const { open, setOpen, currentRow } = useUsers()

  return (
    <>
      <UsersMutateDrawer />
      {open === 'import' && <UsersImportDialog />}
      {open === 'delete' && currentRow && (
        <UsersDeleteDialog
          open={true}
          onOpenChange={() => setOpen(null)}
          currentRow={currentRow}
        />
      )}
    </>
  )
}