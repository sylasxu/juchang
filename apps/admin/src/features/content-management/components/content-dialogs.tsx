import { ContentImportDialog } from './content-import-dialog'
import { ContentMutateDrawer } from './content-mutate-drawer'
import { useContent } from './content-provider'

export function ContentDialogs() {
  const { open } = useContent()

  return (
    <>
      <ContentMutateDrawer />
      {open === 'import' && <ContentImportDialog />}
    </>
  )
}