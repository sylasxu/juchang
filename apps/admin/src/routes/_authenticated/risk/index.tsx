import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { RiskAssessment } from '@/features/risk-management'

const riskAssessmentSearchSchema = z.object({
  page: z.number().min(1).optional().default(1),
  pageSize: z.number().min(1).max(100).optional().default(20),
  targetType: z.array(z.enum(['user', 'activity', 'transaction'])).optional(),
  riskLevel: z.array(z.enum(['low', 'medium', 'high', 'critical'])).optional(),
  status: z.array(z.enum(['active', 'resolved', 'monitoring'])).optional(),
  assignedTo: z.string().optional(),
  riskScoreMin: z.number().min(0).max(100).optional(),
  riskScoreMax: z.number().min(0).max(100).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.string().optional().default('assessmentDate'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

export const Route = createFileRoute('/_authenticated/risk/')({
  validateSearch: riskAssessmentSearchSchema,
  component: RiskAssessment,
})