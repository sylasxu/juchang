import { createFileRoute } from '@tanstack/react-router'
import { HotKeywordForm } from '@/features/hot-keywords/components/hot-keyword-form'

export const Route = createFileRoute('/_authenticated/hot-keywords/create')({
  component: HotKeywordForm,
})
