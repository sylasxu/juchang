import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { QuotaManagement } from '@/features/ai-ops/quota'

const searchSchema = z.object({
  page: z.number().optional(),
  pageSize: z.number().optional(),
  filter: z.string().optional(),
  status: z.array(z.string()).optional(),
})

export const Route = createFileRoute('/_authenticated/ai-ops/quota')({
  component: QuotaManagement,
  validateSearch: searchSchema,
})
