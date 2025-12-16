import { UsersActionDialog } from './users-action-dialog'
import { UsersDeleteDialog } from './users-delete-dialog'
import { UsersBlockDialog } from './users-block-dialog'
import { useUsersContext } from './users-provider'

export function UsersDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useUsersContext()

  const handleClose = () => {
    setOpen(null)
    setTimeout(() => {
      setCurrentRow(null)
    }, 500)
  }

  return (
    <>
      {currentRow && (
        <>
          <UsersActionDialog
            key={`user-edit-${currentRow.id}`}
            open={open === 'edit'}
            onOpenChange={handleClose}
            currentRow={currentRow}
          />

          <UsersDeleteDialog
            key={`user-delete-${currentRow.id}`}
            open={open === 'delete'}
            onOpenChange={handleClose}
            currentRow={currentRow}
          />

          <UsersBlockDialog
            key={`user-block-${currentRow.id}`}
            open={open === 'block'}
            onOpenChange={handleClose}
            currentRow={currentRow}
            action='block'
          />

          <UsersBlockDialog
            key={`user-unblock-${currentRow.id}`}
            open={open === 'unblock'}
            onOpenChange={handleClose}
            currentRow={currentRow}
            action='unblock'
          />
        </>
      )}
    </>
  )
}
