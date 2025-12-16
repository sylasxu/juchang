import { createFileRoute } from '@tanstack/react-router'
import { ActivityListPage } from '@/features/activities/activity-list-page'

export const Route = createFileRoute('/_authenticated/activities/')({
  component: ActivityListPage,
})