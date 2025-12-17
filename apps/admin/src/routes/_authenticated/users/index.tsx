import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Users } from '@/features/users'

const usersSearchSchema = z.object({
  page: z.number().min(1).optional().default(1),
  pageSize: z.number().min(1).max(100).optional().default(10),
  status: z.array(z.enum(['active', 'blocked', 'pending', 'unknown'])).optional(),
  membership: z.array(z.enum(['free', 'pro'])).optional(),
  filter: z.string().optional(),
})

export const Route = createFileRoute('/_authenticated/users/')({
  validateSearch: usersSearchSchema,
  component: Users,
})
