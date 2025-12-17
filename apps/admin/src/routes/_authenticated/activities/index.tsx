import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Activities } from '@/features/activities'

const activitiesSearchSchema = z.object({
  page: z.number().min(1).optional().default(1),
  pageSize: z.number().min(1).max(100).optional().default(10),
  status: z.array(z.enum(['active', 'completed', 'cancelled', 'draft'])).optional(),
  category: z.array(z.enum(['sports', 'food', 'entertainment', 'study', 'travel', 'other'])).optional(),
  filter: z.string().optional(),
})

export const Route = createFileRoute('/_authenticated/activities/')({
  validateSearch: activitiesSearchSchema,
  component: Activities,
})