import { createFileRoute } from '@tanstack/react-router'
import { GeographyManagement } from '@/features/geography-management'

export const Route = createFileRoute('/_authenticated/geography')({
  component: GeographyManagement,
})