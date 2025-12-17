import { createFileRoute } from '@tanstack/react-router'
import { PremiumServices } from '@/features/premium-services'

export const Route = createFileRoute('/_authenticated/premium/')({
  component: PremiumServices,
})