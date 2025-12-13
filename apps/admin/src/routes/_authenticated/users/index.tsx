import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Users } from '@/features/users'

const usersSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(20),
  // Facet filters
  status: z
    .array(z.union([z.literal('active'), z.literal('blocked')]))
    .optional()
    .catch([]),
  membership: z
    .array(z.union([z.literal('free'), z.literal('pro')]))
    .optional()
    .catch([]),
  // Per-column text filter
  nickname: z.string().optional().catch(''),
})

export const Route = createFileRoute('/_authenticated/users/')({
  validateSearch: usersSearchSchema,
  component: Users,
})
