import { UsersImportDialog } from './users-import-dialog'
import { UsersMutateDrawer } from './users-mutate-drawer'
import { useUsers } from './users-provider'

export function UsersDialogs() {
  const { open } = useUsers()

  return (
    <>
      <UsersMutateDrawer />
      {open === 'import' && <UsersImportDialog />}
    </>
  )
}