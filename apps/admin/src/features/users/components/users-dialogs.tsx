import { useListContext } from '@/components/list-page'
import { type User } from '../data/schema'
import { type UserDialogType } from './users-columns'
import { UsersImportDialog } from './users-import-dialog'
import { UsersMutateDrawer } from './users-mutate-drawer'
import { UsersDeleteDialog } from './users-delete-dialog'

export function UsersDialogs() {
  const { open, setOpen, currentRow } = useListContext<User, UserDialogType>()

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
