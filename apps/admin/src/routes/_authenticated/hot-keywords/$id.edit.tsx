import { createFileRoute } from '@tanstack/react-router'
import { HotKeywordEdit } from '@/features/hot-keywords/components/hot-keyword-edit'

export const Route = createFileRoute('/_authenticated/hot-keywords/$id/edit')({
  component: HotKeywordEdit,
})
