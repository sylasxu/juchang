import { createFileRoute } from '@tanstack/react-router'
import { ModerationQueue } from '@/features/ai-ops/security'

export const Route = createFileRoute('/_authenticated/ai-ops/security/moderation')({
  component: ModerationQueue,
})
