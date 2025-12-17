import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { DisputeResolution } from '@/features/risk-management/components/dispute-resolution'

const disputeSearchSchema = z.object({
  page: z.number().min(1).optional().default(1),
  pageSize: z.number().min(1).max(100).optional().default(20),
  type: z.array(z.enum(['payment', 'activity', 'behavior', 'content'])).optional(),
  status: z.array(z.enum(['open', 'investigating', 'resolved', 'escalated', 'closed'])).optional(),
  priority: z.array(z.enum(['low', 'medium', 'high', 'urgent'])).optional(),
  assignedTo: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

export const Route = createFileRoute('/_authenticated/risk/disputes')({
  validateSearch: disputeSearchSchema,
  component: DisputeResolution,
})