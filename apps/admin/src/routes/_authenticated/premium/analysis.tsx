import { createFileRoute } from '@tanstack/react-router'
import { PremiumServicesAnalysis } from '@/features/premium-services/analysis'

export const Route = createFileRoute('/_authenticated/premium/analysis')({
  component: PremiumServicesAnalysis,
})