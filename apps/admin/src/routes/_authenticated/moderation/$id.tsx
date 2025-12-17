import { createFileRoute } from '@tanstack/react-router'
import { ModerationDecisionPage } from '@/features/moderation/components/moderation-decision-page'

export const Route = createFileRoute('/_authenticated/moderation/$id')({
  component: ModerationDecisionPage,
})