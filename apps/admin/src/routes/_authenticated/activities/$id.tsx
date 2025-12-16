import { createFileRoute } from '@tanstack/react-router'
import { ActivityDetailPage } from '@/features/activities/activity-detail-page'

export const Route = createFileRoute('/_authenticated/activities/$id')({
  component: ActivityDetailPage,
})