import { useListContext } from '@/components/list-page'
import { type GlobalKeyword } from '../data/schema'
import { type HotKeywordDialogType } from './hot-keywords-columns'
import { HotKeywordDeleteDialog } from './hot-keyword-delete-dialog'
import { HotKeywordViewDialog } from './hot-keyword-view-dialog'

export function HotKeywordsDialogs() {
  const { open } = useListContext<GlobalKeyword, HotKeywordDialogType>()

  return (
    <>
      {open === 'delete' && <HotKeywordDeleteDialog />}
      {open === 'view' && <HotKeywordViewDialog />}
    </>
  )
}
