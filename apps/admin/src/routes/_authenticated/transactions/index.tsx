import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Transactions } from '@/features/transactions'

const transactionsSearchSchema = z.object({
  page: z.number().min(1).optional().default(1),
  pageSize: z.number().min(1).max(100).optional().default(10),
  status: z.array(z.enum(['completed', 'pending', 'failed', 'cancelled'])).optional(),
  type: z.array(z.enum(['payment', 'refund', 'reward', 'withdrawal'])).optional(),
  method: z.array(z.enum(['wechat', 'alipay', 'balance', 'bank'])).optional(),
  filter: z.string().optional(),
})

export const Route = createFileRoute('/_authenticated/transactions/')({
  validateSearch: transactionsSearchSchema,
  component: Transactions,
})