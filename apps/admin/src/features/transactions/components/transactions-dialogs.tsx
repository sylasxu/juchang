import { TransactionsImportDialog } from './transactions-import-dialog'
import { TransactionsMutateDrawer } from './transactions-mutate-drawer'
import { useTransactions } from './transactions-provider'

export function TransactionsDialogs() {
  const { open } = useTransactions()

  return (
    <>
      <TransactionsMutateDrawer />
      {open === 'import' && <TransactionsImportDialog />}
    </>
  )
}