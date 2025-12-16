import { createFileRoute } from '@tanstack/react-router'
import { GhostActivityPage } from '@/features/activities/ghost-activity-page'

export const Route = createFileRoute('/_authenticated/activities/ghost')({
  component: GhostActivityPage,
})