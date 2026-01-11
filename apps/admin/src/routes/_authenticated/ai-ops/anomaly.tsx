import { createFileRoute } from '@tanstack/react-router'
import { AnomalyDetectionPage } from '@/features/ai-ops/anomaly'

export const Route = createFileRoute('/_authenticated/ai-ops/anomaly')({
  component: AnomalyDetectionPage,
})
