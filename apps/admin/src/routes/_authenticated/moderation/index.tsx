import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { ModerationQueue } from '@/features/moderation'

const moderationSearchSchema = z.object({
  page: z.number().min(1).optional().default(1),
  pageSize: z.number().min(1).max(100).optional().default(10),
  type: z.array(z.enum(['user', 'activity', 'message', 'report'])).optional(),
  status: z.array(z.enum(['pending', 'in_review', 'approved', 'rejected', 'escalated'])).optional(),
  priority: z.array(z.enum(['low', 'medium', 'high', 'urgent'])).optional(),
  assignedTo: z.string().optional(),
  riskScoreMin: z.number().min(0).max(100).optional(),
  riskScoreMax: z.number().min(0).max(100).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.string().optional().default('reportedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

export const Route = createFileRoute('/_authenticated/moderation/')({
  validateSearch: moderationSearchSchema,
  component: ModerationQueue,
})