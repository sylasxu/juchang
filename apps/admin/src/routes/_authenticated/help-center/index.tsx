import { createFileRoute } from '@tanstack/react-router'
import { ContentManagement } from '@/features/content-management'

export const Route = createFileRoute('/_authenticated/help-center/')({
  component: ContentManagement,
})
